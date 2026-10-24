<?php
/**
 * Flutterwave Bills API — airtime top-ups.
 *
 * Env vars:
 *   FLUTTERWAVE_SECRET_KEY — from Flutterwave dashboard
 *
 * WP option fallback (set in WP Admin → Settings or WP-CLI):
 *   culture_flutterwave_secret_key
 *
 * Supported countries: NG (Nigeria) — extend airtime_type_for_country() for others.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Flutterwave {

    const API_BASE = 'https://api.flutterwave.com/v3';

    /* ── Credentials ────────────────────────────────────────────── */

    private static function secret_key(): string {
        return getenv( 'FLUTTERWAVE_SECRET_KEY' )
            ?: (string) get_option( 'culture_flutterwave_secret_key', '' );
    }

    public static function is_configured(): bool {
        return self::secret_key() !== '';
    }

    /**
     * Flutterwave bill type for airtime by country.
     * Extend this map as more countries are enabled.
     */
    private static function airtime_type_for_country( string $country ): string {
        $map = [
            'NG' => 'AIRTIME',
            'GH' => 'AIRTIME',
            'KE' => 'AIRTIME',
            'ZA' => 'AIRTIME',
            'UG' => 'AIRTIME',
        ];
        return $map[ strtoupper( $country ) ] ?? 'AIRTIME';
    }

    /* ── Airtime ────────────────────────────────────────────────── */

    /**
     * Send a mobile data bundle via the Flutterwave Bills API.
     *
     * @param string $phone       Phone number in E.164 format.
     * @param string $bundle_type Flutterwave bill type for the data plan
     *                            (e.g. "MTNDATA", "AIRTELDATA", "GLODATA", "9MOBILEDATA").
     *                            This is the value stored as data_bundle_code on the perk.
     * @param float  $amount      Amount in local currency units (e.g. 500 for ₦500).
     * @param string $country     ISO-2 country code (e.g. "NG").
     * @param string $reference   Unique idempotency reference for this transaction.
     * @return array|WP_Error     Flutterwave response `data` on success, WP_Error on failure.
     */
    public static function send_data_bundle(
        string $phone,
        string $bundle_type,
        float  $amount,
        string $country,
        string $reference
    ): array|WP_Error {
        if ( ! self::is_configured() ) {
            return new WP_Error(
                'flutterwave_unconfigured',
                'Flutterwave is not configured. Please add your secret key in Settings.',
                [ 'status' => 503 ]
            );
        }

        if ( empty( trim( $bundle_type ) ) ) {
            return new WP_Error(
                'data_bundle_code_missing',
                'Data bundle type is not configured for this perk.',
                [ 'status' => 500 ]
            );
        }

        $payload = [
            'country'    => strtoupper( $country ),
            'customer'   => $phone,
            'amount'     => (float) $amount,
            'recurrence' => 'ONCE',
            'type'       => strtoupper( $bundle_type ),
            'reference'  => $reference,
        ];

        $response = wp_remote_post( self::API_BASE . '/bills', [
            'headers' => [
                'Authorization' => 'Bearer ' . self::secret_key(),
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode( $payload ),
            'timeout' => 30,
        ] );

        if ( is_wp_error( $response ) ) {
            return new WP_Error(
                'flutterwave_network',
                'Could not reach Flutterwave: ' . $response->get_error_message(),
                [ 'status' => 502 ]
            );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            $msg = $body['message'] ?? "Flutterwave returned HTTP {$code}";
            return new WP_Error(
                'flutterwave_api',
                $msg,
                [ 'status' => $code >= 500 ? 502 : 422 ]
            );
        }

        return $body['data'] ?? $body;
    }

    /* ── Standard payment collection ───────────────────────────────── */

    /**
     * Create a hosted checkout session (Flutterwave Standard).
     *
     * Amount must be in the major currency unit (e.g. 5000 for ₦5,000 NGN).
     *
     * @param array $args {
     *   @type string $tx_ref       Unique idempotency reference (required).
     *   @type float  $amount       Amount in major currency units (required).
     *   @type string $currency     ISO-4217 currency code, e.g. "NGN" (required).
     *   @type string $redirect_url URL Flutterwave redirects to after payment (required).
     *   @type string $email        Customer email (required).
     *   @type string $name         Customer display name.
     *   @type string $phone        Customer phone (optional).
     *   @type string $description  Line-item description shown on checkout.
     *   @type string $title        Merchant title shown on checkout.
     * }
     * @return array{ url: string, reference: string }|WP_Error
     */
    public static function payment_initiate( array $args ): array|\WP_Error {
        if ( ! self::is_configured() ) {
            return new \WP_Error( 'flutterwave_unconfigured', 'Flutterwave is not configured.', [ 'status' => 503 ] );
        }

        $payload = [
            'tx_ref'       => $args['tx_ref'],
            'amount'       => (float) $args['amount'],
            'currency'     => strtoupper( $args['currency'] ),
            'redirect_url' => $args['redirect_url'],
            'customer'     => [
                'email'       => $args['email'],
                'name'        => $args['name'] ?? '',
                'phonenumber' => $args['phone'] ?? '',
            ],
            'customizations' => [
                'title'       => $args['title'] ?? 'Moveee',
                'description' => $args['description'] ?? '',
                'logo'        => 'https://themoveee.com/favicon.ico',
            ],
        ];

        $response = wp_remote_post( self::API_BASE . '/payments', [
            'headers' => [
                'Authorization' => 'Bearer ' . self::secret_key(),
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode( $payload ),
            'timeout' => 30,
        ] );

        if ( is_wp_error( $response ) ) {
            return new \WP_Error( 'flutterwave_network', 'Could not reach Flutterwave: ' . $response->get_error_message(), [ 'status' => 502 ] );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            return new \WP_Error( 'flutterwave_api', $body['message'] ?? "Flutterwave returned HTTP {$code}", [ 'status' => $code >= 500 ? 502 : 422 ] );
        }

        $link = $body['data']['link'] ?? '';
        if ( ! $link ) {
            return new \WP_Error( 'flutterwave_no_link', 'Flutterwave did not return a payment link.' );
        }

        return [ 'url' => $link, 'reference' => $args['tx_ref'] ];
    }

    /**
     * Verify a completed transaction by Flutterwave transaction ID.
     *
     * @param int $transaction_id  The numeric ID from the redirect/webhook payload.
     * @return array|WP_Error      Transaction data array on success, WP_Error on failure.
     */
    public static function verify_transaction( int $transaction_id ): array|\WP_Error {
        if ( ! self::is_configured() ) {
            return new \WP_Error( 'flutterwave_unconfigured', 'Flutterwave is not configured.', [ 'status' => 503 ] );
        }

        $response = wp_remote_get( self::API_BASE . '/transactions/' . $transaction_id . '/verify', [
            'headers' => [ 'Authorization' => 'Bearer ' . self::secret_key() ],
            'timeout' => 30,
        ] );

        if ( is_wp_error( $response ) ) {
            return new \WP_Error( 'flutterwave_network', 'Could not reach Flutterwave: ' . $response->get_error_message(), [ 'status' => 502 ] );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            return new \WP_Error( 'flutterwave_api', $body['message'] ?? "Flutterwave returned HTTP {$code}", [ 'status' => $code >= 500 ? 502 : 422 ] );
        }

        return $body['data'] ?? $body;
    }

    /**
     * Send airtime to a phone number via the Flutterwave Bills API.
     *
     * @param string $phone      Phone number in E.164 format (e.g. "+2348012345678")
     *                           or local format as accepted by Flutterwave for that country.
     * @param float  $amount     Amount in local currency units (e.g. 500 for ₦500).
     * @param string $country    ISO-2 country code (e.g. "NG").
     * @param string $reference  Unique idempotency reference for this transaction.
     * @return array|WP_Error    Flutterwave response `data` on success, WP_Error on failure.
     */
    public static function send_airtime(
        string $phone,
        float  $amount,
        string $country,
        string $reference
    ): array|WP_Error {
        if ( ! self::is_configured() ) {
            return new WP_Error(
                'flutterwave_unconfigured',
                'Flutterwave is not configured. Please add your secret key in Settings.',
                [ 'status' => 503 ]
            );
        }

        $payload = [
            'country'    => strtoupper( $country ),
            'customer'   => $phone,
            'amount'     => (float) $amount,
            'recurrence' => 'ONCE',
            'type'       => self::airtime_type_for_country( $country ),
            'reference'  => $reference,
        ];

        $response = wp_remote_post( self::API_BASE . '/bills', [
            'headers' => [
                'Authorization' => 'Bearer ' . self::secret_key(),
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode( $payload ),
            'timeout' => 30,
        ] );

        if ( is_wp_error( $response ) ) {
            return new WP_Error(
                'flutterwave_network',
                'Could not reach Flutterwave: ' . $response->get_error_message(),
                [ 'status' => 502 ]
            );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            $msg = $body['message'] ?? "Flutterwave returned HTTP {$code}";
            return new WP_Error(
                'flutterwave_api',
                $msg,
                [ 'status' => $code >= 500 ? 502 : 422 ]
            );
        }

        return $body['data'] ?? $body;
    }
}
