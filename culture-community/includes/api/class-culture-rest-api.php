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

        // Stripe webhook endpoint (public).
        register_rest_route( 'culture/v1', '/stripe-webhook', array(
            'methods'             => 'POST',
            'callback'            => array( 'Culture_Stripe', 'handle_webhook' ),
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
                'name' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                    'default'           => '',
                ),
                'list' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                    'default'           => 'culture-drop',
                ),
                'segment' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                    'default'           => '',
                ),
            ),
        ) );

        // Games subscriber list — separate from the GetMeLit newsletter.
        register_rest_route( 'culture/v1', '/games-subscribe', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_games_subscribe' ),
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

        // Chapter list for the Next.js registration form.
        register_rest_route( 'culture/v1', '/chapters', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_chapters' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Login endpoint — validates WP credentials, returns user profile.
        register_rest_route( 'culture/v1', '/login', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_login' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'username' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'password' => array(
                    'required' => true,
                    'type'     => 'string',
                ),
            ),
        ) );

        // Quote creation (logged-in users).
        register_rest_route( 'culture/v1', '/quotes', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_create_quote' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'text'   => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
                'author' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'source' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        // Quote liking (Next.js server-side).
        register_rest_route( 'culture/v1', '/quotes/like', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_like_quote' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'quote_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'user_id'  => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Quote reporting (Next.js server-side).
        register_rest_route( 'culture/v1', '/quotes/report', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_report_quote' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'quote_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Games — trivia daily cache (same questions for every player each day).
        register_rest_route( 'culture/v1', '/games/trivia-daily', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_trivia_daily' ),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_set_trivia_daily' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'questions' => array( 'required' => true, 'type' => 'array' ),
                ),
            ),
        ) );

        // Quote audit batch — fetch unaudited quotes for the Next.js audit bot.
        register_rest_route( 'culture/v1', '/quotes/audit-batch', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_audit_batch' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'size' => array(
                    'required'          => false,
                    'type'              => 'integer',
                    'default'           => 20,
                    'sanitize_callback' => 'absint',
                ),
            ),
        ) );

        // Quote audit update — write verdict + optional quarantine from audit bot.
        register_rest_route( 'culture/v1', '/quotes/audit-update', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_audit_status' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'post_id'      => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'audit_status' => array( 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_key' ),
                'audit_note'   => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
                'quarantine'   => array( 'required' => false, 'type' => 'boolean', 'default' => false ),
            ),
        ) );

        // Toggle Post Interactions (Like/Bookmark) for articles and quotes.
        register_rest_route( 'culture/v1', '/user/toggle-interaction', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_toggle_interaction' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'type'    => array( 'required' => true, 'type' => 'string' ), // 'like' or 'bookmark'
                'kind'    => array( 'required' => true, 'type' => 'string' ), // 'article' or 'quote'
            ),
        ) );

        // Get all interactions for a user.
        register_rest_route( 'culture/v1', '/user/interactions', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_interactions' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Registration endpoint for the Next.js frontend.
        register_rest_route( 'culture/v1', '/register', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_register' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'username' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_user',
                ),
                'email' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => function( $v ) { return is_email( $v ); },
                ),
                'password' => array(
                    'required' => true,
                    'type'     => 'string',
                ),
                'display_name' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'phone' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'whatsapp' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'tier' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                    'default'           => 'citizen',
                ),
                'primary_chapter' => array(
                    'required'          => false,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                    'default'           => 0,
                ),
                'secondary_chapter' => array(
                    'required'          => false,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                    'default'           => 0,
                ),
                'referral_code' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                ),
                'gender' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'date_of_birth' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'nationality' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'country_of_residence' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'city' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'occupation' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ) );

        // Forgot-password — generates a reset key and emails it.
        register_rest_route( 'culture/v1', '/forgot-password', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_forgot_password' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'email' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_email',
                    'validate_callback' => function( $v ) { return is_email( $v ); },
                ),
            ),
        ) );

        // Reset-password — validates the key and sets the new password.
        register_rest_route( 'culture/v1', '/reset-password', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_reset_password' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'login' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_user',
                ),
                'key' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'password' => array(
                    'required' => true,
                    'type'     => 'string',
                ),
            ),
        ) );

        // Update user profile — requires API key auth.
        register_rest_route( 'culture/v1', '/user/update', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_user_profile' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Get user profile (live data) — requires API key auth.
        register_rest_route( 'culture/v1', '/user/profile', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_user_profile' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // GET/POST culture/v1/user/directory — read or write Connect directory settings
        register_rest_route( 'culture/v1', '/user/directory', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_directory_profile' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'user_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_save_directory_profile' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
        ) );

        // GET culture/v1/members — returns opted-in directory members
        register_rest_route( 'culture/v1', '/members', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_members_directory' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'directory'  => array( 'default' => '0' ),
                'search'     => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
                'discipline' => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
                'location'   => array( 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
                'per_page'   => array( 'default' => 50, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Newsletter preferences — GET returns state, POST updates it. Requires API key.
        register_rest_route( 'culture/v1', '/newsletter-preferences', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_newsletter_preferences' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_update_newsletter_preferences' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
        ) );

        // Directory Entry submission — requires API key auth.
        register_rest_route( 'culture/v1', '/directory/submit', array(
            'methods'             => 'POST',
            'callback'            => array( 'Culture_Directory', 'handle_submit' ),
            'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
        ) );

        // Attach a generated image to a directory entry as its featured image.
        register_rest_route( 'culture/v1', '/directory/attach-image', array(
            'methods'             => 'POST',
            'callback'            => array( 'Culture_Directory', 'handle_attach_image' ),
            'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
        ) );

        // Culture Directory visuals — public, returns media items tagged as directory illustrations.
        register_rest_route( 'culture/v1', '/visuals', array(
            'methods'             => 'GET',
            'callback'            => array( 'Culture_Directory', 'handle_get_visuals' ),
            'permission_callback' => '__return_true',
        ) );

        // Processed seed topics — tracks original topic strings to prevent re-seeding
        // even when Gemini generates the entry with a different title.
        register_rest_route( 'culture/v1', '/directory/processed-topics', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( 'Culture_Directory', 'handle_get_processed_topics' ),
                'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( 'Culture_Directory', 'handle_post_processed_topics' ),
                'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
                'args'                => array(
                    'topics' => array(
                        'required' => true,
                        'type'     => 'array',
                        'items'    => array( 'type' => 'string' ),
                    ),
                ),
            ),
        ) );

        // Extra / AI-generated seed topics store.
        register_rest_route( 'culture/v1', '/directory/extra-topics', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( 'Culture_Directory', 'handle_get_extra_topics' ),
                'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( 'Culture_Directory', 'handle_post_extra_topics' ),
                'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
                'args'                => array(
                    'topics' => array(
                        'required' => true,
                        'type'     => 'array',
                        'items'    => array( 'type' => 'string' ),
                    ),
                ),
            ),
        ) );

        // AI events seeder — create a culture_event post.
        register_rest_route( 'culture/v1', '/events/submit', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_create_event' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Paragraph comments — GET (public) and POST (auth/shared secret).
        register_rest_route( 'culture/v1', '/comments/paragraph', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_paragraph_comments' ),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_post_paragraph_comment' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'post_id'       => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                    'paragraph_idx' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                    'user_id'       => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                    'content'       => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
                ),
            ),
        ) );

        // Award points — requires API key auth.
        register_rest_route( 'culture/v1', '/points/award', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_award_points' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'action'  => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_key' ),
                'post_id' => array( 'required' => false, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Like toggle — any post type (quotes, magazine articles).
        register_rest_route( 'culture/v1', '/content/like', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_toggle_like' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Bookmark toggle — any post type.
        register_rest_route( 'culture/v1', '/content/bookmark', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_toggle_bookmark' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // User saved content — liked and bookmarked posts.
        register_rest_route( 'culture/v1', '/user/saved', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_user_saved' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Track visual download usage (daily limit).
        register_rest_route( 'culture/v1', '/visuals/track-download', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_track_visual_download' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // One-time migration: re-type "community" category posts → culture_post CPT.
        register_rest_route( 'culture/v1', '/admin/migrate-community-posts', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_migrate_community_posts' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Vendor application — authenticated member applies to become a vendor.
        register_rest_route( 'culture/v1', '/vendor/apply', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_vendor_apply' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'     => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'store_name'  => array( 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
                'store_url'   => array( 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_key' ),
                'bio'         => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_textarea_field', 'default' => '' ),
                'country'     => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'category'    => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'instagram'   => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field', 'default' => '' ),
                'website'     => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'esc_url_raw', 'default' => '' ),
            ),
        ) );

        // Initiate membership upgrade for an existing user.
        register_rest_route( 'culture/v1', '/user/upgrade-init', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_upgrade_init' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
    }

    /**
     * Verify the shared API key sent by the Next.js server.
     * Key is stored in WP option 'culture_api_secret'.
     * Next.js sends:  Authorization: Bearer {CULTURE_API_SECRET}
     */
    public static function api_key_permission( $request ) {
        return self::verify_bearer_token( $request->get_header( 'Authorization' ) );
    }

    /**
     * Raw verification of a Bearer token string.
     * Supports both standard 'Authorization' and fallback 'X-Culture-API-Secret' headers.
     *
     * @param string $header The Authorization header string.
     * @return bool
     */
    public static function verify_bearer_token( $header ) {
        $stored = get_option( 'culture_api_secret', '' );
        if ( empty( $stored ) ) {
            return false;
        }

        // 1. Try standard 'Authorization: Bearer ...' header.
        if ( ! empty( $header ) ) {
            $expected = 'Bearer ' . $stored;
            if ( hash_equals( $expected, (string) $header ) ) {
                return true;
            }
        }

        // 2. Try fallback 'X-Culture-API-Secret' header (bypasses server header stripping).
        if ( isset( $_SERVER['HTTP_X_CULTURE_API_SECRET'] ) ) {
            if ( hash_equals( $stored, (string) $_SERVER['HTTP_X_CULTURE_API_SECRET'] ) ) {
                return true;
            }
        }

        return false;
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

        if ( ! $email ) {
            return new WP_Error( 'invalid_email', 'Invalid email address', array( 'status' => 400 ) );
        }

        if ( ! Culture_Newsletter_Queue::verify_unsub_token( $email, $token ) ) {
            return new WP_Error(
                'invalid_token',
                __( 'Invalid or expired unsubscribe link.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $updated     = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
            $sub_email = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
            return strtolower( trim( $sub_email ) ) !== strtolower( $email );
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
     * Stores subscribers as objects: { email, name, date, lists[], segment }.
     * Legacy plain-string entries are preserved and treated as GetMeLit subscribers.
     */
    public static function handle_newsletter_subscribe( $request ) {
        $email   = $request->get_param( 'email' );
        $name    = $request->get_param( 'name' ) ?: '';
        $list    = $request->get_param( 'list' ) ?: 'culture-drop';
        $segment = $request->get_param( 'segment' ) ?: '';

        $allowed_lists = array( 'getmelit', 'culture-drop', 'culture-narratives-digest', 'vendor-letter', 'origins-field-notes' );
        if ( ! in_array( $list, $allowed_lists, true ) ) {
            $list = 'culture-drop';
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );

        // Find existing subscriber (handles both legacy strings and new objects).
        $found_idx = null;
        foreach ( $subscribers as $i => $sub ) {
            $sub_email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
            if ( strtolower( trim( $sub_email ) ) === strtolower( $email ) ) {
                $found_idx = $i;
                break;
            }
        }

        if ( null !== $found_idx ) {
            $existing = $subscribers[ $found_idx ];

            if ( is_array( $existing ) ) {
                // Already an object — add list if not present.
                $lists = $existing['lists'] ?? array();
                if ( ! in_array( $list, $lists, true ) ) {
                    $lists[] = $list;
                    $subscribers[ $found_idx ]['lists'] = $lists;
                    update_option( 'culture_newsletter_subscribers', $subscribers );
                }
            } else {
                // Upgrade legacy plain-string to object, add new list.
                $subscribers[ $found_idx ] = array(
                    'email'   => $email,
                    'name'    => $name,
                    'date'    => current_time( 'mysql' ),
                    'lists'   => array( 'getmelit', $list ),
                    'segment' => $segment,
                );
                update_option( 'culture_newsletter_subscribers', $subscribers );
            }

            return rest_ensure_response( array(
                'success' => true,
                'message' => __( 'You are already subscribed.', 'culture-community' ),
            ) );
        }

        // New subscriber.
        $subscribers[] = array(
            'email'   => $email,
            'name'    => $name,
            'date'    => current_time( 'mysql' ),
            'lists'   => array( $list ),
            'segment' => $segment,
        );
        update_option( 'culture_newsletter_subscribers', $subscribers );

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Subscribed successfully.', 'culture-community' ),
        ) );
    }

    /**
     * POST /culture/v1/games-subscribe
     * Adds an email to the Moveee Games subscriber list (culture_games_subscribers).
     */
    public static function handle_games_subscribe( $request ) {
        $email = $request->get_param( 'email' );

        $subscribers = get_option( 'culture_games_subscribers', array() );

        // Check for existing subscription (handle both plain strings and object records).
        foreach ( $subscribers as $sub ) {
            $existing = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
            if ( strtolower( trim( $existing ) ) === strtolower( $email ) ) {
                return rest_ensure_response( array(
                    'success' => true,
                    'message' => __( 'You are already subscribed to Moveee Games.', 'culture-community' ),
                ) );
            }
        }

        $subscribers[] = array(
            'email' => $email,
            'date'  => current_time( 'mysql' ),
        );
        update_option( 'culture_games_subscribers', $subscribers );

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Subscribed to Moveee Games.', 'culture-community' ),
        ) );
    }

    /**
     * Return list of published chapters for the Next.js registration form.
     *
     * @return WP_REST_Response
     */
    public static function handle_get_chapters( $request ) {
        $posts = get_posts( array(
            'post_type'      => 'culture_chapter',
            'posts_per_page' => -1,
            'orderby'        => 'title',
            'order'          => 'ASC',
            'post_status'    => 'publish',
        ) );

        $chapters = array_map( function( $p ) {
            return array(
                'id'   => $p->ID,
                'name' => $p->post_title,
                'slug' => $p->post_name,
            );
        }, $posts );

        return rest_ensure_response( $chapters );
    }

    /**
     * Authenticate a user via WordPress credentials.
     * Returns a minimal user profile — never the password hash.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_login( $request ) {
        $username = $request->get_param( 'username' );
        $password = $request->get_param( 'password' );

        // wp_authenticate accepts username or email.
        $user = wp_authenticate( $username, $password );

        if ( is_wp_error( $user ) ) {
            return new WP_Error(
                'invalid_credentials',
                __( 'Invalid username or password.', 'culture-community' ),
                array( 'status' => 401 )
            );
        }

        return rest_ensure_response( self::user_profile( $user ) );
    }

    /**
     * Register a new user from the Next.js frontend.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_register( $request ) {
        $username  = $request->get_param( 'username' );
        $email     = $request->get_param( 'email' );
        $password  = $request->get_param( 'password' );
        $display   = $request->get_param( 'display_name' ) ?: $username;
        $phone      = $request->get_param( 'phone' ) ?: '';
        $whatsapp   = $request->get_param( 'whatsapp' ) ?: '';
        $gender     = $request->get_param( 'gender' ) ?: '';
        $dob        = $request->get_param( 'date_of_birth' ) ?: '';
        $nationality= $request->get_param( 'nationality' ) ?: '';
        $country    = $request->get_param( 'country_of_residence' ) ?: '';
        $city       = $request->get_param( 'city' ) ?: '';
        $occupation = $request->get_param( 'occupation' ) ?: '';
        $tier       = $request->get_param( 'tier' ) ?: 'citizen';
        $primary   = (int) $request->get_param( 'primary_chapter' );
        $secondary = (int) $request->get_param( 'secondary_chapter' );
        $referral  = $request->get_param( 'referral_code' ) ?: '';
        $plan_key  = $request->get_param( 'plan_key' ) ?: 'monthly_ngn';

        if ( strlen( $password ) < 8 ) {
            return new WP_Error(
                'weak_password',
                __( 'Password must be at least 8 characters.', 'culture-community' ),
                array( 'status' => 422 )
            );
        }

        if ( ! in_array( $tier, array( 'citizen', 'patron' ), true ) ) {
            $tier = 'citizen';
        }

        if ( 'citizen' === $tier ) {
            $secondary = 0;
        }

        if ( $secondary && $secondary === $primary ) {
            return new WP_Error(
                'chapter_conflict',
                __( 'Secondary chapter must differ from primary.', 'culture-community' ),
                array( 'status' => 422 )
            );
        }

        $user_id = wp_create_user( $username, $password, $email );
        if ( is_wp_error( $user_id ) ) {
            return new WP_Error(
                'registration_failed',
                $user_id->get_error_message(),
                array( 'status' => 422 )
            );
        }

        wp_update_user( array( 'ID' => $user_id, 'display_name' => $display ) );
        update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );

        if ( $phone ) {
            update_user_meta( $user_id, '_culture_phone', $phone );
        }
        if ( $whatsapp ) {
            update_user_meta( $user_id, '_culture_whatsapp', $whatsapp );
        }
        if ( $gender ) {
            update_user_meta( $user_id, '_culture_gender', sanitize_text_field( $gender ) );
        }
        if ( $dob ) {
            update_user_meta( $user_id, '_culture_dob', sanitize_text_field( $dob ) );
        }
        if ( $nationality ) {
            update_user_meta( $user_id, '_culture_nationality', sanitize_text_field( $nationality ) );
        }
        if ( $country ) {
            update_user_meta( $user_id, '_culture_country_of_residence', sanitize_text_field( $country ) );
        }
        if ( $city ) {
            update_user_meta( $user_id, '_culture_city', sanitize_text_field( $city ) );
        }
        if ( $occupation ) {
            update_user_meta( $user_id, '_culture_occupation', sanitize_text_field( $occupation ) );
        }
        if ( $primary ) {
            update_user_meta( $user_id, '_culture_primary_chapter_id', $primary );
        }
        if ( $secondary ) {
            update_user_meta( $user_id, '_culture_secondary_chapter_id', $secondary );
        }

        // Connect Directory — opt-in by default on registration
        $dir_opt_in      = $request->get_param( 'directory_opt_in' ) ?: '1';
        $dir_disciplines = $request->get_param( 'directory_disciplines' ) ?: '';
        $dir_bio         = $request->get_param( 'directory_bio' ) ?: '';

        update_user_meta( $user_id, '_culture_directory_opt_in', $dir_opt_in === '1' ? '1' : '0' );
        if ( $dir_disciplines ) {
            update_user_meta( $user_id, '_culture_directory_disciplines', sanitize_text_field( $dir_disciplines ) );
        }
        if ( $dir_bio ) {
            update_user_meta( $user_id, '_culture_directory_bio', sanitize_textarea_field( $dir_bio ) );
        }

        update_user_meta( $user_id, '_culture_points', 0 );
        update_user_meta( $user_id, '_culture_badges', array() );

        // Process referral if present (cookie/POST not available in REST context,
        // so inject the code directly and call the handler).
        if ( ! empty( $referral ) && class_exists( 'Culture_Referrals' ) ) {
            $_COOKIE['culture_ref'] = $referral;
            Culture_Referrals::process_referral( $user_id );
        }

        // Send welcome email once, now that all metadata is in place.
        if ( class_exists( 'Culture_Emails' ) ) {
            Culture_Emails::send_welcome_email( $user_id );
        }

        $user = get_userdata( $user_id );

        // Patron tier — return Paystack checkout URL so Next.js can redirect.
        if ( 'patron' === $tier ) {
            $checkout_url = '';
            
            // Route to appropriate gateway
            if ( strpos( $plan_key, '_ngn' ) !== false && class_exists( 'Culture_Paystack' ) ) {
                $checkout_url = Culture_Paystack::get_checkout_url( $user_id, $plan_key );
            } elseif ( strpos( $plan_key, '_usd' ) !== false && class_exists( 'Culture_Stripe' ) ) {
                $checkout_url = Culture_Stripe::get_checkout_url( $user_id, $plan_key );
            }

            if ( $checkout_url ) {
                return rest_ensure_response( array_merge(
                    self::user_profile( $user ),
                    array(
                        'requires_payment' => true,
                        'checkout_url'     => $checkout_url,
                    )
                ) );
            }
        }

        return rest_ensure_response( array_merge(
            self::user_profile( $user ),
            array( 'requires_payment' => false )
        ) );
    }

    /**
     * Build a safe user profile array (no password hash, no secrets).
     * Includes all KYC fields and gamification data.
     *
     * @param WP_User $user
     * @return array
     */
    private static function user_profile( $user ) {
        $primary_id   = (int) get_user_meta( $user->ID, '_culture_primary_chapter_id', true );
        $secondary_id = (int) get_user_meta( $user->ID, '_culture_secondary_chapter_id', true );

        $primary_name   = $primary_id   ? get_the_title( $primary_id )   : '';
        $secondary_name = $secondary_id ? get_the_title( $secondary_id ) : '';

        $referral_code  = get_user_meta( $user->ID, '_culture_referral_code', true ) ?: '';
        $referral_count = 0;
        if ( $referral_code && class_exists( 'Culture_Referrals' ) ) {
            $referral_count = Culture_Referrals::get_referral_count( $user->ID );
        }

        // WP super-admins and admins always get patron access on the frontend
        // so they're never blocked by tier-gated features.
        $stored_tier = get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen';
        $tier = ( is_super_admin( $user->ID ) || user_can( $user, 'manage_options' ) )
            ? 'patron'
            : $stored_tier;

        // Vendor status — check WCFM vendor roles.
        $vendor_roles = array( 'wcfm_vendor', 'seller', 'vendor', 'wcfm_affiliate' );
        $is_vendor    = (bool) array_intersect( $vendor_roles, (array) $user->roles )
                        || (bool) get_user_meta( $user->ID, '_wcfm_vendor_data', true );
        $vendor_slug  = $is_vendor ? $user->user_nicename : '';

        return array(
            // Core identity
            'id'                  => $user->ID,
            'username'            => $user->user_login,
            'email'               => $user->user_email,
            'display_name'        => $user->display_name,
            // Contact
            'phone'               => get_user_meta( $user->ID, '_culture_phone', true ) ?: '',
            'whatsapp'            => get_user_meta( $user->ID, '_culture_whatsapp', true ) ?: '',
            // KYC
            'gender'              => get_user_meta( $user->ID, '_culture_gender', true ) ?: '',
            'date_of_birth'       => get_user_meta( $user->ID, '_culture_dob', true ) ?: '',
            'nationality'         => get_user_meta( $user->ID, '_culture_nationality', true ) ?: '',
            'country_of_residence'=> get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
            'city'                => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
            'occupation'          => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
            // Membership
            'tier'                => $tier,
            'primary_chapter'     => array( 'id' => $primary_id, 'name' => $primary_name ),
            'secondary_chapter'   => array( 'id' => $secondary_id, 'name' => $secondary_name ),
            // Gamification
            'points'              => (int) get_user_meta( $user->ID, '_culture_points', true ),
            'badges'              => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $user->ID ) : array(),
            'referral_code'       => $referral_code,
            'referral_count'      => $referral_count,
            'visual_downloads_today' => self::get_daily_visual_downloads( $user->ID ),
            // Vendor
            'is_vendor'           => $is_vendor,
            'vendor_slug'         => $vendor_slug,
        );
    }

    /**
     * Update writable profile fields for the authenticated user.
     * Accepts: display_name, phone, whatsapp, gender, date_of_birth,
     *          nationality, country_of_residence, city, occupation.
     * Email changes are intentionally excluded — they require a separate
     * confirmation flow to avoid account takeover.
     */
    public static function handle_update_user_profile( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! $user_id ) {
            return new WP_Error( 'missing_user_id', 'user_id is required.', array( 'status' => 400 ) );
        }

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $wp_update = array( 'ID' => $user_id );

        if ( $request->has_param( 'display_name' ) ) {
            $name = sanitize_text_field( $request->get_param( 'display_name' ) );
            if ( $name ) $wp_update['display_name'] = $name;
        }

        if ( count( $wp_update ) > 1 ) {
            $result = wp_update_user( $wp_update );
            if ( is_wp_error( $result ) ) {
                return new WP_Error( 'update_failed', $result->get_error_message(), array( 'status' => 422 ) );
            }
        }

        // Meta fields
        $meta_map = array(
            'phone'                  => '_culture_phone',
            'whatsapp'               => '_culture_whatsapp',
            'gender'                 => '_culture_gender',
            'date_of_birth'          => '_culture_dob',
            'nationality'            => '_culture_nationality',
            'country_of_residence'   => '_culture_country_of_residence',
            'city'                   => '_culture_city',
            'occupation'             => '_culture_occupation',
            // Connect Directory
            'directory_disciplines'  => '_culture_directory_disciplines',
            'directory_instagram'    => '_culture_directory_instagram',
            'directory_linkedin'     => '_culture_directory_linkedin',
            'directory_website'      => '_culture_directory_website',
        );

        foreach ( $meta_map as $param => $meta_key ) {
            if ( $request->has_param( $param ) ) {
                update_user_meta( $user_id, $meta_key, sanitize_text_field( $request->get_param( $param ) ) );
            }
        }

        // Bio allows newlines — use textarea sanitization
        if ( $request->has_param( 'directory_bio' ) ) {
            update_user_meta( $user_id, '_culture_directory_bio', sanitize_textarea_field( $request->get_param( 'directory_bio' ) ) );
        }

        // directory_opt_in is boolean — store as '1' or '0'
        if ( $request->has_param( 'directory_opt_in' ) ) {
            $opt_in_val = $request->get_param( 'directory_opt_in' );
            update_user_meta( $user_id, '_culture_directory_opt_in', ( $opt_in_val === '1' || $opt_in_val === true ) ? '1' : '0' );
        }

        // Chapter updates — validate the chapter ID is a published culture_chapter post.
        if ( $request->has_param( 'primary_chapter' ) ) {
            $primary_id = absint( $request->get_param( 'primary_chapter' ) );
            if ( $primary_id ) {
                $chapter = get_post( $primary_id );
                if ( $chapter && $chapter->post_type === 'culture_chapter' && $chapter->post_status === 'publish' ) {
                    update_user_meta( $user_id, '_culture_primary_chapter_id', $primary_id );
                }
            } else {
                delete_user_meta( $user_id, '_culture_primary_chapter_id' );
            }
        }

        if ( $request->has_param( 'secondary_chapter' ) ) {
            $secondary_id = absint( $request->get_param( 'secondary_chapter' ) );
            $tier = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';
            if ( $tier === 'patron' && $secondary_id ) {
                $chapter = get_post( $secondary_id );
                if ( $chapter && $chapter->post_type === 'culture_chapter' && $chapter->post_status === 'publish' ) {
                    $primary_id_current = (int) get_user_meta( $user_id, '_culture_primary_chapter_id', true );
                    if ( $secondary_id !== $primary_id_current ) {
                        update_user_meta( $user_id, '_culture_secondary_chapter_id', $secondary_id );
                    }
                }
            } else {
                delete_user_meta( $user_id, '_culture_secondary_chapter_id' );
            }
        }

        $updated_user = get_userdata( $user_id );
        return rest_ensure_response( self::user_profile( $updated_user ) );
    }

    /**
     * GET /culture/v1/newsletter-preferences
     * Returns per-newsletter subscription state for the given email address.
     * State is stored in user meta '_culture_newsletter_prefs' as an assoc array.
     */
    public static function handle_get_newsletter_preferences( $request ) {
        $email = sanitize_email( $request->get_param( 'email' ) );
        if ( ! is_email( $email ) ) {
            return new WP_Error( 'invalid_email', 'A valid email is required.', array( 'status' => 400 ) );
        }

        $user  = get_user_by( 'email', $email );
        $prefs = array(
            'cultural-digest' => true,
            'getmelit'        => true,
            'culture-drop'    => true,
            'events'          => true,
        );

        if ( $user ) {
            $stored = get_user_meta( $user->ID, '_culture_newsletter_prefs', true );
            if ( is_array( $stored ) ) {
                $prefs = array_merge( $prefs, $stored );
            }
        }

        return rest_ensure_response( array( 'subscriptions' => $prefs ) );
    }

    /**
     * POST /culture/v1/newsletter-preferences
     * Saves per-newsletter subscription state for a user.
     * Body: { email, subscriptions: { 'cultural-digest': bool, ... } }
     */
    public static function handle_update_newsletter_preferences( $request ) {
        $email = sanitize_email( $request->get_param( 'email' ) );
        if ( ! is_email( $email ) ) {
            return new WP_Error( 'invalid_email', 'A valid email is required.', array( 'status' => 400 ) );
        }

        $subs = $request->get_param( 'subscriptions' );
        if ( ! is_array( $subs ) ) {
            return new WP_Error( 'invalid_subs', 'subscriptions must be an object.', array( 'status' => 400 ) );
        }

        $allowed = array( 'cultural-digest', 'getmelit', 'culture-drop', 'events' );
        $clean   = array();
        foreach ( $allowed as $key ) {
            if ( isset( $subs[ $key ] ) ) {
                $clean[ $key ] = (bool) $subs[ $key ];
            }
        }

        $user = get_user_by( 'email', $email );
        if ( $user ) {
            update_user_meta( $user->ID, '_culture_newsletter_prefs', $clean );

            // Mirror to global subscriber list based on 'cultural-digest' state.
            $subscribers = get_option( 'culture_newsletter_subscribers', array() );
            $in_list     = false;
            foreach ( $subscribers as $sub ) {
                $sub_email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
                if ( strtolower( $sub_email ) === strtolower( $email ) ) {
                    $in_list = true;
                    break;
                }
            }

            $wants_main = $clean['cultural-digest'] ?? true;

            if ( $wants_main && ! $in_list ) {
                $subscribers[] = array(
                    'email'    => $email,
                    'name'     => $user->display_name,
                    'location' => '',
                    'date'     => current_time( 'mysql' ),
                );
                update_option( 'culture_newsletter_subscribers', $subscribers );
            } elseif ( ! $wants_main && $in_list ) {
                $subscribers = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
                    $sub_email = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
                    return strtolower( trim( $sub_email ) ) !== strtolower( $email );
                } ) );
                update_option( 'culture_newsletter_subscribers', $subscribers );
            }
        }

        return rest_ensure_response( array( 'success' => true, 'subscriptions' => $clean ) );
    }

    /**
     * Send a password-reset email.
     * Never reveals whether the email exists to avoid user enumeration.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function handle_forgot_password( $request ) {
        $email = $request->get_param( 'email' );
        $user  = get_user_by( 'email', $email );

        // Always respond with success to prevent user-enumeration attacks.
        if ( ! $user ) {
            return rest_ensure_response( array( 'success' => true ) );
        }

        $key = get_password_reset_key( $user );
        if ( is_wp_error( $key ) ) {
            return rest_ensure_response( array( 'success' => true ) );
        }

        $frontend_url = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
        $reset_url    = $frontend_url
            . '/reset-password?key=' . rawurlencode( $key )
            . '&login='              . rawurlencode( $user->user_login );

        $site_name = get_bloginfo( 'name' );
        $subject   = sprintf( __( 'Reset your password — %s', 'culture-community' ), $site_name );
        $message   = sprintf(
            /* translators: 1: display name, 2: site name, 3: reset URL */
            __( "Hi %1\$s,\n\nSomeone requested a password reset for your account on %2\$s. If this was you, click the link below:\n\n%3\$s\n\nThis link expires in 24 hours. If you did not request a reset, you can safely ignore this email.\n\n— %2\$s", 'culture-community' ),
            $user->display_name,
            $site_name,
            $reset_url
        );

        wp_mail( $user->user_email, $subject, $message );

        return rest_ensure_response( array( 'success' => true ) );
    }

    /**
     * Validate a password-reset key and set a new password.
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_reset_password( $request ) {
        $login    = $request->get_param( 'login' );
        $key      = $request->get_param( 'key' );
        $password = $request->get_param( 'password' );

        if ( strlen( $password ) < 8 ) {
            return new WP_Error(
                'weak_password',
                __( 'Password must be at least 8 characters.', 'culture-community' ),
                array( 'status' => 422 )
            );
        }

        $user = check_password_reset_key( $key, $login );
        if ( is_wp_error( $user ) ) {
            return new WP_Error(
                'invalid_key',
                __( 'This reset link has expired or is invalid. Please request a new one.', 'culture-community' ),
                array( 'status' => 400 )
            );
        }

        reset_password( $user, $password );

        return rest_ensure_response( array(
            'success' => true,
            'message' => __( 'Password updated. You can now sign in.', 'culture-community' ),
        ) );
    }

    /**
     * Permission check: user must be logged in.
     */
    public static function user_permission( $request ) {
        return is_user_logged_in();
    }

    /**
     * Handle creating a new quote.
     */
    public static function handle_create_quote( $request ) {
        $text    = $request->get_param( 'text' );
        $author  = $request->get_param( 'author' );
        $source  = $request->get_param( 'source' );
        
        // If user_id is passed and we're authenticated via API key, use it.
        // Otherwise, fallback to the logged-in session user.
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! $user_id ) {
            $user_id = get_current_user_id();
        }

        // Duplicate detection: compare normalised content hash.
        $hash = md5( strtolower( trim( wp_strip_all_tags( $text ) ) ) );
        $existing = get_posts( array(
            'post_type'      => 'culture_quote',
            'post_status'    => array( 'publish', 'pending' ),
            'posts_per_page' => 1,
            'meta_query'     => array(
                array(
                    'key'     => '_quote_content_hash',
                    'value'   => $hash,
                    'compare' => '=',
                ),
            ),
        ) );

        if ( ! empty( $existing ) ) {
            return new WP_Error(
                'duplicate_quote',
                'This quote already exists in the archive.',
                array( 'status' => 409 )
            );
        }

        // Create the post.
        $post_id = wp_insert_post( array(
            'post_title'   => wp_trim_words( $text, 10 ),
            'post_content' => $text,
            'post_status'  => 'publish',
            'post_type'    => 'culture_quote',
            'post_author'  => $user_id,
        ) );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        // Set author taxonomy.
        wp_set_object_terms( $post_id, $author, 'culture_quote_author' );

        // Set meta.
        update_post_meta( $post_id, '_quote_source', $source );
        update_post_meta( $post_id, '_quote_user_id', $user_id );
        update_post_meta( $post_id, '_quote_likes', 0 );
        update_post_meta( $post_id, '_quote_reports', 0 );
        update_post_meta( $post_id, '_quote_content_hash', $hash );
        update_post_meta( $post_id, '_culture_like_count', 0 );

        // Award points.
        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'quote_submission' );
        }

        return rest_ensure_response( array(
            'success' => true,
            'id'      => $post_id,
            'message' => __( 'Quote published successfully.', 'culture-community' ),
        ) );
    }

    /**
     * Handle liking a quote.
     */
    public static function handle_like_quote( $request ) {
        $quote_id = (int) $request->get_param( 'quote_id' );
        $user_id  = (int) $request->get_param( 'user_id' );

        // Track user-specific like to prevent double-point awarding.
        $liked_quotes = get_user_meta( $user_id, '_liked_quote_ids', true );
        if ( ! is_array( $liked_quotes ) ) {
            $liked_quotes = array();
        }

        $active = false;
        $index = array_search( $quote_id, $liked_quotes );

        if ( false !== $index ) {
            unset( $liked_quotes[ $index ] );
            $liked_quotes = array_values( $liked_quotes );
        } else {
            $liked_quotes[] = $quote_id;
            $active = true;

            // Award points for Liking a quote.
            if ( class_exists( 'Culture_Gamification' ) ) {
                Culture_Gamification::award_points( $user_id, 'quote_like' );
            }
        }

        update_user_meta( $user_id, '_liked_quote_ids', $liked_quotes );

        // Update global count.
        $likes = (int) get_post_meta( $quote_id, '_quote_likes', true );
        $new_likes = $active ? $likes + 1 : max( 0, $likes - 1 );
        update_post_meta( $quote_id, '_quote_likes', $new_likes );

        return rest_ensure_response( array(
            'success' => true,
            'active'  => $active,
            'likes'   => $new_likes
        ) );
    }

    /**
     * Handle reporting a quote.
     */
    public static function handle_report_quote( $request ) {
        $quote_id = (int) $request->get_param( 'quote_id' );

        $quote = get_post( $quote_id );
        if ( ! $quote || 'culture_quote' !== $quote->post_type ) {
            return new WP_Error( 'invalid_quote', 'Quote not found.', array( 'status' => 404 ) );
        }

        // Increment reports.
        $reports = (int) get_post_meta( $quote_id, '_quote_reports', true ) + 1;
        update_post_meta( $quote_id, '_quote_reports', $reports );

        // Hide if threshold met (e.g. 10 reports).
        if ( $reports >= 10 ) {
            wp_update_post( array(
                'ID'          => $quote_id,
                'post_status' => 'pending',
            ) );
        }

        return rest_ensure_response( array(
            'success' => true,
            'message' => 'Quote reported.',
        ) );
    }

    /**
     * GET /culture/v1/games/trivia-daily
     * Returns today's cached trivia questions, or 404 if not generated yet.
     */
    public static function handle_get_trivia_daily( $request ) {
        $date   = gmdate( 'Y-m-d' );
        $cached = get_option( 'culture_games_trivia_' . $date, null );

        if ( null === $cached || ! is_array( $cached ) ) {
            return new WP_Error( 'not_found', 'No trivia cached for today.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( array( 'date' => $date, 'questions' => $cached ) );
    }

    /**
     * POST /culture/v1/games/trivia-daily
     * Stores today's trivia questions (called by the Next.js API route after
     * Gemini generation). Cleans up the previous day's option automatically.
     */
    public static function handle_set_trivia_daily( $request ) {
        $questions = $request->get_param( 'questions' );

        if ( ! is_array( $questions ) || empty( $questions ) ) {
            return new WP_Error( 'invalid', 'questions must be a non-empty array.', array( 'status' => 400 ) );
        }

        $date      = gmdate( 'Y-m-d' );
        $yesterday = gmdate( 'Y-m-d', strtotime( '-1 day' ) );

        update_option( 'culture_games_trivia_' . $date,      $questions, false );
        delete_option( 'culture_games_trivia_' . $yesterday );

        return rest_ensure_response( array( 'success' => true, 'date' => $date ) );
    }

    /**
     * GET /culture/v1/quotes/audit-batch?size=N
     * Returns up to N unaudited culture_quote posts for the audit bot.
     * A quote is "unaudited" when it has no _quote_audit_status meta at all.
     */
    public static function handle_get_audit_batch( $request ) {
        $size = min( absint( $request->get_param( 'size' ) ) ?: 20, 50 );

        $posts = get_posts( array(
            'post_type'      => 'culture_quote',
            'post_status'    => array( 'publish', 'pending' ),
            'posts_per_page' => $size,
            'meta_query'     => array(
                array(
                    'key'     => '_quote_audit_status',
                    'compare' => 'NOT EXISTS',
                ),
            ),
        ) );

        $quotes = array_map( function( $p ) {
            $terms  = wp_get_object_terms( $p->ID, 'culture_quote_author' );
            $author = ! empty( $terms ) ? $terms[0]->name : '';
            return array(
                'id'     => $p->ID,
                'text'   => $p->post_content ?: $p->post_title,
                'author' => $author,
                'source' => get_post_meta( $p->ID, '_quote_source', true ) ?: '',
            );
        }, $posts );

        return rest_ensure_response( array(
            'quotes' => $quotes,
            'total'  => count( $quotes ),
        ) );
    }

    /**
     * POST /culture/v1/quotes/audit-update
     * Writes audit verdict meta to a culture_quote post.
     * Optionally moves suspicious/fabricated quotes to draft (quarantine).
     */
    public static function handle_update_audit_status( $request ) {
        $post_id    = (int) $request->get_param( 'post_id' );
        $status     = $request->get_param( 'audit_status' );
        $note       = $request->get_param( 'audit_note' ) ?: '';
        $quarantine = (bool) $request->get_param( 'quarantine' );

        $allowed = array( 'verified', 'suspicious', 'likely-fabricated', 'unverifiable' );
        if ( ! in_array( $status, $allowed, true ) ) {
            return new WP_Error(
                'invalid_status',
                'audit_status must be one of: ' . implode( ', ', $allowed ),
                array( 'status' => 400 )
            );
        }

        $post = get_post( $post_id );
        if ( ! $post || 'culture_quote' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Quote not found.', array( 'status' => 404 ) );
        }

        update_post_meta( $post_id, '_quote_audit_status', $status );
        update_post_meta( $post_id, '_quote_audit_note',   $note );
        update_post_meta( $post_id, '_quote_audit_date',   gmdate( 'Y-m-d H:i:s' ) );

        $quarantined = false;
        if ( $quarantine && in_array( $status, array( 'likely-fabricated', 'suspicious' ), true ) ) {
            wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
            $quarantined = true;
        }

        return rest_ensure_response( array(
            'success'     => true,
            'post_id'     => $post_id,
            'status'      => $status,
            'quarantined' => $quarantined,
        ) );
    }

    /**
     * POST /culture/v1/user/toggle-interaction
     */
    public static function handle_toggle_interaction( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );
        $type    = $request->get_param( 'type' ); // 'like' or 'bookmark'
        $kind    = $request->get_param( 'kind' ); // 'article' or 'quote'

        // ── Per-kind user list (drives isLiked / isBookmarked state) ─────────
        $meta_key = "_culture_" . $type . "_" . $kind . "_ids";
        $ids = get_user_meta( $user_id, $meta_key, true );
        if ( ! is_array( $ids ) ) { $ids = array(); }

        $index  = array_search( $post_id, $ids );
        $active = false;

        if ( false !== $index ) {
            unset( $ids[ $index ] );
            $ids = array_values( $ids );
        } else {
            $ids[] = $post_id;
            $active = true;
        }

        update_user_meta( $user_id, $meta_key, $ids );

        // ── Sync unified "saved" lists (drives /member/collection page) ──────
        $unified_key  = ( 'like' === $type ) ? '_culture_liked_posts' : '_culture_bookmarked_posts';
        $unified_ids  = get_user_meta( $user_id, $unified_key, true );
        if ( ! is_array( $unified_ids ) ) { $unified_ids = array(); }
        $u_idx = array_search( $post_id, $unified_ids );
        if ( $active && false === $u_idx ) {
            $unified_ids[] = $post_id;
        } elseif ( ! $active && false !== $u_idx ) {
            unset( $unified_ids[ $u_idx ] );
            $unified_ids = array_values( $unified_ids );
        }
        update_user_meta( $user_id, $unified_key, $unified_ids );

        // ── Update post-level like count (drives public like display) ────────
        $post_like_count = 0;
        if ( 'like' === $type ) {
            $post_like_count = max( 0, (int) get_post_meta( $post_id, '_culture_like_count', true ) );
            $post_like_count = $active ? $post_like_count + 1 : max( 0, $post_like_count - 1 );
            update_post_meta( $post_id, '_culture_like_count', $post_like_count );

            // Quotes: keep _quote_likes in sync (read by WPGraphQL as quoteLikes)
            if ( 'quote' === $kind ) {
                update_post_meta( $post_id, '_quote_likes', $post_like_count );
                // Award points to the quote's original submitter
                if ( $active && class_exists( 'Culture_Gamification' ) ) {
                    $submitter_id = (int) get_post_meta( $post_id, '_quote_user_id', true );
                    if ( $submitter_id && $submitter_id !== $user_id ) {
                        Culture_Gamification::award_points( $submitter_id, 'quote_like' );
                    }
                }
            }

            // Award magazine-engagement points for liking an article
            if ( $active && 'article' === $kind && class_exists( 'Culture_Gamification' ) ) {
                Culture_Gamification::award_points( $user_id, 'magazine_like' );
            }
        }

        return rest_ensure_response( array(
            'success' => true,
            'active'  => $active,
            'count'   => $post_like_count, // post-level like count for display
        ) );
    }

    /**
     * GET /culture/v1/user/interactions
     */
    public static function handle_get_interactions( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        
        return rest_ensure_response( array(
            'liked_articles'      => get_user_meta( $user_id, '_culture_like_article_ids', true ) ?: array(),
            'bookmarked_articles' => get_user_meta( $user_id, '_culture_bookmark_article_ids', true ) ?: array(),
            'liked_quotes'        => get_user_meta( $user_id, '_culture_like_quote_ids', true ) ?: array(),
            'bookmarked_quotes'   => get_user_meta( $user_id, '_culture_bookmark_quote_ids', true ) ?: array(),
        ) );
    }

    /**
     * GET /culture/v1/comments/paragraph?post_id=X
     * Returns comments grouped by paragraph index.
     */
    public static function handle_get_paragraph_comments( $request ) {
        $post_id = $request->get_param( 'post_id' );
        
        $comments = get_comments( array(
            'post_id' => $post_id,
            'status'  => 'approve',
            'orderby' => 'comment_date',
            'order'   => 'ASC',
        ) );

        $partitioned = array();
        foreach ( $comments as $comment ) {
            $idx = get_comment_meta( $comment->comment_ID, '_culture_paragraph_idx', true );
            if ( '' === $idx ) continue;
            
            $idx = (int) $idx;
            if ( ! isset( $partitioned[ $idx ] ) ) {
                $partitioned[ $idx ] = array();
            }

            $partitioned[ $idx ][] = array(
                'id'      => $comment->comment_ID,
                'author'  => $comment->comment_author,
                'content' => wpautop( $comment->comment_content ),
                'date'    => $comment->comment_date,
            );
        }

        return rest_ensure_response( $partitioned );
    }

    /**
     * POST /culture/v1/comments/paragraph
     * Insert a new comment for a specific paragraph.
     */
    public static function handle_post_paragraph_comment( $request ) {
        $post_id       = (int) $request->get_param( 'post_id' );
        $paragraph_idx = (int) $request->get_param( 'paragraph_idx' );
        $user_id       = (int) $request->get_param( 'user_id' );
        $content       = $request->get_param( 'content' );

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'invalid_user', 'User not found.', array( 'status' => 404 ) );
        }

        $comment_id = wp_insert_comment( array(
            'comment_post_ID'      => $post_id,
            'comment_author'       => $user->display_name,
            'comment_author_email' => $user->user_email,
            'comment_content'      => $content,
            'user_id'              => $user_id,
            'comment_approved'     => 1,
        ) );

        if ( ! $comment_id ) {
            return new WP_Error( 'save_failed', 'Could not save comment.', array( 'status' => 500 ) );
        }

        update_comment_meta( $comment_id, '_culture_paragraph_idx', $paragraph_idx );
        
        // Award points.
        if ( class_exists( 'Culture_Gamification' ) ) {
            $post_type = get_post_type( $post_id );
            $action = ( 'culture_newsletter' === $post_type ) ? 'newsletter_comment' : 'magazine_comment';
            Culture_Gamification::award_points( $user_id, $action );
        }

        return rest_ensure_response( array(
            'success' => true,
            'comment' => array(
                'id'      => $comment_id,
                'author'  => $user->display_name,
                'content' => wpautop( $content ),
                'date'    => current_time( 'mysql' ),
            ),
        ) );
    }

    /**
     * POST /culture/v1/points/award
     * Award points for a specific action (read, share, etc).
     */
    public static function handle_award_points( $request ) {
        $user_id = $request->get_param( 'user_id' );
        $action  = $request->get_param( 'action' );
        $post_id = $request->get_param( 'post_id' );

        if ( ! class_exists( 'Culture_Gamification' ) ) {
            return new WP_Error( 'internal_error', 'Gamification system missing.', array( 'status' => 500 ) );
        }

        // Prevent double-awarding for read/share actions on the same post.
        if ( $post_id && in_array( $action, array( 'magazine_read', 'magazine_share' ), true ) ) {
            $meta_key = "_culture_{$action}_{$post_id}";
            $awarded = get_user_meta( $user_id, $meta_key, true );
            if ( $awarded ) {
                return rest_ensure_response( array( 'success' => false, 'message' => 'Already awarded.' ) );
            }
            update_user_meta( $user_id, $meta_key, true );

            // Increment separate counters for badge tracking.
            if ( 'magazine_read' === $action ) {
                $count = (int) get_user_meta( $user_id, '_magazine_read_count', true ) + 1;
                update_user_meta( $user_id, '_magazine_read_count', $count );
            } elseif ( 'magazine_share' === $action ) {
                $count = (int) get_user_meta( $user_id, '_magazine_share_count', true ) + 1;
                update_user_meta( $user_id, '_magazine_share_count', $count );
            }
        }

        $new_total = Culture_Gamification::award_points( $user_id, $action );

        return rest_ensure_response( array(
            'success'   => true,
            'points'    => $new_total,
            'awarded'   => Culture_Gamification::get_point_value( $action ),
            'new_badges' => array(), // Logic for detecting newly awarded badges could go here if needed.
        ) );
    }

    /**
     * POST /culture/v1/content/like
     * Toggles a like on any post for a user. Tracks user→post association so
     * a single user can only like once, and can un-like. Returns new like count
     * and whether the post is now liked.
     */
    public static function handle_toggle_like( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );

        $post = get_post( $post_id );
        if ( ! $post || ! in_array( $post->post_status, array( 'publish' ), true ) ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );
        $already_liked = in_array( $post_id, $liked_ids, true );

        if ( $already_liked ) {
            // Unlike — remove from list, decrement count.
            $liked_ids = array_values( array_diff( $liked_ids, array( $post_id ) ) );
            $new_count = max( 0, (int) get_post_meta( $post_id, '_culture_like_count', true ) - 1 );
            if ( 'culture_quote' === $post->post_type ) {
                update_post_meta( $post_id, '_quote_likes', max( 0, (int) get_post_meta( $post_id, '_quote_likes', true ) - 1 ) );
            }
        } else {
            // Like — add to list, increment count, award points to creator.
            $liked_ids[] = $post_id;
            $new_count   = (int) get_post_meta( $post_id, '_culture_like_count', true ) + 1;
            if ( 'culture_quote' === $post->post_type ) {
                update_post_meta( $post_id, '_quote_likes', (int) get_post_meta( $post_id, '_quote_likes', true ) + 1 );
                $submitter_id = (int) get_post_meta( $post_id, '_quote_user_id', true );
                if ( $submitter_id && $submitter_id !== $user_id && class_exists( 'Culture_Gamification' ) ) {
                    Culture_Gamification::award_points( $submitter_id, 'quote_like' );
                }
            }
        }

        update_user_meta( $user_id, '_culture_liked_posts', $liked_ids );
        update_post_meta( $post_id, '_culture_like_count', $new_count );

        return rest_ensure_response( array(
            'success' => true,
            'liked'   => ! $already_liked,
            'count'   => $new_count,
        ) );
    }

    /**
     * POST /culture/v1/content/bookmark
     * Toggles a bookmark (private save) on any post for a user.
     */
    public static function handle_toggle_bookmark( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );

        $post = get_post( $post_id );
        if ( ! $post || ! in_array( $post->post_status, array( 'publish' ), true ) ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $bookmarked_ids     = (array) get_user_meta( $user_id, '_culture_bookmarked_posts', true );
        $already_bookmarked = in_array( $post_id, $bookmarked_ids, true );

        if ( $already_bookmarked ) {
            $bookmarked_ids = array_values( array_diff( $bookmarked_ids, array( $post_id ) ) );
        } else {
            $bookmarked_ids[] = $post_id;
        }

        update_user_meta( $user_id, '_culture_bookmarked_posts', $bookmarked_ids );

        return rest_ensure_response( array(
            'success'    => true,
            'bookmarked' => ! $already_bookmarked,
        ) );
    }

    /**
     * GET /culture/v1/user/saved?user_id=X
     * Returns the user's liked and bookmarked posts with basic data,
     * plus the raw ID lists so the frontend can check state instantly.
     */
    public static function handle_get_user_saved( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );

        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        /**
         * Merge all like/bookmark sources so that interactions recorded before
         * and after plugin updates all appear in the collection.
         *
         * Sources:
         *   _culture_liked_posts          – unified list written by current toggle-interaction
         *   _culture_like_quote_ids       – per-kind list from original PR toggle code
         *   _culture_like_article_ids     – per-kind list from original PR toggle code
         */
        $safe_intval_array = function( $meta_key ) use ( $user_id ) {
            $raw = get_user_meta( $user_id, $meta_key, true );
            if ( ! is_array( $raw ) ) { return array(); }
            return array_values( array_filter( array_map( 'intval', $raw ) ) );
        };

        $liked_ids = array_unique( array_merge(
            $safe_intval_array( '_culture_liked_posts' ),
            $safe_intval_array( '_culture_like_quote_ids' ),
            $safe_intval_array( '_culture_like_article_ids' )
        ) );

        $bookmarked_ids = array_unique( array_merge(
            $safe_intval_array( '_culture_bookmarked_posts' ),
            $safe_intval_array( '_culture_bookmark_quote_ids' ),
            $safe_intval_array( '_culture_bookmark_article_ids' )
        ) );

        $liked      = array();
        $bookmarked = array();

        if ( ! empty( $liked_ids ) ) {
            $posts = get_posts( array(
                'post__in'       => $liked_ids,
                'post_type'      => array( 'post', 'culture_quote' ),
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'orderby'        => 'post__in',
            ) );
            foreach ( $posts as $p ) {
                $liked[] = self::saved_post_summary( $p );
            }
        }

        if ( ! empty( $bookmarked_ids ) ) {
            $posts = get_posts( array(
                'post__in'       => $bookmarked_ids,
                'post_type'      => array( 'post', 'culture_quote' ),
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'orderby'        => 'post__in',
            ) );
            foreach ( $posts as $p ) {
                $bookmarked[] = self::saved_post_summary( $p );
            }
        }

        return rest_ensure_response( array(
            'liked'          => $liked,
            'bookmarked'     => $bookmarked,
            'liked_ids'      => $liked_ids,
            'bookmarked_ids' => $bookmarked_ids,
        ) );
    }

    /**
     * POST /culture/v1/visuals/track-download
     * Increments the daily download count for a user.
     */
    public static function handle_track_visual_download( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $today = current_time( 'Y-m-d' );
        $meta  = get_user_meta( $user_id, '_culture_visual_downloads', true );
        $tier  = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';

        // Unlimited Tiers: patron, leader, admin (WordPress role check as fallback)
        $is_unlimited = in_array( $tier, array( 'patron', 'leader' ) ) || user_can( $user_id, 'manage_options' );

        if ( ! is_array( $meta ) || ! isset( $meta['date'] ) || $meta['date'] !== $today ) {
            $meta = array( 'date' => $today, 'count' => 1 );
        } else {
            // Check limit for non-unlimited users
            if ( ! $is_unlimited && $meta['count'] >= 5 ) {
                return new WP_Error( 'limit_reached', 'Daily download limit reached.', array( 'status' => 403 ) );
            }
            $meta['count']++;
        }

        update_user_meta( $user_id, '_culture_visual_downloads', $meta );

        return rest_ensure_response( array(
            'success' => true,
            'count'   => $meta['count'],
            'date'    => $meta['date'],
        ) );
    }

    /**
     * Helper to get the current daily download count.
     */
    private static function get_daily_visual_downloads( $user_id ) {
        $today = current_time( 'Y-m-d' );
        $meta  = get_user_meta( $user_id, '_culture_visual_downloads', true );

        if ( is_array( $meta ) && isset( $meta['date'] ) && $meta['date'] === $today ) {
            return (int) $meta['count'];
        }

        return 0;
    }

    /** Build a minimal summary for a saved post. */
    private static function saved_post_summary( $post ) {
        $is_quote = ( 'culture_quote' === $post->post_type );
        return array(
            'id'      => $post->ID,
            'type'    => $is_quote ? 'quote' : 'article',
            'title'   => $post->post_title,
            'slug'    => $post->post_name,
            'url'     => $is_quote
                ? '/quotes/' . $post->ID . '-' . $post->post_name
                : '/magazine/' . $post->post_name,
            'excerpt' => wp_trim_words( wp_strip_all_tags( $post->post_content ), 20 ),
            'date'    => get_the_date( 'Y-m-d', $post ),
            'likes'   => (int) get_post_meta( $post->ID, '_culture_like_count', true ),
        );
    }

    /**
     * POST /culture/v1/user/upgrade-init
     * Initiates a Paystack session for an existing user to upgrade to Patron.
     */
    public static function handle_upgrade_init( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $user    = get_userdata( $user_id );

        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $plan_key          = $request->get_param( 'plan_key' ) ?: 'monthly_ngn';
        $primary_chapter   = (int) $request->get_param( 'primary_chapter' );
        $secondary_chapter = (int) $request->get_param( 'secondary_chapter' );

        // Save chapter selections if provided (important for upgrades where user picks new chapters).
        if ( $primary_chapter ) {
            update_user_meta( $user_id, '_culture_primary_chapter_id', $primary_chapter );
        }
        if ( $secondary_chapter ) {
            update_user_meta( $user_id, '_culture_secondary_chapter_id', $secondary_chapter );
        }

        $checkout_url = '';

        // If Paystack.
        if ( strpos( $plan_key, '_ngn' ) !== false && class_exists( 'Culture_Paystack' ) ) {
            // We'll call a new method that returns the direct authorization URL.
            $checkout_url = Culture_Paystack::init_checkout_session( $user_id, $plan_key );
        } 
        // If Stripe.
        elseif ( strpos( $plan_key, '_usd' ) !== false && class_exists( 'Culture_Stripe' ) ) {
            $checkout_url = Culture_Stripe::get_checkout_url( $user_id, $plan_key );
        }

        if ( is_wp_error( $checkout_url ) ) {
            return $checkout_url;
        }

        if ( $checkout_url ) {
            return rest_ensure_response( array(
                'success'      => true,
                'checkout_url' => $checkout_url,
            ) );
        }

        return new WP_Error( 'missing_gateway', 'Payment gateway not configured for this plan.', array( 'status' => 500 ) );
    }

    /**
     * GET /culture/v1/user/profile?user_id=X
     * Returns the full live user profile (points, badges, chapters, etc.).
     */
    public static function handle_get_user_profile( $request ) {
        $user_id = $request->get_param( 'user_id' );

        if ( ! $user_id ) {
            return new WP_Error( 'missing_user_id', 'user_id is required.', array( 'status' => 400 ) );
        }

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( self::user_profile( $user ) );
    }

    /**
     * POST /culture/v1/events/submit
     *
     * Creates a culture_event post. Called exclusively by the AI events seeder.
     * Deduplicates by a hash of normalised title + event_date + location.
     */
    public static function handle_create_event( WP_REST_Request $request ) {
        $title         = sanitize_text_field( $request->get_param( 'title' ) );
        $excerpt       = sanitize_text_field( $request->get_param( 'excerpt' ) );
        $content       = wp_kses_post( $request->get_param( 'content' ) );
        $event_date    = sanitize_text_field( $request->get_param( 'event_date' ) );
        $end_date      = sanitize_text_field( $request->get_param( 'end_date' ) );
        $location      = sanitize_text_field( $request->get_param( 'location' ) );
        $city          = sanitize_text_field( $request->get_param( 'city' ) );
        $admission     = sanitize_text_field( $request->get_param( 'admission' ) );
        $ticketing_url = esc_url_raw( $request->get_param( 'ticketing_url' ) );
        $tagline       = sanitize_text_field( $request->get_param( 'tagline' ) );
        $attribution   = esc_url_raw( $request->get_param( 'attribution' ) );
        $interests        = (array) $request->get_param( 'interests' );
        $auto_publish     = (bool) $request->get_param( 'auto_publish' );
        $ai_generated_raw = $request->get_param( 'ai_generated' );
        $ai_generated     = ( $ai_generated_raw === null ) ? true : (bool) $ai_generated_raw;
        $submitter_name   = sanitize_text_field( $request->get_param( 'submitter_name' ) );
        $submitter_email  = sanitize_email( $request->get_param( 'submitter_email' ) );

        if ( empty( $title ) || empty( $event_date ) ) {
            return new WP_Error( 'missing_fields', 'title and event_date are required.', array( 'status' => 400 ) );
        }

        // Deduplication: hash of title + date + location.
        $dedup_hash = md5( strtolower( trim( $title ) ) . '|' . $event_date . '|' . strtolower( trim( $location ) ) );
        $existing = get_posts( array(
            'post_type'      => 'culture_event',
            'post_status'    => array( 'publish', 'pending' ),
            'posts_per_page' => 1,
            'meta_query'     => array(
                array(
                    'key'     => '_culture_event_dedup_hash',
                    'value'   => $dedup_hash,
                    'compare' => '=',
                ),
            ),
        ) );

        if ( ! empty( $existing ) ) {
            return new WP_Error( 'duplicate_event', 'This event already exists.', array( 'status' => 409 ) );
        }

        $post_status = $auto_publish ? 'publish' : 'pending';

        $post_id = wp_insert_post( array(
            'post_title'   => $title,
            'post_excerpt' => $excerpt,
            'post_content' => $content,
            'post_status'  => $post_status,
            'post_type'    => 'culture_event',
            'post_author'  => 0,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error( 'insert_failed', $post_id->get_error_message(), array( 'status' => 500 ) );
        }

        // Event-specific meta.
        update_post_meta( $post_id, '_culture_event_date',      $event_date );
        update_post_meta( $post_id, '_culture_event_end_date',  $end_date );
        update_post_meta( $post_id, '_culture_location',        $location );
        update_post_meta( $post_id, '_culture_event_city',      $city );
        update_post_meta( $post_id, '_culture_admission',       $admission );
        update_post_meta( $post_id, '_culture_ticketing_url',   $ticketing_url );
        update_post_meta( $post_id, '_culture_tagline',         $tagline );
        update_post_meta( $post_id, '_culture_attribution',     $attribution );
        update_post_meta( $post_id, '_culture_is_featured',     '0' );
        update_post_meta( $post_id, '_culture_ai_generated',    $ai_generated ? '1' : '0' );
        update_post_meta( $post_id, '_culture_event_dedup_hash', $dedup_hash );

        if ( ! empty( $submitter_name ) ) {
            update_post_meta( $post_id, '_culture_submitter_name',  $submitter_name );
        }
        if ( ! empty( $submitter_email ) ) {
            update_post_meta( $post_id, '_culture_submitter_email', $submitter_email );
        }

        // Assign interest terms (only existing slugs to avoid orphan terms).
        if ( ! empty( $interests ) && taxonomy_exists( 'culture_interest' ) ) {
            $valid = array();
            foreach ( array_map( 'sanitize_key', $interests ) as $slug ) {
                if ( term_exists( $slug, 'culture_interest' ) ) {
                    $valid[] = $slug;
                }
            }
            if ( ! empty( $valid ) ) {
                wp_set_object_terms( $post_id, $valid, 'culture_interest' );
            }
        }

        $post = get_post( $post_id );
        return rest_ensure_response( array(
            'success' => true,
            'post_id' => $post_id,
            'slug'    => $post->post_name ?: sanitize_title( $title ),
        ) );
    }

    /**
     * POST /culture/v1/admin/migrate-community-posts
     * One-time migration: converts all posts in the "community" category
     * to the culture_post CPT. Safe to run multiple times (idempotent).
     */
    public static function handle_migrate_community_posts() {
        global $wpdb;

        $category = get_term_by( 'slug', 'community', 'category' );
        if ( ! $category ) {
            return rest_ensure_response( array( 'migrated' => 0, 'message' => 'No community category found.' ) );
        }

        $post_ids = get_posts( array(
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'category'       => $category->term_id,
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ) );

        $migrated = 0;
        foreach ( $post_ids as $id ) {
            $wpdb->update(
                $wpdb->posts,
                array( 'post_type' => 'culture_post' ),
                array( 'ID' => $id ),
                array( '%s' ),
                array( '%d' )
            );
            clean_post_cache( $id );
            $migrated++;
        }

        return rest_ensure_response( array(
            'migrated' => $migrated,
            'message'  => "Migrated {$migrated} posts to culture_post.",
        ) );
    }

    /**
     * POST /culture/v1/user/directory
     * Saves Connect directory settings. Reads all fields directly from the
     * request without relying on has_param() so JSON bodies always persist.
     */
    public static function handle_save_directory_profile( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! $user_id || ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $opt_in = $request->get_param( 'directory_opt_in' );
        update_user_meta( $user_id, '_culture_directory_opt_in',     ( $opt_in === '1' || $opt_in === true ) ? '1' : '0' );
        update_user_meta( $user_id, '_culture_directory_bio',         sanitize_textarea_field( (string) $request->get_param( 'directory_bio' ) ) );
        update_user_meta( $user_id, '_culture_directory_disciplines', sanitize_text_field( (string) $request->get_param( 'directory_disciplines' ) ) );
        update_user_meta( $user_id, '_culture_directory_instagram',   sanitize_text_field( (string) $request->get_param( 'directory_instagram' ) ) );
        update_user_meta( $user_id, '_culture_directory_linkedin',    sanitize_text_field( (string) $request->get_param( 'directory_linkedin' ) ) );
        update_user_meta( $user_id, '_culture_directory_website',     sanitize_text_field( (string) $request->get_param( 'directory_website' ) ) );

        return rest_ensure_response( array( 'ok' => true ) );
    }

    /**
     * GET /culture/v1/user/directory
     * Returns the Connect directory settings for the given user_id.
     */
    public static function handle_get_directory_profile( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $user    = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $disciplines_raw = get_user_meta( $user_id, '_culture_directory_disciplines', true ) ?: '';

        return rest_ensure_response( array(
            'directory_opt_in'      => get_user_meta( $user_id, '_culture_directory_opt_in',     true ) === '1',
            'directory_bio'         => get_user_meta( $user_id, '_culture_directory_bio',         true ) ?: '',
            'directory_disciplines' => $disciplines_raw,
            'directory_instagram'   => get_user_meta( $user_id, '_culture_directory_instagram',   true ) ?: '',
            'directory_linkedin'    => get_user_meta( $user_id, '_culture_directory_linkedin',    true ) ?: '',
            'directory_website'     => get_user_meta( $user_id, '_culture_directory_website',     true ) ?: '',
        ) );
    }

    /**
     * GET /culture/v1/members
     * Returns members opted into the Connect directory.
     * Supports ?search=, ?discipline=, ?location=, ?per_page=
     */
    public static function handle_get_members_directory( $request ) {
        $only_directory = $request->get_param( 'directory' ) === '1';
        $search         = $request->get_param( 'search' );
        $discipline     = $request->get_param( 'discipline' );
        $location       = $request->get_param( 'location' );
        $per_page       = min( (int) $request->get_param( 'per_page' ), 200 );

        $meta_query = array( 'relation' => 'AND' );

        if ( $only_directory ) {
            $meta_query[] = array(
                'key'     => '_culture_directory_opt_in',
                'value'   => '1',
                'compare' => '=',
            );
        }

        if ( $discipline ) {
            $meta_query[] = array(
                'key'     => '_culture_directory_disciplines',
                'value'   => $discipline,
                'compare' => 'LIKE',
            );
        }

        if ( $location ) {
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
            $tier             = get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen';
            $primary_id       = (int) get_user_meta( $user->ID, '_culture_primary_chapter_id', true );
            $primary_name     = $primary_id ? get_the_title( $primary_id ) : '';
            $disciplines_raw  = get_user_meta( $user->ID, '_culture_directory_disciplines', true ) ?: '';

            return array(
                'id'                     => $user->ID,
                'display_name'           => $user->display_name,
                'occupation'             => get_user_meta( $user->ID, '_culture_occupation',             true ) ?: '',
                'city'                   => get_user_meta( $user->ID, '_culture_city',                   true ) ?: '',
                'country_of_residence'   => get_user_meta( $user->ID, '_culture_country_of_residence',   true ) ?: '',
                'tier'                   => $tier,
                'primary_chapter'        => array( 'id' => $primary_id, 'name' => $primary_name ),
                'directory_bio'          => get_user_meta( $user->ID, '_culture_directory_bio',          true ) ?: '',
                'directory_disciplines'  => $disciplines_raw,
                'directory_instagram'    => get_user_meta( $user->ID, '_culture_directory_instagram',    true ) ?: '',
                'directory_linkedin'     => get_user_meta( $user->ID, '_culture_directory_linkedin',     true ) ?: '',
                'directory_website'      => get_user_meta( $user->ID, '_culture_directory_website',      true ) ?: '',
            );
        }, $users );

        return rest_ensure_response( $members );
    }

    /**
     * Promote an existing WP user to WCFM vendor.
     * Creates the WCFM vendor data, assigns the wcfm_vendor role, and sets up
     * the basic store profile so the vendor can immediately use the dashboard.
     */
    public static function handle_vendor_apply( $request ) {
        $user_id    = $request->get_param( 'user_id' );
        $store_name = $request->get_param( 'store_name' );
        $store_url  = $request->get_param( 'store_url' );
        $bio        = $request->get_param( 'bio' );
        $country    = $request->get_param( 'country' );
        $category   = $request->get_param( 'category' );
        $instagram  = $request->get_param( 'instagram' );
        $website    = $request->get_param( 'website' );

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        // Idempotency — already a vendor.
        $vendor_roles = array( 'wcfm_vendor', 'seller', 'vendor' );
        if ( array_intersect( $vendor_roles, (array) $user->roles ) ) {
            return rest_ensure_response( self::user_profile( $user ) );
        }

        // Validate/slugify the store URL.
        $slug = sanitize_title( $store_url ?: $store_name );
        if ( empty( $slug ) ) {
            return new WP_Error( 'invalid_slug', 'Store URL is invalid.', array( 'status' => 422 ) );
        }

        // Check slug uniqueness (WC stores use user_nicename / shop slug).
        $existing = get_users( array(
            'meta_key'    => '_store_url',
            'meta_value'  => $slug,
            'number'      => 1,
            'fields'      => 'ID',
        ) );
        if ( ! empty( $existing ) && (int) $existing[0] !== $user_id ) {
            return new WP_Error( 'slug_taken', 'That store URL is already taken.', array( 'status' => 409 ) );
        }

        // Assign vendor role.
        $user->add_role( 'wcfm_vendor' );

        // Core WCFM vendor data.
        $wcfm_vendor_data = array(
            'store_name'  => $store_name,
            'store_url'   => $slug,
            'seller_info' => $bio,
        );
        update_user_meta( $user_id, '_wcfm_vendor_data', $wcfm_vendor_data );
        update_user_meta( $user_id, '_store_url',    $slug );
        update_user_meta( $user_id, '_store_name',   $store_name );

        // WCFM profile extras.
        if ( $bio )       update_user_meta( $user_id, '_seller_info',     $bio );
        if ( $country )   update_user_meta( $user_id, '_store_country',   $country );
        if ( $category )  update_user_meta( $user_id, '_store_category',  $category );
        if ( $instagram ) update_user_meta( $user_id, '_wcfm_instagram',  $instagram );
        if ( $website )   update_user_meta( $user_id, '_store_url_ext',   $website );

        // Update nicename to match the store slug so /makers/{slug} works.
        wp_update_user( array( 'ID' => $user_id, 'user_nicename' => $slug ) );

        // Fire WCFM's own hook if available so any WCFM automations run.
        do_action( 'wcfmmp_vendor_registration_complete', $user_id );

        return rest_ensure_response( self::user_profile( get_userdata( $user_id ) ) );
    }
}
