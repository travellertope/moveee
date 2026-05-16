<?php
/**
 * Moveee Community Posts — Meta Registration.
 *
 * Registers REST-exposed meta fields on the standard WP 'post' type so that
 * community posts submitted via the Next.js API route carry proper author
 * attribution, an optional image URL, and a content tag.
 *
 * Fields:
 *   community_author_name — display name of the submitting member
 *   community_author_id   — their NextAuth / WP user ID (string)
 *   community_image_url   — optional image URL attached to the post
 *   community_tag         — topic tag e.g. Music, Fashion, Tech
 *
 * These fields are:
 *   - Readable by anyone via the REST API (show_in_rest: true)
 *   - Writable only by users who can edit posts (the site's admin app
 *     password satisfies this; regular subscriber-level users cannot write
 *     these fields directly)
 *   - Backed up by UpdraftPlus (stored in wp_postmeta, same as all WP meta)
 *   - Queryable via WP_Query / REST meta_query for future per-user feeds
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Community {

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_meta' ] );
    }

    public static function register_meta() {
        $fields = [
            'community_author_name',
            'community_author_id',
            'community_image_url',
            'community_tag',
        ];

        foreach ( $fields as $field ) {
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
    }
}

Culture_Community::init();
