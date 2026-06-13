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
                'text'   => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
                'author' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'source' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
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

        // Portfolio
        register_rest_route( 'culture/v1', '/mobile/portfolio', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_portfolio' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'user_id' => array( 'default' => 0, 'sanitize_callback' => 'absint' ),
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
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
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

        register_rest_route( 'culture/v1', '/mobile/cart', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_add_to_cart' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'product_id' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                'quantity'   => array( 'default' => 1,    'sanitize_callback' => 'absint' ),
            ),
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

        $liked_ids = (array) get_user_meta( $user_id, '_culture_liked_posts', true );

        $posts = array_map( function( $post ) use ( $liked_ids ) {
            return self::format_community_post( $post, $liked_ids );
        }, $query->posts );

        return rest_ensure_response( $posts );
    }

    const SECTION_TAGS = array( 'Music', 'Fashion', 'Art', 'Film', 'Food', 'Sport', 'Travel', 'Ideas', 'Literature', 'Design', 'Tech' );

    const UPLOAD_ALLOWED_TYPES = array( 'image/jpeg', 'image/png', 'image/webp', 'image/gif' );
    const UPLOAD_MAX_BYTES     = 8 * 1024 * 1024; // 8 MB, matches web's limit.

    /**
     * Mobile community image upload — accepts a multipart `file` field,
     * stores it as a WP attachment, and returns its URL for use as
     * `image_url` on /community/submit. Mirrors web's
     * /api/community/upload-image (without the WebP re-compression step).
     */
    public static function handle_upload_image( $request ) {
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

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        // media_handle_upload() reads from $_FILES — the REST request's file
        // params are sourced from there, so this is already populated.
        $_FILES['file']['name'] = 'community-' . time() . '-' . sanitize_file_name( $file['name'] );

        $attachment_id = media_handle_upload( 'file', 0, array(), array( 'test_form' => false ) );

        if ( is_wp_error( $attachment_id ) ) {
            return new WP_Error( 'upload_failed', $attachment_id->get_error_message(), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array(
            'url' => wp_get_attachment_url( $attachment_id ),
        ) );
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
            return new WP_Error( 'links_not_allowed', 'Connect Citizen members cannot post links.', array( 'status' => 403 ) );
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

        $review_days = (int) get_option( 'culture_new_member_review_days', 7 );
        $user        = get_userdata( $user_id );
        $age_days    = (int) floor( ( time() - strtotime( $user->user_registered ) ) / DAY_IN_SECONDS );
        $status      = ( $review_days > 0 && $age_days < $review_days ) ? 'pending' : 'publish';

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
            update_post_meta( $post_id, '_community_image_url', $image );
        }

        if ( $tag ) {
            update_post_meta( $post_id, 'community_tag', $tag );
        }

        // Phase 4: Save template-specific meta.
        $template = sanitize_key( $request->get_param( 'template_type' ) ?: 'post' );
        $allowed_templates = array( 'post', 'hidden-gem', 'cultural-take', 'food-review', 'creative-showcase', 'poll', 'itinerary' );
        if ( in_array( $template, $allowed_templates, true ) ) {
            update_post_meta( $post_id, '_template_type', $template );
        }

        if ( $request->get_param( 'linked_directory_id' ) ) {
            update_post_meta( $post_id, '_linked_directory_id', (int) $request->get_param( 'linked_directory_id' ) );
        }
        if ( in_array( $template, array( 'hidden-gem', 'food-review' ), true ) ) {
            if ( $request->get_param( 'star_rating' ) ) {
                update_post_meta( $post_id, '_star_rating', max( 1, min( 5, (int) $request->get_param( 'star_rating' ) ) ) );
            }
            if ( $request->get_param( 'location_name' ) ) {
                update_post_meta( $post_id, '_location_name', sanitize_text_field( $request->get_param( 'location_name' ) ) );
            }
            if ( $request->get_param( 'location_lat' ) ) {
                update_post_meta( $post_id, '_location_lat', (float) $request->get_param( 'location_lat' ) );
            }
            if ( $request->get_param( 'location_lng' ) ) {
                update_post_meta( $post_id, '_location_lng', (float) $request->get_param( 'location_lng' ) );
            }
        }
        if ( $template === 'food-review' ) {
            if ( $request->get_param( 'food_dish_name' ) ) {
                update_post_meta( $post_id, '_food_dish_name', sanitize_text_field( $request->get_param( 'food_dish_name' ) ) );
            }
            update_post_meta( $post_id, '_food_rating_taste', max( 1, min( 5, (int) $request->get_param( 'food_rating_taste' ) ) ) );
            update_post_meta( $post_id, '_food_rating_value', max( 1, min( 5, (int) $request->get_param( 'food_rating_value' ) ) ) );
            update_post_meta( $post_id, '_food_rating_vibe', max( 1, min( 5, (int) $request->get_param( 'food_rating_vibe' ) ) ) );
        }
        if ( $template === 'poll' ) {
            $poll_options = $request->get_param( 'poll_options' );
            if ( is_array( $poll_options ) ) {
                $clean_options = array_map( function( $opt ) {
                    return array( 'text' => sanitize_text_field( $opt['text'] ?? '' ), 'votes' => 0 );
                }, array_slice( $poll_options, 0, 4 ) );
                update_post_meta( $post_id, '_poll_options', wp_json_encode( $clean_options ) );
            }
            update_post_meta( $post_id, '_poll_expires_at', sanitize_text_field( $request->get_param( 'poll_expires_at' ) ?: '' ) );
            update_post_meta( $post_id, '_poll_voters', wp_json_encode( array() ) );
        }
        if ( $template === 'itinerary' ) {
            $stops = $request->get_param( 'itinerary_stops' );
            if ( is_array( $stops ) ) {
                $clean_stops = array_map( function( $stop ) {
                    return array(
                        'name'      => sanitize_text_field( $stop['name'] ?? '' ),
                        'lat'       => (float) ( $stop['lat'] ?? 0 ),
                        'lng'       => (float) ( $stop['lng'] ?? 0 ),
                        'note'      => sanitize_text_field( $stop['note'] ?? '' ),
                        'image_url' => esc_url_raw( $stop['image_url'] ?? '' ),
                    );
                }, array_slice( $stops, 0, 5 ) );
                update_post_meta( $post_id, '_itinerary_stops', wp_json_encode( $clean_stops ) );
            }
        }
        if ( $template === 'creative-showcase' ) {
            $images = $request->get_param( 'gallery_images' );
            if ( is_array( $images ) ) {
                update_post_meta( $post_id, '_gallery_images', wp_json_encode( array_map( 'esc_url_raw', array_slice( $images, 0, 10 ) ) ) );
            }
            if ( $request->get_param( 'video_url' ) ) {
                update_post_meta( $post_id, '_video_url', esc_url_raw( $request->get_param( 'video_url' ) ) );
            }
        }

        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'community_post' );
        }

        $post = get_post( $post_id );
        return rest_ensure_response( self::format_community_post( $post, array() ) );
    }

    const COMMENTABLE_POST_TYPES = array( 'culture_post', 'pulse_story' );

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
            Culture_Gamification::award_points( $user_id, 'community_comment' );
            // Check if the post has now crossed the validation threshold.
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
     * Mobile directory entry submission — Connect Pro (patron) privilege,
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
                __( 'Connect Pro membership required to submit directory entries.', 'culture-community' ),
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

    const REACTABLE_POST_TYPES = array( 'culture_post', 'pulse_story', 'culture_quote' );

    public static function handle_react( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );
        $type    = sanitize_key( $request->get_param( 'type' ) ?: 'love' );

        $post = get_post( $post_id );
        if ( ! $post || ! in_array( $post->post_type, self::REACTABLE_POST_TYPES, true ) ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $is_community  = $post->post_type === 'culture_post';
        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );
        $already_liked = in_array( $post_id, $liked_ids, false );

        if ( $already_liked ) {
            $liked_ids = array_values( array_diff( $liked_ids, array( $post_id ) ) );
            $new_count = max( 0, (int) get_post_meta( $post_id, '_culture_like_count', true ) - 1 );
        } else {
            $liked_ids[] = $post_id;
            $new_count   = (int) get_post_meta( $post_id, '_culture_like_count', true ) + 1;
            if ( $is_community && class_exists( 'Culture_Gamification' ) ) {
                Culture_Gamification::award_points( $user_id, 'community_like' );
            }
        }

        update_user_meta( $user_id, '_culture_liked_posts', $liked_ids );
        update_post_meta( $post_id, '_culture_like_count', $new_count );

        // Also increment the named reaction counter (love/fire/clap) used by the feed.
        $reaction_key = in_array( $type, array( 'love', 'fire', 'clap' ), true ) ? 'reaction_' . $type : 'reaction_love';
        if ( ! $already_liked ) {
            $current = (int) get_post_meta( $post_id, $reaction_key, true );
            update_post_meta( $post_id, $reaction_key, $current + 1 );
        } else {
            $current = (int) get_post_meta( $post_id, $reaction_key, true );
            update_post_meta( $post_id, $reaction_key, max( 0, $current - 1 ) );
        }

        if ( $is_community && ! $already_liked && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::check_post_threshold( $post_id );
        }

        return rest_ensure_response( array(
            'liked' => ! $already_liked,
            'count' => $new_count,
        ) );
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

        return rest_ensure_response( self::public_profile( $user ) );
    }

    public static function handle_get_members( $request ) {
        $search     = $request->get_param( 'search' );
        $discipline = $request->get_param( 'discipline' );
        $location   = $request->get_param( 'location' );
        $per_page   = min( (int) ( $request->get_param( 'per_page' ) ?: 100 ), 200 );

        $meta_query = array(
            'relation' => 'AND',
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
        $primary_id   = (int) get_user_meta( $user->ID, '_culture_primary_chapter_id', true );
        $secondary_id = (int) get_user_meta( $user->ID, '_culture_secondary_chapter_id', true );

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
            'primaryChapter'        => array( 'id' => $primary_id, 'name' => $primary_id ? get_the_title( $primary_id ) : '' ),
            'secondaryChapter'      => array( 'id' => $secondary_id, 'name' => $secondary_id ? get_the_title( $secondary_id ) : '' ),
            'isVendor'              => $is_vendor,
            'vendorSlug'            => $is_vendor ? $user->user_nicename : '',
            'hasPasskey'            => $passkey_count > 0,
            'passkeyCount'          => $passkey_count,
            'creditsEscrowed'       => (int) get_user_meta( $user->ID, '_culture_credits_escrowed', true ),
            // Directory profile fields
            'directoryOptIn'        => (bool) get_user_meta( $user->ID, '_culture_directory_opt_in', true ),
            'directoryBio'          => get_user_meta( $user->ID, '_culture_directory_bio', true ) ?: '',
            'directoryDisciplines'  => json_decode( get_user_meta( $user->ID, '_culture_directory_disciplines', true ) ?: '[]', true ) ?: array(),
            'directoryInstagram'    => get_user_meta( $user->ID, '_culture_directory_instagram', true ) ?: '',
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

    private static function get_pulse_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'pulse_story',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) {
            $thumb = get_the_post_thumbnail_url( $post->ID, 'large' );
            return array(
                'id'            => 'pulse-' . $post->ID,
                'type'          => 'pulse',
                'title'         => get_the_title( $post ),
                'slug'          => $post->post_name,
                'date'          => $post->post_date_gmt,
                'excerpt'       => wp_strip_all_tags( $post->post_excerpt ),
                'body'          => wpautop( $post->post_content ),
                'image'         => $thumb ?: null,
                'href'          => '/pulse/' . $post->post_name,
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
            $categories = get_the_category( $post->ID );
            return array(
                'id'       => 'editorial-' . $post->post_name,
                'type'     => 'editorial',
                'title'    => get_the_title( $post ),
                'slug'     => $post->post_name,
                'date'     => $post->post_date_gmt,
                'excerpt'  => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
                'image'    => $thumb ?: null,
                'href'     => '/magazine/' . $post->post_name,
                'category' => ! empty( $categories ) ? $categories[0]->name : '',
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
                'date'          => $post->post_date_gmt,
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
            );
        }, $query->posts );
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
                'date'      => $post->post_date_gmt,
                'excerpt'   => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
                'body'      => wp_strip_all_tags( $post->post_content ),
                'image'     => $thumb ?: null,
                'href'      => '/directory/' . $post->post_name,
                'entryType' => ( $terms && ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0]->name : '',
                'city'      => get_post_meta( $post->ID, '_entry_city', true ) ?: '',
                'location'  => get_post_meta( $post->ID, '_culture_location', true ) ?: '',
            );
        }, $query->posts );
    }

    private static function get_quote_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'culture_quote',
            'post_status'    => 'publish',
            'posts_per_page' => 20,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) {
            $authors = get_the_terms( $post->ID, 'culture_quote_author' );
            return array(
                'id'          => 'quote-' . $post->post_name,
                'type'        => 'quote',
                'title'       => wp_strip_all_tags( $post->post_content ?: get_the_title( $post ) ),
                'slug'        => $post->post_name,
                'date'        => $post->post_date_gmt,
                'href'        => '/quotes/' . $post->ID . '-' . $post->post_name,
                'wpId'        => (string) $post->ID,
                'quoteSource' => get_post_meta( $post->ID, '_quote_source', true ) ?: '',
                'quoteAuthor' => ( $authors && ! is_wp_error( $authors ) && ! empty( $authors ) ) ? $authors[0]->name : '',
            );
        }, $query->posts );
    }

    private static function get_community_feed_items(): array {
        $user_id   = get_current_user_id();
        $liked_ids = (array) get_user_meta( $user_id, '_culture_liked_posts', true );

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'posts_per_page' => 15,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        ) );

        return array_map( function( WP_Post $post ) use ( $liked_ids ) {
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
            }

            $template = get_post_meta( $post->ID, '_template_type', true ) ?: 'post';

            return array(
                'id'                      => 'community-' . $post->ID,
                'type'                    => 'community',
                'title'                   => $body_text ?: get_the_title( $post ),
                'slug'                    => $post->post_name,
                'date'                    => $post->post_date_gmt,
                'image'                   => get_post_meta( $post->ID, '_community_image_url', true ) ?: null,
                'href'                    => '/community/' . $post->post_name,
                'communityAuthorId'       => get_post_meta( $post->ID, 'community_author_id', true ) ?: (string) $author_id,
                'communityAuthor'         => get_post_meta( $post->ID, 'community_author_name', true ) ?: ( $author ? $author->display_name : '' ),
                'communityAuthorUsername' => get_post_meta( $post->ID, 'community_author_username', true ) ?: ( $author ? $author->user_login : '' ),
                'communityAuthorAvatar'   => get_post_meta( $post->ID, 'community_author_avatar', true ) ?: '',
                'communityTag'            => get_post_meta( $post->ID, 'community_tag', true ) ?: '',
                'communityTier'           => get_post_meta( $post->ID, 'community_author_tier', true ) ?: '',
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
                'wpId'                    => (string) $post->ID,
                // Template fields — all card variants
                'templateType'            => $template,
                'linkedDirectoryId'       => (int) get_post_meta( $post->ID, '_linked_directory_id', true ) ?: null,
                'starRating'              => (int) get_post_meta( $post->ID, '_star_rating', true ) ?: null,
                'locationName'            => get_post_meta( $post->ID, '_location_name', true ) ?: '',
                'pollOptions'             => json_decode( get_post_meta( $post->ID, '_poll_options', true ) ?: '[]', true ),
                'pollExpiresAt'           => get_post_meta( $post->ID, '_poll_expires_at', true ) ?: '',
                'galleryImages'           => json_decode( get_post_meta( $post->ID, '_gallery_images', true ) ?: '[]', true ),
                'videoUrl'                => get_post_meta( $post->ID, '_video_url', true ) ?: '',
                'itineraryStops'          => json_decode( get_post_meta( $post->ID, '_itinerary_stops', true ) ?: '[]', true ),
                'foodDishName'            => get_post_meta( $post->ID, '_food_dish_name', true ) ?: '',
                'foodRatingTaste'         => (int) get_post_meta( $post->ID, '_food_rating_taste', true ) ?: null,
                'foodRatingValue'         => (int) get_post_meta( $post->ID, '_food_rating_value', true ) ?: null,
                'foodRatingVibe'          => (int) get_post_meta( $post->ID, '_food_rating_vibe', true ) ?: null,
            );
        }, $query->posts );
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
            'tier'               => $tier,
            'city'               => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
            'countryOfResidence' => get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
            'occupation'         => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
            'bio'                => get_user_meta( $user->ID, '_culture_directory_bio', true ) ?: '',
            'interests'          => $interests,
            'instagram'          => get_user_meta( $user->ID, '_culture_directory_instagram', true ) ?: '',
            'linkedin'           => get_user_meta( $user->ID, '_culture_directory_linkedin', true ) ?: '',
            'website'            => get_user_meta( $user->ID, '_culture_directory_website', true ) ?: '',
            'registeredAt'       => strtotime( $user->user_registered ),
            'points'             => (int) get_user_meta( $user->ID, '_culture_points', true ),
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

    public static function handle_analytics( $request ) {
        $user_id = get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_member_analytics( $request );
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
        $files   = $request->get_file_params();
        $file    = $files['file'] ?? null;

        if ( empty( $file ) || empty( $file['tmp_name'] ) ) {
            return new WP_Error( 'no_file', 'No file provided.', array( 'status' => 400 ) );
        }

        if ( ! in_array( $file['type'], self::UPLOAD_ALLOWED_TYPES, true ) ) {
            return new WP_Error( 'invalid_type', 'Only JPEG, PNG, WebP, or GIF allowed.', array( 'status' => 400 ) );
        }

        if ( $file['size'] > self::UPLOAD_MAX_BYTES ) {
            return new WP_Error( 'too_large', 'Image must be under 8 MB.', array( 'status' => 400 ) );
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $_FILES['file']['name'] = 'avatar-' . $user_id . '-' . time() . '-' . sanitize_file_name( $file['name'] );
        $attachment_id = media_handle_upload( 'file', 0, array(), array( 'test_form' => false ) );

        if ( is_wp_error( $attachment_id ) ) {
            return new WP_Error( 'upload_failed', $attachment_id->get_error_message(), array( 'status' => 500 ) );
        }

        $url = wp_get_attachment_url( $attachment_id );
        update_user_meta( $user_id, '_culture_avatar_url', $url );

        return rest_ensure_response( array( 'url' => $url ) );
    }

    public static function handle_get_portfolio( $request ) {
        $requested_user = (int) $request->get_param( 'user_id' );
        $user_id        = $requested_user ?: get_current_user_id();
        $request->set_param( 'user_id', $user_id );
        return Culture_REST_API::handle_get_portfolio( $request );
    }

    public static function handle_get_member_posts( $request ) {
        $author_id = (int) $request->get_param( 'id' );
        $page      = max( 1, (int) $request->get_param( 'page' ) );
        $per_page  = min( 20, max( 1, (int) $request->get_param( 'per_page' ) ) );

        $user    = get_userdata( $author_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', 'Member not found.', array( 'status' => 404 ) );
        }

        $viewer_id = get_current_user_id();
        $liked_ids = (array) get_user_meta( $viewer_id, '_culture_liked_posts', true );

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'author'         => $author_id,
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ) );

        $posts = array_map( function( $post ) use ( $liked_ids ) {
            return self::format_community_post( $post, $liked_ids );
        }, $query->posts );

        return rest_ensure_response( array(
            'posts'   => $posts,
            'hasMore' => $query->found_posts > ( $page * $per_page ),
        ) );
    }

    private static function format_community_post( WP_Post $post, array $liked_ids ): array {
        $author_id   = (int) $post->post_author;
        $author      = get_userdata( $author_id );
        $author_tier = get_user_meta( $author_id, '_culture_membership_tier', true ) ?: 'citizen';

        return array(
            'id'           => (string) $post->ID,
            'content'      => wp_strip_all_tags( $post->post_content ),
            'imageUrl'     => get_post_meta( $post->ID, '_community_image_url', true ) ?: null,
            'publishedAt'  => get_date_from_gmt( $post->post_date_gmt, 'c' ),
            'likeCount'    => (int) get_post_meta( $post->ID, '_culture_like_count', true ),
            'commentCount' => (int) get_comments_number( $post->ID ),
            'liked'        => in_array( $post->ID, $liked_ids, false ),
            'status'       => $post->post_status,
            'author'       => array(
                'id'        => (string) $author_id,
                'name'      => $author ? $author->display_name : 'Unknown',
                'avatarUrl' => $author ? ( get_user_meta( $author_id, '_culture_avatar_url', true ) ?: '' ) : '',
                'tier'      => $author_tier,
            ),
            // Phase 4: template meta.
            'template_type'       => get_post_meta( $post->ID, '_template_type', true ) ?: 'post',
            'linked_directory_id' => (int) get_post_meta( $post->ID, '_linked_directory_id', true ),
            'star_rating'         => (int) get_post_meta( $post->ID, '_star_rating', true ),
            'location_name'       => get_post_meta( $post->ID, '_location_name', true ) ?: '',
            'poll_options'        => json_decode( get_post_meta( $post->ID, '_poll_options', true ) ?: '[]', true ),
            'poll_expires_at'     => get_post_meta( $post->ID, '_poll_expires_at', true ) ?: '',
            'gallery_images'      => json_decode( get_post_meta( $post->ID, '_gallery_images', true ) ?: '[]', true ),
            'video_url'           => get_post_meta( $post->ID, '_video_url', true ) ?: '',
            'itinerary_stops'     => json_decode( get_post_meta( $post->ID, '_itinerary_stops', true ) ?: '[]', true ),
            'food_dish_name'      => get_post_meta( $post->ID, '_food_dish_name', true ) ?: '',
            'food_rating_taste'   => (int) get_post_meta( $post->ID, '_food_rating_taste', true ),
            'food_rating_value'   => (int) get_post_meta( $post->ID, '_food_rating_value', true ),
            'food_rating_vibe'    => (int) get_post_meta( $post->ID, '_food_rating_vibe', true ),
        );
    }

    // ── Shop handlers ─────────────────────────────────────────────────────────

    public static function handle_shop_products( $request ) {
        global $wpdb;

        if ( ! function_exists( 'wc_get_product' ) ) {
            return rest_ensure_response( array( 'products' => array(), 'total' => 0, 'pages' => 0, 'page' => 1 ) );
        }

        $category = sanitize_text_field( $request->get_param( 'category' ) );
        $page     = max( 1, (int) $request->get_param( 'page' ) );
        $per_page = min( 50, max( 1, (int) $request->get_param( 'per_page' ) ) );

        $user   = wp_get_current_user();
        $is_pro = $user->ID && in_array( 'patron', (array) $user->roles, true );

        $query_args = array(
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        if ( $category ) {
            $query_args['tax_query'] = array( array(
                'taxonomy' => 'product_cat',
                'field'    => 'slug',
                'terms'    => $category,
            ) );
        }

        $q        = new WP_Query( $query_args );
        $products = array();
        $currency_symbol = function_exists( 'get_woocommerce_currency_symbol' ) ? html_entity_decode( get_woocommerce_currency_symbol() ) : '£';
        $currency        = function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'GBP';

        foreach ( $q->posts as $post ) {
            $wc = wc_get_product( $post->ID );
            if ( ! $wc ) continue;

            $price   = $wc->get_price();
            $regular = $wc->get_regular_price();
            $sale    = $wc->get_sale_price();

            $pro_price     = ( $is_pro && $price ) ? (string) round( (float) $price * 0.9, 2 ) : null;
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
                'price'          => $price ?: '',
                'regularPrice'   => $regular ?: '',
                'salePrice'      => $sale ?: '',
                'proPrice'       => $pro_price,
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
}
