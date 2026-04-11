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
     * Get the Patron plan code.
     */
    private static function get_plan_code() {
        return get_option( 'culture_paystack_plan_code', '' );
    }

    /**
     * Generate checkout URL for upgrading to Patron.
     *
     * @param int $user_id
     * @return string
     */
    public static function get_checkout_url( $user_id ) {
        return add_query_arg( array(
            'culture_action' => 'paystack_checkout',
            'nonce'          => wp_create_nonce( 'culture_paystack_checkout_' . $user_id ),
        ), home_url( '/' ) );
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

        $response = self::api_request( 'POST', '/transaction/initialize', array(
            'email'        => $user->user_email,
            'plan'         => self::get_plan_code(),
            'callback_url' => add_query_arg( 'culture_paystack_callback', '1', home_url( '/' ) ),
            'metadata'     => array(
                'user_id'    => $user_id,
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
