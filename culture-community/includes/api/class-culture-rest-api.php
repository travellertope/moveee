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
        add_action( 'save_post_culture_post', array( 'Culture_Directory', 'recompute_aggregates_on_post_save' ), 10, 2 );
        // Award reputation when a community post is created via the REST API.
        add_action( 'rest_after_insert_culture_post', array( __CLASS__, 'handle_community_post_created' ), 10, 3 );
        // Event check-in admin meta box.
        add_action( 'add_meta_boxes', array( __CLASS__, 'add_event_checkin_metabox' ) );
        add_action( 'wp_ajax_culture_generate_checkin_token', array( __CLASS__, 'ajax_generate_checkin_token' ) );
    }

    /**
     * Fires after a culture_post is inserted/updated via the REST API.
     * Awards reputation + credits to the community author on first publish only.
     * Also extracts @mentions from the post content and sends mention notifications.
     */
    public static function handle_community_post_created( $post, $request, $creating ) {
        if ( ! $creating ) return;
        if ( 'publish' !== $post->post_status ) return;

        $author_id = (int) get_post_meta( $post->ID, 'community_author_id', true );
        if ( ! $author_id ) return;

        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $author_id, 'community_post', 0 );
        }

        // Extract @mentions from post content and notify mentioned users.
        if ( class_exists( 'Culture_Notifications' ) ) {
            $content = wp_strip_all_tags( $post->post_content );
            $mention_matches = array();
            preg_match_all( '/@(\w+)/', $content, $mention_matches );
            $mentioned_usernames = array_unique( $mention_matches[1] );
            if ( ! empty( $mentioned_usernames ) ) {
                $author_data = get_userdata( $author_id );
                $author_name = $author_data ? $author_data->display_name : 'Someone';
                $post_slug   = get_post_field( 'post_name', $post->ID );
                foreach ( $mentioned_usernames as $username ) {
                    $mentioned = get_user_by( 'login', $username );
                    if ( $mentioned && (int) $mentioned->ID !== (int) $author_id ) {
                        Culture_Notifications::add(
                            (int) $mentioned->ID,
                            'mention',
                            $author_name . ' mentioned you',
                            wp_trim_words( $content, 15, '…' ),
                            '/community/' . $post_slug,
                            array( 'post_id' => $post->ID, 'author_id' => $author_id )
                        );
                    }
                }
            }
        }
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

        // Google Sign-In — verifies a Google ID token, finds/creates the WP user, returns profile.
        register_rest_route( 'culture/v1', '/login-google', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_login_google' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id_token' => array(
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

        // Games — crossword daily cache (same puzzle for every player each day).
        register_rest_route( 'culture/v1', '/games/crossword-daily', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_crossword_daily' ),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'date' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_set_crossword_daily' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'date'   => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                    'puzzle' => array( 'required' => true, 'type' => 'object' ),
                ),
            ),
        ) );

        // Games — crossword rotation tracking (no repeat until all shown).
        register_rest_route( 'culture/v1', '/games/crossword-rotation', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_crossword_rotation' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_set_crossword_rotation' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'index' => array( 'required' => true, 'type' => 'integer' ),
                    'total' => array( 'required' => true, 'type' => 'integer' ),
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

        // Per-user, per-post reaction lookup — lets web's ReactionBar hydrate
        // its initial state from the real server record instead of guessing
        // "not reacted" or relying solely on localStorage. If post_id is
        // omitted, returns the user's whole reaction map.
        register_rest_route( 'culture/v1', '/user/reaction', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_user_reaction' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => false, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/user/referrals', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_referrals' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array(
                    'required'          => true,
                    'sanitize_callback' => 'absint',
                ),
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

        // Nominate a member for Culture Icon (Culture Authority tier required).
        register_rest_route( 'culture/v1', '/nominate-icon', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_nominate_icon' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'nominator_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'nominee_id'   => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Community blocklist — returns admin-configured blocked phrases for the Next.js layer.
        register_rest_route( 'culture/v1', '/community-blocklist', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_community_blocklist' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Verify email — validates the one-time token sent after registration.
        register_rest_route( 'culture/v1', '/verify-email', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_verify_email' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'uid' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'token' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ) );

        // Complete profile — saves KYC fields + tier after email verification.
        register_rest_route( 'culture/v1', '/complete-profile', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_complete_profile' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'uid' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'token' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'date_of_birth' => array(
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
                'tier' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                    'default'           => 'citizen',
                ),
                'plan_key' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                    'default'           => 'monthly_ngn',
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

        // Phase 3 — lightweight directory search (public, used by post composer).
        register_rest_route( 'culture/v1', '/directory/search', array(
            'methods'             => 'GET',
            'callback'            => array( 'Culture_Directory', 'handle_search' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'q'    => array( 'type' => 'string', 'default' => '' ),
                'type' => array( 'type' => 'string', 'default' => '' ),
            ),
        ) );

        // Discover — paginated browse with type/region/sort filters (public, used by Discover screen + filter sheet count).
        register_rest_route( 'culture/v1', '/directory/browse', array(
            'methods'             => 'GET',
            'callback'            => array( 'Culture_Directory', 'handle_browse' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'q'        => array( 'type' => 'string', 'default' => '' ),
                'type'     => array( 'type' => 'string', 'default' => '' ),
                'region'   => array( 'type' => 'string', 'default' => '' ),
                'sort'     => array( 'type' => 'string', 'default' => 'relevant' ),
                'page'     => array( 'type' => 'integer', 'default' => 1 ),
                'per_page' => array( 'type' => 'integer', 'default' => 20 ),
                'seed'     => array( 'type' => 'integer', 'default' => 0 ),
            ),
        ) );

        // Phase 3 — inline directory stub creation from post composer.
        register_rest_route( 'culture/v1', '/directory/quick-create', array(
            'methods'             => 'POST',
            'callback'            => array( 'Culture_Directory', 'handle_quick_create' ),
            'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
        ) );

        // Stub enrichment — AI content + image update for inline quick-create stubs.
        register_rest_route( 'culture/v1', '/directory/(?P<id>\d+)/enrich', array(
            'methods'             => 'POST',
            'callback'            => array( 'Culture_Directory', 'handle_enrich_stub' ),
            'permission_callback' => array( 'Culture_Directory', 'verify_secret' ),
            'args'                => array(
                'id' => array( 'type' => 'integer', 'required' => true ),
            ),
        ) );

        // Events organised by a directory entry.
        register_rest_route( 'culture/v1', '/directory/(?P<id>\d+)/events', array(
            'methods'             => 'GET',
            'callback'            => array( 'Culture_Directory', 'handle_directory_events' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id' => array( 'required' => true, 'validate_callback' => function( $v ) { return is_numeric( $v ); } ),
            ),
        ) );

        // Phase 3 — community posts linked to a directory entry.
        register_rest_route( 'culture/v1', '/directory/(?P<id>\d+)/posts', array(
            'methods'             => 'GET',
            'callback'            => array( 'Culture_Directory', 'handle_directory_posts' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id' => array( 'type' => 'integer', 'required' => true ),
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

        // Backfill image URL on an existing event.
        register_rest_route( 'culture/v1', '/events/update-image', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_update_event_image' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // List events missing an image (for the backfill tool).
        register_rest_route( 'culture/v1', '/events/missing-images', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_list_events_missing_images' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // List events whose image is an external URL not hosted on this WP install.
        register_rest_route( 'culture/v1', '/events/external-images', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_list_events_external_images' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Article comments — GET (public) and POST (auth/shared secret).
        register_rest_route( 'culture/v1', '/comments', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_comments' ),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_post_comment' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                    'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                    'content' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
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

        // Multi-type reaction toggle (love/fire/clap) — mirrors mobile's
        // /mobile/community/react, same per-user/per-post/per-type semantics
        // via Culture_Mobile_API::toggle_reaction(). Supersedes /content/like
        // for surfaces that need to know/switch the specific reaction type.
        register_rest_route( 'culture/v1', '/community/react', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_react' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'type'    => array( 'default' => 'love', 'type' => 'string', 'sanitize_callback' => 'sanitize_key' ),
            ),
        ) );

        // Article read-complete — awards magazine_read credits once ever per article per user.
        register_rest_route( 'culture/v1', '/articles/read-complete', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_article_read_complete' ),
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

        // Phase 4 — poll voting.
        register_rest_route( 'culture/v1', '/community/poll-vote', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_poll_vote' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Track an external link click on a pulse story.
        register_rest_route( 'culture/v1', '/pulse-click', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_pulse_click' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Phase 5 — public member profile by username.
        register_rest_route( 'culture/v1', '/member/(?P<username>[a-zA-Z0-9_\-]+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_public_profile' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'username' => array( 'type' => 'string', 'required' => true ),
            ),
        ) );

        // Phase 5 — community posts (filterable by author_id and template_type).
        register_rest_route( 'culture/v1', '/community/posts', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_community_posts' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'author_id'     => array( 'type' => 'integer', 'default' => 0 ),
                'template_type' => array( 'type' => 'string',  'default' => '' ),
                'per_page'      => array( 'type' => 'integer', 'default' => 20 ),
                'page'          => array( 'type' => 'integer', 'default' => 1 ),
            ),
        ) );

        // Phase 5 — portfolio (GET + POST). Requires Bearer auth.
        register_rest_route( 'culture/v1', '/user/portfolio', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_portfolio' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_save_portfolio' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/user/portfolio/pin', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_pin_portfolio_post' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'pinned'  => array( 'default'  => true ),
            ),
        ) );

        // ── Phase 6: Partner Perks & Wallet ──────────────────────────────────

        register_rest_route( 'culture/v1', '/perks', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_list_perks' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/perks/redeem', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_redeem_perk' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'       => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'perk_id'       => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'step_up_token' => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/perks/verify', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_verify_qr' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'token' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/wallet/balance', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_wallet_balance' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/wallet/history', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_wallet_history' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'  => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'per_page' => array( 'required' => false, 'type' => 'integer', 'default' => 20,  'sanitize_callback' => 'absint' ),
                'page'     => array( 'required' => false, 'type' => 'integer', 'default' => 1,   'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/wallet/cashout', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_wallet_cashout' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'       => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'credits'       => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'method'        => array( 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
                'account_name'  => array( 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
                'account_ref'   => array( 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
                'currency'      => array( 'required' => false, 'type' => 'string',  'default' => 'GBP', 'sanitize_callback' => 'sanitize_text_field' ),
                'step_up_token' => array( 'required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/admin/cashout-queue', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_cashout_queue' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'status' => array( 'required' => false, 'type' => 'string', 'default' => 'pending', 'sanitize_callback' => 'sanitize_key' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/admin/cashout-approve', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cashout_approve' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'redemption_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'admin_id'      => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/admin/cashout-reject', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_cashout_reject' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'redemption_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'admin_id'      => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'reason'        => array( 'required' => false, 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/admin/perks', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_admin_list_perks' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_admin_create_perk' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/admin/perks/(?P<id>\d+)', array(
            array(
                'methods'             => 'PUT',
                'callback'            => array( __CLASS__, 'handle_admin_update_perk' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array( __CLASS__, 'handle_admin_delete_perk' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/user/redemptions', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_user_redemptions' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true,  'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'status'  => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_key' ),
            ),
        ) );

        // Passkey endpoints.
        register_rest_route( 'culture/v1', '/passkey/register-options', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_register_options' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/passkey/register-verify', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_register_verify' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/passkey/login-options', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_login_options' ),
            'permission_callback' => '__return_true',
        ) );
        register_rest_route( 'culture/v1', '/passkey/login-verify', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_login_verify' ),
            'permission_callback' => '__return_true',
        ) );
        register_rest_route( 'culture/v1', '/passkey/exchange-token', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_exchange_token' ),
            'permission_callback' => '__return_true',
        ) );
        register_rest_route( 'culture/v1', '/passkey/step-up', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_step_up' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/passkey/step-up-verify', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_passkey_step_up_verify' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/passkey/list', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_passkey_list' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/passkey/delete', array(
            'methods'             => 'DELETE',
            'callback'            => array( __CLASS__, 'handle_passkey_delete' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );

        // Notification endpoints.
        register_rest_route( 'culture/v1', '/notifications', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_notifications' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'limit'   => array( 'required' => false, 'type' => 'integer', 'default' => 30 ),
                'offset'  => array( 'required' => false, 'type' => 'integer', 'default' => 0 ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/notifications/count', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_notification_count' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/notifications/read', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_mark_notifications_read' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/notifications/preferences', array(
            array(
                'methods'             => 'GET',
                'callback'            => array( __CLASS__, 'handle_get_notification_prefs' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array( __CLASS__, 'handle_set_notification_prefs' ),
                'permission_callback' => array( __CLASS__, 'api_key_permission' ),
                'args'                => array(
                    'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                ),
            ),
        ) );

        // Follow system (web — API key, explicit user_id).
        register_rest_route( 'culture/v1', '/follow', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_follow_member' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'      => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'target_id'    => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'notify_posts' => array( 'default' => false ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/unfollow', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_unfollow_member' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'   => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'target_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/follow/notify', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_set_follow_notify' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'      => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'target_id'    => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'notify_posts' => array( 'default' => false ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/follow/status', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_follow_status' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id'   => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'target_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/follow/following', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_following_usernames' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Community event RSVPs (web — API key, explicit user_id param).
        // Mirrors /mobile/community/event/* in class-culture-mobile-api.php.
        register_rest_route( 'culture/v1', '/community/event/rsvp', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_community_event_rsvp' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/community/event/rsvp-cancel', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_community_event_rsvp_cancel' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/community/event/rsvp-status', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_community_event_rsvp_status' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/community/event/attendees', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_community_event_attendees' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
                'post_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );
        register_rest_route( 'culture/v1', '/community/my-events', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_community_my_events' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Analytics
        register_rest_route( 'culture/v1', '/member/analytics', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_member_analytics' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
            'args'                => array(
                'user_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            ),
        ) );

        // Phase 9 — Event QR check-in.
        register_rest_route( 'culture/v1', '/events/(?P<id>\d+)/generate-checkin-token', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_generate_checkin_token' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
        register_rest_route( 'culture/v1', '/events/self-checkin', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_self_checkin' ),
            'permission_callback' => array( __CLASS__, 'api_key_permission' ),
        ) );
    }

    /* ——————————————————————————————————————
     *  Passkey handlers
     * —————————————————————————————————————— */

    public static function handle_passkey_register_options( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! $user_id || ! get_userdata( $user_id ) ) {
            return new WP_Error( 'invalid_user', 'Invalid user.', array( 'status' => 400 ) );
        }
        return rest_ensure_response( Culture_WebAuthn::get_register_options( $user_id ) );
    }

    public static function handle_passkey_register_verify( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $resp    = $request->get_param( 'response' );
        if ( ! $user_id || ! is_array( $resp ) ) {
            return new WP_Error( 'bad_request', 'Missing user_id or response.', array( 'status' => 400 ) );
        }
        $result = Culture_WebAuthn::verify_register( $user_id, $resp );
        if ( ! $result['success'] ) {
            return new WP_Error( 'passkey_error', $result['error'], array( 'status' => 400 ) );
        }
        return rest_ensure_response( $result );
    }

    public static function handle_passkey_login_options( $request ) {
        $user_id = $request->get_param( 'user_id' ) ? (int) $request->get_param( 'user_id' ) : null;
        return rest_ensure_response( Culture_WebAuthn::get_login_options( $user_id ) );
    }

    public static function handle_passkey_login_verify( $request ) {
        $resp = $request->get_json_params();
        if ( empty( $resp ) ) {
            return new WP_Error( 'bad_request', 'Missing response body.', array( 'status' => 400 ) );
        }
        $result = Culture_WebAuthn::verify_login( $resp );
        if ( ! $result['success'] ) {
            return new WP_Error( 'passkey_error', $result['error'], array( 'status' => 401 ) );
        }
        return rest_ensure_response( $result );
    }

    public static function handle_passkey_exchange_token( $request ) {
        $token   = sanitize_text_field( $request->get_param( 'passkey_token' ) ?? '' );
        $user_id = Culture_WebAuthn::exchange_passkey_token( $token );
        if ( ! $user_id ) {
            return new WP_Error( 'invalid_token', 'Invalid or expired token.', array( 'status' => 401 ) );
        }
        // Return same profile data as login endpoint.
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'invalid_user', 'User not found.', array( 'status' => 404 ) );
        }
        return rest_ensure_response( self::user_profile( $user ) );
    }

    public static function handle_passkey_step_up( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! $user_id ) return new WP_Error( 'bad_request', 'Missing user_id.', array( 'status' => 400 ) );
        $creds = Culture_WebAuthn::get_credentials( $user_id );
        if ( empty( $creds ) ) {
            return new WP_Error( 'no_passkey', 'No passkey registered.', array( 'status' => 403 ) );
        }
        return rest_ensure_response( Culture_WebAuthn::get_step_up_options( $user_id ) );
    }

    public static function handle_passkey_step_up_verify( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $resp    = $request->get_param( 'response' );
        if ( ! $user_id || ! is_array( $resp ) ) {
            return new WP_Error( 'bad_request', 'Missing user_id or response.', array( 'status' => 400 ) );
        }
        $result = Culture_WebAuthn::verify_step_up( $user_id, $resp );
        if ( ! $result['success'] ) {
            return new WP_Error( 'passkey_error', $result['error'], array( 'status' => 401 ) );
        }
        return rest_ensure_response( $result );
    }

    public static function handle_passkey_list( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $creds   = Culture_WebAuthn::get_credentials( $user_id );
        $out     = array_map( fn($c) => [
            'id'           => $c['credential_id'],
            'device_name'  => $c['device_name'],
            'created_at'   => $c['created_at'],
            'last_used_at' => $c['last_used_at'],
            'aaguid'       => $c['aaguid'],
        ], $creds );
        return rest_ensure_response( $out );
    }

    public static function handle_passkey_delete( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $cred_id = sanitize_text_field( $request->get_param( 'credential_id' ) ?? '' );
        if ( ! $user_id || ! $cred_id ) {
            return new WP_Error( 'bad_request', 'Missing user_id or credential_id.', array( 'status' => 400 ) );
        }
        $deleted = Culture_WebAuthn::delete_credential( $user_id, $cred_id );
        if ( ! $deleted ) {
            return new WP_Error( 'not_found', 'Credential not found.', array( 'status' => 404 ) );
        }
        return rest_ensure_response( array( 'success' => true ) );
    }

    /* ——————————————————————————————————————
     *  Notification handlers
     * —————————————————————————————————————— */

    public static function handle_get_notifications( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $limit   = min( 50, max( 1, (int) $request->get_param( 'limit' ) ) );
        $offset  = max( 0, (int) $request->get_param( 'offset' ) );
        $rows    = Culture_Notifications::get_for_user( $user_id, $limit, $offset );
        foreach ( $rows as &$row ) {
            $row['meta'] = json_decode( $row['meta'] ?? '{}', true ) ?: array();
        }
        return rest_ensure_response( $rows );
    }

    public static function handle_notification_count( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        return rest_ensure_response( array( 'unread' => Culture_Notifications::count_unread( $user_id ) ) );
    }

    public static function handle_mark_notifications_read( $request ) {
        $user_id         = (int) $request->get_param( 'user_id' );
        $notification_id = $request->get_param( 'notification_id' );
        if ( $notification_id ) {
            Culture_Notifications::mark_read( $user_id, (int) $notification_id );
        } else {
            Culture_Notifications::mark_all_read( $user_id );
        }
        return rest_ensure_response( array( 'success' => true ) );
    }

    public static function handle_get_notification_prefs( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        return rest_ensure_response( Culture_Notifications::get_prefs( $user_id ) );
    }

    public static function handle_set_notification_prefs( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $prefs   = $request->get_param( 'prefs' );
        if ( ! is_array( $prefs ) ) {
            $prefs = array();
        }
        return rest_ensure_response( Culture_Notifications::set_prefs( $user_id, $prefs ) );
    }

    /* ——————————————————————————————————————
     *  Follow handlers
     * —————————————————————————————————————— */

    public static function handle_follow_member( $request ) {
        $user_id   = (int) $request->get_param( 'user_id' );
        $target_id = (int) $request->get_param( 'target_id' );
        $notify    = (bool) $request->get_param( 'notify_posts' );

        if ( $target_id === $user_id ) {
            return new WP_Error( 'invalid_target', 'You cannot follow yourself.', array( 'status' => 400 ) );
        }
        if ( ! get_userdata( $target_id ) ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        Culture_Follows::follow( $user_id, $target_id, $notify );

        return rest_ensure_response( array(
            'success'        => true,
            'isFollowing'    => true,
            'followersCount' => Culture_Follows::followers_count( $target_id ),
        ) );
    }

    public static function handle_unfollow_member( $request ) {
        $user_id   = (int) $request->get_param( 'user_id' );
        $target_id = (int) $request->get_param( 'target_id' );

        Culture_Follows::unfollow( $user_id, $target_id );

        return rest_ensure_response( array(
            'success'        => true,
            'isFollowing'    => false,
            'followersCount' => Culture_Follows::followers_count( $target_id ),
        ) );
    }

    public static function handle_set_follow_notify( $request ) {
        $user_id   = (int) $request->get_param( 'user_id' );
        $target_id = (int) $request->get_param( 'target_id' );
        $notify    = (bool) $request->get_param( 'notify_posts' );

        if ( ! Culture_Follows::is_following( $user_id, $target_id ) ) {
            return new WP_Error( 'not_following', 'You are not following this member.', array( 'status' => 400 ) );
        }

        Culture_Follows::set_notify( $user_id, $target_id, $notify );

        return rest_ensure_response( array( 'success' => true, 'notifyPosts' => $notify ) );
    }

    public static function handle_follow_status( $request ) {
        $user_id   = (int) $request->get_param( 'user_id' );
        $target_id = (int) $request->get_param( 'target_id' );

        return rest_ensure_response( array(
            'isFollowing'    => Culture_Follows::is_following( $user_id, $target_id ),
            'followersCount' => Culture_Follows::followers_count( $target_id ),
            'followingCount' => Culture_Follows::following_count( $target_id ),
        ) );
    }

    public static function handle_get_following_usernames( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        return rest_ensure_response( array(
            'usernames' => Culture_Follows::get_following_usernames( $user_id ),
        ) );
    }

    /* ——————————————————————————————————————
     *  Community event RSVPs (web — API key, explicit user_id)
     * —————————————————————————————————————— */

    public static function handle_community_event_rsvp( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );
        $result  = Culture_Community_RSVP::rsvp( $post_id, $user_id );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
        return rest_ensure_response( Culture_Community_RSVP::get_status( $post_id, $user_id ) );
    }

    public static function handle_community_event_rsvp_cancel( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );
        Culture_Community_RSVP::cancel( $post_id, $user_id );
        return rest_ensure_response( Culture_Community_RSVP::get_status( $post_id, $user_id ) );
    }

    public static function handle_community_event_rsvp_status( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );
        return rest_ensure_response( Culture_Community_RSVP::get_status( $post_id, $user_id ) );
    }

    public static function handle_community_event_attendees( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
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
        $user_id = (int) $request->get_param( 'user_id' );

        if ( ! Culture_Community_RSVP::is_pro( $user_id ) ) {
            return new WP_Error( 'patron_required', 'Moveee Pro membership required to manage event RSVPs.', array( 'status' => 403 ) );
        }

        return rest_ensure_response( array( 'events' => Culture_Community_RSVP::get_organiser_events( $user_id ) ) );
    }

    /* ——————————————————————————————————————
     *  Analytics handler
     * —————————————————————————————————————— */

    public static function handle_member_analytics( $request ) {
        global $wpdb;
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! $user_id || ! get_userdata( $user_id ) ) {
            return new WP_Error( 'invalid_user', 'Invalid user.', array( 'status' => 400 ) );
        }

        $ledger_table = $wpdb->prefix . 'culture_credit_ledger';
        $notif_table  = $wpdb->prefix . 'culture_notifications';

        // Credits earned/spent per day — last 30 days.
        $credit_days = $wpdb->get_results( $wpdb->prepare(
            "SELECT DATE(created_at) AS day,
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)  AS earned,
                    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS spent
             FROM {$ledger_table}
             WHERE user_id = %d AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(created_at)
             ORDER BY day ASC",
            $user_id
        ), ARRAY_A );

        // Total credits balance.
        $balance = (int) get_user_meta( $user_id, 'culture_credits', true );

        // Total reputation.
        $reputation = (int) get_user_meta( $user_id, 'culture_reputation', true );

        // Post counts by status/type.
        $post_counts = $wpdb->get_results( $wpdb->prepare(
            "SELECT post_status, COUNT(*) AS cnt
             FROM {$wpdb->posts}
             WHERE post_author = %d AND post_type = 'culture_post'
               AND post_status IN ('publish','pending')
             GROUP BY post_status",
            $user_id
        ), ARRAY_A );
        $posts_published = 0;
        $posts_pending   = 0;
        foreach ( $post_counts as $row ) {
            if ( $row['post_status'] === 'publish' ) $posts_published = (int) $row['cnt'];
            if ( $row['post_status'] === 'pending' )  $posts_pending   = (int) $row['cnt'];
        }

        // Badge count.
        $badges = get_user_meta( $user_id, 'culture_badges', true );
        $badge_count = is_array( $badges ) ? count( $badges ) : 0;

        // Top posts by engagement (reactions + comments), last 90 days.
        $top_posts = $wpdb->get_results( $wpdb->prepare(
            "SELECT p.ID, p.post_title, p.post_date,
                    CAST(COALESCE(pm_r.meta_value,'0') AS UNSIGNED) AS reactions,
                    CAST(COALESCE(pm_c.meta_value,'0') AS UNSIGNED) AS comment_count
             FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} pm_r ON pm_r.post_id = p.ID AND pm_r.meta_key = 'community_reactions_count'
             LEFT JOIN {$wpdb->postmeta} pm_c ON pm_c.post_id = p.ID AND pm_c.meta_key = 'community_comment_count'
             WHERE p.post_author = %d
               AND p.post_type = 'culture_post'
               AND p.post_status = 'publish'
               AND p.post_date >= DATE_SUB(NOW(), INTERVAL 90 DAY)
             ORDER BY (CAST(COALESCE(pm_r.meta_value,'0') AS UNSIGNED) + CAST(COALESCE(pm_c.meta_value,'0') AS UNSIGNED)) DESC
             LIMIT 5",
            $user_id
        ), ARRAY_A );

        // Reputation growth — monthly totals for last 6 months.
        $rep_months = $wpdb->get_results( $wpdb->prepare(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS rep_earned
             FROM {$ledger_table}
             WHERE user_id = %d AND type = 'reputation' AND amount > 0
               AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC",
            $user_id
        ), ARRAY_A );

        // Notification count (total received).
        $notif_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$notif_table} WHERE user_id = %d",
            $user_id
        ) );

        return rest_ensure_response( array(
            'balance'          => $balance,
            'reputation'       => $reputation,
            'posts_published'  => $posts_published,
            'posts_pending'    => $posts_pending,
            'badge_count'      => $badge_count,
            'notification_count' => $notif_count,
            'credit_days'      => $credit_days,
            'rep_months'       => $rep_months,
            'top_posts'        => $top_posts,
        ) );
    }

    /**
     * Record an external click on a pulse story and return the destination URL.
     */
    public static function handle_pulse_click( $request ) {
        $post_id = (int) $request->get_param( 'post_id' );
        $post    = get_post( $post_id );

        if ( ! $post || 'pulse_story' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Pulse story not found.', array( 'status' => 404 ) );
        }

        $url = get_post_meta( $post_id, 'pulse_external_url', true );
        if ( empty( $url ) ) {
            return new WP_Error( 'no_url', 'No external URL for this story.', array( 'status' => 404 ) );
        }

        $current = (int) get_post_meta( $post_id, 'pulse_click_count', true );
        update_post_meta( $post_id, 'pulse_click_count', $current + 1 );

        return rest_ensure_response( array( 'url' => $url ) );
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
     * Only accepts the standard 'Authorization: Bearer <token>' header.
     *
     * @param string $header The Authorization header string.
     * @return bool
     */
    public static function verify_bearer_token( $header ) {
        $stored = get_option( 'culture_api_secret', '' );
        if ( empty( $stored ) ) {
            return false;
        }

        if ( ! empty( $header ) ) {
            $expected = 'Bearer ' . $stored;
            if ( hash_equals( $expected, (string) $header ) ) {
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
        update_option( 'culture_newsletter_subscribers', $updated, false );

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
        $tier    = $request->get_param( 'tier' ) ?: '';

        $allowed_lists = array( 'getmelit', 'culture-drop', 'culture-narratives-digest', 'vendor-letter', 'origins-field-notes' );
        if ( ! in_array( $list, $allowed_lists, true ) ) {
            $list = 'culture-drop';
        }

        $allowed_segments = array( 'us', 'uk', 'ng', 'gh', 'ca', 'au', '' );
        if ( ! in_array( $segment, $allowed_segments, true ) ) {
            $segment = '';
        }

        // 'patron' is the internal DB value for Moveee Pro — stored as-is on the
        // subscriber record so Pro-only newsletter campaigns can target it.
        $is_pro = ( 'patron' === $tier );

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
                // Already an object — add list if not present, refresh segment/pro tag.
                $lists = $existing['lists'] ?? array();
                if ( ! in_array( $list, $lists, true ) ) {
                    $lists[] = $list;
                    $subscribers[ $found_idx ]['lists'] = $lists;
                }
                if ( $segment ) {
                    $subscribers[ $found_idx ]['segment'] = $segment;
                }
                if ( $tier ) {
                    $subscribers[ $found_idx ]['pro'] = $is_pro;
                }
                update_option( 'culture_newsletter_subscribers', $subscribers, false );
            } else {
                // Upgrade legacy plain-string to object, add new list.
                $subscribers[ $found_idx ] = array(
                    'email'   => $email,
                    'name'    => $name,
                    'date'    => current_time( 'mysql' ),
                    'lists'   => array( 'getmelit', $list ),
                    'segment' => $segment,
                    'pro'     => $is_pro,
                );
                update_option( 'culture_newsletter_subscribers', $subscribers, false );
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
            'pro'     => $is_pro,
        );
        update_option( 'culture_newsletter_subscribers', $subscribers, false );

        // Award reputation to the matching WP user on their first newsletter subscription.
        // Deferred to WP-Cron so the public subscribe endpoint doesn't block on
        // the full badge evaluation chain (up to 35 DB queries via award_points).
        if ( class_exists( 'Culture_Gamification' ) ) {
            $wp_user = get_user_by( 'email', $email );
            if ( $wp_user ) {
                $already = get_user_meta( $wp_user->ID, '_culture_newsletter_subscribed_badge', true );
                if ( ! $already ) {
                    update_user_meta( $wp_user->ID, '_culture_newsletter_subscribed_badge', '1' );
                    wp_schedule_single_event( time() + 5, 'culture_award_newsletter_points', array( $wp_user->ID ) );
                }
            }
        }

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
     * POST /culture/v1/login-google
     * Verifies a Google ID token (via Culture_Google_Auth), finds or creates the
     * matching WP user, and returns the same profile shape as handle_login().
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public static function handle_login_google( $request ) {
        $claims = Culture_Google_Auth::verify_id_token( $request->get_param( 'id_token' ) );
        if ( is_wp_error( $claims ) ) {
            return $claims;
        }

        $user = Culture_Google_Auth::find_or_create_user( $claims );
        if ( is_wp_error( $user ) ) {
            return $user;
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

        // Process referral if present.
        if ( ! empty( $referral ) && class_exists( 'Culture_Referrals' ) ) {
            $_COOKIE['culture_ref'] = $referral;
            Culture_Referrals::process_referral( $user_id );
        }

        // Generate email verification token (valid for 24 hours).
        $verify_token = wp_generate_password( 32, false );
        update_user_meta( $user_id, '_culture_email_verify_token', wp_hash( $verify_token ) );
        update_user_meta( $user_id, '_culture_email_verify_expires', time() + DAY_IN_SECONDS );
        update_user_meta( $user_id, '_culture_email_verified', '0' );

        $next_url = sanitize_text_field( $request->get_param( 'next' ) ?: '' );

        if ( class_exists( 'Culture_Emails' ) ) {
            Culture_Emails::send_verification_email( $user_id, $verify_token, $next_url );
        }

        return rest_ensure_response( array(
            'success'               => true,
            'requires_verification' => true,
            'user_id'               => $user_id,
            'username'              => get_userdata( $user_id )->user_login,
        ) );
    }

    /**
     * POST /culture/v1/nominate-icon
     * Allows Culture Authority (or higher) members to nominate someone for Culture Icon.
     * Sets _culture_icon_nominated = 1 on the nominee. One nomination per nominator per day.
     */
    public static function handle_nominate_icon( $request ) {
        $nominator_id = (int) $request->get_param( 'nominator_id' );
        $nominee_id   = (int) $request->get_param( 'nominee_id' );

        if ( ! get_userdata( $nominator_id ) || ! get_userdata( $nominee_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }
        if ( $nominator_id === $nominee_id ) {
            return new WP_Error( 'self_nominate', 'You cannot nominate yourself.', array( 'status' => 400 ) );
        }

        // Nominator must be Culture Authority or Culture Icon.
        $rep       = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $nominator_id ) : 0;
        $tier      = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation_tier( $rep, $nominator_id ) : 'member';
        $auth_tiers = array( 'culture-authority', 'culture-icon' );
        if ( ! in_array( $tier, $auth_tiers, true ) ) {
            return new WP_Error( 'tier_required', 'Only Culture Authority members can nominate for Culture Icon.', array( 'status' => 403 ) );
        }

        // Rate-limit: one nomination per nominator per day.
        $rate_key = 'culture_icon_nom_' . $nominator_id;
        if ( get_transient( $rate_key ) ) {
            return new WP_Error( 'rate_limited', 'You can only submit one nomination per day.', array( 'status' => 429 ) );
        }
        set_transient( $rate_key, 1, DAY_IN_SECONDS );

        update_user_meta( $nominee_id, '_culture_icon_nominated', 1 );
        update_user_meta( $nominee_id, '_culture_icon_nominated_by', $nominator_id );
        update_user_meta( $nominee_id, '_culture_icon_nominated_at', current_time( 'mysql' ) );

        return rest_ensure_response( array( 'success' => true, 'nominee_id' => $nominee_id ) );
    }

    /**
     * GET /culture/v1/community-blocklist
     * Returns admin-configured blocked phrases so the Next.js layer can enforce them.
     * The default hardcoded list lives in lib/spam-protection.ts; this endpoint
     * only returns custom additions made via WP Admin → Settings → Moderation.
     */
    public static function handle_get_community_blocklist() {
        global $wpdb;
        $rows = $wpdb->get_results(
            "SELECT option_name, option_value FROM {$wpdb->options}
             WHERE option_name IN ('culture_community_blocklist','culture_new_member_review_days')",
            ARRAY_A
        );
        $opts = array_column( $rows, 'option_value', 'option_name' );

        $raw     = $opts['culture_community_blocklist'] ?? '';
        $phrases = array_values( array_filter(
            array_map( 'trim', explode( "\n", $raw ) ),
            function ( $line ) { return strlen( $line ) > 1; }
        ) );
        $review_days = (int) ( $opts['culture_new_member_review_days'] ?? 7 );

        return rest_ensure_response( array(
            'phrases'     => $phrases,
            'review_days' => $review_days,
        ) );
    }

    /**
     * POST /culture/v1/verify-email
     * Validates the one-time token issued after registration.
     * Does not consume the token — the user can reload the complete-profile page.
     */
    public static function handle_verify_email( $request ) {
        $user_id = (int) $request->get_param( 'uid' );
        $token   = $request->get_param( 'token' );

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', __( 'Invalid verification link.', 'culture-community' ), array( 'status' => 404 ) );
        }

        $stored_hash = get_user_meta( $user_id, '_culture_email_verify_token', true );
        $expires     = (int) get_user_meta( $user_id, '_culture_email_verify_expires', true );

        if ( ! $stored_hash || ! hash_equals( $stored_hash, wp_hash( $token ) ) ) {
            return new WP_Error( 'invalid_token', __( 'Verification link is invalid.', 'culture-community' ), array( 'status' => 400 ) );
        }

        if ( time() > $expires ) {
            return new WP_Error( 'token_expired', __( 'Verification link has expired. Please register again.', 'culture-community' ), array( 'status' => 410 ) );
        }

        return rest_ensure_response( array(
            'success'      => true,
            'user_id'      => $user_id,
            'username'     => $user->user_login,
            'display_name' => $user->display_name,
            'email'        => $user->user_email,
        ) );
    }

    /**
     * POST /culture/v1/complete-profile
     * Saves KYC fields and membership tier after email verification.
     * Consumes the verification token and sends the welcome email.
     */
    public static function handle_complete_profile( $request ) {
        $user_id  = (int) $request->get_param( 'uid' );
        $token    = $request->get_param( 'token' );
        $tier     = $request->get_param( 'tier' ) ?: 'citizen';
        $plan_key = $request->get_param( 'plan_key' ) ?: 'monthly_ngn';

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', __( 'User not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        $stored_hash = get_user_meta( $user_id, '_culture_email_verify_token', true );
        $expires     = (int) get_user_meta( $user_id, '_culture_email_verify_expires', true );

        if ( ! $stored_hash || ! hash_equals( $stored_hash, wp_hash( $token ) ) ) {
            return new WP_Error( 'invalid_token', __( 'Verification link is invalid.', 'culture-community' ), array( 'status' => 400 ) );
        }

        if ( time() > $expires ) {
            return new WP_Error( 'token_expired', __( 'Verification link has expired.', 'culture-community' ), array( 'status' => 410 ) );
        }

        // Save KYC fields.
        $meta_map = array(
            'date_of_birth'        => '_culture_dob',
            'country_of_residence' => '_culture_country_of_residence',
            'city'                 => '_culture_city',
            'occupation'           => '_culture_occupation',
        );
        foreach ( $meta_map as $param => $meta_key ) {
            $val = $request->get_param( $param );
            if ( $val ) {
                update_user_meta( $user_id, $meta_key, sanitize_text_field( $val ) );
            }
        }

        // Save interests.
        $interests_raw = $request->get_param( 'interests' );
        if ( is_array( $interests_raw ) && count( $interests_raw ) >= 3 ) {
            $allowed_interests = array(
                'fashion-streetwear', 'food-drink', 'live-music', 'music-production',
                'independent-film', 'visual-art', 'architecture', 'photography',
                'literature', 'visual-design', 'tech-culture', 'sport-wellness',
                'travel', 'ideas', 'street-food', 'nightlife',
            );
            $valid_interests = array_values( array_filter( array_map( 'sanitize_key', $interests_raw ), function( $s ) use ( $allowed_interests ) {
                return in_array( $s, $allowed_interests, true );
            } ) );
            if ( ! empty( $valid_interests ) ) {
                update_user_meta( $user_id, '_culture_interests', wp_json_encode( $valid_interests ) );
            }
        }

        if ( ! in_array( $tier, array( 'citizen', 'patron' ), true ) ) {
            $tier = 'citizen';
        }
        update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );

        // Mark email as verified and consume the token.
        $was_unverified = get_user_meta( $user_id, '_culture_email_verified', true ) !== '1';
        update_user_meta( $user_id, '_culture_email_verified', '1' );
        delete_user_meta( $user_id, '_culture_email_verify_token' );
        delete_user_meta( $user_id, '_culture_email_verify_expires' );

        // Award reputation for email verification (once only).
        if ( $was_unverified && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'email_verified' );
        }

        // Award reputation for profile completion (once only).
        if ( class_exists( 'Culture_Gamification' ) ) {
            $already_completed = get_user_meta( $user_id, '_culture_profile_completed', true );
            if ( ! $already_completed ) {
                update_user_meta( $user_id, '_culture_profile_completed', '1' );
                Culture_Gamification::award_points( $user_id, 'profile_completed' );
            }
        }

        // Send welcome email now that all data is in place.
        if ( class_exists( 'Culture_Emails' ) ) {
            Culture_Emails::send_welcome_email( $user_id );
        }

        // Patron tier — return payment checkout URL.
        if ( 'patron' === $tier ) {
            $checkout_url = '';
            if ( strpos( $plan_key, '_ngn' ) !== false && class_exists( 'Culture_Paystack' ) ) {
                $checkout_url = Culture_Paystack::get_checkout_url( $user_id, $plan_key );
            } elseif ( strpos( $plan_key, '_usd' ) !== false && class_exists( 'Culture_Stripe' ) ) {
                $checkout_url = Culture_Stripe::get_checkout_url( $user_id, $plan_key );
            }
            if ( $checkout_url ) {
                return rest_ensure_response( array(
                    'success'          => true,
                    'requires_payment' => true,
                    'checkout_url'     => $checkout_url,
                ) );
            }
        }

        return rest_ensure_response( array(
            'success'          => true,
            'requires_payment' => false,
            'username'         => $user->user_login,
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
            'registered_at'       => strtotime( $user->user_registered ),
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
            // Gamification — credits & reputation (Phase 2)
            'credits'             => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_credits( $user->ID ) : 0,
            'reputation'          => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $user->ID ) : (int) get_user_meta( $user->ID, '_culture_points', true ),
            'reputation_tier'     => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation_tier( Culture_Gamification::get_reputation( $user->ID ) ) : 'member',
            'daily_credits_remaining' => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_daily_credits_remaining( $user->ID ) : 50,
            // Legacy field — points now mirrors reputation for backwards compat
            'points'              => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $user->ID ) : (int) get_user_meta( $user->ID, '_culture_points', true ),
            'badges'              => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $user->ID ) : array(),
            'referral_code'       => $referral_code,
            'referral_count'      => $referral_count,
            'visual_downloads_today' => self::get_daily_visual_downloads( $user->ID ),
            // Interests (Phase 1)
            'interests'           => json_decode( get_user_meta( $user->ID, '_culture_interests', true ) ?: '[]', true ) ?: array(),
            // Vendor
            'is_vendor'           => $is_vendor,
            'vendor_slug'         => $vendor_slug,
            // Profile photo
            'avatar_url'          => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
            // Passkeys (Phase 7)
            'has_passkey'         => (bool) get_user_meta( $user->ID, '_culture_has_passkey', true ),
            'passkey_count'       => (int) get_user_meta( $user->ID, '_culture_passkey_count', true ),
            'credits_escrowed'    => (int) get_user_meta( $user->ID, '_culture_credits_escrowed', true ),
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
            'directory_twitter'      => '_culture_directory_twitter',
            'directory_linkedin'     => '_culture_directory_linkedin',
            'directory_website'      => '_culture_directory_website',
            'avatar_url'             => '_culture_avatar_url',
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

        // Interests (Phase 1) — array of interest slugs.
        if ( $request->has_param( 'interests' ) ) {
            $interests_raw = $request->get_param( 'interests' );
            if ( is_array( $interests_raw ) ) {
                $allowed_interests = array(
                    'fashion-streetwear', 'food-drink', 'live-music', 'music-production',
                    'independent-film', 'visual-art', 'architecture', 'photography',
                    'literature', 'visual-design', 'tech-culture', 'sport-wellness',
                    'travel', 'ideas', 'street-food', 'nightlife',
                );
                $valid = array_values( array_filter( array_map( 'sanitize_key', $interests_raw ), function( $s ) use ( $allowed_interests ) {
                    return in_array( $s, $allowed_interests, true );
                } ) );
                update_user_meta( $user_id, '_culture_interests', wp_json_encode( $valid ) );
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
                update_option( 'culture_newsletter_subscribers', $subscribers, false );
            } elseif ( ! $wants_main && $in_list ) {
                $subscribers = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
                    $sub_email = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
                    return strtolower( trim( $sub_email ) ) !== strtolower( $email );
                } ) );
                update_option( 'culture_newsletter_subscribers', $subscribers, false );
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

        // New fields: sharing reason + quote type.
        $sharing_reason = $request->get_param( 'sharing_reason' );
        if ( $sharing_reason ) {
            update_post_meta( $post_id, '_quote_sharing_reason', sanitize_textarea_field( $sharing_reason ) );
        }
        $quote_type = $request->get_param( 'quote_type' );
        $allowed_types = array( 'Person', 'Book', 'Film', 'Speech', 'Song' );
        if ( $quote_type && in_array( $quote_type, $allowed_types, true ) ) {
            update_post_meta( $post_id, '_quote_type', sanitize_text_field( $quote_type ) );
        }

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
     * Returns today's cached trivia questions for a given slot, or 404 if not generated yet.
     */
    public static function handle_get_trivia_daily( $request ) {
        $date = gmdate( 'Y-m-d' );
        $slot = max( 1, min( 5, (int) ( $request->get_param( 'slot' ) ?: 1 ) ) );
        $key  = 'culture_games_trivia_' . $date . '_slot_' . $slot;
        // Legacy fallback: slot 1 may have been cached without slot suffix
        if ( $slot === 1 ) {
            $cached = get_option( $key, get_option( 'culture_games_trivia_' . $date, null ) );
        } else {
            $cached = get_option( $key, null );
        }

        if ( null === $cached || ! is_array( $cached ) ) {
            return new WP_Error( 'not_found', 'No trivia cached for today/slot.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( array( 'date' => $date, 'slot' => $slot, 'questions' => $cached ) );
    }

    /**
     * POST /culture/v1/games/trivia-daily
     * Stores today's trivia questions for a given slot. Cleans up yesterday's options.
     */
    public static function handle_set_trivia_daily( $request ) {
        $questions = $request->get_param( 'questions' );
        $slot      = max( 1, min( 5, (int) ( $request->get_param( 'slot' ) ?: 1 ) ) );

        if ( ! is_array( $questions ) || empty( $questions ) ) {
            return new WP_Error( 'invalid', 'questions must be a non-empty array.', array( 'status' => 400 ) );
        }

        $date      = gmdate( 'Y-m-d' );
        $yesterday = gmdate( 'Y-m-d', strtotime( '-1 day' ) );
        $key       = 'culture_games_trivia_' . $date . '_slot_' . $slot;

        update_option( $key, $questions, false );
        // Clean up all yesterday's slots
        for ( $s = 1; $s <= 5; $s++ ) {
            delete_option( 'culture_games_trivia_' . $yesterday . '_slot_' . $s );
        }
        delete_option( 'culture_games_trivia_' . $yesterday );

        return rest_ensure_response( array( 'success' => true, 'date' => $date, 'slot' => $slot ) );
    }

    /** Max credits awarded for a perfect score, per game type. */
    const GAME_MAX_CREDITS = array(
        'trivia'        => 50,
        'who-said-it'   => 30,
    );

    /**
     * POST /culture/v1/games/complete
     * Records a completed game play and awards credits proportional to score.
     * Expects user_id (set by caller from auth context), game_type, score, max_score.
     */
    public static function handle_games_complete( $request ) {
        global $wpdb;

        $user_id   = (int) $request->get_param( 'user_id' );
        $game_type = sanitize_key( (string) $request->get_param( 'game_type' ) );
        $score     = max( 0, (int) $request->get_param( 'score' ) );
        $max_score = max( 1, (int) $request->get_param( 'max_score' ) );

        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }
        if ( ! isset( self::GAME_MAX_CREDITS[ $game_type ] ) ) {
            return new WP_Error( 'invalid', 'Unknown game_type.', array( 'status' => 400 ) );
        }

        $score          = min( $score, $max_score );
        $max_credits    = self::GAME_MAX_CREDITS[ $game_type ];
        $credits_amount = (int) round( ( $score / $max_score ) * $max_credits );

        $table = $wpdb->prefix . 'culture_game_history';
        $wpdb->insert( $table, array(
            'user_id'        => $user_id,
            'game_type'      => $game_type,
            'score'          => $score,
            'max_score'      => $max_score,
            'credits_earned' => 0, // filled in below once we know the actual awarded amount
            'played_date'    => gmdate( 'Y-m-d' ),
            'created_at'     => current_time( 'mysql' ),
        ) );
        $history_id = (int) $wpdb->insert_id;

        $awarded = Culture_Gamification::award_credits( $user_id, $credits_amount, 'game_completed', $history_id );
        $wpdb->update( $table, array( 'credits_earned' => $awarded ), array( 'id' => $history_id ) );
        if ( $awarded > 0 ) {
            Culture_Gamification::award_reputation( $user_id, Culture_Gamification::get_point_value( 'game_completed' ), 'game_completed', $history_id );
        }

        return rest_ensure_response( array(
            'success'        => true,
            'id'             => $history_id,
            'credits_earned' => $awarded,
        ) );
    }

    /**
     * GET /culture/v1/games/history
     * Paginated list of a user's past game plays, newest first.
     */
    public static function handle_games_history( $request ) {
        global $wpdb;

        $user_id  = (int) $request->get_param( 'user_id' );
        $per_page = min( max( 1, (int) ( $request->get_param( 'per_page' ) ?: 20 ) ), 100 );
        $page     = max( 1, (int) ( $request->get_param( 'page' ) ?: 1 ) );
        $offset   = ( $page - 1 ) * $per_page;

        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $table = $wpdb->prefix . 'culture_game_history';
        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE user_id = %d", $user_id
        ) );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT id, game_type, score, max_score, credits_earned, played_date, created_at
             FROM {$table} WHERE user_id = %d ORDER BY id DESC LIMIT %d OFFSET %d",
            $user_id, $per_page, $offset
        ), ARRAY_A ) ?: array();

        return rest_ensure_response( array(
            'entries'  => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => (int) ceil( $total / max( 1, $per_page ) ),
        ) );
    }

    /**
     * GET /culture/v1/games/crossword-daily
     * Returns today's cached crossword puzzle, or 404 if not generated yet.
     */
    public static function handle_get_crossword_daily( $request ) {
        $date   = $request->get_param( 'date' ) ?: gmdate( 'Y-m-d' );
        $slot   = max( 1, min( 5, (int) ( $request->get_param( 'slot' ) ?: 1 ) ) );
        $key    = 'culture_games_crossword_' . $date . ( $slot > 1 ? '_slot_' . $slot : '' );
        $cached = get_option( $key, null );

        if ( null === $cached || ! is_array( $cached ) ) {
            return new WP_Error( 'not_found', 'No crossword cached for this date/slot.', array( 'status' => 404 ) );
        }

        return rest_ensure_response( array( 'date' => $date, 'slot' => $slot, 'puzzle' => $cached ) );
    }

    /**
     * POST /culture/v1/games/crossword-daily
     * Stores today's crossword puzzle (called by the Next.js API route after
     * Gemini generation). Cleans up the previous day's option automatically.
     */
    public static function handle_set_crossword_daily( $request ) {
        $date   = $request->get_param( 'date' );
        $puzzle = $request->get_param( 'puzzle' );
        $slot   = max( 1, min( 5, (int) ( $request->get_param( 'slot' ) ?: 1 ) ) );

        if ( ! is_array( $puzzle ) || empty( $puzzle ) ) {
            return new WP_Error( 'invalid', 'puzzle must be a non-empty object.', array( 'status' => 400 ) );
        }

        $yesterday = gmdate( 'Y-m-d', strtotime( $date . ' -1 day' ) );
        $key       = 'culture_games_crossword_' . $date . ( $slot > 1 ? '_slot_' . $slot : '' );

        update_option( $key, $puzzle, false );
        delete_option( 'culture_games_crossword_' . $yesterday );
        for ( $s = 2; $s <= 5; $s++ ) {
            delete_option( 'culture_games_crossword_' . $yesterday . '_slot_' . $s );
        }

        return rest_ensure_response( array( 'success' => true, 'date' => $date, 'slot' => $slot ) );
    }

    /**
     * GET /culture/v1/games/crossword-rotation
     * Returns the list of puzzle indices already used in the current rotation cycle.
     */
    public static function handle_get_crossword_rotation( $request ) {
        $used = get_option( 'culture_games_crossword_used', array() );
        return rest_ensure_response( array( 'used' => $used ) );
    }

    /**
     * POST /culture/v1/games/crossword-rotation
     * Marks a puzzle index as used. Resets the rotation when all puzzles have been shown.
     */
    public static function handle_set_crossword_rotation( $request ) {
        $index = (int) $request->get_param( 'index' );
        $total = (int) $request->get_param( 'total' );

        $used = get_option( 'culture_games_crossword_used', array() );
        if ( ! is_array( $used ) ) {
            $used = array();
        }

        if ( ! in_array( $index, $used, true ) ) {
            $used[] = $index;
        }

        // Reset rotation when all puzzles have been shown
        if ( count( $used ) >= $total ) {
            $used = array( $index );
        }

        update_option( 'culture_games_crossword_used', $used, false );

        return rest_ensure_response( array( 'success' => true, 'used_count' => count( $used ), 'total' => $total ) );
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
        global $wpdb;
        $user_id = (int) $request->get_param( 'user_id' );

        $keys = array(
            '_culture_like_article_ids',
            '_culture_bookmark_article_ids',
            '_culture_like_quote_ids',
            '_culture_bookmark_quote_ids',
        );
        $placeholders = implode( ',', array_fill( 0, count( $keys ), '%s' ) );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->usermeta}
             WHERE user_id = %d AND meta_key IN ({$placeholders})",
            array_merge( array( $user_id ), $keys )
        ), ARRAY_A );

        $map = array_column( $rows, 'meta_value', 'meta_key' );
        $unpack = function( $key ) use ( $map ) {
            $val = isset( $map[ $key ] ) ? maybe_unserialize( $map[ $key ] ) : array();
            return is_array( $val ) ? $val : array();
        };

        return rest_ensure_response( array(
            'liked_articles'      => $unpack( '_culture_like_article_ids' ),
            'bookmarked_articles' => $unpack( '_culture_bookmark_article_ids' ),
            'liked_quotes'        => $unpack( '_culture_like_quote_ids' ),
            'bookmarked_quotes'   => $unpack( '_culture_bookmark_quote_ids' ),
        ) );
    }

    /**
     * GET /culture/v1/user/reaction
     * Reads from the same `_culture_post_reactions` usermeta map written by
     * Culture_Mobile_API::toggle_reaction() (mobile + web share one map) —
     * single source of truth for "did this user react, and with what emoji."
     */
    public static function handle_get_user_reaction( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );

        $reactions_map = get_user_meta( $user_id, '_culture_post_reactions', true );
        $reactions_map = is_array( $reactions_map ) ? $reactions_map : array();

        if ( $post_id > 0 ) {
            return rest_ensure_response( array(
                'userReaction' => isset( $reactions_map[ $post_id ] ) ? $reactions_map[ $post_id ] : null,
            ) );
        }

        return rest_ensure_response( array( 'reactions' => $reactions_map ) );
    }

    public static function handle_get_referrals( $request ) {
        global $wpdb;
        $user_id = (int) $request->get_param( 'user_id' );

        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $code  = class_exists( 'Culture_Referrals' ) ? Culture_Referrals::get_referral_code( $user_id ) : '';
        $count = class_exists( 'Culture_Referrals' ) ? Culture_Referrals::get_referral_count( $user_id ) : 0;

        // Fetch referred users (those who have _culture_referred_by = this user_id).
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

        // Sort newest first.
        usort( $referred, fn( $a, $b ) => $b['joinedAt'] - $a['joinedAt'] );

        $rep_per_referral    = class_exists( 'Culture_Gamification' ) ? ( Culture_Gamification::POINTS['referral'] ?? 30 ) : 30;
        $credits_per_referral = class_exists( 'Culture_Gamification' ) ? ( Culture_Gamification::CREDIT_BONUSES['referral'] ?? 5 ) : 5;

        return rest_ensure_response( array(
            'referralCode'            => $code,
            'referralUrl'             => 'https://web.themoveee.com/register?ref=' . $code,
            'referralCount'           => $count,
            'repPerReferral'          => $rep_per_referral,
            'creditsPerReferral'      => $credits_per_referral,
            'referredUsers'           => $referred,
            'connectorThreshold'      => 3,
            'superConnectorThreshold' => 10,
        ) );
    }

    /**
     * GET /culture/v1/comments?post_id=X
     * Returns all approved comments for a post, oldest first.
     */
    public static function handle_get_comments( $request ) {
        $post_id  = $request->get_param( 'post_id' );
        $raw      = get_comments( array(
            'post_id' => $post_id,
            'status'  => 'approve',
            'orderby' => 'comment_date',
            'order'   => 'ASC',
        ) );

        $comments = array_map( function( $c ) {
            return array(
                'id'      => (int) $c->comment_ID,
                'author'  => $c->comment_author,
                'content' => wpautop( $c->comment_content ),
                'date'    => $c->comment_date,
            );
        }, $raw );

        return rest_ensure_response( array( 'comments' => $comments ) );
    }

    /**
     * POST /culture/v1/comments
     * Insert a new end-of-article comment.
     */
    public static function handle_post_comment( $request ) {
        $post_id = (int) $request->get_param( 'post_id' );
        $user_id = (int) $request->get_param( 'user_id' );
        $content = $request->get_param( 'content' );

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

        if ( class_exists( 'Culture_Gamification' ) ) {
            $post_type = get_post_type( $post_id );
            $action    = ( 'culture_newsletter' === $post_type ) ? 'newsletter_comment' : 'magazine_comment';
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

        // Increment action-specific counters for badge tracking
        if ( 'community_comment' === $action ) {
            $count = (int) get_user_meta( $user_id, '_community_comment_count', true ) + 1;
            update_user_meta( $user_id, '_community_comment_count', $count );
        }

        $new_total = Culture_Gamification::award_points( $user_id, $action );

        return rest_ensure_response( array(
            'success'                 => true,
            'points'                  => $new_total,
            'reputation'              => $new_total,
            'credits'                 => Culture_Gamification::get_credits( $user_id ),
            'daily_credits_remaining' => Culture_Gamification::get_daily_credits_remaining( $user_id ),
            'awarded'                 => Culture_Gamification::get_point_value( $action ),
            'new_badges'              => array(),
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
     * POST /culture/v1/community/react
     * Web mirror of the mobile /mobile/community/react endpoint — same
     * per-user, per-post, per-type (love/fire/clap) toggle/switch semantics,
     * via the shared Culture_Mobile_API::toggle_reaction() implementation.
     * Unlike mobile's JWT auth (current user implicit), web is API-key
     * authenticated so user_id is an explicit param.
     */
    public static function handle_react( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );
        $type    = $request->get_param( 'type' ) ?: 'love';

        $result = Culture_Mobile_API::toggle_reaction( $user_id, $post_id, $type );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    /**
     * POST /culture/v1/articles/read-complete
     * Awards magazine_read credits once ever per article per user.
     */
    public static function handle_article_read_complete( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $post_id = (int) $request->get_param( 'post_id' );

        if ( ! $user_id || ! $post_id ) {
            return new WP_Error( 'bad_request', 'user_id and post_id are required.', array( 'status' => 400 ) );
        }

        $meta_key = '_culture_article_read_' . $post_id;
        if ( get_user_meta( $user_id, $meta_key, true ) ) {
            return rest_ensure_response( array( 'success' => true, 'credits_earned' => 0, 'already_awarded' => true ) );
        }

        $amount  = max( 1, (int) Culture_Gamification::get_credit_bonus( 'magazine_read' ) );
        $credits = Culture_Gamification::award_credits( $user_id, $amount, 'magazine_read', $post_id );
        Culture_Gamification::award_reputation( $user_id, Culture_Gamification::get_point_value( 'magazine_read' ), 'magazine_read', $post_id );
        update_user_meta( $user_id, $meta_key, '1' );

        return rest_ensure_response( array( 'success' => true, 'credits_earned' => max( 0, intval( $credits ) ) ) );
    }

    /**
     * POST /culture/v1/content/bookmark
     * Toggles a bookmark (private save) on any post for a user.
     */
    public static function handle_toggle_bookmark( $request ) {
        $user_id      = (int) $request->get_param( 'user_id' );
        $post_id      = (int) $request->get_param( 'post_id' );
        $content_type = sanitize_key( $request->get_param( 'content_type' ) ?: '' );

        $post = get_post( $post_id );
        if ( ! $post || ! in_array( $post->post_status, array( 'publish' ), true ) ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        // Route to the correct meta key based on content_type or post_type.
        if ( $content_type === 'quote' || $post->post_type === 'culture_quote' ) {
            $meta_key = '_culture_bookmark_quote_ids';
        } elseif ( $content_type === 'article' || $post->post_type === 'post' ) {
            $meta_key = '_culture_bookmark_article_ids';
        } else {
            $meta_key = '_culture_bookmarked_posts';
        }

        $bookmarked_ids     = (array) get_user_meta( $user_id, $meta_key, true );
        $already_bookmarked = in_array( $post_id, $bookmarked_ids, true );

        if ( $already_bookmarked ) {
            $bookmarked_ids = array_values( array_diff( $bookmarked_ids, array( $post_id ) ) );
        } else {
            $bookmarked_ids[] = $post_id;
        }

        update_user_meta( $user_id, $meta_key, $bookmarked_ids );

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
                'posts_per_page' => 100,
                'orderby'        => 'post__in',
            ) );
            foreach ( $posts as $p ) {
                $liked[] = self::saved_post_summary( $p );
            }
        }

        if ( ! empty( $bookmarked_ids ) ) {
            $posts = get_posts( array(
                'post__in'       => $bookmarked_ids,
                'post_type'      => array( 'post', 'culture_quote', 'culture_post' ),
                'post_status'    => 'publish',
                'posts_per_page' => 100,
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
        $is_quote   = ( 'culture_quote' === $post->post_type );
        $is_community = ( 'culture_post' === $post->post_type );

        $base = array(
            'id'      => $post->ID,
            'type'    => $is_quote ? 'quote' : ( $is_community ? 'community' : 'article' ),
            'title'   => $post->post_title,
            'slug'    => $post->post_name,
            'excerpt' => wp_trim_words( wp_strip_all_tags( $post->post_content ), 20 ),
            'date'    => get_the_date( 'Y-m-d', $post ),
            'likes'   => (int) get_post_meta( $post->ID, '_culture_like_count', true ),
        );

        if ( $is_quote ) {
            $base['quoteAuthor'] = get_post_meta( $post->ID, '_quote_author', true ) ?: '';
            $base['quoteSource'] = get_post_meta( $post->ID, '_quote_source', true ) ?: '';
        }

        if ( $is_community ) {
            $base['templateType']   = get_post_meta( $post->ID, '_template_type', true ) ?: 'post';
            $base['communityTag']   = get_post_meta( $post->ID, '_culture_section_tag', true ) ?: '';
            $base['authorName']     = get_the_author_meta( 'display_name', $post->post_author );
            $base['authorUsername'] = get_the_author_meta( 'user_login', $post->post_author );
            $thumb = get_the_post_thumbnail_url( $post->ID, 'medium' );
            if ( $thumb ) { $base['featuredImage'] = $thumb; }
        }

        if ( ! $is_quote && ! $is_community ) {
            // Article
            $thumb = get_the_post_thumbnail_url( $post->ID, 'medium' );
            if ( $thumb ) { $base['featuredImage'] = $thumb; }
            $categories = get_the_category( $post->ID );
            if ( ! empty( $categories ) ) { $base['category'] = $categories[0]->name; }
            $author_id = $post->post_author;
            $base['author'] = array( 'name' => get_the_author_meta( 'display_name', $author_id ) );
            $base['readingTime'] = (int) get_post_meta( $post->ID, '_reading_time', true ) ?: null;
            $base['publishedAt'] = get_the_date( 'c', $post );
        }

        return $base;
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
     * POST /culture/v1/events/update-image
     * Update _culture_event_image_url on an existing event.
     * Body: { id: int, image_url: string }
     */
    public static function handle_update_event_image( WP_REST_Request $request ) {
        $post_id   = (int) $request->get_param( 'id' );
        $image_url = esc_url_raw( $request->get_param( 'image_url' ) );

        if ( ! $post_id || ! $image_url ) {
            return new WP_Error( 'bad_request', 'id and image_url are required.', array( 'status' => 400 ) );
        }
        $post = get_post( $post_id );
        if ( ! $post || $post->post_type !== 'culture_event' ) {
            return new WP_Error( 'not_found', 'Event not found.', array( 'status' => 404 ) );
        }
        update_post_meta( $post_id, '_culture_event_image_url', $image_url );
        return rest_ensure_response( array( 'success' => true, 'id' => $post_id ) );
    }

    /**
     * GET /culture/v1/events/missing-images
     * Return published culture_event posts that have no featured image and no _culture_event_image_url.
     * Query params: per_page (default 50), page (default 1).
     */
    public static function handle_list_events_missing_images( WP_REST_Request $request ) {
        $per_page = min( (int) ( $request->get_param( 'per_page' ) ?: 50 ), 100 );
        $page     = max( (int) ( $request->get_param( 'page' ) ?: 1 ), 1 );

        $args = array(
            'post_type'      => 'culture_event',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'meta_query'     => array(
                'relation' => 'OR',
                array( 'key' => '_culture_event_image_url', 'value' => '', 'compare' => '=' ),
                array( 'key' => '_culture_event_image_url', 'compare' => 'NOT EXISTS' ),
            ),
        );
        $query = new WP_Query( $args );
        $events = array();
        foreach ( $query->posts as $post ) {
            // Skip if it has a featured image.
            if ( has_post_thumbnail( $post->ID ) ) continue;
            $events[] = array(
                'id'          => $post->ID,
                'title'       => $post->post_title,
                'slug'        => $post->post_name,
                'attribution' => get_post_meta( $post->ID, '_culture_attribution', true ),
                'ticketing_url' => get_post_meta( $post->ID, '_culture_ticketing_url', true ),
            );
        }
        return rest_ensure_response( array(
            'events'    => $events,
            'total'     => $query->found_posts,
            'pages'     => $query->max_num_pages,
        ) );
    }

    /**
     * GET /culture/v1/events/external-images
     * Return published culture_event posts whose _culture_event_image_url is an
     * external URL (i.e. does not start with this site's upload directory or home_url).
     * Query params: per_page (default 50), page (default 1).
     */
    public static function handle_list_events_external_images( WP_REST_Request $request ) {
        $per_page   = min( (int) ( $request->get_param( 'per_page' ) ?: 50 ), 200 );
        $page       = max( (int) ( $request->get_param( 'page' )     ?: 1  ), 1  );
        $upload_dir = wp_upload_dir();
        $base_url   = trailingslashit( $upload_dir['baseurl'] );
        $home       = trailingslashit( home_url() );

        $args = array(
            'post_type'      => 'culture_event',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'meta_query'     => array(
                array(
                    'key'     => '_culture_event_image_url',
                    'value'   => '',
                    'compare' => '!=',
                ),
            ),
        );
        $query  = new WP_Query( $args );
        $events = array();
        foreach ( $query->posts as $post ) {
            $img = get_post_meta( $post->ID, '_culture_event_image_url', true );
            // Skip if already hosted on this WP install.
            if ( strpos( $img, $base_url ) === 0 || strpos( $img, $home ) === 0 ) {
                continue;
            }
            $events[] = array(
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'image_url' => $img,
            );
        }
        return rest_ensure_response( array(
            'events' => $events,
            'total'  => count( $events ),
        ) );
    }

    /**
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
        $ticketing_url  = esc_url_raw( $request->get_param( 'ticketing_url' ) );
        $tagline        = sanitize_text_field( $request->get_param( 'tagline' ) );
        $opening_hours  = sanitize_text_field( $request->get_param( 'opening_hours' ) );
        $attribution    = esc_url_raw( $request->get_param( 'attribution' ) );
        $image_url     = esc_url_raw( $request->get_param( 'image_url' ) );
        $interests           = (array) $request->get_param( 'interests' );
        $auto_publish        = (bool) $request->get_param( 'auto_publish' );
        $ai_generated_raw    = $request->get_param( 'ai_generated' );
        $ai_generated        = ( $ai_generated_raw === null ) ? true : (bool) $ai_generated_raw;
        $featured_image_id   = absint( $request->get_param( 'featured_image_id' ) );
        $submitter_name          = sanitize_text_field( $request->get_param( 'submitter_name' ) );
        $submitter_email         = sanitize_email( $request->get_param( 'submitter_email' ) );
        $organiser_directory_id  = absint( $request->get_param( 'organiser_directory_id' ) );

        if ( empty( $title ) || empty( $event_date ) ) {
            return new WP_Error( 'missing_fields', 'title and event_date are required.', array( 'status' => 400 ) );
        }

        // Deduplication: hash of normalised title + date + location.
        // Normalise title: lowercase, strip year numbers, strip noise words
        // (tickets, saturday, sunday, etc.), collapse whitespace.
        $norm_title = strtolower( trim( $title ) );
        $norm_title = preg_replace( '/\b(tickets?|saturday|sunday|monday|tuesday|wednesday|thursday|friday|buy now|register|free)\b/', '', $norm_title );
        $norm_title = preg_replace( '/\b20\d{2}\b/', '', $norm_title ); // strip years
        $norm_title = preg_replace( '/[^a-z0-9\s]/', '', $norm_title ); // strip punctuation
        $norm_title = preg_replace( '/\s+/', ' ', trim( $norm_title ) );
        $dedup_hash = md5( $norm_title . '|' . $event_date . '|' . strtolower( trim( $location ) ) );
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
        update_post_meta( $post_id, '_culture_opening_hours',   $opening_hours );
        update_post_meta( $post_id, '_culture_attribution',     $attribution );
        update_post_meta( $post_id, '_culture_event_image_url', $image_url );
        update_post_meta( $post_id, '_culture_is_featured',     '0' );
        update_post_meta( $post_id, '_culture_ai_generated',    $ai_generated ? '1' : '0' );
        update_post_meta( $post_id, '_culture_event_dedup_hash', $dedup_hash );
        if ( $organiser_directory_id > 0 ) {
            update_post_meta( $post_id, '_culture_event_organiser_id', $organiser_directory_id );
        }

        // Set featured image if a valid WP media attachment ID was provided.
        if ( $featured_image_id > 0 && get_post( $featured_image_id ) ) {
            set_post_thumbnail( $post_id, $featured_image_id );
        }

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

        $opt_in         = $request->get_param( 'directory_opt_in' );
        $was_opted_in   = get_user_meta( $user_id, '_culture_directory_opt_in', true ) === '1';
        $new_opt_in_val = ( $opt_in === '1' || $opt_in === true ) ? '1' : '0';
        update_user_meta( $user_id, '_culture_directory_opt_in',     $new_opt_in_val );
        update_user_meta( $user_id, '_culture_directory_bio',         sanitize_textarea_field( (string) $request->get_param( 'directory_bio' ) ) );
        update_user_meta( $user_id, '_culture_directory_disciplines', sanitize_text_field( (string) $request->get_param( 'directory_disciplines' ) ) );
        update_user_meta( $user_id, '_culture_directory_instagram',   sanitize_text_field( (string) $request->get_param( 'directory_instagram' ) ) );
        update_user_meta( $user_id, '_culture_directory_twitter',     sanitize_text_field( (string) $request->get_param( 'directory_twitter' ) ) );
        update_user_meta( $user_id, '_culture_directory_linkedin',    sanitize_text_field( (string) $request->get_param( 'directory_linkedin' ) ) );
        update_user_meta( $user_id, '_culture_directory_website',     sanitize_text_field( (string) $request->get_param( 'directory_website' ) ) );

        // Award reputation the first time a user opts into the directory.
        if ( '1' === $new_opt_in_val && ! $was_opted_in && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'directory_opt_in' );
        }

        return rest_ensure_response( array( 'ok' => true ) );
    }

    /**
     * GET /culture/v1/user/directory
     * Returns the Connect directory settings for the given user_id.
     */
    public static function handle_get_directory_profile( $request ) {
        global $wpdb;
        $user_id = (int) $request->get_param( 'user_id' );

        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT ID FROM {$wpdb->users} WHERE ID = %d LIMIT 1",
            $user_id
        ) );
        if ( ! $exists ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $keys = array(
            '_culture_directory_opt_in',
            '_culture_directory_bio',
            '_culture_directory_disciplines',
            '_culture_directory_instagram',
            '_culture_directory_twitter',
            '_culture_directory_linkedin',
            '_culture_directory_website',
        );
        $placeholders = implode( ',', array_fill( 0, count( $keys ), '%s' ) );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->usermeta}
             WHERE user_id = %d AND meta_key IN ({$placeholders})",
            array_merge( array( $user_id ), $keys )
        ), ARRAY_A );

        $map = array_column( $rows, 'meta_value', 'meta_key' );
        $get  = fn( $k, $default = '' ) => $map[ $k ] ?? $default;

        return rest_ensure_response( array(
            'directory_opt_in'      => $get( '_culture_directory_opt_in' ) === '1',
            'directory_bio'         => $get( '_culture_directory_bio' ),
            'directory_disciplines' => $get( '_culture_directory_disciplines' ),
            'directory_instagram'   => $get( '_culture_directory_instagram' ),
            'directory_twitter'     => $get( '_culture_directory_twitter' ),
            'directory_linkedin'    => $get( '_culture_directory_linkedin' ),
            'directory_website'     => $get( '_culture_directory_website' ),
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

        if ( empty( $users ) ) {
            return rest_ensure_response( array() );
        }

        // Fetch all required meta keys in one query instead of 9 get_user_meta()
        // calls per user (up to 1,400 individual meta lookups at per_page=200).
        global $wpdb;
        $user_ids  = array_map( fn( $u ) => (int) $u->ID, $users );
        $id_list   = implode( ',', $user_ids );
        $meta_keys = array(
            '_culture_membership_tier',
            '_culture_occupation',
            '_culture_city',
            '_culture_country_of_residence',
            '_culture_directory_bio',
            '_culture_directory_disciplines',
            '_culture_directory_instagram',
            '_culture_directory_twitter',
            '_culture_directory_linkedin',
            '_culture_directory_website',
        );
        $keys_in   = implode( ',', array_map( fn( $k ) => "'" . esc_sql( $k ) . "'", $meta_keys ) );
        $rows      = $wpdb->get_results(
            "SELECT user_id, meta_key, meta_value FROM {$wpdb->usermeta}
             WHERE user_id IN ({$id_list}) AND meta_key IN ({$keys_in})",
            ARRAY_A
        );

        $meta_map = array();
        foreach ( $rows as $row ) {
            $meta_map[ $row['user_id'] ][ $row['meta_key'] ] = $row['meta_value'];
        }

        $members = array_map( function( $user ) use ( $meta_map ) {
            $m = $meta_map[ $user->ID ] ?? array();
            return array(
                'id'                     => $user->ID,
                'username'               => $user->user_nicename,
                'display_name'           => $user->display_name,
                'occupation'             => $m['_culture_occupation']             ?? '',
                'city'                   => $m['_culture_city']                   ?? '',
                'country_of_residence'   => $m['_culture_country_of_residence']   ?? '',
                'tier'                   => $m['_culture_membership_tier']        ?? 'citizen',
                'directory_bio'          => $m['_culture_directory_bio']          ?? '',
                'directory_disciplines'  => $m['_culture_directory_disciplines']  ?? '',
                'directory_instagram'    => $m['_culture_directory_instagram']    ?? '',
                'directory_twitter'      => $m['_culture_directory_twitter']      ?? '',
                'directory_linkedin'     => $m['_culture_directory_linkedin']     ?? '',
                'directory_website'      => $m['_culture_directory_website']      ?? '',
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

    /**
     * POST /culture/v1/community/poll-vote
     * Vote on a poll post. Validates expiry and prevents double-voting.
     */
    public static function handle_poll_vote( WP_REST_Request $request ) {
        $post_id      = (int) $request->get_param( 'post_id' );
        $option_index = (int) $request->get_param( 'option_index' );
        $user_id      = (int) $request->get_param( 'user_id' );

        if ( ! $user_id ) {
            return new WP_Error( 'missing_user', 'user_id is required.', array( 'status' => 400 ) );
        }
        if ( ! get_user_by( 'id', $user_id ) ) {
            return new WP_Error( 'invalid_user', 'User not found.', array( 'status' => 400 ) );
        }

        $post = get_post( $post_id );
        if ( ! $post || $post->post_type !== 'culture_post' ) {
            return new WP_Error( 'invalid_post', 'Post not found.', array( 'status' => 404 ) );
        }

        $template = get_post_meta( $post_id, '_template_type', true );
        if ( $template !== 'poll' ) {
            return new WP_Error( 'not_poll', 'This post is not a poll.', array( 'status' => 400 ) );
        }

        // Check expiry.
        $expires = get_post_meta( $post_id, '_poll_expires_at', true );
        if ( $expires && strtotime( $expires ) < time() ) {
            return new WP_Error( 'poll_expired', 'This poll has ended.', array( 'status' => 400 ) );
        }

        // Check double-voting.
        $voters = json_decode( get_post_meta( $post_id, '_poll_voters', true ) ?: '[]', true ) ?: array();
        if ( in_array( $user_id, $voters, true ) ) {
            return new WP_Error( 'already_voted', 'You have already voted.', array( 'status' => 409 ) );
        }

        // Get options and validate index.
        $options = json_decode( get_post_meta( $post_id, '_poll_options', true ) ?: '[]', true ) ?: array();
        if ( $option_index < 0 || $option_index >= count( $options ) ) {
            return new WP_Error( 'invalid_option', 'Invalid option.', array( 'status' => 400 ) );
        }

        // Increment vote.
        $options[ $option_index ]['votes'] = ( $options[ $option_index ]['votes'] ?? 0 ) + 1;
        update_post_meta( $post_id, '_poll_options', wp_json_encode( $options ) );

        // Record voter.
        $voters[] = $user_id;
        update_post_meta( $post_id, '_poll_voters', wp_json_encode( $voters ) );

        // Award reputation + credits for participation.
        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_reputation( $user_id, Culture_Gamification::get_point_value( 'poll_vote' ), 'poll_vote', $post_id );
            Culture_Gamification::award_credits( $user_id, Culture_Gamification::get_credit_bonus( 'poll_vote' ), 'poll_vote', $post_id );
        }

        return rest_ensure_response( array(
            'success' => true,
            'options' => $options,
            'voted'   => $option_index,
        ) );
    }

    // -------------------------------------------------------------------------
    // Phase 5 — Public Profiles
    // -------------------------------------------------------------------------

    /**
     * GET /culture/v1/member/{username}
     * Returns public-safe profile data for the given username. No auth required.
     */
    public static function handle_get_public_profile( $request ) {
        $username = sanitize_user( $request->get_param( 'username' ) );

        $user = get_user_by( 'login', $username );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        $uid        = $user->ID;
        $reputation = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation( $uid ) : 0;

        return rest_ensure_response( array(
            'id'              => $uid,
            'username'        => $user->user_login,
            'display_name'    => $user->display_name,
            'avatar_url'      => get_user_meta( $uid, '_culture_avatar_url', true ) ?: '',
            'cover_photo_url' => get_user_meta( $uid, '_culture_cover_photo_url', true ) ?: '',
            'bio'             => get_user_meta( $uid, '_culture_directory_bio', true ) ?: '',
            'city'            => get_user_meta( $uid, '_culture_city', true ) ?: '',
            'country'         => get_user_meta( $uid, '_culture_country_of_residence', true ) ?: '',
            'occupation'      => get_user_meta( $uid, '_culture_occupation', true ) ?: '',
            'tier'            => get_user_meta( $uid, '_culture_membership_tier', true ) ?: 'citizen',
            'reputation'      => $reputation,
            'reputation_tier' => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_reputation_tier( $reputation ) : 'member',
            'badges'          => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $uid ) : array(),
            'interests'       => json_decode( get_user_meta( $uid, '_culture_interests', true ) ?: '[]', true ) ?: array(),
            'joined'          => date( 'Y-m-d', strtotime( $user->user_registered ) ),
            'post_count'      => (int) count_user_posts( $uid, 'culture_post' ),
            'followers_count' => class_exists( 'Culture_Follows' ) ? Culture_Follows::followers_count( $uid ) : 0,
            'following_count' => class_exists( 'Culture_Follows' ) ? Culture_Follows::following_count( $uid ) : 0,
        ) );
    }

    /**
     * GET /culture/v1/community/posts
     * Returns published culture_post entries, optionally filtered by author_id
     * and/or template_type. No auth required.
     */
    public static function handle_get_community_posts( $request ) {
        $author_id     = (int) $request->get_param( 'author_id' );
        $template_type = sanitize_text_field( $request->get_param( 'template_type' ) );
        $per_page      = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ) );
        $page          = max( 1, (int) $request->get_param( 'page' ) );

        $query_args = array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'meta_query'     => array( 'relation' => 'AND' ),
        );

        if ( $author_id > 0 ) {
            $query_args['meta_query'][] = array(
                'key'     => 'community_author_id',
                'value'   => $author_id,
                'compare' => '=',
                'type'    => 'NUMERIC',
            );
        }

        if ( '' !== $template_type ) {
            $query_args['meta_query'][] = array(
                'key'     => '_template_type',
                'value'   => $template_type,
                'compare' => '=',
            );
        }

        $posts  = get_posts( $query_args );

        // Prime the WP object cache for all post metas in one SQL query so the
        // get_post_meta() calls below are served from memory, not individual DB queries.
        if ( ! empty( $posts ) ) {
            update_meta_cache( 'post', wp_list_pluck( $posts, 'ID' ) );
        }

        $result = array_map( array( __CLASS__, 'format_community_post_row' ), $posts );

        return rest_ensure_response( $result );
    }

    // Shared per-post field shape (snake_case, web's community-post listing shape)
    // — used by handle_get_community_posts() and the portfolio pinned-posts resolver
    // so both surfaces render identically.
    private static function format_community_post_row( WP_Post $post ): array {
        $pid = $post->ID;
        return array(
            'id'             => $pid,
            'slug'           => $post->post_name,
            'date'           => get_the_date( 'c', $pid ),
            'text'           => wp_strip_all_tags( $post->post_content ),
            'image_url'      => get_post_meta( $pid, 'community_image_url', true ) ?: '',
            'tag'            => get_post_meta( $pid, 'community_tag', true ) ?: '',
            'region'         => get_post_meta( $pid, 'community_region', true ) ?: '',
            'author_name'    => get_post_meta( $pid, 'community_author_name', true ) ?: '',
            'author_username' => get_post_meta( $pid, 'community_author_username', true ) ?: '',
            'author_tier'    => get_post_meta( $pid, 'community_author_tier', true ) ?: '',
            'author_avatar'  => get_post_meta( $pid, 'community_author_avatar', true ) ?: '',
            'template_type'  => get_post_meta( $pid, '_template_type', true ) ?: 'post',
            'star_rating'    => (int) get_post_meta( $pid, '_star_rating', true ),
            'location_name'  => get_post_meta( $pid, '_location_name', true ) ?: '',
            'gallery_images' => json_decode( get_post_meta( $pid, '_gallery_images', true ) ?: '[]', true ),
            'video_url'      => get_post_meta( $pid, '_video_url', true ) ?: '',
            'food_dish_name' => get_post_meta( $pid, '_food_dish_name', true ) ?: '',
            'showcase_collaborator_username' => get_post_meta( $pid, '_showcase_collaborator_username', true ) ?: '',
            'reactions'      => array(
                'love' => (int) get_post_meta( $pid, 'reaction_love', true ),
                'fire' => (int) get_post_meta( $pid, 'reaction_fire', true ),
                'clap' => (int) get_post_meta( $pid, 'reaction_clap', true ),
            ),
            'comment_count'  => (int) $post->comment_count,
        );
    }

    // Resolves pinned community-post IDs into the same row shape as
    // handle_get_community_posts(), preserving the caller's pin order.
    private static function resolve_pinned_posts_web( array $post_ids ): array {
        if ( empty( $post_ids ) ) {
            return array();
        }

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'post__in'       => $post_ids,
            'orderby'        => 'post__in',
            'posts_per_page' => count( $post_ids ),
        ) );

        return array_map( array( __CLASS__, 'format_community_post_row' ), $query->posts );
    }

    /**
     * GET /culture/v1/user/portfolio
     * Returns pinned posts and portfolio items for the given user. Requires Bearer auth.
     */
    public static function handle_get_portfolio( $request ) {
        global $wpdb;
        $user_id = (int) $request->get_param( 'user_id' );

        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT ID FROM {$wpdb->users} WHERE ID = %d LIMIT 1",
            $user_id
        ) );
        if ( ! $exists ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->usermeta}
             WHERE user_id = %d AND meta_key IN ('_portfolio_pinned_posts','_portfolio_items')",
            $user_id
        ), ARRAY_A );

        $map          = array_column( $rows, 'meta_value', 'meta_key' );
        $pinned_posts = json_decode( $map['_portfolio_pinned_posts'] ?? '[]', true ) ?: array();
        $items        = json_decode( $map['_portfolio_items']        ?? '[]', true ) ?: array();

        return rest_ensure_response( array(
            'pinned_posts'      => $pinned_posts,
            'items'             => $items,
            'pinned_posts_data' => self::resolve_pinned_posts_web( array_map( 'absint', $pinned_posts ) ),
        ) );
    }

    /**
     * POST /culture/v1/user/portfolio
     * Saves pinned posts and portfolio items for the given user. Requires Bearer auth.
     */
    public static function handle_save_portfolio( $request ) {
        $user_id      = (int) $request->get_param( 'user_id' );
        $pinned_posts = $request->get_param( 'pinned_posts' );
        $items        = $request->get_param( 'items' );

        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        // Only touch the keys that were actually sent — a caller that only
        // wants to update pinned posts (or only items) must not blow away
        // the other half of the portfolio by omitting it.
        if ( is_array( $pinned_posts ) ) {
            $pinned_posts = array_values( array_map( 'absint', $pinned_posts ) );
            update_user_meta( $user_id, '_portfolio_pinned_posts', wp_json_encode( $pinned_posts ) );
        }
        if ( is_array( $items ) ) {
            update_user_meta( $user_id, '_portfolio_items', wp_json_encode( $items ) );
        }

        return rest_ensure_response( array( 'success' => true ) );
    }

    /**
     * POST /culture/v1/user/portfolio/pin
     * Toggles a single community post in/out of a user's pinned set without
     * touching their manually-added items. Mirrors the mobile
     * Culture_Mobile_API::handle_pin_portfolio_post() but takes an explicit
     * user_id (API-key auth — caller is the trusted Next.js proxy).
     */
    public static function handle_pin_portfolio_post( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
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

    // ── Phase 6: Partner Perks & Wallet Handlers ─────────────────────────────

    public static function handle_list_perks( $request ) {
        return rest_ensure_response( Culture_Perks::get_perks() );
    }

    public static function handle_redeem_perk( $request ) {
        $user_id       = (int) $request->get_param( 'user_id' );
        $perk_id       = (int) $request->get_param( 'perk_id' );
        $step_up_token = (string) $request->get_param( 'step_up_token' );
        if ( ! $step_up_token || ! Culture_WebAuthn::validate_step_up( $user_id, $step_up_token ) ) {
            return new WP_Error( 'step_up_required', 'Passkey step-up verification required.', array( 'status' => 403 ) );
        }
        $result = Culture_Perks::redeem_perk( $user_id, $perk_id );
        if ( is_wp_error( $result ) ) return $result;
        return rest_ensure_response( $result );
    }

    public static function handle_verify_qr( $request ) {
        return rest_ensure_response( Culture_Perks::verify_qr( $request->get_param( 'token' ) ) );
    }

    public static function handle_wallet_balance( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $credits         = Culture_Gamification::get_credits( $user_id );
        $daily_remaining = Culture_Gamification::get_daily_credits_remaining( $user_id );
        $earned_today    = Culture_Gamification::DAILY_CREDIT_CAP - $daily_remaining;
        $credits_per_gbp = max( 1, (int) get_option( 'culture_credits_per_gbp', Culture_Perks::DEFAULT_CREDITS_PER_GBP ) );
        $credit_value_gbp_pence = (int) round( ( $credits / $credits_per_gbp ) * 100 );

        return rest_ensure_response( array(
            'credits'               => $credits,
            'earned_today'          => $earned_today,
            'daily_remaining'       => $daily_remaining,
            'credit_value_gbp'      => $credit_value_gbp_pence,
            'credits_per_gbp'       => $credits_per_gbp,
        ) );
    }

    public static function handle_wallet_history( $request ) {
        global $wpdb;
        $user_id  = (int) $request->get_param( 'user_id' );
        $per_page = min( (int) $request->get_param( 'per_page' ), 100 );
        $page     = max( (int) $request->get_param( 'page' ), 1 );
        $offset   = ( $page - 1 ) * $per_page;

        if ( ! get_userdata( $user_id ) ) {
            return new WP_Error( 'not_found', 'User not found.', array( 'status' => 404 ) );
        }

        $table = $wpdb->prefix . 'culture_credit_ledger';
        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND type = 'credit'", $user_id
        ) );
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT id, amount, source, source_id, created_at FROM {$table}
             WHERE user_id = %d AND type = 'credit' ORDER BY id DESC LIMIT %d OFFSET %d",
            $user_id, $per_page, $offset
        ), ARRAY_A ) ?: array();

        return rest_ensure_response( array(
            'entries'  => $rows,
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => (int) ceil( $total / max( 1, $per_page ) ),
        ) );
    }

    public static function handle_wallet_cashout( $request ) {
        $user_id       = (int) $request->get_param( 'user_id' );
        $step_up_token = (string) $request->get_param( 'step_up_token' );
        if ( ! $step_up_token || ! Culture_WebAuthn::validate_step_up( $user_id, $step_up_token ) ) {
            return new WP_Error( 'step_up_required', 'Passkey step-up verification required.', array( 'status' => 403 ) );
        }
        $result = Culture_Perks::request_cashout(
            $user_id,
            (int) $request->get_param( 'credits' ),
            $request->get_param( 'method' ),
            $request->get_param( 'account_name' ),
            $request->get_param( 'account_ref' ),
            $request->get_param( 'currency' ) ?: 'GBP'
        );
        if ( is_wp_error( $result ) ) return $result;
        return rest_ensure_response( $result );
    }

    public static function handle_cashout_queue( $request ) {
        return rest_ensure_response( Culture_Perks::get_cashout_queue(
            sanitize_key( $request->get_param( 'status' ) ?: 'pending' )
        ) );
    }

    public static function handle_cashout_approve( $request ) {
        $result = Culture_Perks::approve_cashout(
            (int) $request->get_param( 'redemption_id' ),
            (int) $request->get_param( 'admin_id' )
        );
        if ( is_wp_error( $result ) ) return $result;
        return rest_ensure_response( $result );
    }

    public static function handle_cashout_reject( $request ) {
        $result = Culture_Perks::reject_cashout(
            (int) $request->get_param( 'redemption_id' ),
            (int) $request->get_param( 'admin_id' ),
            $request->get_param( 'reason' ) ?: ''
        );
        if ( is_wp_error( $result ) ) return $result;
        return rest_ensure_response( $result );
    }

    public static function handle_admin_list_perks( $request ) {
        $status = sanitize_key( $request->get_param( 'status' ) ?: '' );
        $args   = array( 'limit' => 200, 'offset' => 0 );
        if ( $status ) {
            $args['status'] = $status;
        } else {
            $args['status'] = '';
        }
        return rest_ensure_response( Culture_Perks::get_perks( $args ) );
    }

    public static function handle_admin_create_perk( $request ) {
        global $wpdb;
        $data = self::_sanitize_perk_data( $request );
        if ( is_wp_error( $data ) ) return $data;
        $table = $wpdb->prefix . 'culture_partner_perks';
        if ( ! $wpdb->insert( $table, $data['values'], $data['formats'] ) ) {
            return new WP_Error( 'db_error', 'Could not create perk.', array( 'status' => 500 ) );
        }
        return rest_ensure_response( array( 'success' => true, 'perk' => Culture_Perks::get_perk( (int) $wpdb->insert_id ) ) );
    }

    public static function handle_admin_update_perk( $request ) {
        global $wpdb;
        $perk_id = (int) $request->get_param( 'id' );
        if ( ! Culture_Perks::get_perk( $perk_id ) ) {
            return new WP_Error( 'not_found', 'Perk not found.', array( 'status' => 404 ) );
        }
        $data = self::_sanitize_perk_data( $request );
        if ( is_wp_error( $data ) ) return $data;
        $wpdb->update( $wpdb->prefix . 'culture_partner_perks', $data['values'], array( 'id' => $perk_id ), $data['formats'], array( '%d' ) );
        return rest_ensure_response( array( 'success' => true, 'perk' => Culture_Perks::get_perk( $perk_id ) ) );
    }

    public static function handle_admin_delete_perk( $request ) {
        global $wpdb;
        $perk_id = (int) $request->get_param( 'id' );
        if ( ! Culture_Perks::get_perk( $perk_id ) ) {
            return new WP_Error( 'not_found', 'Perk not found.', array( 'status' => 404 ) );
        }
        $wpdb->update( $wpdb->prefix . 'culture_partner_perks', array( 'status' => 'paused' ), array( 'id' => $perk_id ), array( '%s' ), array( '%d' ) );
        return rest_ensure_response( array( 'success' => true, 'perk_id' => $perk_id, 'status' => 'paused' ) );
    }

    public static function handle_user_redemptions( $request ) {
        $user_id = (int) $request->get_param( 'user_id' );
        $status  = $request->get_param( 'status' ) ?: null;
        $rows    = Culture_Perks::get_user_redemptions( $user_id, $status );
        $perks_table = $GLOBALS['wpdb']->prefix . 'culture_partner_perks';
        foreach ( $rows as &$row ) {
            if ( (int) $row['perk_id'] > 0 ) {
                $perk = Culture_Perks::get_perk( (int) $row['perk_id'] );
                $row['perk_title'] = $perk ? $perk['title'] : '';
                $row['perk_description'] = $perk ? $perk['description'] : '';
            }
        }
        return rest_ensure_response( $rows );
    }

    private static function _sanitize_perk_data( $request ) {
        $title = sanitize_text_field( $request->get_param( 'title' ) ?: '' );
        if ( empty( $title ) ) {
            return new WP_Error( 'missing_title', 'Perk title is required.', array( 'status' => 400 ) );
        }
        $allowed = array( 'active', 'paused', 'expired' );
        $status  = sanitize_key( $request->get_param( 'status' ) ?: 'active' );
        if ( ! in_array( $status, $allowed, true ) ) $status = 'active';
        return array(
            'values'  => array(
                'title'                => $title,
                'description'          => sanitize_textarea_field( $request->get_param( 'description' ) ?: '' ),
                'credit_cost'          => max( 0, (int) $request->get_param( 'credit_cost' ) ),
                'min_spend'            => max( 0, (int) $request->get_param( 'min_spend' ) ),
                'min_spend_currency'   => strtoupper( substr( sanitize_text_field( $request->get_param( 'min_spend_currency' ) ?: 'GBP' ), 0, 3 ) ),
                'expiry_days'          => max( 1, (int) $request->get_param( 'expiry_days' ) ),
                'max_per_user'         => max( 0, (int) $request->get_param( 'max_per_user' ) ),
                'max_total'            => max( 0, (int) $request->get_param( 'max_total' ) ),
                'status'               => $status,
                'partner_directory_id' => max( 0, (int) $request->get_param( 'partner_directory_id' ) ),
                'partner_vendor_id'    => max( 0, (int) $request->get_param( 'partner_vendor_id' ) ),
                'min_rep_tier'         => in_array( $request->get_param( 'min_rep_tier' ), array( 'member', 'culture-contributor', 'taste-maker', 'culture-authority', 'culture-icon' ), true )
                                          ? $request->get_param( 'min_rep_tier' ) : 'member',
            ),
            'formats' => array( '%s', '%s', '%d', '%d', '%s', '%d', '%d', '%d', '%s', '%d', '%d', '%s' ),
        );
    }

    /* ——————————————————————————————————————
     *  Phase 9 — Event QR Check-in handlers
     * —————————————————————————————————————— */

    /**
     * POST /culture/v1/events/{id}/generate-checkin-token
     * Generates (or regenerates) a check-in token for the event and returns the QR URL.
     */
    public static function handle_generate_checkin_token( $request ) {
        $event_id = (int) $request['id'];
        $post     = get_post( $event_id );
        if ( ! $post || 'culture_event' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Event not found.', array( 'status' => 404 ) );
        }
        $token = bin2hex( random_bytes( 16 ) );
        update_post_meta( $event_id, '_event_checkin_token_hash', hash( 'sha256', $token ) );
        $url = "https://web.themoveee.com/events/checkin?id={$event_id}&t={$token}";
        return rest_ensure_response( array(
            'token'       => $token,
            'checkin_url' => $url,
            'event_id'    => $event_id,
        ) );
    }

    /**
     * POST /culture/v1/events/self-checkin
     * Verifies the token and records a check-in for the given user.
     */
    public static function handle_self_checkin( $request ) {
        global $wpdb;

        $event_id = (int) $request->get_param( 'event_id' );
        $token    = sanitize_text_field( $request->get_param( 'token' ) );
        $user_id  = (int) $request->get_param( 'user_id' );

        if ( ! $event_id || ! $token || ! $user_id ) {
            return new WP_Error( 'missing_params', 'event_id, token, and user_id are required.', array( 'status' => 400 ) );
        }

        $post = get_post( $event_id );
        if ( ! $post || 'culture_event' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Event not found.', array( 'status' => 404 ) );
        }

        // Verify token.
        $stored_hash = get_post_meta( $event_id, '_event_checkin_token_hash', true );
        if ( empty( $stored_hash ) || hash( 'sha256', $token ) !== $stored_hash ) {
            return new WP_Error( 'invalid_token', 'Invalid check-in token.', array( 'status' => 403 ) );
        }

        // Check event date window (within 1 day before or after).
        $start_date = get_post_meta( $event_id, '_event_start_date', true );
        if ( $start_date ) {
            $event_ts = strtotime( $start_date );
            $now_ts   = current_time( 'timestamp' );
            if ( abs( $now_ts - $event_ts ) > DAY_IN_SECONDS ) {
                return new WP_Error( 'outside_window', 'Check-in is only available on the day of the event.', array( 'status' => 400 ) );
            }
        }

        // Check for duplicate check-in.
        $table     = $wpdb->prefix . 'culture_attendance';
        $existing  = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE user_id = %d AND event_id = %d AND status = 'checked_in' LIMIT 1",
            $user_id, $event_id
        ) );
        if ( $existing ) {
            return rest_ensure_response( array(
                'already_checked_in' => true,
                'message'            => 'You have already checked in to this event.',
            ) );
        }

        // Insert check-in record.
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

        // Award reputation and credits directly — the previous do_action() hooks
        // ('culture_award_points' / 'culture_award_credits') had no listeners
        // anywhere in the codebase, so check-ins were silently awarding 0
        // reputation despite the response message claiming otherwise.
        $rep_earned     = Culture_Gamification::get_point_value( 'event_checkin' );
        $credits_earned = Culture_Gamification::get_credit_bonus( 'event_checkin' );
        Culture_Gamification::award_reputation( $user_id, $rep_earned, 'event_checkin', $event_id );
        Culture_Gamification::award_credits( $user_id, $credits_earned, 'event_checkin', $event_id );

        return rest_ensure_response( array(
            'success'        => true,
            'message'        => "Check-in successful! You earned {$rep_earned} points and {$credits_earned} credits.",
            'rep_earned'     => $rep_earned,
            'credits_earned' => $credits_earned,
        ) );
    }

    /* ——————————————————————————————————————
     *  Phase 9 — Admin meta box for event QR
     * —————————————————————————————————————— */

    public static function add_event_checkin_metabox() {
        add_meta_box(
            'culture-event-checkin',
            'Event Check-in QR',
            array( __CLASS__, 'render_event_checkin_metabox' ),
            'culture_event',
            'side',
            'high'
        );
    }

    public static function render_event_checkin_metabox( $post ) {
        $token_hash = get_post_meta( $post->ID, '_event_checkin_token_hash', true );
        $has_token  = ! empty( $token_hash );
        ?>
        <div id="culture-checkin-box">
          <?php if ( $has_token ) : ?>
            <p style="color:green">&#10003; QR token generated</p>
          <?php endif; ?>
          <button type="button" class="button" onclick="cultureGenerateCheckinToken(<?php echo (int) $post->ID; ?>)">
            <?php echo $has_token ? 'Regenerate QR Token' : 'Generate QR Token'; ?>
          </button>
          <div id="culture-checkin-qr-result" style="margin-top:10px"></div>
        </div>
        <script>
        function cultureGenerateCheckinToken(eventId) {
          fetch(ajaxurl + '?action=culture_generate_checkin_token&event_id=' + eventId + '&nonce=<?php echo wp_create_nonce( 'culture_checkin_nonce' ); ?>', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (d.success) {
                document.getElementById('culture-checkin-qr-result').innerHTML =
                  '<p><strong>Check-in URL:</strong><br><small>' + d.data.checkin_url + '</small></p>' +
                  '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(d.data.checkin_url) + '" style="max-width:200px;margin-top:8px">';
              }
            });
        }
        </script>
        <?php
    }

    public static function ajax_generate_checkin_token() {
        check_ajax_referer( 'culture_checkin_nonce', 'nonce' );
        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error( 'Unauthorized' );
        }
        $event_id = (int) $_POST['event_id'];
        $token    = bin2hex( random_bytes( 16 ) );
        update_post_meta( $event_id, '_event_checkin_token_hash', hash( 'sha256', $token ) );
        $url = "https://web.themoveee.com/events/checkin?id={$event_id}&t={$token}";
        wp_send_json_success( array( 'checkin_url' => $url, 'token' => $token ) );
    }
}
