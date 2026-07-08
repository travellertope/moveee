<?php
/**
 * Mobile API — endpoints and auth for the Moveee Connect Android/iOS app.
 *
 * Auth strategy: on login the server generates a random 64-char token, stores
 * wp_hash(token) in user meta, and returns the raw token to the app. The app
 * sends "Authorization: Bearer {token}" on every subsequent request, and
 * mobile_permission() validates it by looking up the hash.
 *
 * Token lifetime: 90 days, refreshed on each successful auth call.
 *
 * All new routes live under /culture/v1/ alongside the existing web routes.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Mobile_API {

    const TOKEN_META      = '_culture_mobile_token';
    const TOKEN_EXP_META  = '_culture_mobile_token_expires';
    const TOKEN_TTL       = 90 * DAY_IN_SECONDS;

    public static function init() {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
    }

    // -------------------------------------------------------------------------
    // Route registration
    // -------------------------------------------------------------------------

    public static function register_routes() {

        register_rest_route( 'culture/v1', '/mobile/login', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_login' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'email'    => array( 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ),
                'username' => array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'password' => array( 'required' => true, 'type' => 'string' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/login-google', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_login_google' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id_token' => array( 'required' => true, 'type' => 'string' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/logout', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_logout' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/register', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_register' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'email'    => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => function( $v ) { return is_email( $v ); },
                ),
                'username' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_user',
                ),
                'password' => array(
                    'required' => true,
                    'type'     => 'string',
                ),
                'referral_code' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/me', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_me' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/me', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_me' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/push-token', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_push_token' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'token' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/posts', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_community_posts' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/feed', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_unified_feed' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/upload-image', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_upload_image' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/submit', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_submit_post' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'content'   => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
                'image_url' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                    'default'           => '',
                ),
                'tag' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                    'default'           => '',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/post', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_community_post' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/comments', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_comments' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/comment', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_add_comment' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'content' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/react', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_react' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'type' => array(
                    'default'           => 'like',
                    'sanitize_callback' => 'sanitize_key',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/user/reaction', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_user_reaction' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/report', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_report' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'reason'  => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                    'validate_callback' => function( $v ) {
                        return in_array( $v, array( 'spam', 'harassment', 'inappropriate' ), true );
                    },
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/quote', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_submit_quote' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'text'           => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
                'author'         => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'source'         => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'sharing_reason' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ),
                'quote_type'     => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/poll-vote', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_poll_vote' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id'      => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'option_index' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Community event RSVPs (culture_post CPT, _template_type = 'event').
        // Distinct from /mobile/events/* above, which is the editorial culture_event RSVP system.
        register_rest_route( 'culture/v1', '/mobile/community/event/rsvp', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_community_event_rsvp' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/event/rsvp-cancel', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_community_event_rsvp_cancel' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/event/rsvp-status', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_community_event_rsvp_status' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/event/attendees', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_community_event_attendees' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/community/my-events', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_community_my_events' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Stoop clusters (culture_cluster CPT). Phase 1 — create/discover/
        // join/leave/status only, no election/check-in. Mirrors /cluster/* (web, API key).
        register_rest_route( 'culture/v1', '/mobile/cluster/create', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_create' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'name'    => array( 'required' => true, 'type' => 'string' ),
                'city'    => array( 'type' => 'string' ),
                'street'  => array( 'type' => 'string' ),
                'country' => array( 'type' => 'string' ),
                'capacity' => array( 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'meeting_day'    => array( 'type' => 'string' ),
                'meeting_time'   => array( 'type' => 'string' ),
                'location_note'  => array( 'type' => 'string' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/discover', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_discover' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/my-clusters', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_my_clusters' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_get' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/status', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_status' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/join', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_join' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/leave', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_leave' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Phase 2 — host mechanisms (election only; appointment is admin-only,
        // no member-facing endpoint).
        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/election/start', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_election_start' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/election/vote', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_election_vote' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'candidate_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/election', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_election_status' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Phase 3 — check-in & attendance (QR + manual host fallback). Mirrors
        // /cluster/{id}/... (web, API key) — see class-culture-rest-api.php.
        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/members', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_members' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/host-qr', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_host_qr' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/checkin', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_checkin' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'meeting_date' => array( 'required' => true, 'type' => 'string' ),
                'expires_at'   => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'token'        => array( 'required' => true, 'type' => 'string' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/checkin-manual', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cluster_checkin_manual' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'member_user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/cluster/(?P<id>\d+)/attendance', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cluster_attendance' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Checkout auto-login: issues a one-time token the in-app browser redeems.
        register_rest_route( 'culture/v1', '/mobile/checkout-token', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_checkout_token' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Redeems the one-time token above. Lives under /wp-json/ so Varnish's
        // page cache (which can serve a stale homepage for "/?param=...") never
        // intercepts the handshake.
        register_rest_route( 'culture/v1', '/mobile/checkout-redirect', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_checkout_redirect' ),
            'permission_callback' => '__return_true',
        ) );

        // Validate a WooCommerce coupon code and return discount details.
        register_rest_route( 'culture/v1', '/mobile/validate-coupon', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_validate_coupon' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'code'     => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'subtotal' => array( 'required' => false, 'type' => 'number', 'default' => 0 ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/events/my-rsvps', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_my_rsvps' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/events/rsvp', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cancel_rsvp' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'event_slug' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'event_id'   => array( 'required' => false, 'type' => 'integer' ),
                'status'     => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/events/submit', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_submit_event_mobile' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'title'         => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'description'   => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field', 'default' => '' ),
                'event_date'    => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'end_date'      => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'location'      => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'city'          => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'admission'     => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'ticketing_url' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'esc_url_raw', 'default' => '' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/directory/submit', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_submit_directory_mobile' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'title'      => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'excerpt'    => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_textarea_field' ),
                'content'    => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
                'entry_type' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_key', 'default' => 'concept' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/member/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_member' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );

        // Username-based lookup — used by surfaces that only have a username
        // on hand (e.g. @mention taps, quote poster attribution), not a numeric
        // user ID. Registered as a separate route (not a fallback on the route
        // above) since the \d+ pattern on /mobile/member/(?P<id>\d+) means a
        // non-numeric segment simply won't match that route at all.
        register_rest_route( 'culture/v1', '/mobile/member/by-username/(?P<username>[a-zA-Z0-9_\-]+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_member_by_username' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'username' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_user',
                ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/members', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_members' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/newsletter-preferences', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_newsletter_prefs' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_update_newsletter_prefs' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/user/reset-password', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_request_password_reset' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Notifications
        register_rest_route( 'culture/v1', '/mobile/notifications', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_notifications' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
                'args'                => array(
                    'limit'  => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
                    'offset' => array( 'default' => 0,  'sanitize_callback' => 'absint' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_mark_notifications_read' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/notifications/count', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_notification_count' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/notifications/preferences', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_notification_prefs' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_set_notification_prefs' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            ),
        ) );

        // Analytics
        register_rest_route( 'culture/v1', '/mobile/analytics', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_analytics' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Wallet
        register_rest_route( 'culture/v1', '/mobile/wallet/balance', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_wallet_balance' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/wallet/history', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_wallet_history' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/wallet/cashout', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_wallet_cashout' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Games — completion recording + history
        register_rest_route( 'culture/v1', '/mobile/games/complete', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_games_complete' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/games/history', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_games_history' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Perks & redemptions
        register_rest_route( 'culture/v1', '/mobile/perks', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_list_perks' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/perks/redeem', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_redeem_perk' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/perks/redemptions', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_user_redemptions' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'status' => array( 'default' => '', 'sanitize_callback' => 'sanitize_key' ),
            ),
        ) );

        // Passkeys
        register_rest_route( 'culture/v1', '/mobile/passkey/list', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_passkey_list' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/passkey/register-options', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_register_options' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/passkey/register-verify', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_register_verify' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/passkey/delete', array(
            'methods'             => 'DELETE',
            'callback'            => array( __CLASS__, 'handle_passkey_delete' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Avatar upload
        register_rest_route( 'culture/v1', '/mobile/me/avatar', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_upload_avatar' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Save an R2-hosted avatar URL (upload handled by Next.js proxy)
        register_rest_route( 'culture/v1', '/mobile/me/avatar-url', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_save_avatar_url' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Cover photo upload
        register_rest_route( 'culture/v1', '/mobile/me/cover-photo', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_upload_cover_photo' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Follow system
        register_rest_route( 'culture/v1', '/mobile/follow', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_follow_member' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'user_id'      => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'notify_posts' => array( 'default' => false ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/unfollow', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_unfollow_member' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/follow/notify', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_set_follow_notify' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'user_id'      => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'notify_posts' => array( 'default' => false ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/follow/status', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_follow_status' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/follow/following', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_following_usernames' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Portfolio
        register_rest_route( 'culture/v1', '/mobile/portfolio', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_portfolio' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
                'args'                => array(
                    'user_id' => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_save_portfolio' ),
                'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/portfolio/pin', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_pin_portfolio_post' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'pinned'  => array( 'default'  => true ),
            ),
        ) );

        // Member community posts (with author filter for profile screen)
        register_rest_route( 'culture/v1', '/mobile/member/(?P<id>\d+)/posts', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_member_posts' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'id'       => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 10, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // ── Shop endpoints (public — no auth required) ────────────────────────
        register_rest_route( 'culture/v1', '/mobile/shop/products', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_shop_products' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'category' => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
                'maker'    => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/shop/products/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_shop_product_detail' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/mobile/shop/categories', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_shop_categories' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/mobile/shop/vendors', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_shop_vendors' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/mobile/cart', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_cart' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        // Points & rewards config — public, no auth required
        register_rest_route( 'culture/v1', '/mobile/points-config', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_points_config' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/mobile/cart', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_add_to_cart' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'product_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'quantity'   => array( 'default' => 1,    'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/user/referrals', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_referrals' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/directory/entry', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_directory_entry' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'slug' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'id'   => array( 'required' => false, 'type' => 'integer' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/saved', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_saved' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/content/bookmark', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_bookmark' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'post_id'      => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'content_type' => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_key', 'default' => '' ),
                'action'       => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/articles/read-complete', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_article_read_complete' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/articles/(?P<slug>[a-zA-Z0-9-]+)/products', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_article_products' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/mobile/articles/(?P<slug>[a-zA-Z0-9-]+)/related', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_article_related' ),
            'permission_callback' => '__return_true',
        ) );

        // The Edit — curated editorial shop picks derived from articles with featured products.
        register_rest_route( 'culture/v1', '/mobile/shop/the-edit', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_the_edit' ),
            'permission_callback' => '__return_true',
        ) );
    }

    // -------------------------------------------------------------------------
    // Auth helpers
    // -------------------------------------------------------------------------

    public static function mobile_permission( $request ) {
        $header = $request->get_header( 'Authorization' );
        if ( ! $header || 0 !== strpos( $header, 'Bearer ' ) ) {
            return new WP_Error( 'no_token', 'Authentication required.', array( 'status' => 401 ) );
        }

        $raw_token = substr( $header, 7 );
        $hashed    = wp_hash( $raw_token );

        $users = get_users( array(
            'meta_key'   => self::TOKEN_META,
            'meta_value' => $hashed,
            'number'     => 1,
            'fields'     => 'ids',
        ) );

        if ( empty( $users ) ) {
            return new WP_Error( 'invalid_token', 'Token is invalid or has been revoked.', array( 'status' => 401 ) );
        }

        $user_id = (int) $users[0];

        $expires = (int) get_user_meta( $user_id, self::TOKEN_EXP_META, true );
        if ( $expires && time() > $expires ) {
            delete_user_meta( $user_id, self::TOKEN_META );
            delete_user_meta( $user_id, self::TOKEN_EXP_META );
            return new WP_Error( 'token_expired', 'Token has expired. Please log in again.', array( 'status' => 401 ) );
        }

        update_user_meta( $user_id, self::TOKEN_EXP_META, time() + self::TOKEN_TTL );

        wp_set_current_user( $user_id );
        return true;
    }

    private static function issue_token( int $user_id ): string {
        $raw    = wp_generate_password( 64, false );
        $hashed = wp_hash( $raw );

        update_user_meta( $user_id, self::TOKEN_META,     $hashed );
        update_user_meta( $user_id, self::TOKEN_EXP_META, time() + self::TOKEN_TTL );

        return $raw;
    }

    // -------------------------------------------------------------------------
    // Auth handlers
    // -------------------------------------------------------------------------

    public static function handle_login( $request ) {
        $email    = $request->get_param( 'email' );
        $username = $request->get_param( 'username' );
        $password = $request->get_param( 'password' );

        $credential = ! empty( $email ) ? $email : $username;
        if ( empty( $credential ) ) {
            return new WP_Error( 'missing_credential', 'email or username is required.', array( 'status' => 400 ) );
        }

        $user = wp_authenticate( $credential, $password );
        if ( is_wp_error( $user ) ) {
            return new WP_Error( 'invalid_credentials', 'Invalid credentials.', array( 'status' => 401 ) );
        }

        $verified = get_user_meta( $user->ID, '_culture_email_verified', true );
        if ( '0' === $verified ) {
            return new WP_Error(
                'email_not_verified',
                'Please verify your email address before logging in.',
                array( 'status' => 403 )
            );
        }

        $token = self::issue_token( $user->ID );

        return rest_ensure_response( array(
            'token' => $token,
            'user'  => self::full_profile( $user ),
        ) );
    }

    public static function handle_login_google( $request ) {
        $claims = Culture_Google_Auth::verify_id_token( $request->get_param( 'id_token' ) );
        if ( is_wp_error( $claims ) ) {
            return $claims;
        }

        $user = Culture_Google_Auth::find_or_create_user( $claims );
        if ( is_wp_error( $user ) ) {
            return $user;
        }

        $token = self::issue_token( $user->ID );

        return rest_ensure_response( array(
            'token' => $token,
            'user'  => self::full_profile( $user ),
        ) );
    }

    public static function handle_logout( $request ) {
        $user_id = get_current_user_id();
        delete_user_meta( $user_id, self::TOKEN_META );
        delete_user_meta( $user_id, self::TOKEN_EXP_META );
        return rest_ensure_response( array( 'success' => true ) );
    }

    public static function handle_register( $request ) {
        $ip       = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );
        $rl_key   = 'culture_mobile_reg_' . md5( $ip );
        $rl_count = (int) get_transient( $rl_key );
        if ( $rl_count >= 5 ) {
            return new WP_Error( 'rate_limited', 'Too many registration attempts. Please try again later.', array( 'status' => 429 ) );
        }
        set_transient( $rl_key, $rl_count + 1, HOUR_IN_SECONDS );

        $email    = $request->get_param( 'email' );
        $username = $request->get_param( 'username' );
        $password = $request->get_param( 'password' );
        $referral = $request->get_param( 'referral_code' ) ?: '';

        if ( strlen( $password ) < 8 ) {
            return new WP_Error( 'weak_password', 'Password must be at least 8 characters.', array( 'status' => 422 ) );
        }

        $user_id = wp_create_user( $username, $password, $email );
        if ( is_wp_error( $user_id ) ) {
            return new WP_Error( 'registration_failed', $user_id->get_error_message(), array( 'status' => 422 ) );
        }

        update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
        update_user_meta( $user_id, '_culture_points', 0 );
        update_user_meta( $user_id, '_culture_badges', array() );
        update_user_meta( $user_id, '_culture_directory_opt_in', '1' );

        // Process referral if provided.
        if ( ! empty( $referral ) && class_exists( 'Culture_Referrals' ) ) {
            $_COOKIE['culture_ref'] = $referral;
            Culture_Referrals::process_referral( $user_id );
        }

        $verify_token = wp_generate_password( 32, false );
        update_user_meta( $user_id, '_culture_email_verify_token',   wp_hash( $verify_token ) );
        update_user_meta( $user_id, '_culture_email_verify_expires', time() + DAY_IN_SECONDS );
        update_user_meta( $user_id, '_culture_email_verified',       '0' );

        if ( class_exists( 'Culture_Emails' ) ) {
            Culture_Emails::send_verification_email( $user_id, $verify_token, '' );
        }

        return rest_ensure_response( array(
            'success'               => true,
            'requires_verification' => true,
            'user_id'               => $user_id,
        ) );
    }

    // -------------------------------------------------------------------------
    // Profile handlers
    // -------------------------------------------------------------------------

    public static function handle_get_me( $request ) {
        $user = get_userdata( get_current_user_id() );
        return rest_ensure_response( self::full_profile( $user ) );
    }

    public static function handle_update_me( $request ) {
        $user_id = get_current_user_id();

        if ( $request->has_param( 'display_name' ) ) {
            $name = sanitize_text_field( $request->get_param( 'display_name' ) );
            if ( $name ) wp_update_user( array( 'ID' => $user_id, 'display_name' => $name ) );
        }

        $meta_map = array(
            'phone'                  => '_culture_phone',
            'whatsapp'               => '_culture_whatsapp',
            'gender'                 => '_culture_gender',
            'date_of_birth'          => '_culture_dob',
            'nationality'            => '_culture_nationality',
            'country_of_residence'   => '_culture_country_of_residence',
            'city'                   => '_culture_city',
            'occupation'             => '_culture_occupation',
            'avatar_url'             => '_culture_avatar_url',
            'directory_instagram'    => '_culture_directory_instagram',
            'directory_twitter'      => '_culture_directory_twitter',
            'directory_linkedin'     => '_culture_directory_linkedin',
            'directory_website'      => '_culture_directory_website',
        );

        foreach ( $meta_map as $param => $meta_key ) {
            if ( $request->has_param( $param ) ) {
                update_user_meta( $user_id, $meta_key, sanitize_text_field( $request->get_param( $param ) ) );
            }
        }

        if ( $request->has_param( 'directory_bio' ) ) {
            update_user_meta( $user_id, '_culture_directory_bio', sanitize_textarea_field( $request->get_param( 'directory_bio' ) ) );
        }

        if ( $request->has_param( 'directory_opt_in' ) ) {
            $val = $request->get_param( 'directory_opt_in' );
            update_user_meta( $user_id, '_culture_directory_opt_in', ( $val === '1' || $val === true ) ? '1' : '0' );
        }

        if ( $request->has_param( 'directory_disciplines' ) ) {
            $raw = $request->get_param( 'directory_disciplines' );
            if ( is_array( $raw ) ) {
                update_user_meta( $user_id, '_culture_directory_disciplines', array_map( 'sanitize_text_field', $raw ) );
            }
        }

        if ( $request->has_param( 'interests' ) ) {
            $interests_raw = $request->get_param( 'interests' );
            if ( is_array( $interests_raw ) ) {
                $allowed = array(
                    'fashion-streetwear', 'food-drink', 'live-music', 'music-production',
                    'independent-film', 'visual-art', 'architecture', 'photography',
                    'literature', 'visual-design', 'tech-culture', 'sport-wellness',
                    'travel', 'ideas', 'street-food', 'nightlife',
                );
                $valid = array_values( array_filter( array_map( 'sanitize_key', $interests_raw ), function( $s ) use ( $allowed ) {
                    return in_array( $s, $allowed, true );
                } ) );
                update_user_meta( $user_id, '_culture_interests', wp_json_encode( $valid ) );
            }
        }

        return rest_ensure_response( self::full_profile( get_userdata( $user_id ) ) );
    }

    public static function handle_push_token( $request ) {
        $user_id = get_current_user_id();
        $token   = $request->get_param( 'token' );

        $tokens = (array) get_user_meta( $user_id, '_culture_fcm_tokens', true );
        if ( ! in_array( $token, $tokens, true ) ) {
            $tokens[] = $token;
            $tokens   = array_slice( array_values( $tokens ), -3 );
        }
        update_user_meta( $user_id, '_culture_fcm_tokens', $tokens );

        return rest_ensure_response( array( 'success' => true ) );
    }

    // -------------------------------------------------------------------------
    // Community feed handlers
    // -------------------------------------------------------------------------

    public static function handle_get_community_posts( $request ) {
        $user_id  = get_current_user_id();
        $page     = (int) $request->get_param( 'page' );
        $per_page = min( (int) $request->get_param( 'per_page' ), 50 );

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ) );

        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );
        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $posts = array_map( function( $post ) use ( $liked_ids, $reactions_map ) {
            return self::format_community_post( $post, $liked_ids, $reactions_map );
        }, $query->posts );

        return rest_ensure_response( $posts );
    }

    const SECTION_TAGS = array( 'Music', 'Fashion', 'Art', 'Film', 'Food', 'Sport', 'Travel', 'Ideas', 'Literature', 'Design', 'Tech' );

    const UPLOAD_ALLOWED_TYPES = array( 'image/jpeg', 'image/png', 'image/webp', 'image/gif' );
    const UPLOAD_MAX_BYTES     = 8 * 1024 * 1024; // 8 MB, matches web's limit.

    /**
     * Mobile community image upload — accepts a multipart `file` field,
     * stores it in Cloudflare R2 (same bucket the web app uses), and
     * returns its URL for use as `image_url` on /community/submit.
     */
    public static function handle_upload_image( $request ) {
        $user_id = get_current_user_id();
        $url     = self::upload_to_r2_from_request( $request, 'community/' . $user_id );

        if ( is_wp_error( $url ) ) {
            return $url;
        }

        return rest_ensure_response( array( 'url' => $url ) );
    }

    /**
     * Shared helper: validate the multipart `file` field on a REST request
     * and upload it to Cloudflare R2 under the given key prefix.
     *
     * @param WP_REST_Request $request    Incoming request.
     * @param string          $key_prefix Object key prefix, e.g. "community/123".
     * @return string|WP_Error Public R2 URL, or WP_Error.
     */
    private static function upload_to_r2_from_request( $request, $key_prefix ) {
        $files = $request->get_file_params();
        $file  = $files['file'] ?? null;

        if ( empty( $file ) || empty( $file['tmp_name'] ) ) {
            return new WP_Error( 'no_file', __( 'No file provided.', 'culture-community' ), array( 'status' => 400 ) );
        }

        if ( ! in_array( $file['type'], self::UPLOAD_ALLOWED_TYPES, true ) ) {
            return new WP_Error( 'invalid_type', __( 'Only JPEG, PNG, WebP, or GIF allowed.', 'culture-community' ), array( 'status' => 400 ) );
        }

        if ( $file['size'] > self::UPLOAD_MAX_BYTES ) {
            return new WP_Error( 'too_large', __( 'Image must be under 8 MB.', 'culture-community' ), array( 'status' => 400 ) );
        }

        $body = file_get_contents( $file['tmp_name'] );
        if ( false === $body ) {
            return new WP_Error( 'read_failed', __( 'Could not read uploaded file.', 'culture-community' ), array( 'status' => 500 ) );
        }

        $ext_map = array(
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        );
        $ext = $ext_map[ $file['type'] ] ?? 'jpg';
        $key = trailingslashit( $key_prefix ) . time() . '.' . $ext;

        $url = Culture_R2::upload( $key, $body, $file['type'] );

        if ( is_wp_error( $url ) ) {
            return new WP_Error( 'upload_failed', $url->get_error_message(), array( 'status' => 500 ) );
        }

        return $url;
    }

    public static function handle_submit_post( $request ) {
        $user_id = get_current_user_id();
        $content = $request->get_param( 'content' );
        $image   = $request->get_param( 'image_url' ) ?: '';
        $tag     = $request->get_param( 'tag' ) ?: '';
        $tag     = in_array( $tag, self::SECTION_TAGS, true ) ? $tag : '';

        if ( empty( trim( $content ) ) ) {
            return new WP_Error( 'empty_content', 'Post content cannot be empty.', array( 'status' => 400 ) );
        }

        if ( strlen( $content ) > 1000 ) {
            return new WP_Error( 'too_long', 'Post content exceeds 1000 characters.', array( 'status' => 400 ) );
        }

        $tier = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';
        if ( 'citizen' === $tier && preg_match( '/https?:\/\//i', $content ) ) {
            return new WP_Error( 'links_not_allowed', 'Moveee Citizen members cannot post links.', array( 'status' => 403 ) );
        }

        $rl_key   = 'culture_post_rate_' . $user_id;
        $rl_count = (int) get_transient( $rl_key );
        if ( $rl_count >= 5 ) {
            return new WP_Error( 'rate_limited', 'You are posting too frequently. Please wait a moment.', array( 'status' => 429 ) );
        }
        set_transient( $rl_key, $rl_count + 1, 10 * MINUTE_IN_SECONDS );

        $content_hash = md5( strtolower( trim( $content ) ) );
        $dup_key      = 'culture_post_dup_' . $user_id . '_' . $content_hash;
        if ( get_transient( $dup_key ) ) {
            return new WP_Error( 'duplicate', 'You already submitted this post recently.', array( 'status' => 409 ) );
        }
        set_transient( $dup_key, true, 30 * MINUTE_IN_SECONDS );

        // Template gating: poll and itinerary require Taste Maker (2 500 rep).
        $template_check = sanitize_key( $request->get_param( 'template_type' ) ?: 'post' );
        if ( in_array( $template_check, array( 'poll', 'itinerary' ), true ) ) {
            $tier = get_user_meta( $user_id, '_culture_membership_tier', true );
            if ( 'patron' !== $tier ) {
                $rep = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $user_id ) : 0;
                if ( $rep < 2500 ) {
                    return new WP_Error( 'rep_required', 'Poll and itinerary posts require Moveee Pro membership or Taste Maker status (2,500 points).', array( 'status' => 403 ) );
                }
            }
        }
        // Event posts require Culture Contributor (500 rep), same floor as the legacy editorial event endpoint.
        if ( 'event' === $template_check ) {
            $tier = get_user_meta( $user_id, '_culture_membership_tier', true );
            if ( 'patron' !== $tier ) {
                $rep = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $user_id ) : 0;
                if ( $rep < 500 ) {
                    return new WP_Error( 'rep_required', 'Creating events requires Moveee Pro membership or Culture Contributor status (500 points).', array( 'status' => 403 ) );
                }
            }
        }

        $review_days = (int) get_option( 'culture_new_member_review_days', 7 );
        $user        = get_userdata( $user_id );
        $age_days    = (int) floor( ( time() - strtotime( $user->user_registered ) ) / DAY_IN_SECONDS );
        $needs_review = $review_days > 0 && $age_days < $review_days;
        // Taste Makers (2 500 rep) bypass the new-member review queue.
        if ( $needs_review && class_exists( 'Culture_Gamification' ) ) {
            $rep = Culture_Gamification::get_reputation( $user_id );
            if ( $rep >= 2500 ) $needs_review = false;
        }
        $status = $needs_review ? 'pending' : 'publish';

        $post_id = wp_insert_post( array(
            'post_type'    => 'culture_post',
            'post_status'  => $status,
            'post_author'  => $user_id,
            'post_content' => $content,
            'post_title'   => wp_trim_words( $content, 10 ),
        ) );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error( 'insert_failed', 'Could not create post.', array( 'status' => 500 ) );
        }

        if ( $image ) {
            update_post_meta( $post_id, 'community_image_url', $image );
        }

        if ( $tag ) {
            update_post_meta( $post_id, 'community_tag', $tag );
        }

        // Phase 4: Save template-specific meta.
        $template = sanitize_key( $request->get_param( 'template_type' ) ?: 'post' );
        $allowed_templates = array( 'post', 'hidden-gem', 'cultural-take', 'food-review', 'book-review', 'creative-showcase', 'poll', 'itinerary', 'event', 'quote' );
        if ( in_array( $template, $allowed_templates, true ) ) {
            update_post_meta( $post_id, '_template_type', $template );
        }

        // Gallery images (all templates that support multi-photo, max 4).
        $gallery_raw = $request->get_param( 'gallery_images' );
        if ( is_array( $gallery_raw ) && count( $gallery_raw ) > 0 ) {
            update_post_meta( $post_id, '_gallery_images', wp_json_encode( array_map( 'esc_url_raw', array_slice( $gallery_raw, 0, 4 ) ) ) );
        }

        if ( $request->get_param( 'linked_directory_id' ) ) {
            update_post_meta( $post_id, '_linked_directory_id', (int) $request->get_param( 'linked_directory_id' ) );
        }

        // ── Hidden Gem ─────────────────────────────────────────────────────────
        if ( $template === 'hidden-gem' ) {
            if ( $request->get_param( 'star_rating' ) ) {
                update_post_meta( $post_id, '_star_rating', max( 1, min( 5, (int) $request->get_param( 'star_rating' ) ) ) );
            }
            if ( $request->get_param( 'place_name' ) ) {
                update_post_meta( $post_id, '_place_name', sanitize_text_field( $request->get_param( 'place_name' ) ) );
            }
            if ( $request->get_param( 'place_location' ) ) {
                update_post_meta( $post_id, '_place_location', sanitize_text_field( $request->get_param( 'place_location' ) ) );
            }
            if ( $request->get_param( 'price_range' ) ) {
                update_post_meta( $post_id, '_price_range', sanitize_text_field( $request->get_param( 'price_range' ) ) );
            }
            if ( $request->get_param( 'opening_hours' ) ) {
                update_post_meta( $post_id, '_opening_hours', sanitize_text_field( $request->get_param( 'opening_hours' ) ) );
            }
        }

        // ── Cultural Take ──────────────────────────────────────────────────────
        if ( $template === 'cultural-take' ) {
            if ( $request->get_param( 'headline' ) ) {
                update_post_meta( $post_id, '_cultural_take_headline', sanitize_text_field( $request->get_param( 'headline' ) ) );
            }
        }

        // ── Food Review ────────────────────────────────────────────────────────
        if ( $template === 'food-review' ) {
            if ( $request->get_param( 'food_dish_name' ) ) {
                update_post_meta( $post_id, '_food_dish_name', sanitize_text_field( $request->get_param( 'food_dish_name' ) ) );
            }
            update_post_meta( $post_id, '_food_rating_taste', max( 1, min( 5, (int) $request->get_param( 'food_rating_taste' ) ) ) );
            update_post_meta( $post_id, '_food_rating_value', max( 1, min( 5, (int) $request->get_param( 'food_rating_value' ) ) ) );
            update_post_meta( $post_id, '_food_rating_vibe',  max( 1, min( 5, (int) $request->get_param( 'food_rating_vibe' ) ) ) );
            if ( $request->get_param( 'cuisine_tag' ) ) {
                update_post_meta( $post_id, '_cuisine_tag', sanitize_text_field( $request->get_param( 'cuisine_tag' ) ) );
            }
            if ( $request->get_param( 'price_range' ) ) {
                update_post_meta( $post_id, '_price_range', sanitize_text_field( $request->get_param( 'price_range' ) ) );
            }
        }

        // ── Book Review ────────────────────────────────────────────────────────
        if ( $template === 'book-review' ) {
            if ( $request->get_param( 'book_title' ) ) {
                update_post_meta( $post_id, '_book_title',   sanitize_text_field( $request->get_param( 'book_title' ) ) );
                update_post_meta( $post_id, '_book_author',  sanitize_text_field( $request->get_param( 'book_author' ) ?: '' ) );
            }
            $allowed_statuses = array( 'Finished', 'Reading', 'Want to Read' );
            $book_status = $request->get_param( 'book_status' );
            if ( in_array( $book_status, $allowed_statuses, true ) ) {
                update_post_meta( $post_id, '_book_status', $book_status );
            }
            update_post_meta( $post_id, '_book_overall_rating',    max( 1, min( 5, (int) $request->get_param( 'book_overall_rating' ) ) ) );
            update_post_meta( $post_id, '_book_rating_writing',    max( 0, min( 5, (int) $request->get_param( 'book_rating_writing' ) ) ) );
            update_post_meta( $post_id, '_book_rating_story',      max( 0, min( 5, (int) $request->get_param( 'book_rating_story' ) ) ) );
            update_post_meta( $post_id, '_book_rating_characters', max( 0, min( 5, (int) $request->get_param( 'book_rating_characters' ) ) ) );
            update_post_meta( $post_id, '_book_rating_pacing',     max( 0, min( 5, (int) $request->get_param( 'book_rating_pacing' ) ) ) );
            if ( $request->get_param( 'book_fav_quote' ) ) {
                update_post_meta( $post_id, '_book_fav_quote', sanitize_textarea_field( $request->get_param( 'book_fav_quote' ) ) );
            }
            $book_recommend = $request->get_param( 'book_recommend' );
            if ( $book_recommend !== null ) {
                update_post_meta( $post_id, '_book_recommend', (bool) $book_recommend ? '1' : '0' );
            }
            $book_genres = $request->get_param( 'book_genres' );
            if ( is_array( $book_genres ) ) {
                update_post_meta( $post_id, '_book_genres', wp_json_encode( array_map( 'sanitize_text_field', $book_genres ) ) );
            }
        }

        // ── Creative Showcase ──────────────────────────────────────────────────
        if ( $template === 'creative-showcase' ) {
            if ( $request->get_param( 'showcase_title' ) ) {
                update_post_meta( $post_id, '_showcase_title', sanitize_text_field( $request->get_param( 'showcase_title' ) ) );
            }
            if ( $request->get_param( 'showcase_medium' ) ) {
                update_post_meta( $post_id, '_showcase_medium', sanitize_text_field( $request->get_param( 'showcase_medium' ) ) );
            }
            if ( $request->get_param( 'collaborator' ) ) {
                update_post_meta( $post_id, '_showcase_collaborator', sanitize_text_field( $request->get_param( 'collaborator' ) ) );
            }
            if ( $request->get_param( 'collaborator_username' ) ) {
                update_post_meta( $post_id, '_showcase_collaborator_username', sanitize_text_field( $request->get_param( 'collaborator_username' ) ) );
            }
            if ( $request->get_param( 'video_url' ) ) {
                update_post_meta( $post_id, '_video_url', esc_url_raw( $request->get_param( 'video_url' ) ) );
            }
        }

        // ── Poll ───────────────────────────────────────────────────────────────
        if ( $template === 'poll' ) {
            $poll_options = $request->get_param( 'poll_options' );
            if ( is_array( $poll_options ) ) {
                $clean_options = array_map( function( $opt ) {
                    return array( 'text' => sanitize_text_field( $opt['text'] ?? (string) $opt ), 'votes' => 0 );
                }, array_slice( $poll_options, 0, 4 ) );
                update_post_meta( $post_id, '_poll_options', wp_json_encode( $clean_options ) );
            }
            update_post_meta( $post_id, '_poll_expires_at', sanitize_text_field( $request->get_param( 'poll_expires_at' ) ?: '' ) );
            update_post_meta( $post_id, '_poll_voters', wp_json_encode( array() ) );
            if ( $request->get_param( 'poll_description' ) ) {
                update_post_meta( $post_id, '_poll_description', sanitize_textarea_field( $request->get_param( 'poll_description' ) ) );
            }
        }

        // ── Itinerary ──────────────────────────────────────────────────────────
        if ( $template === 'itinerary' ) {
            if ( $request->get_param( 'itinerary_title' ) ) {
                update_post_meta( $post_id, '_itinerary_title', sanitize_text_field( $request->get_param( 'itinerary_title' ) ) );
            }
            $stops = $request->get_param( 'itinerary_stops' );
            if ( is_array( $stops ) ) {
                $clean_stops = array_map( function( $stop ) {
                    return array(
                        'name'      => sanitize_text_field( $stop['name'] ?? '' ),
                        'note'      => sanitize_text_field( $stop['note'] ?? '' ),
                        'lat'       => (float) ( $stop['lat'] ?? 0 ),
                        'lng'       => (float) ( $stop['lng'] ?? 0 ),
                        'image_url' => esc_url_raw( $stop['image_url'] ?? '' ),
                    );
                }, array_slice( $stops, 0, 10 ) );
                update_post_meta( $post_id, '_itinerary_stops', wp_json_encode( $clean_stops ) );
            }
            if ( $request->get_param( 'itinerary_city' ) ) {
                update_post_meta( $post_id, '_itinerary_city', sanitize_text_field( $request->get_param( 'itinerary_city' ) ) );
            }
            if ( $request->get_param( 'itinerary_budget' ) ) {
                update_post_meta( $post_id, '_itinerary_budget', sanitize_text_field( $request->get_param( 'itinerary_budget' ) ) );
            }
            if ( $request->get_param( 'itinerary_duration' ) ) {
                update_post_meta( $post_id, '_itinerary_duration', sanitize_text_field( $request->get_param( 'itinerary_duration' ) ) );
            }
            if ( $request->get_param( 'itinerary_best_time' ) ) {
                update_post_meta( $post_id, '_itinerary_best_time', sanitize_text_field( $request->get_param( 'itinerary_best_time' ) ) );
            }
        }

        // ── Quote ─────────────────────────────────────────────────────────────
        if ( $template === 'quote' ) {
            if ( $request->get_param( 'quote_author' ) ) {
                update_post_meta( $post_id, '_quote_author', sanitize_text_field( $request->get_param( 'quote_author' ) ) );
            }
            if ( $request->get_param( 'quote_source' ) ) {
                update_post_meta( $post_id, '_quote_source', sanitize_text_field( $request->get_param( 'quote_source' ) ) );
            }
            if ( $request->get_param( 'sharing_reason' ) ) {
                update_post_meta( $post_id, '_quote_sharing_reason', sanitize_textarea_field( $request->get_param( 'sharing_reason' ) ) );
            }
            $allowed_quote_types = array( 'Person', 'Book', 'Film', 'Speech', 'Song' );
            $quote_type = $request->get_param( 'quote_type' );
            if ( $quote_type && in_array( $quote_type, $allowed_quote_types, true ) ) {
                update_post_meta( $post_id, '_quote_type', sanitize_text_field( $quote_type ) );
            }
        }

        // ── Event ─────────────────────────────────────────────────────────────
        if ( $template === 'event' ) {
            update_post_meta( $post_id, '_event_date',      sanitize_text_field( $request->get_param( 'event_date' ) ?: '' ) );
            update_post_meta( $post_id, '_event_end_date',  sanitize_text_field( $request->get_param( 'event_end_date' ) ?: '' ) );
            update_post_meta( $post_id, '_event_venue',     sanitize_text_field( $request->get_param( 'event_venue' ) ?: '' ) );
            update_post_meta( $post_id, '_event_city',      sanitize_text_field( $request->get_param( 'event_city' ) ?: '' ) );
            update_post_meta( $post_id, '_event_address',   sanitize_text_field( $request->get_param( 'event_address' ) ?: '' ) );
            update_post_meta( $post_id, '_event_admission', sanitize_text_field( $request->get_param( 'event_admission' ) ?: '' ) );
            update_post_meta( $post_id, '_event_ticket_url', esc_url_raw( $request->get_param( 'ticket_url' ) ?: '' ) );
            update_post_meta( $post_id, '_event_category',  sanitize_text_field( $request->get_param( 'event_category' ) ?: '' ) );
            if ( $request->get_param( 'organiser_directory_id' ) ) {
                update_post_meta( $post_id, '_culture_event_organiser_id', (int) $request->get_param( 'organiser_directory_id' ) );
            }

            // RSVP toggle + capacity — Moveee Pro (patron) privilege only.
            if ( $request->get_param( 'rsvp_enabled' ) ) {
                if ( Culture_Community_RSVP::is_pro( $user_id ) ) {
                    update_post_meta( $post_id, '_culture_rsvp_enabled', 1 );
                    update_post_meta( $post_id, '_culture_rsvp_capacity', max( 0, (int) $request->get_param( 'rsvp_capacity' ) ) );
                }
                // Silently ignored for non-Pro members rather than failing the whole
                // post — the composer UI already gates the toggle behind a lock icon.
            }
        }

        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'community_post' );
            $rep      = Culture_Gamification::get_reputation( $user_id );
            $rep_tier = Culture_Gamification::get_reputation_tier( $rep, $user_id );
            update_post_meta( $post_id, 'community_author_rep_tier', $rep_tier );
        }

        // Snapshot author display fields so the feed never needs live user lookups.
        $author_user = get_userdata( $user_id );
        update_post_meta( $post_id, 'community_author_id',       (string) $user_id );
        update_post_meta( $post_id, 'community_author_name',     $author_user ? $author_user->display_name : '' );
        update_post_meta( $post_id, 'community_author_username', $author_user ? $author_user->user_login   : '' );
        update_post_meta( $post_id, 'community_author_avatar',   get_user_meta( $user_id, '_culture_avatar_url',       true ) ?: '' );
        update_post_meta( $post_id, 'community_author_tier',     get_user_meta( $user_id, '_culture_membership_tier',  true ) ?: 'citizen' );

        // Extract @mentions from post content and notify mentioned users.
        $mention_matches = array();
        preg_match_all( '/@(\w+)/', $content, $mention_matches );
        $mentioned_usernames = array_unique( $mention_matches[1] );
        if ( ! empty( $mentioned_usernames ) ) {
            $author_data = get_userdata( $user_id );
            $author_name = $author_data ? $author_data->display_name : 'Someone';
            $post_slug   = get_post_field( 'post_name', $post_id );
            foreach ( $mentioned_usernames as $username ) {
                $mentioned = get_user_by( 'login', $username );
                if ( $mentioned && (int) $mentioned->ID !== (int) $user_id ) {
                    Culture_Notifications::add(
                        (int) $mentioned->ID,
                        'mention',
                        $author_name . ' mentioned you',
                        wp_trim_words( $content, 15, '…' ),
                        '/community/' . $post_slug,
                        array( 'post_id' => $post_id, 'author_id' => $user_id )
                    );
                }
            }
        }

        // Notify followers who opted in to be told when this author posts.
        if ( class_exists( 'Culture_Follows' ) ) {
            Culture_Follows::notify_followers_of_post( $user_id, $post_id );
        }

        $post = get_post( $post_id );
        return rest_ensure_response( self::format_community_post( $post, array() ) );
    }

    const COMMENTABLE_POST_TYPES = array( 'culture_post', 'pulse_story', 'post', 'culture_quote' );

    public static function handle_get_comments( $request ) {
        $post_id = (int) $request->get_param( 'post_id' );
        $post    = get_post( $post_id );

        if ( ! $post || ! in_array( $post->post_type, self::COMMENTABLE_POST_TYPES, true ) ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $comments = get_comments( array(
            'post_id' => $post_id,
            'status'  => 'approve',
            'orderby' => 'comment_date',
            'order'   => 'ASC',
        ) );

        $out = array_map( function( $c ) {
            $user_id = (int) $c->user_id;
            $avatar  = $user_id ? get_user_meta( $user_id, '_culture_avatar_url', true ) : '';
            return array(
                'id'          => (string) $c->comment_ID,
                'content'     => wp_strip_all_tags( $c->comment_content ),
                'publishedAt' => $c->comment_date_gmt,
                'likeCount'   => 0,
                'liked'       => false,
                'author'      => array(
                    'id'        => (string) $user_id,
                    'name'      => $c->comment_author,
                    'avatarUrl' => $avatar ?: '',
                ),
            );
        }, $comments );

        return rest_ensure_response( $out );
    }

    public static function handle_add_comment( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        $content = $request->get_param( 'content' );

        $post = get_post( $post_id );
        if ( ! $post || ! in_array( $post->post_type, self::COMMENTABLE_POST_TYPES, true ) || 'publish' !== $post->post_status ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $rl_key   = 'culture_comment_rate_' . $user_id;
        $rl_count = (int) get_transient( $rl_key );
        if ( $rl_count >= 10 ) {
            return new WP_Error( 'rate_limited', 'You are commenting too frequently.', array( 'status' => 429 ) );
        }
        set_transient( $rl_key, $rl_count + 1, 10 * MINUTE_IN_SECONDS );

        $user       = get_userdata( $user_id );
        $comment_id = wp_insert_comment( array(
            'comment_post_ID'      => $post_id,
            'comment_author'       => $user->display_name,
            'comment_author_email' => $user->user_email,
            'comment_content'      => sanitize_textarea_field( $content ),
            'user_id'              => $user_id,
            'comment_approved'     => 1,
        ) );

        if ( ! $comment_id ) {
            return new WP_Error( 'save_failed', 'Could not save comment.', array( 'status' => 500 ) );
        }

        if ( class_exists( 'Culture_Gamification' ) ) {
            // Use the correct action based on post type:
            // magazine articles ('post') → 5 rep + 2 credits
            // community/pulse posts     → 8 rep + 0 credits
            $action = ( $post->post_type === 'post' ) ? 'magazine_comment' : 'community_comment';
            Culture_Gamification::award_points( $user_id, $action );
            Culture_Gamification::check_post_threshold( $post_id );
        }

        $avatar = get_user_meta( $user_id, '_culture_avatar_url', true ) ?: '';

        return rest_ensure_response( array(
            'id'          => (string) $comment_id,
            'content'     => $content,
            'publishedAt' => current_time( 'c' ),
            'likeCount'   => 0,
            'liked'       => false,
            'author'      => array(
                'id'        => (string) $user_id,
                'name'      => $user->display_name,
                'avatarUrl' => $avatar,
            ),
        ) );
    }

    /**
     * Mobile quote submission — delegates to the shared quote-creation logic
     * in Culture_REST_API, authenticated as the current mobile (Bearer token) user.
     */
    public static function handle_submit_quote( $request ) {
        return Culture_REST_API::handle_create_quote( $request );
    }

    /**
     * Mobile event submission — maps the simplified mobile form fields onto
     * Culture_REST_API::handle_create_event's expected params (excerpt/content
     * derived from a single description field, submitter identity from the
     * authenticated mobile user, never auto-published).
     */
    public static function handle_submit_event_mobile( $request ) {
        $user = wp_get_current_user();
        $description = (string) $request->get_param( 'description' );

        $request->set_param( 'excerpt', $description );
        $request->set_param( 'content', $description );
        $request->set_param( 'auto_publish', false );
        $request->set_param( 'ai_generated', false );
        $request->set_param( 'submitter_name', $user->display_name );
        $request->set_param( 'submitter_email', $user->user_email );

        return Culture_REST_API::handle_create_event( $request );
    }

    /**
     * Mobile directory entry submission — Moveee Pro (patron) privilege,
     * delegates to Culture_Directory::handle_submit with the authenticated
     * mobile user as submitter (mirrors web's /api/directory/submit gate).
     */
    public static function handle_submit_directory_mobile( $request ) {
        $user_id     = get_current_user_id();
        $stored_tier = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';
        $tier        = ( is_super_admin( $user_id ) || user_can( $user_id, 'manage_options' ) ) ? 'patron' : $stored_tier;

        if ( 'patron' !== $tier ) {
            return new WP_Error(
                'patron_required',
                __( 'Moveee Pro membership required to submit directory entries.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        $request->set_param( 'user_id', $user_id );
        $request->set_param( 'ai_generated', false );
        $request->set_param( 'auto_publish', false );

        return Culture_Directory::handle_submit( $request );
    }

    public static function handle_poll_vote( $request ) {
        $user_id      = get_current_user_id();
        $post_id      = (int) $request->get_param( 'post_id' );
        $option_index = (int) $request->get_param( 'option_index' );

        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $voters_raw = get_post_meta( $post_id, '_poll_voters', true );
        $voters     = json_decode( $voters_raw ?: '{}', true );
        if ( ! is_array( $voters ) ) $voters = array();

        if ( isset( $voters[ (string) $user_id ] ) ) {
            return new WP_Error( 'already_voted', 'You have already voted.', array( 'status' => 409 ) );
        }

        $options_raw = get_post_meta( $post_id, '_poll_options', true );
        $options     = json_decode( $options_raw ?: '[]', true );
        if ( ! is_array( $options ) || ! isset( $options[ $option_index ] ) ) {
            return new WP_Error( 'invalid_option', 'Invalid option index.', array( 'status' => 400 ) );
        }

        $options[ $option_index ]['votes'] = (int) $options[ $option_index ]['votes'] + 1;
        $voters[ (string) $user_id ]       = $option_index;

        update_post_meta( $post_id, '_poll_options', wp_json_encode( $options ) );
        update_post_meta( $post_id, '_poll_voters',  wp_json_encode( $voters ) );

        return rest_ensure_response( array( 'options' => $options ) );
    }

    /* ——————————————————————————————————————
     *  Community event RSVPs
     * —————————————————————————————————————— */

    public static function handle_community_event_rsvp( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        $result  = Culture_Community_RSVP::rsvp( $post_id, $user_id );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
        return rest_ensure_response( Culture_Community_RSVP::get_status( $post_id, $user_id ) );
    }

    public static function handle_community_event_rsvp_cancel( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        Culture_Community_RSVP::cancel( $post_id, $user_id );
        return rest_ensure_response( Culture_Community_RSVP::get_status( $post_id, $user_id ) );
    }

    public static function handle_community_event_rsvp_status( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        return rest_ensure_response( Culture_Community_RSVP::get_status( $post_id, $user_id ) );
    }

    public static function handle_community_event_attendees( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );

        if ( ! Culture_Community_RSVP::is_pro( $user_id ) ) {
            return new WP_Error( 'patron_required', 'Moveee Pro membership required to manage event RSVPs.', array( 'status' => 403 ) );
        }
        if ( ! Culture_Community_RSVP::is_organiser( $post_id, $user_id ) ) {
            return new WP_Error( 'forbidden', 'Only the event organiser can view attendees.', array( 'status' => 403 ) );
        }

        $attendees = array_map( function( $row ) {
            return array(
                'userId'      => (int) $row['user_id'],
                'displayName' => $row['display_name'],
                'email'       => $row['user_email'],
                'rsvpAt'      => $row['created_at'],
            );
        }, Culture_Community_RSVP::get_attendees( $post_id ) );

        return rest_ensure_response( array( 'attendees' => $attendees ) );
    }

    public static function handle_community_my_events( $request ) {
        $user_id = get_current_user_id();

        if ( ! Culture_Community_RSVP::is_pro( $user_id ) ) {
            return new WP_Error( 'patron_required', 'Moveee Pro membership required to manage event RSVPs.', array( 'status' => 403 ) );
        }

        return rest_ensure_response( array( 'events' => Culture_Community_RSVP::get_organiser_events( $user_id ) ) );
    }

    /* ——————————————————————————————————————
     *  Stoop clusters (mobile, JWT)
     * —————————————————————————————————————— */

    public static function handle_cluster_create( $request ) {
        $user_id = get_current_user_id();
        $data    = array(
            'name'              => (string) $request->get_param( 'name' ),
            'city'              => (string) $request->get_param( 'city' ),
            'street'            => (string) $request->get_param( 'street' ),
            'country'           => (string) $request->get_param( 'country' ),
            'capacity'          => $request->get_param( 'capacity' ),
            'meetingDay'        => (string) $request->get_param( 'meeting_day' ),
            'meetingTime'       => (string) $request->get_param( 'meeting_time' ),
            'locationNote'      => (string) $request->get_param( 'location_note' ),
            'venueType'         => (string) $request->get_param( 'venue_type' ),
            'hostNote'          => (string) $request->get_param( 'host_note' ),
            'realisticCapacity' => (int) ( $request->get_param( 'realistic_capacity' ) ?: 0 ),
            'accessible'        => (bool) $request->get_param( 'accessible' ),
            'addressVisible'    => (string) ( $request->get_param( 'address_visible' ) ?: 'members_only' ),
            'localityConfirmed' => (bool) $request->get_param( 'locality_confirmed' ),
        );

        $result = Culture_Clusters::create_cluster( $user_id, $data );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( Culture_Clusters::get_cluster( $result ) );
    }

    public static function handle_cluster_discover( $request ) {
        $params = array(
            'q'        => (string) $request->get_param( 'q' ),
            'city'     => (string) $request->get_param( 'city' ),
            'country'  => (string) $request->get_param( 'country' ),
            'status'   => (string) $request->get_param( 'status' ),
            'sort'     => (string) $request->get_param( 'sort' ),
            'page'     => (int) ( $request->get_param( 'page' ) ?: 1 ),
            'per_page' => (int) ( $request->get_param( 'per_page' ) ?: 20 ),
        );

        return rest_ensure_response( Culture_Clusters::discover( $params ) );
    }

    public static function handle_cluster_my_clusters( $request ) {
        $user_id = get_current_user_id();
        return rest_ensure_response( array( 'clusters' => Culture_Clusters::list_for_user( $user_id ) ) );
    }

    public static function handle_cluster_get( $request ) {
        $cluster_id = (int) $request->get_param( 'id' );
        $cluster    = Culture_Clusters::get_cluster( $cluster_id );
        if ( ! $cluster ) {
            return new WP_Error( 'not_found', 'Cluster not found.', array( 'status' => 404 ) );
        }
        return rest_ensure_response( $cluster );
    }

    public static function handle_cluster_status( $request ) {
        $user_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );
        return rest_ensure_response( Culture_Clusters::get_member_status( $cluster_id, $user_id ) );
    }

    public static function handle_cluster_join( $request ) {
        $user_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );

        $result = Culture_Clusters::join( $cluster_id, $user_id );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( Culture_Clusters::get_member_status( $cluster_id, $user_id ) );
    }

    public static function handle_cluster_leave( $request ) {
        $user_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );

        Culture_Clusters::leave( $cluster_id, $user_id );

        return rest_ensure_response( Culture_Clusters::get_member_status( $cluster_id, $user_id ) );
    }

    public static function handle_cluster_election_start( $request ) {
        $user_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );

        $result = Culture_Clusters::start_election( $cluster_id, $user_id );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( Culture_Clusters::get_election_status( $cluster_id, $user_id ) );
    }

    public static function handle_cluster_election_vote( $request ) {
        $user_id      = get_current_user_id();
        $cluster_id   = (int) $request->get_param( 'id' );
        $candidate_id = (int) $request->get_param( 'candidate_id' );

        $result = Culture_Clusters::cast_vote( $cluster_id, $user_id, $candidate_id );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( Culture_Clusters::get_election_status( $cluster_id, $user_id ) );
    }

    public static function handle_cluster_election_status( $request ) {
        $user_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );

        return rest_ensure_response( Culture_Clusters::get_election_status( $cluster_id, $user_id ) );
    }

    public static function handle_cluster_members( $request ) {
        $cluster_id = (int) $request->get_param( 'id' );

        return rest_ensure_response( array( 'members' => Culture_Clusters::get_members( $cluster_id ) ) );
    }

    public static function handle_cluster_host_qr( $request ) {
        $host_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );

        $result = Culture_Clusters::generate_host_qr( $cluster_id, $host_id );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    public static function handle_cluster_checkin( $request ) {
        $user_id      = get_current_user_id();
        $cluster_id   = (int) $request->get_param( 'id' );
        $meeting_date = (string) $request->get_param( 'meeting_date' );
        $expires_at   = (int) $request->get_param( 'expires_at' );
        $token        = (string) $request->get_param( 'token' );

        $verified = Culture_Clusters::verify_checkin_qr( $cluster_id, $meeting_date, $expires_at, $token );
        if ( is_wp_error( $verified ) ) {
            return $verified;
        }

        $result = Culture_Clusters::check_in( $cluster_id, $user_id, 'qr', $meeting_date );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    public static function handle_cluster_checkin_manual( $request ) {
        $host_id        = get_current_user_id();
        $cluster_id     = (int) $request->get_param( 'id' );
        $member_user_id = (int) $request->get_param( 'member_user_id' );

        $cluster = Culture_Clusters::get_cluster( $cluster_id );
        if ( ! $cluster ) {
            return new WP_Error( 'not_found', 'Stoop not found.', array( 'status' => 404 ) );
        }
        if ( (int) $cluster['hostId'] !== $host_id ) {
            return new WP_Error( 'forbidden', 'Only the current host can record manual check-ins.', array( 'status' => 403 ) );
        }

        $result = Culture_Clusters::check_in( $cluster_id, $member_user_id, 'host_manual' );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    public static function handle_cluster_attendance( $request ) {
        $user_id    = get_current_user_id();
        $cluster_id = (int) $request->get_param( 'id' );

        return rest_ensure_response( Culture_Clusters::get_attendance_history( $cluster_id, $user_id ) );
    }

    const REACTABLE_POST_TYPES = array( 'culture_post', 'pulse_story', 'culture_quote', 'post' );
    const REACTION_TYPES = array( 'love', 'fire', 'clap' );

    /**
     * Toggles/switches a single user's reaction on a post. Reaction state is
     * tracked per-user, per-post, per-type via `_culture_post_reactions`
     * usermeta (post_id => reaction type) — this is what lets a user switch
     * from e.g. "love" to "fire" on the same post without desyncing the
     * per-type counters, and lets any feed/detail response tell a client
     * "this user reacted, and with what emoji" instead of every UI surface
     * independently guessing "not reacted" on mount.
     *
     * `_culture_liked_posts` (flat array of post IDs) is kept in sync purely
     * for backward compatibility with older reads of the boolean `liked` flag.
     */
    public static function handle_react( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        $type    = $request->get_param( 'type' ) ?: 'love';

        $result = self::toggle_reaction( $user_id, $post_id, $type );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    /**
     * Returns the current user's reaction type (or null) on a given post —
     * used by surfaces that fetch content directly (e.g. magazine articles
     * via slug) rather than through a feed response that already carries
     * `userReaction`.
     */
    public static function handle_get_user_reaction( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );

        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        return rest_ensure_response( array(
            'userReaction' => isset( $reactions_map[ $post_id ] ) ? $reactions_map[ $post_id ] : null,
        ) );
    }

    /**
     * Shared toggle/switch logic for both the mobile (JWT) and web (API-key)
     * reaction endpoints — single source of truth, mirroring the pattern
     * already used by Culture_Follows / Culture_Community_RSVP for surfaces
     * with mirrored mobile+web REST routes.
     */
    public static function toggle_reaction( int $user_id, int $post_id, string $type ) {
        $type = sanitize_key( $type ?: 'love' );
        if ( ! in_array( $type, self::REACTION_TYPES, true ) ) {
            $type = 'love';
        }

        $post = get_post( $post_id );
        if ( ! $post || ! in_array( $post->post_type, self::REACTABLE_POST_TYPES, true ) ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $is_community = $post->post_type === 'culture_post';

        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();
        $prev_type     = isset( $reactions_map[ $post_id ] ) ? $reactions_map[ $post_id ] : null;
        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );

        if ( $prev_type === $type ) {
            // Same reaction tapped again — un-react.
            unset( $reactions_map[ $post_id ] );
            $liked_ids   = array_values( array_diff( $liked_ids, array( $post_id ) ) );
            $current     = (int) get_post_meta( $post_id, 'reaction_' . $type, true );
            update_post_meta( $post_id, 'reaction_' . $type, max( 0, $current - 1 ) );
            $new_count   = max( 0, (int) get_post_meta( $post_id, '_culture_like_count', true ) - 1 );
            $now_reacted = false;
            $result_type = null;
        } else {
            if ( null !== $prev_type ) {
                // Switching from one reaction type to another — only the
                // per-type counters move, the overall like count is unchanged.
                $old_current = (int) get_post_meta( $post_id, 'reaction_' . $prev_type, true );
                update_post_meta( $post_id, 'reaction_' . $prev_type, max( 0, $old_current - 1 ) );
                $new_count = (int) get_post_meta( $post_id, '_culture_like_count', true );
            } else {
                $liked_ids[] = $post_id;
                $new_count   = (int) get_post_meta( $post_id, '_culture_like_count', true ) + 1;
                if ( $is_community && class_exists( 'Culture_Gamification' ) ) {
                    Culture_Gamification::award_points( $user_id, 'community_like' );
                }
            }
            $reactions_map[ $post_id ] = $type;
            $current = (int) get_post_meta( $post_id, 'reaction_' . $type, true );
            update_post_meta( $post_id, 'reaction_' . $type, $current + 1 );
            $now_reacted = true;
            $result_type = $type;
        }

        update_user_meta( $user_id, '_culture_post_reactions', $reactions_map );
        update_user_meta( $user_id, '_culture_liked_posts', $liked_ids );
        update_post_meta( $post_id, '_culture_like_count', $new_count );

        if ( $is_community && null === $prev_type && $now_reacted && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::check_post_threshold( $post_id );
        }

        return array(
            'liked'        => $now_reacted,
            'reactionType' => $result_type,
            'count'        => $new_count,
            'reactions'    => array(
                'love' => (int) get_post_meta( $post_id, 'reaction_love', true ),
                'fire' => (int) get_post_meta( $post_id, 'reaction_fire', true ),
                'clap' => (int) get_post_meta( $post_id, 'reaction_clap', true ),
            ),
        );
    }

    public static function handle_report( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        $reason  = $request->get_param( 'reason' );

        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $reporter_ids_raw = get_post_meta( $post_id, 'community_reporter_ids', true );
        $reporter_ids     = json_decode( $reporter_ids_raw ?: '[]', true );
        if ( ! is_array( $reporter_ids ) ) {
            $reporter_ids = array();
        }

        if ( in_array( (string) $user_id, $reporter_ids, true ) ) {
            return rest_ensure_response( array( 'success' => true, 'message' => 'Already reported.' ) );
        }

        $reporter_ids[] = (string) $user_id;
        update_post_meta( $post_id, 'community_reporter_ids',  json_encode( $reporter_ids ) );
        update_post_meta( $post_id, 'community_report_count',  count( $reporter_ids ) );
        update_post_meta( $post_id, 'community_report_reason', $reason );

        if ( count( $reporter_ids ) >= 3 ) {
            wp_update_post( array( 'ID' => $post_id, 'post_status' => 'pending' ) );
        }

        return rest_ensure_response( array( 'success' => true ) );
    }

    public static function handle_get_member( $request ) {
        $user_id = (int) $request->get_param( 'id' );
        $user    = get_userdata( $user_id );

        if ( ! $user ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( self::build_member_profile_response( $user ) );
    }

    public static function handle_get_member_by_username( $request ) {
        $username = (string) $request->get_param( 'username' );
        $user     = get_user_by( 'login', $username );

        if ( ! $user ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( self::build_member_profile_response( $user ) );
    }

    private static function build_member_profile_response( WP_User $user ): array {
        $user_id = $user->ID;
        $profile = self::public_profile( $user );
        $profile['followersCount'] = Culture_Follows::followers_count( $user_id );
        $profile['followingCount'] = Culture_Follows::following_count( $user_id );

        $viewer_id = get_current_user_id();
        $profile['isFollowing'] = $viewer_id ? Culture_Follows::is_following( $viewer_id, $user_id ) : false;

        return $profile;
    }

    public static function handle_follow_member( $request ) {
        $follower_id = get_current_user_id();
        $followed_id = (int) $request->get_param( 'user_id' );
        $notify      = (bool) $request->get_param( 'notify_posts' );

        if ( $followed_id === $follower_id ) {
            return new WP_Error( 'invalid_target', 'You cannot follow yourself.', array( 'status' => 400 ) );
        }
        if ( ! get_userdata( $followed_id ) ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        Culture_Follows::follow( $follower_id, $followed_id, $notify );

        return rest_ensure_response( array(
            'success'         => true,
            'isFollowing'     => true,
            'followersCount'  => Culture_Follows::followers_count( $followed_id ),
        ) );
    }

    public static function handle_unfollow_member( $request ) {
        $follower_id = get_current_user_id();
        $followed_id = (int) $request->get_param( 'user_id' );

        Culture_Follows::unfollow( $follower_id, $followed_id );

        return rest_ensure_response( array(
            'success'        => true,
            'isFollowing'    => false,
            'followersCount' => Culture_Follows::followers_count( $followed_id ),
        ) );
    }

    public static function handle_set_follow_notify( $request ) {
        $follower_id = get_current_user_id();
        $followed_id = (int) $request->get_param( 'user_id' );
        $notify      = (bool) $request->get_param( 'notify_posts' );

        if ( ! Culture_Follows::is_following( $follower_id, $followed_id ) ) {
            return new WP_Error( 'not_following', 'You are not following this member.', array( 'status' => 400 ) );
        }

        Culture_Follows::set_notify( $follower_id, $followed_id, $notify );

        return rest_ensure_response( array( 'success' => true, 'notifyPosts' => $notify ) );
    }

    public static function handle_follow_status( $request ) {
        $viewer_id = get_current_user_id();
        $target_id = (int) $request->get_param( 'user_id' );

        return rest_ensure_response( array(
            'isFollowing'    => Culture_Follows::is_following( $viewer_id, $target_id ),
            'followersCount' => Culture_Follows::followers_count( $target_id ),
            'followingCount' => Culture_Follows::following_count( $target_id ),
        ) );
    }

    public static function handle_get_following_usernames( $request ) {
        $user_id = get_current_user_id();
        return rest_ensure_response( array(
            'usernames' => Culture_Follows::get_following_usernames( $user_id ),
        ) );
    }

    public static function handle_get_members( $request ) {
        $search     = $request->get_param( 'search' );
        $discipline = $request->get_param( 'discipline' );
        $location   = $request->get_param( 'location' );
        $per_page   = min( (int) ( $request->get_param( 'per_page' ) ?: 100 ), 200 );

        // Directory browse (no search term) is gated to opted-in members only.
        // @mention / user search (search term present) must be able to find any
        // community member, not just those who opted into the public directory.
        $meta_query = $search ? array() : array(
            array(
                'key'     => '_culture_directory_opt_in',
                'value'   => '1',
                'compare' => '=',
            ),
        );

        if ( $discipline && $discipline !== 'All' ) {
            $meta_query[] = array(
                'key'     => '_culture_directory_disciplines',
                'value'   => $discipline,
                'compare' => 'LIKE',
            );
        }

        if ( $location && $location !== 'All' ) {
            $meta_query[] = array(
                'relation' => 'OR',
                array(
                    'key'     => '_culture_city',
                    'value'   => $location,
                    'compare' => 'LIKE',
                ),
                array(
                    'key'     => '_culture_country_of_residence',
                    'value'   => $location,
                    'compare' => 'LIKE',
                ),
            );
        }

        $args = array(
            'number'     => $per_page,
            'meta_query' => $meta_query,
            'orderby'    => 'display_name',
            'order'      => 'ASC',
        );

        if ( $search ) {
            $args['search']         = '*' . $search . '*';
            $args['search_columns'] = array( 'display_name', 'user_nicename' );
        }

        $users = get_users( $args );

        $members = array_map( function( $user ) {
            $tier            = get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen';
            $disciplines_raw = get_user_meta( $user->ID, '_culture_directory_disciplines', true );
            $disciplines     = is_array( $disciplines_raw ) ? $disciplines_raw : ( $disciplines_raw ? explode( ',', $disciplines_raw ) : array() );

            return array(
                'id'                 => (string) $user->ID,
                'username'           => $user->user_login,
                'displayName'        => $user->display_name,
                'avatarUrl'          => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
                'tier'               => $tier,
                'occupation'         => get_user_meta( $user->ID, '_culture_occupation',           true ) ?: '',
                'city'               => get_user_meta( $user->ID, '_culture_city',                 true ) ?: '',
                'countryOfResidence' => get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
                'bio'                => get_user_meta( $user->ID, '_culture_directory_bio',        true ) ?: '',
                'disciplines'        => $disciplines,
                'instagram'          => get_user_meta( $user->ID, '_culture_directory_instagram',  true ) ?: '',
                'twitter'            => get_user_meta( $user->ID, '_culture_directory_twitter',    true ) ?: '',
                'linkedin'           => get_user_meta( $user->ID, '_culture_directory_linkedin',   true ) ?: '',
                'website'            => get_user_meta( $user->ID, '_culture_directory_website',    true ) ?: '',
            );
        }, $users );

        return rest_ensure_response( $members );
    }

    public static function handle_get_newsletter_prefs( $request ) {
        $user_id = get_current_user_id();
        $user    = get_userdata( $user_id );
        $prefs   = get_user_meta( $user_id, '_culture_newsletter_prefs', true );
        $prefs   = is_array( $prefs ) ? $prefs : array();

        $allowed = array( 'getmelit', 'culture-drop' );
        $lists   = array();
        foreach ( $allowed as $list_id ) {
            if ( ! empty( $prefs[ $list_id ] ) ) {
                $lists[] = $list_id;
            }
        }

        // Fall back: check subscriber record for legacy data
        if ( empty( $lists ) && $user ) {
            $subscribers = get_option( 'culture_newsletter_subscribers', array() );
            foreach ( $subscribers as $sub ) {
                if ( is_array( $sub ) && isset( $sub['email'] ) && $sub['email'] === $user->user_email ) {
                    $lists = isset( $sub['lists'] ) ? (array) $sub['lists'] : array( 'getmelit' );
                    break;
                }
            }
        }

        return rest_ensure_response( array( 'lists' => $lists ) );
    }

    public static function handle_update_newsletter_prefs( $request ) {
        $user_id = get_current_user_id();
        $lists   = $request->get_param( 'lists' );
        if ( ! is_array( $lists ) ) {
            return new WP_Error( 'invalid', 'lists must be an array.', array( 'status' => 400 ) );
        }

        $allowed = array( 'getmelit', 'culture-drop' );
        $prefs   = array();
        foreach ( $allowed as $list_id ) {
            $prefs[ $list_id ] = in_array( $list_id, $lists, true );
        }
        update_user_meta( $user_id, '_culture_newsletter_prefs', $prefs );

        return rest_ensure_response( array( 'lists' => array_keys( array_filter( $prefs ) ) ) );
    }

    public static function handle_request_password_reset( $request ) {
        $user = get_userdata( get_current_user_id() );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $key = get_password_reset_key( $user );
        if ( is_wp_error( $key ) ) {
            return new WP_Error( 'reset_failed', 'Could not generate reset key.', array( 'status' => 500 ) );
        }

        $frontend_url = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
        $reset_url    = $frontend_url
            . '/reset-password?key=' . rawurlencode( $key )
            . '&login='              . rawurlencode( $user->user_login );

        $subject = 'Reset your Moveee password';
        $message = "Hi {$user->display_name},\n\nClick the link below to reset your password:\n\n{$reset_url}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can ignore this email.";
        wp_mail( $user->user_email, $subject, $message );

        return rest_ensure_response( array( 'success' => true ) );
    }

    // -------------------------------------------------------------------------
    // Profile formatters
    // -------------------------------------------------------------------------

    private static function full_profile( WP_User $user ): array {
        $stored_tier = get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen';
        $tier = ( is_super_admin( $user->ID ) || user_can( $user, 'manage_options' ) )
            ? 'patron'
            : $stored_tier;

        $referral_code  = get_user_meta( $user->ID, '_culture_referral_code', true ) ?: '';
        $referral_count = 0;
        if ( $referral_code && class_exists( 'Culture_Referrals' ) ) {
            $referral_count = Culture_Referrals::get_referral_count( $user->ID );
        }

        $vendor_roles = array( 'wcfm_vendor', 'seller', 'vendor', 'wcfm_affiliate' );
        $is_vendor    = (bool) array_intersect( $vendor_roles, (array) $user->roles )
                        || (bool) get_user_meta( $user->ID, '_wcfm_vendor_data', true );

        $credits    = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_credits( $user->ID ) : 0;
        $reputation = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $user->ID ) : 0;
        $rep_tier   = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation_tier( $reputation ) : 'member';
        $daily_rem  = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_daily_credits_remaining( $user->ID ) : 50;
        $passkey_count = (int) get_user_meta( $user->ID, '_culture_passkey_count', true );
        $interests  = json_decode( get_user_meta( $user->ID, '_culture_interests', true ) ?: '[]', true ) ?: array();

        return array(
            'id'                    => (string) $user->ID,
            'username'              => $user->user_login,
            'email'                 => $user->user_email,
            'displayName'           => $user->display_name,
            'avatarUrl'             => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
            'coverPhotoUrl'         => get_user_meta( $user->ID, '_culture_cover_photo_url', true ) ?: '',
            'tier'                  => $tier,
            'points'                => (int) get_user_meta( $user->ID, '_culture_points', true ),
            'credits'               => $credits,
            'reputation'            => $reputation,
            'reputationTier'        => $rep_tier,
            'dailyCreditsRemaining' => $daily_rem,
            'badges'                => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $user->ID ) : array(),
            'interests'             => $interests,
            'referralCode'          => $referral_code,
            'referralCount'         => $referral_count,
            'registeredAt'          => strtotime( $user->user_registered ),
            'gender'                => get_user_meta( $user->ID, '_culture_gender', true ) ?: '',
            'dateOfBirth'           => get_user_meta( $user->ID, '_culture_dob', true ) ?: '',
            'nationality'           => get_user_meta( $user->ID, '_culture_nationality', true ) ?: '',
            'countryOfResidence'    => get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
            'city'                  => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
            'occupation'            => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
            'phone'                 => get_user_meta( $user->ID, '_culture_phone', true ) ?: '',
            'whatsapp'              => get_user_meta( $user->ID, '_culture_whatsapp', true ) ?: '',
            'isVendor'              => $is_vendor,
            'vendorSlug'            => $is_vendor ? $user->user_nicename : '',
            'hasPasskey'            => $passkey_count > 0,
            'passkeyCount'          => $passkey_count,
            'creditsEscrowed'       => (int) get_user_meta( $user->ID, '_culture_credits_escrowed', true ),
            // Directory profile fields
            'directoryOptIn'        => (bool) get_user_meta( $user->ID, '_culture_directory_opt_in', true ),
            'directoryBio'          => get_user_meta( $user->ID, '_culture_directory_bio', true ) ?: '',
            'directoryDisciplines'  => (function() use ( $user ) {
                $raw = get_user_meta( $user->ID, '_culture_directory_disciplines', true );
                if ( is_array( $raw ) ) {
                    return $raw;
                }
                return $raw ? ( json_decode( $raw, true ) ?: explode( ',', $raw ) ) : array();
            })(),
            'directoryInstagram'    => get_user_meta( $user->ID, '_culture_directory_instagram', true ) ?: '',
            'directoryTwitter'      => get_user_meta( $user->ID, '_culture_directory_twitter', true ) ?: '',
            'directoryLinkedIn'     => get_user_meta( $user->ID, '_culture_directory_linkedin', true ) ?: '',
            'directoryWebsite'      => get_user_meta( $user->ID, '_culture_directory_website', true ) ?: '',
        );
    }

    // -------------------------------------------------------------------------
    // Unified feed handler
    // -------------------------------------------------------------------------

    public static function handle_get_unified_feed( $request ) {
        $page     = max( 1, (int) $request->get_param( 'page' ) );
        $per_page = min( max( 1, (int) $request->get_param( 'per_page' ) ), 50 );
        $user_id  = get_current_user_id();

        $cache_key = 'culture_feed_u' . $user_id . '_p' . $page . '_n' . $per_page;
        $cached    = get_transient( $cache_key );
        if ( false !== $cached ) {
            return rest_ensure_response( $cached );
        }

        $items = array();

        foreach ( self::get_pulse_feed_items() as $item )     { $items[] = $item; }
        foreach ( self::get_editorial_feed_items() as $item ) { $items[] = $item; }
        foreach ( self::get_happening_feed_items() as $item ) { $items[] = $item; }
        foreach ( self::get_directory_feed_items() as $item ) { $items[] = $item; }
        foreach ( self::get_quote_feed_items() as $item )     { $items[] = $item; }
        foreach ( self::get_community_feed_items() as $item ) { $items[] = $item; }

        usort( $items, function( $a, $b ) {
            return strtotime( $b['date'] ) <=> strtotime( $a['date'] );
        } );

        $offset   = ( $page - 1 ) * $per_page;
        $response = array(
            'items'   => array_values( array_slice( $items, $offset, $per_page ) ),
            'hasMore' => ( $offset + $per_page ) < count( $items ),
        );

        set_transient( $cache_key, $response, 2 * MINUTE_IN_SECONDS );

        return rest_ensure_response( $response );
    }

    /**
     * post_date_gmt is a MySQL datetime string ("Y-m-d H:i:s") with no
     * timezone marker. JS engines parsing that shape (space instead of "T",
     * no "Z"/offset) treat it as local device time rather than UTC, so a
     * post made seconds ago appears N hours old/new depending on the
     * device's UTC offset. Appending "Z" makes the UTC-ness explicit.
     */
    private static function gmt_iso( string $mysql_gmt ): string {
        return $mysql_gmt ? str_replace( ' ', 'T', $mysql_gmt ) . 'Z' : '';
    }

    private static function get_pulse_feed_items(): array {
        $user_id       = get_current_user_id();
        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $query = new WP_Query( array(
            'post_type'      => 'pulse_story',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) use ( $reactions_map ) {
            $thumb = get_the_post_thumbnail_url( $post->ID, 'large' );
            $cat_terms = get_the_terms( $post->ID, 'pulse_category' );
            $user_reaction = isset( $reactions_map[ $post->ID ] ) ? $reactions_map[ $post->ID ] : null;
            return array(
                'id'            => 'pulse-' . $post->ID,
                'type'          => 'pulse',
                'title'         => get_the_title( $post ),
                'slug'          => $post->post_name,
                'date'          => self::gmt_iso( $post->post_date_gmt ),
                'excerpt'       => wp_strip_all_tags( $post->post_excerpt ),
                'body'          => wpautop( $post->post_content ),
                'image'         => $thumb ?: null,
                'href'          => '/pulse/' . $post->post_name,
                'category'      => ( $cat_terms && ! is_wp_error( $cat_terms ) && ! empty( $cat_terms ) ) ? $cat_terms[0]->name : '',
                'arm'           => get_post_meta( $post->ID, 'pulse_arm_label', true ) ?: '',
                'region'        => get_post_meta( $post->ID, 'pulse_region_label', true ) ?: '',
                'source'        => get_post_meta( $post->ID, 'pulse_source', true ) ?: '',
                'sourceUrl'     => get_post_meta( $post->ID, 'pulse_external_url', true ) ?: '',
                'ogTitle'       => get_post_meta( $post->ID, 'pulse_og_title', true ) ?: '',
                'ogDescription' => get_post_meta( $post->ID, 'pulse_og_description', true ) ?: '',
                'ogImage'       => get_post_meta( $post->ID, 'pulse_og_image', true ) ?: '',
                'commentCount'  => (int) get_comments_number( $post->ID ),
                'reactions'     => array(
                    'love' => (int) get_post_meta( $post->ID, 'reaction_love', true ),
                    'fire' => (int) get_post_meta( $post->ID, 'reaction_fire', true ),
                    'clap' => (int) get_post_meta( $post->ID, 'reaction_clap', true ),
                ),
                'liked'         => null !== $user_reaction,
                'userReaction'  => $user_reaction,
                'wpId'          => (string) $post->ID,
            );
        }, $query->posts );
    }

    private static function get_editorial_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) {
            $thumb      = get_the_post_thumbnail_url( $post->ID, 'large' );
            $categories    = get_the_category( $post->ID );
            $author_data   = get_userdata( $post->post_author );
            $word_count    = str_word_count( wp_strip_all_tags( $post->post_content ) );
            $reading_time  = max( 1, (int) round( $word_count / 200 ) );
            return array(
                'id'          => 'editorial-' . $post->post_name,
                'type'        => 'editorial',
                'title'       => get_the_title( $post ),
                'slug'        => $post->post_name,
                'date'        => self::gmt_iso( $post->post_date_gmt ),
                'excerpt'     => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
                'image'       => $thumb ?: null,
                'href'        => '/magazine/' . $post->post_name,
                'category'    => ! empty( $categories ) ? $categories[0]->name : '',
                'author'      => $author_data ? $author_data->display_name : '',
                'readingTime' => $reading_time,
            );
        }, $query->posts );
    }

    private static function get_happening_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'culture_event',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        // Pre-warm the object cache for all organiser posts in one DB query.
        $organiser_ids = array_unique( array_filter( array_map( function( $p ) {
            return (int) get_post_meta( $p->ID, '_culture_event_organiser_id', true );
        }, $query->posts ) ) );
        if ( ! empty( $organiser_ids ) ) {
            get_posts( array(
                'post__in'               => array_values( $organiser_ids ),
                'post_type'              => 'any',
                'posts_per_page'         => count( $organiser_ids ),
                'no_found_rows'          => true,
                'update_post_meta_cache' => false,
                'update_post_term_cache' => false,
                'ignore_sticky_posts'    => true,
            ) );
        }

        return array_map( function( WP_Post $post ) {
            $thumb = get_the_post_thumbnail_url( $post->ID, 'large' );

            $organiser_id   = (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true );
            $organiser_name = '';
            $organiser_slug = '';
            if ( $organiser_id ) {
                $organiser_post = get_post( $organiser_id );
                if ( $organiser_post ) {
                    $organiser_name = get_the_title( $organiser_post );
                    $organiser_slug = $organiser_post->post_name;
                }
            }

            $interests = get_the_terms( $post->ID, 'culture_interest' );

            return array(
                'id'            => 'happening-' . $post->post_name,
                'type'          => 'happening',
                'title'         => get_the_title( $post ),
                'slug'          => $post->post_name,
                'date'          => self::gmt_iso( $post->post_date_gmt ),
                'excerpt'       => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
                'body'          => wp_strip_all_tags( $post->post_content ),
                'image'         => $thumb ?: null,
                'href'          => '/events/' . $post->post_name,
                'eventDate'     => get_post_meta( $post->ID, '_culture_event_date', true ) ?: '',
                'endDate'       => get_post_meta( $post->ID, '_culture_event_end_date', true ) ?: '',
                'location'      => get_post_meta( $post->ID, '_culture_location', true ) ?: '',
                'venueAddress'  => get_post_meta( $post->ID, 'venue_address', true ) ?: '',
                'openingHours'  => get_post_meta( $post->ID, '_culture_opening_hours', true ) ?: '',
                'admission'     => get_post_meta( $post->ID, '_culture_admission', true ) ?: '',
                'city'          => get_post_meta( $post->ID, '_culture_event_city', true ) ?: '',
                'eventCategory' => ( $interests && ! is_wp_error( $interests ) && ! empty( $interests ) ) ? $interests[0]->name : '',
                'organiserName' => $organiser_name,
                'organiserSlug' => $organiser_slug,
                'organiserDirectoryId' => $organiser_id ?: null,
                'isFeatured'    => (bool) get_post_meta( $post->ID, '_culture_is_featured', true ),
                'isLiterati'    => (bool) get_post_meta( $post->ID, '_culture_event_is_literati', true ),
                'rsvpCount'     => self::get_editorial_event_rsvp_count( $post->post_name ),
            );
        }, $query->posts );
    }

    private static function get_editorial_event_rsvp_count( string $event_slug ): int {
        global $wpdb;
        $table = $wpdb->prefix . 'culture_event_rsvp';
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE event_slug = %s AND status = 'confirmed'",
            $event_slug
        ) );
    }

    private static function get_directory_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) {
            $thumb = get_the_post_thumbnail_url( $post->ID, 'large' );
            $terms = get_the_terms( $post->ID, 'culture_dir_type' );
            return array(
                'id'        => 'directory-' . $post->post_name,
                'type'      => 'directory',
                'title'     => get_the_title( $post ),
                'slug'      => $post->post_name,
                'date'      => self::gmt_iso( $post->post_date_gmt ),
                'excerpt'   => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
                'body'      => wp_strip_all_tags( $post->post_content ),
                'image'     => $thumb ?: null,
                'href'      => '/directory/' . $post->post_name,
                'entryType' => ( $terms && ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0]->name : '',
                'city'      => get_post_meta( $post->ID, '_entry_city', true ) ?: '',
                'location'  => get_post_meta( $post->ID, '_culture_location', true ) ?: '',
                'isPartner' => (bool) get_post_meta( $post->ID, '_is_partner', true ),
            );
        }, $query->posts );
    }

    private static function get_quote_feed_items(): array {
        $user_id       = get_current_user_id();
        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $query = new WP_Query( array(
            'post_type'      => 'culture_quote',
            'post_status'    => 'publish',
            'posts_per_page' => 20,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) use ( $reactions_map ) {
            $authors     = get_the_terms( $post->ID, 'culture_quote_author' );
            $submitter_id = (int) $post->post_author;
            $submitter    = get_userdata( $submitter_id );
            $user_reaction = isset( $reactions_map[ $post->ID ] ) ? $reactions_map[ $post->ID ] : null;
            return array(
                'id'          => 'quote-' . $post->post_name,
                'type'        => 'quote',
                'title'       => wp_strip_all_tags( $post->post_content ?: get_the_title( $post ) ),
                'slug'        => $post->post_name,
                'date'        => self::gmt_iso( $post->post_date_gmt ),
                'href'        => '/quotes/' . $post->ID . '-' . $post->post_name,
                'wpId'        => (string) $post->ID,
                'quoteSource'        => get_post_meta( $post->ID, '_quote_source', true ) ?: '',
                'quoteAuthor'        => ( $authors && ! is_wp_error( $authors ) && ! empty( $authors ) ) ? $authors[0]->name : '',
                'quoteSharingReason' => get_post_meta( $post->ID, '_quote_sharing_reason', true ) ?: '',
                'authorName'         => $submitter ? $submitter->display_name : '',
                'communityAuthor'         => $submitter ? $submitter->display_name : '',
                'communityAuthorUsername' => $submitter ? $submitter->user_login : '',
                'communityAuthorAvatar'   => get_user_meta( $submitter_id, '_culture_avatar_url', true ) ?: '',
                'quoteType'          => get_post_meta( $post->ID, '_quote_type', true ) ?: '',
                'reactions'          => array(
                    'love' => (int) get_post_meta( $post->ID, 'reaction_love', true ),
                    'fire' => (int) get_post_meta( $post->ID, 'reaction_fire', true ),
                    'clap' => (int) get_post_meta( $post->ID, 'reaction_clap', true ),
                ),
                'liked'              => null !== $user_reaction,
                'userReaction'       => $user_reaction,
            );
        }, $query->posts );
    }

    private static function get_community_feed_items(): array {
        $user_id       = get_current_user_id();
        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );
        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        // Pre-warm organiser directory posts in one query to avoid N+1 lookups.
        $organiser_map = array(); // organiser_id => [name, slug]
        $org_ids = array_filter( array_map( function( $p ) {
            return (int) get_post_meta( $p->ID, '_culture_event_organiser_id', true );
        }, $query->posts ) );
        if ( ! empty( $org_ids ) ) {
            $org_posts = get_posts( array(
                'post__in'       => array_values( array_unique( $org_ids ) ),
                'post_type'      => 'culture_directory',
                'post_status'    => 'publish',
                'posts_per_page' => count( $org_ids ),
                'no_found_rows'  => true,
            ) );
            foreach ( $org_posts as $op ) {
                $organiser_map[ $op->ID ] = array( 'name' => $op->post_title, 'slug' => $op->post_name );
            }
        }

        return array_map( function( WP_Post $post ) use ( $liked_ids, $reactions_map, $organiser_map ) {
            return self::format_community_feed_item( $post, $liked_ids, $reactions_map, $organiser_map );
        }, $query->posts );
    }

    /**
     * Single-post lookup used by deep links (e.g. notification taps for
     * mentions, comments, and followed-author posts) — reuses the exact
     * same field mapping as the unified/community feed so PostDetailScreen
     * receives an identically-shaped FeedItem regardless of entry point.
     */
    public static function handle_get_community_post( $request ) {
        $post_id = (int) $request->get_param( 'post_id' );
        $post    = get_post( $post_id );
        if ( ! $post || $post->post_type !== 'culture_post' || $post->post_status !== 'publish' ) {
            return new WP_Error( 'not_found', 'Post not found', array( 'status' => 404 ) );
        }

        $user_id       = get_current_user_id();
        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );
        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $organiser_map = array();
        $organiser_id  = (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true );
        if ( $organiser_id ) {
            $organiser_post = get_post( $organiser_id );
            if ( $organiser_post ) {
                $organiser_map[ $organiser_id ] = array( 'name' => $organiser_post->post_title, 'slug' => $organiser_post->post_name );
            }
        }

        return rest_ensure_response( array( 'item' => self::format_community_feed_item( $post, $liked_ids, $reactions_map, $organiser_map ) ) );
    }

    private static function format_community_feed_item( WP_Post $post, array $liked_ids, array $reactions_map, array $organiser_map ): array {
            $author_id   = (int) $post->post_author;
            $author      = get_userdata( $author_id );
            $raw         = wpautop( $post->post_content );
            $with_breaks = preg_replace( '/<\/p>\s*<p[^>]*>/i', "\n\n", $raw );
            $with_breaks = preg_replace( '/<br\s*\/?>/i', "\n", $with_breaks );
            $body_text   = trim( wp_strip_all_tags( $with_breaks ) );
            $link_url    = get_post_meta( $post->ID, 'community_link_url', true ) ?: '';
            $source      = '';
            if ( $link_url ) {
                $host   = wp_parse_url( $link_url, PHP_URL_HOST );
                $source = $host ? preg_replace( '/^www\./', '', $host ) : '';
                // Strip the link URL from body — it's shown as the OG snippet, not inline text.
                if ( $body_text ) {
                    $body_text = trim( str_replace( $link_url, '', $body_text ) );
                    // Also strip any residual bare URL at the end (in case the URL was slightly different).
                    $body_text = rtrim( preg_replace( '/\s*https?:\/\/\S+\s*$/', '', $body_text ) );
                }
            }

            $template = get_post_meta( $post->ID, '_template_type', true ) ?: 'post';

            return array(
                'id'                      => 'community-' . $post->ID,
                'type'                    => 'community',
                'title'                   => $body_text ?: get_the_title( $post ),
                'slug'                    => $post->post_name,
                'date'                    => self::gmt_iso( $post->post_date_gmt ),
                'image'                   => get_post_meta( $post->ID, 'community_image_url', true ) ?: ( get_post_meta( $post->ID, '_community_image_url', true ) ?: null ),
                'href'                    => '/community/' . $post->post_name,
                'communityAuthorId'       => get_post_meta( $post->ID, 'community_author_id', true ) ?: (string) $author_id,
                'communityAuthor'         => get_post_meta( $post->ID, 'community_author_name', true ) ?: ( $author ? $author->display_name : '' ),
                'communityAuthorUsername' => get_post_meta( $post->ID, 'community_author_username', true ) ?: ( $author ? $author->user_login : '' ),
                'communityAuthorAvatar'   => get_post_meta( $post->ID, 'community_author_avatar', true ) ?: get_user_meta( $author_id, '_culture_avatar_url', true ) ?: '',
                'communityTag'            => get_post_meta( $post->ID, 'community_tag', true ) ?: '',
                'communityTier'           => get_post_meta( $post->ID, 'community_author_tier', true ) ?: get_user_meta( $author_id, '_culture_membership_tier', true ) ?: 'citizen',
                'authorRepTier'           => get_post_meta( $post->ID, 'community_author_rep_tier', true ) ?: 'member',
                'region'                  => get_post_meta( $post->ID, 'community_region', true ) ?: '',
                'sourceUrl'               => $link_url ?: null,
                'source'                  => $source ?: null,
                'ogTitle'                 => get_post_meta( $post->ID, 'community_og_title', true ) ?: '',
                'ogDescription'           => get_post_meta( $post->ID, 'community_og_description', true ) ?: '',
                'ogImage'                 => get_post_meta( $post->ID, 'community_og_image', true ) ?: '',
                'commentCount'            => (int) get_comments_number( $post->ID ),
                'reactions'               => array(
                    'love' => (int) get_post_meta( $post->ID, 'reaction_love', true ),
                    'fire' => (int) get_post_meta( $post->ID, 'reaction_fire', true ),
                    'clap' => (int) get_post_meta( $post->ID, 'reaction_clap', true ),
                ),
                'liked'                   => in_array( $post->ID, $liked_ids, false ),
                'userReaction'            => isset( $reactions_map[ $post->ID ] ) ? $reactions_map[ $post->ID ] : null,
                'wpId'                    => (string) $post->ID,
                // Template fields — all card variants
                'templateType'            => $template,
                'linkedDirectoryId'       => (int) get_post_meta( $post->ID, '_linked_directory_id', true ) ?: null,
                'starRating'              => (int) get_post_meta( $post->ID, '_star_rating', true ) ?: null,
                'locationName'            => get_post_meta( $post->ID, '_location_name', true ) ?: '',
                'pollOptions'             => json_decode( get_post_meta( $post->ID, '_poll_options', true ) ?: '[]', true ),
                'pollExpiresAt'           => get_post_meta( $post->ID, '_poll_expires_at', true ) ?: '',
                'pollDescription'         => get_post_meta( $post->ID, '_poll_description', true ) ?: '',
                'galleryImages'           => json_decode( get_post_meta( $post->ID, '_gallery_images', true ) ?: '[]', true ),
                'videoUrl'                => get_post_meta( $post->ID, '_video_url', true ) ?: '',
                'itineraryStops'          => json_decode( get_post_meta( $post->ID, '_itinerary_stops', true ) ?: '[]', true ),
                'itineraryTitle'          => get_post_meta( $post->ID, '_itinerary_title', true ) ?: '',
                'itineraryCity'           => get_post_meta( $post->ID, '_itinerary_city', true ) ?: '',
                'itineraryBudget'         => get_post_meta( $post->ID, '_itinerary_budget', true ) ?: '',
                'itineraryDuration'       => get_post_meta( $post->ID, '_itinerary_duration', true ) ?: '',
                'itineraryBestTime'       => get_post_meta( $post->ID, '_itinerary_best_time', true ) ?: '',
                'foodDishName'            => get_post_meta( $post->ID, '_food_dish_name', true ) ?: '',
                'foodRatingTaste'         => (int) get_post_meta( $post->ID, '_food_rating_taste', true ) ?: null,
                'foodRatingValue'         => (int) get_post_meta( $post->ID, '_food_rating_value', true ) ?: null,
                'foodRatingVibe'          => (int) get_post_meta( $post->ID, '_food_rating_vibe', true ) ?: null,
                'cuisineTag'              => get_post_meta( $post->ID, '_cuisine_tag', true ) ?: '',
                'priceRange'              => get_post_meta( $post->ID, '_price_range', true ) ?: '',
                'placeName'               => get_post_meta( $post->ID, '_place_name', true ) ?: '',
                'placeLocation'           => get_post_meta( $post->ID, '_place_location', true ) ?: '',
                'openingHours'            => get_post_meta( $post->ID, '_opening_hours', true ) ?: '',
                'culturalTakeHeadline'    => get_post_meta( $post->ID, '_cultural_take_headline', true ) ?: '',
                'showcaseTitle'           => get_post_meta( $post->ID, '_showcase_title', true ) ?: '',
                'showcaseMedium'          => get_post_meta( $post->ID, '_showcase_medium', true ) ?: '',
                'showcaseCollaborator'    => get_post_meta( $post->ID, '_showcase_collaborator', true ) ?: '',
                'showcaseCollaboratorUsername' => get_post_meta( $post->ID, '_showcase_collaborator_username', true ) ?: '',
                'bookTitle'               => get_post_meta( $post->ID, '_book_title', true ) ?: '',
                'bookAuthor'              => get_post_meta( $post->ID, '_book_author', true ) ?: '',
                'bookStatus'              => get_post_meta( $post->ID, '_book_status', true ) ?: '',
                'bookOverallRating'       => (int) get_post_meta( $post->ID, '_book_overall_rating', true ),
                'bookRatingWriting'       => (int) get_post_meta( $post->ID, '_book_rating_writing', true ),
                'bookRatingStory'         => (int) get_post_meta( $post->ID, '_book_rating_story', true ),
                'bookRatingCharacters'    => (int) get_post_meta( $post->ID, '_book_rating_characters', true ),
                'bookRatingPacing'        => (int) get_post_meta( $post->ID, '_book_rating_pacing', true ),
                'bookFavQuote'            => get_post_meta( $post->ID, '_book_fav_quote', true ) ?: '',
                'bookRecommend'           => get_post_meta( $post->ID, '_book_recommend', true ) === '1',
                'bookGenres'              => json_decode( get_post_meta( $post->ID, '_book_genres', true ) ?: '[]', true ),
                // Quote template fields
                'quoteAuthor'             => get_post_meta( $post->ID, '_quote_author', true ) ?: '',
                'quoteSource'             => get_post_meta( $post->ID, '_quote_source', true ) ?: '',
                'quoteSharingReason'      => get_post_meta( $post->ID, '_quote_sharing_reason', true ) ?: '',
                'quoteType'               => get_post_meta( $post->ID, '_quote_type', true ) ?: '',
                // Community event template fields
                'eventDate'               => get_post_meta( $post->ID, '_event_date', true ) ?: '',
                'endDate'                 => get_post_meta( $post->ID, '_event_end_date', true ) ?: '',
                'location'                => get_post_meta( $post->ID, '_event_venue', true ) ?: '',
                'city'                    => get_post_meta( $post->ID, '_event_city', true ) ?: '',
                'eventAddress'            => get_post_meta( $post->ID, '_event_address', true ) ?: '',
                'admission'               => get_post_meta( $post->ID, '_event_admission', true ) ?: '',
                'ticketUrl'               => get_post_meta( $post->ID, '_event_ticket_url', true ) ?: '',
                'isProOnly'               => (bool) get_post_meta( $post->ID, '_culture_event_pro_only', true ),
                'eventCategory'           => get_post_meta( $post->ID, '_event_category', true ) ?: '',
                'organiserName'           => isset( $organiser_map[ (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true ) ] )
                    ? $organiser_map[ (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true ) ]['name']
                    : '',
                'organiserSlug'           => isset( $organiser_map[ (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true ) ] )
                    ? $organiser_map[ (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true ) ]['slug']
                    : '',
                'rsvpEnabled'             => $template === 'event' && (bool) get_post_meta( $post->ID, '_culture_rsvp_enabled', true ),
                'rsvpCapacity'            => (int) get_post_meta( $post->ID, '_culture_rsvp_capacity', true ) ?: 0,
                'rsvpCount'               => $template === 'event' ? Culture_Community_RSVP::get_count( $post->ID ) : 0,
                'rsvpAvailable'           => $template === 'event' && (bool) get_post_meta( $post->ID, '_culture_rsvp_enabled', true )
                    ? ( ( (int) get_post_meta( $post->ID, '_culture_rsvp_capacity', true ) === 0 )
                        || Culture_Community_RSVP::get_count( $post->ID ) < (int) get_post_meta( $post->ID, '_culture_rsvp_capacity', true ) )
                    : false,
                'isFeatured'              => (bool) get_post_meta( $post->ID, '_culture_is_featured', true ),
                'organiserDirectoryId'    => (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true ) ?: null,
            );
    }

    private static function public_profile( WP_User $user ): array {
        $stored_tier = get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen';
        $tier = ( is_super_admin( $user->ID ) || user_can( $user, 'manage_options' ) )
            ? 'patron'
            : $stored_tier;

        $interests = json_decode( get_user_meta( $user->ID, '_culture_interests', true ) ?: '[]', true ) ?: array();

        return array(
            'id'                 => (string) $user->ID,
            'username'           => $user->user_login,
            'displayName'        => $user->display_name,
            'avatarUrl'          => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
            'coverPhotoUrl'      => get_user_meta( $user->ID, '_culture_cover_photo_url', true ) ?: '',
            'tier'               => $tier,
            'city'               => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
            'countryOfResidence' => get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
            'occupation'         => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
            'bio'                => get_user_meta( $user->ID, '_culture_directory_bio', true ) ?: '',
            'interests'          => $interests,
            'instagram'          => get_user_meta( $user->ID, '_culture_directory_instagram', true ) ?: '',
            'twitter'            => get_user_meta( $user->ID, '_culture_directory_twitter', true ) ?: '',
            'linkedin'           => get_user_meta( $user->ID, '_culture_directory_linkedin', true ) ?: '',
            'website'            => get_user_meta( $user->ID, '_culture_directory_website', true ) ?: '',
            'registeredAt'       => strtotime( $user->user_registered ),
            'points'             => (int) get_user_meta( $user->ID, '_culture_points', true ),
            'reputation'         => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $user->ID ) : 0,
            'badges'             => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $user->ID ) : array(),
        );
    }

    // -------------------------------------------------------------------------
    // Mobile-proxied handlers (delegate to existing REST API logic)
    // -------------------------------------------------------------------------

    public static function handle_get_notifications( $request ) {
        $user_id = get_current_user_id();
        $limit   = min( 50, max( 1, (int) $request->get_param( 'limit' ) ) );
        $offset  = max( 0, (int) $request->get_param( 'offset' ) );
        $rows    = Culture_Notifications::get_for_user( $user_id, $limit, $offset );
        foreach ( $rows as &$row ) {
            $row['meta'] = json_decode( $row['meta'] ?? '{}', true ) ?: array();
        }
        return rest_ensure_response( $rows );
    }

    public static function handle_notification_count( $request ) {
        $user_id = get_current_user_id();
        return rest_ensure_response( array( 'unread' => Culture_Notifications::count_unread( $user_id ) ) );
    }

    public static function handle_mark_notifications_read( $request ) {
        $user_id         = get_current_user_id();
        $notification_id = $request->get_param( 'notification_id' );
        if ( $notification_id ) {
            Culture_Notifications::mark_read( $user_id, (int) $notification_id );
        } else {
            Culture_Notifications::mark_all_read( $user_id );
        }
        return rest_ensure_response( array( 'success' => true ) );
    }

    public static function handle_get_notification_prefs( $request ) {
        $user_id = get_current_user_id();
        return rest_ensure_response( Culture_Notifications::get_prefs( $user_id ) );
    }

    public static function handle_set_notification_prefs( $request ) {
        $user_id = get_current_user_id();
        $prefs   = $request->get_param( 'prefs' );
        if ( ! is_array( $prefs ) ) {
            $prefs = array();
        }
        return rest_ensure_response( Culture_Notifications::set_prefs( $user_id, $prefs ) );
    }

    public static function handle_analytics( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_member_analytics( $request );
    }

    public static function handle_saved( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_get_user_saved( $request );
    }

    public static function handle_bookmark( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_toggle_bookmark( $request );
    }

    public static function handle_wallet_balance( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_wallet_balance( $request );
    }

    public static function handle_wallet_history( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_wallet_history( $request );
    }

    public static function handle_wallet_cashout( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_wallet_cashout( $request );
    }

    public static function handle_games_complete( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_games_complete( $request );
    }

    public static function handle_games_history( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_games_history( $request );
    }

    public static function handle_list_perks( $request ) {
        return Culture_REST_API::handle_list_perks( $request );
    }

    public static function handle_redeem_perk( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_redeem_perk( $request );
    }

    public static function handle_user_redemptions( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_user_redemptions( $request );
    }

    public static function handle_passkey_list( $request ) {
        return Culture_REST_API::handle_passkey_list( $request );
    }

    public static function handle_passkey_register_options( $request ) {
        return Culture_REST_API::handle_passkey_register_options( $request );
    }

    public static function handle_passkey_register_verify( $request ) {
        return Culture_REST_API::handle_passkey_register_verify( $request );
    }

    public static function handle_passkey_delete( $request ) {
        return Culture_REST_API::handle_passkey_delete( $request );
    }

    public static function handle_upload_avatar( $request ) {
        $user_id = get_current_user_id();
        $url     = self::upload_to_r2_from_request( $request, 'avatars/' . $user_id );

        if ( is_wp_error( $url ) ) {
            return $url;
        }

        update_user_meta( $user_id, '_culture_avatar_url', $url );

        return rest_ensure_response( array( 'url' => $url ) );
    }

    public static function handle_save_avatar_url( $request ) {
        $user_id = get_current_user_id();
        $url     = esc_url_raw( $request->get_param( 'url' ) );

        if ( empty( $url ) ) {
            return new WP_Error( 'missing_url', 'URL is required.', array( 'status' => 400 ) );
        }

        update_user_meta( $user_id, '_culture_avatar_url', $url );
        return rest_ensure_response( array( 'url' => $url ) );
    }

    public static function handle_upload_cover_photo( $request ) {
        $user_id = get_current_user_id();
        $url     = self::upload_to_r2_from_request( $request, 'covers/' . $user_id );

        if ( is_wp_error( $url ) ) {
            return $url;
        }

        update_user_meta( $user_id, '_culture_cover_photo_url', $url );

        return rest_ensure_response( array( 'url' => $url ) );
    }

    public static function handle_get_portfolio( $request ) {
        $requested_user = (int) $request->get_param( 'user_id' );
        $user_id        = $requested_user ?: get_current_user_id();
        $request->set_param( 'user_id', $user_id );

        $response = Culture_REST_API::handle_get_portfolio( $request );
        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $data         = $response->get_data();
        $pinned_ids   = array_map( 'absint', (array) ( $data['pinned_posts'] ?? array() ) );
        $data['pinned_posts_data'] = self::resolve_pinned_posts( $pinned_ids );

        return rest_ensure_response( $data );
    }

    // Resolves pinned community-post IDs into the same shape format_community_post()
    // already produces for the member-posts list, preserving the caller's pin order.
    private static function resolve_pinned_posts( array $post_ids ): array {
        if ( empty( $post_ids ) ) {
            return array();
        }

        $viewer_id     = get_current_user_id();
        $liked_ids     = (array) get_user_meta( $viewer_id, '_culture_liked_posts', true );
        $reactions_map = get_user_meta( $viewer_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'post__in'       => $post_ids,
            'orderby'        => 'post__in',
            'posts_per_page' => count( $post_ids ),
        ) );

        return array_map( function( $post ) use ( $liked_ids, $reactions_map ) {
            return self::format_community_post( $post, $liked_ids, $reactions_map );
        }, $query->posts );
    }

    public static function handle_save_portfolio( $request ) {
        $request->set_param( 'user_id', get_current_user_id() );
        return Culture_REST_API::handle_save_portfolio( $request );
    }

    // POST /mobile/portfolio/pin — toggle a single community post in/out of the
    // current user's pinned set without touching their manually-added items.
    public static function handle_pin_portfolio_post( $request ) {
        $user_id = get_current_user_id();
        $post_id = absint( $request->get_param( 'post_id' ) );
        $pinned  = (bool) $request->get_param( 'pinned' );

        if ( ! $post_id || get_post_type( $post_id ) !== 'culture_post' ) {
            return new WP_Error( 'invalid_post', 'Invalid post.', array( 'status' => 400 ) );
        }
        if ( (int) get_post_field( 'post_author', $post_id ) !== $user_id ) {
            return new WP_Error( 'forbidden', 'You can only pin your own posts.', array( 'status' => 403 ) );
        }

        $raw = get_user_meta( $user_id, '_portfolio_pinned_posts', true );
        $ids = json_decode( $raw ?: '[]', true ) ?: array();
        $ids = array_values( array_unique( array_map( 'absint', $ids ) ) );

        if ( $pinned && ! in_array( $post_id, $ids, true ) ) {
            $ids[] = $post_id;
        } elseif ( ! $pinned ) {
            $ids = array_values( array_diff( $ids, array( $post_id ) ) );
        }

        update_user_meta( $user_id, '_portfolio_pinned_posts', wp_json_encode( $ids ) );

        return rest_ensure_response( array( 'success' => true, 'pinned_posts' => $ids ) );
    }

    public static function handle_get_member_posts( $request ) {
        $author_id = (int) $request->get_param( 'id' );
        $page      = max( 1, (int) $request->get_param( 'page' ) );
        $per_page  = min( 20, max( 1, (int) $request->get_param( 'per_page' ) ) );

        $user    = get_userdata( $author_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        $viewer_id     = get_current_user_id();
        $liked_ids     = (array) get_user_meta( $viewer_id, '_culture_liked_posts', true );
        $reactions_map = get_user_meta( $viewer_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'author'         => $author_id,
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ) );

        $posts = array_map( function( $post ) use ( $liked_ids, $reactions_map ) {
            return self::format_community_post( $post, $liked_ids, $reactions_map );
        }, $query->posts );

        return rest_ensure_response( array(
            'posts'   => $posts,
            'hasMore' => $query->found_posts > ( $page * $per_page ),
        ) );
    }

    private static function format_community_post( WP_Post $post, array $liked_ids, array $reactions_map = array() ): array {
        $author_id   = (int) $post->post_author;
        $author      = get_userdata( $author_id );
        $author_tier = get_user_meta( $author_id, '_culture_membership_tier', true ) ?: 'citizen';
        $user_reaction = isset( $reactions_map[ $post->ID ] ) ? $reactions_map[ $post->ID ] : null;

        return array(
            'id'           => (string) $post->ID,
            'content'      => wp_strip_all_tags( $post->post_content ),
            'imageUrl'     => get_post_meta( $post->ID, 'community_image_url', true ) ?: ( get_post_meta( $post->ID, '_community_image_url', true ) ?: null ),
            'publishedAt'  => get_date_from_gmt( $post->post_date_gmt, 'c' ),
            'likeCount'    => (int) get_post_meta( $post->ID, '_culture_like_count', true ),
            'commentCount' => (int) get_comments_number( $post->ID ),
            'liked'        => in_array( $post->ID, $liked_ids, false ),
            'userReaction' => $user_reaction,
            'reactions'    => array(
                'love' => (int) get_post_meta( $post->ID, 'reaction_love', true ),
                'fire' => (int) get_post_meta( $post->ID, 'reaction_fire', true ),
                'clap' => (int) get_post_meta( $post->ID, 'reaction_clap', true ),
            ),
            'status'       => $post->post_status,
            'author'       => array(
                'id'        => (string) $author_id,
                'name'      => $author ? $author->display_name : 'Unknown',
                'avatarUrl' => $author ? ( get_user_meta( $author_id, '_culture_avatar_url', true ) ?: '' ) : '',
                'tier'      => $author_tier,
            ),
            // Phase 4: template meta.
            'template_type'             => get_post_meta( $post->ID, '_template_type', true ) ?: 'post',
            'linked_directory_id'       => (int) get_post_meta( $post->ID, '_linked_directory_id', true ),
            'star_rating'               => (int) get_post_meta( $post->ID, '_star_rating', true ),
            'location_name'             => get_post_meta( $post->ID, '_location_name', true ) ?: '',
            'poll_options'              => json_decode( get_post_meta( $post->ID, '_poll_options', true ) ?: '[]', true ),
            'poll_expires_at'           => get_post_meta( $post->ID, '_poll_expires_at', true ) ?: '',
            'poll_description'          => get_post_meta( $post->ID, '_poll_description', true ) ?: '',
            'gallery_images'            => json_decode( get_post_meta( $post->ID, '_gallery_images', true ) ?: '[]', true ),
            'video_url'                 => get_post_meta( $post->ID, '_video_url', true ) ?: '',
            'itinerary_stops'           => json_decode( get_post_meta( $post->ID, '_itinerary_stops', true ) ?: '[]', true ),
            'itinerary_title'           => get_post_meta( $post->ID, '_itinerary_title', true ) ?: '',
            'itinerary_city'            => get_post_meta( $post->ID, '_itinerary_city', true ) ?: '',
            'itinerary_budget'          => get_post_meta( $post->ID, '_itinerary_budget', true ) ?: '',
            'itinerary_duration'        => get_post_meta( $post->ID, '_itinerary_duration', true ) ?: '',
            'itinerary_best_time'       => get_post_meta( $post->ID, '_itinerary_best_time', true ) ?: '',
            'food_dish_name'            => get_post_meta( $post->ID, '_food_dish_name', true ) ?: '',
            'food_rating_taste'         => (int) get_post_meta( $post->ID, '_food_rating_taste', true ),
            'food_rating_value'         => (int) get_post_meta( $post->ID, '_food_rating_value', true ),
            'food_rating_vibe'          => (int) get_post_meta( $post->ID, '_food_rating_vibe', true ),
            'cuisine_tag'               => get_post_meta( $post->ID, '_cuisine_tag', true ) ?: '',
            'price_range'               => get_post_meta( $post->ID, '_price_range', true ) ?: '',
            'place_name'                => get_post_meta( $post->ID, '_place_name', true ) ?: '',
            'place_location'            => get_post_meta( $post->ID, '_place_location', true ) ?: '',
            'opening_hours'             => get_post_meta( $post->ID, '_opening_hours', true ) ?: '',
            'cultural_take_headline'    => get_post_meta( $post->ID, '_cultural_take_headline', true ) ?: '',
            'showcase_title'            => get_post_meta( $post->ID, '_showcase_title', true ) ?: '',
            'showcase_medium'           => get_post_meta( $post->ID, '_showcase_medium', true ) ?: '',
            'showcase_collaborator'     => get_post_meta( $post->ID, '_showcase_collaborator', true ) ?: '',
            'showcase_collaborator_username' => get_post_meta( $post->ID, '_showcase_collaborator_username', true ) ?: '',
            'book_title'                => get_post_meta( $post->ID, '_book_title', true ) ?: '',
            'book_author'               => get_post_meta( $post->ID, '_book_author', true ) ?: '',
            'book_status'               => get_post_meta( $post->ID, '_book_status', true ) ?: '',
            'book_overall_rating'       => (int) get_post_meta( $post->ID, '_book_overall_rating', true ),
            'book_rating_writing'       => (int) get_post_meta( $post->ID, '_book_rating_writing', true ),
            'book_rating_story'         => (int) get_post_meta( $post->ID, '_book_rating_story', true ),
            'book_rating_characters'    => (int) get_post_meta( $post->ID, '_book_rating_characters', true ),
            'book_rating_pacing'        => (int) get_post_meta( $post->ID, '_book_rating_pacing', true ),
            'book_fav_quote'            => get_post_meta( $post->ID, '_book_fav_quote', true ) ?: '',
            'book_recommend'            => get_post_meta( $post->ID, '_book_recommend', true ) === '1',
            'book_genres'               => json_decode( get_post_meta( $post->ID, '_book_genres', true ) ?: '[]', true ),
        );
    }

    // ── Shop handlers ─────────────────────────────────────────────────────────

    /**
     * Resolves the display currency for shop pricing based on a client-supplied
     * country string. WooCommerce store currency (GBP) stays the booking currency
     * for the actual WC_Order; this only controls what price the shopper sees and,
     * for Nigeria, what currency they pay in via Paystack.
     *
     * Shop browse/detail routes use '__return_true' permission callbacks (no
     * mobile_permission() auth), so wp_get_current_user() is unreliable here —
     * country must come from an explicit request param, not the session.
     *
     * @return array{code:string,symbol:string,rate:float}
     */
    public static function resolve_shop_currency( $request ) {
        $country = strtolower( trim( (string) $request->get_param( 'country' ) ) );
        $base_currency = function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'GBP';
        $base_symbol   = function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol( $base_currency ) ) : '£';

        if ( 'nigeria' === $country && 'NGN' !== $base_currency ) {
            $rate = (float) get_option( 'culture_shop_fx_ngn_per_gbp', 1900 );
            return array( 'code' => 'NGN', 'symbol' => '₦', 'rate' => $rate > 0 ? $rate : 1900.0 );
        }

        return array( 'code' => $base_currency, 'symbol' => $base_symbol, 'rate' => 1.0 );
    }

    /**
     * Converts a GBP price string/float to the resolved display currency.
     * Returns '' for empty input (mirrors the existing ?: '' fallback pattern).
     */
    public static function convert_shop_price( $gbp_price, array $fx ) {
        if ( '' === $gbp_price || null === $gbp_price || false === $gbp_price ) {
            return '';
        }
        $converted = (float) $gbp_price * $fx['rate'];
        return (string) round( $converted, $fx['rate'] > 1 ? 0 : 2 );
    }

    public static function handle_shop_products( $request ) {
        global $wpdb;

        if ( ! function_exists( 'wc_get_product' ) ) {
            return rest_ensure_response( array( 'products' => array(), 'total' => 0, 'pages' => 0, 'page' => 1 ) );
        }

        $category = sanitize_text_field( $request->get_param( 'category' ) );
        $maker    = sanitize_text_field( $request->get_param( 'maker' ) );
        $search   = sanitize_text_field( $request->get_param( 's' ) );
        $page     = max( 1, (int) $request->get_param( 'page' ) );
        $per_page = min( 50, max( 1, (int) $request->get_param( 'per_page' ) ) );

        $user   = wp_get_current_user();
        $is_pro = $user->ID && in_array( 'patron', (array) $user->roles, true );

        $query_args = array(
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => $search ? 'relevance' : 'date',
            'order'          => 'DESC',
        );

        if ( $search ) {
            $query_args['s'] = $search;
        }

        if ( $category ) {
            $query_args['tax_query'] = array( array(
                'taxonomy' => 'product_cat',
                'field'    => 'slug',
                'terms'    => $category,
            ) );
        }

        if ( $maker ) {
            $query_args['meta_query'] = array( array(
                'key'     => '_maker_name',
                'value'   => $maker,
                'compare' => '=',
            ) );
        }

        $q        = new WP_Query( $query_args );
        $products = array();
        $fx              = self::resolve_shop_currency( $request );
        $currency_symbol = $fx['symbol'];
        $currency        = $fx['code'];

        foreach ( $q->posts as $post ) {
            $wc = wc_get_product( $post->ID );
            if ( ! $wc ) continue;

            $price   = $wc->get_price();
            $regular = $wc->get_regular_price();
            $sale    = $wc->get_sale_price();

            $pro_price     = ( $is_pro && $price ) ? round( (float) $price * 0.9, 2 ) : null;
            $created_days  = ( time() - strtotime( $post->post_date ) ) / DAY_IN_SECONDS;
            $stock_qty     = $wc->get_stock_quantity();
            $pro_early     = get_post_meta( $post->ID, '_pro_early_access', true );

            if ( $pro_early )                            $badge = 'pro_early_access';
            elseif ( $created_days < 14 )                $badge = 'new';
            elseif ( $sale )                             $badge = 'sale';
            elseif ( $stock_qty && $stock_qty <= 3 )     $badge = 'low_stock';
            else                                         $badge = null;

            $image_id  = $wc->get_image_id();
            $image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'medium' ) : '';

            $cat_terms  = get_the_terms( $post->ID, 'product_cat' );
            $categories = $cat_terms ? array_map( fn( $t ) => $t->slug, $cat_terms ) : array();

            $products[] = array(
                'id'             => $post->ID,
                'name'           => $post->post_title,
                'slug'           => $post->post_name,
                'price'          => self::convert_shop_price( $price, $fx ),
                'regularPrice'   => self::convert_shop_price( $regular, $fx ),
                'salePrice'      => self::convert_shop_price( $sale, $fx ),
                'proPrice'       => self::convert_shop_price( $pro_price, $fx ),
                'currency'       => $currency,
                'currencySymbol' => $currency_symbol,
                'imageUrl'       => $image_url ?: null,
                'makerName'      => get_post_meta( $post->ID, '_maker_name', true ) ?: '',
                'makerCity'      => get_post_meta( $post->ID, '_maker_city', true ) ?: '',
                'badge'          => $badge,
                'stockStatus'    => $wc->get_stock_status(),
                'stockQuantity'  => $stock_qty,
                'categories'     => $categories,
            );
        }

        return rest_ensure_response( array(
            'products' => $products,
            'total'    => (int) $q->found_posts,
            'pages'    => (int) $q->max_num_pages,
            'page'     => $page,
        ) );
    }

    public static function handle_shop_product_detail( $request ) {
        if ( ! function_exists( 'wc_get_product' ) ) {
            return new WP_Error( 'woocommerce_missing', 'WooCommerce not active', array( 'status' => 503 ) );
        }

        $id  = (int) $request['id'];
        $wc  = wc_get_product( $id );
        if ( ! $wc ) {
            return new WP_Error( 'not_found', 'Product not found', array( 'status' => 404 ) );
        }

        $user   = wp_get_current_user();
        $is_pro = $user->ID && in_array( 'patron', (array) $user->roles, true );

        $fx              = self::resolve_shop_currency( $request );
        $currency_symbol = $fx['symbol'];
        $currency        = $fx['code'];

        $price   = $wc->get_price();
        $regular = $wc->get_regular_price();
        $sale    = $wc->get_sale_price();
        $pro_price = ( $is_pro && $price ) ? round( (float) $price * 0.9, 2 ) : null;

        // Gallery images (main + gallery)
        $image_ids   = array_merge(
            array( $wc->get_image_id() ),
            $wc->get_gallery_image_ids()
        );
        $images = array();
        foreach ( $image_ids as $img_id ) {
            if ( $img_id ) {
                $url = wp_get_attachment_image_url( $img_id, 'large' );
                if ( $url ) $images[] = $url;
            }
        }

        // Badge
        $post         = get_post( $id );
        $created_days = ( time() - strtotime( $post->post_date ) ) / DAY_IN_SECONDS;
        $stock_qty    = $wc->get_stock_quantity();
        $pro_early    = get_post_meta( $id, '_pro_early_access', true );
        if ( $pro_early )                            $badge = 'pro_early_access';
        elseif ( $created_days < 14 )                $badge = 'new';
        elseif ( $sale )                             $badge = 'sale';
        elseif ( $stock_qty && $stock_qty <= 3 )     $badge = 'low_stock';
        else                                         $badge = null;

        // Categories
        $cat_terms  = get_the_terms( $id, 'product_cat' );
        $categories = $cat_terms ? array_map( fn( $t ) => $t->slug, $cat_terms ) : array();

        // Colour variants (from pa_colour attribute if it exists)
        $colours    = array();
        $sizes      = array();
        $variations = array();
        if ( $wc->is_type( 'variable' ) ) {
            /** @var WC_Product_Variable $wc */
            $available_variations = $wc->get_available_variations();

            // Identify which attribute key (if any) is the colour-like attribute,
            // since variations are matched on the combination of attributes.
            $colour_attr_key = null;
            foreach ( $wc->get_variation_attributes() as $attr => $values ) {
                $label = wc_attribute_label( $attr );
                if ( strpos( strtolower( $label ), 'colour' ) !== false || strpos( strtolower( $label ), 'color' ) !== false ) {
                    $colour_attr_key = 'attribute_' . $attr;
                }
                foreach ( $values as $val ) {
                    $in_stock = false;
                    foreach ( $available_variations as $var ) {
                        $attr_key = 'attribute_' . $attr;
                        if ( isset( $var['attributes'][ $attr_key ] ) && ( $var['attributes'][ $attr_key ] === $val || $var['attributes'][ $attr_key ] === '' ) ) {
                            if ( $var['is_in_stock'] ) { $in_stock = true; break; }
                        }
                    }
                    if ( strpos( strtolower( $label ), 'colour' ) !== false || strpos( strtolower( $label ), 'color' ) !== false ) {
                        $colours[] = array( 'name' => $val, 'hex' => '', 'available' => $in_stock );
                    } else {
                        $sizes[] = array( 'name' => $val, 'available' => $in_stock );
                    }
                }
            }

            // Real WooCommerce variation IDs, keyed by their colour/size combination,
            // so the app can resolve the exact variation the shopper selected.
            foreach ( $available_variations as $var ) {
                $entry = array(
                    'id'      => (int) $var['variation_id'],
                    'colour'  => null,
                    'size'    => null,
                    'inStock' => (bool) $var['is_in_stock'],
                );
                foreach ( $var['attributes'] as $attr_key => $val ) {
                    if ( '' === $val ) continue;
                    if ( $colour_attr_key && $attr_key === $colour_attr_key ) {
                        $entry['colour'] = $val;
                    } else {
                        $entry['size'] = $val;
                    }
                }
                $variations[] = $entry;
            }
        }

        // Maker fields
        $maker_name      = get_post_meta( $id, '_maker_name', true ) ?: '';
        $maker_city      = get_post_meta( $id, '_maker_city', true ) ?: '';
        $maker_bio       = get_post_meta( $id, '_maker_bio', true ) ?: '';
        $maker_since     = get_post_meta( $id, '_maker_since', true ) ?: '';
        $maker_rating    = (float) ( get_post_meta( $id, '_maker_rating', true ) ?: 0 );
        $maker_avatar_id = (int) ( get_post_meta( $id, '_maker_avatar_id', true ) ?: 0 );
        $maker_avatar    = $maker_avatar_id ? wp_get_attachment_image_url( $maker_avatar_id, 'thumbnail' ) : null;

        // Count other products by same maker
        $maker_product_count = 0;
        if ( $maker_name ) {
            global $wpdb;
            $maker_product_count = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(p.ID) FROM {$wpdb->posts} p
                 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
                 WHERE p.post_type = 'product' AND p.post_status = 'publish'
                 AND pm.meta_key = '_maker_name' AND pm.meta_value = %s",
                $maker_name
            ) );
        }

        // How It's Made (stored as JSON in post meta)
        $how_raw     = get_post_meta( $id, '_how_its_made', true );
        $how_its_made = $how_raw ? json_decode( $how_raw, true ) : array();
        if ( ! is_array( $how_its_made ) ) $how_its_made = array();

        // As Seen In (stored as JSON: {title, slug})
        $seen_raw  = get_post_meta( $id, '_as_seen_in', true );
        $as_seen_in = $seen_raw ? json_decode( $seen_raw, true ) : null;

        // Related products (WooCommerce related + fallback to same maker)
        $related_ids  = wc_get_related_products( $id, 4 );
        $related_products = array();
        foreach ( $related_ids as $rel_id ) {
            $rel_wc = wc_get_product( $rel_id );
            if ( ! $rel_wc ) continue;
            $rel_img_id = $rel_wc->get_image_id();
            $related_products[] = array(
                'id'             => $rel_id,
                'name'           => get_the_title( $rel_id ),
                'slug'           => get_post_field( 'post_name', $rel_id ),
                'price'          => self::convert_shop_price( $rel_wc->get_price(), $fx ),
                'regularPrice'   => self::convert_shop_price( $rel_wc->get_regular_price(), $fx ),
                'salePrice'      => self::convert_shop_price( $rel_wc->get_sale_price(), $fx ),
                'proPrice'       => null,
                'currency'       => $currency,
                'currencySymbol' => $currency_symbol,
                'imageUrl'       => $rel_img_id ? wp_get_attachment_image_url( $rel_img_id, 'medium' ) : null,
                'makerName'      => get_post_meta( $rel_id, '_maker_name', true ) ?: '',
                'makerCity'      => get_post_meta( $rel_id, '_maker_city', true ) ?: '',
                'badge'          => null,
                'stockStatus'    => $rel_wc->get_stock_status(),
                'stockQuantity'  => $rel_wc->get_stock_quantity(),
                'categories'     => array(),
            );
        }

        return rest_ensure_response( array(
            'id'               => $id,
            'name'             => $post->post_title,
            'slug'             => $post->post_name,
            'price'            => self::convert_shop_price( $price, $fx ),
            'regularPrice'     => self::convert_shop_price( $regular, $fx ),
            'salePrice'        => self::convert_shop_price( $sale, $fx ),
            'proPrice'         => self::convert_shop_price( $pro_price, $fx ),
            'currency'         => $currency,
            'currencySymbol'   => $currency_symbol,
            'imageUrl'         => $images[0] ?? null,
            'images'           => $images,
            'badge'            => $badge,
            'stockStatus'      => $wc->get_stock_status(),
            'stockQuantity'    => $stock_qty,
            'categories'       => $categories,
            'makerName'        => $maker_name,
            'makerCity'        => $maker_city,
            'makerBio'         => $maker_bio,
            'makerSince'       => $maker_since,
            'makerRating'      => $maker_rating,
            'makerProductCount'=> $maker_product_count,
            'makerAvatarUrl'   => $maker_avatar,
            'description'      => $wc->get_description(),
            'shortDescription' => $wc->get_short_description(),
            'colours'          => $colours,
            'sizes'            => $sizes,
            'variations'       => $variations,
            'howItsMade'       => $how_its_made,
            'asSeenIn'         => $as_seen_in,
            'relatedProducts'  => $related_products,
            'vetted'           => (bool) get_post_meta( $id, '_maker_vetted', true ),
        ) );
    }

    public static function handle_shop_categories( $request ) {
        $terms = get_terms( array(
            'taxonomy'   => 'product_cat',
            'hide_empty' => true,
            'orderby'    => 'count',
            'order'      => 'DESC',
            'number'     => 20,
        ) );

        if ( is_wp_error( $terms ) ) {
            return rest_ensure_response( array() );
        }

        $categories = array_map( function( $term ) {
            return array(
                'id'    => $term->term_id,
                'name'  => $term->name,
                'slug'  => $term->slug,
                'count' => $term->count,
            );
        }, $terms );

        return rest_ensure_response( $categories );
    }

    public static function handle_shop_vendors( $request ) {
        global $wpdb;

        if ( ! function_exists( 'wc_get_product' ) ) {
            return rest_ensure_response( array() );
        }

        // Aggregate vendor data from product meta
        $rows = $wpdb->get_results(
            "SELECT pm.meta_value AS maker_name,
                    pm2.meta_value AS maker_city,
                    COUNT(p.ID) AS product_count,
                    MIN(p.ID) AS sample_id
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm  ON pm.post_id  = p.ID AND pm.meta_key  = '_maker_name'
             LEFT  JOIN {$wpdb->postmeta} pm2 ON pm2.post_id = p.ID AND pm2.meta_key = '_maker_city'
             WHERE p.post_type   = 'product'
               AND p.post_status = 'publish'
               AND pm.meta_value != ''
             GROUP BY pm.meta_value
             ORDER BY product_count DESC
             LIMIT 20",
            ARRAY_A
        );

        $vendors = array();
        foreach ( (array) $rows as $row ) {
            $logo_url = '';
            $wc       = wc_get_product( (int) $row['sample_id'] );
            if ( $wc ) {
                $img_id   = $wc->get_image_id();
                $logo_url = $img_id ? wp_get_attachment_image_url( $img_id, 'thumbnail' ) : '';
            }

            $vendors[] = array(
                'name'         => $row['maker_name'],
                'city'         => $row['maker_city'] ?: '',
                'productCount' => (int) $row['product_count'],
                'logoUrl'      => $logo_url ?: null,
            );
        }

        return rest_ensure_response( $vendors );
    }

    public static function handle_points_config( $request ) {
        $point_values  = Culture_Gamification::get_point_values();
        $daily_cap     = Culture_Gamification::get_daily_cap();

        $action_labels = array(
            'event_rsvp'            => 'RSVP to an event',
            'event_checkin'         => 'Check in at an event',
            'referral'              => 'Refer a friend',
            'community_post'        => 'Publish a community post',
            'community_comment'     => 'Comment on a post',
            'community_like'        => 'Like a post',
            'quote_submission'      => 'Submit a quote',
            'quote_like'            => 'Like a quote',
            'newsletter_comment'    => 'Comment on a newsletter',
            'newsletter_reaction'   => 'React to a newsletter',
            'newsletter_subscribed' => 'Subscribe to a newsletter',
            'magazine_read'         => 'Read an article',
            'magazine_share'        => 'Share an article',
            'directory_entry'       => 'Add a directory entry',
            'directory_opt_in'      => 'Opt into the directory',
            'poll_vote'             => 'Vote in a poll',
            'profile_completed'     => 'Complete your profile',
            'email_verified'        => 'Verify your email',
        );

        $actions = array();
        foreach ( $action_labels as $key => $label ) {
            $rep     = isset( $point_values[ $key ] ) ? (int) $point_values[ $key ] : 0;
            $credits = Culture_Gamification::get_credit_bonus( $key );
            if ( $rep === 0 && $credits === 0 ) continue;
            $actions[] = array(
                'action'  => $key,
                'label'   => $label,
                'rep'     => $rep,
                'credits' => $credits,
            );
        }

        // Games award credits proportional to score (see
        // Culture_REST_API::handle_games_complete() / GAME_MAX_CREDITS), not the
        // flat 'game_completed' value above — show the real per-game ceiling
        // instead of a flat number that never matched what players actually got.
        $game_rep = isset( $point_values['game_completed'] ) ? (int) $point_values['game_completed'] : 0;
        $game_labels = array(
            'trivia'      => 'Complete Daily Trivia',
            'who-said-it' => 'Complete Who Said It',
        );
        foreach ( Culture_REST_API::GAME_MAX_CREDITS as $game_type => $max_credits ) {
            $actions[] = array(
                'action'           => 'game_completed_' . $game_type,
                'label'            => isset( $game_labels[ $game_type ] ) ? $game_labels[ $game_type ] : 'Complete a game',
                'rep'              => $game_rep,
                'credits'          => $max_credits,
                'credits_variable' => true,
            );
        }

        $tiers = array(
            array( 'slug' => 'member',              'label' => 'Member',             'min_rep' => 0,     'perks' => 'Access to community feed, newsletters, and games.' ),
            array( 'slug' => 'culture-contributor', 'label' => 'Culture Contributor', 'min_rep' => Culture_Gamification::get_rep_tier_threshold( 'contributor' ), 'perks' => 'Boosted feed visibility, unlock more templates.' ),
            array( 'slug' => 'taste-maker',         'label' => 'Taste Maker',        'min_rep' => Culture_Gamification::get_rep_tier_threshold( 'taste-maker' ),  'perks' => 'Skip post review queue, access poll and itinerary templates.' ),
            array( 'slug' => 'culture-authority',   'label' => 'Culture Authority',  'min_rep' => Culture_Gamification::get_rep_tier_threshold( 'authority' ),    'perks' => 'Nominate members for Culture Icon.' ),
            array( 'slug' => 'culture-icon',        'label' => 'Culture Icon',       'min_rep' => 25000, 'perks' => 'Invitation and nomination only.', 'nomination_only' => true ),
        );

        return rest_ensure_response( array(
            'actions'    => $actions,
            'tiers'      => $tiers,
            'daily_cap'  => $daily_cap,
        ) );
    }

    public static function handle_get_cart( $request ) {
        // Stub: WooCommerce session-based cart does not translate to REST easily.
        // Return an empty cart structure; real cart management is handled by
        // WooCommerce Store API (wc/store/v1/cart) in native checkout.
        return rest_ensure_response( array( 'items' => array(), 'total' => '0', 'item_count' => 0 ) );
    }

    public static function handle_add_to_cart( $request ) {
        if ( ! function_exists( 'WC' ) ) {
            return new WP_Error( 'wc_missing', 'Shop not available.', array( 'status' => 503 ) );
        }
        $product_id = (int) $request->get_param( 'product_id' );
        $quantity   = max( 1, (int) $request->get_param( 'quantity' ) );
        $product    = wc_get_product( $product_id );

        if ( ! $product ) {
            return new WP_Error( 'not_found', 'Product not found.', array( 'status' => 404 ) );
        }

        // Use WooCommerce Store API redirect URL as the checkout URL
        $checkout_url = wc_get_checkout_url() . '?add-to-cart=' . $product_id . '&quantity=' . $quantity;

        return rest_ensure_response( array(
            'checkout_url' => $checkout_url,
            'product_id'   => $product_id,
            'quantity'     => $quantity,
        ) );
    }

    /**
     * GET /mobile/directory/entry?slug=X or ?id=X
     * Returns all data needed for the DirectoryDetailScreen.
     * Public — no auth required.
     */
    public static function handle_get_directory_entry( WP_REST_Request $request ) {
        $slug = $request->get_param( 'slug' );
        $id   = (int) $request->get_param( 'id' );

        if ( $slug ) {
            $q = new WP_Query( array(
                'post_type'      => 'culture_directory',
                'post_status'    => 'publish',
                'name'           => $slug,
                'posts_per_page' => 1,
                'no_found_rows'  => true,
            ) );
            $post = $q->have_posts() ? $q->posts[0] : null;
        } elseif ( $id ) {
            $post = get_post( $id );
            if ( $post && $post->post_type !== 'culture_directory' ) {
                $post = null;
            }
        } else {
            return new WP_Error( 'missing_param', 'slug or id required', array( 'status' => 400 ) );
        }

        if ( ! $post || $post->post_status !== 'publish' ) {
            return new WP_Error( 'not_found', 'Entry not found', array( 'status' => 404 ) );
        }

        $pid = $post->ID;

        // Entry type from taxonomy
        $type_terms = get_the_terms( $pid, 'culture_dir_type' );
        $entry_type = ( $type_terms && ! is_wp_error( $type_terms ) ) ? $type_terms[0]->slug : 'concept';

        // Interest tags from taxonomy
        $interest_terms = get_the_terms( $pid, 'culture_interest' );
        $interests = array();
        if ( $interest_terms && ! is_wp_error( $interest_terms ) ) {
            foreach ( $interest_terms as $t ) {
                $interests[] = ucwords( str_replace( '-', ' ', $t->name ) );
            }
        }

        $image_url      = get_the_post_thumbnail_url( $pid, 'large' ) ?: null;
        $about_raw      = get_post_meta( $pid, '_about_fields', true );
        $about_fields   = $about_raw ? json_decode( $about_raw, true ) : array();
        $entry_quote    = get_post_meta( $pid, '_entry_quote', true ) ?: '';
        $selected_raw   = get_post_meta( $pid, '_selected_works', true );
        $selected_works = $selected_raw ? json_decode( $selected_raw, true ) : array();
        $related_raw    = get_post_meta( $pid, '_related_entries', true );
        $related_entries = $related_raw ? json_decode( $related_raw, true ) : array();
        $is_partner     = (bool) get_post_meta( $pid, '_is_partner', true );
        $avg_rating     = (float) ( get_post_meta( $pid, '_average_rating', true ) ?: 0 );
        $review_count   = (int) ( get_post_meta( $pid, '_community_review_count', true ) ?: 0 );
        $city           = get_post_meta( $pid, '_entry_city', true ) ?: '';

        // Community posts linked to this directory entry (latest 5)
        global $wpdb;
        $posts_raw = $wpdb->get_results( $wpdb->prepare(
            "SELECT p.ID, p.post_title, p.post_excerpt, p.post_author
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_culture_linked_directory' AND pm.meta_value = %s
             WHERE p.post_type = 'culture_post' AND p.post_status = 'publish'
             ORDER BY p.post_date DESC LIMIT 5",
            (string) $pid
        ), ARRAY_A );

        $community_posts = array();
        foreach ( $posts_raw as $cp ) {
            $author      = get_userdata( (int) $cp['post_author'] );
            $template    = get_post_meta( $cp['ID'], '_community_template_type', true ) ?: 'post';
            $star_rating = (float) ( get_post_meta( $cp['ID'], '_star_rating', true ) ?: 0 );
            $community_posts[] = array(
                'id'             => (int) $cp['ID'],
                'slug'           => get_post_field( 'post_name', (int) $cp['ID'] ),
                'title'          => $cp['post_title'],
                'excerpt'        => $cp['post_excerpt'],
                'templateType'   => $template,
                'authorName'     => $author ? ( $author->display_name ?: $author->user_login ) : 'Member',
                'authorUsername' => $author ? $author->user_login : '',
                'starRating'     => $star_rating,
            );
        }

        return rest_ensure_response( array(
            'id'               => $pid,
            'title'            => $post->post_title,
            'slug'             => $post->post_name,
            'excerpt'          => $post->post_excerpt,
            'body'             => $post->post_content,
            'imageUrl'         => $image_url,
            'entryType'        => $entry_type,
            'interests'        => $interests,
            'city'             => $city,
            'isPartner'        => $is_partner,
            'averageRating'    => $avg_rating,
            'reviewCount'      => $review_count,
            'aboutFields'      => is_array( $about_fields ) ? $about_fields : array(),
            'entryQuote'       => $entry_quote,
            'selectedWorks'    => is_array( $selected_works ) ? $selected_works : array(),
            'relatedEntries'   => is_array( $related_entries ) ? $related_entries : array(),
            'communityPosts'   => $community_posts,
            'communityPostCount' => $review_count,
        ) );
    }

    public static function handle_get_referrals( $request ) {
        global $wpdb;
        $user_id = get_current_user_id();

        $code  = class_exists( 'Culture_Referrals' ) ? Culture_Referrals::get_referral_code( $user_id ) : '';
        $count = class_exists( 'Culture_Referrals' ) ? Culture_Referrals::get_referral_count( $user_id ) : 0;

        $referred_user_ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT user_id FROM {$wpdb->usermeta} WHERE meta_key = '_culture_referred_by' AND meta_value = %d",
            $user_id
        ) );

        $referred = array();
        foreach ( $referred_user_ids as $rid ) {
            $u = get_userdata( (int) $rid );
            if ( ! $u ) continue;
            $referred[] = array(
                'username'    => $u->user_login,
                'displayName' => $u->display_name ?: $u->user_login,
                'joinedAt'    => strtotime( $u->user_registered ),
            );
        }
        usort( $referred, fn( $a, $b ) => $b['joinedAt'] - $a['joinedAt'] );

        $rep_per     = class_exists( 'Culture_Gamification' ) ? ( Culture_Gamification::POINTS['referral'] ?? 30 ) : 30;
        $credits_per = class_exists( 'Culture_Gamification' ) ? ( Culture_Gamification::CREDIT_BONUSES['referral'] ?? 5 ) : 5;

        return rest_ensure_response( array(
            'referralCode'             => $code,
            'referralUrl'              => 'https://web.themoveee.com/register?ref=' . $code,
            'referralCount'            => $count,
            'repPerReferral'           => $rep_per,
            'creditsPerReferral'       => $credits_per,
            'referredUsers'            => $referred,
            'connectorThreshold'       => 3,
            'superConnectorThreshold'  => 10,
        ) );
    }

    /**
     * POST /mobile/validate-coupon
     * Validates a WooCommerce coupon code and returns discount information.
     * Lets the app show the real discount before opening the web checkout.
     */
    public static function handle_validate_coupon( WP_REST_Request $request ) {
        $code     = strtoupper( sanitize_text_field( $request->get_param( 'code' ) ) );
        $subtotal = (float) $request->get_param( 'subtotal' );

        if ( ! class_exists( 'WC_Coupon' ) ) {
            return new WP_Error( 'woocommerce_unavailable', 'WooCommerce is not active.', array( 'status' => 503 ) );
        }

        $coupon = new WC_Coupon( $code );

        if ( ! $coupon->get_id() ) {
            return new WP_Error( 'invalid_coupon', 'This promo code is not valid.', array( 'status' => 422 ) );
        }

        // Check expiry
        $expiry = $coupon->get_date_expires();
        if ( $expiry && $expiry->getTimestamp() < time() ) {
            return new WP_Error( 'coupon_expired', 'This promo code has expired.', array( 'status' => 422 ) );
        }

        // Check usage limit
        $usage_limit = $coupon->get_usage_limit();
        if ( $usage_limit > 0 && $coupon->get_usage_count() >= $usage_limit ) {
            return new WP_Error( 'coupon_exhausted', 'This promo code has reached its usage limit.', array( 'status' => 422 ) );
        }

        // Calculate discount amount
        $discount_type   = $coupon->get_discount_type(); // percent, fixed_cart, fixed_product
        $discount_amount = (float) $coupon->get_amount();
        $discount_value  = 0.0;

        if ( $discount_type === 'percent' ) {
            $discount_value = $subtotal > 0 ? round( $subtotal * ( $discount_amount / 100 ), 2 ) : 0;
        } elseif ( in_array( $discount_type, array( 'fixed_cart', 'fixed_product' ), true ) ) {
            $discount_value = min( $discount_amount, $subtotal );
        }

        return rest_ensure_response( array(
            'valid'          => true,
            'code'           => $code,
            'discount_type'  => $discount_type,
            'discount_amount' => $discount_amount,
            'discount_value' => $discount_value,
            'description'    => $coupon->get_description() ?: '',
        ) );
    }

    /**
     * POST /mobile/checkout-token
     * Issues a one-time, 120-second transient key the mobile in-app browser
     * exchanges (via GET /mobile/checkout-redirect) for a WordPress auth cookie,
     * enabling seamless checkout.
     */
    public static function handle_checkout_token( WP_REST_Request $request ) {
        $user_id     = get_current_user_id();
        $redirect_to = sanitize_text_field( $request->get_param( 'redirect_to' ) ?: '/checkout' );

        // Only allow same-site paths to prevent open-redirect abuse
        if ( ! str_starts_with( $redirect_to, '/' ) || str_contains( $redirect_to, '//' ) ) {
            $redirect_to = '/checkout';
        }

        // Pull an optional coupon code out of the redirect path's query string
        $coupon_code = '';
        $query = (string) wp_parse_url( $redirect_to, PHP_URL_QUERY );
        if ( $query ) {
            wp_parse_str( $query, $redirect_params );
            $coupon_code = sanitize_text_field( $redirect_params['coupon_code'] ?? '' );
        }

        // Sanitise cart items: [{ id: int, qty: int, variation_id?: int }]
        $raw_items = $request->get_param( 'cart_items' );
        $cart_items = array();
        if ( is_array( $raw_items ) ) {
            foreach ( $raw_items as $raw ) {
                $product_id = absint( $raw['id'] ?? 0 );
                $qty        = max( 1, absint( $raw['qty'] ?? 1 ) );
                if ( $product_id > 0 ) {
                    $cart_items[] = array( 'id' => $product_id, 'qty' => $qty );
                }
            }
        }

        // Generate a cryptographically random key (48 hex chars)
        $key = bin2hex( random_bytes( 24 ) );
        set_transient( 'culture_mob_checkout_' . $key, array(
            'user_id'     => $user_id,
            'cart_items'  => $cart_items,
            'coupon_code' => $coupon_code,
        ), 120 );

        // Redeemed under /wp-json/ — never served from the Varnish page cache,
        // unlike a homepage URL with a query string would be.
        $auth_url = add_query_arg( 'key', $key, rest_url( 'culture/v1/mobile/checkout-redirect' ) );

        return rest_ensure_response( array( 'url' => $auth_url ) );
    }

    /**
     * GET /mobile/checkout-redirect
     * Validates the one-time token, logs the user in, populates the
     * WooCommerce cart (and coupon) with the items from the mobile app,
     * then redirects to the real WooCommerce checkout page.
     */
    public static function handle_checkout_redirect( WP_REST_Request $request ) {
        $key  = sanitize_text_field( $request->get_param( 'key' ) ?: '' );
        $data = $key ? get_transient( 'culture_mob_checkout_' . $key ) : false;

        if ( ! $data ) {
            // Token missing or expired — send to login
            wp_safe_redirect( wp_login_url( home_url( '/checkout' ) ) );
            exit;
        }

        // Consume the token (one-time use)
        delete_transient( 'culture_mob_checkout_' . $key );

        $user_id     = (int) ( $data['user_id'] ?? 0 );
        $cart_items  = $data['cart_items'] ?? array();
        $coupon_code = $data['coupon_code'] ?? '';

        if ( ! $user_id ) {
            wp_safe_redirect( wp_login_url( home_url( '/checkout' ) ) );
            exit;
        }

        // Log the user in and set a remember-me cookie (14-day expiry)
        wp_set_current_user( $user_id );
        wp_set_auth_cookie( $user_id, true );

        // Populate the WooCommerce cart with the mobile app's items
        if ( ! empty( $cart_items ) && function_exists( 'WC' ) ) {
            WC()->initialize_session();
            WC()->initialize_cart();
            WC()->cart->empty_cart();
            foreach ( $cart_items as $item ) {
                $product_id = (int) ( $item['id'] ?? 0 );
                $qty        = max( 1, (int) ( $item['qty'] ?? 1 ) );
                if ( $product_id > 0 ) {
                    WC()->cart->add_to_cart( $product_id, $qty );
                }
            }
            if ( $coupon_code ) {
                WC()->cart->add_discount( sanitize_text_field( $coupon_code ) );
            }

            // Persist session so the redirect request finds the cart
            WC()->session->save_data();
        }

        // Use WooCommerce's own checkout URL; fall back to /checkout
        $checkout_url = function_exists( 'wc_get_checkout_url' )
            ? wc_get_checkout_url()
            : home_url( '/checkout/' );

        wp_safe_redirect( $checkout_url );
        exit;
    }

    public static function handle_my_rsvps( WP_REST_Request $request ) {
        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Not logged in', array( 'status' => 401 ) );
        }

        $user = get_userdata( $user_id );
        if ( ! $user || ! $user->user_email ) {
            return rest_ensure_response( array( 'rsvps' => array() ) );
        }

        global $wpdb;
        $table = Culture_Event_RSVP::table();

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT r.id, r.event_slug, r.event_title, r.status, r.created_at,
                    p.ID AS event_id,
                    pm_date.meta_value AS start_date, pm_loc.meta_value AS location
             FROM {$table} r
             LEFT JOIN {$wpdb->posts} p ON p.post_name = r.event_slug AND p.post_type = 'culture_event' AND p.post_status = 'publish'
             LEFT JOIN {$wpdb->postmeta} pm_date ON pm_date.post_id = p.ID AND pm_date.meta_key = '_culture_event_date'
             LEFT JOIN {$wpdb->postmeta} pm_loc ON pm_loc.post_id = p.ID AND pm_loc.meta_key = '_culture_location'
             WHERE r.email = %s
             ORDER BY pm_date.meta_value DESC, r.created_at DESC",
            $user->user_email
        ), ARRAY_A );

        $rsvps = array_map( function( $row ) {
            return array(
                'eventId'   => (int) $row['event_id'],
                'slug'      => $row['event_slug'],
                'title'     => $row['event_title'] ?: '',
                'startDate' => $row['start_date'] ?: '',
                'location'  => $row['location'] ?: '',
                'status'    => $row['status'] ?: 'attending',
                'rsvpAt'    => $row['created_at'],
            );
        }, $rows ?: array() );

        return rest_ensure_response( array( 'rsvps' => $rsvps ) );
    }

    public static function handle_cancel_rsvp( WP_REST_Request $request ) {
        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Not logged in', array( 'status' => 401 ) );
        }

        $user = get_userdata( $user_id );
        if ( ! $user || ! $user->user_email ) {
            return new WP_Error( 'unauthorized', 'No email on account', array( 'status' => 400 ) );
        }

        $event_slug = sanitize_text_field( $request->get_param( 'event_slug' ) );
        if ( ! $event_slug ) {
            $event_id = (int) $request->get_param( 'event_id' );
            if ( $event_id ) {
                $post = get_post( $event_id );
                $event_slug = $post ? $post->post_name : '';
            }
        }
        if ( ! $event_slug ) {
            return new WP_Error( 'missing_event', 'event_slug or event_id required', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table = Culture_Event_RSVP::table();

        $updated = $wpdb->update(
            $table,
            array( 'status' => 'cancelled' ),
            array( 'email' => $user->user_email, 'event_slug' => $event_slug ),
            array( '%s' ),
            array( '%s', '%s' )
        );

        if ( $updated === false ) {
            return new WP_Error( 'db_error', 'Could not cancel RSVP', array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'success' => true ) );
    }

    public static function handle_article_read_complete( WP_REST_Request $request ) {
        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Authentication required.', array( 'status' => 401 ) );
        }

        $post_id = intval( $request->get_param( 'post_id' ) );
        $slug    = sanitize_text_field( $request->get_param( 'slug' ) );

        // Resolve post
        if ( ! $post_id && $slug ) {
            $post = get_page_by_path( $slug, OBJECT, 'post' );
            $post_id = $post ? $post->ID : 0;
        }
        if ( ! $post_id ) {
            return new WP_Error( 'not_found', 'Article not found.', array( 'status' => 404 ) );
        }

        // Idempotency — award once ever per article per user
        $meta_key  = '_culture_article_read_' . $post_id;
        $already   = get_user_meta( $user_id, $meta_key, true );
        if ( $already ) {
            return rest_ensure_response( array( 'credits_earned' => 0, 'already_awarded' => true ) );
        }

        // Look up the configured credit amount for magazine_read (default 1).
        $amount  = max( 1, (int) Culture_Gamification::get_credit_bonus( 'magazine_read' ) );
        $credits = Culture_Gamification::award_credits( $user_id, $amount, 'magazine_read', $post_id );
        Culture_Gamification::award_reputation( $user_id, Culture_Gamification::get_point_value( 'magazine_read' ), 'magazine_read', $post_id );
        update_user_meta( $user_id, $meta_key, '1' );

        return rest_ensure_response( array( 'credits_earned' => max( 0, intval( $credits ) ) ) );
    }

    /**
     * GET /mobile/shop/the-edit
     * Returns curated editorial picks for "The Edit" screen.
     *
     * Data source: magazine articles (post type 'post') that have
     * '_culture_featured_products' meta set. Products in turn carry
     * '_as_seen_in' meta linking back to the article.
     *
     * Response shape:
     *   hero         — first product from the newest featured article (with story context)
     *   season_picks — next up to 4 products (from same or second article)
     *   stories      — up to 4 articles that have featured products
     *   grid         — all remaining products, deduped
     */
    public static function handle_the_edit( WP_REST_Request $request ) {
        if ( ! function_exists( 'wc_get_product' ) ) {
            return rest_ensure_response( array(
                'hero'         => null,
                'season_picks' => array(),
                'stories'      => array(),
                'grid'         => array(),
            ) );
        }

        global $wpdb;

        // Fetch the most recent 6 articles that have _culture_featured_products set
        $article_ids = $wpdb->get_col(
            "SELECT DISTINCT p.ID FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
             WHERE p.post_type = 'post'
               AND p.post_status = 'publish'
               AND pm.meta_key = '_culture_featured_products'
               AND pm.meta_value != ''
               AND pm.meta_value != '[]'
             ORDER BY p.post_date DESC
             LIMIT 6"
        );

        if ( empty( $article_ids ) ) {
            return rest_ensure_response( array(
                'hero'         => null,
                'season_picks' => array(),
                'stories'      => array(),
                'grid'         => array(),
            ) );
        }

        $fx              = self::resolve_shop_currency( $request );
        $currency        = $fx['code'];
        $currency_symbol = $fx['symbol'];

        $stories      = array();
        $all_products = array(); // keyed by product id to dedupe
        $seen_ids     = array();

        foreach ( $article_ids as $article_id ) {
            $post = get_post( $article_id );
            if ( ! $post ) continue;

            $raw         = get_post_meta( $article_id, '_culture_featured_products', true );
            $product_ids = $raw ? array_filter( array_map( 'absint', (array) json_decode( $raw, true ) ) ) : array();
            if ( empty( $product_ids ) ) continue;

            $thumb = get_the_post_thumbnail_url( $article_id, 'medium' );
            $cats  = get_the_category( $article_id );

            $stories[] = array(
                'slug'        => $post->post_name,
                'title'       => $post->post_title,
                'category'    => ! empty( $cats ) ? strtoupper( $cats[0]->name ) : 'CULTURE',
                'image'       => $thumb ?: null,
                'readTime'    => (int) get_post_meta( $article_id, '_reading_time', true ) ?: null,
                'productIds'  => array_values( $product_ids ),
            );

            foreach ( $product_ids as $pid ) {
                if ( isset( $seen_ids[ $pid ] ) ) continue;
                $wc = wc_get_product( $pid );
                if ( ! $wc || ! $wc->is_visible() ) continue;

                $image_id  = $wc->get_image_id();
                $reg_price = (float) $wc->get_regular_price();
                $sale_price = (float) $wc->get_sale_price();
                $stock_qty = $wc->get_stock_quantity();

                // Badge
                $badge      = null;
                $badge_label = null;
                if ( get_post_meta( $pid, '_pro_early_access', true ) ) {
                    $badge = 'pro_early_access'; $badge_label = 'PRO EARLY ACCESS';
                } elseif ( $sale_price > 0 ) {
                    $badge = 'sale'; $badge_label = 'SALE';
                } elseif ( $stock_qty !== null && $stock_qty <= 3 && $stock_qty > 0 ) {
                    $badge = 'low_stock'; $badge_label = 'ONLY ' . $stock_qty . ' LEFT';
                } elseif ( ( time() - get_post_time( 'U', false, $pid ) ) < 14 * DAY_IN_SECONDS ) {
                    $badge = 'new'; $badge_label = 'NEW';
                }

                $all_products[ $pid ] = array(
                    'id'             => $pid,
                    'productId'      => $pid,
                    'slug'           => $wc->get_slug(),
                    'title'          => $wc->get_name(),
                    'brand'          => get_post_meta( $pid, '_maker_name', true ) ?: '',
                    'city'           => get_post_meta( $pid, '_maker_city', true ) ?: '',
                    'price'          => (float) self::convert_shop_price( $reg_price, $fx ),
                    'proPrice'       => $reg_price > 0 ? (float) self::convert_shop_price( round( $reg_price * 0.9, 2 ), $fx ) : null,
                    'originalPrice'  => $sale_price > 0 ? (float) self::convert_shop_price( $reg_price, $fx ) : null,
                    'currency'       => $currency,
                    'currencySymbol' => $currency_symbol,
                    'image'          => $image_id ? wp_get_attachment_image_url( $image_id, 'medium' ) : null,
                    'badge'          => $badge,
                    'badgeLabel'     => $badge_label,
                    'storySlug'      => $post->post_name,
                    'storyTitle'     => $post->post_title,
                    'editorialQuote' => $wc->get_short_description() ?: '',
                );
                $seen_ids[ $pid ] = true;
            }
        }

        $products_list = array_values( $all_products );

        $hero         = ! empty( $products_list ) ? $products_list[0] : null;
        $season_picks = array_slice( $products_list, 1, 4 );
        $grid         = array_slice( $products_list, 5 );

        return rest_ensure_response( array(
            'hero'         => $hero,
            'season_picks' => $season_picks,
            'stories'      => array_slice( $stories, 0, 4 ),
            'grid'         => $grid,
        ) );
    }

    public static function handle_article_products( WP_REST_Request $request ) {
        $slug = sanitize_text_field( $request->get_param( 'slug' ) );

        // Look up the post by slug
        $post = get_page_by_path( $slug, OBJECT, 'post' );
        if ( ! $post ) {
            return rest_ensure_response( array( 'products' => array() ) );
        }

        // Product IDs stored as JSON array in _culture_featured_products post meta
        $raw = get_post_meta( $post->ID, '_culture_featured_products', true );
        $product_ids = $raw ? array_filter( array_map( 'absint', (array) json_decode( $raw, true ) ) ) : array();
        if ( empty( $product_ids ) ) {
            return rest_ensure_response( array( 'products' => array() ) );
        }
        if ( empty( $product_ids ) || ! function_exists( 'wc_get_product' ) ) {
            return rest_ensure_response( array( 'products' => array() ) );
        }

        $products = array();
        foreach ( array_slice( $product_ids, 0, 4 ) as $pid ) {
            $wc = wc_get_product( $pid );
            if ( ! $wc || ! $wc->is_visible() ) continue;

            $image_id  = $wc->get_image_id();
            $image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'medium' ) : '';
            $price_raw = (float) $wc->get_regular_price();

            $products[] = array(
                'id'        => $wc->get_id(),
                'slug'      => $wc->get_slug(),
                'name'      => $wc->get_name(),
                'brand'     => get_post_meta( $pid, '_maker_name', true ) ?: '',
                'price'     => html_entity_decode( strip_tags( wc_price( $price_raw ) ) ),
                'pro_price' => $price_raw > 0
                    ? html_entity_decode( strip_tags( wc_price( $price_raw * 0.9 ) ) )
                    : '',
                'image'     => $image_url ?: '',
            );
        }

        return rest_ensure_response( array( 'products' => $products ) );
    }

    public static function handle_article_related( WP_REST_Request $request ) {
        $slug = sanitize_text_field( $request->get_param( 'slug' ) );

        $post = get_page_by_path( $slug, OBJECT, 'post' );
        if ( ! $post ) {
            return rest_ensure_response( array( 'articles' => array() ) );
        }

        // Use same category to find related
        $terms = wp_get_post_terms( $post->ID, 'category', array( 'fields' => 'ids' ) );
        $args  = array(
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 5,
            'post__not_in'   => array( $post->ID ),
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        );
        if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
            $args['tax_query'] = array(
                array( 'taxonomy' => 'category', 'field' => 'term_id', 'terms' => $terms ),
            );
        }

        $query    = new WP_Query( $args );
        $articles = array();
        foreach ( $query->posts as $p ) {
            $thumb_id = get_post_thumbnail_id( $p->ID );
            $thumb    = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : '';
            $cats     = wp_get_post_terms( $p->ID, 'category', array( 'fields' => 'names' ) );
            $author   = get_the_author_meta( 'display_name', $p->post_author );
            $rt       = (int) get_post_meta( $p->ID, '_reading_time', true );

            $articles[] = array(
                'id'          => $p->ID,
                'slug'        => $p->post_name,
                'title'       => $p->post_title,
                'category'    => ! empty( $cats ) && ! is_wp_error( $cats ) ? $cats[0] : '',
                'author'      => $author,
                'readingTime' => $rt ?: null,
                'image'       => $thumb ?: '',
            );
        }

        return rest_ensure_response( array( 'articles' => $articles ) );
    }
}
