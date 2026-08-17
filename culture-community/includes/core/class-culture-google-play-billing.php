<?php
/**
 * Google Play Billing — server-side purchase verification for the Moveee
 * Pro subscription bought via the Android app.
 *
 * A client-reported "purchase succeeded" is never trusted on its own — every
 * purchase token is verified against the Play Developer API before Pro is
 * granted. No Google API client library / Composer dependency: the OAuth2
 * service-account JWT is self-signed with openssl (RS256) and the API is
 * called via raw wp_remote_request(), same "raw HTTP, no SDK" convention as
 * class-culture-r2.php's hand-rolled AWS SigV4 signer.
 *
 * Mirrors class-culture-stripe.php's shape: a verify/grant method that
 * fires the same `culture_payment_completed` action every other payment
 * gateway fires, so receipt emails and analytics work unmodified.
 *
 * Known gap (documented, not silently missing): this only verifies at
 * purchase time. Renewals, cancellations, refunds, and grace-period/account-
 * hold transitions that happen later are NOT reflected automatically — that
 * requires Google Play Real-Time Developer Notifications (a Cloud Pub/Sub
 * subscription), which needs Google Cloud infrastructure set up by a human
 * with account access before any code here could consume it. Until that's
 * built, a cancelled-but-not-yet-expired subscription still shows as Pro
 * (correct — they paid through the period end), but a subscription that
 * lapses without the app ever calling this class again won't auto-downgrade.
 * See CLAUDE.md "Google Play Billing" for the full picture and setup steps.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Google_Play_Billing {

    const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    const API_BASE   = 'https://androidpublisher.googleapis.com/androidpublisher/v3';
    const SCOPE       = 'https://www.googleapis.com/auth/androidpublisher';

    /**
     * Whether the service account + package name are configured.
     *
     * @return bool
     */
    public static function is_configured() {
        return '' !== self::service_account_json() && '' !== self::package_name();
    }

    private static function service_account_json() {
        if ( defined( 'CULTURE_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON' ) && CULTURE_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ) {
            return CULTURE_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
        }
        return get_option( 'culture_google_play_service_account_json', '' );
    }

    private static function package_name() {
        if ( defined( 'CULTURE_GOOGLE_PLAY_PACKAGE_NAME' ) && CULTURE_GOOGLE_PLAY_PACKAGE_NAME ) {
            return CULTURE_GOOGLE_PLAY_PACKAGE_NAME;
        }
        return get_option( 'culture_google_play_package_name', 'com.moveee.connect' );
    }

    /**
     * Exchanges the service account for a short-lived OAuth2 access token.
     * Cached in a transient for its lifetime minus a 60s safety margin, so
     * a purchase-verification burst doesn't re-sign/re-request a token per
     * request.
     *
     * @return string|WP_Error
     */
    private static function get_access_token() {
        $cached = get_transient( 'culture_gplay_access_token' );
        if ( $cached ) {
            return $cached;
        }

        $creds = json_decode( self::service_account_json(), true );
        if ( ! $creds || empty( $creds['private_key'] ) || empty( $creds['client_email'] ) ) {
            return new WP_Error( 'gplay_not_configured', __( 'Google Play service account is not configured.', 'culture-community' ) );
        }

        $now    = time();
        $header = wp_json_encode( array( 'alg' => 'RS256', 'typ' => 'JWT' ) );
        $claims = wp_json_encode( array(
            'iss'   => $creds['client_email'],
            'scope' => self::SCOPE,
            'aud'   => self::TOKEN_URL,
            'iat'   => $now,
            'exp'   => $now + 3600,
        ) );

        $b64url = function ( $s ) {
            return rtrim( strtr( base64_encode( $s ), '+/', '-_' ), '=' );
        };
        $unsigned = $b64url( $header ) . '.' . $b64url( $claims );

        $signature = '';
        $signed    = openssl_sign( $unsigned, $signature, $creds['private_key'], 'sha256WithRSAEncryption' );
        if ( ! $signed ) {
            return new WP_Error( 'gplay_sign_failed', __( 'Failed to sign the Google Play service-account JWT.', 'culture-community' ) );
        }
        $jwt = $unsigned . '.' . $b64url( $signature );

        $response = wp_remote_post( self::TOKEN_URL, array(
            'body'    => array(
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ),
            'timeout' => 20,
        ) );
        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( empty( $body['access_token'] ) ) {
            return new WP_Error( 'gplay_token_failed', $body['error_description'] ?? __( 'Failed to obtain a Google access token.', 'culture-community' ) );
        }

        $ttl = max( 60, (int) ( $body['expires_in'] ?? 3600 ) - 60 );
        set_transient( 'culture_gplay_access_token', $body['access_token'], $ttl );

        return $body['access_token'];
    }

    /**
     * Verifies a subscription purchase token against the Play Developer API
     * and, if it's genuinely active, grants Moveee Pro.
     *
     * @param int    $user_id
     * @param string $product_id     The subscription SKU (e.g. moveee_pro_monthly).
     * @param string $purchase_token Opaque token from the client purchase.
     * @return true|WP_Error
     */
    public static function verify_and_grant( $user_id, $product_id, $purchase_token ) {
        if ( ! self::is_configured() ) {
            return new WP_Error( 'gplay_not_configured', __( 'Google Play Billing is not configured.', 'culture-community' ), array( 'status' => 500 ) );
        }
        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', __( 'Account not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        // Only the two configured Moveee Pro subscription IDs may grant Pro —
        // a valid purchase token for some other product under this package
        // (should one ever exist) must never be enough on its own.
        $allowed_products = array(
            get_option( 'culture_google_play_product_monthly', 'moveee_pro_monthly' ),
            get_option( 'culture_google_play_product_annual', 'moveee_pro_annual' ),
        );
        if ( ! in_array( $product_id, array_filter( $allowed_products ), true ) ) {
            return new WP_Error( 'gplay_unknown_product', __( 'Unrecognized subscription product.', 'culture-community' ), array( 'status' => 400 ) );
        }

        $token = self::get_access_token();
        if ( is_wp_error( $token ) ) {
            return $token;
        }

        $data = self::get_subscription_purchase( $product_id, $purchase_token, $token );
        if ( is_wp_error( $data ) ) {
            return $data;
        }

        // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred upgrade/downgrade.
        $payment_state = $data['paymentState'] ?? null;
        $expiry_ms     = (int) ( $data['expiryTimeMillis'] ?? 0 );
        $is_active     = $expiry_ms > ( time() * 1000 ) && in_array( $payment_state, array( 1, 2 ), true );

        if ( ! $is_active ) {
            return new WP_Error( 'gplay_inactive', __( 'This subscription is not currently active.', 'culture-community' ), array( 'status' => 402 ) );
        }

        // Google auto-refunds an unacknowledged purchase after 3 days —
        // acknowledge it now if we haven't already (acknowledgementState: 0 = not ack'd, 1 = ack'd).
        if ( empty( $data['acknowledgementState'] ) ) {
            self::acknowledge_purchase( $product_id, $purchase_token, $token );
        }

        update_user_meta( $user_id, '_culture_membership_tier', 'patron' );
        update_user_meta( $user_id, '_culture_google_play_product_id', $product_id );
        update_user_meta( $user_id, '_culture_google_play_purchase_token', $purchase_token );
        update_user_meta( $user_id, '_culture_google_play_order_id', $data['orderId'] ?? '' );
        update_user_meta( $user_id, '_culture_google_play_expiry_ms', $expiry_ms );
        update_user_meta( $user_id, '_culture_subscription_status', 'active' );

        // priceAmountMicros is major-currency-units * 1,000,000; the receipt
        // email (send_payment_receipt) expects "amount" as minor units
        // (cents) and divides by 100 itself, so: micros / 1e6 * 100 = micros / 1e4.
        $amount_cents = isset( $data['priceAmountMicros'] ) ? (int) round( $data['priceAmountMicros'] / 10000 ) : 0;

        do_action( 'culture_payment_completed', $user_id, array(
            'gateway'   => 'google_play',
            'amount'    => $amount_cents,
            'currency'  => $data['priceCurrencyCode'] ?? '',
            'reference' => $data['orderId'] ?? '',
        ) );

        return true;
    }

    /**
     * @return array|WP_Error Decoded SubscriptionPurchase resource.
     */
    private static function get_subscription_purchase( $product_id, $purchase_token, $access_token ) {
        $url = sprintf(
            '%s/applications/%s/purchases/subscriptions/%s/tokens/%s',
            self::API_BASE,
            rawurlencode( self::package_name() ),
            rawurlencode( $product_id ),
            rawurlencode( $purchase_token )
        );

        $response = wp_remote_get( $url, array(
            'headers' => array( 'Authorization' => 'Bearer ' . $access_token ),
            'timeout' => 20,
        ) );
        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code >= 400 ) {
            return new WP_Error(
                'gplay_verify_failed',
                $data['error']['message'] ?? __( 'Purchase verification failed.', 'culture-community' ),
                array( 'status' => $code )
            );
        }

        return is_array( $data ) ? $data : array();
    }

    private static function acknowledge_purchase( $product_id, $purchase_token, $access_token ) {
        $url = sprintf(
            '%s/applications/%s/purchases/subscriptions/%s/tokens/%s:acknowledge',
            self::API_BASE,
            rawurlencode( self::package_name() ),
            rawurlencode( $product_id ),
            rawurlencode( $purchase_token )
        );

        wp_remote_post( $url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $access_token,
                'Content-Type'  => 'application/json',
            ),
            'body'    => '{}',
            'timeout' => 20,
        ) );
    }
}
