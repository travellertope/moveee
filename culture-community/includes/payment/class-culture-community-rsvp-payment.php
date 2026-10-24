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
 *   POST community/event/rsvp-paid-initiate        — create pending paid RSVP + start session
 *   GET  community/event/rsvp-paid-callback        — Paystack post-payment browser redirect
 *   POST community/event/rsvp-paid-webhook/paystack
 *   POST community/event/rsvp-paid-webhook/stripe
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Community_RSVP_Payment {

    const CONNECT_URL = 'https://web.themoveee.com';

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

        // Paystack browser redirect after payment
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-callback', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_paystack_callback' ],
            'permission_callback' => '__return_true',
        ] );

        // Paystack server-to-server webhook
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-webhook/paystack', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_paystack_webhook' ],
            'permission_callback' => '__return_true',
        ] );

        // Stripe server-to-server webhook
        register_rest_route( 'culture/v1', '/community/event/rsvp-paid-webhook/stripe', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_stripe_webhook' ],
            'permission_callback' => '__return_true',
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
        $user         = get_userdata( $user_id );
        $email        = $user ? $user->user_email : '';
        $name         = $user ? $user->display_name : '';
        $post_slug    = $post->post_name;
        $event_title  = wp_trim_words( $post->post_title, 12, '…' );
        $amount_minor = $price * 100; // major → kobo / cents
        $gateway      = ( 'NGN' === strtoupper( $currency ) ) ? 'paystack' : 'stripe';

        if ( 'paystack' === $gateway ) {
            $res = self::init_paystack( $rsvp_id, $email, $name, $amount_minor, $currency, $event_title, $post_slug );
        } else {
            $res = self::init_stripe( $rsvp_id, $email, $amount_minor, $currency, $event_title, $post_slug );
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

    // ── Paystack – one-time charge initialisation ─────────────────────────────

    private static function init_paystack( int $rsvp_id, string $email, string $name, int $amount, string $currency, string $event_title, string $post_slug ): array|\WP_Error {
        $reference    = 'CRSVP-' . strtoupper( bin2hex( random_bytes( 6 ) ) );
        $callback_url = add_query_arg( [
            'gateway'   => 'paystack',
            'rsvp_id'   => $rsvp_id,
            'post_slug' => $post_slug,
        ], rest_url( 'culture/v1/community/event/rsvp-paid-callback' ) );

        $response = Culture_Paystack::charge_initiate( [
            'email'        => $email,
            'amount'       => $amount,
            'currency'     => $currency,
            'reference'    => $reference,
            'callback_url' => $callback_url,
            'metadata'     => [
                'rsvp_id'       => $rsvp_id,
                'attendee_name' => $name,
                'event_title'   => $event_title,
                'custom_fields' => [ [
                    'display_name'  => 'Event',
                    'variable_name' => 'event_title',
                    'value'         => $event_title,
                ] ],
            ],
        ] );

        if ( is_wp_error( $response ) ) return $response;
        if ( empty( $response['data']['authorization_url'] ) ) {
            return new \WP_Error( 'paystack_error', 'Could not initialize Paystack payment.' );
        }

        // Store the reference we generated (Paystack echoes it back in verify)
        global $wpdb;
        $wpdb->update( Culture_Community_RSVP::table(), [ 'payment_reference' => $reference ], [ 'id' => $rsvp_id ], [ '%s' ], [ '%d' ] );

        return [
            'url'       => $response['data']['authorization_url'],
            'reference' => $response['data']['reference'] ?? $reference,
        ];
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

    // ── Paystack callback (browser redirect after payment) ───────────────────

    public static function handle_paystack_callback( WP_REST_Request $req ) {
        $reference = sanitize_text_field( $req->get_param( 'reference' ) ?: $req->get_param( 'trxref' ) ?: '' );
        $rsvp_id   = (int) ( $req->get_param( 'rsvp_id' ) ?? 0 );
        $post_slug = sanitize_text_field( $req->get_param( 'post_slug' ) ?: '' );

        $connect_url = untrailingslashit( get_option( 'culture_connect_url', self::CONNECT_URL ) );
        $base_url    = $post_slug ? $connect_url . '/community/' . $post_slug : $connect_url;
        $fail_url    = $base_url . '?rsvp_failed=1';

        if ( ! $reference ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        $verify = Culture_Paystack::verify_transaction( $reference );
        if ( is_wp_error( $verify ) || ( $verify['data']['status'] ?? '' ) !== 'success' ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        // rsvp_id from query param, or from metadata
        if ( ! $rsvp_id ) {
            $meta    = $verify['data']['metadata'] ?? [];
            $rsvp_id = (int) ( $meta['rsvp_id'] ?? 0 );
        }

        if ( ! $rsvp_id || ! self::confirm_rsvp_payment( $rsvp_id, $reference, 'paystack' ) ) {
            wp_safe_redirect( $fail_url ); exit;
        }

        wp_safe_redirect( $base_url . '?rsvp_confirmed=1' );
        exit;
    }

    // ── Paystack webhook ──────────────────────────────────────────────────────

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

            // Only handle community RSVP charges (reference prefixed with CRSVP-)
            if ( str_starts_with( $reference, 'CRSVP-' ) ) {
                $rsvp_id = (int) ( $meta['rsvp_id'] ?? 0 );
                if ( ! $rsvp_id ) {
                    // Fall back to lookup by reference
                    global $wpdb;
                    $rsvp_id = (int) $wpdb->get_var( $wpdb->prepare(
                        "SELECT id FROM " . Culture_Community_RSVP::table() . " WHERE payment_reference = %s LIMIT 1",
                        $reference
                    ) );
                }
                if ( $rsvp_id ) {
                    self::confirm_rsvp_payment( $rsvp_id, $reference, 'paystack' );
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
            // Exclude this user's own row from the count (they're taking one of the spots)
            if ( $capacity > 0 ) {
                $count = (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE post_id = %d AND user_id != %d AND status = 'confirmed'",
                    $post_id, (int) $row['user_id']
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
                ( $attendee ? $attendee->display_name : 'Someone' ) . ' paid to attend "' . wp_trim_words( $post->post_title, 8, '…' ) . '"',
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
}
