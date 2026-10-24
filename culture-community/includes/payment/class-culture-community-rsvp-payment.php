<?php
/**
 * Paid-RSVP payment flow for community-organiser events.
 *
 * Organisers set a price on their events (Pro members only); attendees pay
 * via Paystack (NGN) or Stripe (all other currencies). The platform takes
 * 20 % commission — the 80 % owed to the organiser is tracked in the RSVP
 * table; actual payout is manual for the current release.
 *
 * REST endpoints (all under /wp-json/culture/v1/):
 *   POST community/event/rsvp-paid-initiate          — create pending paid RSVP + start session
 *   GET  community/event/rsvp-paid-callback          — Flutterwave post-payment browser redirect
 *   POST community/event/rsvp-paid-webhook/flutterwave
 *   POST community/event/rsvp-paid-webhook/stripe    — Stripe fallback webhook
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Community_RSVP_Payment {

    const CONNECT_URL = 'https://themoveee.com';

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    public static function init(): void {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    // ── REST routes ───────────────────────────────────────────────────────────

    public static function register_routes(): void {

        // Web + mobile initiate (API-key-authenticated, explicit user_id param)
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-initiate', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_initiate' ],
            'permission_callback' => [ 'Culture_REST_API', 'api_key_permission' ],
            'args'                => [
                'user_id' => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
                'post_id' => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
            ],
        ] );

        // Mobile variant (bearer token auth via Culture_Mobile_API pattern)
        register_rest_route( 'culture/v1', '/mobile/community/event/rsvp-paid-initiate', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_mobile_initiate' ],
            'permission_callback' => [ 'Culture_Mobile_API', 'jwt_permission' ],
            'args'                => [
                'post_id' => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
            ],
        ] );

        // Flutterwave browser redirect after payment
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-callback', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_flutterwave_callback' ],
            'permission_callback' => '__return_true',
        ] );

        // Flutterwave server-to-server webhook
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-webhook/flutterwave', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_flutterwave_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        // Stripe fallback webhook
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-webhook/stripe', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_stripe_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        // Public — unauthenticated guest initiates paid RSVP with just an email.
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-guest-initiate', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_guest_initiate' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'email'   => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ],
                'post_id' => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
            ],
        ] );
    }

    // ── Shared initiate logic ─────────────────────────────────────────────────

    private static function do_initiate( int $post_id, int $user_id ): WP_REST_Response {
        global $wpdb;

        // Validate the event
        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type || 'event' !== get_post_meta( $post_id, '_template_type', true ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_event', 'message' => 'Not a community event.' ], 400 );
        }
        if ( ! Culture_Community_RSVP::is_rsvp_enabled( $post_id ) ) {
            return new WP_REST_Response( [ 'error' => 'rsvp_disabled', 'message' => 'RSVP is not enabled for this event.' ], 400 );
        }
        if ( ! Culture_Community_RSVP::is_paid( $post_id ) ) {
            return new WP_REST_Response( [ 'error' => 'rsvp_free', 'message' => 'This is a free event. Use the standard RSVP endpoint.' ], 400 );
        }
        if ( (int) $post->post_author === $user_id ) {
            return new WP_REST_Response( [ 'error' => 'own_event', 'message' => 'You cannot RSVP to your own event.' ], 400 );
        }

        $price    = Culture_Community_RSVP::get_price( $post_id );
        $currency = Culture_Community_RSVP::get_price_currency( $post_id );
        $table    = Culture_Community_RSVP::table();

        // Idempotent: if already confirmed (paid), return success without new payment
        $existing = $wpdb->get_row( $wpdb->prepare(
            "SELECT id, status, payment_status, payment_reference, payment_gateway FROM {$table} WHERE post_id = %d AND user_id = %d",
            $post_id, $user_id
        ), ARRAY_A );

        if ( $existing ) {
            if ( in_array( $existing['payment_status'], [ 'paid' ], true ) && 'confirmed' === $existing['status'] ) {
                return new WP_REST_Response( [ 'already_rsvped' => true ], 200 );
            }
            // Pending from a previous attempt — reuse the existing reference so we
            // don't create duplicate RSVP rows (UNIQUE KEY post_user prevents it anyway).
            if ( 'pending_payment' === $existing['status'] && $existing['payment_reference'] ) {
                // Re-initiate a fresh payment session with the same reference prefix
                $rsvp_id = (int) $existing['id'];
                $result  = self::start_payment( $rsvp_id, $post_id, $post, $user_id, $price, $currency );
                if ( is_wp_error( $result ) ) {
                    return new WP_REST_Response( [ 'error' => 'payment_error', 'message' => $result->get_error_message() ], 502 );
                }
                $wpdb->update( $table, [ 'payment_reference' => $result['reference'] ], [ 'id' => $rsvp_id ], [ '%s' ], [ '%d' ] );
                return new WP_REST_Response( [ 'payment_url' => $result['url'] ], 200 );
            }
        }

        // Capacity check (advisory — confirmed inside GET_LOCK in rsvp())
        $capacity = Culture_Community_RSVP::get_capacity( $post_id );
        if ( $capacity > 0 && Culture_Community_RSVP::get_count( $post_id ) >= $capacity ) {
            return new WP_REST_Response( [ 'error' => 'event_full', 'message' => 'This event is fully booked.' ], 409 );
        }

        // Create or update the RSVP row as pending_payment
        if ( $existing ) {
            $wpdb->update(
                $table,
                [ 'rsvp_type' => 'paid', 'amount_paid' => $price, 'currency' => $currency, 'payment_status' => 'pending', 'status' => 'pending_payment', 'payment_reference' => '', 'payment_gateway' => '' ],
                [ 'id' => (int) $existing['id'] ],
                [ '%s', '%d', '%s', '%s', '%s', '%s', '%s' ],
                [ '%d' ]
            );
            $rsvp_id = (int) $existing['id'];
        } else {
            $ok = $wpdb->insert( $table, [
                'post_id'           => $post_id,
                'user_id'           => $user_id,
                'status'            => 'pending_payment',
                'rsvp_type'         => 'paid',
                'amount_paid'       => $price,
                'currency'          => $currency,
                'payment_status'    => 'pending',
                'payment_gateway'   => '',
                'payment_reference' => '',
                'created_at'        => current_time( 'mysql' ),
            ], [ '%d', '%d', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s' ] );

            if ( ! $ok ) {
                return new WP_REST_Response( [ 'error' => 'db_error', 'message' => 'Could not create RSVP. Please try again.' ], 500 );
            }
            $rsvp_id = (int) $wpdb->insert_id;
        }

        $result = self::start_payment( $rsvp_id, $post_id, $post, $user_id, $price, $currency );
        if ( is_wp_error( $result ) ) {
            // Clean up the pending row so the user can retry
            $wpdb->update( $table, [ 'status' => 'cancelled', 'payment_status' => 'failed' ], [ 'id' => $rsvp_id ], [ '%s', '%s' ], [ '%d' ] );
            return new WP_REST_Response( [ 'error' => 'payment_error', 'message' => $result->get_error_message() ], 502 );
        }

        $wpdb->update( $table, [ 'payment_reference' => $result['reference'], 'payment_gateway' => $result['gateway'] ], [ 'id' => $rsvp_id ], [ '%s', '%s' ], [ '%d' ] );

        return new WP_REST_Response( [ 'payment_url' => $result['url'] ], 200 );
    }

    private static function start_payment( int $rsvp_id, int $post_id, WP_Post $post, int $user_id, int $price, string $currency ): array|\WP_Error {
        $user        = get_userdata( $user_id );
        $email       = $user ? $user->user_email : '';
        $name        = $user ? $user->display_name : '';
        $post_slug   = $post->post_name;
        $event_title = wp_trim_words( $post->post_title, 12, '…' );

        // Flutterwave is primary for all currencies.
        // Fall back to Stripe only if Flutterwave is not configured.
        if ( Culture_Flutterwave::is_configured() ) {
            $res     = self::init_flutterwave( $rsvp_id, $email, $name, $price, $currency, $event_title, $post_slug );
            $gateway = 'flutterwave';
        } else {
            $res     = self::init_stripe( $rsvp_id, $email, $price * 100, $currency, $event_title, $post_slug );
            $gateway = 'stripe';
        }

        if ( is_wp_error( $res ) ) return $res;
        $res['gateway'] = $gateway;
        return $res;
    }

    // ── Web initiate handler ──────────────────────────────────────────────────

    public static function handle_initiate( WP_REST_Request $req ): WP_REST_Response {
        return self::do_initiate(
            (int) $req->get_param( 'post_id' ),
            (int) $req->get_param( 'user_id' )
        );
    }

    // ── Mobile initiate handler ───────────────────────────────────────────────

    public static function handle_mobile_initiate( WP_REST_Request $req ): WP_REST_Response {
        $user_id = Culture_Mobile_API::get_current_user_id( $req );
        if ( ! $user_id ) {
            return new WP_REST_Response( [ 'error' => 'unauthorized' ], 401 );
        }
        return self::do_initiate( (int) $req->get_param( 'post_id' ), $user_id );
    }

    // ── Guest initiate handler ────────────────────────────────────────────────

    public static function handle_guest_initiate( WP_REST_Request $req ): WP_REST_Response {
        $email   = sanitize_email( $req->get_param( 'email' ) );
        $post_id = (int) $req->get_param( 'post_id' );
        if ( ! is_email( $email ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_email', 'message' => 'Enter a valid email address.' ], 400 );
        }
        return self::do_guest_initiate( $email, $post_id );
    }

    private static function do_guest_initiate( string $email, int $post_id ): WP_REST_Response {
        global $wpdb;

        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type || 'event' !== get_post_meta( $post_id, '_template_type', true ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_event', 'message' => 'Not a community event.' ], 400 );
        }
        if ( ! Culture_Community_RSVP::is_rsvp_enabled( $post_id ) ) {
            return new WP_REST_Response( [ 'error' => 'rsvp_disabled', 'message' => 'RSVP is not enabled for this event.' ], 400 );
        }
        if ( ! Culture_Community_RSVP::is_paid( $post_id ) ) {
            return new WP_REST_Response( [ 'error' => 'rsvp_free', 'message' => 'This is a free event. Use the magic-link RSVP endpoint.' ], 400 );
        }
        $capacity = Culture_Community_RSVP::get_capacity( $post_id );
        if ( $capacity > 0 && Culture_Community_RSVP::get_count( $post_id ) >= $capacity ) {
            return new WP_REST_Response( [ 'error' => 'event_full', 'message' => 'This event is fully booked.' ], 409 );
        }

        // Rate-limit by email+post (3 per 10 min) to deter abuse.
        $rl_opt  = '_culture_paid_guest_rl_' . md5( strtolower( $email ) . '_' . $post_id );
        $rl_row  = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $rl_opt ) );
        $rl      = $rl_row ? json_decode( $rl_row, true ) : null;
        if ( $rl && time() < (int) $rl['expires'] && (int) $rl['count'] >= 3 ) {
            return new WP_REST_Response( [ 'error' => 'too_many_requests', 'message' => 'Too many requests — try again in a few minutes.' ], 429 );
        }
        $rl      = ( $rl && time() < (int) $rl['expires'] )
            ? [ 'count' => (int) $rl['count'] + 1, 'expires' => $rl['expires'] ]
            : [ 'count' => 1, 'expires' => time() + 600 ];
        $rl_json = wp_json_encode( $rl );
        $wpdb->query( $wpdb->prepare(
            "INSERT INTO {$wpdb->options} (option_name,option_value,autoload) VALUES(%s,%s,'no') ON DUPLICATE KEY UPDATE option_value=%s",
            $rl_opt, $rl_json, $rl_json
        ) );

        $price    = Culture_Community_RSVP::get_price( $post_id );
        $currency = Culture_Community_RSVP::get_price_currency( $post_id );

        $tx_ref   = 'CRSVPG-' . strtoupper( bin2hex( random_bytes( 6 ) ) );
        $post_slug = $post->post_name;

        // Redirect URL tells the callback this is a guest flow (no rsvp_id param).
        $redirect_url = add_query_arg( [
            'post_slug'  => $post_slug,
            'guest_tx'   => $tx_ref,
        ], rest_url( 'culture/v1/community/event/rsvp-paid-callback' ) );

        $result = Culture_Flutterwave::payment_initiate( [
            'tx_ref'       => $tx_ref,
            'amount'       => (float) $price,
            'currency'     => $currency,
            'redirect_url' => $redirect_url,
            'email'        => $email,
            'name'         => '',
            'description'  => wp_trim_words( $post->post_title, 12, '…' ),
            'title'        => 'Moveee Events',
        ] );

        if ( is_wp_error( $result ) ) {
            return new WP_REST_Response( [ 'error' => 'payment_error', 'message' => $result->get_error_message() ], 502 );
        }

        // Store pending data in wp_options (not RSVP table) to avoid UNIQUE KEY violation.
        $pending_opt  = '_culture_guest_rsvp_pending_' . $tx_ref;
        $pending_json = wp_json_encode( [
            'email'     => $email,
            'post_id'   => $post_id,
            'post_slug' => $post_slug,
            'price'     => $price,
            'currency'  => $currency,
            'expires'   => time() + 7200, // 2 hours
        ] );
        $wpdb->query( $wpdb->prepare(
            "INSERT INTO {$wpdb->options} (option_name,option_value,autoload) VALUES(%s,%s,'no') ON DUPLICATE KEY UPDATE option_value=%s",
            $pending_opt, $pending_json, $pending_json
        ) );

        return new WP_REST_Response( [ 'payment_url' => $result['url'] ], 200 );
    }

    // ── Flutterwave – Standard hosted checkout ────────────────────────────────

    private static function init_flutterwave( int $rsvp_id, string $email, string $name, int $amount, string $currency, string $event_title, string $post_slug ): array|\WP_Error {
        $tx_ref       = 'CRSVP-' . strtoupper( bin2hex( random_bytes( 6 ) ) );
        $redirect_url = add_query_arg( [
            'rsvp_id'   => $rsvp_id,
            'post_slug' => $post_slug,
        ], rest_url( 'culture/v1/community/event/rsvp-paid-callback' ) );

        // Flutterwave takes major units (e.g. 5000 for ₦5,000), not kobo/cents.
        $result = Culture_Flutterwave::payment_initiate( [
            'tx_ref'       => $tx_ref,
            'amount'       => (float) $amount,
            'currency'     => $currency,
            'redirect_url' => $redirect_url,
            'email'        => $email,
            'name'         => $name,
            'description'  => $event_title,
            'title'        => 'Moveee Events',
        ] );

        if ( is_wp_error( $result ) ) return $result;

        return [ 'url' => $result['url'], 'reference' => $tx_ref ];
    }

    // ── Stripe – one-time Checkout Session ───────────────────────────────────

    private static function init_stripe( int $rsvp_id, string $email, int $amount, string $currency, string $event_title, string $post_slug ): array|\WP_Error {
        $connect_url = untrailingslashit( get_option( 'culture_connect_url', self::CONNECT_URL ) );
        $success_url = $connect_url . '/community/' . $post_slug . '?rsvp_pending=' . $rsvp_id . '&session_id={CHECKOUT_SESSION_ID}';
        $cancel_url  = $connect_url . '/community/' . $post_slug . '?rsvp_cancelled=1';

        $response = Culture_Stripe::payment_session( [
            'mode'                => 'payment',
            'client_reference_id' => (string) $rsvp_id,
            'customer_email'      => $email,
            'success_url'         => $success_url,
            'cancel_url'          => $cancel_url,
            'line_items'          => [ [
                'price_data' => [
                    'currency'     => strtolower( $currency ),
                    'unit_amount'  => $amount,
                    'product_data' => [
                        'name'        => 'Event RSVP',
                        'description' => $event_title,
                    ],
                ],
                'quantity' => 1,
            ] ],
            'metadata' => [
                'rsvp_id'     => (string) $rsvp_id,
                'event_title' => $event_title,
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

    // ── Flutterwave callback (browser redirect after payment) ────────────────

    public static function handle_flutterwave_callback( WP_REST_Request $req ) {
        $status         = sanitize_text_field( $req->get_param( 'status' ) ?: '' );
        $tx_ref         = sanitize_text_field( $req->get_param( 'tx_ref' ) ?: '' );
        $transaction_id = (int) ( $req->get_param( 'transaction_id' ) ?? 0 );
        $rsvp_id        = (int) ( $req->get_param( 'rsvp_id' ) ?? 0 );
        $post_slug      = sanitize_text_field( $req->get_param( 'post_slug' ) ?: '' );
        $is_guest       = ! empty( $req->get_param( 'guest_tx' ) );

        $connect_url = untrailingslashit( get_option( 'culture_connect_url', self::CONNECT_URL ) );
        $base_url    = $post_slug ? $connect_url . '/community/' . $post_slug : $connect_url;
        $fail_url    = $base_url . '?rsvp_failed=1';

        if ( 'successful' !== $status || ! $transaction_id ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        $verify = Culture_Flutterwave::verify_transaction( $transaction_id );
        if ( is_wp_error( $verify ) || ( $verify['status'] ?? '' ) !== 'successful' ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        // Guest flow — tx_ref prefixed with CRSVPG-
        if ( $is_guest || ( $tx_ref && str_starts_with( $tx_ref, 'CRSVPG-' ) ) ) {
            if ( ! self::confirm_guest_rsvp_payment( $tx_ref ) ) {
                wp_safe_redirect( $fail_url ); exit;
            }
            // Guest redirect — no rsvp_confirmed param since the page requires auth
            wp_safe_redirect( $base_url . '?rsvp_confirmed=1' );
            exit;
        }

        // Authenticated flow — look up rsvp_id from query param or tx_ref
        if ( ! $rsvp_id && $tx_ref ) {
            global $wpdb;
            $rsvp_id = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT id FROM " . Culture_Community_RSVP::table() . " WHERE payment_reference = %s LIMIT 1",
                $tx_ref
            ) );
        }

        if ( ! $rsvp_id || ! self::confirm_rsvp_payment( $rsvp_id, $tx_ref, 'flutterwave' ) ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        wp_safe_redirect( $base_url . '?rsvp_confirmed=1' );
        exit;
    }

    // ── Flutterwave webhook ───────────────────────────────────────────────────

    public static function handle_flutterwave_webhook( WP_REST_Request $req ): WP_REST_Response {
        $payload     = $req->get_body();
        $verif_hash  = $req->get_header( 'verif-hash' ) ?? '';
        $secret_hash = get_option( 'culture_flutterwave_webhook_hash', '' );

        if ( $secret_hash && ! hash_equals( $secret_hash, $verif_hash ) ) {
            return new WP_REST_Response( [ 'error' => 'invalid_signature' ], 403 );
        }

        $data  = json_decode( $payload, true );
        $event = $data['event'] ?? '';

        if ( 'charge.completed' === $event ) {
            $d      = $data['data'] ?? [];
            $tx_ref = $d['tx_ref'] ?? '';
            $status = $d['status'] ?? '';

            if ( 'successful' === $status ) {
                if ( str_starts_with( $tx_ref, 'CRSVPG-' ) ) {
                    // Guest paid RSVP — pending data in wp_options
                    self::confirm_guest_rsvp_payment( $tx_ref );
                } elseif ( str_starts_with( $tx_ref, 'CRSVP-' ) ) {
                    // Authenticated paid RSVP
                    global $wpdb;
                    $rsvp_id = (int) $wpdb->get_var( $wpdb->prepare(
                        "SELECT id FROM " . Culture_Community_RSVP::table() . " WHERE payment_reference = %s LIMIT 1",
                        $tx_ref
                    ) );
                    if ( $rsvp_id ) {
                        self::confirm_rsvp_payment( $rsvp_id, $tx_ref, 'flutterwave' );
                    }
                }
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

        $webhook_secret = get_option( 'culture_stripe_rsvp_webhook_secret', get_option( 'culture_stripe_webhook_secret', '' ) );
        if ( $webhook_secret ) {
            $sig = $req->get_header( 'stripe-signature' ) ?? '';
            if ( ! self::verify_stripe_sig( $payload, $sig, $webhook_secret ) ) {
                return new WP_REST_Response( [ 'error' => 'invalid_signature' ], 403 );
            }
        }

        if ( 'checkout.session.completed' === $data['type'] ) {
            $session = $data['data']['object'] ?? [];
            $meta    = $session['metadata'] ?? [];
            $rsvp_id = (int) ( $meta['rsvp_id'] ?? 0 );
            $ref     = $session['id'] ?? '';

            if ( $rsvp_id ) {
                self::confirm_rsvp_payment( $rsvp_id, $ref, 'stripe' );
            }
        }

        return new WP_REST_Response( [ 'status' => 'ok' ], 200 );
    }

    // ── Stripe signature verification ─────────────────────────────────────────

    private static function verify_stripe_sig( string $payload, string $sig_header, string $secret ): bool {
        if ( ! $sig_header || ! $secret ) return false;
        $parts = [];
        foreach ( explode( ',', $sig_header ) as $part ) {
            [ $k, $v ] = array_pad( explode( '=', $part, 2 ), 2, '' );
            $parts[ $k ][] = $v;
        }
        $timestamp = $parts['t'][0] ?? '';
        $sigs      = $parts['v1'] ?? [];
        if ( ! $timestamp || empty( $sigs ) ) return false;
        $signed_payload = $timestamp . '.' . $payload;
        $expected       = hash_hmac( 'sha256', $signed_payload, $secret );
        foreach ( $sigs as $s ) {
            if ( hash_equals( $expected, $s ) ) return true;
        }
        return false;
    }

    // ── Internal: confirm RSVP after payment ─────────────────────────────────

    public static function confirm_rsvp_payment( int $rsvp_id, string $reference, string $gateway ): bool {
        global $wpdb;
        $table = Culture_Community_RSVP::table();

        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d LIMIT 1",
            $rsvp_id
        ), ARRAY_A );

        if ( ! $row ) return false;

        // Idempotent: already confirmed
        if ( in_array( $row['status'], [ 'confirmed', 'checked_in' ], true ) ) return true;

        // Capacity re-check under lock (same pattern as free RSVP)
        $post_id   = (int) $row['post_id'];
        $lock_name = 'culture_rsvp_' . $post_id;
        $locked    = $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, 5)', $lock_name ) );
        if ( ! $locked ) return false;

        try {
            $capacity = Culture_Community_RSVP::get_capacity( $post_id );
            // Exclude this specific RSVP row from the count (they're taking one of the spots).
            // Using id != rsvp_id rather than user_id != user_id avoids excluding ALL guest
            // rows when user_id = 0.
            if ( $capacity > 0 ) {
                $count = (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE post_id = %d AND id != %d AND status = 'confirmed'",
                    $post_id, $rsvp_id
                ) );
                if ( $count >= $capacity ) {
                    // Refund required but out of scope for MVP — log and return false
                    error_log( "Culture RSVP payment: event {$post_id} is full at confirm time for rsvp {$rsvp_id} — manual refund needed." );
                    return false;
                }
            }

            $updated = $wpdb->update(
                $table,
                [
                    'status'            => 'confirmed',
                    'payment_status'    => 'paid',
                    'payment_reference' => $reference,
                    'payment_gateway'   => $gateway,
                ],
                [ 'id' => $rsvp_id ],
                [ '%s', '%s', '%s', '%s' ],
                [ '%d' ]
            );
        } finally {
            $wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_name ) );
        }

        if ( ! $updated ) return false;

        // Notify the organiser
        $post      = get_post( $post_id );
        $user_id   = (int) $row['user_id'];
        $attendee  = get_userdata( $user_id );

        if ( $post ) {
            $organiser_id = (int) $post->post_author;
            Culture_Notifications::add(
                $organiser_id,
                'event_rsvp',
                'New paid RSVP',
                ( $attendee ? $attendee->display_name : 'Someone' ) . ' RSVPed to "' . wp_trim_words( $post->post_title, 8, '…' ) . '"',
                '/member/events',
                [ 'post_id' => $post_id, 'user_id' => $user_id, 'paid' => true ]
            );
        }

        // Gamification
        if ( $attendee && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'event_rsvp' );
        }

        return true;
    }

    // ── Guest paid RSVP confirmation ─────────────────────────────────────────

    /**
     * Called after Flutterwave confirms a guest payment (tx_ref prefixed CRSVPG-).
     * Loads the pending wp_options record, finds-or-creates the account, inserts
     * the RSVP row as confirmed+paid, sends the confirmation + magic sign-in email,
     * and cleans up the pending record. Idempotent — a second call with the same
     * tx_ref finds the pending record already deleted and returns true gracefully
     * if the RSVP row already exists.
     */
    public static function confirm_guest_rsvp_payment( string $tx_ref ): bool {
        global $wpdb;

        $pending_opt = '_culture_guest_rsvp_pending_' . $tx_ref;
        $pending_row = $wpdb->get_var( $wpdb->prepare(
            "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
            $pending_opt
        ) );

        if ( null === $pending_row ) {
            // Already processed or never existed — check if RSVP row exists.
            $table   = Culture_Community_RSVP::table();
            $exists  = $wpdb->get_var( $wpdb->prepare(
                "SELECT id FROM {$table} WHERE payment_reference = %s LIMIT 1",
                $tx_ref
            ) );
            return (bool) $exists;
        }

        $pending = json_decode( $pending_row, true );
        if ( ! $pending || time() > (int) $pending['expires'] ) {
            $wpdb->delete( $wpdb->options, [ 'option_name' => $pending_opt ] );
            return false;
        }

        $email    = sanitize_email( $pending['email'] );
        $post_id  = (int) $pending['post_id'];
        $price    = (int) $pending['price'];
        $currency = (string) $pending['currency'];
        $post_slug = (string) $pending['post_slug'];

        // Find or create the account.
        if ( ! class_exists( 'Culture_Magic_OTP' ) ) return false;
        $user = Culture_Magic_OTP::find_or_create_user( $email );
        if ( is_wp_error( $user ) ) {
            error_log( 'Culture guest RSVP: could not find/create user for ' . $email . ' — ' . $user->get_error_message() );
            return false;
        }

        $table = Culture_Community_RSVP::table();

        // Capacity check under lock.
        $lock_name = 'culture_rsvp_' . $post_id;
        $locked    = $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, 5)', $lock_name ) );
        if ( ! $locked ) return false;

        $inserted = false;
        try {
            $capacity = Culture_Community_RSVP::get_capacity( $post_id );
            if ( $capacity > 0 && Culture_Community_RSVP::get_count( $post_id ) >= $capacity ) {
                error_log( "Culture guest RSVP: event {$post_id} full at confirm for {$tx_ref} — manual refund needed." );
                return false;
            }

            // INSERT OR UPDATE — handle the case where the user account already had
            // a pending_payment row (rare: user registered between initiate and webhook).
            $existing = $wpdb->get_row( $wpdb->prepare(
                "SELECT id FROM {$table} WHERE post_id = %d AND user_id = %d",
                $post_id, $user->ID
            ), ARRAY_A );

            if ( $existing ) {
                $wpdb->update(
                    $table,
                    [
                        'status'            => 'confirmed',
                        'rsvp_type'         => 'paid',
                        'amount_paid'       => $price,
                        'currency'          => $currency,
                        'payment_status'    => 'paid',
                        'payment_reference' => $tx_ref,
                        'payment_gateway'   => 'flutterwave',
                        'guest_email'       => $email,
                    ],
                    [ 'id' => (int) $existing['id'] ],
                    [ '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s' ],
                    [ '%d' ]
                );
            } else {
                $wpdb->insert( $table, [
                    'post_id'           => $post_id,
                    'user_id'           => $user->ID,
                    'guest_email'       => $email,
                    'status'            => 'confirmed',
                    'rsvp_type'         => 'paid',
                    'amount_paid'       => $price,
                    'currency'          => $currency,
                    'payment_status'    => 'paid',
                    'payment_gateway'   => 'flutterwave',
                    'payment_reference' => $tx_ref,
                    'created_at'        => current_time( 'mysql' ),
                ], [ '%d', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s' ] );
            }
            $inserted = true;
        } finally {
            $wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_name ) );
        }

        if ( ! $inserted ) return false;

        // Clean up pending record immediately.
        $wpdb->delete( $wpdb->options, [ 'option_name' => $pending_opt ] );

        // Notify the organiser.
        $post = get_post( $post_id );
        if ( $post ) {
            Culture_Notifications::add(
                (int) $post->post_author,
                'event_rsvp',
                'New paid RSVP',
                $email . ' RSVPed to "' . wp_trim_words( $post->post_title, 8, '…' ) . '"',
                '/member/events',
                [ 'post_id' => $post_id, 'user_id' => $user->ID, 'paid' => true ]
            );
        }

        // Gamification.
        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user->ID, 'event_rsvp' );
        }

        // Generate magic sign-in link and send confirmation email.
        $redirect_path = '/community/' . $post_slug . '?rsvp_confirmed=1';
        $magic_url     = Culture_Magic_OTP::generate_signin_magic_link( $email, $redirect_path );

        if ( class_exists( 'Culture_Emails' ) ) {
            $event_title = $post ? $post->post_title : 'your event';
            Culture_Emails::send_paid_rsvp_confirmation_email( $email, $event_title, $price, $currency, $magic_url );
        }

        return true;
    }
}
