<?php
/**
 * /services payment collection — one-time and subscription charges for
 * Media Services packages (Sponsored Content, Content Amplification, Media
 * Partnership, Happenings, Lifestyle & Commerce, Community Sponsorship),
 * via Flutterwave (NGN) and Stripe (GBP/USD). Mirrors Culture_Ticket_Payment's
 * shape closely — same gateway routing, same reference-prefix-then-metadata
 * pattern, same idempotent confirm — with two differences: the `/initiate`
 * route requires the Culture_REST_API API-key/bearer secret (not public)
 * because the true price for a package is resolved server-side in Next.js
 * from apps/site/app/services/market-data.ts (the single source of truth
 * for what a package costs) and passed here as already-trusted values —
 * this endpoint never re-derives a price from a client-supplied name alone,
 * so trust in the amount comes from the caller being Next.js itself, not
 * from re-validating the number; and it supports a recurring `subscription`
 * kind alongside the one-time `one_time` kind ticketing never needed.
 *
 * VAT: 7.5% is applied server-side on all transactions.  The `price_amount`
 * field in the request (and DB) is the base price before VAT; `vat_amount`
 * stores the computed VAT; the gateway is charged price_amount + vat_amount.
 *
 * Table: {prefix}culture_services_payments
 *
 * REST endpoints (all under /wp-json/culture/v1/):
 *   POST services/payment/initiate               — create pending payment + start gateway session (bearer-gated)
 *   GET  services/payment/callback               — Paystack post-payment browser redirect (legacy, kept for compat)
 *   GET  services/payment/callback/flutterwave   — Flutterwave post-payment browser redirect
 *   POST services/payment/webhook/paystack       — Paystack charge.success webhook (legacy, kept)
 *   POST services/payment/webhook/stripe         — Stripe checkout.session.completed webhook
 *   POST services/payment/webhook/flutterwave    — Flutterwave charge.completed webhook
 *   GET  services/payment/status                 — read-only status poll by code (Stripe pending state)
 *
 * Webhook URLs to configure in payment dashboards:
 *   Flutterwave: {site}/wp-json/culture/v1/services/payment/webhook/flutterwave
 *   Stripe:      {site}/wp-json/culture/v1/services/payment/webhook/stripe
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Services_Payment {

    const TABLE = 'culture_services_payments';
    const VAT_RATE = 0.075; // 7.5%

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    public static function init(): void {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function table(): string {
        global $wpdb;
        return $wpdb->prefix . self::TABLE;
    }

    // ── DB table ──────────────────────────────────────────────────────────────

    public static function create_table(): void {
        global $wpdb;
        $t  = self::table();
        $cs = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( "CREATE TABLE {$t} (
            id                bigint(20)   NOT NULL AUTO_INCREMENT,
            payment_code      varchar(64)  NOT NULL DEFAULT '',
            market            varchar(20)  NOT NULL DEFAULT '',
            section_id        varchar(60)  NOT NULL DEFAULT '',
            item_name         varchar(200) NOT NULL DEFAULT '',
            item_kind         varchar(20)  NOT NULL DEFAULT 'one_time',
            price_amount      int(11)      NOT NULL DEFAULT 0,
            vat_amount        int(11)      NOT NULL DEFAULT 0,
            price_currency    varchar(10)  NOT NULL DEFAULT 'GBP',
            buyer_name        varchar(200) NOT NULL DEFAULT '',
            buyer_email       varchar(200) NOT NULL DEFAULT '',
            payment_gateway   varchar(20)  NOT NULL DEFAULT '',
            payment_reference varchar(200) NOT NULL DEFAULT '',
            payment_status    varchar(20)  NOT NULL DEFAULT 'pending',
            status            varchar(20)  NOT NULL DEFAULT 'pending',
            ip_address        varchar(100) NOT NULL DEFAULT '',
            created_at        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY payment_code (payment_code),
            KEY payment_reference (payment_reference),
            KEY buyer_email (buyer_email)
        ) {$cs};" );
    }

    // ── REST routes ───────────────────────────────────────────────────────────

    public static function register_routes(): void {

        register_rest_route( 'culture/v1', '/services/payment/initiate', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_initiate' ],
            'permission_callback' => [ 'Culture_REST_API', 'api_key_permission' ],
            'args'                => [
                'name'           => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'email'          => [ 'required' => true,  'sanitize_callback' => 'sanitize_email', 'validate_callback' => 'is_email' ],
                'market'         => [ 'required' => true,  'sanitize_callback' => 'sanitize_key' ],
                'section_id'     => [ 'required' => true,  'sanitize_callback' => 'sanitize_key' ],
                'item_name'      => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'item_kind'      => [ 'required' => false, 'sanitize_callback' => 'sanitize_key' ],
                'price_amount'   => [ 'required' => true,  'validate_callback' => fn( $v ) => is_numeric( $v ) && (int) $v > 0 ],
                'price_currency' => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        // Flutterwave post-payment browser redirect.
        register_rest_route( 'culture/v1', '/services/payment/callback/flutterwave', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_flutterwave_callback' ],
            'permission_callback' => '__return_true',
        ] );

        // Legacy Paystack callback (kept for any in-flight transactions).
        register_rest_route( 'culture/v1', '/services/payment/callback', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_paystack_callback' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/services/payment/webhook/flutterwave', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_flutterwave_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/services/payment/webhook/paystack', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_paystack_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/services/payment/webhook/stripe', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_stripe_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/services/payment/status', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_status' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'code' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );
    }

    // ── Initiate payment ──────────────────────────────────────────────────────

    public static function handle_initiate( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $t = self::table();

        $name           = $req->get_param( 'name' );
        $email          = $req->get_param( 'email' );
        $market         = $req->get_param( 'market' );
        $section_id     = $req->get_param( 'section_id' );
        $item_name      = $req->get_param( 'item_name' );
        $item_kind      = 'subscription' === $req->get_param( 'item_kind' ) ? 'subscription' : 'one_time';
        $price_amount   = (int) $req->get_param( 'price_amount' ); // base price, before VAT
        $price_currency = strtoupper( $req->get_param( 'price_currency' ) ?? 'GBP' );
        $ip             = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );

        if ( ! in_array( $price_currency, [ 'GBP', 'USD', 'NGN' ], true ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_currency', 'message' => 'Unsupported currency.' ], 400 );
        }

        // Apply 7.5% VAT.
        $vat_amount   = (int) round( $price_amount * self::VAT_RATE );
        $total_amount = $price_amount + $vat_amount;

        // Route: NGN → Flutterwave, everything else → Stripe.
        $gateway = ( 'NGN' === $price_currency ) ? 'flutterwave' : 'stripe';

        $payment_code = 'SVC-' . strtoupper( bin2hex( random_bytes( 8 ) ) );

        $ok = $wpdb->insert( $t, [
            'payment_code'   => $payment_code,
            'market'         => $market,
            'section_id'     => $section_id,
            'item_name'      => $item_name,
            'item_kind'      => $item_kind,
            'price_amount'   => $price_amount,
            'vat_amount'     => $vat_amount,
            'price_currency' => $price_currency,
            'buyer_name'     => $name,
            'buyer_email'    => $email,
            'payment_gateway'=> $gateway,
            'status'         => 'pending',
            'payment_status' => 'pending',
            'ip_address'     => $ip,
        ], [ '%s','%s','%s','%s','%s','%d','%d','%s','%s','%s','%s','%s','%s','%s' ] );

        if ( ! $ok ) {
            return new WP_REST_Response( [ 'error' => 'db_error', 'message' => 'Could not start checkout. Please try again.' ], 500 );
        }

        // total_amount in major units → minor units for the gateway.
        $amount_minor = $total_amount * 100;

        $result = ( 'flutterwave' === $gateway )
            ? self::init_flutterwave( $payment_code, $name, $email, $total_amount, $price_currency, $item_name, $item_kind )
            : self::init_stripe(      $payment_code, $name, $email, $amount_minor, $price_currency, $item_name, $item_kind );

        if ( is_wp_error( $result ) ) {
            $wpdb->delete( $t, [ 'payment_code' => $payment_code ], [ '%s' ] );
            return new WP_REST_Response( [ 'error' => 'payment_error', 'message' => $result->get_error_message() ], 502 );
        }

        $wpdb->update( $t, [ 'payment_reference' => $result['reference'] ], [ 'payment_code' => $payment_code ], [ '%s' ], [ '%s' ] );

        return new WP_REST_Response( [
            'payment_url'  => $result['url'],
            'payment_code' => $payment_code,
            'vat_amount'   => $vat_amount,
            'total_amount' => $total_amount,
        ], 200 );
    }

    // ── Flutterwave — one-time charge or plan-backed subscription ─────────────

    private static function init_flutterwave(
        string $code, string $name, string $email,
        int $total_amount, string $currency, string $item_name, string $item_kind
    ): array|\WP_Error {

        if ( ! class_exists( 'Culture_Flutterwave' ) || ! Culture_Flutterwave::is_configured() ) {
            return new \WP_Error( 'flutterwave_unconfigured', 'Flutterwave is not configured.' );
        }

        $tx_ref       = 'flw-svc-' . $code;
        $callback_url = rest_url( 'culture/v1/services/payment/callback/flutterwave' );

        $args = [
            'tx_ref'       => $tx_ref,
            'amount'       => (float) $total_amount,
            'currency'     => $currency,
            'redirect_url' => $callback_url,
            'email'        => $email,
            'name'         => $name,
            'description'  => $item_name,
            'title'        => 'The Moveee Services',
        ];

        if ( 'subscription' === $item_kind ) {
            $plan_id = self::get_or_create_flutterwave_plan( $item_name, $total_amount, $currency );
            if ( is_wp_error( $plan_id ) ) return $plan_id;
            $args['payment_plan'] = $plan_id;
        }

        $result = Culture_Flutterwave::payment_initiate( $args );
        if ( is_wp_error( $result ) ) return $result;

        return [
            'url'       => $result['url'],
            'reference' => $tx_ref,
        ];
    }

    /**
     * Auto-create a Flutterwave payment plan for a subscription service package
     * (monthly recurring).  Plan IDs are cached in wp_options so the same
     * package reuses the same plan across checkouts.
     */
    private static function get_or_create_flutterwave_plan( string $item_name, int $amount, string $currency ): int|\WP_Error {
        $key    = 'culture_flw_svc_plan_' . md5( $item_name . '|' . $amount . '|' . $currency );
        $cached = (int) get_option( $key, 0 );
        if ( $cached > 0 ) return $cached;

        $secret = getenv( 'FLUTTERWAVE_SECRET_KEY' )
            ?: (string) get_option( 'culture_flutterwave_secret_key', '' );
        if ( empty( $secret ) ) {
            return new \WP_Error( 'flutterwave_unconfigured', 'Flutterwave secret key is not configured.' );
        }

        $response = wp_remote_post( Culture_Flutterwave::API_BASE . '/payment-plans', [
            'headers' => [
                'Authorization' => 'Bearer ' . $secret,
                'Content-Type'  => 'application/json',
            ],
            'timeout' => 30,
            'body'    => wp_json_encode( [
                'name'     => $item_name . ' — Monthly',
                'amount'   => $amount,
                'interval' => 'monthly',
                'currency' => $currency,
            ] ),
        ] );

        if ( is_wp_error( $response ) ) return $response;

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            return new \WP_Error( 'flutterwave_api', $body['message'] ?? "Flutterwave returned HTTP {$code}" );
        }

        $plan_id = (int) ( $body['data']['id'] ?? 0 );
        if ( ! $plan_id ) {
            return new \WP_Error( 'flutterwave_no_plan', 'Flutterwave did not return a plan ID.' );
        }

        update_option( $key, $plan_id, false );
        return $plan_id;
    }

    // ── Stripe — one-time or subscription Checkout Session ─────────────────

    private static function init_stripe(
        string $code, string $name, string $email,
        int $amount, string $currency, string $item_name, string $item_kind
    ): array|\WP_Error {

        $frontend_url = untrailingslashit( get_option( 'culture_frontend_url', home_url( '/' ) ) );
        $success_url  = $frontend_url . '/services/checkout?service_pending=' . $code . '&session_id={CHECKOUT_SESSION_ID}';
        $cancel_url   = $frontend_url . '/services/checkout?service_cancelled=1';

        $price_data = [
            'currency'     => strtolower( $currency ),
            'unit_amount'  => $amount,
            'product_data' => [
                'name' => 'subscription' === $item_kind ? $item_name . ' — Monthly' : $item_name,
            ],
        ];
        if ( 'subscription' === $item_kind ) {
            $price_data['recurring'] = [ 'interval' => 'month' ];
        }

        $response = Culture_Stripe::payment_session( [
            'mode'                => 'subscription' === $item_kind ? 'subscription' : 'payment',
            'client_reference_id' => $code,
            'customer_email'      => $email,
            'success_url'         => $success_url,
            'cancel_url'          => $cancel_url,
            'line_items'          => [ [
                'price_data' => $price_data,
                'quantity'   => 1,
            ] ],
            'metadata' => [
                'payment_code' => $code,
                'buyer_name'   => $name,
            ],
        ] );

        if ( is_wp_error( $response ) ) return $response;
        if ( empty( $response['url'] ) ) {
            return new \WP_Error( 'stripe_error', 'Could not initialize Stripe payment.' );
        }

        return [
            'url'       => $response['url'],
            'reference' => $response['id'] ?? '',
        ];
    }

    // ── Flutterwave callback (browser redirect after payment) ─────────────────

    public static function handle_flutterwave_callback( WP_REST_Request $req ) {
        $transaction_id = (int) ( $req->get_param( 'transaction_id' ) ?: 0 );
        $status         = sanitize_key( $req->get_param( 'status' ) ?: '' );
        $tx_ref         = sanitize_text_field( $req->get_param( 'tx_ref' ) ?: '' );

        $frontend = untrailingslashit( get_option( 'culture_frontend_url', home_url( '/' ) ) );
        $base     = $frontend . '/services/checkout';
        $fail_url = $base . '?service_failed=1';

        if ( 'successful' !== $status || ! $transaction_id ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        // Verify with Flutterwave.
        if ( ! class_exists( 'Culture_Flutterwave' ) ) {
            wp_safe_redirect( $fail_url ); exit;
        }
        $data = Culture_Flutterwave::verify_transaction( $transaction_id );
        if ( is_wp_error( $data ) || ( $data['status'] ?? '' ) !== 'successful' ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        // Resolve payment_code from tx_ref (format: flw-svc-{payment_code}).
        $resolved_tx = $data['tx_ref'] ?? $tx_ref;
        $code        = '';
        if ( preg_match( '/^flw-svc-(.+)$/', $resolved_tx, $m ) ) {
            $code = $m[1];
        }

        if ( ! $code || ! self::confirm_payment( $code, $resolved_tx, 'flutterwave' ) ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        wp_safe_redirect( $base . '?service_confirmed=' . urlencode( $code ) );
        exit;
    }

    // ── Legacy Paystack callback (browser redirect after payment) ─────────────

    public static function handle_paystack_callback( WP_REST_Request $req ) {
        $reference = sanitize_text_field( $req->get_param( 'reference' ) ?: $req->get_param( 'trxref' ) ?: '' );
        $code      = sanitize_text_field( $req->get_param( 'code' ) ?: '' );

        $frontend = untrailingslashit( get_option( 'culture_frontend_url', home_url( '/' ) ) );
        $base     = $frontend . '/services/checkout';
        $fail_url = $base . '?service_failed=1';

        if ( ! $reference ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        $verify = Culture_Paystack::verify_transaction( $reference );
        if ( is_wp_error( $verify ) || ( $verify['data']['status'] ?? '' ) !== 'success' ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        $meta          = $verify['data']['metadata'] ?? [];
        $resolved_code = $meta['payment_code'] ?? $code;

        if ( ! $resolved_code || ! self::confirm_payment( $resolved_code, $reference, 'paystack' ) ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        wp_safe_redirect( $base . '?service_confirmed=' . urlencode( $resolved_code ) );
        exit;
    }

    // ── Flutterwave webhook ───────────────────────────────────────────────────

    public static function handle_flutterwave_webhook( WP_REST_Request $req ): WP_REST_Response {
        $hash   = $req->get_header( 'verif-hash' ) ?: $req->get_header( 'verif_hash' ) ?: '';
        $secret = get_option( 'culture_flutterwave_webhook_hash', '' );

        if ( $secret && ! hash_equals( $secret, $hash ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_signature' ], 403 );
        }

        self::dispatch_flutterwave_event( $req->get_json_params() ?? [] );
        return new WP_REST_Response( [ 'status' => 'ok' ], 200 );
    }

    /**
     * Process a pre-verified Flutterwave payload (called by unified webhook dispatcher).
     */
    public static function dispatch_flutterwave_event( array $payload ): void {
        $event = $payload['event'] ?? '';
        $data  = $payload['data'] ?? [];

        if ( 'charge.completed' !== $event || ( $data['status'] ?? '' ) !== 'successful' ) {
            return;
        }

        $tx_ref = $data['tx_ref'] ?? '';
        if ( preg_match( '/^flw-svc-(.+)$/', $tx_ref, $m ) ) {
            self::confirm_payment( $m[1], $tx_ref, 'flutterwave' );
        }
    }

    // ── Legacy Paystack webhook ───────────────────────────────────────────────

    public static function handle_paystack_webhook( WP_REST_Request $req ): WP_REST_Response {
        $payload   = $req->get_body();
        $signature = $req->get_header( 'x-paystack-signature' ) ?? '';
        $secret    = get_option( 'culture_paystack_secret_key', '' );

        if ( $secret && ! hash_equals( hash_hmac( 'sha512', $payload, $secret ), $signature ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_signature' ], 403 );
        }

        $data  = json_decode( $payload, true );
        $event = $data['event'] ?? '';

        if ( 'charge.success' === $event ) {
            $d         = $data['data'] ?? [];
            $reference = $d['reference'] ?? '';
            $meta      = $d['metadata'] ?? [];
            $code      = $meta['payment_code'] ?? '';

            if ( $code && str_starts_with( $reference, 'SVC-' ) ) {
                self::confirm_payment( $code, $reference, 'paystack' );
            }
        }

        return new WP_REST_Response( [ 'status' => 'ok' ], 200 );
    }

    // ── Stripe webhook ────────────────────────────────────────────────────────

    public static function handle_stripe_webhook( WP_REST_Request $req ): WP_REST_Response {
        $payload = $req->get_body();
        $data    = json_decode( $payload, true );

        if ( ! $data || ! isset( $data['type'] ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_payload' ], 400 );
        }

        $webhook_secret = get_option( 'culture_stripe_webhook_secret', '' );
        if ( $webhook_secret ) {
            $sig = $req->get_header( 'stripe-signature' ) ?? '';
            if ( ! self::verify_stripe_sig( $payload, $sig, $webhook_secret ) ) {
                return new WP_REST_Response( [ 'error' => 'invalid_signature' ], 403 );
            }
        }

        if ( 'checkout.session.completed' === $data['type'] ) {
            $session = $data['data']['object'] ?? [];
            $meta    = $session['metadata'] ?? [];
            $code    = $meta['payment_code'] ?? '';
            $ref     = $session['id'] ?? '';

            if ( $code ) {
                self::confirm_payment( $code, $ref, 'stripe' );
            }
        }

        return new WP_REST_Response( [ 'status' => 'ok' ], 200 );
    }

    // ── Status (frontend polling) ─────────────────────────────────────────────

    public static function handle_status( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $payment = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::table() . " WHERE payment_code = %s LIMIT 1",
            $req->get_param( 'code' )
        ) );

        if ( ! $payment ) {
            return new WP_REST_Response( [ 'error' => 'not_found' ], 404 );
        }

        return new WP_REST_Response( [
            'status'  => $payment->status,
            'payment' => self::payment_summary( $payment ),
        ], 200 );
    }

    // ── Internal: confirm payment ─────────────────────────────────────────────

    private static function confirm_payment( string $code, string $reference, string $gateway ): bool {
        global $wpdb;
        $t = self::table();

        $payment = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE payment_code = %s LIMIT 1", $code ) );
        if ( ! $payment ) return false;

        if ( 'confirmed' === $payment->status ) return true;

        $updated = $wpdb->update( $t, [
            'status'            => 'confirmed',
            'payment_status'    => 'paid',
            'payment_reference' => $reference,
            'payment_gateway'   => $gateway,
        ], [ 'payment_code' => $code ], [ '%s', '%s', '%s', '%s' ], [ '%s' ] );

        if ( ! $updated ) return false;

        $payment = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE payment_code = %s LIMIT 1", $code ) );
        self::send_confirmation_emails( $payment );

        return true;
    }

    // ── Confirmation emails ───────────────────────────────────────────────────

    private static function send_confirmation_emails( object $payment ): void {
        $first   = explode( ' ', trim( $payment->buyer_name ) )[0] ?: $payment->buyer_name;
        $symbol  = match ( strtoupper( $payment->price_currency ) ) {
            'USD'   => '$',
            'NGN'   => '₦',
            default => '£',
        };

        $vat_amount   = (int) ( $payment->vat_amount ?? 0 );
        $base_amount  = (int) $payment->price_amount;
        $total_amount = $base_amount + $vat_amount;
        $cadence      = 'subscription' === $payment->item_kind ? ' / month' : '';
        $subject      = "Payment received — {$payment->item_name} · The Moveee";

        $html  = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3ece0;font-family:Georgia,serif;">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ece0;padding:48px 20px;"><tr><td align="center">';
        $html .= '<table width="580" cellpadding="0" cellspacing="0" style="background:#14110d;overflow:hidden;">';

        $html .= '<tr><td style="padding:36px 48px 24px;border-bottom:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#7a241c;">The Moveee · Services</p>';
        $html .= '</td></tr>';

        $html .= '<tr><td style="padding:40px 48px;color:#f3ece0;">';
        $html .= '<h1 style="margin:0 0 8px;font-size:32px;font-weight:400;line-height:1.2;color:#f3ece0;">Payment received,<br><em style="color:#7a241c;font-style:italic;">' . esc_html( $first ) . '.</em></h1>';
        $html .= '<p style="margin:16px 0 32px;font-size:16px;font-style:italic;color:rgba(243,236,224,0.65);">' . esc_html( $payment->item_name ) . '</p>';

        $rows = [
            [ 'Sub-total',   $symbol . number_format( $base_amount ) . $cadence ],
            [ 'VAT (7.5%)',  $symbol . number_format( $vat_amount ) ],
            [ 'Total',       $symbol . number_format( $total_amount ) . $cadence ],
            [ 'Reference',   $payment->payment_code ],
            [ 'Name',        $payment->buyer_name ],
            [ 'Email',       $payment->buyer_email ],
        ];
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(243,236,224,0.15);margin-bottom:28px;">';
        foreach ( $rows as [ $label, $value ] ) {
            $is_total = 'Total' === $label;
            $row_style = $is_total ? 'border-top:1px solid rgba(243,236,224,0.3);' : '';
            $val_style = $is_total ? 'font-weight:700;color:#f3ece0;' : 'color:#f3ece0;';
            $html .= '<tr style="' . $row_style . '">';
            $html .= '<td style="padding:11px 16px;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.4);border-bottom:1px solid rgba(243,236,224,0.08);">' . esc_html( $label ) . '</td>';
            $html .= '<td style="padding:11px 16px;font-size:14px;' . $val_style . 'text-align:right;border-bottom:1px solid rgba(243,236,224,0.08);">' . esc_html( $value ) . '</td>';
            $html .= '</tr>';
        }
        $html .= '</table>';

        $html .= '<p style="margin:0;font-family:sans-serif;font-size:13px;color:rgba(243,236,224,0.4);line-height:1.6;">Our team will be in touch shortly to kick things off. Keep this email as your receipt.</p>';
        $html .= '</td></tr>';

        $html .= '<tr><td style="padding:24px 48px;border-top:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.2);">themoveee.com · The Moveee</p>';
        $html .= '</td></tr>';
        $html .= '</table></td></tr></table></body></html>';

        wp_mail(
            $payment->buyer_email,
            $subject,
            $html,
            [ 'Content-Type: text/html; charset=UTF-8', 'From: The Moveee Services <services@themoveee.com>' ]
        );

        $total_display = $symbol . number_format( $total_amount ) . $cadence;
        wp_mail(
            get_option( 'admin_email' ),
            "[SERVICES PAYMENT] {$payment->item_name} — {$payment->buyer_name}",
            "New paid service:\n\nName: {$payment->buyer_name}\nEmail: {$payment->buyer_email}\nMarket: {$payment->market}\nSection: {$payment->section_id}\nItem: {$payment->item_name}\nKind: {$payment->item_kind}\nBase: {$symbol}" . number_format( $base_amount ) . "\nVAT: {$symbol}" . number_format( $vat_amount ) . "\nTotal: {$total_display}\nRef: {$payment->payment_code}\nGateway: {$payment->payment_gateway}",
            [ 'From: The Moveee Services <services@themoveee.com>' ]
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static function payment_summary( object $payment ): array {
        $vat_amount   = (int) ( $payment->vat_amount ?? 0 );
        $base_amount  = (int) $payment->price_amount;
        return [
            'payment_code'   => $payment->payment_code,
            'item_name'      => $payment->item_name,
            'item_kind'      => $payment->item_kind,
            'price_amount'   => $base_amount,
            'vat_amount'     => $vat_amount,
            'total_amount'   => $base_amount + $vat_amount,
            'price_currency' => $payment->price_currency,
            'status'         => $payment->status,
            'created_at'     => $payment->created_at,
        ];
    }

    private static function verify_stripe_sig( string $payload, string $sig_header, string $secret ): bool {
        $parts = [];
        foreach ( explode( ',', $sig_header ) as $part ) {
            [ $k, $v ] = array_pad( explode( '=', $part, 2 ), 2, '' );
            $parts[ trim( $k ) ] = trim( $v );
        }
        $ts  = $parts['t']  ?? '';
        $sig = $parts['v1'] ?? '';
        if ( ! $ts || ! $sig ) return false;
        return hash_equals( hash_hmac( 'sha256', "{$ts}.{$payload}", $secret ), $sig );
    }
}
