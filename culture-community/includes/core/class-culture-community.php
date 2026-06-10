<?php
/**
 * Moveee Community Posts — Meta Registration.
 *
 * Registers REST-exposed meta fields on the standard WP 'post' type so that
 * community posts submitted via the Next.js API route carry proper author
 * attribution, an optional image URL, and a content tag.
 *
 * Also registers reaction count fields on both 'post' (community posts) and
 * 'pulse_story' CPT so that emoji reactions can be stored, read, and written
 * via the REST API from the Next.js layer.
 *
 * All fields are stored in wp_postmeta and are fully backed up by UpdraftPlus.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Community {

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_meta' ] );
        add_action( 'save_post', [ __CLASS__, 'flush_vercel_kv_cache' ], 10, 2 );
        add_action( 'transition_post_status', [ __CLASS__, 'flush_on_publish' ], 10, 3 );
    }

    /**
     * Flush the Vercel KV GraphQL cache when a post is published or updated.
     * Only fires for public-facing post types (not drafts, not community posts).
     */
    public static function flush_on_publish( $new_status, $old_status, $post ) {
        if ( $new_status !== 'publish' ) {
            return;
        }
        $cacheable_types = [ 'post', 'page', 'culture_newsletter', 'culture_journey', 'culture_directory', 'culture_quote', 'product' ];
        if ( ! in_array( $post->post_type, $cacheable_types, true ) ) {
            return;
        }
        self::flush_vercel_kv_cache( $post->ID, $post );
    }

    public static function flush_vercel_kv_cache( $post_id, $post ) {
        if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
            return;
        }

        $secret   = defined( 'VERCEL_REVALIDATE_SECRET' ) ? VERCEL_REVALIDATE_SECRET : get_option( 'culture_vercel_revalidate_secret' );
        $endpoint = defined( 'VERCEL_SITE_URL' ) ? VERCEL_SITE_URL . '/api/revalidate-kv' : get_option( 'culture_vercel_site_url' ) . '/api/revalidate-kv';

        if ( ! $secret || ! $endpoint ) {
            return;
        }

        wp_remote_post( $endpoint, [
            'timeout'  => 5,
            'blocking' => false,
            'headers'  => [
                'Content-Type'          => 'application/json',
                'x-revalidate-secret'   => $secret,
            ],
            'body'     => wp_json_encode( [ 'post_id' => $post_id, 'post_type' => $post->post_type ] ),
        ] );
    }

    public static function register_meta() {
        // ── Community post attribution fields ────────────────────────────────
        // Registered on both culture_post (new CPT) and post (legacy, kept so
        // existing community posts in the "community" category remain readable).
        $string_fields = [
            'community_author_name',
            'community_author_id',
            'community_author_username',
            'community_author_avatar',
            'community_tag',
            'community_region',
            'community_author_tier',
            'community_link_url',
            'community_og_title',
            'community_og_description',
            'community_og_image',
        ];

        $string_meta_args = [
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'default'       => '',
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ];

        foreach ( $string_fields as $field ) {
            register_post_meta( 'culture_post', $field, $string_meta_args );
            register_post_meta( 'post',         $field, $string_meta_args ); // legacy
        }

        // Register community_image_url with an explicit REST schema so that
        // no pattern constraint can be injected by other plugins or filters.
        $image_url_args = [
            'show_in_rest' => [
                'schema' => [
                    'type'    => 'string',
                    'default' => '',
                ],
            ],
            'single'        => true,
            'type'          => 'string',
            'default'       => '',
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ];
        register_post_meta( 'culture_post', 'community_image_url', $image_url_args );
        register_post_meta( 'post',         'community_image_url', $image_url_args ); // legacy

        // ── Moderation / report fields ────────────────────────────────────────
        $report_string_fields = [
            'community_reporter_ids',  // JSON-encoded array of user ID strings
            'community_report_reason', // last reported reason label
        ];
        foreach ( $report_string_fields as $field ) {
            register_post_meta( 'culture_post', $field, $string_meta_args );
            register_post_meta( 'post',         $field, $string_meta_args );
        }
        foreach ( [ 'culture_post', 'post' ] as $post_type ) {
            register_post_meta( $post_type, 'community_report_count', [
                'show_in_rest'  => true,
                'single'        => true,
                'type'          => 'integer',
                'default'       => 0,
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            ] );
        }

        // ── Reaction count fields ─────────────────────────────────────────────
        $reaction_fields = [ 'reaction_love', 'reaction_fire', 'reaction_clap' ];

        foreach ( [ 'culture_post', 'post', 'pulse_story' ] as $post_type ) {
            foreach ( $reaction_fields as $field ) {
                register_post_meta( $post_type, $field, [
                    'show_in_rest'  => true,
                    'single'        => true,
                    'type'          => 'integer',
                    'default'       => 0,
                    'auth_callback' => function () {
                        return current_user_can( 'edit_posts' );
                    },
                ] );
            }
        }
    }
}

Culture_Community::init();
