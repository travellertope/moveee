<?php
/**
 * Hubs — user-created topic communities (docs/hubs-plan.md). Phase 1 scope
 * only: core CPT/membership/follow (create/join/leave/follow/discover), no
 * post-linking, moderation, or rewards yet (those are Phases 2-4).
 *
 * Single source of truth for both REST surfaces (mobile JWT + web API-key),
 * same discipline as Culture_Clusters / Culture_Follows / Culture_Community_RSVP.
 */
class Culture_Hubs {

    const STATUS_ACTIVE   = 'active';
    const STATUS_ARCHIVED = 'archived';

    /** Templates a brand-new Hub allows by default — the three templates
     * with no reputation/tier gate (docs/hubs-plan.md §3.3). */
    const DEFAULT_ALLOWED_TEMPLATES = array( 'post', 'cultural-take', 'quote' );

    /* ——————————————————————————————————————
     *  Tables
     * —————————————————————————————————————— */

    public static function members_table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_hub_members';
    }

    public static function create_members_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::members_table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            hub_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            role varchar(10) NOT NULL DEFAULT 'member',
            joined_at datetime DEFAULT CURRENT_TIMESTAMP,
            status varchar(10) NOT NULL DEFAULT 'active',
            PRIMARY KEY  (id),
            UNIQUE KEY hub_user (hub_id, user_id),
            KEY hub_status (hub_id, status),
            KEY user_status (user_id, status)
        ) {$charset_collate};" );
    }

    public static function follows_table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_hub_follows';
    }

    public static function create_follows_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $table = self::follows_table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            hub_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            notify_posts tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY hub_user (hub_id, user_id),
            KEY user_idx (user_id)
        ) {$charset_collate};" );
    }

    /* ——————————————————————————————————————
     *  Core reads
     * —————————————————————————————————————— */

    public static function get_member_count( int $hub_id ) : int {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM " . self::members_table() . " WHERE hub_id = %d AND status = 'active'",
            $hub_id
        ) );
    }

    public static function get_hub( int $hub_id ) {
        $post = get_post( $hub_id );
        if ( ! $post || 'culture_hub' !== $post->post_type ) {
            return null;
        }

        $templates_json = get_post_meta( $hub_id, '_hub_allowed_templates', true );
        $templates      = $templates_json ? json_decode( $templates_json, true ) : self::DEFAULT_ALLOWED_TEMPLATES;
        $templates      = is_array( $templates ) && $templates ? $templates : self::DEFAULT_ALLOWED_TEMPLATES;

        return array(
            'id'                => $hub_id,
            'name'              => get_post_meta( $hub_id, '_hub_name', true ) ?: $post->post_title,
            'slug'              => get_post_meta( $hub_id, '_hub_slug', true ) ?: $post->post_name,
            'description'       => get_post_meta( $hub_id, '_hub_description', true ),
            'coverImageId'      => (int) get_post_meta( $hub_id, '_hub_cover_image_id', true ) ?: null,
            'coverImageUrl'     => ( function() use ( $hub_id ) {
                $image_id = (int) get_post_meta( $hub_id, '_hub_cover_image_id', true );
                return $image_id ? wp_get_attachment_url( $image_id ) : '';
            } )(),
            'creatorId'         => (int) get_post_meta( $hub_id, '_hub_creator_id', true ),
            'status'            => get_post_meta( $hub_id, '_hub_status', true ) ?: self::STATUS_ACTIVE,
            'allowedTemplates'  => array_values( $templates ),
            'memberCount'       => (int) get_post_meta( $hub_id, '_hub_member_count', true ),
            'postCount'         => (int) get_post_meta( $hub_id, '_hub_post_count', true ),
            'createdAt'         => get_post_meta( $hub_id, '_hub_created_at', true ),
        );
    }

    public static function get_hub_by_slug( string $slug ) {
        global $wpdb;
        $hub_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_hub_slug' AND meta_value = %s LIMIT 1",
            $slug
        ) );
        return $hub_id ? self::get_hub( (int) $hub_id ) : null;
    }

    public static function get_role( int $hub_id, int $user_id ) : ?string {
        global $wpdb;
        $role = $wpdb->get_var( $wpdb->prepare(
            "SELECT role FROM " . self::members_table() . " WHERE hub_id = %d AND user_id = %d AND status = 'active'",
            $hub_id, $user_id
        ) );
        return $role ?: null;
    }

    public static function is_member( int $hub_id, int $user_id ) : bool {
        return null !== self::get_role( $hub_id, $user_id );
    }

    public static function is_following( int $hub_id, int $user_id ) : bool {
        global $wpdb;
        $row = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM " . self::follows_table() . " WHERE hub_id = %d AND user_id = %d",
            $hub_id, $user_id
        ) );
        return (bool) $row;
    }

    public static function get_status( int $hub_id, int $user_id ) : array {
        $role = self::get_role( $hub_id, $user_id );
        return array(
            'isMember'    => null !== $role,
            'role'        => $role,
            'isFollowing' => self::is_following( $hub_id, $user_id ),
        );
    }

    /**
     * A user's joined + followed Hubs, for the "My Hubs" screen.
     */
    public static function get_for_user( int $user_id ) : array {
        global $wpdb;

        $joined_ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT hub_id FROM " . self::members_table() . " WHERE user_id = %d AND status = 'active'",
            $user_id
        ) );
        $followed_ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT hub_id FROM " . self::follows_table() . " WHERE user_id = %d",
            $user_id
        ) );

        $build = function( array $ids ) use ( $user_id ) {
            $hubs = array();
            foreach ( $ids ?: array() as $id ) {
                $hub = self::get_hub( (int) $id );
                if ( $hub ) {
                    $hub['role'] = self::get_role( (int) $id, $user_id );
                    $hubs[]      = $hub;
                }
            }
            return $hubs;
        };

        return array(
            'joined'   => $build( $joined_ids ),
            'followed' => $build( $followed_ids ),
        );
    }

    /**
     * Public browse — mirrors Culture_Directory::handle_browse()'s shape.
     */
    public static function discover( array $params ) : array {
        global $wpdb;

        $q        = isset( $params['q'] ) ? sanitize_text_field( $params['q'] ) : '';
        $sort     = isset( $params['sort'] ) ? sanitize_key( $params['sort'] ) : 'popular';
        $page     = max( 1, (int) ( $params['page'] ?? 1 ) );
        $per_page = min( 50, max( 1, (int) ( $params['per_page'] ?? 20 ) ) );

        $active_ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_hub_status' AND meta_value = %s",
            self::STATUS_ACTIVE
        ) );
        if ( ! $active_ids ) {
            return array( 'hubs' => array(), 'total' => 0, 'page' => $page, 'perPage' => $per_page );
        }

        $args = array(
            'post_type'      => 'culture_hub',
            'post_status'    => 'publish',
            'post__in'       => array_values( $active_ids ),
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
            // 'popular' (default) and 'trending' both need a derived value
            // (member count / recent post count) not sortable via WP_Query
            // directly — fetch by date, then re-sort below.
            $args['orderby'] = 'date';
            $args['order']   = 'DESC';
        }

        $query = new WP_Query( $args );
        $hubs  = array();
        foreach ( $query->posts as $post ) {
            $hub = self::get_hub( $post->ID );
            if ( $hub ) {
                $hubs[] = $hub;
            }
        }

        if ( $sort === 'popular' || $sort === '' ) {
            usort( $hubs, function( $a, $b ) {
                return $b['memberCount'] <=> $a['memberCount'];
            } );
        } elseif ( $sort === 'trending' ) {
            $seven_days_ago = gmdate( 'Y-m-d H:i:s', time() - ( 7 * DAY_IN_SECONDS ) );
            $recent_counts  = array();
            foreach ( $hubs as $hub ) {
                $recent_counts[ $hub['id'] ] = (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm
                     INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                     WHERE pm.meta_key = '_hub_id' AND pm.meta_value = %d
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'
                       AND p.post_date >= %s",
                    $hub['id'], $seven_days_ago
                ) );
            }
            usort( $hubs, function( $a, $b ) use ( $recent_counts ) {
                return $recent_counts[ $b['id'] ] <=> $recent_counts[ $a['id'] ];
            } );
        }

        return array(
            'hubs'    => $hubs,
            'total'   => $query->found_posts,
            'page'    => $page,
            'perPage' => $per_page,
        );
    }

    /* ——————————————————————————————————————
     *  Core writes
     * —————————————————————————————————————— */

    private static function unique_slug( string $base ) : string {
        $base = sanitize_title( $base ) ?: 'hub';
        global $wpdb;
        $slug = $base;
        $i    = 2;
        while ( $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_hub_slug' AND meta_value = %s LIMIT 1",
            $slug
        ) ) ) {
            $slug = $base . '-' . $i;
            $i++;
        }
        return $slug;
    }

    /**
     * @return int|WP_Error Hub post ID on success.
     */
    public static function create( int $user_id, array $data ) {
        $name = sanitize_text_field( $data['name'] ?? '' );
        if ( '' === $name ) {
            return new WP_Error( 'missing_name', 'A Hub name is required.', array( 'status' => 400 ) );
        }
        $description = sanitize_textarea_field( $data['description'] ?? '' );
        if ( '' === $description ) {
            return new WP_Error( 'missing_description', 'A short description is required.', array( 'status' => 400 ) );
        }

        $post_id = wp_insert_post( array(
            'post_type'   => 'culture_hub',
            'post_title'  => $name,
            'post_status' => 'publish',
            'post_author' => $user_id,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        $now  = current_time( 'mysql' );
        $slug = self::unique_slug( $name );

        $allowed = isset( $data['allowedTemplates'] ) && is_array( $data['allowedTemplates'] ) && $data['allowedTemplates']
            ? array_values( array_intersect(
                array_map( 'sanitize_key', $data['allowedTemplates'] ),
                array( 'post', 'hidden-gem', 'cultural-take', 'food-review', 'book-review', 'creative-showcase', 'poll', 'itinerary', 'event', 'quote' )
            ) )
            : self::DEFAULT_ALLOWED_TEMPLATES;
        if ( ! $allowed ) {
            $allowed = self::DEFAULT_ALLOWED_TEMPLATES;
        }

        update_post_meta( $post_id, '_hub_name', $name );
        update_post_meta( $post_id, '_hub_slug', $slug );
        update_post_meta( $post_id, '_hub_description', $description );
        update_post_meta( $post_id, '_hub_cover_image_id', (int) ( $data['coverImageId'] ?? 0 ) );
        update_post_meta( $post_id, '_hub_creator_id', $user_id );
        update_post_meta( $post_id, '_hub_status', self::STATUS_ACTIVE );
        update_post_meta( $post_id, '_hub_allowed_templates', wp_json_encode( $allowed ) );
        update_post_meta( $post_id, '_hub_member_count', 1 );
        update_post_meta( $post_id, '_hub_post_count', 0 );
        update_post_meta( $post_id, '_hub_created_at', $now );

        global $wpdb;
        $wpdb->insert( self::members_table(), array(
            'hub_id'    => $post_id,
            'user_id'   => $user_id,
            'role'      => 'owner',
            'joined_at' => $now,
            'status'    => 'active',
        ), array( '%d', '%d', '%s', '%s', '%s' ) );

        return $post_id;
    }

    /**
     * @return true|WP_Error
     */
    public static function join( int $hub_id, int $user_id ) {
        $post = get_post( $hub_id );
        if ( ! $post || 'culture_hub' !== $post->post_type ) {
            return new WP_Error( 'invalid_hub', 'This Hub does not exist.', array( 'status' => 400 ) );
        }
        if ( self::STATUS_ACTIVE !== get_post_meta( $hub_id, '_hub_status', true ) ) {
            return new WP_Error( 'hub_archived', 'This Hub is archived and no longer accepting members.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table    = self::members_table();
        $existing = $wpdb->get_row( $wpdb->prepare(
            "SELECT id, status FROM {$table} WHERE hub_id = %d AND user_id = %d",
            $hub_id, $user_id
        ), ARRAY_A );

        if ( $existing && 'active' === $existing['status'] ) {
            return true;
        }

        if ( $existing ) {
            $wpdb->update( $table, array( 'status' => 'active' ), array( 'id' => $existing['id'] ), array( '%s' ), array( '%d' ) );
        } else {
            $wpdb->insert( $table, array(
                'hub_id'    => $hub_id,
                'user_id'   => $user_id,
                'role'      => 'member',
                'joined_at' => current_time( 'mysql' ),
                'status'    => 'active',
            ), array( '%d', '%d', '%s', '%s', '%s' ) );
        }

        update_post_meta( $hub_id, '_hub_member_count', self::get_member_count( $hub_id ) );

        return true;
    }

    /**
     * @return true|WP_Error
     */
    public static function leave( int $hub_id, int $user_id ) {
        $role = self::get_role( $hub_id, $user_id );
        if ( null === $role ) {
            return true;
        }
        if ( 'owner' === $role ) {
            return new WP_Error( 'owner_cannot_leave', 'The Hub owner cannot leave — archive the Hub instead.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $updated = $wpdb->update(
            self::members_table(),
            array( 'status' => 'left' ),
            array( 'hub_id' => $hub_id, 'user_id' => $user_id ),
            array( '%s' ), array( '%d', '%d' )
        );

        if ( false !== $updated ) {
            update_post_meta( $hub_id, '_hub_member_count', self::get_member_count( $hub_id ) );
        }

        return false !== $updated;
    }

    public static function follow( int $hub_id, int $user_id, bool $notify_posts = false ) {
        $post = get_post( $hub_id );
        if ( ! $post || 'culture_hub' !== $post->post_type ) {
            return new WP_Error( 'invalid_hub', 'This Hub does not exist.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $table    = self::follows_table();
        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE hub_id = %d AND user_id = %d",
            $hub_id, $user_id
        ) );

        if ( $existing ) {
            $wpdb->update( $table, array( 'notify_posts' => $notify_posts ? 1 : 0 ), array( 'id' => $existing ), array( '%d' ), array( '%d' ) );
        } else {
            $wpdb->insert( $table, array(
                'hub_id'       => $hub_id,
                'user_id'      => $user_id,
                'notify_posts' => $notify_posts ? 1 : 0,
                'created_at'   => current_time( 'mysql' ),
            ), array( '%d', '%d', '%d', '%s' ) );
        }

        return true;
    }

    public static function unfollow( int $hub_id, int $user_id ) : bool {
        global $wpdb;
        return false !== $wpdb->delete(
            self::follows_table(),
            array( 'hub_id' => $hub_id, 'user_id' => $user_id ),
            array( '%d', '%d' )
        );
    }
}
