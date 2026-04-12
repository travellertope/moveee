<?php
/**
 * REST API endpoints for check-in and Paystack webhook.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_REST_API {

    public static function init() {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
    }

    /**
     * Register REST API routes.
     */
    public static function register_routes() {
        // QR Code check-in endpoint for Chapter Leaders.
        register_rest_route( 'culture/v1', '/check-in', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_checkin' ),
            'permission_callback' => array( __CLASS__, 'checkin_permission' ),
            'args'                => array(
                'user_id'  => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'event_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );

        // Paystack webhook endpoint (public, verified by signature).
        register_rest_route( 'culture/v1', '/paystack-webhook', array(
            'methods'             => 'POST',
            'callback'            => array( 'Culture_Paystack', 'handle_webhook' ),
            'permission_callback' => '__return_true',
        ) );

        // Newsletter subscribe endpoint (public).
        register_rest_route( 'culture/v1', '/newsletter-subscribe', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_newsletter_subscribe' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'email' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => function( $value ) {
                        return is_email( $value );
                    },
                ),
            ),
        ) );

        // Newsletter unsubscribe endpoint — called by the Next.js frontend page.
        // Token is verified here so the CMS backend is never exposed to subscribers.
        register_rest_route( 'culture/v1', '/newsletter-unsubscribe', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_newsletter_unsubscribe' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'email' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => function( $value ) {
                        return is_email( $value );
                    },
                ),
                'token' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'campaign_id' => array(
                    'required'          => false,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );
    }

    /**
     * Permission check: only Chapter Leaders and admins can check in users.
     */
    public static function checkin_permission( $request ) {
        return current_user_can( 'culture_scan_qr' );
    }

    /**
     * Handle a QR code check-in.
     */
    public static function handle_checkin( $request ) {
        global $wpdb;

        $user_id  = $request->get_param( 'user_id' );
        $event_id = $request->get_param( 'event_id' );

        // Validate user exists.
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'invalid_user', __( 'User not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        // Validate event exists and is published.
        $event = get_post( $event_id );
        if ( ! $event || 'culture_event' !== $event->post_type || 'publish' !== $event->post_status ) {
            return new WP_Error( 'invalid_event', __( 'Event not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        // Check if physical event - require patron tier.
        $is_physical = get_post_meta( $event_id, '_culture_is_physical', true );
        $user_tier   = get_user_meta( $user_id, '_culture_membership_tier', true );

        if ( '1' === $is_physical && 'patron' !== $user_tier ) {
            return new WP_Error(
                'tier_restricted',
                __( 'Physical events require a Patron membership.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        // Check if user belongs to this event's chapter.
        $event_chapter   = get_post_meta( $event_id, '_culture_chapter_id', true );
        $primary_chapter = get_user_meta( $user_id, '_culture_primary_chapter_id', true );
        $secondary_chapter = get_user_meta( $user_id, '_culture_secondary_chapter_id', true );

        if ( $event_chapter && $event_chapter != $primary_chapter && $event_chapter != $secondary_chapter ) {
            return new WP_Error(
                'wrong_chapter',
                __( 'This event is not in your chapter.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        $table = $wpdb->prefix . 'culture_attendance';

        // Check for duplicate check-in.
        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE user_id = %d AND event_id = %d AND status = 'checked_in'",
            $user_id,
            $event_id
        ) );

        if ( $existing ) {
            return new WP_Error( 'already_checked_in', __( 'User already checked in.', 'culture-community' ), array( 'status' => 409 ) );
        }

        // Update existing RSVP or create new record.
        $rsvp = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE user_id = %d AND event_id = %d AND status = 'rsvp'",
            $user_id,
            $event_id
        ) );

        if ( $rsvp ) {
            $wpdb->update(
                $table,
                array(
                    'status'       => 'checked_in',
                    'checkin_time' => current_time( 'mysql' ),
                ),
                array( 'id' => $rsvp ),
                array( '%s', '%s' ),
                array( '%d' )
            );
        } else {
            $wpdb->insert(
                $table,
                array(
                    'user_id'      => $user_id,
                    'event_id'     => $event_id,
                    'status'       => 'checked_in',
                    'checkin_time' => current_time( 'mysql' ),
                ),
                array( '%d', '%d', '%s', '%s' )
            );
        }

        // Award gamification points and evaluate badges.
        Culture_Gamification::award_points( $user_id, 'event_checkin' );

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Check-in successful.', 'culture-community' ),
            'user'    => array(
                'id'           => $user_id,
                'display_name' => $user->display_name,
                'points'       => Culture_Gamification::get_points( $user_id ),
            ),
        ) );
    }

    /**
     * Handle newsletter unsubscribe request from the Next.js frontend.
     *
     * Validates the HMAC token (generated when the email was sent) then removes
     * the subscriber and records the event. Returns JSON — never redirects to a
     * WordPress page — so subscribers only ever see the Next.js UI.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_newsletter_unsubscribe( $request ) {
        $email       = $request->get_param( 'email' );
        $token       = $request->get_param( 'token' );
        $campaign_id = $request->get_param( 'campaign_id' ) ?: null;

        if ( ! Culture_Newsletter_Queue::verify_unsub_token( $email, $token ) ) {
            return new WP_Error(
                'invalid_token',
                __( 'Invalid or expired unsubscribe link.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $updated     = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
            return strtolower( trim( $s ) ) !== strtolower( $email );
        } ) );
        update_option( 'culture_newsletter_subscribers', $updated );

        // Log for analytics — this lets us attribute unsubs to the campaign that triggered them.
        if ( class_exists( 'Culture_NL_Analytics' ) ) {
            Culture_NL_Analytics::log_unsub( $email, $campaign_id );
        }

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'You have been successfully unsubscribed.', 'culture-community' ),
        ) );
    }

    /**
     * Handle newsletter subscription.
     */
    public static function handle_newsletter_subscribe( $request ) {
        $email = $request->get_param( 'email' );

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );

        if ( in_array( $email, $subscribers, true ) ) {
            return rest_ensure_response( array(
                'success' => true,
                'message' => __( 'You are already subscribed.', 'culture-community' ),
            ) );
        }

        $subscribers[] = $email;
        update_option( 'culture_newsletter_subscribers', $subscribers );

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Subscribed successfully.', 'culture-community' ),
        ) );
    }
}
