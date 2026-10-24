<?php
/**
 * Flutterwave membership subscription management.
 *
 * Mirrors the public API of Culture_Paystack so the REST API can swap
 * _ngn routing transparently:
 *   - get_checkout_url()       — CMS-redirect flow (GET, tokenised)
 *   - init_checkout_session()  — direct URL returned to headless clients
 *
 * Plans are auto-provisioned via the Flutterwave Plans API on first use
 * and cached in wp_options so re-creation never happens.
 *
 * Amount option keys (major NGN units, e.g. 5000 = ₦5,000):
 *   culture_flw_amount_monthly_ngn
 *   culture_flw_amount_yearly_ngn
 *   culture_flw_amount_monthly_ngn_lit
 *   culture_flw_amount_yearly_ngn_lit
 *
 * Plan ID cache keys (written automatically — do not edit manually):
 *   culture_flw_plan_monthly_ngn
 *   culture_flw_plan_yearly_ngn
 *   culture_flw_plan_monthly_ngn_lit
 *   culture_flw_plan_yearly_ngn_lit
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Flutterwave_Subscriptions {

    const API_BASE = 'https://api.flutterwave.com/v3';

    /* ── Defaults (major NGN units) ───────────────────────────────────── */

    private static $defaults = array(
        'patron' => array( 'monthly' => 5000, 'yearly' => 50000 ),
        'lit'    => array( 'monthly' => 2000, 'yearly' => 20000 ),
    );

    /* ── Bootstrap ────────────────────────────────────────────────────── */

    public static function init() {
        add_action( 'template_redirect', array( __CLASS__, 'handle_callback' ) );
    }

    /* ── Credential helpers ───────────────────────────────────────────── */

    private static function secret_key(): string {
        return getenv( 'FLUTTERWAVE_SECRET_KEY' )
            ?: (string) get_option( 'culture_flutterwave_secret_key', '' );
    }

    /* ── Amount helpers ───────────────────────────────────────────────── */

    /**
     * Amount in major NGN units (e.g. 5000 = ₦5,000).
     */
    private static function get_amount( string $cycle, string $tier ): float {
        $suffix   = ( 'patron' === $tier ) ? '' : '_' . strtolower( $tier );
        $key      = 'culture_flw_amount_' . strtolower( $cycle ) . '_ngn' . $suffix;
        $fallback = self::$defaults[ $tier ][ $cycle ] ?? 5000;
        return (float) get_option( $key, $fallback );
    }

    /* ── Plan provisioning ────────────────────────────────────────────── */

    /**
     * Return a cached Flutterwave plan ID, creating the plan if needed.
     *
     * @return int|WP_Error  Numeric plan ID or error.
     */
    private static function get_or_create_plan_id( string $cycle, string $tier ): int|\WP_Error {
        $suffix  = ( 'patron' === $tier ) ? '' : '_' . strtolower( $tier );
        $opt_key = 'culture_flw_plan_' . strtolower( $cycle ) . '_ngn' . $suffix;

        $cached = (int) get_option( $opt_key, 0 );
        if ( $cached > 0 ) {
            return $cached;
        }

        // Build a human-readable plan name for the Flutterwave dashboard.
        $tier_label = ( 'patron' === $tier ) ? 'Moveee Pro' : 'Moveee Lit';
        $name       = $tier_label . ' ' . ucfirst( $cycle ) . ' NGN';

        $response = wp_remote_post( self::API_BASE . '/payment-plans', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . self::secret_key(),
                'Content-Type'  => 'application/json',
            ),
            'body'    => wp_json_encode( array(
                'name'     => $name,
                'amount'   => self::get_amount( $cycle, $tier ),
                'interval' => $cycle,
                'currency' => 'NGN',
            ) ),
            'timeout' => 30,
        ) );

        if ( is_wp_error( $response ) ) {
            return new WP_Error(
                'flutterwave_network',
                'Could not reach Flutterwave: ' . $response->get_error_message(),
                array( 'status' => 502 )
            );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? array();

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            return new WP_Error(
                'flutterwave_api',
                $body['message'] ?? "Flutterwave returned HTTP {$code}",
                array( 'status' => $code >= 500 ? 502 : 422 )
            );
        }

        $plan_id = (int) ( $body['data']['id'] ?? 0 );
        if ( $plan_id > 0 ) {
            update_option( $opt_key, $plan_id, false );
        }

        return $plan_id > 0 ? $plan_id : new WP_Error( 'flutterwave_no_plan', 'Flutterwave did not return a plan ID.' );
    }

    /* ── Checkout: CMS-redirect flow ──────────────────────────────────── */

    /**
     * Returns a tokenised CMS URL that the browser follows.
     * Mirrors Culture_Paystack::get_checkout_url().
     *
     * @param int    $user_id
     * @param string $plan_key  e.g. 'monthly_ngn'
     * @param string $tier      'patron' or 'lit'
     * @return string
     */
    public static function get_checkout_url( int $user_id, string $plan_key = 'monthly_ngn', string $tier = 'patron' ): string {
        $tier = in_array( $tier, array( 'patron', 'lit' ), true ) ? $tier : 'patron';
        return add_query_arg( array(
            'culture_action' => 'flw_checkout',
            'user_id'        => $user_id,
            'plan_key'       => $plan_key,
            'tier'           => $tier,
            'token'          => self::get_checkout_token( $user_id ),
        ), home_url( '/' ) );
    }

    private static function get_checkout_token( int $user_id ): string {
        $salt = defined( 'NONCE_SALT' ) ? NONCE_SALT : 'culture_fallback_salt';
        return wp_hash( $user_id . '|flw_checkout|' . $salt, 'nonce' );
    }

    /* ── Checkout: direct URL (headless) ──────────────────────────────── */

    /**
     * Mirrors Culture_Paystack::init_checkout_session().
     * Creates a Flutterwave Standard checkout and returns the hosted-page URL.
     *
     * @param int    $user_id
     * @param string $plan_key   e.g. 'monthly_ngn'
     * @param string $tier       'patron' or 'lit'
     * @param string $return_path  Optional path appended to the frontend URL
     *                             (e.g. '/lit-welcome'). Never used as a host
     *                             of its own — see Culture_Paystack::build_return_url().
     * @return string|WP_Error   Checkout URL on success.
     */
    public static function init_checkout_session(
        int    $user_id,
        string $plan_key   = 'monthly_ngn',
        string $tier       = 'patron',
        string $return_path = ''
    ): string|\WP_Error {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $tier  = in_array( $tier, array( 'patron', 'lit' ), true ) ? $tier : 'patron';
        $parts = explode( '_', $plan_key );
        $cycle = $parts[0] ?? 'monthly';

        $plan_id = self::get_or_create_plan_id( $cycle, $tier );
        if ( is_wp_error( $plan_id ) ) {
            return $plan_id;
        }

        $frontend_url = get_option( 'culture_frontend_url', home_url( '/' ) );
        $return_url   = Culture_Paystack::build_return_url( $frontend_url, $return_path );
        $callback_url = home_url( '/?culture_flw_callback=1&flw_return=' . rawurlencode( $return_url ) );

        update_user_meta( $user_id, '_culture_pending_tier', $tier );

        $result = Culture_Flutterwave::payment_initiate( array(
            'tx_ref'       => 'flw-sub-' . $user_id . '-' . time(),
            'amount'       => self::get_amount( $cycle, $tier ),
            'currency'     => 'NGN',
            'redirect_url' => $callback_url,
            'email'        => $user->user_email,
            'name'         => trim( $user->first_name . ' ' . $user->last_name ) ?: $user->display_name,
            'phone'        => get_user_meta( $user_id, '_culture_phone', true ) ?: '',
            'description'  => 'Moveee membership — ' . ucfirst( $cycle ),
            'title'        => 'Moveee',
            'payment_plan' => $plan_id,
            'meta'         => array(
                'user_id' => $user_id,
                'tier'    => $tier,
            ),
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        update_user_meta( $user_id, '_culture_flw_tx_ref', $result['reference'] ?? '' );

        return $result['url'];
    }

    /* ── template_redirect callback handler ───────────────────────────── */

    /**
     * Catches both the initial CMS-redirect checkout action and the
     * Flutterwave return redirect.
     */
    public static function handle_callback() {
        // ── CMS-redirect checkout action ──────────────────────────────
        if ( isset( $_GET['culture_action'] ) && 'flw_checkout' === $_GET['culture_action'] ) {
            self::process_checkout_action();
            return;
        }

        // ── Flutterwave return redirect ───────────────────────────────
        if ( ! isset( $_GET['culture_flw_callback'] ) ) {
            return;
        }

        $status         = sanitize_text_field( $_GET['status'] ?? '' );
        $transaction_id = absint( $_GET['transaction_id'] ?? 0 );

        if ( 'successful' !== $status || ! $transaction_id ) {
            wp_die( esc_html__( 'Payment was not completed.', 'culture-community' ) );
        }

        $data = Culture_Flutterwave::verify_transaction( $transaction_id );

        if ( is_wp_error( $data ) ) {
            wp_die( esc_html( $data->get_error_message() ) );
        }

        if ( ( $data['status'] ?? '' ) !== 'successful' ) {
            wp_die( esc_html__( 'Payment verification failed.', 'culture-community' ) );
        }

        $meta    = $data['meta'] ?? array();
        $user_id = (int) ( $meta['user_id'] ?? 0 );
        $tier    = $meta['tier'] ?? '';

        if ( ! $user_id ) {
            // Fallback: find by email.
            $customer_email = $data['customer']['email'] ?? '';
            if ( $customer_email ) {
                $u       = get_user_by( 'email', $customer_email );
                $user_id = $u ? $u->ID : 0;
            }
        }

        if ( ! $user_id ) {
            wp_die( esc_html__( 'Could not identify member for this payment.', 'culture-community' ) );
        }

        $tier = in_array( $tier, array( 'patron', 'lit' ), true )
            ? $tier
            : ( get_user_meta( $user_id, '_culture_pending_tier', true ) ?: 'patron' );
        $tier = in_array( $tier, array( 'patron', 'lit' ), true ) ? $tier : 'patron';

        update_user_meta( $user_id, '_culture_membership_tier', $tier );
        update_user_meta( $user_id, '_culture_flw_customer_id', (int) ( $data['customer']['id'] ?? 0 ) );
        delete_user_meta( $user_id, '_culture_pending_tier' );
        delete_user_meta( $user_id, '_culture_flw_tx_ref' );

        do_action( 'culture_payment_completed', $user_id, $data );

        // Determine the return URL the checkout embedded in the callback param.
        $return_url = '';
        if ( ! empty( $_GET['flw_return'] ) ) {
            $raw        = sanitize_text_field( wp_unslash( $_GET['flw_return'] ) );
            $frontend   = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
            // Only honour the return URL if it begins with the trusted frontend
            // origin — prevents an open redirect if someone tampers with the param.
            if ( str_starts_with( $raw, $frontend ) ) {
                $return_url = $raw;
            }
        }

        if ( ! $return_url ) {
            $return_url = get_option( 'culture_frontend_url', home_url( '/' ) );
        }

        wp_safe_redirect( add_query_arg( 'culture_upgraded', '1', $return_url ) );
        exit;
    }

    /**
     * Called from handle_callback() for the tokenised CMS-redirect checkout action.
     */
    private static function process_checkout_action() {
        $user_id = absint( $_GET['user_id'] ?? 0 );
        $token   = sanitize_text_field( $_GET['token'] ?? '' );

        $auth_header = '';
        if ( function_exists( 'getallheaders' ) ) {
            $headers     = getallheaders();
            $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        } elseif ( isset( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        }

        $is_authorized = false;
        if ( $auth_header && class_exists( 'Culture_REST_API' ) ) {
            $is_authorized = Culture_REST_API::verify_bearer_token( $auth_header );
        }

        if ( ! $is_authorized && ( ! $user_id || ! hash_equals( self::get_checkout_token( $user_id ), $token ) ) ) {
            wp_die( esc_html__( 'Invalid security token.', 'culture-community' ) );
        }

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            wp_die( esc_html__( 'User not found.', 'culture-community' ) );
        }

        $plan_key = sanitize_key( $_GET['plan_key'] ?? 'monthly_ngn' );
        $tier     = in_array( $_GET['tier'] ?? '', array( 'patron', 'lit' ), true ) ? $_GET['tier'] : 'patron';
        $parts    = explode( '_', $plan_key );
        $cycle    = $parts[0] ?? 'monthly';

        $plan_id = self::get_or_create_plan_id( $cycle, $tier );
        if ( is_wp_error( $plan_id ) ) {
            wp_die( esc_html( $plan_id->get_error_message() ) );
        }

        $callback_url = home_url( '/?culture_flw_callback=1' );

        update_user_meta( $user_id, '_culture_pending_tier', $tier );

        $result = Culture_Flutterwave::payment_initiate( array(
            'tx_ref'       => 'flw-sub-' . $user_id . '-' . time(),
            'amount'       => self::get_amount( $cycle, $tier ),
            'currency'     => 'NGN',
            'redirect_url' => $callback_url,
            'email'        => $user->user_email,
            'name'         => trim( $user->first_name . ' ' . $user->last_name ) ?: $user->display_name,
            'phone'        => get_user_meta( $user_id, '_culture_phone', true ) ?: '',
            'description'  => 'Moveee membership — ' . ucfirst( $cycle ),
            'title'        => 'Moveee',
            'payment_plan' => $plan_id,
            'meta'         => array(
                'user_id' => $user_id,
                'tier'    => $tier,
            ),
        ) );

        if ( is_wp_error( $result ) ) {
            wp_die( esc_html( $result->get_error_message() ) );
        }

        wp_safe_redirect( $result['url'] );
        exit;
    }

    /* ── Webhook ──────────────────────────────────────────────────────── */

    /**
     * REST callback for POST /culture/v1/flutterwave-member-webhook.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_webhook( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $hash_secret = get_option( 'culture_flutterwave_webhook_hash', '' );
        if ( $hash_secret ) {
            $verif_hash = $request->get_header( 'verif-hash' );
            if ( ! $verif_hash || ! hash_equals( $hash_secret, $verif_hash ) ) {
                return new \WP_Error( 'invalid_hash', 'Invalid webhook hash.', array( 'status' => 403 ) );
            }
        }

        $payload = json_decode( $request->get_body(), true ) ?? array();
        $event   = $payload['event'] ?? '';

        switch ( $event ) {
            case 'charge.completed':
                self::on_charge_completed( $payload['data'] ?? array() );
                break;

            case 'subscription.cancelled':
                self::on_subscription_cancelled( $payload['data'] ?? array() );
                break;
        }

        return rest_ensure_response( array( 'status' => 'ok' ) );
    }

    private static function on_charge_completed( array $data ): void {
        if ( ( $data['status'] ?? '' ) !== 'successful' ) {
            return;
        }

        $meta    = $data['meta'] ?? array();
        $user_id = (int) ( $meta['user_id'] ?? 0 );
        $tier    = $meta['tier'] ?? '';

        if ( ! $user_id ) {
            $email   = $data['customer']['email'] ?? '';
            $u       = $email ? get_user_by( 'email', $email ) : null;
            $user_id = $u ? $u->ID : 0;
        }

        if ( ! $user_id ) {
            return;
        }

        $tier = in_array( $tier, array( 'patron', 'lit' ), true )
            ? $tier
            : ( get_user_meta( $user_id, '_culture_pending_tier', true ) ?: 'patron' );
        $tier = in_array( $tier, array( 'patron', 'lit' ), true ) ? $tier : 'patron';

        update_user_meta( $user_id, '_culture_membership_tier', $tier );
        update_user_meta( $user_id, '_culture_subscription_status', 'active' );
        update_user_meta( $user_id, '_culture_flw_customer_id', (int) ( $data['customer']['id'] ?? 0 ) );
        delete_user_meta( $user_id, '_culture_pending_tier' );

        do_action( 'culture_payment_completed', $user_id, $data );
    }

    private static function on_subscription_cancelled( array $data ): void {
        $customer_id = (int) ( $data['customer']['id'] ?? 0 );
        if ( ! $customer_id ) {
            return;
        }

        $users = get_users( array(
            'meta_key'   => '_culture_flw_customer_id',
            'meta_value' => $customer_id,
            'number'     => 1,
            'fields'     => 'ID',
        ) );

        $user_id = ! empty( $users ) ? (int) $users[0] : 0;
        if ( ! $user_id ) {
            return;
        }

        update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
        update_user_meta( $user_id, '_culture_subscription_status', 'cancelled' );
    }
}
