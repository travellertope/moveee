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
    const ALLOWED_TEMPLATES = array( 'post', 'hidden-gem', 'food-review', 'book-review', 'creative-showcase', 'poll', 'itinerary', 'event' );

    /** Templates a brand-new Hub allows by default — the one template with
     * no reputation/tier gate (docs/hubs-plan.md §3.3, revised to drop quote
     * per the note above; 'cultural-take' was removed entirely in July 2026,
     * folded into 'post'). */
    const DEFAULT_ALLOWED_TEMPLATES = array( 'post' );

    /**
     * Increments _hub_post_count the first time _hub_id is set on a
     * culture_post — fires for both submit paths (mobile's explicit
     * update_post_meta() call and web's REST-API meta-on-insert), since
     * both ultimately go through add_post_meta() under the hood.
     */
    /** Same batching cap as Culture_Follows::SYNC_NOTIFY_BATCH. */
    const SYNC_NOTIFY_BATCH = 200;

    /**
     * Section/Hub bridge (docs/hubs-plan.md §10, Phase 6). Every value in the
     * community_tag enum (Culture_Mobile_API::SECTION_TAGS /
     * SubmitPost.tsx's TAGS) gets a matching official, platform-owned Hub —
     * these slugs are what maybe_seed_official_hubs() creates them under.
     * Official Hubs are exempt from the main-feed exclusion (§4.5) that every
     * other Hub still gets; see is_official() / exclude_hub_posts() in
     * class-culture-post-types.php and get_community_feed_items() in
     * class-culture-mobile-api.php.
     */
    const SECTION_HUB_SLUGS = array(
        'Music'      => 'music',
        'Fashion'    => 'fashion',
        'Art'        => 'art',
        'Film'       => 'film',
        'Food'       => 'food',
        'Sport'      => 'sport',
        'Travel'     => 'travel',
        'Ideas'      => 'ideas',
        'Literature' => 'literature',
        'Design'     => 'design',
        'Tech'       => 'tech',
    );

    /**
     * Default cover images for the 11 official Hubs (docs/hubs-plan.md §10.6
     * flagged this as a gap — official Hubs had no owner to upload one, so
     * they launched with an empty _hub_cover_image_url and a placeholder
     * icon on /hub, added July 2026). Sourced from Wikimedia Commons —
     * stable, permanent upload.wikimedia.org URLs, no API key/expiry risk.
     * Used by both maybe_seed_official_hubs() (new installs) and
     * maybe_backfill_official_hub_covers() (existing installs whose Hubs
     * were already seeded with an empty cover).
     */
    const SECTION_COVER_IMAGES = array(
        'Music'      => 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Vintage_vinyl_records_%28Unsplash%29.jpg',
        'Fashion'    => 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Catwalk_fashion_week_westergas_2010.jpg',
        'Art'        => 'https://upload.wikimedia.org/wikipedia/commons/e/e4/New_Art_Gallery_Walsall_-_interior_13_-_entrance.JPG',
        'Film'       => 'https://upload.wikimedia.org/wikipedia/commons/2/26/Film_reel.jpg',
        'Food'       => 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Color_y_sabor_mexicano.jpg',
        'Sport'      => 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Marathon_Runners.jpg',
        'Travel'     => 'https://upload.wikimedia.org/wikipedia/commons/4/44/Donner_und_Blitzen_Wild_and_Scenic_River_%2830022819488%29.jpg',
        'Ideas'      => 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Sticky_notes_on_the_wall_of_the_Wikimedia_Foundation_office%2C_2010-10-26.jpg',
        'Literature' => 'https://upload.wikimedia.org/wikipedia/commons/9/96/Picton_Reading_Room_Staircase_%28106406979%29.jpeg',
        'Design'     => 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Graphasel_Design_Studio_01.jpg',
        'Tech'       => 'https://upload.wikimedia.org/wikipedia/commons/3/36/Laptop_coding_programs_%28Unsplash%29.jpg',
    );

    /**
     * Attribution text for SECTION_COVER_IMAGES entries under CC BY /
     * CC BY-SA (license requires credit) — empty string for the CC0/Public
     * Domain entries (Music, Travel, Literature, Design, Tech), which
     * require none. Surfaced as the cover image's title attribute (a
     * native hover tooltip) rather than permanent on-card text, since a
     * ~100px card thumbnail has no good spot for a visible credit line
     * without cluttering it.
     */
    const SECTION_COVER_CREDITS = array(
        'Music'      => '',
        'Fashion'    => 'Photo: Michiel, CC BY 2.0, via Wikimedia Commons',
        'Art'        => 'Photo: Andy Mabbett, CC BY-SA 3.0, via Wikimedia Commons',
        'Film'       => 'Photo: Runner1616, CC BY-SA 3.0, via Wikimedia Commons',
        'Food'       => 'Photo: Andrea Mayerly Niño Hernández, CC BY-SA 4.0, via Wikimedia Commons',
        'Sport'      => 'Photo: Chris Brown, CC BY 2.0, via Wikimedia Commons',
        'Travel'     => '',
        'Ideas'      => 'Photo: Ragesoss, CC BY 3.0, via Wikimedia Commons',
        'Literature' => '',
        'Design'     => '',
        'Tech'       => '',
    );

    public static function init() {
        add_action( 'added_post_meta', array( __CLASS__, 'on_hub_id_meta_added' ), 10, 4 );
        add_action( 'culture_notify_hub_followers_batch', array( __CLASS__, 'process_notify_hub_post_batch' ), 10, 3 );
        add_action( 'added_post_meta', array( __CLASS__, 'on_community_tag_meta_added' ), 10, 4 );
        add_action( 'updated_post_meta', array( __CLASS__, 'on_community_tag_meta_added' ), 10, 4 );
        self::maybe_seed_official_hubs();
        self::maybe_backfill_section_hub_links();
        self::maybe_merge_duplicate_official_hubs();
        self::maybe_backfill_official_hub_covers();
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

    /**
     * Auto-links a culture_post to its Section's official Hub the moment
     * community_tag is set — transparent plumbing, not a poster decision
     * (docs/hubs-plan.md §10.2). Fires on both add and update since a fresh
     * post's first community_tag write goes through add_post_meta(), while a
     * later edit changing the tag goes through update_post_meta().
     */
    public static function on_community_tag_meta_added( $meta_id, int $object_id, string $meta_key, $meta_value ) {
        if ( 'community_tag' !== $meta_key ) {
            return;
        }
        if ( 'culture_post' !== get_post_type( $object_id ) ) {
            return;
        }
        self::maybe_autolink_official_hub( $object_id, (string) $meta_value );
    }

    /**
     * @return int The official Hub id the post was linked to, or 0 if none.
     */
    public static function maybe_autolink_official_hub( int $post_id, string $section ) : int {
        if ( '' === $section ) {
            return 0;
        }
        // Never overwrite an explicit Hub-scoped post (docs/hubs-plan.md
        // §3.2's own hub_id param already set _hub_id before this fires).
        if ( get_post_meta( $post_id, '_hub_id', true ) ) {
            return 0;
        }
        $hub_id = self::get_official_hub_id_for_section( $section );
        if ( ! $hub_id ) {
            return 0;
        }
        update_post_meta( $post_id, '_hub_id', $hub_id );
        return $hub_id;
    }

    public static function get_official_hub_id_for_section( string $section ) : int {
        $map = get_option( 'culture_section_hub_map', array() );
        return isset( $map[ $section ] ) ? (int) $map[ $section ] : 0;
    }

    public static function is_official( int $hub_id ) : bool {
        return '1' === get_post_meta( $hub_id, '_hub_is_official', true );
    }

    /**
     * One-time creation of the 11 official Hubs (docs/hubs-plan.md §10.2/§10.6)
     * — platform-owned (post_author 0, no owner row in the members table, so
     * every owner-only Hub action is unreachable via the API for these until
     * an admin tool exists; edit via WP Admin/DB directly in the meantime).
     * Gated by culture_official_hubs_seeded so this only ever runs once, same
     * shape as Culture_Subscribers::maybe_backfill_announcements().
     */
    public static function maybe_seed_official_hubs() {
        if ( '1' === get_option( 'culture_official_hubs_seeded', '' ) ) {
            return;
        }

        // init() fires on *every* request, and this whole function is a
        // rare, slow path (WP_Query + up to 11 wp_insert_post() calls) that
        // only actually does anything during the brief window before
        // culture_official_hubs_seeded gets persisted. Without a lock,
        // concurrent requests landing in that window can each pass the
        // "not seeded yet" check above, then each create their own
        // duplicate Hub for the same section (this is exactly how two
        // "Literature" Hubs ended up live in production — see
        // maybe_merge_duplicate_official_hubs() for the one-time cleanup).
        // A transient acts as a cheap advisory mutex; it isn't perfectly
        // atomic against a request landing in the same instant as another,
        // but combined with the direct DB slug-existence check below (the
        // real invariant we care about), duplicate creation going forward
        // is effectively closed off.
        if ( get_transient( 'culture_hubs_seeding_lock' ) ) {
            return;
        }
        set_transient( 'culture_hubs_seeding_lock', 1, 30 );

        $map = get_option( 'culture_section_hub_map', array() );
        $map = is_array( $map ) ? $map : array();

        global $wpdb;

        foreach ( self::SECTION_HUB_SLUGS as $section => $slug ) {
            if ( ! empty( $map[ $section ] ) && get_post( (int) $map[ $section ] ) ) {
                continue;
            }

            // Direct DB check (not the possibly-stale $map above) — catches
            // a Hub already created for this slug by another request that
            // hasn't yet persisted culture_section_hub_map itself.
            $existing_id = $wpdb->get_var( $wpdb->prepare(
                "SELECT p.ID FROM {$wpdb->posts} p
                 INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_hub_slug' AND m.meta_value = %s
                 WHERE p.post_type = 'culture_hub' ORDER BY p.ID ASC LIMIT 1",
                $slug
            ) );
            if ( $existing_id ) {
                $map[ $section ] = (int) $existing_id;
                continue;
            }

            $post_id = wp_insert_post( array(
                'post_type'   => 'culture_hub',
                'post_title'  => $section,
                'post_status' => 'publish',
                'post_author' => 0,
            ), true );
            if ( is_wp_error( $post_id ) ) {
                continue;
            }

            $now = current_time( 'mysql' );
            update_post_meta( $post_id, '_hub_name', $section );
            update_post_meta( $post_id, '_hub_slug', $slug );
            update_post_meta( $post_id, '_hub_description', "Everything {$section} — every post Sectioned {$section} lands here automatically." );
            update_post_meta( $post_id, '_hub_cover_image_url', self::SECTION_COVER_IMAGES[ $section ] ?? '' );
            update_post_meta( $post_id, '_hub_cover_image_credit', self::SECTION_COVER_CREDITS[ $section ] ?? '' );
            update_post_meta( $post_id, '_hub_creator_id', 0 );
            update_post_meta( $post_id, '_hub_status', self::STATUS_ACTIVE );
            update_post_meta( $post_id, '_hub_allowed_templates', wp_json_encode( self::ALLOWED_TEMPLATES ) );
            update_post_meta( $post_id, '_hub_member_count', 0 );
            update_post_meta( $post_id, '_hub_post_count', 0 );
            update_post_meta( $post_id, '_hub_created_at', $now );
            update_post_meta( $post_id, '_hub_is_official', 1 );

            $map[ $section ] = $post_id;
        }

        update_option( 'culture_section_hub_map', $map );
        update_option( 'culture_official_hubs_seeded', '1' );
        delete_transient( 'culture_hubs_seeding_lock' );
    }

    /**
     * Backfills _hub_id on culture_post rows that already carry a
     * community_tag from before the official Hubs existed — without this the
     * Music Hub (etc.) would launch with zero history despite years of
     * Music-tagged posts (docs/hubs-plan.md §10.5). Gated the same way as
     * Culture_Subscribers::maybe_backfill_announcements(); runs once, after
     * the official Hubs themselves have been seeded.
     */
    public static function maybe_backfill_section_hub_links() {
        if ( '1' === get_option( 'culture_hub_categories_backfilled', '' ) ) {
            return;
        }
        if ( '1' !== get_option( 'culture_official_hubs_seeded', '' ) ) {
            return;
        }

        global $wpdb;
        foreach ( self::SECTION_HUB_SLUGS as $section => $slug ) {
            $hub_id = self::get_official_hub_id_for_section( $section );
            if ( ! $hub_id ) {
                continue;
            }

            $post_ids = $wpdb->get_col( $wpdb->prepare(
                "SELECT p.ID FROM {$wpdb->posts} p
                 INNER JOIN {$wpdb->postmeta} tag ON tag.post_id = p.ID AND tag.meta_key = 'community_tag' AND tag.meta_value = %s
                 LEFT JOIN {$wpdb->postmeta} hub ON hub.post_id = p.ID AND hub.meta_key = '_hub_id'
                 WHERE p.post_type = 'culture_post' AND hub.meta_id IS NULL",
                $section
            ) );

            foreach ( $post_ids ?: array() as $post_id ) {
                update_post_meta( (int) $post_id, '_hub_id', $hub_id );
            }
        }

        update_option( 'culture_hub_categories_backfilled', '1' );
    }

    /**
     * One-time cleanup for the race condition maybe_seed_official_hubs()
     * had before its transient lock + direct-DB slug check were added: on
     * an early request storm right after this feature first went live,
     * concurrent requests could each pass the "not seeded yet" gate and
     * independently create their own official Hub for the same section —
     * e.g. two separate "Literature" Hub posts, one left orphaned out of
     * culture_section_hub_map and invisible to auto-linking, but still
     * `publish`ed and still showing up in the Discover listing. This finds
     * any leftover duplicate for each section's slug, merges its real data
     * (posts/members/follows) onto the canonical (mapped) Hub via
     * merge_hub_into(), and trashes the empty shell. Gated the same way as
     * every other maybe_backfill_*() in this class — runs once.
     */
    public static function maybe_merge_duplicate_official_hubs() {
        if ( '1' === get_option( 'culture_hub_duplicates_merged', '' ) ) {
            return;
        }
        if ( '1' !== get_option( 'culture_official_hubs_seeded', '' ) ) {
            return;
        }

        global $wpdb;
        foreach ( self::SECTION_HUB_SLUGS as $section => $slug ) {
            $canonical_id = self::get_official_hub_id_for_section( $section );
            if ( ! $canonical_id ) {
                continue;
            }

            $duplicate_ids = $wpdb->get_col( $wpdb->prepare(
                "SELECT p.ID FROM {$wpdb->posts} p
                 INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_hub_slug' AND m.meta_value = %s
                 WHERE p.post_type = 'culture_hub' AND p.ID != %d AND p.post_status != 'trash'",
                $slug, $canonical_id
            ) );

            foreach ( $duplicate_ids ?: array() as $dup_id ) {
                self::merge_hub_into( (int) $dup_id, $canonical_id );
            }
        }

        update_option( 'culture_hub_duplicates_merged', '1' );
    }

    /**
     * Re-points every real record referencing $from_id (linked posts, Hub
     * membership, Hub follows) onto $into_id, recomputes $into_id's cached
     * counters, then trashes $from_id. Used by
     * maybe_merge_duplicate_official_hubs() — nothing genuine (a post
     * someone made, a membership, a follow) is lost, only the duplicate
     * shell post itself goes away.
     */
    private static function merge_hub_into( int $from_id, int $into_id ) {
        if ( ! $from_id || ! $into_id || $from_id === $into_id ) {
            return;
        }
        global $wpdb;

        // Posts: no uniqueness constraint, straightforward reassignment.
        $wpdb->update(
            $wpdb->postmeta,
            array( 'meta_value' => $into_id ),
            array( 'meta_key' => '_hub_id', 'meta_value' => $from_id ),
            array( '%d' ),
            array( '%s', '%d' )
        );

        // Members/follows both have a UNIQUE (hub_id, user_id) — a user who
        // ended up joined/following both duplicate Hubs would collide on a
        // naive UPDATE, so drop the duplicate's row for any user who
        // already has one on the canonical Hub, and reassign the rest.
        foreach ( array( self::members_table(), self::follows_table() ) as $table ) {
            $user_ids = $wpdb->get_col( $wpdb->prepare( "SELECT user_id FROM {$table} WHERE hub_id = %d", $from_id ) );
            foreach ( $user_ids ?: array() as $user_id ) {
                $user_id = (int) $user_id;
                $exists  = $wpdb->get_var( $wpdb->prepare(
                    "SELECT id FROM {$table} WHERE hub_id = %d AND user_id = %d", $into_id, $user_id
                ) );
                if ( $exists ) {
                    $wpdb->delete( $table, array( 'hub_id' => $from_id, 'user_id' => $user_id ), array( '%d', '%d' ) );
                } else {
                    $wpdb->update( $table, array( 'hub_id' => $into_id ), array( 'hub_id' => $from_id, 'user_id' => $user_id ), array( '%d' ), array( '%d', '%d' ) );
                }
            }
        }

        // _hub_member_count/_hub_post_count are cached counters (see
        // get_hub()), not live queries — recompute from the now-merged data
        // rather than trying to add the duplicate's stale counts on top.
        update_post_meta( $into_id, '_hub_member_count', self::get_member_count( $into_id ) );
        $post_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = '_hub_id' AND meta_value = %d", $into_id
        ) );
        update_post_meta( $into_id, '_hub_post_count', $post_count );

        // Trash rather than hard-delete — reversible, and get_hub_by_slug()
        // already excludes trashed posts so it resolves to the canonical
        // Hub regardless (see that method).
        wp_trash_post( $from_id );
    }

    /**
     * Backfills a default cover image + credit onto any official Hub whose
     * _hub_cover_image_url is still empty (July 2026) — every official Hub
     * seeded before SECTION_COVER_IMAGES existed launched with an empty
     * cover and a placeholder icon on /hub, since they're platform-owned
     * (post_author 0) with no one able to upload one. Gated the same way
     * as every other maybe_backfill_*()/maybe_merge_*() in this class —
     * runs once, and only ever fills in an empty cover, never overwrites
     * one an admin may have set manually via WP Admin/DB in the meantime.
     */
    public static function maybe_backfill_official_hub_covers() {
        if ( '1' === get_option( 'culture_hub_covers_backfilled', '' ) ) {
            return;
        }
        if ( '1' !== get_option( 'culture_official_hubs_seeded', '' ) ) {
            return;
        }

        foreach ( self::SECTION_HUB_SLUGS as $section => $slug ) {
            $hub_id = self::get_official_hub_id_for_section( $section );
            if ( ! $hub_id ) {
                continue;
            }
            if ( get_post_meta( $hub_id, '_hub_cover_image_url', true ) ) {
                continue;
            }
            update_post_meta( $hub_id, '_hub_cover_image_url', self::SECTION_COVER_IMAGES[ $section ] ?? '' );
            update_post_meta( $hub_id, '_hub_cover_image_credit', self::SECTION_COVER_CREDITS[ $section ] ?? '' );
        }

        update_option( 'culture_hub_covers_backfilled', '1' );
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
            'coverImageCredit'  => get_post_meta( $hub_id, '_hub_cover_image_credit', true ) ?: '',
            'creatorId'         => (int) get_post_meta( $hub_id, '_hub_creator_id', true ),
            'status'            => get_post_meta( $hub_id, '_hub_status', true ) ?: self::STATUS_ACTIVE,
            'allowedTemplates'  => array_values( $templates ),
            'memberCount'       => (int) get_post_meta( $hub_id, '_hub_member_count', true ),
            'postCount'         => (int) get_post_meta( $hub_id, '_hub_post_count', true ),
            'createdAt'         => get_post_meta( $hub_id, '_hub_created_at', true ),
            'pinnedPostId'      => (int) get_post_meta( $hub_id, '_hub_pinned_post_id', true ) ?: null,
            'isOfficial'        => self::is_official( $hub_id ),
        );
    }

    public static function get_hub_by_slug( string $slug ) {
        global $wpdb;
        // Excludes trashed posts — matters when a duplicate Hub sharing
        // this slug has been merged/trashed by
        // maybe_merge_duplicate_official_hubs(); without this join, its
        // postmeta row (untouched by wp_trash_post()) could still win the
        // LIMIT 1 depending on row order.
        $hub_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT m.post_id FROM {$wpdb->postmeta} m
             INNER JOIN {$wpdb->posts} p ON p.ID = m.post_id
             WHERE m.meta_key = '_hub_slug' AND m.meta_value = %s AND p.post_status != 'trash'
             ORDER BY m.post_id ASC LIMIT 1",
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
            // A real upload replacing a default Wikimedia cover no longer
            // needs that image's attribution — not reachable via the API
            // today for official Hubs (no owner row exists for them), but
            // kept correct in case an admin tool for that ever ships.
            update_post_meta( $hub_id, '_hub_cover_image_credit', '' );
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
            $write_ok = false !== $wpdb->update( $table, array( 'status' => 'active' ), array( 'id' => $existing['id'] ), array( '%s' ), array( '%d' ) );
        } else {
            $write_ok = false !== $wpdb->insert( $table, array(
                'hub_id'    => $hub_id,
                'user_id'   => $user_id,
                'role'      => 'member',
                'joined_at' => current_time( 'mysql' ),
                'status'    => 'active',
            ), array( '%d', '%d', '%s', '%s', '%s' ) );
        }

        // $wpdb suppresses errors by default (see the "Plugin DB table
        // auto-upgrade" note elsewhere in this codebase) — without this
        // check, a missing/broken wp_culture_hub_members table would still
        // return `true` here, so the REST response looks like a successful
        // join while nothing was actually persisted.
        if ( ! $write_ok ) {
            return new WP_Error( 'join_failed', 'Could not join this Hub right now. Please try again.', array( 'status' => 500 ) );
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

        if ( false === $updated ) {
            return new WP_Error( 'leave_failed', 'Could not leave this Hub right now. Please try again.', array( 'status' => 500 ) );
        }

        update_post_meta( $hub_id, '_hub_member_count', self::get_member_count( $hub_id ) );

        return true;
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
            $write_ok = false !== $wpdb->update( $table, array( 'notify_posts' => $notify_posts ? 1 : 0 ), array( 'id' => $existing ), array( '%d' ), array( '%d' ) );
        } else {
            $write_ok = false !== $wpdb->insert( $table, array(
                'hub_id'       => $hub_id,
                'user_id'      => $user_id,
                'notify_posts' => $notify_posts ? 1 : 0,
                'created_at'   => current_time( 'mysql' ),
            ), array( '%d', '%d', '%d', '%s' ) );
        }

        if ( ! $write_ok ) {
            return new WP_Error( 'follow_failed', 'Could not follow this Hub right now. Please try again.', array( 'status' => 500 ) );
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
