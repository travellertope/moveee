<?php
/**
 * Reading Tracker — StoryGraph-style personal shelves (Want to Read /
 * Currently Reading / Read) over the existing culture_directory `book`
 * entries. See docs/reading-tracker-plan.md for the full spec.
 *
 * Phase 1 (shelves + counts) shipped September 2026. This pass adds
 * Phase 2 (§1.2/§3.3 of the plan doc): a per-year reading goal, with
 * progress always computed live off wp_culture_reading_shelf — never
 * cached, per the plan doc's own "don't cache what's cheap to compute"
 * reasoning. Mood/pace and stats are still later phases and are not
 * implemented here yet.
 *
 * Single source of truth for both REST surfaces (mobile JWT + web API-key),
 * same mirrored-endpoint convention as Culture_Community_RSVP/Culture_Follows.
 *
 * Privacy: every read/write here is scoped to the caller's own user_id —
 * this table has no public/other-user read path, unlike public-profile
 * endpoints. Never accept an arbitrary target user_id from an unauthenticated
 * or cross-user context.
 */
class Culture_Reading_Tracker {

    const STATUSES = array( 'want_to_read', 'currently_reading', 'read' );

    public static function table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_reading_shelf';
    }

    public static function goal_table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_reading_goal';
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
            return new WP_Error( 'invalid_book', 'This book could not be found.', array( 'status' => 400 ) );
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

    public static function get_shelf_counts( int $user_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT status, COUNT(*) AS c FROM " . self::table() . " WHERE user_id = %d GROUP BY status",
            $user_id
        ), ARRAY_A );

        $counts = array_fill_keys( self::STATUSES, 0 );
        foreach ( $rows ?: array() as $row ) {
            if ( isset( $counts[ $row['status'] ] ) ) {
                $counts[ $row['status'] ] = (int) $row['c'];
            }
        }
        return $counts;
    }

    /**
     * Mirrors the shape of Culture_Directory::handle_browse()'s `entries` —
     * same card fields (title/thumbnail/author/averageRating) plus the
     * shelf-specific status/startedAt/finishedAt — so the frontend can reuse
     * its existing book-card component rather than a new one.
     */
    public static function get_user_shelf( int $user_id, string $status, int $page = 1, int $per_page = 20 ) : array {
        if ( ! in_array( $status, self::STATUSES, true ) ) {
            return array( 'entries' => array(), 'total' => 0 );
        }

        global $wpdb;
        $table    = self::table();
        $page     = max( 1, $page );
        $per_page = min( 50, max( 1, $per_page ) );
        $offset   = ( $page - 1 ) * $per_page;

        // Read shelf sorts newest-finished-first per the plan doc; the other
        // two sort by most-recently-touched.
        $order_by = ( 'read' === $status ) ? 'finished_at DESC' : 'updated_at DESC';

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT directory_id, status, started_at, finished_at
             FROM {$table}
             WHERE user_id = %d AND status = %s
             ORDER BY {$order_by}
             LIMIT %d OFFSET %d",
            $user_id, $status, $per_page, $offset
        ), ARRAY_A );

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND status = %s",
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

        $entries = array();
        foreach ( $rows as $row ) {
            $dir_id = (int) $row['directory_id'];
            // The book was unpublished/deleted since being shelved — skip
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
            'year'        => $year,
            'targetBooks' => null !== $target ? (int) $target : null,
            'booksRead'   => $read,
        );
    }

    /**
     * @return array|WP_Error
     */
    public static function set_goal( int $user_id, int $year, int $target_books ) {
        if ( $target_books < 1 ) {
            return new WP_Error( 'invalid_target', 'Goal must be at least 1 book.', array( 'status' => 400 ) );
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
}
