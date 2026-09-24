<?php
/**
 * Newsletter list/segment registry — replaces the hardcoded LIST_OPTIONS /
 * SEGMENT_OPTIONS constants (previously duplicated across
 * class-culture-subscribers.php and class-culture-newsletter-send.php) with
 * real, admin-manageable rows in wp_culture_newsletter_lists.
 *
 * Unifies what used to be two separate subscriber fields — a single freeform
 * `segment` string and a `lists[]` array — into one thing: any subscriber can
 * belong to any number of these rows (see class-culture-subscribers-db.php).
 * `type` distinguishes what a row is for:
 *   - 'content' — a real newsletter a subscriber opts into (GetMeLit, Culture
 *     Drop, a waitlist, a Hub's list, a custom list an admin creates).
 *   - 'region'  — a geographic segment (uk/ng/gh/...), used as an optional
 *     narrowing filter alongside a content list on a send, not a list a
 *     subscriber is "subscribed to" in the usual sense.
 *   - 'system'  — hidden/opt-out lists (e.g. `announcements`) that never
 *     appear on the public /newsletter archive or preferences UI.
 * `source_type`/`source_id` link a row back to whatever auto-created it (e.g.
 * 'hub' + a culture_hub post ID) so Hub lists can be found/kept in sync
 * without a second lookup table.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Newsletter_Lists {

    const TYPE_CONTENT = 'content';
    const TYPE_REGION  = 'region';
    const TYPE_SYSTEM  = 'system';

    /**
     * The 'pro' segment is never a real list — it's a live lookup against
     * _culture_membership_tier, computed at send time
     * (Culture_Subscribers_DB::resolve_send_emails()). Kept as a constant
     * here so both the admin dropdown and the send-time resolver agree on
     * the magic slug without a DB round trip.
     */
    const VIRTUAL_PRO_SLUG = 'pro';

    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'culture_newsletter_lists';
    }

    public static function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $table = self::table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            slug varchar(191) NOT NULL DEFAULT '',
            name varchar(255) NOT NULL DEFAULT '',
            description text NOT NULL,
            type varchar(20) NOT NULL DEFAULT 'content',
            visibility varchar(20) NOT NULL DEFAULT 'public',
            default_subscribed tinyint(1) NOT NULL DEFAULT 0,
            source_type varchar(30) NOT NULL DEFAULT '',
            source_id bigint(20) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY slug (slug),
            KEY type_idx (type),
            KEY source_idx (source_type, source_id)
        ) {$charset_collate};" );
    }

    public static function init() {
        self::maybe_seed_defaults();
    }

    /**
     * One-time seed of the lists every install already relied on by slug
     * (getmelit/culture-drop/the 3 waitlist lists/announcements + the 8
     * region codes) — gated so re-running never duplicates rows, and so an
     * admin who later renames/deletes one of these isn't fought by the seed.
     */
    private static function maybe_seed_defaults() {
        if ( '1' === get_option( 'culture_nl_lists_seeded', '' ) ) {
            return;
        }

        $defaults = array(
            array( 'slug' => 'getmelit', 'name' => 'GetMeLit', 'type' => self::TYPE_CONTENT ),
            array( 'slug' => 'culture-drop', 'name' => 'Culture Drop', 'type' => self::TYPE_CONTENT ),
            array( 'slug' => 'culture-narratives-digest', 'name' => 'Culture Narratives Digest (waitlist)', 'type' => self::TYPE_CONTENT ),
            array( 'slug' => 'vendor-letter', 'name' => 'The Vendor Letter (waitlist)', 'type' => self::TYPE_CONTENT ),
            array( 'slug' => 'origins-field-notes', 'name' => 'Origins Field Notes (waitlist)', 'type' => self::TYPE_CONTENT ),
            array(
                'slug'               => 'announcements',
                'name'               => 'Announcements',
                'description'        => 'Hidden from the public /newsletter archive. Every new subscriber joins automatically; only an explicit unsubscribe removes them.',
                'type'               => self::TYPE_SYSTEM,
                'visibility'         => 'hidden',
                'default_subscribed' => 1,
            ),
            array( 'slug' => 'us', 'name' => 'The Moveee America (US)', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'uk', 'name' => 'The British Moveee (UK)', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'ng', 'name' => 'Nigeria', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'gh', 'name' => 'Ghana', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'ke', 'name' => 'Kenya', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'za', 'name' => 'South Africa', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'ca', 'name' => 'Canada', 'type' => self::TYPE_REGION ),
            array( 'slug' => 'au', 'name' => 'Australia', 'type' => self::TYPE_REGION ),
        );

        foreach ( $defaults as $row ) {
            if ( ! self::get_by_slug( $row['slug'] ) ) {
                self::create( $row );
            }
        }

        update_option( 'culture_nl_lists_seeded', '1' );
    }

    /**
     * @return array Every list row, optionally filtered by type.
     */
    public static function get_all( $type = '' ) {
        global $wpdb;
        $table = self::table();

        if ( $type ) {
            $rows = $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM {$table} WHERE type = %s ORDER BY name ASC",
                $type
            ), ARRAY_A );
        } else {
            $rows = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY type ASC, name ASC", ARRAY_A );
        }

        return array_map( array( __CLASS__, 'format' ), $rows ?: array() );
    }

    public static function get( $id ) {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM " . self::table() . " WHERE id = %d", $id ), ARRAY_A );
        return $row ? self::format( $row ) : null;
    }

    public static function get_by_slug( $slug ) {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM " . self::table() . " WHERE slug = %s", $slug ), ARRAY_A );
        return $row ? self::format( $row ) : null;
    }

    private static function format( array $row ) {
        return array(
            'id'                => (int) $row['id'],
            'slug'              => $row['slug'],
            'name'              => $row['name'],
            'description'       => $row['description'],
            'type'              => $row['type'],
            'visibility'        => $row['visibility'],
            'defaultSubscribed' => (bool) $row['default_subscribed'],
            'sourceType'        => $row['source_type'],
            'sourceId'          => (int) $row['source_id'],
            'createdAt'         => $row['created_at'],
        );
    }

    /**
     * @param array $data slug (required unless derived from name), name (required),
     *                     description, type, visibility, default_subscribed,
     *                     source_type, source_id.
     * @return array|WP_Error The created list row.
     */
    public static function create( array $data ) {
        global $wpdb;

        $name = sanitize_text_field( $data['name'] ?? '' );
        if ( '' === $name ) {
            return new WP_Error( 'missing_name', 'A list name is required.', array( 'status' => 400 ) );
        }

        $slug = sanitize_title( $data['slug'] ?? $name );
        if ( '' === $slug ) {
            return new WP_Error( 'invalid_slug', 'Could not derive a valid slug from that name.', array( 'status' => 400 ) );
        }
        if ( self::get_by_slug( $slug ) ) {
            return new WP_Error( 'slug_exists', 'A list with that slug already exists.', array( 'status' => 409 ) );
        }

        $type = in_array( $data['type'] ?? '', array( self::TYPE_CONTENT, self::TYPE_REGION, self::TYPE_SYSTEM ), true )
            ? $data['type']
            : self::TYPE_CONTENT;

        $inserted = $wpdb->insert( self::table(), array(
            'slug'               => $slug,
            'name'               => $name,
            'description'        => sanitize_textarea_field( $data['description'] ?? '' ),
            'type'               => $type,
            'visibility'         => in_array( $data['visibility'] ?? '', array( 'public', 'hidden' ), true ) ? $data['visibility'] : 'public',
            'default_subscribed' => ! empty( $data['default_subscribed'] ) ? 1 : 0,
            'source_type'        => sanitize_key( $data['source_type'] ?? '' ),
            'source_id'          => (int) ( $data['source_id'] ?? 0 ),
            'created_at'         => current_time( 'mysql' ),
        ), array( '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%d', '%s' ) );

        if ( ! $inserted ) {
            return new WP_Error( 'create_failed', 'Could not create the list.', array( 'status' => 500 ) );
        }

        return self::get( $wpdb->insert_id );
    }

    /**
     * @return array|WP_Error
     */
    public static function update( $id, array $data ) {
        $existing = self::get( $id );
        if ( ! $existing ) {
            return new WP_Error( 'not_found', 'List not found.', array( 'status' => 404 ) );
        }

        global $wpdb;
        $set    = array();
        $format = array();

        if ( isset( $data['name'] ) ) {
            $name = sanitize_text_field( $data['name'] );
            if ( '' === $name ) {
                return new WP_Error( 'missing_name', 'A list name is required.', array( 'status' => 400 ) );
            }
            $set['name'] = $name;
            $format[]    = '%s';
        }

        if ( isset( $data['slug'] ) ) {
            $slug = sanitize_title( $data['slug'] );
            if ( '' === $slug ) {
                return new WP_Error( 'invalid_slug', 'Invalid slug.', array( 'status' => 400 ) );
            }
            $other = self::get_by_slug( $slug );
            if ( $other && (int) $other['id'] !== (int) $id ) {
                return new WP_Error( 'slug_exists', 'A list with that slug already exists.', array( 'status' => 409 ) );
            }
            $set['slug'] = $slug;
            $format[]    = '%s';
        }

        if ( isset( $data['description'] ) ) {
            $set['description'] = sanitize_textarea_field( $data['description'] );
            $format[]            = '%s';
        }

        if ( isset( $data['visibility'] ) && in_array( $data['visibility'], array( 'public', 'hidden' ), true ) ) {
            $set['visibility'] = $data['visibility'];
            $format[]          = '%s';
        }

        if ( isset( $data['default_subscribed'] ) ) {
            $set['default_subscribed'] = ! empty( $data['default_subscribed'] ) ? 1 : 0;
            $format[]                  = '%d';
        }

        // type/source_type/source_id are intentionally not editable here —
        // changing a Hub-linked list's type would desync it from the Hub
        // lifecycle hooks that look it up by source_type+source_id.

        if ( $set ) {
            $wpdb->update( self::table(), $set, array( 'id' => $id ), $format, array( '%d' ) );
        }

        return self::get( $id );
    }

    /**
     * Deletes a list row and every subscriber's membership in it. Never
     * deletes the subscribers themselves.
     * @return true|WP_Error
     */
    public static function delete( $id ) {
        $existing = self::get( $id );
        if ( ! $existing ) {
            return new WP_Error( 'not_found', 'List not found.', array( 'status' => 404 ) );
        }

        global $wpdb;
        $wpdb->delete( Culture_Subscribers_DB::sub_lists_table(), array( 'list_id' => $id ), array( '%d' ) );
        $wpdb->delete( self::table(), array( 'id' => $id ), array( '%d' ) );

        return true;
    }

    public static function subscriber_count( $id ) {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM " . Culture_Subscribers_DB::sub_lists_table() . " WHERE list_id = %d",
            $id
        ) );
    }

    /**
     * Idempotently provisions (or returns the existing) list for a Hub —
     * called from Culture_Hubs::create() so every Hub, official or
     * user-created, automatically has a newsletter list members can be
     * emailed through. Slug is `hub-{hub_slug}` so it reads clearly in the
     * admin list/send UI next to content lists like getmelit.
     *
     * @param int    $hub_id
     * @param string $hub_name
     * @param string $hub_slug
     * @return array The list row.
     */
    public static function get_or_create_for_hub( $hub_id, $hub_name, $hub_slug ) {
        global $wpdb;
        $existing_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM " . self::table() . " WHERE source_type = 'hub' AND source_id = %d",
            $hub_id
        ) );
        if ( $existing_id ) {
            return self::get( $existing_id );
        }

        $result = self::create( array(
            'slug'        => 'hub-' . $hub_slug,
            'name'        => $hub_name . ' (Hub)',
            'description' => 'Automatically created when the "' . $hub_name . '" Hub was created. Members are subscribed on join and removed on leave.',
            'type'        => self::TYPE_CONTENT,
            'visibility'  => 'hidden',
            'source_type' => 'hub',
            'source_id'   => $hub_id,
        ) );

        // A slug collision on Culture_Hubs::unique_slug()'s own scope is
        // already extremely unlikely, but Culture_Newsletter_Lists has its
        // own separate slug namespace — fall back to a numeric suffix rather
        // than surfacing a WP_Error to a Hub-creation caller that isn't
        // expecting one.
        if ( is_wp_error( $result ) && 'slug_exists' === $result->get_error_code() ) {
            $result = self::create( array(
                'slug'        => 'hub-' . $hub_slug . '-' . $hub_id,
                'name'        => $hub_name . ' (Hub)',
                'type'        => self::TYPE_CONTENT,
                'visibility'  => 'hidden',
                'source_type' => 'hub',
                'source_id'   => $hub_id,
            ) );
        }

        return is_wp_error( $result ) ? null : $result;
    }

    public static function get_for_hub( $hub_id ) {
        global $wpdb;
        $id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM " . self::table() . " WHERE source_type = 'hub' AND source_id = %d",
            $hub_id
        ) );
        return $id ? self::get( $id ) : null;
    }
}
