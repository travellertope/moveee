<?php
/**
 * House Fellowship clusters — weekly street/neighbourhood meetup groups.
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
            'createdAt'      => get_post_meta( $cluster_id, '_cluster_created_at', true ),
            'activatedAt'    => get_post_meta( $cluster_id, '_cluster_activated_at', true ),
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
        $updated = $wpdb->update(
            self::table(),
            array( 'status' => 'left' ),
            array( 'cluster_id' => $cluster_id, 'user_id' => $user_id ),
            array( '%s' ), array( '%d', '%d' )
        );
        return false !== $updated;
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
                'Your House Fellowship is active!',
                get_post_meta( $cluster_id, '_cluster_name', true ) . ' has reached enough members and is now open to the neighbourhood.',
                '/cluster/' . $cluster_id,
                array( 'cluster_id' => $cluster_id )
            );
        }
    }
}
