<?php
/**
 * Culture Directory – REST endpoint for community entry submissions.
 *
 * Flow:
 *   1. Next.js frontend posts to /culture/v1/directory/submit (with Bearer secret).
 *   2. This handler creates a pending culture_directory post and sets meta/terms.
 *   3. Gamification: 25 XP awarded to the submitter immediately.
 *   4. Admin reviews and publishes the entry via WP admin.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Directory {

    public static function init() {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
    }

    /**
     * Register REST routes.
     */
    public static function register_routes() {
        register_rest_route( 'culture/v1', '/directory/submit', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_submit' ),
            'permission_callback' => array( __CLASS__, 'verify_secret' ),
            'args'                => array(
                'user_id' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
                'title' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'excerpt' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'wp_kses_post',
                ),
                'content' => array(
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'wp_kses_post',
                ),
                'entry_type' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_key',
                    'default'           => 'concept',
                ),
                'interests' => array(
                    'required'          => false,
                    'type'              => 'array',
                    'default'           => array(),
                    'items'             => array( 'type' => 'string' ),
                ),
                'ai_generated' => array(
                    'required'          => false,
                    'type'              => 'boolean',
                    'default'           => false,
                ),
                'improving_slug' => array(
                    'required'          => false,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_title',
                    'default'           => '',
                ),
            ),
        ) );
    }

    /**
     * Verify the shared bearer secret sent from the Next.js backend.
     *
     * The secret is stored in the WP option `culture_api_secret` and must match
     * the CULTURE_API_SECRET environment variable on the Next.js side.
     */
    public static function verify_secret( WP_REST_Request $request ) {
        $secret = get_option( 'culture_api_secret', '' );

        if ( empty( $secret ) ) {
            return new WP_Error(
                'no_secret',
                __( 'API secret not configured on the server.', 'culture-community' ),
                array( 'status' => 503 )
            );
        }

        $auth = $request->get_header( 'Authorization' );
        if ( ! $auth ) {
            return new WP_Error(
                'unauthorized',
                __( 'Missing Authorization header.', 'culture-community' ),
                array( 'status' => 401 )
            );
        }

        $token = trim( str_replace( 'Bearer', '', $auth ) );
        if ( ! hash_equals( $secret, $token ) ) {
            return new WP_Error(
                'forbidden',
                __( 'Invalid API secret.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        return true;
    }

    /**
     * Handle a new directory entry submission from the Next.js frontend.
     */
    public static function handle_submit( WP_REST_Request $request ) {
        $user_id        = $request->get_param( 'user_id' );
        $title          = $request->get_param( 'title' );
        $excerpt        = $request->get_param( 'excerpt' );
        $content        = $request->get_param( 'content' );
        $entry_type     = $request->get_param( 'entry_type' );
        $interests      = (array) $request->get_param( 'interests' );
        $ai_gen         = (bool) $request->get_param( 'ai_generated' );
        $improving_slug = $request->get_param( 'improving_slug' );

        // Validate the submitting user exists.
        if ( $user_id > 0 && ! get_userdata( $user_id ) ) {
            return new WP_Error(
                'invalid_user',
                __( 'Submitting user not found.', 'culture-community' ),
                array( 'status' => 404 )
            );
        }

        // Create the post in pending status — admin must publish it.
        $post_id = wp_insert_post( array(
            'post_title'   => $title,
            'post_excerpt' => $excerpt,
            'post_content' => $content,
            'post_status'  => 'pending',
            'post_type'    => 'culture_directory',
            'post_author'  => $user_id > 0 ? $user_id : 0,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error(
                'insert_failed',
                $post_id->get_error_message(),
                array( 'status' => 500 )
            );
        }

        // Persist meta.
        update_post_meta( $post_id, '_culture_dir_submitted_by', $user_id );
        update_post_meta( $post_id, '_culture_dir_ai_generated', $ai_gen ? '1' : '0' );

        // When this is an improvement of an existing entry, record the reference.
        if ( ! empty( $improving_slug ) ) {
            update_post_meta( $post_id, '_culture_dir_improves', sanitize_title( $improving_slug ) );
        }

        // Assign entry type term.
        if ( $entry_type && taxonomy_exists( 'culture_dir_type' ) ) {
            wp_set_object_terms( $post_id, $entry_type, 'culture_dir_type' );
        }

        // Assign interest terms (slugs passed from the AI output).
        if ( ! empty( $interests ) && taxonomy_exists( 'culture_interest' ) ) {
            $clean_slugs = array_map( 'sanitize_key', $interests );
            // Only set terms that actually exist to avoid creating orphan terms.
            $valid = array();
            foreach ( $clean_slugs as $slug ) {
                if ( term_exists( $slug, 'culture_interest' ) ) {
                    $valid[] = $slug;
                }
            }
            if ( ! empty( $valid ) ) {
                wp_set_object_terms( $post_id, $valid, 'culture_interest' );
            }
        }

        // Award gamification points to the submitter.
        $points_awarded = 25;
        if ( $user_id > 0 && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'directory_submission', $points_awarded );
        }

        $post = get_post( $post_id );
        $slug = $post->post_name ?: sanitize_title( $title );

        return rest_ensure_response( array(
            'success'        => true,
            'post_id'        => $post_id,
            'slug'           => $slug,
            'points_awarded' => $points_awarded,
        ) );
    }
}
