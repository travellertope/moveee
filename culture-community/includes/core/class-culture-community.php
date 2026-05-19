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
    }

    public static function register_meta() {
        // ── Community post attribution fields (post type: post) ──────────────
        $string_fields = [
            'community_author_name',
            'community_author_id',
            'community_image_url',
            'community_tag',
            'community_region',
            'community_author_tier',
        ];

        foreach ( $string_fields as $field ) {
            register_post_meta( 'post', $field, [
                'show_in_rest'  => true,
                'single'        => true,
                'type'          => 'string',
                'default'       => '',
                'auth_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
            ] );
        }

        // ── Reaction count fields — community posts (post type: post) ────────
        // ── Reaction count fields — pulse stories (post type: pulse_story) ───
        //
        // Each field is an integer reaction count for one emoji.
        // Writes are restricted to edit_posts capability (admin app password).
        // Reads are public (show_in_rest: true, no auth needed for GET).
        $reaction_fields = [ 'reaction_love', 'reaction_fire', 'reaction_clap' ];

        foreach ( [ 'post', 'pulse_story' ] as $post_type ) {
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
