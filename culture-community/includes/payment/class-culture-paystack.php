<?php
/**
 * Paystack integration for subscription management.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Paystack {

    const API_BASE = 'https://api.paystack.co';

    public static function init() {
        add_action( 'wp_ajax_culture_init_payment', array( __CLASS__, 'ajax_init_payment' ) );
        add_action( 'template_redirect', array( __CLASS__, 'handle_payment_callback' ) );
    }

    /**
     * Get the Paystack secret key from settings.
     */
    private static function get_secret_key() {
        return get_option( 'culture_paystack_secret_key', '' );
    }

    /**
     * Get the Paystack public key from settings.
     */
    public static function get_public_key() {
        return get_option( 'culture_paystack_public_key', '' );
    }

    /**
     * Get the plan code based on cycle and currency.
     *
     * @param string $cycle 'monthly' or 'yearly'.
     * @param string $currency 'NGN' or 'USD'.
     * @return string
     */
    private static function get_plan_code( $cycle = 'monthly', $currency = 'NGN' ) {
        $key = 'culture_paystack_plan_' . strtolower( $cycle ) . '_' . strtolower( $currency );
        return get_option( $key, '' );
    }

    /**
     * Get the amount in lowest units (kobo/cents).
     *
     * @param string $cycle
     * @param string $currency
     * @return int
     */
    private static function get_amount_lowest( $cycle = 'monthly', $currency = 'NGN' ) {
        $key      = 'culture_paystack_amount_' . strtolower( $cycle ) . '_' . strtolower( $currency );
        $fallback = ( 'yearly' === $cycle ) ? 45000 : 4500;
        if ( 'USD' === strtoupper( $currency ) ) {
            $fallback = ( 'yearly' === $cycle ) ? 40 : 4;
        }
        $amount = (int) get_option( $key, $fallback );
        return $amount * 100;
    }

    /**
     * Generate checkout URL for upgrading to Patron.
     *
     * @param int    $user_id
     * @param string $plan_key e.g. 'monthly_ngn'
     * @return string
     */
    public static function get_checkout_url( $user_id, $plan_key = 'monthly_ngn' ) {
        return add_query_arg( array(
            'culture_action' => 'paystack_checkout',
            'user_id'        => $user_id,
            'plan_key'       => $plan_key,
            'token'          => self::get_checkout_token( $user_id ),
        ), home_url( '/' ) );
    }

    /**
     * Re-usable internal logic to initialize a Paystack session and return the direct URL.
     * Prevents headless users from being bounced through the CMS.
     */
    public static function init_checkout_session( $user_id, $plan_key = 'monthly_ngn' ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.' );
        }

        $parts    = explode( '_', $plan_key );
        $cycle    = $parts[0] ?? 'monthly';
        $currency = strtoupper( $parts[1] ?? 'NGN' );

        $frontend_url = get_option( 'culture_frontend_url', home_url( '/' ) );
        $callback_url = add_query_arg( 'culture_upgraded', '1', $frontend_url );

        $response = self::api_request( 'POST', '/transaction/initialize', array(
            'email'        => $user->user_email,
            'amount'       => self::get_amount_lowest( $cycle, $currency ),
            'currency'     => $currency,
            'plan'         => self::get_plan_code( $cycle, $currency ),
            'callback_url' => $callback_url,
            'metadata'     => array(
                'user_id'    => $user_id,
                'plan_key'   => $plan_key,
                'custom_fields' => array(
                    array(
                        'display_name'  => 'WordPress User ID',
                        'variable_name' => 'user_id',
                        'value'         => $user_id,
                    ),
                ),
            ),
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        if ( ! empty( $response['data']['authorization_url'] ) ) {
            update_user_meta( $user_id, '_culture_paystack_reference', $response['data']['reference'] );
            return $response['data']['authorization_url'];
        }

        return new WP_Error( 'paystack_error', 'Could not initialize Paystack session.' );
    }

    /**
     * Generate a session-independent security token for checkout redirects.
     */
    private static function get_checkout_token( $user_id ) {
        $salt = defined( 'NONCE_SALT' ) ? NONCE_SALT : 'culture_fallback_salt';
        return wp_hash( $user_id . '|paystack_checkout|' . $salt, 'nonce' );
    }

    /**
     * Process the paystack_checkout action.
     * Verifies the token OR Authorization header and then redirects the user to the Paystack authorization URL.
     */
    private static function process_checkout_action() {
        $user_id = isset( $_GET['user_id'] ) ? absint( $_GET['user_id'] ) : 0;
        $token   = isset( $_GET['token'] ) ? sanitize_text_field( $_GET['token'] ) : '';

        // Prioritize Authorization Header if available (useful for API testing).
        $auth_header   = '';
        if ( function_exists( 'getallheaders' ) ) {
            $all_headers = getallheaders();
            $auth_header = $all_headers['Authorization'] ?? $all_headers['authorization'] ?? '';
        } elseif ( isset( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        }

        $is_authorized = false;
        if ( ! empty( $auth_header ) && class_exists( 'Culture_REST_API' ) ) {
            $is_authorized = Culture_REST_API::verify_bearer_token( $auth_header );
        }

        if ( ! $is_authorized && ( ! $user_id || ! hash_equals( self::get_checkout_token( $user_id ), $token ) ) ) {
            wp_die( esc_html__( 'Invalid security token or unauthorized request.', 'culture-community' ) );
        }

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            wp_die( esc_html__( 'User not found.', 'culture-community' ) );
        }

        $plan_key = isset( $_GET['plan_key'] ) ? sanitize_key( $_GET['plan_key'] ) : 'monthly_ngn';
        $parts    = explode( '_', $plan_key );
        $cycle    = $parts[0] ?? 'monthly';
        $currency = strtoupper( $parts[1] ?? 'NGN' );

        $response = self::api_request( 'POST', '/transaction/initialize', array(
            'email'        => $user->user_email,
            'amount'       => self::get_amount_lowest( $cycle, $currency ),
            'currency'     => $currency,
            'plan'         => self::get_plan_code( $cycle, $currency ),
            'callback_url' => add_query_arg( 'culture_paystack_callback', '1', home_url( '/' ) ),
            'metadata'     => array(
                'user_id'    => $user_id,
                'plan_key'   => $plan_key,
                'custom_fields' => array(
                    array(
                        'display_name'  => 'WordPress User ID',
                        'variable_name' => 'user_id',
                        'value'         => $user_id,
                    ),
                ),
            ),
        ) );

        if ( is_wp_error( $response ) ) {
            wp_die( esc_html( $response->get_error_message() ) );
        }

        if ( ! empty( $response['data']['authorization_url'] ) ) {
            update_user_meta( $user_id, '_culture_paystack_reference', $response['data']['reference'] );
            wp_safe_redirect( $response['data']['authorization_url'] );
            exit;
        }

        wp_die( esc_html__( 'Could not initialize payment.', 'culture-community' ) );
    }

    /**
     * Initialize a Paystack transaction via AJAX.
     */
    public static function ajax_init_payment() {
        check_ajax_referer( 'culture_nonce', 'nonce' );

        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => __( 'Please log in.', 'culture-community' ) ) );
        }

        $user_id = get_current_user_id();
        $user    = wp_get_current_user();

        $plan_key = isset( $_POST['plan_key'] ) ? sanitize_key( $_POST['plan_key'] ) : 'monthly_ngn';
        $parts    = explode( '_', $plan_key );
        $cycle    = $parts[0] ?? 'monthly';
        $currency = strtoupper( $parts[1] ?? 'NGN' );

        $response = self::api_request( 'POST', '/transaction/initialize', array(
            'email'        => $user->user_email,
            'amount'       => self::get_amount_lowest( $cycle, $currency ),
            'currency'     => $currency,
            'plan'         => self::get_plan_code( $cycle, $currency ),
            'callback_url' => add_query_arg( 'culture_paystack_callback', '1', home_url( '/' ) ),
            'metadata'     => array(
                'user_id'    => $user_id,
                'plan_key'   => $plan_key,
                'custom_fields' => array(
                    array(
                        'display_name'  => 'WordPress User ID',
                        'variable_name' => 'user_id',
                        'value'         => $user_id,
                    ),
                ),
            ),
        ) );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => $response->get_error_message() ) );
        }

        if ( ! empty( $response['data']['authorization_url'] ) ) {
            // Store reference for callback verification.
            update_user_meta( $user_id, '_culture_paystack_reference', $response['data']['reference'] );
            wp_send_json_success( array( 'authorization_url' => $response['data']['authorization_url'] ) );
        }

        wp_send_json_error( array( 'message' => __( 'Could not initialize payment.', 'culture-community' ) ) );
    }

    /**
     * Handle Paystack callback after payment.
     */
    public static function handle_payment_callback() {
        if ( isset( $_GET['culture_action'] ) && 'paystack_checkout' === $_GET['culture_action'] ) {
            self::process_checkout_action();
            return;
        }

        if ( ! isset( $_GET['culture_paystack_callback'] ) ) {
            return;
        }

        $reference = isset( $_GET['reference'] ) ? sanitize_text_field( $_GET['reference'] ) : '';
        if ( empty( $reference ) ) {
            wp_die( esc_html__( 'Invalid payment reference.', 'culture-community' ) );
        }

        // Verify transaction.
        $response = self::api_request( 'GET', '/transaction/verify/' . rawurlencode( $reference ) );

        if ( is_wp_error( $response ) ) {
            wp_die( esc_html( $response->get_error_message() ) );
        }

        if ( 'success' === ( $response['data']['status'] ?? '' ) ) {
            $metadata = $response['data']['metadata'] ?? array();
            $user_id  = $metadata['user_id'] ?? 0;

            if ( $user_id ) {
                update_user_meta( $user_id, '_culture_membership_tier', 'patron' );
                update_user_meta( $user_id, '_culture_paystack_customer_code', $response['data']['customer']['customer_code'] ?? '' );

                wp_safe_redirect( add_query_arg( 'culture_upgraded', '1', home_url( '/' ) ) );
                exit;
            }
        }

        wp_die( esc_html__( 'Payment verification failed.', 'culture-community' ) );
    }

    /**
     * Handle Paystack webhook events.
     * Called by the REST API route.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_webhook( $request ) {
        // Verify Paystack signature.
        $payload   = $request->get_body();
        $signature = $request->get_header( 'x-paystack-signature' );

        if ( ! $signature ) {
            return new WP_Error( 'invalid_signature', 'Missing signature.', array( 'status' => 400 ) );
        }

        $expected = hash_hmac( 'sha512', $payload, self::get_secret_key() );
        if ( ! hash_equals( $expected, $signature ) ) {
            return new WP_Error( 'invalid_signature', 'Invalid signature.', array( 'status' => 403 ) );
        }

        $data  = json_decode( $payload, true );
        $event = $data['event'] ?? '';

        switch ( $event ) {
            case 'subscription.create':
                self::handle_subscription_create( $data['data'] ?? array() );
                break;

            case 'subscription.disable':
                self::handle_subscription_disable( $data['data'] ?? array() );
                break;

            case 'invoice.payment_failed':
                self::handle_payment_failed( $data['data'] ?? array() );
                break;
        }

        return rest_ensure_response( array( 'status' => 'ok' ) );
    }

    /**
     * Handle subscription.create webhook.
     */
    private static function handle_subscription_create( $data ) {
        $customer_code    = $data['customer']['customer_code'] ?? '';
        $subscription_code = $data['subscription_code'] ?? '';

        if ( ! $customer_code ) {
            return;
        }

        $user_id = self::get_user_by_customer_code( $customer_code );
        if ( ! $user_id ) {
            return;
        }

        update_user_meta( $user_id, '_culture_membership_tier', 'patron' );
        update_user_meta( $user_id, '_culture_subscription_code', $subscription_code );
        update_user_meta( $user_id, '_culture_subscription_status', 'active' );

        do_action( 'culture_payment_completed', $user_id, $data );
    }

    /**
     * Handle subscription.disable webhook (downgrade to Citizen).
     */
    private static function handle_subscription_disable( $data ) {
        $customer_code = $data['customer']['customer_code'] ?? '';

        if ( ! $customer_code ) {
            return;
        }

        $user_id = self::get_user_by_customer_code( $customer_code );
        if ( ! $user_id ) {
            return;
        }

        update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
        update_user_meta( $user_id, '_culture_subscription_status', 'cancelled' );
        // Remove secondary chapter access on downgrade.
        delete_user_meta( $user_id, '_culture_secondary_chapter_id' );
    }

    /**
     * Handle invoice.payment_failed webhook (grace period).
     */
    private static function handle_payment_failed( $data ) {
        $customer_code = $data['customer']['customer_code'] ?? '';

        if ( ! $customer_code ) {
            return;
        }

        $user_id = self::get_user_by_customer_code( $customer_code );
        if ( ! $user_id ) {
            return;
        }

        // Set a grace period flag - don't immediately downgrade.
        update_user_meta( $user_id, '_culture_subscription_status', 'non-renewing' );
        update_user_meta( $user_id, '_culture_grace_period_start', current_time( 'mysql' ) );

        do_action( 'culture_grace_period_started', $user_id );
    }

    /**
     * Look up a WordPress user by Paystack customer code.
     *
     * @param string $customer_code
     * @return int|false User ID or false.
     */
    private static function get_user_by_customer_code( $customer_code ) {
        $users = get_users( array(
            'meta_key'   => '_culture_paystack_customer_code',
            'meta_value' => $customer_code,
            'number'     => 1,
            'fields'     => 'ID',
        ) );

        return ! empty( $users ) ? (int) $users[0] : false;
    }

    /**
     * Make an API request to Paystack.
     *
     * @param string $method  HTTP method.
     * @param string $endpoint API endpoint path.
     * @param array  $body    Request body (for POST/PUT).
     * @return array|WP_Error Parsed response body or error.
     */
    private static function api_request( $method, $endpoint, $body = array() ) {
        $args = array(
            'method'  => $method,
            'headers' => array(
                'Authorization' => 'Bearer ' . self::get_secret_key(),
                'Content-Type'  => 'application/json',
            ),
            'timeout' => 30,
        );

        if ( ! empty( $body ) && in_array( $method, array( 'POST', 'PUT' ), true ) ) {
            $args['body'] = wp_json_encode( $body );
        }

        $response = wp_remote_request( self::API_BASE . $endpoint, $args );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code >= 400 ) {
            return new WP_Error(
                'paystack_error',
                $body['message'] ?? __( 'Paystack API error.', 'culture-community' ),
                array( 'status' => $code )
            );
        }

        return $body;
    }
}
