<?php
/**
 * Hubs — user-created topic communities (docs/hubs-plan.md). Phase 1: core
 * CPT/membership/follow (create/join/leave/follow/discover). Phase 2 adds
 * post-linking (_hub_id on culture_post) — see ALLOWED_TEMPLATES and the
 * added_post_meta hook below. Moderation/rewards are still Phases 3-4.
 *
 * Single source of truth for both REST surfaces (mobile JWT + web API-key),
 * same discipline as Culture_Clusters / Culture_Follows / Culture_Community_RSVP.
 */
class Culture_Hubs {

    const STATUS_ACTIVE   = 'active';
    const STATUS_ARCHIVED = 'archived';

    /**
     * Template types a Hub's _hub_allowed_templates can contain. Deliberately
     * excludes 'quote' — quotes are a separate culture_quote CPT (submitted
     * via /api/quotes/create, not handle_submit_post()/community/submit), so
     * they can never carry a _hub_id the way every other template's
     * culture_post can. Offering "Quote" in a Hub's template picker would
     * silently create quotes that never appear in that Hub's feed — worse
     * than not offering it. Revisit only if culture_quote ever gets its own
     * Hub-linkage plumbing.
     */
    const ALLOWED_TEMPLATES = array( 'post', 'hidden-gem', 'cultural-take', 'food-review', 'book-review', 'creative-showcase', 'poll', 'itinerary', 'event' );

    /** Templates a brand-new Hub allows by default — the two templates with
     * no reputation/tier gate (docs/hubs-plan.md §3.3, revised to drop quote
     * per the note above). */
    const DEFAULT_ALLOWED_TEMPLATES = array( 'post', 'cultural-take' );

    /**
     * Increments _hub_post_count the first time _hub_id is set on a
     * culture_post — fires for both submit paths (mobile's explicit
     * update_post_meta() call and web's REST-API meta-on-insert), since
     * both ultimately go through add_post_meta() under the hood.
     */
    /** Same batching cap as Culture_Follows::SYNC_NOTIFY_BATCH. */
    const SYNC_NOTIFY_BATCH = 200;

    public static function init() {
        add_action( 'added_post_meta', array( __CLASS__, 'on_hub_id_meta_added' ), 10, 4 );
        add_action( 'culture_notify_hub_followers_batch', array( __CLASS__, 'process_notify_hub_post_batch' ), 10, 3 );
    }

    public static function on_hub_id_meta_added( $meta_id, int $object_id, string $meta_key, $meta_value ) {
        if ( '_hub_id' !== $meta_key ) {
            return;
        }
        $hub_id = (int) $meta_value;
        if ( ! $hub_id || 'culture_post' !== get_post_type( $object_id ) ) {
            return;
        }
        update_post_meta( $hub_id, '_hub_post_count', (int) get_post_meta( $hub_id, '_hub_post_count', true ) + 1 );
    }

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
            'coverImageUrl'     => get_post_meta( $hub_id, '_hub_cover_image_url', true ) ?: '',
            'creatorId'         => (int) get_post_meta( $hub_id, '_hub_creator_id', true ),
            'status'            => get_post_meta( $hub_id, '_hub_status', true ) ?: self::STATUS_ACTIVE,
            'allowedTemplates'  => array_values( $templates ),
            'memberCount'       => (int) get_post_meta( $hub_id, '_hub_member_count', true ),
            'postCount'         => (int) get_post_meta( $hub_id, '_hub_post_count', true ),
            'createdAt'         => get_post_meta( $hub_id, '_hub_created_at', true ),
            'pinnedPostId'      => (int) get_post_meta( $hub_id, '_hub_pinned_post_id', true ) ?: null,
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

    public static function get_notify_posts( int $hub_id, int $user_id ) : bool {
        global $wpdb;
        $val = $wpdb->get_var( $wpdb->prepare(
            "SELECT notify_posts FROM " . self::follows_table() . " WHERE hub_id = %d AND user_id = %d",
            $hub_id, $user_id
        ) );
        return (bool) $val;
    }

    public static function get_status( int $hub_id, int $user_id ) : array {
        $role = self::get_role( $hub_id, $user_id );
        return array(
            'isMember'    => null !== $role,
            'role'        => $role,
            'isFollowing' => self::is_following( $hub_id, $user_id ),
            'notifyPosts' => self::get_notify_posts( $hub_id, $user_id ),
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
                self::ALLOWED_TEMPLATES
            ) )
            : self::DEFAULT_ALLOWED_TEMPLATES;
        if ( ! $allowed ) {
            $allowed = self::DEFAULT_ALLOWED_TEMPLATES;
        }

        update_post_meta( $post_id, '_hub_name', $name );
        update_post_meta( $post_id, '_hub_slug', $slug );
        update_post_meta( $post_id, '_hub_description', $description );
        update_post_meta( $post_id, '_hub_cover_image_url', esc_url_raw( (string) ( $data['coverImageUrl'] ?? '' ) ) );
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

        if ( class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'hub_created' );
        }

        return $post_id;
    }

    /**
     * Owner-only. Updates name/description/cover/allowed-templates. Any
     * field omitted from $data is left unchanged.
     * @return array|WP_Error Updated hub on success.
     */
    public static function update( int $hub_id, int $user_id, array $data ) {
        $post = get_post( $hub_id );
        if ( ! $post || 'culture_hub' !== $post->post_type ) {
            return new WP_Error( 'invalid_hub', 'This Hub does not exist.', array( 'status' => 400 ) );
        }
        if ( 'owner' !== self::get_role( $hub_id, $user_id ) ) {
            return new WP_Error( 'forbidden', 'Only the Hub owner can edit this Hub.', array( 'status' => 403 ) );
        }

        if ( isset( $data['name'] ) ) {
            $name = sanitize_text_field( $data['name'] );
            if ( '' === $name ) {
                return new WP_Error( 'missing_name', 'A Hub name is required.', array( 'status' => 400 ) );
            }
            update_post_meta( $hub_id, '_hub_name', $name );
            wp_update_post( array( 'ID' => $hub_id, 'post_title' => $name ) );
        }

        if ( isset( $data['description'] ) ) {
            $description = sanitize_textarea_field( $data['description'] );
            if ( '' === $description ) {
                return new WP_Error( 'missing_description', 'A short description is required.', array( 'status' => 400 ) );
            }
            update_post_meta( $hub_id, '_hub_description', $description );
        }

        if ( isset( $data['coverImageUrl'] ) ) {
            update_post_meta( $hub_id, '_hub_cover_image_url', esc_url_raw( (string) $data['coverImageUrl'] ) );
        }

        if ( isset( $data['allowedTemplates'] ) && is_array( $data['allowedTemplates'] ) ) {
            $allowed = array_values( array_intersect(
                array_map( 'sanitize_key', $data['allowedTemplates'] ),
                self::ALLOWED_TEMPLATES
            ) );
            update_post_meta( $hub_id, '_hub_allowed_templates', wp_json_encode( $allowed ?: self::DEFAULT_ALLOWED_TEMPLATES ) );
        }

        return self::get_hub( $hub_id );
    }

    /**
     * Owner-only. Archives the Hub — read-only history, no new posts/joins.
     * Never hard-deleted, same posture as every other user-created group in
     * this codebase.
     * @return true|WP_Error
     */
    public static function archive( int $hub_id, int $user_id ) {
        $post = get_post( $hub_id );
        if ( ! $post || 'culture_hub' !== $post->post_type ) {
            return new WP_Error( 'invalid_hub', 'This Hub does not exist.', array( 'status' => 400 ) );
        }
        if ( 'owner' !== self::get_role( $hub_id, $user_id ) ) {
            return new WP_Error( 'forbidden', 'Only the Hub owner can archive this Hub.', array( 'status' => 403 ) );
        }

        update_post_meta( $hub_id, '_hub_status', self::STATUS_ARCHIVED );

        return true;
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

        // Hub Founder badge (docs/hubs-plan.md §6.2) — re-evaluated against
        // the owner, not the joining member, since crossing the 10-member
        // threshold is the owner's achievement. award_points()/award_reputation()
        // only auto-evaluates badges for whoever's own reputation just
        // changed, which on a join is the joiner, not the owner — so this
        // has to be triggered explicitly here rather than relying on that.
        $creator_id = (int) get_post_meta( $hub_id, '_hub_creator_id', true );
        if ( $creator_id && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::evaluate_badges( $creator_id );
        }

        return true;
    }

    /**
     * Largest active member count among Hubs this user owns — backs the
     * "Hub Founder" badge trigger (evaluate_badges()'s 'hub_max_members'
     * case), since a user can own multiple Hubs and the badge should fire
     * once any of them crosses the threshold.
     */
    public static function get_max_owned_hub_member_count( int $user_id ) : int {
        global $wpdb;
        $table = self::members_table();
        $max   = $wpdb->get_var( $wpdb->prepare(
            "SELECT MAX(hc.member_count) FROM (
                SELECT m.hub_id, COUNT(*) AS member_count
                FROM {$table} m
                WHERE m.status = 'active'
                  AND m.hub_id IN (
                      SELECT hub_id FROM {$table} WHERE user_id = %d AND role = 'owner' AND status = 'active'
                  )
                GROUP BY m.hub_id
            ) hc",
            $user_id
        ) );
        return (int) $max;
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

    /**
     * User ids opted into per-post notifications for this Hub, excluding the
     * poster themself. Single source of opt-in truth is the follows table's
     * notify_posts column — same as the platform-wide Follow system's
     * notify_posts (docs/hubs-plan.md §6.3/§6.4); a member who also wants
     * notifications must separately follow with notify_posts on, since
     * Follow and Join are deliberately independent actions (§4.1).
     */
    public static function get_post_notify_follower_ids( int $hub_id, int $exclude_user_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_col( $wpdb->prepare(
            "SELECT user_id FROM " . self::follows_table() . "
             WHERE hub_id = %d AND notify_posts = 1 AND user_id != %d",
            $hub_id, $exclude_user_id
        ) );
        return array_map( 'intval', $rows ?: array() );
    }

    /**
     * Notify opted-in followers that a new post landed in this Hub — same
     * sync-batch-then-cron-offload shape as Culture_Follows::notify_followers_of_post()
     * so a Hub with a large follower count can't turn post submission into an
     * unbounded synchronous insert loop.
     */
    public static function notify_followers_of_hub_post( int $hub_id, int $post_id, int $poster_id ) : void {
        $follower_ids = self::get_post_notify_follower_ids( $hub_id, $poster_id );
        if ( empty( $follower_ids ) ) {
            return;
        }

        $sync_ids = array_slice( $follower_ids, 0, self::SYNC_NOTIFY_BATCH );
        self::process_notify_hub_post_batch( $hub_id, $post_id, $sync_ids );

        $remaining = array_slice( $follower_ids, self::SYNC_NOTIFY_BATCH );
        if ( ! empty( $remaining ) ) {
            wp_schedule_single_event( time(), 'culture_notify_hub_followers_batch', array( $hub_id, $post_id, $remaining ) );
        }
    }

    public static function process_notify_hub_post_batch( int $hub_id, int $post_id, array $follower_ids ) : void {
        if ( empty( $follower_ids ) ) {
            return;
        }

        $hub_name = get_post_meta( $hub_id, '_hub_name', true );
        $hub_slug = get_post_meta( $hub_id, '_hub_slug', true ) ?: $hub_id;
        $post     = get_post( $post_id );
        $excerpt  = $post ? wp_trim_words( $post->post_title ?: $post->post_content, 8, '…' ) : '';

        foreach ( $follower_ids as $follower_id ) {
            Culture_Notifications::add(
                $follower_id,
                'hub_new_post',
                "New post in {$hub_name}",
                $excerpt ? "\"{$excerpt}\"" : 'Check out the latest post.',
                '/hub/' . $hub_slug,
                array( 'hub_id' => $hub_id, 'post_id' => $post_id )
            );
        }
    }

    /* ——————————————————————————————————————
     *  Moderation (docs/hubs-plan.md §7.1, Phase 3)
     * —————————————————————————————————————— */

    /**
     * Paginated member list with name/avatar/role, host sorted first —
     * mirrors Culture_Clusters::get_members()'s shape/ordering.
     */
    public static function list_members( int $hub_id, int $page = 1, int $per_page = 50 ) : array {
        global $wpdb;
        $table  = self::members_table();
        $offset = ( max( 1, $page ) - 1 ) * $per_page;

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT m.user_id, m.role, m.joined_at, u.display_name
             FROM {$table} m
             INNER JOIN {$wpdb->users} u ON u.ID = m.user_id
             WHERE m.hub_id = %d AND m.status = 'active'
             ORDER BY (m.role = 'owner') DESC, (m.role = 'mod') DESC, m.joined_at ASC
             LIMIT %d OFFSET %d",
            $hub_id, $per_page, $offset
        ), ARRAY_A );

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE hub_id = %d AND status = 'active'",
            $hub_id
        ) );

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

        return array( 'members' => $members, 'total' => $total, 'page' => $page, 'perPage' => $per_page );
    }

    /**
     * Owner-only. Promotes an active member to mod.
     * @return true|WP_Error
     */
    public static function appoint_mod( int $hub_id, int $requester_id, int $target_user_id ) {
        if ( 'owner' !== self::get_role( $hub_id, $requester_id ) ) {
            return new WP_Error( 'forbidden', 'Only the Hub owner can appoint mods.', array( 'status' => 403 ) );
        }
        $target_role = self::get_role( $hub_id, $target_user_id );
        if ( null === $target_role ) {
            return new WP_Error( 'not_a_member', 'That user is not a member of this Hub.', array( 'status' => 400 ) );
        }
        if ( 'owner' === $target_role ) {
            return new WP_Error( 'already_owner', 'That user already owns this Hub.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $wpdb->update(
            self::members_table(),
            array( 'role' => 'mod' ),
            array( 'hub_id' => $hub_id, 'user_id' => $target_user_id ),
            array( '%s' ), array( '%d', '%d' )
        );

        if ( class_exists( 'Culture_Notifications' ) ) {
            Culture_Notifications::add(
                $target_user_id,
                'hub_mod_appointed',
                'You are now a Hub mod',
                'You were appointed a moderator of ' . get_post_meta( $hub_id, '_hub_name', true ) . '.',
                '/hub/' . ( get_post_meta( $hub_id, '_hub_slug', true ) ?: $hub_id ),
                array( 'hub_id' => $hub_id )
            );
        }

        return true;
    }

    /**
     * Owner-only. Demotes a mod back to a regular member.
     * @return true|WP_Error
     */
    public static function remove_mod( int $hub_id, int $requester_id, int $target_user_id ) {
        if ( 'owner' !== self::get_role( $hub_id, $requester_id ) ) {
            return new WP_Error( 'forbidden', 'Only the Hub owner can remove mods.', array( 'status' => 403 ) );
        }
        if ( 'mod' !== self::get_role( $hub_id, $target_user_id ) ) {
            return new WP_Error( 'not_a_mod', 'That user is not a mod of this Hub.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $wpdb->update(
            self::members_table(),
            array( 'role' => 'member' ),
            array( 'hub_id' => $hub_id, 'user_id' => $target_user_id ),
            array( '%s' ), array( '%d', '%d' )
        );

        return true;
    }

    /**
     * Mod/owner. Removes a member from the Hub — a mod cannot remove another
     * mod or the owner (owner-only escalation, mirrors appoint/remove mod).
     * @return true|WP_Error
     */
    public static function remove_member( int $hub_id, int $requester_id, int $target_user_id ) {
        $requester_role = self::get_role( $hub_id, $requester_id );
        if ( ! in_array( $requester_role, array( 'owner', 'mod' ), true ) ) {
            return new WP_Error( 'forbidden', 'Only Hub mods and the owner can remove members.', array( 'status' => 403 ) );
        }
        $target_role = self::get_role( $hub_id, $target_user_id );
        if ( null === $target_role ) {
            return new WP_Error( 'not_a_member', 'That user is not a member of this Hub.', array( 'status' => 400 ) );
        }
        if ( 'owner' === $target_role ) {
            return new WP_Error( 'cannot_remove_owner', 'The Hub owner cannot be removed.', array( 'status' => 400 ) );
        }
        if ( 'mod' === $target_role && 'owner' !== $requester_role ) {
            return new WP_Error( 'forbidden', 'Only the Hub owner can remove a mod.', array( 'status' => 403 ) );
        }

        global $wpdb;
        $updated = $wpdb->update(
            self::members_table(),
            array( 'status' => 'left' ),
            array( 'hub_id' => $hub_id, 'user_id' => $target_user_id ),
            array( '%s' ), array( '%d', '%d' )
        );

        if ( false !== $updated ) {
            update_post_meta( $hub_id, '_hub_member_count', self::get_member_count( $hub_id ) );

            if ( class_exists( 'Culture_Notifications' ) ) {
                Culture_Notifications::add(
                    $target_user_id,
                    'hub_member_removed',
                    'You were removed from a Hub',
                    'You were removed from ' . get_post_meta( $hub_id, '_hub_name', true ) . '.',
                    '/hub',
                    array( 'hub_id' => $hub_id )
                );
            }
        }

        return false !== $updated;
    }

    /**
     * Mod/owner. Pins a post that belongs to this Hub — one pinned post max
     * (docs/hubs-plan.md §4.4), pinning a new one replaces the old.
     * @return true|WP_Error
     */
    public static function pin_post( int $hub_id, int $requester_id, int $post_id ) {
        $role = self::get_role( $hub_id, $requester_id );
        if ( ! in_array( $role, array( 'owner', 'mod' ), true ) ) {
            return new WP_Error( 'forbidden', 'Only Hub mods and the owner can pin posts.', array( 'status' => 403 ) );
        }
        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type || (int) get_post_meta( $post_id, '_hub_id', true ) !== $hub_id ) {
            return new WP_Error( 'invalid_post', 'That post does not belong to this Hub.', array( 'status' => 400 ) );
        }

        update_post_meta( $hub_id, '_hub_pinned_post_id', $post_id );

        return true;
    }

    /**
     * Mod/owner. Clears the Hub's pinned post, if any.
     * @return true|WP_Error
     */
    public static function unpin_post( int $hub_id, int $requester_id ) {
        $role = self::get_role( $hub_id, $requester_id );
        if ( ! in_array( $role, array( 'owner', 'mod' ), true ) ) {
            return new WP_Error( 'forbidden', 'Only Hub mods and the owner can unpin posts.', array( 'status' => 403 ) );
        }

        delete_post_meta( $hub_id, '_hub_pinned_post_id' );

        return true;
    }

    /**
     * Mod/owner. Removes a post from the Hub — platform-level moderation
     * (report/blocklist, §7.2) stays separate and unchanged; this is the
     * Hub-scoped equivalent, moving the post to 'pending' rather than
     * hard-deleting it (same no-hard-delete posture as everything else in
     * this codebase) and notifying the author for transparency.
     * @return true|WP_Error
     */
    public static function remove_post( int $hub_id, int $requester_id, int $post_id ) {
        $role = self::get_role( $hub_id, $requester_id );
        if ( ! in_array( $role, array( 'owner', 'mod' ), true ) ) {
            return new WP_Error( 'forbidden', 'Only Hub mods and the owner can remove posts.', array( 'status' => 403 ) );
        }
        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type || (int) get_post_meta( $post_id, '_hub_id', true ) !== $hub_id ) {
            return new WP_Error( 'invalid_post', 'That post does not belong to this Hub.', array( 'status' => 400 ) );
        }

        if ( (int) get_post_meta( $hub_id, '_hub_pinned_post_id', true ) === $post_id ) {
            delete_post_meta( $hub_id, '_hub_pinned_post_id' );
        }

        wp_update_post( array( 'ID' => $post_id, 'post_status' => 'pending' ) );

        $author_id = (int) $post->post_author;
        if ( $author_id && class_exists( 'Culture_Notifications' ) ) {
            Culture_Notifications::add(
                $author_id,
                'hub_post_removed',
                'Your Hub post was removed',
                'A moderator removed your post from ' . get_post_meta( $hub_id, '_hub_name', true ) . '.',
                '/hub/' . ( get_post_meta( $hub_id, '_hub_slug', true ) ?: $hub_id ),
                array( 'hub_id' => $hub_id, 'post_id' => $post_id )
            );
        }

        return true;
    }
}
