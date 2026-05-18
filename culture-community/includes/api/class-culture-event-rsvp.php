<?php
/**
 * Event RSVP — REST endpoint, DB storage, confirmation email.
 *
 * Table: {prefix}culture_event_rsvp
 * Endpoints:
 *   POST /wp-json/culture/v1/event-rsvp          — submit RSVP (public)
 *   GET  /wp-json/culture/v1/event-rsvp/capacity — live spot count (public)
 *   GET  /wp-json/culture/v1/event-rsvp/list     — full list for an event (admin)
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Event_RSVP {

    const TABLE  = 'culture_event_rsvp';
    const ORIGIN = 'https://themoveee.com';

    // ── Initialise ────────────────────────────────────────────────────────────

    public static function init(): void {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function table(): string {
        global $wpdb;
        return $wpdb->prefix . self::TABLE;
    }

    // ── DB table creation (called from activator) ─────────────────────────────

    public static function create_table(): void {
        global $wpdb;
        $t  = self::table();
        $cs = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( "CREATE TABLE {$t} (
            id            bigint(20)   NOT NULL AUTO_INCREMENT,
            event_slug    varchar(200) NOT NULL DEFAULT '',
            event_title   varchar(500) NOT NULL DEFAULT '',
            name          varchar(200) NOT NULL DEFAULT '',
            email         varchar(200) NOT NULL DEFAULT '',
            ticket_type   varchar(100) NOT NULL DEFAULT 'general',
            source        varchar(200) NOT NULL DEFAULT '',
            status        varchar(20)  NOT NULL DEFAULT 'confirmed',
            ip_address    varchar(100) NOT NULL DEFAULT '',
            created_at    datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY event_slug (event_slug),
            KEY email (email)
        ) {$cs};" );
    }

    // ── REST routes ───────────────────────────────────────────────────────────

    public static function register_routes(): void {

        // Submit RSVP
        register_rest_route( 'culture/v1', '/event-rsvp', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_submit' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'name'        => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'email'       => [ 'required' => true,  'sanitize_callback' => 'sanitize_email',
                                   'validate_callback' => 'is_email' ],
                'event_slug'  => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'event_title' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ],
                'ticket_type' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ],
                'source'      => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        // Live capacity
        register_rest_route( 'culture/v1', '/event-rsvp/capacity', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_capacity' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'event_slug' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        // Admin list
        register_rest_route( 'culture/v1', '/event-rsvp/list', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_list' ],
            'permission_callback' => fn() => current_user_can( 'manage_options' ),
            'args'                => [
                'event_slug' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    public static function handle_submit( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $t = self::table();

        $name        = $req->get_param( 'name' );
        $email       = $req->get_param( 'email' );
        $event_slug  = $req->get_param( 'event_slug' );
        $event_title = $req->get_param( 'event_title' ) ?? '';
        $ticket_type = $req->get_param( 'ticket_type' ) ?? 'general';
        $source      = $req->get_param( 'source' ) ?? '';
        $ip          = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );

        // Duplicate check
        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$t} WHERE email = %s AND event_slug = %s AND status = 'confirmed' LIMIT 1",
            $email, $event_slug
        ) );
        if ( $exists ) {
            return self::cors( new WP_REST_Response( [
                'error'   => 'already_registered',
                'message' => 'You are already registered for this event.',
            ], 409 ) );
        }

        // Capacity check
        $post     = get_page_by_path( $event_slug, OBJECT, 'culture_event' );
        $capacity = $post ? (int) get_post_meta( $post->ID, 'rsvp_capacity', true ) : 0;
        if ( $capacity > 0 ) {
            $confirmed = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(*) FROM {$t} WHERE event_slug = %s AND status = 'confirmed'",
                $event_slug
            ) );
            if ( $confirmed >= $capacity ) {
                return self::cors( new WP_REST_Response( [
                    'error'   => 'sold_out',
                    'message' => 'Sorry — this event is now fully booked.',
                ], 409 ) );
            }
        }

        // Insert
        $ok = $wpdb->insert( $t, [
            'event_slug'  => $event_slug,
            'event_title' => $event_title,
            'name'        => $name,
            'email'       => $email,
            'ticket_type' => $ticket_type,
            'source'      => $source,
            'status'      => 'confirmed',
            'ip_address'  => $ip,
        ], [ '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' ] );

        if ( ! $ok ) {
            return self::cors( new WP_REST_Response( [
                'error'   => 'db_error',
                'message' => 'Could not save your RSVP. Please try again.',
            ], 500 ) );
        }

        // Gamification points for logged-in member
        $user = get_user_by( 'email', $email );
        if ( $user && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user->ID, 'event_rsvp' );
        }

        // Emails
        self::send_confirmation( $name, $email, $event_slug, $event_title, $ticket_type );

        return self::cors( new WP_REST_Response( [
            'success' => true,
            'message' => "You're on the list! Check your email for confirmation.",
        ], 201 ) );
    }

    // ── Capacity ──────────────────────────────────────────────────────────────

    public static function handle_capacity( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $t          = self::table();
        $event_slug = $req->get_param( 'event_slug' );

        $confirmed = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$t} WHERE event_slug = %s AND status = 'confirmed'",
            $event_slug
        ) );

        $capacity = 0;
        $post = get_page_by_path( $event_slug, OBJECT, 'culture_event' );
        if ( $post ) {
            $capacity = (int) get_post_meta( $post->ID, 'rsvp_capacity', true );
        }

        $remaining = ( $capacity > 0 ) ? max( 0, $capacity - $confirmed ) : null;

        $res = new WP_REST_Response( [
            'capacity'  => $capacity > 0 ? $capacity  : null,
            'confirmed' => $confirmed,
            'remaining' => $remaining,
            'available' => ( $capacity === 0 || $confirmed < $capacity ),
        ], 200 );
        $res->header( 'Cache-Control', 'no-store' );
        return self::cors( $res );
    }

    // ── Admin list ────────────────────────────────────────────────────────────

    public static function handle_list( WP_REST_Request $req ): WP_REST_Response {
        global $wpdb;
        $t          = self::table();
        $event_slug = $req->get_param( 'event_slug' );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT id, name, email, ticket_type, status, created_at
             FROM {$t} WHERE event_slug = %s ORDER BY created_at DESC",
            $event_slug
        ) );
        return self::cors( new WP_REST_Response( $rows, 200 ) );
    }

    // ── Confirmation email ────────────────────────────────────────────────────

    private static function send_confirmation( string $name, string $email, string $event_slug, string $event_title, string $ticket_type ): void {
        $first = explode( ' ', trim( $name ) )[0];

        // Fetch live event data for accurate date/venue/hours
        $post         = get_page_by_path( $event_slug, OBJECT, 'culture_event' );
        $event_date   = '';
        $event_venue  = '';
        $event_hours  = '';
        $event_admission = '';

        if ( $post ) {
            $raw_date = get_post_meta( $post->ID, 'event_date', true );
            if ( ! $raw_date && function_exists('get_field') ) {
                $raw_date = get_field( 'event_date', $post->ID );
            }
            if ( $raw_date ) {
                $date_obj   = date_create( $raw_date );
                $event_date = $date_obj ? date_format( $date_obj, 'j F Y' ) : $raw_date;
            }

            $event_venue     = function_exists('get_field') ? get_field( 'location', $post->ID )      : get_post_meta( $post->ID, 'location', true );
            $event_hours     = function_exists('get_field') ? get_field( 'opening_hours', $post->ID ) : get_post_meta( $post->ID, 'opening_hours', true );
            $event_admission = function_exists('get_field') ? get_field( 'admission', $post->ID )     : get_post_meta( $post->ID, 'admission', true );
        }

        $event_venue     = $event_venue     ?: 'Venue TBA';
        $event_hours     = $event_hours     ?: 'See event details';
        $event_admission = $event_admission ?: 'Free Admission';
        $event_date      = $event_date      ?: 'Date TBA';

        // Human-readable ticket label (no hardcoded times)
        $label = match ( $ticket_type ) {
            'private' => 'Private View',
            'supper'  => 'Origins Supper Table',
            default   => 'General Admission',
        };

        // Load editable template
        $tpl     = class_exists('Culture_Email_Templates') ? Culture_Email_Templates::get_template('event_rsvp_confirmation') : null;
        $subject = $tpl ? Culture_Email_Templates::merge( $tpl['subject'], [
            '{event_title}' => $event_title,
        ] ) : "You're on the list — {$event_title} · The Moveee";

        $body_content = $tpl ? Culture_Email_Templates::merge( $tpl['body'], [
            '{first_name}'      => esc_html( $first ),
            '{event_title}'     => esc_html( $event_title ),
            '{ticket_label}'    => esc_html( $label ),
            '{event_date}'      => esc_html( $event_date ),
            '{event_venue}'     => esc_html( $event_venue ),
            '{event_hours}'     => esc_html( $event_hours ),
            '{event_admission}' => esc_html( $event_admission ),
            '{attendee_email}'  => esc_html( $email ),
        ] ) : '';

        $heading     = $tpl ? esc_html( $tpl['heading'] ) : 'The Moveee · Events';
        $button_text = $tpl ? esc_html( $tpl['button'] )  : 'View Event →';
        $event_url   = esc_url( 'https://themoveee.com/events/' . $event_slug );

        // Branded dark email wrapper
        $html  = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f3ece0;font-family:Georgia,serif;">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ece0;padding:48px 20px;"><tr><td align="center">';
        $html .= '<table width="580" cellpadding="0" cellspacing="0" style="background:#14110d;overflow:hidden;">';

        // Header
        $html .= '<tr><td style="padding:36px 48px 24px;border-bottom:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#c5491f;">' . $heading . '</p>';
        $html .= '</td></tr>';

        // Hero
        $html .= '<tr><td style="padding:40px 48px 0;color:#f3ece0;">';
        $html .= '<h1 style="margin:0 0 8px;font-size:38px;font-weight:400;line-height:1.1;color:#f3ece0;">You\'re on the list,<br><em style="color:#c5491f;">' . esc_html( $first ) . '.</em></h1>';
        $html .= '<p style="margin:16px 0 32px;font-size:17px;font-style:italic;color:rgba(243,236,224,0.65);line-height:1.5;">' . esc_html( $event_title ) . '</p>';
        $html .= '</td></tr>';

        // Body (editable template content)
        $html .= '<tr><td style="padding:0 48px 32px;color:#f3ece0;font-family:sans-serif;font-size:14px;line-height:1.7;color:rgba(243,236,224,0.75);">';
        $html .= $body_content;
        $html .= '</td></tr>';

        // CTA button
        $html .= '<tr><td style="padding:0 48px 40px;">';
        $html .= '<a href="' . $event_url . '" style="display:inline-block;padding:14px 28px;background:#c5491f;color:#f3ece0;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;text-decoration:none;">' . $button_text . '</a>';
        $html .= '</td></tr>';

        // Footer
        $html .= '<tr><td style="padding:24px 48px;border-top:1px solid rgba(243,236,224,0.1);">';
        $html .= '<p style="margin:0;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(243,236,224,0.2);">themoveee.com · The Moveee</p>';
        $html .= '</td></tr>';
        $html .= '</table></td></tr></table></body></html>';

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: The Moveee Events <events@themoveee.com>',
        ];

        wp_mail( $email, $subject, $html, $headers );

        // Admin notification
        wp_mail(
            get_option( 'admin_email' ),
            "[RSVP] {$event_title} — {$name}",
            "New RSVP:\n\nName: {$name}\nEmail: {$email}\nTicket: {$label}\nDate: {$event_date}\nVenue: {$event_venue}\nEvent: {$event_title}",
            [ 'From: The Moveee Events <events@themoveee.com>' ]
        );
    }

    // ── CORS helper ───────────────────────────────────────────────────────────

    private static function cors( WP_REST_Response $res ): WP_REST_Response {
        $res->header( 'Access-Control-Allow-Origin',  self::ORIGIN );
        $res->header( 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS' );
        $res->header( 'Access-Control-Allow-Headers', 'Content-Type' );
        return $res;
    }
}
