<?php
/**
 * Synthetic "system author" WP user that editorially-seeded culture_quote
 * posts are attributed to instead of a real community member.
 *
 * Seeded quotes (created via /api/quotes/auto-populate — see the retirement
 * note in class-culture-cron.php and CLAUDE.md's Quotes-feed-merge entry)
 * were submitted with user_id=0, and handle_create_quote() previously fell
 * back straight to get_current_user_id() — also 0 for an unauthenticated
 * API-key request — so every seeded quote ended up with post_author = 0.
 * get_userdata(0) returns false, so any code reading a quote's author
 * (in particular get_quote_feed_items()'s communityAuthor/
 * communityAuthorUsername/communityAuthorAvatar fields, which the mobile
 * feed cards are already built to read) silently rendered blank.
 *
 * This mirrors Culture_Account_Deletion::get_placeholder_user_id() exactly
 * — a lazily-created, login-disabled WP user (random unusable password,
 * subscriber role) cached by option so it's only ever created once.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_System_Author {

    const OPTION_USER_ID = 'culture_system_author_user_id';
    const LOGIN          = 'moveee-editors';
    const DISPLAY_NAME    = 'Moveee';

    public static function init() {
        // wp_loaded (not init) — same reasoning as
        // Culture_Country_Cleanup::init(): this touches taxonomy data
        // (culture_quote_author terms) via WP_Query in the backfill below,
        // so it should run after every init-hooked callback (this plugin's
        // own CPT/taxonomy registration included) has had a chance to run.
        add_action( 'wp_loaded', array( __CLASS__, 'maybe_backfill_quote_authors' ) );
    }

    /**
     * Lazily creates (once) the "Moveee" system-author account that seeded
     * quotes with no real submitter get attributed to. Never used to log in.
     *
     * @return int|false
     */
    public static function get_id() {
        $existing = (int) get_option( self::OPTION_USER_ID, 0 );
        if ( $existing && get_userdata( $existing ) ) {
            return $existing;
        }

        $user = get_user_by( 'login', self::LOGIN );
        if ( $user ) {
            update_option( self::OPTION_USER_ID, $user->ID );
            return $user->ID;
        }

        $new_id = wp_insert_user( array(
            'user_login'   => self::LOGIN,
            'user_pass'    => wp_generate_password( 32, true, true ),
            'user_email'   => 'editors@' . wp_parse_url( home_url(), PHP_URL_HOST ),
            'display_name' => self::DISPLAY_NAME,
            'role'         => 'subscriber',
        ) );

        if ( is_wp_error( $new_id ) ) {
            return false;
        }

        // Avatar for the mobile feed's communityAuthorAvatar field (reads
        // from this same usermeta key for every other user, see
        // get_quote_feed_items() / get_community_feed_items()). Points at
        // the real Site A logo asset (see "Site A header logo updated" in
        // CLAUDE.md) rather than anything WordPress-hosted.
        update_user_meta( $new_id, '_culture_avatar_url', 'https://themoveee.com/logo-black.png' );

        update_option( self::OPTION_USER_ID, $new_id );
        return $new_id;
    }

    /**
     * One-time migration: reassigns any pre-existing culture_quote post
     * with post_author = 0 (every quote created before this class existed,
     * via the now-retired seeding automation) to the system author.
     * Gated the same way as every other maybe_backfill_* in this plugin —
     * runs once, tracked by option, safe to no-op on repeat calls.
     */
    public static function maybe_backfill_quote_authors() {
        if ( '1' === get_option( 'culture_quote_authors_backfilled', '' ) ) {
            return;
        }
        if ( ! post_type_exists( 'culture_quote' ) ) {
            return;
        }

        $system_author_id = self::get_id();
        if ( ! $system_author_id ) {
            return; // Couldn't create the account this run — try again next load.
        }

        $orphaned = get_posts( array(
            'post_type'      => 'culture_quote',
            'post_status'    => array( 'publish', 'pending', 'draft' ),
            'posts_per_page' => -1,
            'author'         => 0,
            'fields'         => 'ids',
        ) );

        foreach ( $orphaned as $post_id ) {
            wp_update_post( array(
                'ID'          => $post_id,
                'post_author' => $system_author_id,
            ) );
        }

        update_option( 'culture_quote_authors_backfilled', '1' );
    }
}
