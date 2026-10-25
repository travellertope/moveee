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
        // Also flush when posts are trashed or permanently deleted
        add_action( 'trashed_post',   [ __CLASS__, 'flush_on_delete' ] );
        add_action( 'deleted_post',   [ __CLASS__, 'flush_on_delete' ] );
        add_action( 'untrashed_post', [ __CLASS__, 'flush_on_delete' ] );
        // Extend WP search for community posts to also match author meta fields
        // so searching a username (community_author_username) or display name
        // (community_author_name) returns the author's posts.
        add_filter( 'posts_search', [ __CLASS__, 'extend_community_meta_search' ], 10, 2 );
    }

    /**
     * Extend the SQL search clause for culture_post queries so that
     * community_author_username and community_author_name postmeta fields are
     * included alongside the default post_title / post_content search.
     *
     * Fires on both REST API and front-end WP_Query instances.
     */
    public static function extend_community_meta_search( $search, $wp_query ) {
        global $wpdb;

        if ( empty( $search ) ) {
            return $search;
        }

        // Only extend for queries that include culture_post
        $post_type = $wp_query->get( 'post_type' );
        if ( empty( $post_type ) ) {
            return $search;
        }
        $types = is_array( $post_type ) ? $post_type : [ $post_type ];
        if ( ! in_array( 'culture_post', $types, true ) ) {
            return $search;
        }

        $s = $wp_query->get( 's' );
        if ( empty( $s ) ) {
            return $search;
        }

        // Build one EXISTS subquery per search term per meta key.
        $terms      = array_filter( preg_split( '/[\s,]+/', $s ) );
        $meta_keys  = [ 'community_author_username', 'community_author_name' ];
        $extra_ors  = [];

        foreach ( $terms as $term ) {
            $like = '%' . $wpdb->esc_like( $term ) . '%';
            foreach ( $meta_keys as $key ) {
                $extra_ors[] = $wpdb->prepare(
                    "EXISTS (
                        SELECT 1 FROM {$wpdb->postmeta} cpm
                        WHERE cpm.post_id = {$wpdb->posts}.ID
                          AND cpm.meta_key = %s
                          AND cpm.meta_value LIKE %s
                    )",
                    $key,
                    $like
                );
            }
        }

        if ( empty( $extra_ors ) ) {
            return $search;
        }

        // $search is "AND (…existing title/content conditions…)".
        // Strip the trailing ")" and append the extra OR branches before re-closing.
        $extra_sql = implode( ' OR ', $extra_ors );
        $search    = preg_replace( '/\)\s*$/', " OR {$extra_sql})", $search );

        return $search;
    }

    public static function flush_on_delete( $post_id ) {
        $post = get_post( $post_id );
        if ( ! $post ) return;
        $cacheable_types = [ 'post', 'page', 'culture_newsletter', 'getmelit', 'culture_drop', 'culture_journey', 'culture_directory', 'culture_quote', 'culture_event', 'culture_post', 'product' ];
        if ( ! in_array( $post->post_type, $cacheable_types, true ) ) return;
        self::flush_vercel_kv_cache( $post_id, $post );
    }

    /**
     * Flush the Vercel KV GraphQL cache when a post is published or updated.
     * Only fires for public-facing post types (not drafts, not community posts).
     */
    public static function flush_on_publish( $new_status, $old_status, $post ) {
        if ( $new_status !== 'publish' ) {
            return;
        }
        $cacheable_types = [ 'post', 'page', 'culture_newsletter', 'getmelit', 'culture_drop', 'culture_journey', 'culture_directory', 'culture_quote', 'culture_event', 'culture_post', 'product' ];
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
        $base_url = defined( 'VERCEL_SITE_URL' ) ? VERCEL_SITE_URL : get_option( 'culture_vercel_site_url' );
        $kv_endpoint = $base_url . '/api/revalidate-kv';
        $tag_endpoint = $base_url . '/api/revalidate';

        if ( ! $secret || ! $base_url ) {
            return;
        }

        // Flush Vercel KV GraphQL cache (existing behaviour)
        wp_remote_post( $kv_endpoint, [
            'timeout'  => 5,
            'blocking' => false,
            'headers'  => [
                'Content-Type'        => 'application/json',
                'x-revalidate-secret' => $secret,
            ],
            'body' => wp_json_encode( [ 'post_id' => $post_id, 'post_type' => $post->post_type ] ),
        ] );

        // Invalidate unstable_cache data layer tags
        $type_to_tags = [
            'post'                => [ 'stories' ],
            'culture_newsletter'  => [ 'newsletters' ],
            'getmelit'            => [ 'newsletters' ],
            'culture_drop'        => [ 'newsletters' ],
            'culture_journey'     => [ 'stories' ],
            'culture_directory'   => [ 'directory' ],
            'culture_quote'       => [ 'quotes' ],
            'culture_event'       => [ 'events' ],
            'culture_post'        => [ 'pulse', 'community' ],
            'product'             => [ 'wp-content' ],
        ];
        $tags = $type_to_tags[ $post->post_type ] ?? [ 'wp-content' ];

        wp_remote_post( $tag_endpoint, [
            'timeout'  => 5,
            'blocking' => false,
            'headers'  => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $secret,
            ],
            'body' => wp_json_encode( [ 'tags' => $tags ] ),
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
            'community_author_rep_tier',
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
