<?php
/**
 * /services payment collection — one-time and subscription charges for
 * Media Services packages (Sponsored Content, Content Amplification, Media
 * Partnership, Happenings, Lifestyle & Commerce, Community Sponsorship),
 * via Paystack (NGN) and Stripe (GBP/USD). Mirrors Culture_Ticket_Payment's
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
 * Table: {prefix}culture_services_payments
 *
 * REST endpoints (all under /wp-json/culture/v1/):
 *   POST services/payment/initiate         — create pending payment + start gateway session (bearer-gated)
 *   GET  services/payment/callback         — Paystack post-payment browser redirect
 *   POST services/payment/webhook/paystack — Paystack charge.success webhook
 *   POST services/payment/webhook/stripe   — Stripe checkout.session.completed webhook
 *   GET  services/payment/status           — read-only status poll by code (Stripe pending state)
 *
 * Webhook URLs to configure in payment dashboards:
 *   Paystack: {site}/wp-json/culture/v1/services/payment/webhook/paystack
 *   Stripe:   {site}/wp-json/culture/v1/services/payment/webhook/stripe
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Services_Payment {

    const TABLE = 'culture_services_payments';

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

        register_rest_route( 'culture/v1', '/services/payment/callback', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_paystack_callback' ],
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
        $price_amount   = (int) $req->get_param( 'price_amount' );
        $price_currency = strtoupper( $req->get_param( 'price_currency' ) ?? 'GBP' );
        $ip             = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );

        if ( ! in_array( $price_currency, [ 'GBP', 'USD', 'NGN' ], true ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_currency', 'message' => 'Unsupported currency.' ], 400 );
        }

        // Route: NGN → Paystack, everything else → Stripe
        $gateway = ( 'NGN' === $price_currency ) ? 'paystack' : 'stripe';

        $payment_code = 'SVC-' . strtoupper( bin2hex( random_bytes( 8 ) ) );

        $ok = $wpdb->insert( $t, [
            'payment_code'   => $payment_code,
            'market'         => $market,
            'section_id'     => $section_id,
            'item_name'      => $item_name,
            'item_kind'      => $item_kind,
            'price_amount'   => $price_amount,
            'price_currency' => $price_currency,
            'buyer_name'     => $name,
            'buyer_email'    => $email,
            'payment_gateway'=> $gateway,
            'status'         => 'pending',
            'payment_status' => 'pending',
            'ip_address'     => $ip,
        ], [ '%s','%s','%s','%s','%s','%d','%s','%s','%s','%s','%s','%s','%s' ] );

        if ( ! $ok ) {
            return new WP_REST_Response( [ 'error' => 'db_error', 'message' => 'Could not start checkout. Please try again.' ], 500 );
        }

        $amount_minor = $price_amount * 100; // major → lowest unit (kobo / cents / pence)

        $result = ( 'paystack' === $gateway )
            ? self::init_paystack( $payment_code, $name, $email, $amount_minor, $price_currency, $item_name, $item_kind )
            : self::init_stripe(   $payment_code, $name, $email, $amount_minor, $price_currency, $item_name, $item_kind );

        if ( is_wp_error( $result ) ) {
            $wpdb->delete( $t, [ 'payment_code' => $payment_code ], [ '%s' ] );
            return new WP_REST_Response( [ 'error' => 'payment_error', 'message' => $result->get_error_message() ], 502 );
        }

        $wpdb->update( $t, [ 'payment_reference' => $result['reference'] ], [ 'payment_code' => $payment_code ], [ '%s' ], [ '%s' ] );

        return new WP_REST_Response( [
            'payment_url'  => $result['url'],
            'payment_code' => $payment_code,
        ], 200 );
    }

    // ── Paystack — one-time charge or plan-backed subscription charge ──────

    private static function init_paystack(
        string $code, string $name, string $email,
        int $amount, string $currency, string $item_name, string $item_kind
    ): array|\WP_Error {

        $callback_url = add_query_arg( [ 'gateway' => 'paystack', 'code' => $code ], rest_url( 'culture/v1/services/payment/callback' ) );

        $params = [
            'email'        => $email,
            'amount'       => $amount,
            'currency'     => $currency,
            'reference'    => 'SVC-' . $code,
            'callback_url' => $callback_url,
            'metadata'     => [
                'payment_code' => $code,
                'buyer_name'   => $name,
                'custom_fields' => [ [
                    'display_name'  => 'Service',
                    'variable_name' => 'service',
                    'value'         => $item_name,
                ] ],
            ],
        ];

        if ( 'subscription' === $item_kind ) {
            $plan_code = self::get_or_create_paystack_plan( $item_name, $amount, $currency );
            if ( is_wp_error( $plan_code ) ) return $plan_code;
            $params['plan'] = $plan_code;
        }

        $response = Culture_Paystack::charge_initiate( $params );

        if ( is_wp_error( $response ) ) return $response;
        if ( empty( $response['data']['authorization_url'] ) ) {
            return new \WP_Error( 'paystack_error', 'Could not initialize Paystack payment.' );
        }

        return [
            'url'       => $response['data']['authorization_url'],
            'reference' => $response['data']['reference'],
        ];
    }

    /**
     * Paystack subscriptions are billed against a pre-created Plan, not a
     * bare amount — create one on first use for a given (name, amount,
     * currency) combination and cache its plan_code so repeat checkouts for
     * the same package reuse it instead of littering the Paystack dashboard
     * with a fresh plan per click.
     */
    private static function get_or_create_paystack_plan( string $item_name, int $amount, string $currency ): string|\WP_Error {
        $key    = 'culture_svc_plan_' . md5( $item_name . '|' . $amount . '|' . $currency );
        $cached = get_option( $key, '' );
        if ( $cached ) return $cached;

        $response = self::paystack_create_plan( $item_name, $amount, $currency );
        if ( is_wp_error( $response ) ) return $response;

        $plan_code = $response['data']['plan_code'] ?? '';
        if ( ! $plan_code ) {
            return new \WP_Error( 'paystack_error', 'Could not create Paystack subscription plan.' );
        }

        update_option( $key, $plan_code, false );
        return $plan_code;
    }

    private static function paystack_create_plan( string $item_name, int $amount, string $currency ): array|\WP_Error {
        // Culture_Paystack has no generic POST helper beyond charge_initiate
        // (which always hits /transaction/initialize), so /plan is called
        // directly via the same secret-key + Bearer-auth convention.
        $secret = get_option( 'culture_paystack_secret_key', '' );
        if ( empty( $secret ) ) {
            return new \WP_Error( 'missing_api_key', 'Paystack Secret Key is not configured.' );
        }

        $response = wp_remote_post( 'https://api.paystack.co/plan', [
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

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code >= 400 ) {
            return new \WP_Error( 'paystack_error', $body['message'] ?? 'Paystack API error.', [ 'status' => $code ] );
        }

        return $body;
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

    // ── Paystack callback (browser redirect after payment) ────────────────

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

    // ── Paystack webhook ──────────────────────────────────────────────────

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

            // Only handle service-payment charges (reference prefixed with SVC-)
            if ( $code && str_starts_with( $reference, 'SVC-' ) ) {
                self::confirm_payment( $code, $reference, 'paystack' );
            }
        }

        return new WP_REST_Response( [ 'status' => 'ok' ], 200 );
    }

    // ── Stripe webhook ────────────────────────────────────────────────────

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

    // ── Status (frontend polling) ─────────────────────────────────────────

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

    // ── Internal: confirm payment ──────────────────────────────────────────

    private static function confirm_payment( string $code, string $reference, string $gateway ): bool {
        global $wpdb;
        $t = self::table();

        $payment = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE payment_code = %s LIMIT 1", $code ) );
        if ( ! $payment ) return false;

        // Idempotent — either the Paystack browser callback or the webhook
        // (whichever fires first) wins; the other is a no-op.
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

    // ── Confirmation emails ──────────────────────────────────────────────

    private static function send_confirmation_emails( object $payment ): void {
        $first   = explode( ' ', trim( $payment->buyer_name ) )[0] ?: $payment->buyer_name;
        $symbol  = match ( strtoupper( $payment->price_currency ) ) {
            'USD'   => '$',
            'NGN'   => '₦',
            default => '£',
        };
        $amount_display = $symbol . number_format( (float) $payment->price_amount );
        $cadence        = 'subscription' === $payment->item_kind ? ' / month' : '';
        $subject        = "Payment received — {$payment->item_name} · The Moveee";

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
            [ 'Amount', $amount_display . $cadence ],
            [ 'Reference', $payment->payment_code ],
            [ 'Name', $payment->buyer_name ],
            [ 'Email', $payment->buyer_email ],
        ];
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(243,236,224,0.15);margin-bottom:28px;">';
        foreach ( $rows as [ $label, $value ] ) {
            $html .= '<tr>';
            $html .= '<td style="padding:11px 16px;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.4);border-bottom:1px solid rgba(243,236,224,0.08);">' . esc_html( $label ) . '</td>';
            $html .= '<td style="padding:11px 16px;font-size:14px;color:#f3ece0;text-align:right;border-bottom:1px solid rgba(243,236,224,0.08);">' . esc_html( $value ) . '</td>';
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

        wp_mail(
            get_option( 'admin_email' ),
            "[SERVICES PAYMENT] {$payment->item_name} — {$payment->buyer_name}",
            "New paid service:\n\nName: {$payment->buyer_name}\nEmail: {$payment->buyer_email}\nMarket: {$payment->market}\nSection: {$payment->section_id}\nItem: {$payment->item_name}\nKind: {$payment->item_kind}\nAmount: {$amount_display}{$cadence}\nRef: {$payment->payment_code}\nGateway: {$payment->payment_gateway}",
            [ 'From: The Moveee Services <services@themoveee.com>' ]
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static function payment_summary( object $payment ): array {
        return [
            'payment_code'   => $payment->payment_code,
            'item_name'      => $payment->item_name,
            'item_kind'      => $payment->item_kind,
            'price_amount'   => $payment->price_amount,
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
