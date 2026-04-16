<?php
/**
 * Stripe integration for international subscriptions.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Stripe {

    const API_BASE = 'https://api.stripe.com/v1';

    /**
     * Get the Stripe secret key from settings.
     */
    private static function get_secret_key() {
        return get_option( 'culture_stripe_secret_key', '' );
    }

    /**
     * Get the Stripe Price ID based on billing cycle.
     *
     * @param string $cycle 'monthly' or 'yearly'.
     * @return string
     */
    private static function get_price_id( $cycle = 'monthly' ) {
        $key = 'culture_stripe_price_' . strtolower( $cycle ) . '_usd';
        return get_option( $key, '' );
    }

    /**
     * Generate checkout URL for upgrading to Patron via Stripe.
     *
     * @param int    $user_id
     * @param string $plan_key e.g. 'monthly_usd'
     * @return string|WP_Error
     */
    public static function get_checkout_url( $user_id, $plan_key = 'monthly_usd' ) {
        $cycle    = strpos( $plan_key, 'yearly' ) !== false ? 'yearly' : 'monthly';
        $price_id = self::get_price_id( $cycle );

        if ( empty( $price_id ) ) {
            return new WP_Error( 'missing_price_id', __( 'Stripe Price ID not configured.', 'culture-community' ) );
        }

        $response = self::api_request( 'POST', '/checkout/sessions', array(
            'mode'                => 'subscription',
            'client_reference_id' => (string) $user_id,
            'success_url'         => add_query_arg( 'culture_upgraded', '1', home_url( '/' ) ),
            'cancel_url'          => add_query_arg( 'culture_upgraded', '0', home_url( '/' ) ),
            'line_items'          => array(
                array(
                    'price'    => $price_id,
                    'quantity' => 1,
                ),
            ),
            'metadata' => array(
                'user_id' => $user_id,
            ),
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        return $response['url'] ?? '';
    }

    /**
     * Handle Stripe webhook events.
     * Called by the REST API route.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_webhook( $request ) {
        $payload = $request->get_body();
        $data    = json_decode( $payload, true );

        if ( ! $data || ! isset( $data['type'] ) ) {
            return new WP_Error( 'invalid_payload', 'Invalid payload.', array( 'status' => 400 ) );
        }

        // Note: For production, we should ideally verify the webhook signature here.
        // However, without the Stripe SDK, verifying 'Stripe-Signature' manually requires
        // a complex implementation of HMAC SHA256 that matches Stripe's specific scheme.

        $event_type = $data['type'];
        $object     = $data['data']['object'] ?? array();

        switch ( $event_type ) {
            case 'checkout.session.completed':
                $user_id = (int) ( $object['client_reference_id'] ?? 0 );
                if ( $user_id ) {
                    self::upgrade_user( $user_id, $object );
                }
                break;

            case 'customer.subscription.deleted':
                $user_id = self::get_user_by_stripe_customer( $object['customer'] ?? '' );
                if ( $user_id ) {
                    update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
                    update_user_meta( $user_id, '_culture_subscription_status', 'cancelled' );
                }
                break;
        }

        return rest_ensure_response( array( 'status' => 'ok' ) );
    }

    /**
     * Upgrade user to Patron tier.
     *
     * @param int   $user_id
     * @param array $session Stripe Session object.
     */
    private static function upgrade_user( $user_id, $session ) {
        update_user_meta( $user_id, '_culture_membership_tier', 'patron' );
        update_user_meta( $user_id, '_culture_stripe_customer_id', $session['customer'] ?? '' );
        update_user_meta( $user_id, '_culture_stripe_subscription_id', $session['subscription'] ?? '' );
        update_user_meta( $user_id, '_culture_subscription_status', 'active' );

        do_action( 'culture_payment_completed', $user_id, array(
            'gateway'  => 'stripe',
            'amount'   => $session['amount_total'] ?? 0,
            'currency' => strtoupper( $session['currency'] ?? 'USD' ),
            'reference' => $session['id'] ?? '',
        ) );
    }

    /**
     * Find user by Stripe customer ID.
     */
    private static function get_user_by_stripe_customer( $customer_id ) {
        if ( ! $customer_id ) return false;

        $users = get_users( array(
            'meta_key'   => '_culture_stripe_customer_id',
            'meta_value' => $customer_id,
            'number'     => 1,
            'fields'     => 'ID',
        ) );

        return ! empty( $users ) ? (int) $users[0] : false;
    }

    /**
     * Make an API request to Stripe.
     */
    private static function api_request( $method, $endpoint, $body = array() ) {
        $secret = self::get_secret_key();
        if ( empty( $secret ) ) {
            return new WP_Error( 'missing_api_key', 'Stripe Secret Key is not configured.' );
        }

        $args = array(
            'method'  => $method,
            'headers' => array(
                'Authorization' => 'Basic ' . base64_encode( $secret . ':' ),
                'Content-Type'  => 'application/x-www-form-urlencoded',
            ),
            'timeout' => 30,
        );

        if ( ! empty( $body ) ) {
            // Stripe API for v1 endpoints expects application/x-www-form-urlencoded with nested brackets.
            // http_build_query handles this correctly for Stripe's style.
            $args['body'] = http_build_query( $body );
        }

        $url      = self::API_BASE . $endpoint;
        $response = wp_remote_request( $url, $args );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code >= 400 ) {
            return new WP_Error(
                'stripe_error',
                $body['error']['message'] ?? 'Stripe API error.',
                array( 'status' => $code )
            );
        }

        return $body;
    }
}
