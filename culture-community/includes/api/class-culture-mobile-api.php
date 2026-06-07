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

        register_rest_route( 'culture/v1', '/user/push-token', array(
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

        register_rest_route( 'culture/v1', '/community/posts', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_community_posts' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/feed', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_unified_feed' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'page'     => array( 'default' => 1,  'sanitize_callback' => 'absint' ),
                'per_page' => array( 'default' => 20, 'sanitize_callback' => 'absint' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/community/submit', array(
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

        register_rest_route( 'culture/v1', '/community/comments', array(
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

        register_rest_route( 'culture/v1', '/community/comment', array(
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

        register_rest_route( 'culture/v1', '/community/react', array(
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

        register_rest_route( 'culture/v1', '/community/report', array(
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

        register_rest_route( 'culture/v1', '/community/quote', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_submit_quote' ),
            'permission_callback' => array( __CLASS__, 'mobile_permission' ),
            'args'                => array(
                'text'   => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'wp_kses_post' ),
                'author' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
                'source' => array( 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        // Mobile event submission — delegates to Culture_REST_API::handle_create_event,
        // authenticated as the current Bearer-token user (mirrors web's /events/submit).
        register_rest_route( 'culture/v1', '/events/submit-mobile', array(
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

        // Mobile directory entry submission — delegates to Culture_Directory::handle_submit,
        // authenticated as the current Bearer-token user (mirrors web's /directory/submit).
        register_rest_route( 'culture/v1', '/directory/submit-mobile', array(
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

        register_rest_route( 'culture/v1', '/member/(?P<id>\d+)', array(
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
            'phone'                => '_culture_phone',
            'whatsapp'             => '_culture_whatsapp',
            'gender'               => '_culture_gender',
            'date_of_birth'        => '_culture_dob',
            'nationality'          => '_culture_nationality',
            'country_of_residence' => '_culture_country_of_residence',
            'city'                 => '_culture_city',
            'occupation'           => '_culture_occupation',
            'avatar_url'           => '_culture_avatar_url',
        );

        foreach ( $meta_map as $param => $meta_key ) {
            if ( $request->has_param( $param ) ) {
                update_user_meta( $user_id, $meta_key, sanitize_text_field( $request->get_param( $param ) ) );
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

    public static function handle_react( $request ) {
        $user_id = get_current_user_id();
        $post_id = (int) $request->get_param( 'post_id' );

        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
        }

        $liked_ids     = (array) get_user_meta( $user_id, '_culture_liked_posts', true );
        $already_liked = in_array( $post_id, $liked_ids, false );

        if ( $already_liked ) {
            $liked_ids = array_values( array_diff( $liked_ids, array( $post_id ) ) );
            $new_count = max( 0, (int) get_post_meta( $post_id, '_culture_like_count', true ) - 1 );
        } else {
            $liked_ids[] = $post_id;
            $new_count   = (int) get_post_meta( $post_id, '_culture_like_count', true ) + 1;
            if ( class_exists( 'Culture_Gamification' ) ) {
                Culture_Gamification::award_points( $user_id, 'community_like' );
            }
        }

        update_user_meta( $user_id, '_culture_liked_posts', $liked_ids );
        update_post_meta( $post_id, '_culture_like_count', $new_count );

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

        return array(
            'id'                 => (string) $user->ID,
            'username'           => $user->user_login,
            'email'              => $user->user_email,
            'displayName'        => $user->display_name,
            'avatarUrl'          => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
            'tier'               => $tier,
            'points'             => (int) get_user_meta( $user->ID, '_culture_points', true ),
            'badges'             => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $user->ID ) : array(),
            'referralCode'       => $referral_code,
            'referralCount'      => $referral_count,
            'registeredAt'       => strtotime( $user->user_registered ),
            'gender'             => get_user_meta( $user->ID, '_culture_gender', true ) ?: '',
            'dateOfBirth'        => get_user_meta( $user->ID, '_culture_dob', true ) ?: '',
            'nationality'        => get_user_meta( $user->ID, '_culture_nationality', true ) ?: '',
            'countryOfResidence' => get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
            'city'               => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
            'occupation'         => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
            'phone'              => get_user_meta( $user->ID, '_culture_phone', true ) ?: '',
            'whatsapp'           => get_user_meta( $user->ID, '_culture_whatsapp', true ) ?: '',
            'primaryChapter'     => array( 'id' => $primary_id, 'name' => $primary_id ? get_the_title( $primary_id ) : '' ),
            'secondaryChapter'   => array( 'id' => $secondary_id, 'name' => $secondary_id ? get_the_title( $secondary_id ) : '' ),
            'isVendor'           => $is_vendor,
            'vendorSlug'         => $is_vendor ? $user->user_nicename : '',
        );
    }

    // -------------------------------------------------------------------------
    // Unified feed handler
    // -------------------------------------------------------------------------

    public static function handle_get_unified_feed( $request ) {
        $page     = max( 1, (int) $request->get_param( 'page' ) );
        $per_page = min( (int) $request->get_param( 'per_page' ), 50 );

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

        $offset     = ( $page - 1 ) * $per_page;
        $page_items = array_slice( $items, $offset, $per_page );

        return rest_ensure_response( array(
            'items'   => array_values( $page_items ),
            'hasMore' => ( $offset + $per_page ) < count( $items ),
        ) );
    }

    private static function get_pulse_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'pulse_story',
            'post_status'    => 'publish',
            'posts_per_page' => 30,
            'orderby'        => 'date',
            'order'          => 'DESC',
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
            'posts_per_page' => 30,
            'orderby'        => 'date',
            'order'          => 'DESC',
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
            'posts_per_page' => 30,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ) );

        return array_map( function( WP_Post $post ) {
            $thumb = get_the_post_thumbnail_url( $post->ID, 'large' );
            return array(
                'id'        => 'happening-' . $post->post_name,
                'type'      => 'happening',
                'title'     => get_the_title( $post ),
                'slug'      => $post->post_name,
                'date'      => $post->post_date_gmt,
                'excerpt'   => wp_strip_all_tags( $post->post_excerpt ?: wp_trim_words( $post->post_content, 30 ) ),
                'image'     => $thumb ?: null,
                'href'      => '/events/' . $post->post_name,
                'eventDate' => get_post_meta( $post->ID, '_culture_event_date', true ) ?: '',
                'location'  => get_post_meta( $post->ID, '_culture_location', true ) ?: '',
            );
        }, $query->posts );
    }

    private static function get_directory_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => 30,
            'orderby'        => 'date',
            'order'          => 'DESC',
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
                'image'     => $thumb ?: null,
                'href'      => '/directory/' . $post->post_name,
                'entryType' => ( $terms && ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0]->name : '',
            );
        }, $query->posts );
    }

    private static function get_quote_feed_items(): array {
        $query = new WP_Query( array(
            'post_type'      => 'culture_quote',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
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
            'posts_per_page' => 24,
            'orderby'        => 'date',
            'order'          => 'DESC',
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

            return array(
                'id'                    => 'community-' . $post->ID,
                'type'                  => 'community',
                'title'                 => $body_text ?: get_the_title( $post ),
                'slug'                  => $post->post_name,
                'date'                  => $post->post_date_gmt,
                'image'                 => get_post_meta( $post->ID, '_community_image_url', true ) ?: null,
                'href'                  => '/community/' . $post->post_name,
                'communityAuthorId'     => get_post_meta( $post->ID, 'community_author_id', true ) ?: (string) $author_id,
                'communityAuthor'       => get_post_meta( $post->ID, 'community_author_name', true ) ?: ( $author ? $author->display_name : '' ),
                'communityAuthorAvatar' => get_post_meta( $post->ID, 'community_author_avatar', true ) ?: '',
                'communityTag'          => get_post_meta( $post->ID, 'community_tag', true ) ?: '',
                'communityTier'         => get_post_meta( $post->ID, 'community_author_tier', true ) ?: '',
                'region'                => get_post_meta( $post->ID, 'community_region', true ) ?: '',
                'sourceUrl'             => $link_url ?: null,
                'source'                => $source ?: null,
                'ogTitle'               => get_post_meta( $post->ID, 'community_og_title', true ) ?: '',
                'ogDescription'         => get_post_meta( $post->ID, 'community_og_description', true ) ?: '',
                'ogImage'               => get_post_meta( $post->ID, 'community_og_image', true ) ?: '',
                'commentCount'          => (int) get_comments_number( $post->ID ),
                'reactions'             => array(
                    'love' => (int) get_post_meta( $post->ID, 'reaction_love', true ),
                    'fire' => (int) get_post_meta( $post->ID, 'reaction_fire', true ),
                    'clap' => (int) get_post_meta( $post->ID, 'reaction_clap', true ),
                ),
                'liked'                 => in_array( $post->ID, $liked_ids, false ),
                'wpId'                  => (string) $post->ID,
            );
        }, $query->posts );
    }

    private static function public_profile( WP_User $user ): array {
        $stored_tier = get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen';
        $tier = ( is_super_admin( $user->ID ) || user_can( $user, 'manage_options' ) )
            ? 'patron'
            : $stored_tier;

        return array(
            'id'                 => (string) $user->ID,
            'displayName'        => $user->display_name,
            'avatarUrl'          => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
            'tier'               => $tier,
            'city'               => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
            'countryOfResidence' => get_user_meta( $user->ID, '_culture_country_of_residence', true ) ?: '',
            'occupation'         => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
            'points'             => (int) get_user_meta( $user->ID, '_culture_points', true ),
            'badges'             => class_exists( 'Culture_Gamification' ) ? Culture_Gamification::get_badges( $user->ID ) : array(),
        );
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
        );
    }
}
