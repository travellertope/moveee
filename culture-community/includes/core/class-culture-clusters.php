<?php
/**
 * Stoop clusters — weekly street/neighbourhood meetup groups.
 * Phase 1 scope only (see docs/literati-connect-plan.md §7): core
 * membership (create/join/leave/discover), no election or check-in yet.
 *
 * Single source of truth for both REST surfaces (mobile JWT + web API-key),
 * same discipline as Culture_Follows / Culture_Community_RSVP.
 */
class Culture_Clusters {

    const STATUS_FORMING  = 'forming';
    const STATUS_ACTIVE   = 'active';
    const STATUS_ARCHIVED = 'archived';

    /* ——————————————————————————————————————
     *  Table
     * —————————————————————————————————————— */

    public static function table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_cluster_members';
    }

    public static function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            cluster_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            role varchar(10) NOT NULL DEFAULT 'member',
            joined_at datetime DEFAULT CURRENT_TIMESTAMP,
            status varchar(10) NOT NULL DEFAULT 'active',
            PRIMARY KEY  (id),
            UNIQUE KEY cluster_user (cluster_id, user_id),
            KEY cluster_status (cluster_id, status),
            KEY user_status (user_id, status)
        ) {$charset_collate};" );
    }

    /**
     * Weekly meeting check-in records (Phase 3, §2.2). Member-scans-host's-QR
     * or host-manual fallback; UNIQUE KEY makes a duplicate scan in the same
     * week a silent no-op, same upsert-not-duplicate philosophy as
     * wp_culture_follows / wp_culture_community_rsvp.
     */
    public static function checkins_table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_cluster_checkins';
    }

    public static function create_checkins_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::checkins_table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            cluster_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            meeting_date date NOT NULL,
            checked_in_at datetime DEFAULT CURRENT_TIMESTAMP,
            method varchar(12) NOT NULL DEFAULT 'qr',
            PRIMARY KEY  (id),
            UNIQUE KEY cluster_user_date (cluster_id, user_id, meeting_date),
            KEY cluster_date (cluster_id, meeting_date)
        ) {$charset_collate};" );
    }

    /* ——————————————————————————————————————
     *  Admin-configurable settings (§2.5)
     * —————————————————————————————————————— */

    public static function min_activation_members() : int {
        return defined( 'CULTURE_CLUSTER_MIN_ACTIVATION_MEMBERS' )
            ? (int) CULTURE_CLUSTER_MIN_ACTIVATION_MEMBERS
            : (int) get_option( 'culture_cluster_min_activation_members', 4 );
    }

    public static function forming_window_days() : int {
        return defined( 'CULTURE_CLUSTER_FORMING_WINDOW_DAYS' )
            ? (int) CULTURE_CLUSTER_FORMING_WINDOW_DAYS
            : (int) get_option( 'culture_cluster_forming_window_days', 30 );
    }

    public static function default_capacity() : int {
        return defined( 'CULTURE_CLUSTER_DEFAULT_CAPACITY' )
            ? (int) CULTURE_CLUSTER_DEFAULT_CAPACITY
            : (int) get_option( 'culture_cluster_default_capacity', 12 );
    }

    public static function election_window_days() : int {
        return defined( 'CULTURE_CLUSTER_ELECTION_WINDOW_DAYS' )
            ? (int) CULTURE_CLUSTER_ELECTION_WINDOW_DAYS
            : (int) get_option( 'culture_cluster_election_window_days', 7 );
    }

    /* ——————————————————————————————————————
     *  Core reads
     * —————————————————————————————————————— */

    public static function get_member_count( int $cluster_id ) : int {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM " . self::table() . " WHERE cluster_id = %d AND status = 'active'",
            $cluster_id
        ) );
    }

    public static function get_cluster( int $cluster_id ) {
        $post = get_post( $cluster_id );
        if ( ! $post || 'culture_cluster' !== $post->post_type ) {
            return null;
        }

        $host_id  = (int) get_post_meta( $cluster_id, '_cluster_host_id', true );
        $host     = $host_id ? get_userdata( $host_id ) : false;
        $capacity = (int) get_post_meta( $cluster_id, '_cluster_capacity', true );

        return array(
            'id'             => $cluster_id,
            'name'           => get_post_meta( $cluster_id, '_cluster_name', true ) ?: $post->post_title,
            'city'           => get_post_meta( $cluster_id, '_cluster_city', true ),
            'street'         => get_post_meta( $cluster_id, '_cluster_street', true ),
            'country'        => get_post_meta( $cluster_id, '_cluster_country', true ),
            'status'         => get_post_meta( $cluster_id, '_cluster_status', true ) ?: self::STATUS_FORMING,
            'founderId'      => (int) get_post_meta( $cluster_id, '_cluster_founder_id', true ),
            'hostId'         => $host_id,
            'hostName'       => $host ? $host->display_name : '',
            'hostMechanism'  => get_post_meta( $cluster_id, '_cluster_host_mechanism', true ),
            'capacity'       => $capacity,
            'memberCount'    => self::get_member_count( $cluster_id ),
            'meetingDay'     => get_post_meta( $cluster_id, '_cluster_meeting_day', true ),
            'meetingTime'    => get_post_meta( $cluster_id, '_cluster_meeting_time', true ),
            'locationNote'   => get_post_meta( $cluster_id, '_cluster_meeting_location_note', true ),
            'createdAt'         => get_post_meta( $cluster_id, '_cluster_created_at', true ),
            'activatedAt'       => get_post_meta( $cluster_id, '_cluster_activated_at', true ),
            'venueType'         => get_post_meta( $cluster_id, '_cluster_venue_type', true ) ?: '',
            'hostNote'          => get_post_meta( $cluster_id, '_cluster_host_note', true ) ?: '',
            'realisticCapacity' => (int) get_post_meta( $cluster_id, '_cluster_realistic_capacity', true ),
            'accessible'        => (bool) get_post_meta( $cluster_id, '_cluster_accessible', true ),
            'addressVisible'    => get_post_meta( $cluster_id, '_cluster_address_visible', true ) ?: 'members_only',
        );
    }

    public static function get_member_status( int $cluster_id, int $user_id ) : array {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT role, joined_at, status FROM " . self::table() . " WHERE cluster_id = %d AND user_id = %d",
            $cluster_id, $user_id
        ), ARRAY_A );

        $is_member = (bool) ( $row && 'active' === $row['status'] );

        return array(
            'isMember' => $is_member,
            'role'     => $is_member ? $row['role'] : null,
            'joinedAt' => $is_member ? $row['joined_at'] : null,
        );
    }

    public static function get_active_member_ids( int $cluster_id ) : array {
        global $wpdb;
        $ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT user_id FROM " . self::table() . " WHERE cluster_id = %d AND status = 'active'",
            $cluster_id
        ) );
        return array_map( 'intval', $ids ?: array() );
    }

    /**
     * Member list with names/avatars (§4.4 — never built in Phase 1, only a
     * count was rendered). Host sorted first so the UI can badge them, and so
     * host-manual check-in can list members to tap without a second lookup.
     */
    public static function get_members( int $cluster_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT m.user_id, m.role, m.joined_at, u.display_name
             FROM " . self::table() . " m
             INNER JOIN {$wpdb->users} u ON u.ID = m.user_id
             WHERE m.cluster_id = %d AND m.status = 'active'
             ORDER BY (m.role = 'host') DESC, m.joined_at ASC",
            $cluster_id
        ), ARRAY_A );

        $members = array();
        foreach ( $rows ?: array() as $row ) {
            $user_id   = (int) $row['user_id'];
            $members[] = array(
                'id'        => $user_id,
                'name'      => $row['display_name'],
                'avatarUrl' => get_user_meta( $user_id, '_culture_avatar_url', true ) ?: '',
                'role'      => $row['role'],
                'joinedAt'  => $row['joined_at'],
            );
        }
        return $members;
    }

    public static function list_for_user( int $user_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT cluster_id, role, joined_at FROM " . self::table() . " WHERE user_id = %d AND status = 'active'",
            $user_id
        ), ARRAY_A );

        $clusters = array();
        foreach ( $rows ?: array() as $row ) {
            $cluster = self::get_cluster( (int) $row['cluster_id'] );
            if ( $cluster ) {
                $cluster['role']     = $row['role'];
                $cluster['joinedAt'] = $row['joined_at'];
                $clusters[]          = $cluster;
            }
        }
        return $clusters;
    }

    /**
     * Public browse — mirrors Culture_Directory::handle_browse()'s shape.
     * Defaults to status=active only; 'forming' clusters are never returned
     * here (only reachable via direct invite link, per §2.3).
     */
    public static function discover( array $params ) : array {
        global $wpdb;

        $q        = isset( $params['q'] ) ? sanitize_text_field( $params['q'] ) : '';
        $city     = isset( $params['city'] ) ? sanitize_text_field( $params['city'] ) : '';
        $country  = isset( $params['country'] ) ? sanitize_text_field( $params['country'] ) : '';
        $status   = isset( $params['status'] ) ? sanitize_key( $params['status'] ) : self::STATUS_ACTIVE;
        $sort     = isset( $params['sort'] ) ? sanitize_key( $params['sort'] ) : 'nearest_capacity';
        $page     = max( 1, (int) ( $params['page'] ?? 1 ) );
        $per_page = min( 50, max( 1, (int) ( $params['per_page'] ?? 20 ) ) );

        // Resolve matching post IDs via raw SQL against postmeta — same
        // pattern as Culture_Directory::handle_browse()'s region filter,
        // avoids a slow meta_query OR-join (documented CLAUDE.md gotcha).
        $status_ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_cluster_status' AND meta_value = %s",
            $status
        ) );
        if ( ! $status_ids ) {
            return array( 'clusters' => array(), 'total' => 0, 'page' => $page, 'perPage' => $per_page );
        }

        $filtered_ids = $status_ids;

        if ( $city !== '' ) {
            $like = '%' . $wpdb->esc_like( $city ) . '%';
            $city_ids = $wpdb->get_col( $wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_cluster_city' AND meta_value LIKE %s",
                $like
            ) );
            $filtered_ids = array_intersect( $filtered_ids, $city_ids ?: array() );
        }

        if ( $country !== '' ) {
            $like = '%' . $wpdb->esc_like( $country ) . '%';
            $country_ids = $wpdb->get_col( $wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_cluster_country' AND meta_value LIKE %s",
                $like
            ) );
            $filtered_ids = array_intersect( $filtered_ids, $country_ids ?: array() );
        }

        if ( ! $filtered_ids ) {
            return array( 'clusters' => array(), 'total' => 0, 'page' => $page, 'perPage' => $per_page );
        }

        $args = array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'post__in'       => array_values( $filtered_ids ),
            'posts_per_page' => $per_page,
            'paged'          => $page,
        );

        if ( $q !== '' ) {
            $args['s'] = $q;
        }

        if ( $sort === 'newest' ) {
            $args['orderby'] = 'date';
            $args['order']   = 'DESC';
        } else {
            // Stable order here; the "fewest members first" ordering (§2.6)
            // is applied after the fact below since member count is derived
            // from a separate table, not a sortable meta key.
            $args['orderby'] = 'date';
            $args['order']   = 'DESC';
        }

        $query    = new WP_Query( $args );
        $clusters = array();
        foreach ( $query->posts as $post ) {
            $cluster = self::get_cluster( $post->ID );
            if ( $cluster ) {
                $clusters[] = $cluster;
            }
        }

        if ( $sort === 'nearest_capacity' ) {
            usort( $clusters, function( $a, $b ) {
                return $a['memberCount'] <=> $b['memberCount'];
            } );
        }

        return array(
            'clusters' => $clusters,
            'total'    => $query->found_posts,
            'page'     => $page,
            'perPage'  => $per_page,
        );
    }

    /* ——————————————————————————————————————
     *  Core writes
     * —————————————————————————————————————— */

    /**
     * @return int|WP_Error Cluster post ID on success.
     */
    public static function create_cluster( int $user_id, array $data ) {
        $name = sanitize_text_field( $data['name'] ?? '' );
        if ( '' === $name ) {
            return new WP_Error( 'missing_name', 'A cluster name is required.', array( 'status' => 400 ) );
        }

        $post_id = wp_insert_post( array(
            'post_type'   => 'culture_cluster',
            'post_title'  => $name,
            'post_status' => 'publish',
            'post_author' => $user_id,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        $now = current_time( 'mysql' );

        update_post_meta( $post_id, '_cluster_name', $name );
        update_post_meta( $post_id, '_cluster_city', sanitize_text_field( $data['city'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_street', sanitize_text_field( $data['street'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_country', sanitize_text_field( $data['country'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_status', self::STATUS_FORMING );
        update_post_meta( $post_id, '_cluster_founder_id', $user_id );
        update_post_meta( $post_id, '_cluster_host_id', $user_id );
        update_post_meta( $post_id, '_cluster_host_mechanism', 'self_nominated' );
        update_post_meta( $post_id, '_cluster_capacity', (int) ( $data['capacity'] ?? self::default_capacity() ) );
        update_post_meta( $post_id, '_cluster_meeting_day', sanitize_text_field( $data['meetingDay'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_meeting_time', sanitize_text_field( $data['meetingTime'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_meeting_location_note', sanitize_text_field( $data['locationNote'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_venue_type', sanitize_text_field( $data['venueType'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_host_note', sanitize_textarea_field( $data['hostNote'] ?? '' ) );
        update_post_meta( $post_id, '_cluster_realistic_capacity', (int) ( $data['realisticCapacity'] ?? 0 ) );
        update_post_meta( $post_id, '_cluster_accessible', (int) ( $data['accessible'] ?? 0 ) );
        update_post_meta( $post_id, '_cluster_address_visible', sanitize_text_field( $data['addressVisible'] ?? 'members_only' ) );
        update_post_meta( $post_id, '_cluster_host_locality_confirmed', (int) ( $data['localityConfirmed'] ?? 0 ) );
        update_post_meta( $post_id, '_cluster_created_at', $now );

        global $wpdb;
        $wpdb->insert( self::table(), array(
            'cluster_id' => $post_id,
            'user_id'    => $user_id,
            'role'       => 'host',
            'joined_at'  => $now,
            'status'     => 'active',
        ), array( '%d', '%d', '%s', '%s', '%s' ) );

        return $post_id;
    }

    /**
     * @return true|WP_Error
     */
    public static function join( int $cluster_id, int $user_id ) {
        $post = get_post( $cluster_id );
        if ( ! $post || 'culture_cluster' !== $post->post_type ) {
            return new WP_Error( 'invalid_cluster', 'This cluster does not exist.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table    = self::table();
        $existing = $wpdb->get_row( $wpdb->prepare(
            "SELECT id, status FROM {$table} WHERE cluster_id = %d AND user_id = %d",
            $cluster_id, $user_id
        ), ARRAY_A );

        if ( $existing && 'active' === $existing['status'] ) {
            return true;
        }

        // Advisory mutex — prevents two concurrent joins both passing the
        // capacity check before either write lands (same TOCTOU guard as
        // Culture_Community_RSVP::rsvp()).
        $lock_name = 'culture_cluster_join_' . $cluster_id;
        $locked    = $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, 5)', $lock_name ) );
        if ( ! $locked ) {
            return new WP_Error( 'cluster_busy', 'This cluster is being updated right now. Please try again.', array( 'status' => 409 ) );
        }

        try {
            $capacity = (int) get_post_meta( $cluster_id, '_cluster_capacity', true );
            if ( $capacity > 0 && self::get_member_count( $cluster_id ) >= $capacity ) {
                return new WP_Error( 'cluster_full', 'This cluster is at capacity.', array( 'status' => 409 ) );
            }

            if ( $existing ) {
                $wpdb->update( $table, array( 'status' => 'active' ), array( 'id' => $existing['id'] ), array( '%s' ), array( '%d' ) );
            } else {
                $wpdb->insert( $table, array(
                    'cluster_id' => $cluster_id,
                    'user_id'    => $user_id,
                    'role'       => 'member',
                    'joined_at'  => current_time( 'mysql' ),
                    'status'     => 'active',
                ), array( '%d', '%d', '%s', '%s', '%s' ) );
            }
        } finally {
            $wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock_name ) );
        }

        self::maybe_activate( $cluster_id );

        return true;
    }

    public static function leave( int $cluster_id, int $user_id ) : bool {
        global $wpdb;
        $host_id  = (int) get_post_meta( $cluster_id, '_cluster_host_id', true );
        $was_host = ( $host_id === $user_id );

        $updated = $wpdb->update(
            self::table(),
            array( 'status' => 'left' ),
            array( 'cluster_id' => $cluster_id, 'user_id' => $user_id ),
            array( '%s' ), array( '%d', '%d' )
        );

        if ( false !== $updated && $was_host ) {
            self::handle_host_departure( $cluster_id, $user_id );
        }

        return false !== $updated;
    }

    /**
     * §3.3 host vacancy handling, run right after the departing host's
     * membership row is flipped to 'left'. Three branches depending on
     * what's left of the cluster.
     */
    private static function handle_host_departure( int $cluster_id, int $departed_host_id ) {
        $remaining = self::get_active_member_ids( $cluster_id );

        if ( ! $remaining ) {
            // No one left to elect/appoint from. Repurpose the departing
            // host's own (now 'left') membership row's joined_at column as
            // a "vacancy started" timestamp — the plan doc calls for no new
            // field, and the grace-period sweep reads this same column.
            global $wpdb;
            $wpdb->update(
                self::table(),
                array( 'joined_at' => current_time( 'mysql' ) ),
                array( 'cluster_id' => $cluster_id, 'user_id' => $departed_host_id ),
                array( '%s' ), array( '%d', '%d' )
            );
            return;
        }

        $election_open_until = get_post_meta( $cluster_id, '_cluster_election_open_until', true );
        $election_is_open     = $election_open_until && strtotime( $election_open_until ) > time();

        if ( $election_is_open ) {
            // Strip the departed host's own vote and any votes cast for
            // them as a candidate — they can't become host having left.
            $votes_json = get_post_meta( $cluster_id, '_cluster_election_votes', true );
            $votes      = $votes_json ? json_decode( $votes_json, true ) : array();
            $votes      = is_array( $votes ) ? $votes : array();

            unset( $votes[ (string) $departed_host_id ] );
            foreach ( $votes as $voter => $candidate ) {
                if ( (int) $candidate === $departed_host_id ) {
                    unset( $votes[ $voter ] );
                }
            }

            update_post_meta( $cluster_id, '_cluster_election_votes', wp_json_encode( $votes ) );
            return;
        }

        // Other members remain and no election is open — auto-trigger one.
        self::start_election( $cluster_id, 0, true );
    }

    /**
     * Flips a 'forming' cluster to 'active' once it crosses the configured
     * member threshold (§2.7 step 5). Awards the founder credits/reputation
     * once, on activation — not on creation, per the plan doc.
     */
    private static function maybe_activate( int $cluster_id ) {
        $status = get_post_meta( $cluster_id, '_cluster_status', true );
        if ( self::STATUS_FORMING !== $status ) {
            return;
        }

        if ( self::get_member_count( $cluster_id ) < self::min_activation_members() ) {
            return;
        }

        update_post_meta( $cluster_id, '_cluster_status', self::STATUS_ACTIVE );
        update_post_meta( $cluster_id, '_cluster_activated_at', current_time( 'mysql' ) );

        $founder_id = (int) get_post_meta( $cluster_id, '_cluster_founder_id', true );
        if ( $founder_id && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $founder_id, 'cluster_founded' );
        }
        if ( $founder_id && class_exists( 'Culture_Notifications' ) ) {
            Culture_Notifications::add(
                $founder_id,
                'cluster_activated',
                'Your Stoop is active!',
                get_post_meta( $cluster_id, '_cluster_name', true ) . ' has reached enough members and is now open to the neighbourhood.',
                '/cluster/' . $cluster_id,
                array( 'cluster_id' => $cluster_id )
            );
        }
    }

    /* ——————————————————————————————————————
     *  Phase 2 — host mechanisms (§2.4.2 appointed, §2.4.3 elected, §3.3 vacancy)
     * —————————————————————————————————————— */

    /**
     * @param int  $user_id Member starting the election. 0 + $auto=true for
     *                       a system-triggered election (host departure).
     * @return true|WP_Error
     */
    public static function start_election( int $cluster_id, int $user_id, bool $auto = false ) {
        $post = get_post( $cluster_id );
        if ( ! $post || 'culture_cluster' !== $post->post_type ) {
            return new WP_Error( 'invalid_cluster', 'This cluster does not exist.', array( 'status' => 400 ) );
        }

        if ( self::STATUS_ACTIVE !== get_post_meta( $cluster_id, '_cluster_status', true ) ) {
            return new WP_Error( 'cluster_not_active', 'Elections are only available for active Stoops.', array( 'status' => 400 ) );
        }

        $open_until = get_post_meta( $cluster_id, '_cluster_election_open_until', true );
        if ( $open_until && strtotime( $open_until ) > time() ) {
            return new WP_Error( 'election_open', 'An election is already in progress.', array( 'status' => 409 ) );
        }

        if ( ! $auto && ! in_array( $user_id, self::get_active_member_ids( $cluster_id ), true ) ) {
            return new WP_Error( 'not_a_member', 'Only members of this Stoop can start an election.', array( 'status' => 403 ) );
        }

        $closes_at = gmdate( 'Y-m-d H:i:s', time() + ( self::election_window_days() * DAY_IN_SECONDS ) );
        update_post_meta( $cluster_id, '_cluster_election_open_until', $closes_at );
        update_post_meta( $cluster_id, '_cluster_election_votes', wp_json_encode( array() ) );

        if ( class_exists( 'Culture_Notifications' ) ) {
            $name = get_post_meta( $cluster_id, '_cluster_name', true );
            foreach ( self::get_active_member_ids( $cluster_id ) as $member_id ) {
                Culture_Notifications::add(
                    $member_id,
                    'cluster_election_started',
                    'Host election started',
                    $name . ' is electing a new host. Cast your vote or put yourself forward.',
                    '/cluster/' . $cluster_id,
                    array( 'cluster_id' => $cluster_id )
                );
            }
        }

        return true;
    }

    /**
     * Casting a vote for oneself doubles as "I'll run" — no separate
     * candidacy field, per the plan doc's no-new-storage discipline.
     * @return true|WP_Error
     */
    public static function cast_vote( int $cluster_id, int $voter_id, int $candidate_id ) {
        $open_until = get_post_meta( $cluster_id, '_cluster_election_open_until', true );
        if ( ! $open_until || strtotime( $open_until ) <= time() ) {
            return new WP_Error( 'no_election', 'There is no open election for this Stoop.', array( 'status' => 400 ) );
        }

        $active_ids = self::get_active_member_ids( $cluster_id );
        if ( ! in_array( $voter_id, $active_ids, true ) ) {
            return new WP_Error( 'not_a_member', 'Only members of this Stoop can vote.', array( 'status' => 403 ) );
        }
        if ( ! in_array( $candidate_id, $active_ids, true ) ) {
            return new WP_Error( 'invalid_candidate', 'That member is not eligible to be host.', array( 'status' => 400 ) );
        }

        $votes_json = get_post_meta( $cluster_id, '_cluster_election_votes', true );
        $votes      = $votes_json ? json_decode( $votes_json, true ) : array();
        $votes      = is_array( $votes ) ? $votes : array();

        $votes[ (string) $voter_id ] = $candidate_id;
        update_post_meta( $cluster_id, '_cluster_election_votes', wp_json_encode( $votes ) );

        return true;
    }

    public static function get_election_status( int $cluster_id, int $viewer_id = 0 ) : array {
        $open_until = get_post_meta( $cluster_id, '_cluster_election_open_until', true );
        $is_open    = $open_until && strtotime( $open_until ) > time();

        $votes_json = get_post_meta( $cluster_id, '_cluster_election_votes', true );
        $votes      = $votes_json ? json_decode( $votes_json, true ) : array();
        $votes      = is_array( $votes ) ? $votes : array();

        $tallies = array();
        foreach ( $votes as $candidate_id ) {
            $candidate_id = (int) $candidate_id;
            $tallies[ $candidate_id ] = ( $tallies[ $candidate_id ] ?? 0 ) + 1;
        }

        $candidates = array();
        foreach ( $tallies as $candidate_id => $count ) {
            $user = get_userdata( $candidate_id );
            if ( ! $user ) {
                continue;
            }
            $candidates[] = array(
                'id'        => $candidate_id,
                'name'      => $user->display_name,
                'voteCount' => $count,
            );
        }
        usort( $candidates, function( $a, $b ) {
            return $b['voteCount'] <=> $a['voteCount'];
        } );

        return array(
            'open'       => $is_open,
            'openUntil'  => $is_open ? $open_until : null,
            'candidates' => $candidates,
            'myVote'     => $viewer_id && isset( $votes[ (string) $viewer_id ] ) ? (int) $votes[ (string) $viewer_id ] : null,
            'totalVotes' => count( $votes ),
        );
    }

    /**
     * Cron-invoked. Tallies an expired election, sets the plurality winner
     * as host, and notifies members. Ties broken by earliest signup.
     */
    public static function tally_election( int $cluster_id ) {
        $votes_json = get_post_meta( $cluster_id, '_cluster_election_votes', true );
        $votes      = $votes_json ? json_decode( $votes_json, true ) : array();
        $votes      = is_array( $votes ) ? $votes : array();

        $active_ids = self::get_active_member_ids( $cluster_id );

        $tallies = array();
        foreach ( $votes as $voter_id => $candidate_id ) {
            $voter_id     = (int) $voter_id;
            $candidate_id = (int) $candidate_id;
            if ( ! in_array( $voter_id, $active_ids, true ) || ! in_array( $candidate_id, $active_ids, true ) ) {
                continue;
            }
            $tallies[ $candidate_id ] = ( $tallies[ $candidate_id ] ?? 0 ) + 1;
        }

        $winner_id = 0;
        if ( $tallies ) {
            $top_count    = max( $tallies );
            $top_ids      = array_keys( array_filter( $tallies, function( $c ) use ( $top_count ) {
                return $c === $top_count;
            } ) );
            $winner_id = count( $top_ids ) === 1 ? $top_ids[0] : self::earliest_signup_among( $top_ids );
        }

        if ( ! $winner_id ) {
            $winner_id = self::longest_standing_member( $cluster_id );
        }

        update_post_meta( $cluster_id, '_cluster_election_votes', wp_json_encode( array() ) );
        delete_post_meta( $cluster_id, '_cluster_election_open_until' );

        if ( ! $winner_id ) {
            return;
        }

        update_post_meta( $cluster_id, '_cluster_host_id', $winner_id );
        update_post_meta( $cluster_id, '_cluster_host_mechanism', 'elected' );
        self::promote_to_host_role( $cluster_id, $winner_id );

        if ( class_exists( 'Culture_Notifications' ) ) {
            $name   = get_post_meta( $cluster_id, '_cluster_name', true );
            $winner = get_userdata( $winner_id );
            foreach ( $active_ids as $member_id ) {
                Culture_Notifications::add(
                    $member_id,
                    'cluster_new_host',
                    'New host elected',
                    ( $winner ? $winner->display_name : 'A member' ) . ' is now the host of ' . $name . '.',
                    '/cluster/' . $cluster_id,
                    array( 'cluster_id' => $cluster_id )
                );
            }
        }
    }

    /**
     * Admin-only operator tool (§2.4.2) — directly reassigns the host,
     * no member-facing trigger.
     * @return true|WP_Error
     */
    public static function appoint_host( int $cluster_id, int $new_host_id ) {
        $post = get_post( $cluster_id );
        if ( ! $post || 'culture_cluster' !== $post->post_type ) {
            return new WP_Error( 'invalid_cluster', 'This cluster does not exist.', array( 'status' => 400 ) );
        }

        if ( ! in_array( $new_host_id, self::get_active_member_ids( $cluster_id ), true ) ) {
            return new WP_Error( 'not_a_member', 'That user is not an active member of this Stoop.', array( 'status' => 400 ) );
        }

        update_post_meta( $cluster_id, '_cluster_host_id', $new_host_id );
        update_post_meta( $cluster_id, '_cluster_host_mechanism', 'appointed' );
        self::promote_to_host_role( $cluster_id, $new_host_id );

        if ( class_exists( 'Culture_Notifications' ) ) {
            Culture_Notifications::add(
                $new_host_id,
                'cluster_new_host',
                'You are now the host',
                'You have been appointed host of ' . get_post_meta( $cluster_id, '_cluster_name', true ) . '.',
                '/cluster/' . $cluster_id,
                array( 'cluster_id' => $cluster_id )
            );
        }

        return true;
    }

    private static function earliest_signup_among( array $user_ids ) : int {
        $best_id   = 0;
        $best_time = null;
        foreach ( $user_ids as $user_id ) {
            $user = get_userdata( $user_id );
            if ( ! $user ) {
                continue;
            }
            $registered = strtotime( $user->user_registered );
            if ( null === $best_time || $registered < $best_time ) {
                $best_time = $registered;
                $best_id   = $user_id;
            }
        }
        return $best_id;
    }

    private static function longest_standing_member( int $cluster_id ) : int {
        global $wpdb;
        $user_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT user_id FROM " . self::table() . " WHERE cluster_id = %d AND status = 'active' ORDER BY joined_at ASC LIMIT 1",
            $cluster_id
        ) );
        return $user_id ? (int) $user_id : 0;
    }

    private static function promote_to_host_role( int $cluster_id, int $new_host_id ) {
        global $wpdb;
        $table = self::table();
        $wpdb->update(
            $table,
            array( 'role' => 'member' ),
            array( 'cluster_id' => $cluster_id, 'role' => 'host' ),
            array( '%s' ), array( '%d', '%s' )
        );
        $wpdb->update(
            $table,
            array( 'role' => 'host' ),
            array( 'cluster_id' => $cluster_id, 'user_id' => $new_host_id ),
            array( '%s' ), array( '%d', '%d' )
        );
    }

    /* ——————————————————————————————————————
     *  Check-in & attendance (Phase 3, §5/§6)
     * —————————————————————————————————————— */

    /** Host-shown QR token lifetime, in seconds. */
    const QR_TOKEN_TTL = 900;

    /**
     * HMAC signing key — same fallback chain as Culture_Perks::hmac_key().
     */
    private static function hmac_key() : string {
        if ( defined( 'CULTURE_API_SECRET' ) && CULTURE_API_SECRET ) {
            return CULTURE_API_SECRET;
        }
        return get_option( 'culture_api_secret', '' );
    }

    private static function sign_checkin_token( int $cluster_id, string $meeting_date, int $expires_at ) : string {
        $payload = "{$cluster_id}:{$meeting_date}:{$expires_at}";
        return hash_hmac( 'sha256', $payload, self::hmac_key() );
    }

    /**
     * Host shows this QR; members scan it with the in-app camera scanner.
     * Reversed direction from Culture_Perks (staff-scans-member) — this is
     * host-shows / member-scans, the first such flow in this codebase.
     */
    public static function generate_host_qr( int $cluster_id, int $host_id ) {
        $cluster = self::get_cluster( $cluster_id );
        if ( ! $cluster ) {
            return new WP_Error( 'not_found', __( 'Stoop not found.', 'culture-community' ), array( 'status' => 404 ) );
        }
        if ( (int) $cluster['hostId'] !== $host_id ) {
            return new WP_Error( 'forbidden', __( 'Only the current host can generate a check-in code.', 'culture-community' ), array( 'status' => 403 ) );
        }

        $meeting_date = current_time( 'Y-m-d' );
        $expires_at   = time() + self::QR_TOKEN_TTL;
        $token        = self::sign_checkin_token( $cluster_id, $meeting_date, $expires_at );

        return array(
            'token'       => $token,
            'meetingDate' => $meeting_date,
            'expiresAt'   => $expires_at,
        );
    }

    /**
     * Verify a scanned token before calling check_in(). Returns true or a
     * WP_Error explaining why the code can't be redeemed.
     */
    public static function verify_checkin_qr( int $cluster_id, string $meeting_date, int $expires_at, string $token ) {
        if ( time() > $expires_at ) {
            return new WP_Error( 'expired', __( 'This check-in code has expired — ask your host to refresh it.', 'culture-community' ), array( 'status' => 410 ) );
        }
        $expected = self::sign_checkin_token( $cluster_id, $meeting_date, $expires_at );
        if ( ! hash_equals( $expected, $token ) ) {
            return new WP_Error( 'invalid_token', __( 'Invalid check-in code.', 'culture-community' ), array( 'status' => 400 ) );
        }
        return true;
    }

    /**
     * Record a check-in. $method is 'qr' (member scanned the host's code) or
     * 'host_manual' (host tapped the member's name as a fallback). UNIQUE KEY
     * on (cluster_id, user_id, meeting_date) makes a re-scan the same week a
     * harmless no-op rather than an error.
     */
    public static function check_in( int $cluster_id, int $user_id, string $method = 'qr', string $meeting_date = '' ) {
        global $wpdb;

        $status = self::get_member_status( $cluster_id, $user_id );
        if ( ! $status['isMember'] ) {
            return new WP_Error( 'not_member', __( 'You are not a member of this Stoop.', 'culture-community' ), array( 'status' => 403 ) );
        }

        $meeting_date = $meeting_date ?: current_time( 'Y-m-d' );
        $method       = in_array( $method, array( 'qr', 'host_manual' ), true ) ? $method : 'qr';
        $table        = self::checkins_table();

        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE cluster_id = %d AND user_id = %d AND meeting_date = %s",
            $cluster_id, $user_id, $meeting_date
        ) );

        if ( $existing ) {
            return array( 'success' => true, 'alreadyCheckedIn' => true, 'meetingDate' => $meeting_date );
        }

        $wpdb->insert(
            $table,
            array(
                'cluster_id'    => $cluster_id,
                'user_id'       => $user_id,
                'meeting_date'  => $meeting_date,
                'checked_in_at' => current_time( 'mysql' ),
                'method'        => $method,
            ),
            array( '%d', '%d', '%s', '%s', '%s' )
        );

        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'cluster_checked_in' );
        }

        return array( 'success' => true, 'alreadyCheckedIn' => false, 'meetingDate' => $meeting_date );
    }

    /**
     * Consecutive weekly check-in streak for a user, across however many
     * clusters they've checked into (almost always just one). A gap of 4–10
     * days between consecutive meeting dates still counts as "consecutive"
     * to absorb a meeting moved a day or two; anything wider breaks it.
     */
    public static function get_checkin_streak( int $user_id ) : int {
        global $wpdb;
        $dates = $wpdb->get_col( $wpdb->prepare(
            "SELECT DISTINCT meeting_date FROM " . self::checkins_table() . " WHERE user_id = %d ORDER BY meeting_date DESC",
            $user_id
        ) );

        if ( empty( $dates ) ) {
            return 0;
        }

        $streak = 1;
        $prev   = strtotime( $dates[0] );
        for ( $i = 1, $count = count( $dates ); $i < $count; $i++ ) {
            $cur      = strtotime( $dates[ $i ] );
            $gap_days = ( $prev - $cur ) / DAY_IN_SECONDS;
            if ( $gap_days >= 4 && $gap_days <= 10 ) {
                $streak++;
                $prev = $cur;
            } else {
                break;
            }
        }
        return $streak;
    }

    /**
     * Attendance summary for a member's own cluster — backs the streak/total
     * display in the UI and the "Cluster Regular" badge stat.
     */
    public static function get_attendance_history( int $cluster_id, int $user_id ) : array {
        global $wpdb;
        $table = self::checkins_table();

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE cluster_id = %d AND user_id = %d",
            $cluster_id, $user_id
        ) );
        $last = $wpdb->get_var( $wpdb->prepare(
            "SELECT meeting_date FROM {$table} WHERE cluster_id = %d AND user_id = %d ORDER BY meeting_date DESC LIMIT 1",
            $cluster_id, $user_id
        ) );

        return array(
            'totalCheckins' => $total,
            'streak'        => self::get_checkin_streak( $user_id ),
            'lastCheckedIn' => $last ?: null,
        );
    }

    /**
     * Consecutive calendar months (counting back from the current month) in
     * which a user received a 'cluster_host_served' credit ledger award —
     * backs the "City Convener" badge stat. Reads the ledger rather than any
     * cluster table since host service is awarded monthly by cron, not
     * per-cluster state.
     */
    public static function get_host_consecutive_months( int $user_id ) : int {
        global $wpdb;
        $months = $wpdb->get_col( $wpdb->prepare(
            "SELECT DISTINCT DATE_FORMAT(created_at, '%%Y-%%m') FROM {$wpdb->prefix}culture_credit_ledger
             WHERE user_id = %d AND source = 'cluster_host_served'
             ORDER BY created_at DESC",
            $user_id
        ) );

        if ( empty( $months ) ) {
            return 0;
        }

        $streak = 1;
        $prev   = strtotime( $months[0] . '-01' );
        for ( $i = 1, $count = count( $months ); $i < $count; $i++ ) {
            $cur      = strtotime( $months[ $i ] . '-01' );
            $expected = strtotime( '-1 month', $prev );
            if ( gmdate( 'Y-m', $expected ) === gmdate( 'Y-m', $cur ) ) {
                $streak++;
                $prev = $cur;
            } else {
                break;
            }
        }
        return $streak;
    }
}
