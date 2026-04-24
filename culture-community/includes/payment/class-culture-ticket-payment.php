<?php
/**
 * Event ticketing — paid ticket flow via Paystack (NGN) and Stripe (USD/EUR/GBP).
 *
 * Table: {prefix}culture_tickets
 *
 * REST endpoints (all under /wp-json/culture/v1/):
 *   POST ticket/initiate           — create pending ticket + start payment session
 *   GET  ticket/callback           — Paystack post-payment browser redirect
 *   POST ticket/webhook/paystack   — Paystack charge.success webhook
 *   POST ticket/webhook/stripe     — Stripe checkout.session.completed webhook
 *   POST ticket/verify             — scan/verify ticket code at door (staff only)
 *   GET  ticket/status             — read-only status poll by code
 *
 * Webhook URLs to configure in payment dashboards:
 *   Paystack: {site}/wp-json/culture/v1/ticket/webhook/paystack
 *   Stripe:   {site}/wp-json/culture/v1/ticket/webhook/stripe
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Ticket_Payment {

    const TABLE  = 'culture_tickets';
    const ORIGIN = 'https://themoveee.com';

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
            ticket_code       varchar(64)  NOT NULL DEFAULT '',
            event_slug        varchar(200) NOT NULL DEFAULT '',
            event_title       varchar(500) NOT NULL DEFAULT '',
            ticket_type_slug  varchar(100) NOT NULL DEFAULT '',
            ticket_type_name  varchar(200) NOT NULL DEFAULT '',
            price_amount      int(11)      NOT NULL DEFAULT 0,
            price_currency    varchar(10)  NOT NULL DEFAULT 'NGN',
            payment_gateway   varchar(20)  NOT NULL DEFAULT '',
            payment_reference varchar(200) NOT NULL DEFAULT '',
            payment_status    varchar(20)  NOT NULL DEFAULT 'pending',
            attendee_name     varchar(200) NOT NULL DEFAULT '',
            attendee_email    varchar(200) NOT NULL DEFAULT '',
            source            varchar(200) NOT NULL DEFAULT '',
            status            varchar(20)  NOT NULL DEFAULT 'pending',
            checked_in_at     datetime     DEFAULT NULL,
            ip_address        varchar(100) NOT NULL DEFAULT '',
            created_at        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY ticket_code (ticket_code),
            KEY event_slug (event_slug),
            KEY payment_reference (payment_reference),
            KEY attendee_email (attendee_email)
        ) {$cs};" );
    }

    // ── REST routes ───────────────────────────────────────────────────────────

    public static function register_routes(): void {

        register_rest_route( 'culture/v1', '/ticket/initiate', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_initiate' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'name'             => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'email'            => [ 'required' => true,  'sanitize_callback' => 'sanitize_email', 'validate_callback' => 'is_email' ],
                'event_slug'       => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'event_title'      => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ],
                'ticket_type_slug' => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'ticket_type_name' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ],
                'price_amount'     => [ 'required' => true,  'validate_callback' => fn( $v ) => is_numeric( $v ) && (int) $v > 0 ],
                'price_currency'   => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'source'           => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( 'culture/v1', '/ticket/callback', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_paystack_callback' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/ticket/webhook/paystack', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_paystack_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/ticket/webhook/stripe', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_stripe_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        register_rest_route( 'culture/v1', '/ticket/verify', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_verify' ],
            'permission_callback' => fn() => current_user_can( 'manage_options' ) || current_user_can( 'culture_scan_qr' ),
            'args'                => [
                'code' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( 'culture/v1', '/ticket/status', [
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

        $name             = $req->get_param( 'name' );
        $email            = $req->get_param( 'email' );
        $event_slug       = $req->get_param( 'event_slug' );
        $event_title      = $req->get_param( 'event_title' ) ?? '';
        $ticket_type_slug = $req->get_param( 'ticket_type_slug' );
        $ticket_type_name = $req->get_param( 'ticket_type_name' ) ?? $ticket_type_slug;
        $price_amount     = (int) $req->get_param( 'price_amount' );
        $price_currency   = strtoupper( $req->get_param( 'price_currency' ) ?? 'NGN' );
        $source           = $req->get_param( 'source' ) ?? '';
        $ip               = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );

        // Route: NGN → Paystack, everything else → Stripe
        $gateway = ( 'NGN' === $price_currency ) ? 'paystack' : 'stripe';

        // Unique 16-char hex ticket code
        $ticket_code = strtoupper( bin2hex( random_bytes( 8 ) ) );

        // Create pending ticket
        $ok = $wpdb->insert( $t, [
            'ticket_code'      => $ticket_code,
            'event_slug'       => $event_slug,
            'event_title'      => $event_title,
            'ticket_type_slug' => $ticket_type_slug,
            'ticket_type_name' => $ticket_type_name,
            'price_amount'     => $price_amount,
            'price_currency'   => $price_currency,
            'payment_gateway'  => $gateway,
            'attendee_name'    => $name,
            'attendee_email'   => $email,
            'source'           => $source,
            'status'           => 'pending',
            'payment_status'   => 'pending',
            'ip_address'       => $ip,
        ], [ '%s','%s','%s','%s','%s','%d','%s','%s','%s','%s','%s','%s','%s','%s','%s' ] );

        if ( ! $ok ) {
            return self::cors( new WP_REST_Response( [ 'error' => 'db_error', 'message' => 'Could not create ticket. Please try again.' ], 500 ) );
        }

        $ticket_id    = (int) $wpdb->insert_id;
        $amount_minor = $price_amount * 100; // major → lowest unit (kobo / cents)

        $result = ( 'paystack' === $gateway )
            ? self::init_paystack( $ticket_id, $ticket_code, $name, $email, $amount_minor, $price_currency, $event_title, $ticket_type_name, $event_slug )
            : self::init_stripe(   $ticket_id, $ticket_code, $name, $email, $amount_minor, $price_currency, $event_title, $ticket_type_name, $event_slug );

        if ( is_wp_error( $result ) ) {
            $wpdb->delete( $t, [ 'id' => $ticket_id ], [ '%d' ] );
            return self::cors( new WP_REST_Response( [ 'error' => 'payment_error', 'message' => $result->get_error_message() ], 502 ) );
        }

        // Store the gateway reference alongside the ticket
        $wpdb->update( $t, [ 'payment_reference' => $result['reference'] ], [ 'id' => $ticket_id ], [ '%s' ], [ '%d' ] );

        return self::cors( new WP_REST_Response( [
            'payment_url' => $result['url'],
            'ticket_code' => $ticket_code,
        ], 200 ) );
    }

    // ── Paystack — one-time charge initialisation ──────────────────────────

    private static function init_paystack(
        int $ticket_id, string $ticket_code, string $name, string $email,
        int $amount, string $currency, string $event_title, string $ticket_type_name, string $event_slug
    ): array|\WP_Error {

        $callback_url = add_query_arg( [
            'gateway'     => 'paystack',
            'ticket_code' => $ticket_code,
            'event_slug'  => $event_slug,
        ], rest_url( 'culture/v1/ticket/callback' ) );

        $response = Culture_Paystack::charge_initiate( [
            'email'        => $email,
            'amount'       => $amount,
            'currency'     => $currency,
            'reference'    => 'TKT-' . $ticket_code,
            'callback_url' => $callback_url,
            'metadata'     => [
                'ticket_id'     => $ticket_id,
                'ticket_code'   => $ticket_code,
                'event_title'   => $event_title,
                'attendee_name' => $name,
                'custom_fields' => [ [
                    'display_name'  => 'Ticket Type',
                    'variable_name' => 'ticket_type',
                    'value'         => $ticket_type_name,
                ] ],
            ],
        ] );

        if ( is_wp_error( $response ) ) return $response;
        if ( empty( $response['data']['authorization_url'] ) ) {
            return new \WP_Error( 'paystack_error', 'Could not initialize Paystack payment.' );
        }

        return [
            'url'       => $response['data']['authorization_url'],
            'reference' => $response['data']['reference'],
        ];
    }

    // ── Stripe — one-time Checkout Session ────────────────────────────────

    private static function init_stripe(
        int $ticket_id, string $ticket_code, string $name, string $email,
        int $amount, string $currency, string $event_title, string $ticket_type_name, string $event_slug
    ): array|\WP_Error {

        $frontend_url = untrailingslashit( get_option( 'culture_frontend_url', home_url( '/' ) ) );
        $success_url  = $frontend_url . '/events/' . $event_slug . '?ticket_pending=' . $ticket_code . '&session_id={CHECKOUT_SESSION_ID}';
        $cancel_url   = $frontend_url . '/events/' . $event_slug . '?ticket_cancelled=1';

        $response = Culture_Stripe::payment_session( [
            'mode'                => 'payment',
            'client_reference_id' => (string) $ticket_id,
            'customer_email'      => $email,
            'success_url'         => $success_url,
            'cancel_url'          => $cancel_url,
            'line_items'          => [ [
                'price_data' => [
                    'currency'     => strtolower( $currency ),
                    'unit_amount'  => $amount,
                    'product_data' => [
                        'name'        => $ticket_type_name,
                        'description' => $event_title,
                    ],
                ],
                'quantity' => 1,
            ] ],
            'metadata' => [
                'ticket_id'   => (string) $ticket_id,
                'ticket_code' => $ticket_code,
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
        $reference   = sanitize_text_field( $req->get_param( 'reference' ) ?: $req->get_param( 'trxref' ) ?: '' );
        $ticket_code = sanitize_text_field( $req->get_param( 'ticket_code' ) ?: '' );
        $event_slug  = sanitize_text_field( $req->get_param( 'event_slug' ) ?: '' );

        $frontend    = untrailingslashit( get_option( 'culture_frontend_url', home_url( '/' ) ) );
        $event_base  = $event_slug ? $frontend . '/events/' . $event_slug : $frontend;
        $fail_url    = $event_base . '?ticket_failed=1';

        if ( ! $reference ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        $verify = Culture_Paystack::verify_transaction( $reference );
        if ( is_wp_error( $verify ) || ( $verify['data']['status'] ?? '' ) !== 'success' ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        $meta          = $verify['data']['metadata'] ?? [];
        $resolved_code = $meta['ticket_code'] ?? $ticket_code;

        if ( ! $resolved_code || ! self::confirm_ticket( $resolved_code, $reference, 'paystack' ) ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        wp_safe_redirect( $event_base . '?ticket_confirmed=' . urlencode( $resolved_code ) );
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
            $code      = $meta['ticket_code'] ?? '';

            // Only handle ticket charges (reference prefixed with TKT-)
            if ( $code && str_starts_with( $reference, 'TKT-' ) ) {
                self::confirm_ticket( $code, $reference, 'paystack' );
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

        // Verify webhook signature if secret is configured
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
            $code    = $meta['ticket_code'] ?? '';
            $ref     = $session['id'] ?? '';

            if ( $code ) {
                self::confirm_ticket( $code, $ref, 'stripe' );
            }
        }

        return new WP_REST_Response( [ 'status' => 'ok' ], 200 );
    }

    // ── Verify / check-in (door staff) ────────────────────────────────────

    public static function handle_verify( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $t    = self::table();
        $code = $req->get_param( 'code' );

        $ticket = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE ticket_code = %s LIMIT 1", $code ) );

        if ( ! $ticket ) {
            return self::cors( new WP_REST_Response( [ 'valid' => false, 'error' => 'not_found', 'message' => 'Ticket not found.' ], 404 ) );
        }

        if ( 'checked_in' === $ticket->status ) {
            return self::cors( new WP_REST_Response( [
                'valid'         => false,
                'already_used'  => true,
                'message'       => 'This ticket was already scanned.',
                'checked_in_at' => $ticket->checked_in_at,
                'ticket'        => self::ticket_summary( $ticket ),
            ], 200 ) );
        }

        if ( 'confirmed' !== $ticket->status ) {
            return self::cors( new WP_REST_Response( [
                'valid'   => false,
                'status'  => $ticket->status,
                'message' => 'Ticket is not confirmed (status: ' . esc_html( $ticket->status ) . ').',
                'ticket'  => self::ticket_summary( $ticket ),
            ], 200 ) );
        }

        // Mark checked-in
        $wpdb->update(
            $t,
            [ 'status' => 'checked_in', 'checked_in_at' => current_time( 'mysql' ) ],
            [ 'id' => $ticket->id ],
            [ '%s', '%s' ], [ '%d' ]
        );

        return self::cors( new WP_REST_Response( [
            'valid'      => true,
            'checked_in' => true,
            'message'    => 'Checked in successfully.',
            'ticket'     => self::ticket_summary( $ticket ),
        ], 200 ) );
    }

    // ── Status (frontend polling) ─────────────────────────────────────────

    public static function handle_status( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $ticket = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::table() . " WHERE ticket_code = %s LIMIT 1",
            $req->get_param( 'code' )
        ) );

        if ( ! $ticket ) {
            return self::cors( new WP_REST_Response( [ 'error' => 'not_found' ], 404 ) );
        }

        return self::cors( new WP_REST_Response( [
            'status' => $ticket->status,
            'ticket' => self::ticket_summary( $ticket ),
        ], 200 ) );
    }

    // ── Internal: confirm ticket after payment ────────────────────────────

    private static function confirm_ticket( string $ticket_code, string $reference, string $gateway ): bool {
        global $wpdb;
        $t = self::table();

        $ticket = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE ticket_code = %s LIMIT 1", $ticket_code ) );
        if ( ! $ticket ) return false;

        // Idempotent: already confirmed
        if ( in_array( $ticket->status, [ 'confirmed', 'checked_in' ], true ) ) return true;

        $updated = $wpdb->update( $t, [
            'status'            => 'confirmed',
            'payment_status'    => 'paid',
            'payment_reference' => $reference,
            'payment_gateway'   => $gateway,
        ], [ 'ticket_code' => $ticket_code ], [ '%s', '%s', '%s', '%s' ], [ '%s' ] );

        if ( ! $updated ) return false;

        // Gamification
        $user = get_user_by( 'email', $ticket->attendee_email );
        if ( $user && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user->ID, 'event_rsvp' );
        }

        // Reload ticket with updated data for email
        $ticket = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$t} WHERE ticket_code = %s LIMIT 1", $ticket_code ) );
        self::send_ticket_email( $ticket );

        return true;
    }

    // ── Ticket confirmation email ─────────────────────────────────────────

    private static function send_ticket_email( object $ticket ): void {
        $first   = explode( ' ', trim( $ticket->attendee_name ) )[0];
        $subject = "Your ticket — {$ticket->event_title} · The Moveee";
        $symbol  = match ( strtoupper( $ticket->price_currency ) ) {
            'USD'   => '$',
            'GBP'   => '£',
            'EUR'   => '€',
            default => '₦',
        };
        $price_display = $symbol . number_format( $ticket->price_amount );
        $qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' . urlencode( $ticket->ticket_code );

        $html  = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3ece0;font-family:Georgia,serif;">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ece0;padding:48px 20px;"><tr><td align="center">';
        $html .= '<table width="580" cellpadding="0" cellspacing="0" style="background:#14110d;overflow:hidden;">';

        $html .= '<tr><td style="padding:36px 48px 24px;border-bottom:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c5491f;">The Moveee · Tickets</p>';
        $html .= '</td></tr>';

        $html .= '<tr><td style="padding:40px 48px;color:#f3ece0;">';
        $html .= '<h1 style="margin:0 0 8px;font-size:36px;font-weight:400;line-height:1.1;color:#f3ece0;">Your ticket,<br><em style="color:#c5491f;">' . esc_html( $first ) . '.</em></h1>';
        $html .= '<p style="margin:16px 0 32px;font-size:17px;font-style:italic;color:rgba(243,236,224,0.65);">' . esc_html( $ticket->event_title ) . '</p>';

        // Details table
        $rows = [
            [ 'Ticket type', $ticket->ticket_type_name ],
            [ 'Ticket ref',  $ticket->ticket_code ],
            [ 'Amount paid', $price_display ],
            [ 'Name',        $ticket->attendee_name ],
            [ 'Email',       $ticket->attendee_email ],
        ];
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(243,236,224,0.15);margin-bottom:28px;">';
        foreach ( $rows as [ $label, $value ] ) {
            $html .= '<tr>';
            $html .= '<td style="padding:11px 16px;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.4);border-bottom:1px solid rgba(243,236,224,0.08);">' . esc_html( $label ) . '</td>';
            $html .= '<td style="padding:11px 16px;font-size:14px;color:#f3ece0;text-align:right;border-bottom:1px solid rgba(243,236,224,0.08);">' . esc_html( $value ) . '</td>';
            $html .= '</tr>';
        }
        $html .= '</table>';

        // QR code
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr>';
        $html .= '<td style="text-align:center;padding:24px;background:rgba(243,236,224,0.04);border:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0 0 14px;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.4);">Scan at the door</p>';
        $html .= '<img src="' . esc_url( $qr_url ) . '" width="180" height="180" alt="Ticket QR" style="display:block;margin:0 auto;background:#fff;padding:8px;" />';
        $html .= '<p style="margin:12px 0 0;font-family:monospace;font-size:12px;letter-spacing:0.1em;color:rgba(243,236,224,0.5);">' . esc_html( $ticket->ticket_code ) . '</p>';
        $html .= '</td></tr></table>';

        $html .= '<p style="margin:0;font-family:sans-serif;font-size:13px;color:rgba(243,236,224,0.4);line-height:1.6;">Please present this email (or the QR code above) at the door. Your ticket code will be scanned for entry.</p>';
        $html .= '</td></tr>';

        $html .= '<tr><td style="padding:24px 48px;border-top:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.2);">themoveee.com · The Moveee</p>';
        $html .= '</td></tr>';
        $html .= '</table></td></tr></table></body></html>';

        wp_mail(
            $ticket->attendee_email,
            $subject,
            $html,
            [ 'Content-Type: text/html; charset=UTF-8', 'From: The Moveee Tickets <tickets@themoveee.com>' ]
        );

        wp_mail(
            get_option( 'admin_email' ),
            "[TICKET] {$ticket->event_title} — {$ticket->attendee_name}",
            "New paid ticket:\n\nName: {$ticket->attendee_name}\nEmail: {$ticket->attendee_email}\nTicket: {$ticket->ticket_type_name}\nRef: {$ticket->ticket_code}\nAmount: {$price_display}\nGateway: {$ticket->payment_gateway}",
            [ 'From: The Moveee Tickets <tickets@themoveee.com>' ]
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static function ticket_summary( object $ticket ): array {
        return [
            'ticket_code'      => $ticket->ticket_code,
            'event_title'      => $ticket->event_title,
            'ticket_type_name' => $ticket->ticket_type_name,
            'attendee_name'    => $ticket->attendee_name,
            'attendee_email'   => $ticket->attendee_email,
            'price_amount'     => $ticket->price_amount,
            'price_currency'   => $ticket->price_currency,
            'status'           => $ticket->status,
            'checked_in_at'    => $ticket->checked_in_at,
            'created_at'       => $ticket->created_at,
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

    private static function cors( WP_REST_Response $res ): WP_REST_Response {
        $res->header( 'Access-Control-Allow-Origin',  self::ORIGIN );
        $res->header( 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS' );
        $res->header( 'Access-Control-Allow-Headers', 'Content-Type' );
        return $res;
    }
}
