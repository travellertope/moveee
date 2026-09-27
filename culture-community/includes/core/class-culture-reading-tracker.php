<?php
/**
 * Reading Tracker — StoryGraph-style personal shelves over culture_directory
 * entries. See docs/reading-tracker-plan.md for the full spec.
 *
 * Originally books-only; generalised September 2026 to cover all five review
 * media (book / film / music / food / place — one per template in the
 * composer's REVIEW_FAMILY). The shelf table was already keyed on a plain
 * directory_id and needed no migration; what changed is that a medium is now
 * derived from each entry's culture_dir_type (see TYPE_MEDIA_MAP) so shelves
 * can be filtered and stats grouped by it, and that get_reading_stats() reads
 * every review template's rating/genre meta rather than book-review's alone.
 * The three internal status values are unchanged and stay deliberately
 * medium-neutral — the *labels* vary per medium ("Want to Read" vs "Want to
 * Watch"), in the frontends, not here.
 *
 * Mood/pace (Phase 3) is the one thing that did NOT generalise: its 12-tag
 * vocabulary is StoryGraph's and does not transfer to a restaurant or an
 * album, so it stays book-only by design. Don't "finish the job" by widening
 * it without a real vocabulary for the other four.
 *
 * Phase 1 (shelves + counts) shipped September 2026. Phase 2 added a
 * per-year reading goal, with progress always computed live off
 * wp_culture_reading_shelf — never cached, per the plan doc's own "don't
 * cache what's cheap to compute" reasoning. This pass adds Phase 3
 * (§1.3/§3.4 of the plan doc): community-sourced mood/pace tags on a book's
 * culture_directory entry — a fixed 12-tag vocabulary (MOOD_TAGS below,
 * StoryGraph's own published set, never admin-configurable per the plan
 * doc's explicit "do not let this grow ad hoc" rule) plus a slow/medium/fast
 * pace, aggregated by mode across every member's vote for that book. This
 * pass adds Phase 4 (§2/§4): the stats dashboard's `get_reading_stats()`
 * aggregation — a pure per-user raw-SQL read, never a WP_Query loop, per
 * CLAUDE.md's "Raw SQL REST endpoints" convention. Buddy Reads prefill and
 * the gamification hook are still later phases and are not implemented
 * here yet.
 *
 * Single source of truth for both REST surfaces (mobile JWT + web API-key),
 * same mirrored-endpoint convention as Culture_Community_RSVP/Culture_Follows.
 *
 * Privacy: every read/write here is scoped to the caller's own user_id —
 * this table has no public/other-user read path, unlike public-profile
 * endpoints. Never accept an arbitrary target user_id from an unauthenticated
 * or cross-user context. The one exception is mood/pace itself, which is
 * *by design* a community-aggregated, publicly-readable property of the
 * book (like _average_rating already is) — only the per-user vote row is
 * private in the sense that it's never exposed as "who voted what."
 */
class Culture_Reading_Tracker {

    const STATUSES = array( 'want_to_read', 'currently_reading', 'read' );

    // Fixed at 12 — StoryGraph's own published mood vocabulary. Mirrored in
    // packages/shared/lib/reading-tracker.ts (web) and a mobile TS const —
    // no shared source of truth across the PHP/TS boundary, same caveat this
    // codebase already documents for TEMPLATE_REP_GATE/notification icon
    // maps. Do not let this list grow ad hoc — see the plan doc §7.
    const MOOD_TAGS = array(
        'dark', 'emotional', 'funny', 'reflective', 'adventurous', 'mysterious',
        'hopeful', 'tense', 'sad', 'informative', 'lighthearted', 'inspiring',
    );

    const PACES = array( 'slow', 'medium', 'fast' );

    /**
     * The five media the log covers, one per review template in the composer's
     * REVIEW_FAMILY (place / food / music / book / film — see SubmitPost.tsx).
     * 'other' is not listed here: it is the computed fallback for a shelved
     * entry whose culture_dir_type maps to none of these, never a value anyone
     * picks.
     */
    const MEDIA = array( 'book', 'film', 'music', 'food', 'place' );

    /**
     * culture_dir_type slug -> medium. The medium is derived from the *entry*,
     * never from the review template that happens to link to it — Place
     * (hidden-gem) reviews are composed with no typeFilter at all, so the
     * template is not a reliable signal of what the thing actually is.
     *
     * An entry carrying two mapped types (a restaurant tagged both `place` and
     * `food`, say) resolves to whichever row the taxonomy query returns first.
     * That is arbitrary but stable, and both answers are defensible — don't add
     * tie-break rules here without a real case that needs them.
     */
    const TYPE_MEDIA_MAP = array(
        'book'        => 'book',
        'film'        => 'film',
        'tv-series'   => 'film',
        'album'       => 'music',
        'food'        => 'food',
        'recipe'      => 'food',
        'place'       => 'place',
        'restaurant'  => 'place',
        'event-venue' => 'place',
    );

    /**
     * Which review template's meta carries the overall rating / genre list per
     * medium. Food is deliberately absent from both: it stores three separate
     * breakdown ratings and no genre array (see get_reading_stats(), which
     * averages them and reads _cuisine_tag instead), and Place stores a flat
     * _star_rating with no genres at all.
     */
    const REVIEW_RATING_META = array(
        'book-review'  => '_book_overall_rating',
        'film-review'  => '_film_overall_rating',
        'music-review' => '_music_overall_rating',
        'hidden-gem'   => '_star_rating',
    );

    const REVIEW_GENRE_META = array(
        'book-review'  => '_book_genres',
        'film-review'  => '_film_genres',
        'music-review' => '_music_genres',
    );

    public static function table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_reading_shelf';
    }

    public static function goal_table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_reading_goal';
    }

    public static function mood_votes_table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_book_mood_votes';
    }

    public static function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            directory_id bigint(20) NOT NULL,
            status varchar(20) NOT NULL,
            started_at datetime DEFAULT NULL,
            finished_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY user_directory (user_id, directory_id),
            KEY user_status (user_id, status),
            KEY directory_status (directory_id, status)
        ) {$charset_collate};" );

        $goal_table = self::goal_table();
        dbDelta( "CREATE TABLE {$goal_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            year smallint(6) NOT NULL,
            target_books int(11) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY user_year (user_id, year)
        ) {$charset_collate};" );

        $mood_table = self::mood_votes_table();
        dbDelta( "CREATE TABLE {$mood_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            directory_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            moods text DEFAULT NULL,
            pace varchar(20) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY directory_user (directory_id, user_id)
        ) {$charset_collate};" );
    }

    /* ——————————————————————————————————————
     *  Medium resolution
     * —————————————————————————————————————— */

    /**
     * Batch directory_id -> medium. One raw taxonomy query for the whole set
     * rather than get_the_terms() per row, per the "Raw SQL REST endpoints"
     * convention — a shelf page or a year of logged entries would otherwise be
     * N term queries.
     *
     * Every requested id is present in the return value; anything with no
     * mapped culture_dir_type comes back as 'other'.
     */
    public static function media_for_directory_ids( array $ids ) : array {
        global $wpdb;

        $ids = array_values( array_unique( array_filter( array_map( 'absint', $ids ) ) ) );
        if ( empty( $ids ) ) {
            return array();
        }

        $in   = implode( ',', $ids );
        $rows = $wpdb->get_results(
            "SELECT tr.object_id, t.slug
             FROM {$wpdb->term_relationships} tr
             INNER JOIN {$wpdb->term_taxonomy} tt
                     ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'culture_dir_type'
             INNER JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
             WHERE tr.object_id IN ({$in})"
        );

        $out = array();
        foreach ( $rows ?: array() as $row ) {
            $object_id = (int) $row->object_id;
            if ( isset( $out[ $object_id ] ) ) {
                continue;
            }
            $medium = self::TYPE_MEDIA_MAP[ $row->slug ] ?? null;
            if ( $medium ) {
                $out[ $object_id ] = $medium;
            }
        }

        foreach ( $ids as $id ) {
            if ( ! isset( $out[ $id ] ) ) {
                $out[ $id ] = 'other';
            }
        }

        return $out;
    }

    /**
     * SQL fragment restricting a shelf query to one medium. Returns '' for an
     * empty/unrecognised medium (i.e. no filter). 'other' is the inverse of
     * every mapped slug, so an entry with no usable type stays reachable
     * through a filter rather than only under "All".
     */
    private static function medium_where_clause( string $medium, string $alias ) : string {
        global $wpdb;

        if ( '' === $medium ) {
            return '';
        }

        $exists_tpl = "SELECT 1 FROM {$wpdb->term_relationships} tr
                       INNER JOIN {$wpdb->term_taxonomy} tt
                               ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'culture_dir_type'
                       INNER JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
                       WHERE tr.object_id = {$alias}.directory_id AND t.slug IN (%s)";

        if ( 'other' === $medium ) {
            $all_mapped = "'" . implode( "','", array_map( 'esc_sql', array_keys( self::TYPE_MEDIA_MAP ) ) ) . "'";
            return ' AND NOT EXISTS (' . sprintf( $exists_tpl, $all_mapped ) . ')';
        }

        $slugs = array();
        foreach ( self::TYPE_MEDIA_MAP as $slug => $mapped ) {
            if ( $mapped === $medium ) {
                $slugs[] = $slug;
            }
        }
        if ( empty( $slugs ) ) {
            return '';
        }

        $in = "'" . implode( "','", array_map( 'esc_sql', $slugs ) ) . "'";
        return ' AND EXISTS (' . sprintf( $exists_tpl, $in ) . ')';
    }

    /* ——————————————————————————————————————
     *  Core writes
     * —————————————————————————————————————— */

    /**
     * @return array|WP_Error
     */
    public static function set_shelf_status( int $user_id, int $directory_id, string $status ) {
        if ( ! in_array( $status, self::STATUSES, true ) ) {
            return new WP_Error( 'invalid_status', 'Invalid shelf status.', array( 'status' => 400 ) );
        }

        $post = get_post( $directory_id );
        if ( ! $post || 'culture_directory' !== $post->post_type || 'publish' !== $post->post_status ) {
            return new WP_Error( 'invalid_entry', 'That entry could not be found.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table    = self::table();
        $now      = current_time( 'mysql' );
        $existing = $wpdb->get_row( $wpdb->prepare(
            "SELECT id, started_at, finished_at FROM {$table} WHERE user_id = %d AND directory_id = %d",
            $user_id, $directory_id
        ), ARRAY_A );

        $data = array( 'status' => $status, 'updated_at' => $now );
        // started_at/finished_at are sticky — set once, on first transition
        // into that state, never cleared or overwritten by a later move
        // (e.g. read -> currently_reading on a re-read keeps the original
        // finished_at; re-reads are explicitly out of scope for v1).
        if ( 'currently_reading' === $status && empty( $existing['started_at'] ) ) {
            $data['started_at'] = $now;
        }
        if ( 'read' === $status && empty( $existing['finished_at'] ) ) {
            $data['finished_at'] = $now;
        }

        if ( $existing ) {
            $wpdb->update( $table, $data, array( 'id' => $existing['id'] ) );
        } else {
            $data['user_id']      = $user_id;
            $data['directory_id'] = $directory_id;
            $data['created_at']   = $now;
            $wpdb->insert( $table, $data );
        }

        return array( 'directoryId' => $directory_id, 'status' => $status );
    }

    public static function remove_from_shelf( int $user_id, int $directory_id ) : bool {
        global $wpdb;
        return false !== $wpdb->delete(
            self::table(),
            array( 'user_id' => $user_id, 'directory_id' => $directory_id ),
            array( '%d', '%d' )
        );
    }

    /* ——————————————————————————————————————
     *  Reads (always scoped to the caller's own user_id)
     * —————————————————————————————————————— */

    /**
     * Flat per-status totals (the pre-existing shape every caller already
     * reads) plus a `byMedium` map of the same totals split by medium, which
     * is what drives the medium filter chips' counts. The whole shelf is
     * fetched to compute that split rather than a taxonomy join per status —
     * a personal shelf is small, and this is one query either way.
     */
    public static function get_shelf_counts( int $user_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT status, directory_id FROM " . self::table() . " WHERE user_id = %d",
            $user_id
        ), ARRAY_A );
        $rows = $rows ?: array();

        $counts    = array_fill_keys( self::STATUSES, 0 );
        $by_medium = array();
        foreach ( array_merge( self::MEDIA, array( 'other' ) ) as $medium ) {
            $by_medium[ $medium ] = array_fill_keys( self::STATUSES, 0 );
            $by_medium[ $medium ]['total'] = 0;
        }

        $media = self::media_for_directory_ids( wp_list_pluck( $rows, 'directory_id' ) );

        foreach ( $rows as $row ) {
            $status = (string) $row['status'];
            if ( ! isset( $counts[ $status ] ) ) {
                continue;
            }
            $counts[ $status ]++;

            $medium = $media[ (int) $row['directory_id'] ] ?? 'other';
            if ( ! isset( $by_medium[ $medium ] ) ) {
                $medium = 'other';
            }
            $by_medium[ $medium ][ $status ]++;
            $by_medium[ $medium ]['total']++;
        }

        $counts['total']    = count( $rows );
        $counts['byMedium'] = $by_medium;
        return $counts;
    }

    /**
     * Mirrors the shape of Culture_Directory::handle_browse()'s `entries` —
     * same card fields (title/thumbnail/author/averageRating) plus the
     * shelf-specific status/startedAt/finishedAt — so the frontend can reuse
     * its existing book-card component rather than a new one.
     */
    public static function get_user_shelf( int $user_id, string $status, int $page = 1, int $per_page = 20, string $medium = '' ) : array {
        if ( ! in_array( $status, self::STATUSES, true ) ) {
            return array( 'entries' => array(), 'total' => 0 );
        }

        global $wpdb;
        $table    = self::table();
        $page     = max( 1, $page );
        $per_page = min( 50, max( 1, $per_page ) );
        $offset   = ( $page - 1 ) * $per_page;

        $medium = sanitize_key( $medium );
        if ( '' !== $medium && 'other' !== $medium && ! in_array( $medium, self::MEDIA, true ) ) {
            $medium = '';
        }
        // Built from class constants only, never from request data — the
        // filter value itself is validated against self::MEDIA above before
        // it ever reaches this clause.
        $medium_sql = self::medium_where_clause( $medium, 's' );

        // Read shelf sorts newest-finished-first per the plan doc; the other
        // two sort by most-recently-touched.
        $order_by = ( 'read' === $status ) ? 's.finished_at DESC' : 's.updated_at DESC';

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT s.directory_id, s.status, s.started_at, s.finished_at
             FROM {$table} s
             WHERE s.user_id = %d AND s.status = %s {$medium_sql}
             ORDER BY {$order_by}
             LIMIT %d OFFSET %d",
            $user_id, $status, $per_page, $offset
        ), ARRAY_A );

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} s WHERE s.user_id = %d AND s.status = %s {$medium_sql}",
            $user_id, $status
        ) );

        if ( ! $rows ) {
            return array( 'entries' => array(), 'total' => $total );
        }

        $ids   = array_map( 'intval', wp_list_pluck( $rows, 'directory_id' ) );
        $posts = get_posts( array(
            'post_type'      => 'culture_directory',
            'post__in'       => $ids,
            'posts_per_page' => count( $ids ),
            'post_status'    => 'publish',
            'orderby'        => 'post__in',
        ) );

        $posts_by_id = array();
        foreach ( $posts as $p ) {
            $posts_by_id[ $p->ID ] = $p;
        }

        $media   = self::media_for_directory_ids( $ids );
        $entries = array();
        foreach ( $rows as $row ) {
            $dir_id = (int) $row['directory_id'];
            // The entry was unpublished/deleted since being shelved — skip
            // rather than render a broken card; the shelf row itself is left
            // alone (no orphan cleanup here, out of scope for v1).
            if ( ! isset( $posts_by_id[ $dir_id ] ) ) {
                continue;
            }
            $post  = $posts_by_id[ $dir_id ];
            $thumb = get_the_post_thumbnail_url( $post->ID, 'thumbnail' )
                ?: ( get_post_meta( $post->ID, '_external_cover_url', true ) ?: null );

            $entries[] = array(
                'directoryId'   => $post->ID,
                'title'         => $post->post_title,
                'slug'          => $post->post_name,
                'thumbnail'     => $thumb ?: null,
                'author'        => Culture_Directory::get_first_about_field( $post->ID ),
                'averageRating' => (float) get_post_meta( $post->ID, '_average_rating', true ) ?: null,
                'medium'        => $media[ $dir_id ] ?? 'other',
                'status'        => $row['status'],
                'startedAt'     => $row['started_at'] ?: null,
                'finishedAt'    => $row['finished_at'] ?: null,
            );
        }

        return array( 'entries' => $entries, 'total' => $total );
    }

    /* ——————————————————————————————————————
     *  Reading goal (Phase 2, per docs/reading-tracker-plan.md §1.2/§3.3)
     * —————————————————————————————————————— */

    /**
     * Progress is never stored — always computed live off the shelf table,
     * per the plan doc's reasoning (a personal per-user count read once on
     * one dashboard, not a denormalized counter read across many users'
     * lists like Hub member counts are).
     */
    public static function get_goal( int $user_id, int $year ) : array {
        global $wpdb;
        $target = $wpdb->get_var( $wpdb->prepare(
            "SELECT target_books FROM " . self::goal_table() . " WHERE user_id = %d AND year = %d",
            $user_id, $year
        ) );

        $read = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM " . self::table() . "
             WHERE user_id = %d AND status = 'read' AND finished_at IS NOT NULL AND YEAR(finished_at) = %d",
            $user_id, $year
        ) );

        return array(
            'year'   => $year,
            'target' => null !== $target ? (int) $target : null,
            'logged' => $read,

            // Deprecated book-era aliases — see get_reading_stats()'s own note
            // for why these stay for now.
            'targetBooks' => null !== $target ? (int) $target : null,
            'booksRead'   => $read,
        );
    }

    /**
     * @return array|WP_Error
     */
    public static function set_goal( int $user_id, int $year, int $target_books ) {
        if ( $target_books < 1 ) {
            return new WP_Error( 'invalid_target', 'Goal must be at least 1 entry.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table = self::goal_table();
        $now   = current_time( 'mysql' );

        $existing_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE user_id = %d AND year = %d",
            $user_id, $year
        ) );

        if ( $existing_id ) {
            $wpdb->update(
                $table,
                array( 'target_books' => $target_books, 'updated_at' => $now ),
                array( 'id' => $existing_id )
            );
        } else {
            $wpdb->insert( $table, array(
                'user_id'      => $user_id,
                'year'         => $year,
                'target_books' => $target_books,
                'created_at'   => $now,
                'updated_at'   => $now,
            ) );
        }

        return self::get_goal( $user_id, $year );
    }

    /* ——————————————————————————————————————
     *  Mood/pace tags (Phase 3, per docs/reading-tracker-plan.md §1.3/§3.4)
     * —————————————————————————————————————— */

    /**
     * One vote per (directory, user) — upsert on re-vote, never a duplicate
     * row. Recomputes and stores the book's aggregated _book_moods/_book_pace
     * postmeta from the whole vote table immediately after, same "small
     * per-book vote count, cheap to recompute" reasoning the plan doc gives
     * for not denormalizing this into a running counter.
     *
     * @return array|WP_Error
     */
    public static function vote_mood_pace( int $user_id, int $directory_id, array $moods, string $pace ) {
        $post = get_post( $directory_id );
        if ( ! $post || 'culture_directory' !== $post->post_type || 'publish' !== $post->post_status
            || ! has_term( 'book', 'culture_dir_type', $post ) ) {
            return new WP_Error( 'invalid_book', 'This book could not be found.', array( 'status' => 400 ) );
        }

        $moods = array_values( array_intersect( array_map( 'sanitize_key', $moods ), self::MOOD_TAGS ) );
        $pace  = sanitize_key( $pace );
        if ( ! in_array( $pace, self::PACES, true ) ) {
            return new WP_Error( 'invalid_pace', 'Invalid pace.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table   = self::mood_votes_table();
        $data    = array(
            'directory_id' => $directory_id,
            'user_id'      => $user_id,
            'moods'        => wp_json_encode( $moods ),
            'pace'         => $pace,
        );
        $existing_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE directory_id = %d AND user_id = %d",
            $directory_id, $user_id
        ) );

        if ( $existing_id ) {
            $wpdb->update( $table, $data, array( 'id' => $existing_id ) );
        } else {
            $data['created_at'] = current_time( 'mysql' );
            $wpdb->insert( $table, $data );
        }

        self::recompute_book_mood_pace( $directory_id );

        return self::get_book_mood_pace( $directory_id, $user_id );
    }

    /**
     * Recomputes the directory entry's aggregated _book_moods (top moods by
     * submission count — mode, mirroring how _average_rating aggregates many
     * individual review ratings into one displayed value) and _book_pace
     * (majority vote, ties broken toward 'medium' per the plan doc).
     */
    private static function recompute_book_mood_pace( int $directory_id ) {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT moods, pace FROM " . self::mood_votes_table() . " WHERE directory_id = %d",
            $directory_id
        ), ARRAY_A );

        $mood_counts = array_fill_keys( self::MOOD_TAGS, 0 );
        $pace_counts = array_fill_keys( self::PACES, 0 );

        foreach ( $rows ?: array() as $row ) {
            $moods = json_decode( (string) $row['moods'], true ) ?: array();
            foreach ( $moods as $mood ) {
                if ( isset( $mood_counts[ $mood ] ) ) {
                    $mood_counts[ $mood ]++;
                }
            }
            if ( isset( $pace_counts[ $row['pace'] ] ) ) {
                $pace_counts[ $row['pace'] ]++;
            }
        }

        // Top moods by count, dropping any with zero votes — a book with
        // sparse voting shouldn't display all 12 tags, just the ones that
        // actually got picked.
        arsort( $mood_counts );
        $top_moods = array_keys( array_filter( $mood_counts, static function ( $c ) {
            return $c > 0;
        } ) );
        $top_moods = array_slice( $top_moods, 0, 5 );

        // Majority pace, ties broken toward 'medium'.
        $max_pace_count = max( $pace_counts );
        $top_pace       = null;
        if ( $max_pace_count > 0 ) {
            $leaders  = array_keys( array_filter( $pace_counts, static function ( $c ) use ( $max_pace_count ) {
                return $c === $max_pace_count;
            } ) );
            $top_pace = in_array( 'medium', $leaders, true ) ? 'medium' : $leaders[0];
        }

        update_post_meta( $directory_id, '_book_moods', wp_json_encode( $top_moods ) );
        if ( $top_pace ) {
            update_post_meta( $directory_id, '_book_pace', $top_pace );
        } else {
            delete_post_meta( $directory_id, '_book_pace' );
        }
    }

    /**
     * Aggregated moods/pace for display, plus (when $viewer_user_id is
     * given) that user's own current vote — so the frontend can decide
     * whether to show the "how would you describe this book?" prompt or an
     * "edit your vote" state instead.
     */
    public static function get_book_mood_pace( int $directory_id, int $viewer_user_id = 0 ) : array {
        $moods = json_decode( (string) get_post_meta( $directory_id, '_book_moods', true ), true ) ?: array();
        $pace  = get_post_meta( $directory_id, '_book_pace', true ) ?: null;

        $result = array(
            'directoryId' => $directory_id,
            'moods'       => $moods,
            'pace'        => $pace,
            'myVote'      => null,
        );

        if ( $viewer_user_id > 0 ) {
            global $wpdb;
            $row = $wpdb->get_row( $wpdb->prepare(
                "SELECT moods, pace FROM " . self::mood_votes_table() . " WHERE directory_id = %d AND user_id = %d",
                $directory_id, $viewer_user_id
            ), ARRAY_A );
            if ( $row ) {
                $result['myVote'] = array(
                    'moods' => json_decode( (string) $row['moods'], true ) ?: array(),
                    'pace'  => $row['pace'],
                );
            }
        }

        return $result;
    }

    /**
     * Phase 4 stats dashboard — see docs/reading-tracker-plan.md §2/§4.
     * A pure per-user aggregation read, raw SQL throughout per CLAUDE.md's
     * "Raw SQL REST endpoints" convention (never a WP_Query loop over posts
     * for this kind of query). Rating distribution and top genres are
     * sourced from the user's own Book Review posts (culture_post,
     * _template_type = 'book-review') linked via _linked_directory_id to a
     * book that's on this user's "read" shelf for the given year — per the
     * plan doc's §1.4 "reuse, not new" rule, rating/genres already live on
     * the review, this never duplicates them onto the shelf row itself.
     *
     * @return array Shape documented in the plan doc §2 "GET stats response shape".
     */
    public static function get_reading_stats( int $user_id, int $year ) : array {
        global $wpdb;
        $shelf_table = self::table();

        // Directory IDs + finish dates for everything this user logged in $year.
        $read_rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT directory_id, finished_at FROM {$shelf_table}
             WHERE user_id = %d AND status = 'read' AND YEAR(finished_at) = %d",
            $user_id, $year
        ), ARRAY_A );
        $read_rows = $read_rows ?: array();

        $entries_logged = count( $read_rows );
        $directory_ids  = array_map( 'intval', wp_list_pluck( $read_rows, 'directory_id' ) );
        $media          = self::media_for_directory_ids( $directory_ids );

        $per_month = array();
        for ( $m = 1; $m <= 12; $m++ ) {
            $per_month[ sprintf( '%04d-%02d', $year, $m ) ] = 0;
        }
        $medium_breakdown = array_fill_keys( array_merge( self::MEDIA, array( 'other' ) ), 0 );

        foreach ( $read_rows as $row ) {
            $medium = $media[ (int) $row['directory_id'] ] ?? 'other';
            if ( isset( $medium_breakdown[ $medium ] ) ) {
                $medium_breakdown[ $medium ]++;
            }
            if ( empty( $row['finished_at'] ) ) {
                continue;
            }
            $key = substr( $row['finished_at'], 0, 7 ); // "YYYY-MM"
            if ( isset( $per_month[ $key ] ) ) {
                $per_month[ $key ]++;
            }
        }

        $per_month_list = array();
        foreach ( $per_month as $month => $count ) {
            $per_month_list[] = array( 'month' => $month, 'count' => $count );
        }

        $pace_breakdown      = array( 'slow' => 0, 'medium' => 0, 'fast' => 0 );
        $mood_breakdown      = array_fill_keys( self::MOOD_TAGS, 0 );
        $rating_distribution = array( '1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0 );
        $genre_counts        = array();
        $genre_media         = array();

        if ( ! empty( $directory_ids ) ) {
            $ids_in = implode( ',', array_map( 'absint', $directory_ids ) );

            // Pace + moods are book-only by design (the vocabulary is
            // StoryGraph's and doesn't transfer to a restaurant or an album),
            // so these two breakdowns stay scoped to books even though every
            // other figure here now spans all five media. They read the
            // already-aggregated community values on the directory post —
            // see get_book_mood_pace().
            $meta_rows = $wpdb->get_results(
                "SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta}
                 WHERE post_id IN ({$ids_in}) AND meta_key IN ('_book_pace', '_book_moods')"
            );
            foreach ( $meta_rows ?: array() as $row ) {
                if ( '_book_pace' === $row->meta_key && isset( $pace_breakdown[ $row->meta_value ] ) ) {
                    $pace_breakdown[ $row->meta_value ]++;
                } elseif ( '_book_moods' === $row->meta_key ) {
                    $moods = json_decode( (string) $row->meta_value, true );
                    if ( is_array( $moods ) ) {
                        foreach ( $moods as $mood ) {
                            if ( isset( $mood_breakdown[ $mood ] ) ) {
                                $mood_breakdown[ $mood ]++;
                            }
                        }
                    }
                }
            }

            // Ratings + genres come from this user's own reviews linked to one
            // of these entries — all five review templates, not just
            // book-review. One pivoted postmeta join rather than a query per
            // template, per the "Raw SQL REST endpoints" convention.
            $review_rows = $wpdb->get_results( $wpdb->prepare(
                "SELECT p.ID,
                        MAX(CASE WHEN pm.meta_key = '_template_type'        THEN pm.meta_value END) AS template,
                        MAX(CASE WHEN pm.meta_key = '_linked_directory_id'  THEN pm.meta_value END) AS directory_id,
                        MAX(CASE WHEN pm.meta_key = '_book_overall_rating'  THEN pm.meta_value END) AS rating_book,
                        MAX(CASE WHEN pm.meta_key = '_film_overall_rating'  THEN pm.meta_value END) AS rating_film,
                        MAX(CASE WHEN pm.meta_key = '_music_overall_rating' THEN pm.meta_value END) AS rating_music,
                        MAX(CASE WHEN pm.meta_key = '_star_rating'          THEN pm.meta_value END) AS rating_star,
                        MAX(CASE WHEN pm.meta_key = '_food_rating_taste'    THEN pm.meta_value END) AS food_taste,
                        MAX(CASE WHEN pm.meta_key = '_food_rating_value'    THEN pm.meta_value END) AS food_value,
                        MAX(CASE WHEN pm.meta_key = '_food_rating_vibe'     THEN pm.meta_value END) AS food_vibe,
                        MAX(CASE WHEN pm.meta_key = '_book_genres'          THEN pm.meta_value END) AS genres_book,
                        MAX(CASE WHEN pm.meta_key = '_film_genres'          THEN pm.meta_value END) AS genres_film,
                        MAX(CASE WHEN pm.meta_key = '_music_genres'         THEN pm.meta_value END) AS genres_music,
                        MAX(CASE WHEN pm.meta_key = '_cuisine_tag'          THEN pm.meta_value END) AS cuisine
                 FROM {$wpdb->posts} p
                 INNER JOIN {$wpdb->postmeta} pm_link
                         ON pm_link.post_id = p.ID
                        AND pm_link.meta_key = '_linked_directory_id'
                        AND pm_link.meta_value IN ({$ids_in})
                 INNER JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
                 WHERE p.post_author = %d AND p.post_type = 'culture_post' AND p.post_status = 'publish'
                 GROUP BY p.ID",
                $user_id
            ), ARRAY_A );

            foreach ( $review_rows ?: array() as $row ) {
                $template = (string) $row['template'];
                $medium   = $media[ (int) $row['directory_id'] ] ?? 'other';

                // Food has no single overall rating — average its three
                // breakdown scores, exactly as the composer already derives an
                // overall from a breakdown for book/music/film.
                if ( 'food-review' === $template ) {
                    $parts = array_values( array_filter( array(
                        (int) $row['food_taste'],
                        (int) $row['food_value'],
                        (int) $row['food_vibe'],
                    ) ) );
                    $rating = $parts ? (int) round( array_sum( $parts ) / count( $parts ) ) : 0;
                } else {
                    $key    = self::REVIEW_RATING_META[ $template ] ?? '';
                    $column = array(
                        '_book_overall_rating'  => 'rating_book',
                        '_film_overall_rating'  => 'rating_film',
                        '_music_overall_rating' => 'rating_music',
                        '_star_rating'          => 'rating_star',
                    )[ $key ] ?? '';
                    $rating = $column ? (int) $row[ $column ] : 0;
                }

                if ( $rating >= 1 && $rating <= 5 ) {
                    $rating_distribution[ (string) $rating ]++;
                }

                // Genres: a JSON array for book/film/music, a single cuisine
                // string for food. Place carries neither.
                $genres = array();
                if ( 'food-review' === $template ) {
                    $cuisine = sanitize_text_field( (string) $row['cuisine'] );
                    if ( '' !== $cuisine ) {
                        $genres[] = $cuisine;
                    }
                } else {
                    $key    = self::REVIEW_GENRE_META[ $template ] ?? '';
                    $column = array(
                        '_book_genres'  => 'genres_book',
                        '_film_genres'  => 'genres_film',
                        '_music_genres' => 'genres_music',
                    )[ $key ] ?? '';
                    if ( $column ) {
                        $decoded = json_decode( (string) $row[ $column ], true );
                        if ( is_array( $decoded ) ) {
                            $genres = $decoded;
                        }
                    }
                }

                foreach ( $genres as $genre ) {
                    $genre = sanitize_text_field( $genre );
                    if ( '' === $genre ) {
                        continue;
                    }
                    $genre_counts[ $genre ] = ( $genre_counts[ $genre ] ?? 0 ) + 1;
                    if ( ! isset( $genre_media[ $genre ] ) ) {
                        $genre_media[ $genre ] = $medium;
                    }
                }
            }
        }

        // Mood breakdown as a sparse, sorted list (nonzero only) rather than
        // the full fixed-12 map — the frontend renders "one row per mood with
        // a nonzero count, sorted descending" per the plan doc §4.
        arsort( $mood_breakdown );
        $mood_breakdown_sparse = array();
        foreach ( $mood_breakdown as $mood => $count ) {
            if ( $count > 0 ) {
                $mood_breakdown_sparse[ $mood ] = $count;
            }
        }

        arsort( $genre_counts );
        $top_genres = array();
        foreach ( array_slice( $genre_counts, 0, 5, true ) as $genre => $count ) {
            $top_genres[] = array(
                'genre'  => $genre,
                'count'  => $count,
                'medium' => $genre_media[ $genre ] ?? 'other',
            );
        }

        return array(
            'year'                => $year,
            'entries_logged'      => $entries_logged,
            'medium_breakdown'    => $medium_breakdown,
            'per_month'           => $per_month_list,
            'pace_breakdown'      => $pace_breakdown,
            'mood_breakdown'      => $mood_breakdown_sparse,
            'rating_distribution' => $rating_distribution,
            'top_genres'          => $top_genres,

            // Deprecated book-era aliases. Kept so an already-installed mobile
            // build (which can't be force-updated) keeps rendering after this
            // widens; drop them once the field has turned over.
            'books_read'          => $entries_logged,
            'books_per_month'     => $per_month_list,
        );
    }
}
