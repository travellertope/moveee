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
        add_action( 'wp_loaded', array( __CLASS__, 'maybe_link_quotes_to_directory' ) );
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

    /**
     * One-time migration: point pre-existing quotes at the culture_directory
     * entries they were always talking about.
     *
     * Every quote before September 2026 stored who said it as a freeform
     * culture_quote_author taxonomy term and where it came from as a plain
     * _quote_source string — text that happened to spell a real Directory
     * entry's name without ever pointing at it. This resolves those into
     * real links so existing quotes show up on the right entry pages rather
     * than only new ones.
     *
     * **Exact, case-insensitive title match only — never fuzzy.** A near
     * match here would attribute words to the wrong person on their own
     * entry page, which is a different order of mistake from a missed link:
     * an unlinked quote is merely invisible, a mislinked one is a
     * fabrication. Anything that doesn't match exactly is left alone, to be
     * linked by hand or by a later, better-evidenced pass.
     *
     * Batched and resumable: the gate option is only set once a pass finds
     * nothing left to do, so a large archive finishes over several requests
     * instead of timing out on one.
     */
    public static function maybe_link_quotes_to_directory() {
        if ( '1' === get_option( 'culture_quotes_directory_linked', '' ) ) {
            return;
        }
        if ( ! post_type_exists( 'culture_quote' ) || ! post_type_exists( 'culture_directory' ) ) {
            return;
        }

        global $wpdb;
        $batch = 300;

        // Quotes still missing either link. LEFT JOINs rather than a
        // NOT EXISTS meta_query — same "unindexed meta_value" reasoning as
        // everywhere else in this plugin.
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT p.ID,
                    MAX(CASE WHEN m.meta_key = '_quote_source' THEN m.meta_value END) AS source,
                    MAX(CASE WHEN m.meta_key = '_quote_type'   THEN m.meta_value END) AS quote_type,
                    MAX(CASE WHEN m.meta_key = '_linked_directory_id' THEN 1 ELSE 0 END) AS has_work,
                    MAX(CASE WHEN m.meta_key = '_quote_author_directory_id' THEN 1 ELSE 0 END) AS has_author
             FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} m ON m.post_id = p.ID
             WHERE p.post_type = 'culture_quote' AND p.post_status = 'publish'
             GROUP BY p.ID
             HAVING has_work = 0 OR has_author = 0
             LIMIT %d",
            $batch
        ), ARRAY_A );

        if ( empty( $rows ) ) {
            update_option( 'culture_quotes_directory_linked', '1' );
            return;
        }

        // title (lowercased) -> id, per directory type, built once for the
        // whole batch rather than a lookup per quote.
        $index = self::directory_title_index( array( 'person', 'book', 'film', 'album' ) );

        // Which culture_dir_type a _quote_type implies. Person and Speech are
        // absent: a Person quote's source is the person (handled by the
        // author link), and a Speech has no directory type at all.
        $source_types = array( 'Book' => 'book', 'Film' => 'film', 'Song' => 'album' );

        foreach ( $rows as $row ) {
            $post_id = (int) $row['ID'];

            if ( ! (int) $row['has_author'] ) {
                $terms = get_the_terms( $post_id, 'culture_quote_author' );
                if ( $terms && ! is_wp_error( $terms ) && ! empty( $terms ) ) {
                    $key = strtolower( trim( $terms[0]->name ) );
                    if ( isset( $index['person'][ $key ] ) ) {
                        update_post_meta( $post_id, '_quote_author_directory_id', $index['person'][ $key ] );
                    }
                }
            }

            if ( ! (int) $row['has_work'] ) {
                $source = trim( (string) $row['source'] );
                $type   = $source_types[ (string) $row['quote_type'] ] ?? '';
                if ( '' !== $source && '' !== $type ) {
                    $key = strtolower( $source );
                    if ( isset( $index[ $type ][ $key ] ) ) {
                        update_post_meta( $post_id, '_linked_directory_id', $index[ $type ][ $key ] );
                    }
                }
            }
        }

        // Deliberately not setting the gate here: the next request picks up
        // whatever this batch didn't reach, and the empty-result branch above
        // closes it out. A quote that matched nothing is re-examined on each
        // pass until then, which is cheap and self-limiting.
    }

    /**
     * Lowercased-title -> post ID maps for the given culture_dir_type slugs.
     * A title shared by two entries of the same type keeps the first — an
     * ambiguous name is exactly the case where guessing is wrong, so this
     * never tries to pick between them.
     */
    private static function directory_title_index( array $type_slugs ) : array {
        global $wpdb;

        $index = array_fill_keys( $type_slugs, array() );
        $in    = "'" . implode( "','", array_map( 'esc_sql', $type_slugs ) ) . "'";

        $rows = $wpdb->get_results(
            "SELECT p.ID, p.post_title, t.slug
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->term_relationships} tr ON tr.object_id = p.ID
             INNER JOIN {$wpdb->term_taxonomy} tt
                     ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'culture_dir_type'
             INNER JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
             WHERE p.post_type = 'culture_directory' AND p.post_status = 'publish'
               AND t.slug IN ({$in})"
        );

        foreach ( $rows ?: array() as $row ) {
            $slug = (string) $row->slug;
            $key  = strtolower( trim( (string) $row->post_title ) );
            if ( '' === $key || ! isset( $index[ $slug ] ) || isset( $index[ $slug ][ $key ] ) ) {
                continue;
            }
            $index[ $slug ][ $key ] = (int) $row->ID;
        }

        return $index;
    }
}
