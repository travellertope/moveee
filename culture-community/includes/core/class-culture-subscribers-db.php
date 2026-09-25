<?php
/**
 * Real subscriber storage — replaces the flat `culture_newsletter_subscribers`
 * wp_options array (an array of {email,name,location,date,lists[],segment}
 * objects) with wp_culture_subscribers + wp_culture_subscriber_lists
 * (many-to-many against Culture_Newsletter_Lists' list registry).
 *
 * This is the single place every other class (admin UI, REST endpoints,
 * mobile API, the send queue, Culture_Literary_Access, WP-CLI) should go
 * through to read or write subscriber data — none of them should touch
 * get_option('culture_newsletter_subscribers') or the new tables directly.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Subscribers_DB {

    /** One-time migration gate option. */
    const MIGRATED_OPTION = 'culture_subscribers_migrated_to_db';

    public static function subscribers_table() {
        global $wpdb;
        return $wpdb->prefix . 'culture_subscribers';
    }

    public static function sub_lists_table() {
        global $wpdb;
        return $wpdb->prefix . 'culture_subscriber_lists';
    }

    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $subs_table = self::subscribers_table();
        dbDelta( "CREATE TABLE {$subs_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            email varchar(191) NOT NULL DEFAULT '',
            name varchar(255) NOT NULL DEFAULT '',
            location varchar(255) NOT NULL DEFAULT '',
            user_id bigint(20) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY email (email),
            KEY user_idx (user_id)
        ) {$charset_collate};" );

        $sub_lists_table = self::sub_lists_table();
        dbDelta( "CREATE TABLE {$sub_lists_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            subscriber_id bigint(20) NOT NULL,
            list_id bigint(20) NOT NULL,
            subscribed_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY sub_list (subscriber_id, list_id),
            KEY list_idx (list_id)
        ) {$charset_collate};" );
    }

    public static function init() {
        self::maybe_migrate_from_options();
    }

    /**
     * One-time migration from the old culture_newsletter_subscribers option
     * array. Every list/segment slug referenced by an existing subscriber is
     * ensured to exist in the registry first (covers any custom slug an
     * admin may have hand-entered outside the old LIST_OPTIONS/
     * SEGMENT_OPTIONS constants), then each subscriber row + its list
     * memberships are inserted. Gated so it only ever runs once — a
     * subscriber added/edited after migration lives in the DB only, the old
     * option is left in place (untouched, unread) as a historical snapshot.
     */
    private static function maybe_migrate_from_options() {
        if ( '1' === get_option( self::MIGRATED_OPTION, '' ) ) {
            return;
        }

        $old = get_option( 'culture_newsletter_subscribers', array() );
        if ( ! empty( $old ) && is_array( $old ) ) {
            foreach ( $old as $sub ) {
                $email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
                $email = sanitize_email( $email );
                if ( ! $email || ! is_email( $email ) ) {
                    continue;
                }

                $name     = is_array( $sub ) ? ( $sub['name'] ?? '' ) : '';
                $location = is_array( $sub ) ? ( $sub['location'] ?? '' ) : '';
                $date     = is_array( $sub ) && ! empty( $sub['date'] ) ? $sub['date'] : current_time( 'mysql' );

                $sub_id = self::get_or_create( $email, $name, $location, 0, $date );

                $lists = is_array( $sub ) ? (array) ( $sub['lists'] ?? array() ) : array();
                if ( empty( $lists ) ) {
                    // Legacy plain-string subscribers were always treated as
                    // GetMeLit-only throughout the old codebase.
                    $lists = array( 'getmelit' );
                }
                foreach ( $lists as $list_slug ) {
                    $list_slug = sanitize_title( $list_slug );
                    if ( ! $list_slug ) {
                        continue;
                    }
                    $list = Culture_Newsletter_Lists::get_by_slug( $list_slug );
                    if ( ! $list ) {
                        $list = Culture_Newsletter_Lists::create( array(
                            'slug' => $list_slug,
                            'name' => ucwords( str_replace( '-', ' ', $list_slug ) ),
                            'type' => Culture_Newsletter_Lists::TYPE_CONTENT,
                        ) );
                    }
                    if ( $list && ! is_wp_error( $list ) ) {
                        self::add_to_list_id( $sub_id, $list['id'] );
                    }
                }

                $segment = is_array( $sub ) ? ( $sub['segment'] ?? '' ) : '';
                if ( $segment ) {
                    $segment = sanitize_title( $segment );
                    $list    = Culture_Newsletter_Lists::get_by_slug( $segment );
                    if ( ! $list ) {
                        $list = Culture_Newsletter_Lists::create( array(
                            'slug' => $segment,
                            'name' => strtoupper( $segment ),
                            'type' => Culture_Newsletter_Lists::TYPE_REGION,
                        ) );
                    }
                    if ( $list && ! is_wp_error( $list ) ) {
                        self::add_to_list_id( $sub_id, $list['id'] );
                    }
                }
            }
        }

        update_option( self::MIGRATED_OPTION, '1' );
    }

    // ── Reads ────────────────────────────────────────────────────────────

    public static function find_by_email( $email ) {
        global $wpdb;
        $email = sanitize_email( $email );
        if ( ! $email ) {
            return null;
        }
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::subscribers_table() . " WHERE email = %s",
            $email
        ), ARRAY_A );
        return $row ? self::format( $row ) : null;
    }

    public static function get( $id ) {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM " . self::subscribers_table() . " WHERE id = %d",
            $id
        ), ARRAY_A );
        return $row ? self::format( $row ) : null;
    }

    private static function format( array $row ) {
        return array(
            'id'        => (int) $row['id'],
            'email'     => $row['email'],
            'name'      => $row['name'],
            'location'  => $row['location'],
            'userId'    => (int) $row['user_id'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        );
    }

    /**
     * @return array List slugs this subscriber currently belongs to.
     */
    public static function get_list_slugs_for_email( $email ) {
        $sub = self::find_by_email( $email );
        if ( ! $sub ) {
            return array();
        }
        return self::get_list_slugs( $sub['id'] );
    }

    public static function get_list_slugs( $subscriber_id ) {
        global $wpdb;
        return $wpdb->get_col( $wpdb->prepare(
            "SELECT l.slug FROM " . Culture_Newsletter_Lists::table() . " l
             INNER JOIN " . self::sub_lists_table() . " sl ON sl.list_id = l.id
             WHERE sl.subscriber_id = %d",
            $subscriber_id
        ) );
    }

    public static function get_list_ids( $subscriber_id ) {
        global $wpdb;
        return array_map( 'intval', $wpdb->get_col( $wpdb->prepare(
            "SELECT list_id FROM " . self::sub_lists_table() . " WHERE subscriber_id = %d",
            $subscriber_id
        ) ) );
    }

    public static function is_in_list_slug( $email, $list_slug ) {
        return in_array( $list_slug, self::get_list_slugs_for_email( $email ), true );
    }

    public static function count() {
        global $wpdb;
        return (int) $wpdb->get_var( "SELECT COUNT(*) FROM " . self::subscribers_table() );
    }

    /**
     * Paginated list of subscribers, each with its lists[] attached, for the
     * admin Subscribers page. Also accepts `date_from`/`date_to` (Y-m-d
     * strings, inclusive, filtered against `created_at`) for the Subscriber
     * List's date-joined filter.
     */
    public static function all( $args = array() ) {
        global $wpdb;
        $page      = max( 1, (int) ( $args['page'] ?? 1 ) );
        $per_page  = min( 200, max( 1, (int) ( $args['per_page'] ?? 50 ) ) );
        $offset    = ( $page - 1 ) * $per_page;
        $search    = trim( (string) ( $args['search'] ?? '' ) );
        $list_id   = (int) ( $args['list_id'] ?? 0 );
        $date_from = trim( (string) ( $args['date_from'] ?? '' ) );
        $date_to   = trim( (string) ( $args['date_to'] ?? '' ) );

        $subs_table  = self::subscribers_table();
        $sl_table    = self::sub_lists_table();

        $where  = array( '1=1' );
        $params = array();

        if ( $search ) {
            $where[]  = '(s.email LIKE %s OR s.name LIKE %s)';
            $like     = '%' . $wpdb->esc_like( $search ) . '%';
            $params[] = $like;
            $params[] = $like;
        }

        if ( $date_from ) {
            $where[]  = 's.created_at >= %s';
            $params[] = $date_from . ' 00:00:00';
        }

        if ( $date_to ) {
            $where[]  = 's.created_at <= %s';
            $params[] = $date_to . ' 23:59:59';
        }

        $join = '';
        if ( $list_id ) {
            $join     = " INNER JOIN {$sl_table} filt ON filt.subscriber_id = s.id AND filt.list_id = %d";
            array_unshift( $params, $list_id );
        }

        $where_sql = implode( ' AND ', $where );

        $count_sql = "SELECT COUNT(*) FROM {$subs_table} s {$join} WHERE {$where_sql}";
        $total     = $params ? (int) $wpdb->get_var( $wpdb->prepare( $count_sql, $params ) ) : (int) $wpdb->get_var( $count_sql );

        $sql = "SELECT s.* FROM {$subs_table} s {$join} WHERE {$where_sql} ORDER BY s.created_at DESC LIMIT %d OFFSET %d";
        $sql_params = array_merge( $params, array( $per_page, $offset ) );
        $rows = $wpdb->get_results( $wpdb->prepare( $sql, $sql_params ), ARRAY_A );

        $subs = array();
        foreach ( $rows ?: array() as $row ) {
            $formatted           = self::format( $row );
            $formatted['lists']  = self::get_list_slugs( $formatted['id'] );
            $subs[]              = $formatted;
        }

        return array(
            'subscribers' => $subs,
            'total'       => $total,
            'page'        => $page,
            'perPage'     => $per_page,
        );
    }

    // ── Writes ───────────────────────────────────────────────────────────

    /**
     * Find-or-create a subscriber row. Does not touch list membership.
     * @return int Subscriber ID.
     */
    public static function get_or_create( $email, $name = '', $location = '', $user_id = 0, $created_at = '' ) {
        global $wpdb;
        $email = sanitize_email( $email );

        $existing = self::find_by_email( $email );
        if ( $existing ) {
            return $existing['id'];
        }

        $wpdb->insert( self::subscribers_table(), array(
            'email'      => $email,
            'name'       => sanitize_text_field( $name ),
            'location'   => sanitize_text_field( $location ),
            'user_id'    => (int) $user_id,
            'created_at' => $created_at ?: current_time( 'mysql' ),
            'updated_at' => current_time( 'mysql' ),
        ), array( '%s', '%s', '%s', '%d', '%s', '%s' ) );

        return (int) $wpdb->insert_id;
    }

    public static function update_subscriber( $id, array $data ) {
        global $wpdb;
        $set    = array( 'updated_at' => current_time( 'mysql' ) );
        $format = array( '%s' );

        if ( isset( $data['name'] ) ) {
            $set['name'] = sanitize_text_field( $data['name'] );
            $format[]    = '%s';
        }
        if ( isset( $data['location'] ) ) {
            $set['location'] = sanitize_text_field( $data['location'] );
            $format[]        = '%s';
        }

        $wpdb->update( self::subscribers_table(), $set, array( 'id' => $id ), $format, array( '%d' ) );

        return self::get( $id );
    }

    public static function delete_subscriber_by_email( $email ) {
        $sub = self::find_by_email( $email );
        if ( ! $sub ) {
            return;
        }
        global $wpdb;
        $wpdb->delete( self::sub_lists_table(), array( 'subscriber_id' => $sub['id'] ), array( '%d' ) );
        $wpdb->delete( self::subscribers_table(), array( 'id' => $sub['id'] ), array( '%d' ) );
    }

    private static function add_to_list_id( $subscriber_id, $list_id ) {
        global $wpdb;
        $exists = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM " . self::sub_lists_table() . " WHERE subscriber_id = %d AND list_id = %d",
            $subscriber_id, $list_id
        ) );
        if ( $exists ) {
            return true;
        }
        return false !== $wpdb->insert( self::sub_lists_table(), array(
            'subscriber_id' => $subscriber_id,
            'list_id'       => $list_id,
            'subscribed_at' => current_time( 'mysql' ),
        ), array( '%d', '%d', '%s' ) );
    }

    /**
     * Public wrappers around add_to_list_id()/a direct delete, keyed by
     * subscriber_id + list_id rather than email + slug — used by the admin
     * Subscribers page's bulk "Add to list" / "Remove from list" actions,
     * which already have both ids in hand from the checkbox list + the
     * bulk-action dropdown and shouldn't need a slug round trip.
     */
    public static function add_subscriber_to_list_id( $subscriber_id, $list_id ) {
        return self::add_to_list_id( $subscriber_id, $list_id );
    }

    public static function remove_subscriber_from_list_id( $subscriber_id, $list_id ) {
        global $wpdb;
        return false !== $wpdb->delete( self::sub_lists_table(), array(
            'subscriber_id' => $subscriber_id,
            'list_id'       => $list_id,
        ), array( '%d', '%d' ) );
    }

    public static function add_to_list_slug( $email, $list_slug, $create_if_missing = true ) {
        $list = Culture_Newsletter_Lists::get_by_slug( $list_slug );
        if ( ! $list && $create_if_missing ) {
            $list = Culture_Newsletter_Lists::create( array(
                'slug' => $list_slug,
                'name' => ucwords( str_replace( '-', ' ', $list_slug ) ),
                'type' => Culture_Newsletter_Lists::TYPE_CONTENT,
            ) );
        }
        if ( ! $list || is_wp_error( $list ) ) {
            return false;
        }
        $sub_id = self::get_or_create( $email );
        return self::add_to_list_id( $sub_id, $list['id'] );
    }

    public static function remove_from_list_slug( $email, $list_slug ) {
        $sub  = self::find_by_email( $email );
        $list = Culture_Newsletter_Lists::get_by_slug( $list_slug );
        if ( ! $sub || ! $list ) {
            return false;
        }
        global $wpdb;
        return false !== $wpdb->delete( self::sub_lists_table(), array(
            'subscriber_id' => $sub['id'],
            'list_id'       => $list['id'],
        ), array( '%d', '%d' ) );
    }

    /**
     * Replace a subscriber's entire list membership set (used by the admin
     * edit form's checkbox list — unlike add_to_list_slug/remove_from_list_slug,
     * which are additive/subtractive single operations).
     */
    public static function set_lists( $subscriber_id, array $list_ids ) {
        global $wpdb;
        $wpdb->delete( self::sub_lists_table(), array( 'subscriber_id' => $subscriber_id ), array( '%d' ) );
        foreach ( array_unique( array_map( 'intval', $list_ids ) ) as $list_id ) {
            self::add_to_list_id( $subscriber_id, $list_id );
        }
    }

    /**
     * The single "subscribe someone" entry point every public-facing caller
     * (the REST subscribe endpoint, MailPoet/WP-user/bulk import, WP-CLI,
     * auto-subscribe-on-registration, Culture_Literary_Access) should use —
     * mirrors the old private Culture_Subscribers::merge_subscribers()
     * shape, generalized to any list slug(s) and made reusable across
     * classes. Silently creates any list slug that doesn't exist yet.
     *
     * Every new subscriber is also joined to every `default_subscribed`
     * list (e.g. 'announcements') automatically, same opt-out convention
     * the old code had — but only on first creation, never re-added to an
     * existing subscriber who may have since unsubscribed from it.
     *
     * @param string $email
     * @param array  $list_slugs One or more list slugs to add.
     * @param string $name
     * @param string $location
     * @param int    $user_id
     * @return int|false Subscriber ID, or false if the email is invalid.
     */
    public static function subscribe( $email, array $list_slugs, $name = '', $location = '', $user_id = 0 ) {
        $email = sanitize_email( $email );
        if ( ! $email || ! is_email( $email ) ) {
            return false;
        }

        $is_new = ! self::find_by_email( $email );
        $sub_id = self::get_or_create( $email, $name, $location, $user_id );

        if ( $is_new ) {
            foreach ( Culture_Newsletter_Lists::get_all() as $list ) {
                if ( $list['defaultSubscribed'] ) {
                    self::add_to_list_id( $sub_id, $list['id'] );
                }
            }
        }

        foreach ( $list_slugs as $slug ) {
            self::add_to_list_slug( $email, sanitize_title( $slug ) );
        }

        return $sub_id;
    }

    /**
     * Bulk variant of subscribe() for CSV/MailPoet/WP-user imports — each
     * item is [email, name, location], all joined to the same list slug(s).
     * @return int Number of newly-created subscribers (existing emails are
     *             skipped entirely, matching the old import semantics).
     */
    public static function subscribe_many( array $items, array $list_slugs = array() ) {
        $added = 0;
        foreach ( $items as $item ) {
            $email = sanitize_email( is_array( $item ) ? ( $item['email'] ?? '' ) : $item );
            if ( ! $email || ! is_email( $email ) || self::find_by_email( $email ) ) {
                continue;
            }
            self::subscribe(
                $email,
                $list_slugs,
                is_array( $item ) ? ( $item['name'] ?? '' ) : '',
                is_array( $item ) ? ( $item['location'] ?? '' ) : ''
            );
            $added++;
        }
        return $added;
    }

    /**
     * Resolve the exact set of emails a send should go to — the DB
     * equivalent of the old Culture_Newsletter_Queue::schedule_send()
     * inline filtering logic, now shared by newsletter sends (a content
     * list) and one-off Campaigns (one or more arbitrary lists).
     *
     * $region_filter is the special-cased narrowing dropdown from the send
     * meta box: '' (no filter), a region list slug (uk/ng/...), 'africa'
     * (an aggregate of the 4 African region slugs — not a real list row,
     * preserved from the old hardcoded behaviour), or 'pro' (a live
     * _culture_membership_tier lookup, never real list membership).
     *
     * @param int    $content_list_id Required list ID content must belong to.
     * @param string $region_filter
     * @return string[] Emails.
     */
    public static function resolve_send_emails( $content_list_id, $region_filter = '' ) {
        global $wpdb;
        $sl_table   = self::sub_lists_table();
        $subs_table = self::subscribers_table();

        $emails = $wpdb->get_col( $wpdb->prepare(
            "SELECT s.email FROM {$subs_table} s
             INNER JOIN {$sl_table} sl ON sl.subscriber_id = s.id
             WHERE sl.list_id = %d",
            $content_list_id
        ) );

        if ( ! $region_filter ) {
            return $emails;
        }

        if ( 'pro' === $region_filter ) {
            return array_values( array_filter( $emails, function ( $email ) {
                $user = get_user_by( 'email', $email );
                return $user && 'patron' === get_user_meta( $user->ID, '_culture_membership_tier', true );
            } ) );
        }

        $region_slugs = ( 'africa' === $region_filter )
            ? array( 'ng', 'gh', 'ke', 'za' )
            : array( $region_filter );

        $region_ids = array();
        foreach ( $region_slugs as $slug ) {
            $list = Culture_Newsletter_Lists::get_by_slug( $slug );
            if ( $list ) {
                $region_ids[] = $list['id'];
            }
        }
        if ( ! $region_ids ) {
            return array();
        }

        $placeholders  = implode( ',', array_fill( 0, count( $region_ids ), '%d' ) );
        $region_emails = $wpdb->get_col( $wpdb->prepare(
            "SELECT s.email FROM {$subs_table} s
             INNER JOIN {$sl_table} sl ON sl.subscriber_id = s.id
             WHERE sl.list_id IN ({$placeholders})",
            $region_ids
        ) );

        return array_values( array_intersect( $emails, $region_emails ) );
    }

    /**
     * Resolve emails for one or more content lists at once (union, not
     * intersection) — used by Culture_Campaigns, whose sends can target
     * multiple lists in one go.
     * @param int[] $list_ids
     * @return string[] Deduplicated emails.
     */
    public static function resolve_emails_for_lists( array $list_ids ) {
        if ( ! $list_ids ) {
            return array();
        }
        global $wpdb;
        $placeholders = implode( ',', array_fill( 0, count( $list_ids ), '%d' ) );
        $emails = $wpdb->get_col( $wpdb->prepare(
            "SELECT DISTINCT s.email FROM " . self::subscribers_table() . " s
             INNER JOIN " . self::sub_lists_table() . " sl ON sl.subscriber_id = s.id
             WHERE sl.list_id IN ({$placeholders})",
            $list_ids
        ) );
        return $emails ?: array();
    }
}
