<?php
/**
 * Moveee Pulse — Custom Post Type, Taxonomies, and Meta Registration.
 *
 * Registers:
 *   - pulse_story CPT (REST-enabled, comments open)
 *   - pulse_arm taxonomy (lifestyle / origins / happenings / magazine)
 *   - pulse_region taxonomy (Africa / Caribbean / Diaspora UK / etc.)
 *   - Meta fields for source, region label, arm label, external URL, refresh timestamp
 *
 * After activating / updating this file, flush WordPress permalinks:
 *   Settings → Permalinks → Save Changes
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Pulse {

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_cpt' ] );
        add_action( 'init', [ __CLASS__, 'register_taxonomies' ] );
        add_action( 'init', [ __CLASS__, 'register_meta' ] );
        add_filter( 'rest_comment_query', [ __CLASS__, 'allow_comment_reads' ], 10, 2 );
    }

    public static function register_cpt() {
        register_post_type( 'pulse_story', [
            'labels' => [
                'name'               => 'Pulse Stories',
                'singular_name'      => 'Pulse Story',
                'add_new'            => 'Add New Story',
                'add_new_item'       => 'Add New Pulse Story',
                'edit_item'          => 'Edit Pulse Story',
                'new_item'           => 'New Pulse Story',
                'view_item'          => 'View Pulse Story',
                'search_items'       => 'Search Pulse Stories',
                'not_found'          => 'No pulse stories found',
                'not_found_in_trash' => 'No pulse stories found in trash',
            ],
            'public'            => true,
            'show_in_rest'      => true,
            'rest_base'         => 'pulse-stories',
            'supports'          => [ 'title', 'editor', 'excerpt', 'comments', 'custom-fields' ],
            'has_archive'       => false,
            'rewrite'           => [ 'slug' => 'pulse' ],
            'show_in_menu'      => true,
            'menu_icon'         => 'dashicons-rss',
            'capability_type'   => 'post',
            'map_meta_cap'      => true,
        ] );
    }

    public static function register_taxonomies() {
        // Arm taxonomy — the four content arms.
        register_taxonomy( 'pulse_arm', 'pulse_story', [
            'label'             => 'Arm',
            'labels'            => [
                'name'          => 'Arms',
                'singular_name' => 'Arm',
            ],
            'public'            => true,
            'show_in_rest'      => true,
            'rest_base'         => 'pulse-arms',
            'hierarchical'      => false,
            'show_admin_column' => true,
        ] );

        // Region taxonomy.
        register_taxonomy( 'pulse_region', 'pulse_story', [
            'label'             => 'Region',
            'labels'            => [
                'name'          => 'Regions',
                'singular_name' => 'Region',
            ],
            'public'            => true,
            'show_in_rest'      => true,
            'rest_base'         => 'pulse-regions',
            'hierarchical'      => false,
            'show_admin_column' => true,
        ] );

        // Industry category taxonomy — what the story is about.
        register_taxonomy( 'pulse_category', 'pulse_story', [
            'label'             => 'Category',
            'labels'            => [
                'name'          => 'Categories',
                'singular_name' => 'Category',
            ],
            'public'            => true,
            'show_in_rest'      => true,
            'rest_base'         => 'pulse-categories',
            'hierarchical'      => false,
            'show_admin_column' => true,
        ] );
    }

    public static function register_meta() {
        $string_fields = [
            'pulse_source',
            'pulse_region_label',
            'pulse_arm_label',
            'pulse_external_url',
            'pulse_image_url',
            'pulse_gemini_refreshed_at',
            'pulse_og_title',
            'pulse_og_description',
            'pulse_og_image',
        ];

        foreach ( $string_fields as $field ) {
            register_post_meta( 'pulse_story', $field, [
                'show_in_rest'  => true,
                'single'        => true,
                'type'          => 'string',
                'default'       => '',
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            ] );
        }

        register_post_meta( 'pulse_story', 'pulse_click_count', [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'integer',
            'default'       => 0,
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ] );
    }

    /**
     * Allow the Next.js frontend to read comments for pulse stories
     * without requiring authentication.
     */
    public static function allow_comment_reads( $prepared_args, $request ) {
        return $prepared_args;
    }
}

Culture_Pulse::init();
