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
 *
 * Segment axes (September 2026): `type` used to only ever be one of the
 * three reserved values above. It's now overloaded — any OTHER value is a
 * segment *axis* (region/age/tier/a custom one an admin types in), and a row
 * of that type is one selectable value on that axis (e.g. type=region,
 * slug=uk is "UK" on the Region axis; type=age, slug=age-25-34 is "25–34" on
 * the Age axis). This is what makes List (content/system — what someone
 * subscribed to) and Segment (region/age/tier/... — a demographic slice of
 * who's on that list) two genuinely independent things: a send picks one
 * content list, then optionally narrows it by any number of axes at once
 * (AND across axes, OR within one axis's checked values) — see
 * Culture_Subscribers_DB::apply_segment_filters(). RESERVED_TYPES is the
 * only thing that still needs special-casing; everything else just falls
 * out of get_axes() grouping by type with no code change required to add a
 * new axis.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Newsletter_Lists {

    const TYPE_CONTENT = 'content';
    const TYPE_REGION  = 'region';
    const TYPE_SYSTEM  = 'system';

    /** Types that are never a segment axis — everything else is. */
    const RESERVED_TYPES = array( self::TYPE_CONTENT, self::TYPE_SYSTEM );

    /** Human labels for the axes seeded out of the box; a custom axis an
     *  admin creates falls back to ucfirst(type) in get_axes(). */
    const AXIS_LABELS = array(
        self::TYPE_REGION => 'Region',
        'age'             => 'Age',
        'tier'            => 'Membership Tier',
    );

    /**
     * Age brackets, keyed by the row slug that represents them (seeded by
     * maybe_seed_axis_defaults()) — [min, max], either bound null-able.
     * Computed from _culture_dob at send time; nothing pre-aggregates it, so
     * changing this list takes effect on the very next send with no
     * migration needed (see age_bracket_for_user()).
     */
    const AGE_BRACKETS = array(
        'age-under-18' => array( null, 17 ),
        'age-18-24'    => array( 18, 24 ),
        'age-25-34'    => array( 25, 34 ),
        'age-35-44'    => array( 35, 44 ),
        'age-45-54'    => array( 45, 54 ),
        'age-55-plus'  => array( 55, null ),
    );

    /**
     * The 'pro' segment is never a real list — it's a live lookup against
     * _culture_membership_tier, computed at send time
     * (Culture_Subscribers_DB::resolve_send_emails()). Kept as a constant
     * here so both the admin dropdown and the send-time resolver agree on
     * the magic slug without a DB round trip. Superseded by real, editable
     * tier rows (see maybe_seed_axis_defaults()) but kept for any
     * already-saved post/REST caller still passing the bare string 'pro' —
     * normalize_segment_filters() still understands it.
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
        self::maybe_seed_axis_defaults();
    }

    /**
     * One-time seed of the Age and Tier segment axes (September 2026) — gated
     * by its own option, separate from maybe_seed_defaults()'s
     * culture_nl_lists_seeded, since that one is already '1' on every
     * pre-existing install and would never re-run to add these. Same
     * "skip a slug that already exists" idempotency as the defaults seed.
     */
    private static function maybe_seed_axis_defaults() {
        if ( '1' === get_option( 'culture_nl_axes_seeded', '' ) ) {
            return;
        }

        $defaults = array(
            array( 'slug' => 'age-under-18', 'name' => 'Under 18', 'type' => 'age' ),
            array( 'slug' => 'age-18-24',    'name' => '18–24',    'type' => 'age' ),
            array( 'slug' => 'age-25-34',    'name' => '25–34',    'type' => 'age' ),
            array( 'slug' => 'age-35-44',    'name' => '35–44',    'type' => 'age' ),
            array( 'slug' => 'age-45-54',    'name' => '45–54',    'type' => 'age' ),
            array( 'slug' => 'age-55-plus',  'name' => '55+',      'type' => 'age' ),
            array( 'slug' => 'citizen',      'name' => 'Moveee Citizen', 'type' => 'tier' ),
            array( 'slug' => 'patron',       'name' => 'Moveee Pro',     'type' => 'tier' ),
            array( 'slug' => 'lit',          'name' => 'Moveee Lit',     'type' => 'tier' ),
        );

        foreach ( $defaults as $row ) {
            if ( ! self::get_by_slug( $row['slug'] ) ) {
                self::create( $row );
            }
        }

        update_option( 'culture_nl_axes_seeded', '1' );
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

        // Any non-empty type is accepted, not just the 3 reserved ones — a
        // type value IS a segment axis now (region/age/tier/a custom one an
        // admin types in), see the class docblock. Only an empty/invalid
        // value falls back to content.
        $type = sanitize_key( $data['type'] ?? '' );
        if ( '' === $type ) {
            $type = self::TYPE_CONTENT;
        }

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

    // ── Segment axes (September 2026) ───────────────────────────────────────

    /**
     * Every segment axis currently in the registry, each with its rows —
     * what the Send Newsletter / Send Campaign meta boxes render as one
     * checkbox group per axis. Built-in axes (Region/Age/Tier) sort first in
     * that order; any custom axis an admin creates sorts after, alphabetically.
     *
     * @return array[] Each: array( 'type' => string, 'label' => string, 'rows' => array[] ).
     */
    public static function get_axes() {
        $grouped = array();
        foreach ( self::get_all() as $row ) {
            if ( in_array( $row['type'], self::RESERVED_TYPES, true ) ) {
                continue;
            }
            if ( ! isset( $grouped[ $row['type'] ] ) ) {
                $grouped[ $row['type'] ] = array(
                    'type'  => $row['type'],
                    'label' => self::AXIS_LABELS[ $row['type'] ] ?? ucfirst( str_replace( array( '-', '_' ), ' ', $row['type'] ) ),
                    'rows'  => array(),
                );
            }
            $grouped[ $row['type'] ]['rows'][] = $row;
        }

        uksort( $grouped, function ( $a, $b ) {
            $order = array( self::TYPE_REGION => 0, 'age' => 1, 'tier' => 2 );
            $oa    = $order[ $a ] ?? 99;
            $ob    = $order[ $b ] ?? 99;
            return $oa === $ob ? strcmp( $a, $b ) : $oa <=> $ob;
        } );

        return array_values( $grouped );
    }

    /**
     * Resolves a WP user's age bracket from _culture_dob (a plain date
     * string, see class-culture-rest-api.php's date_of_birth field) against
     * AGE_BRACKETS. Returns '' when there's no DOB on file or it doesn't
     * parse — an unresolvable age never matches an Age filter (see
     * Culture_Subscribers_DB::apply_segment_filters()), it doesn't fall back
     * to "matches everything".
     */
    public static function age_bracket_for_user( $user_id ) {
        $dob = get_user_meta( $user_id, '_culture_dob', true );
        if ( ! $dob ) {
            return '';
        }
        $ts = strtotime( $dob );
        if ( ! $ts ) {
            return '';
        }
        $age = (int) floor( ( time() - $ts ) / YEAR_IN_SECONDS );
        foreach ( self::AGE_BRACKETS as $slug => $range ) {
            list( $min, $max ) = $range;
            if ( ( null === $min || $age >= $min ) && ( null === $max || $age <= $max ) ) {
                return $slug;
            }
        }
        return '';
    }

    /**
     * The one place that understands every shape a "segment filter" can
     * arrive in, and turns it into the canonical
     * array( axis_type => array(slugs) ) shape every resolver/renderer below
     * uses — AND across axes, OR within one axis's slugs.
     *
     * Accepts:
     *  - the new shape itself (a real or posted nested array, e.g. from
     *    render_segment_filter_fields()'s checkboxes) — sanitized in place.
     *  - a bare legacy string: a real region/age/tier row slug (resolved to
     *    its own axis via a registry lookup), or one of the two hardcoded
     *    virtual slugs pre-dating real axes ('pro' → tier=patron, 'africa' →
     *    region=ng,gh,ke,za) — kept so an already-saved post or an
     *    automation client still passing the old single-string shape
     *    (culture/v1/newsletter/send-issue's `segment` param) keeps working.
     *  - empty/unrecognized input → array() (no filter, send to everyone).
     *
     * @param array|string $input
     * @return array
     */
    public static function normalize_segment_filters( $input ) {
        if ( is_array( $input ) ) {
            $out = array();
            foreach ( $input as $axis => $slugs ) {
                $axis  = sanitize_key( $axis );
                $slugs = array_values( array_unique( array_filter( array_map( 'sanitize_key', (array) $slugs ) ) ) );
                if ( $axis && $slugs ) {
                    $out[ $axis ] = $slugs;
                }
            }
            return $out;
        }

        $slug = sanitize_key( (string) $input );
        if ( '' === $slug ) {
            return array();
        }
        if ( self::VIRTUAL_PRO_SLUG === $slug ) {
            return array( 'tier' => array( 'patron' ) );
        }
        if ( 'africa' === $slug ) {
            return array( self::TYPE_REGION => array( 'ng', 'gh', 'ke', 'za' ) );
        }

        $row = self::get_by_slug( $slug );
        if ( ! $row || in_array( $row['type'], self::RESERVED_TYPES, true ) ) {
            return array();
        }
        return array( $row['type'] => array( $slug ) );
    }

    /**
     * Reads a post's saved segment filters, preferring the new multi-axis
     * key and falling back to the legacy single-string one — see
     * Culture_Newsletter_Send::persist_list_meta() for why both exist.
     *
     * @param int $post_id
     * @return array
     */
    public static function get_segment_filters_for_post( $post_id ) {
        $raw = get_post_meta( $post_id, '_culture_nl_segment_filters', true );
        if ( $raw ) {
            $decoded = json_decode( $raw, true );
            if ( is_array( $decoded ) && $decoded ) {
                return self::normalize_segment_filters( $decoded );
            }
        }
        $legacy = get_post_meta( $post_id, '_culture_nl_segment', true ) ?: '';
        return $legacy ? self::normalize_segment_filters( $legacy ) : array();
    }

    /**
     * Renders one checkbox group per registered segment axis — shared by the
     * Send Newsletter and Send Campaign meta boxes so both offer the same
     * combinable, multi-axis filter UI. Inputs post as
     * `{$field_name}[{axis_type}][]`, read back with normalize_segment_filters().
     *
     * @param string $field_name
     * @param array  $selected   Already-normalized array( axis_type => array(slugs) ).
     */
    public static function render_segment_filter_fields( $field_name, array $selected ) {
        $axes = self::get_axes();
        if ( ! $axes ) {
            echo '<p style="font-size:12px;color:#666;">' . esc_html__( 'No segment axes yet — add one on the Lists & Segments page.', 'culture-community' ) . '</p>';
            return;
        }
        foreach ( $axes as $axis ) {
            $selected_slugs = $selected[ $axis['type'] ] ?? array();
            ?>
            <div class="culture-nl-axis-group" style="margin-bottom:10px;">
                <p style="font-size:11px;font-weight:600;text-transform:uppercase;margin:0 0 4px;color:#1d2327;">
                    <?php echo esc_html( $axis['label'] ); ?>
                </p>
                <div style="max-height:130px;overflow-y:auto;border:1px solid #dcdcde;border-radius:4px;padding:6px 8px;background:#fff;">
                    <?php foreach ( $axis['rows'] as $row ) : ?>
                        <label style="display:block;font-size:12px;padding:2px 0;">
                            <input
                                type="checkbox"
                                class="js-nl-segment-check"
                                name="<?php echo esc_attr( $field_name ); ?>[<?php echo esc_attr( $axis['type'] ); ?>][]"
                                value="<?php echo esc_attr( $row['slug'] ); ?>"
                                <?php checked( in_array( $row['slug'], $selected_slugs, true ) ); ?>
                            >
                            <?php echo esc_html( $row['name'] ); ?>
                        </label>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php
        }
        ?>
        <p style="font-size:11px;color:#666;margin:0 0 10px;">
            <?php esc_html_e( 'Leave every box unchecked to send to everyone on the list. Checking boxes within one group is OR (any UK or US subscriber); checking boxes across groups is AND (must also match the tier/age selected).', 'culture-community' ); ?>
        </p>
        <?php
    }

    /**
     * Human-readable summary of a segment filter selection — e.g.
     * "UK, US · Moveee Pro" — for meta box status lines and analytics.
     * Empty string means "everyone on the list".
     *
     * @param array $filters Already-normalized array( axis_type => array(slugs) ).
     */
    public static function describe_segment_filters( array $filters ) {
        if ( ! $filters ) {
            return '';
        }
        $parts = array();
        foreach ( $filters as $slugs ) {
            if ( ! $slugs ) {
                continue;
            }
            $labels = array();
            foreach ( $slugs as $slug ) {
                $row      = self::get_by_slug( $slug );
                $labels[] = $row ? $row['name'] : $slug;
            }
            $parts[] = implode( ', ', $labels );
        }
        return implode( ' · ', $parts );
    }
}
