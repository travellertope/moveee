<?php
/**
 * RSVP system for community-organiser events (culture_post CPT,
 * _template_type = 'event'). Separate from Culture_Event_RSVP, which is the
 * pre-existing RSVP system for editorial culture_event CPT posts — the two
 * are unrelated and must not share a table.
 *
 * Free, capacity-limited signups only — no payment processing. Enabling
 * RSVP on an event (creation) and viewing/managing the attendee list
 * (management) are both restricted to Connect Pro (patron) members.
 */
class Culture_Community_RSVP {

    public static function table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_community_rsvp';
    }

    public static function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            post_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'confirmed',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY post_user (post_id, user_id),
            KEY post_status (post_id, status)
        ) {$charset_collate};" );
    }

    /* ——————————————————————————————————————
     *  Pro-tier gate
     * —————————————————————————————————————— */

    public static function is_pro( int $user_id ) : bool {
        if ( is_super_admin( $user_id ) || user_can( $user_id, 'manage_options' ) ) {
            return true;
        }
        $tier = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';
        return 'patron' === $tier;
    }

    /* ——————————————————————————————————————
     *  Event meta reads
     * —————————————————————————————————————— */

    public static function is_rsvp_enabled( int $post_id ) : bool {
        return (bool) get_post_meta( $post_id, '_culture_rsvp_enabled', true );
    }

    public static function get_capacity( int $post_id ) : int {
        return (int) get_post_meta( $post_id, '_culture_rsvp_capacity', true );
    }

    public static function get_count( int $post_id ) : int {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM " . self::table() . " WHERE post_id = %d AND status = 'confirmed'",
            $post_id
        ) );
    }

    public static function is_organiser( int $post_id, int $user_id ) : bool {
        $post = get_post( $post_id );
        return (bool) $post && (int) $post->post_author === $user_id;
    }

    public static function get_status( int $post_id, int $user_id ) : array {
        $rsvped = false;
        if ( $user_id ) {
            global $wpdb;
            $status = $wpdb->get_var( $wpdb->prepare(
                "SELECT status FROM " . self::table() . " WHERE post_id = %d AND user_id = %d",
                $post_id, $user_id
            ) );
            $rsvped = ( 'confirmed' === $status );
        }
        $capacity = self::get_capacity( $post_id );
        $count    = self::get_count( $post_id );

        return array(
            'enabled'     => self::is_rsvp_enabled( $post_id ),
            'rsvped'      => $rsvped,
            'count'       => $count,
            'capacity'    => $capacity,
            'spotsLeft'   => $capacity > 0 ? max( 0, $capacity - $count ) : null,
            'isFull'      => $capacity > 0 && $count >= $capacity,
            'isOrganiser' => $user_id ? self::is_organiser( $post_id, $user_id ) : false,
        );
    }

    /* ——————————————————————————————————————
     *  Core writes
     * —————————————————————————————————————— */

    /**
     * @return true|WP_Error
     */
    public static function rsvp( int $post_id, int $user_id ) {
        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type || 'event' !== get_post_meta( $post_id, '_template_type', true ) ) {
            return new WP_Error( 'invalid_event', 'This post is not an event.', array( 'status' => 400 ) );
        }
        if ( ! self::is_rsvp_enabled( $post_id ) ) {
            return new WP_Error( 'rsvp_disabled', 'RSVP is not enabled for this event.', array( 'status' => 400 ) );
        }
        if ( (int) $post->post_author === $user_id ) {
            return new WP_Error( 'own_event', 'You cannot RSVP to your own event.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table    = self::table();
        $existing = $wpdb->get_row( $wpdb->prepare(
            "SELECT id, status FROM {$table} WHERE post_id = %d AND user_id = %d",
            $post_id, $user_id
        ), ARRAY_A );

        if ( $existing && 'confirmed' === $existing['status'] ) {
            return true;
        }

        $capacity = self::get_capacity( $post_id );
        if ( $capacity > 0 && self::get_count( $post_id ) >= $capacity ) {
            return new WP_Error( 'event_full', 'This event is fully booked.', array( 'status' => 409 ) );
        }

        if ( $existing ) {
            $wpdb->update( $table, array( 'status' => 'confirmed' ), array( 'id' => $existing['id'] ), array( '%s' ), array( '%d' ) );
        } else {
            $wpdb->insert( $table, array(
                'post_id'    => $post_id,
                'user_id'    => $user_id,
                'status'     => 'confirmed',
                'created_at' => current_time( 'mysql' ),
            ), array( '%d', '%d', '%s', '%s' ) );
        }

        $organiser_id = (int) $post->post_author;
        $attendee     = get_userdata( $user_id );
        Culture_Notifications::add(
            $organiser_id,
            'event_rsvp',
            'New RSVP',
            ( $attendee ? $attendee->display_name : 'Someone' ) . ' is going to "' . wp_trim_words( $post->post_title, 8, '…' ) . '"',
            '/member/events',
            array( 'post_id' => $post_id, 'user_id' => $user_id )
        );

        return true;
    }

    public static function cancel( int $post_id, int $user_id ) : bool {
        global $wpdb;
        $updated = $wpdb->update(
            self::table(),
            array( 'status' => 'cancelled' ),
            array( 'post_id' => $post_id, 'user_id' => $user_id ),
            array( '%s' ), array( '%d', '%d' )
        );
        return false !== $updated;
    }

    /* ——————————————————————————————————————
     *  Organiser reads (Pro-gated by the REST handlers)
     * —————————————————————————————————————— */

    public static function get_attendees( int $post_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT r.user_id, r.created_at, u.display_name, u.user_email
             FROM " . self::table() . " r
             INNER JOIN {$wpdb->users} u ON u.ID = r.user_id
             WHERE r.post_id = %d AND r.status = 'confirmed'
             ORDER BY r.created_at ASC",
            $post_id
        ), ARRAY_A );
        return $rows ?: array();
    }

    public static function get_organiser_events( int $user_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT p.ID, p.post_title, p.post_status,
                    pm_enabled.meta_value AS rsvp_enabled,
                    pm_cap.meta_value AS rsvp_capacity,
                    pm_date.meta_value AS event_date
             FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm_template ON pm_template.post_id = p.ID AND pm_template.meta_key = '_template_type' AND pm_template.meta_value = 'event'
             LEFT JOIN {$wpdb->postmeta} pm_enabled ON pm_enabled.post_id = p.ID AND pm_enabled.meta_key = '_culture_rsvp_enabled'
             LEFT JOIN {$wpdb->postmeta} pm_cap ON pm_cap.post_id = p.ID AND pm_cap.meta_key = '_culture_rsvp_capacity'
             LEFT JOIN {$wpdb->postmeta} pm_date ON pm_date.post_id = p.ID AND pm_date.meta_key = '_event_date'
             WHERE p.post_author = %d AND p.post_type = 'culture_post' AND p.post_status IN ('publish','pending')
             ORDER BY pm_date.meta_value DESC",
            $user_id
        ), ARRAY_A );

        return array_map( function( $row ) {
            return array(
                'postId'       => (int) $row['ID'],
                'title'        => $row['post_title'],
                'status'       => $row['post_status'],
                'rsvpEnabled'  => (bool) $row['rsvp_enabled'],
                'rsvpCapacity' => (int) $row['rsvp_capacity'],
                'rsvpCount'    => self::get_count( (int) $row['ID'] ),
                'eventDate'    => $row['event_date'] ?: '',
            );
        }, $rows ?: array() );
    }
}
