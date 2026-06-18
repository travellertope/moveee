<?php
/**
 * Plugin activator - handles DB table creation, role setup, and cleanup.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Activator {

    /**
     * Run on plugin activation.
     */
    public static function activate() {
        self::create_tables();
        self::create_roles();
        Culture_Cron::schedule();
        // Taxonomy must be registered before we can insert terms.
        if ( class_exists( 'Culture_Post_Types' ) ) {
            Culture_Post_Types::register_post_types();
            Culture_Post_Types::register_taxonomies();
        }
        self::seed_access_levels();
        self::seed_dir_types();
        self::seed_interests();
        flush_rewrite_rules();
    }

    /**
     * Run on plugin deactivation.
     */
    public static function deactivate() {
        Culture_Cron::unschedule();
        flush_rewrite_rules();
    }

    /**
     * Create all custom DB tables.
     */
    public static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // Attendance table.
        $table_name = $wpdb->prefix . 'culture_attendance';
        dbDelta( "CREATE TABLE {$table_name} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            event_id bigint(20) NOT NULL,
            status varchar(20) DEFAULT 'checked_in',
            checkin_time datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_event (user_id, event_id)
        ) {$charset_collate};" );

        // Event RSVP table.
        Culture_Event_RSVP::create_table();

        // Paid ticket sales table.
        Culture_Ticket_Payment::create_table();

        // Newsletter analytics tables.
        Culture_NL_Analytics::create_tables();

        // Credit ledger table.
        $ledger_table = $wpdb->prefix . 'culture_credit_ledger';
        dbDelta( "CREATE TABLE {$ledger_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            type varchar(20) NOT NULL DEFAULT 'reputation',
            amount int(11) NOT NULL DEFAULT 0,
            source varchar(50) NOT NULL DEFAULT '',
            source_id bigint(20) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_source (user_id, source, source_id),
            KEY user_created (user_id, created_at)
        ) {$charset_collate};" );

        // Partner perks table.
        $perks_table = $wpdb->prefix . 'culture_partner_perks';
        dbDelta( "CREATE TABLE {$perks_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            partner_directory_id bigint(20) NOT NULL DEFAULT 0,
            partner_vendor_id bigint(20) NOT NULL DEFAULT 0,
            title varchar(200) NOT NULL DEFAULT '',
            description text NOT NULL,
            credit_cost int(11) NOT NULL DEFAULT 0,
            min_spend int(11) NOT NULL DEFAULT 0,
            min_spend_currency varchar(3) NOT NULL DEFAULT 'GBP',
            expiry_days int(11) NOT NULL DEFAULT 14,
            max_per_user int(11) NOT NULL DEFAULT 0,
            max_total int(11) NOT NULL DEFAULT 0,
            redeemed_count int(11) NOT NULL DEFAULT 0,
            status varchar(10) NOT NULL DEFAULT 'active',
            min_rep_tier varchar(30) NOT NULL DEFAULT 'member',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY partner_dir (partner_directory_id),
            KEY status_idx (status)
        ) {$charset_collate};" );

        // Redemptions table (perks + cashouts).
        $redemptions_table = $wpdb->prefix . 'culture_redemptions';
        dbDelta( "CREATE TABLE {$redemptions_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            perk_id bigint(20) NOT NULL DEFAULT 0,
            type varchar(10) NOT NULL DEFAULT 'perk',
            credits_spent int(11) NOT NULL DEFAULT 0,
            fee_credits int(11) NOT NULL DEFAULT 0,
            qr_token varchar(64) NOT NULL DEFAULT '',
            qr_scanned tinyint(1) NOT NULL DEFAULT 0,
            status varchar(10) NOT NULL DEFAULT 'active',
            expires_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            approved_at datetime DEFAULT NULL,
            approved_by bigint(20) NOT NULL DEFAULT 0,
            cashout_amount int(11) NOT NULL DEFAULT 0,
            cashout_currency varchar(3) NOT NULL DEFAULT 'GBP',
            cashout_method varchar(50) NOT NULL DEFAULT '',
            cashout_account_name varchar(200) NOT NULL DEFAULT '',
            cashout_account_ref varchar(500) NOT NULL DEFAULT '',
            expiry_notified tinyint(1) NOT NULL DEFAULT 0,
            PRIMARY KEY  (id),
            KEY user_idx (user_id),
            KEY perk_idx (perk_id),
            KEY status_type (status, type),
            KEY qr_token_idx (qr_token)
        ) {$charset_collate};" );

        // Notifications table.
        $notif_table = $wpdb->prefix . 'culture_notifications';
        dbDelta( "CREATE TABLE {$notif_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            type varchar(50) NOT NULL DEFAULT 'system',
            title varchar(200) NOT NULL DEFAULT '',
            body text NOT NULL,
            action_url varchar(500) NOT NULL DEFAULT '',
            meta text NOT NULL DEFAULT '{}',
            read_at datetime DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_unread (user_id, read_at),
            KEY user_created (user_id, created_at)
        ) {$charset_collate};" );

        // Passkeys table.
        $passkeys_table = $wpdb->prefix . 'culture_passkeys';
        dbDelta( "CREATE TABLE {$passkeys_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            credential_id varchar(512) NOT NULL DEFAULT '',
            public_key text NOT NULL,
            alg int(11) NOT NULL DEFAULT -7,
            sign_count int(11) NOT NULL DEFAULT 0,
            device_name varchar(100) NOT NULL DEFAULT 'My Device',
            aaguid varchar(36) NOT NULL DEFAULT '',
            transports varchar(200) NOT NULL DEFAULT '[]',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            last_used_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY credential_id (credential_id),
            KEY user_idx (user_id)
        ) {$charset_collate};" );

        // Game history table — records every completed Trivia / Who Said It play.
        $game_history_table = $wpdb->prefix . 'culture_game_history';
        dbDelta( "CREATE TABLE {$game_history_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            game_type varchar(20) NOT NULL DEFAULT '',
            score int(11) NOT NULL DEFAULT 0,
            max_score int(11) NOT NULL DEFAULT 0,
            credits_earned int(11) NOT NULL DEFAULT 0,
            played_date date NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_created (user_id, created_at),
            KEY user_game_date (user_id, game_type, played_date)
        ) {$charset_collate};" );

        // Follows table.
        $follows_table = $wpdb->prefix . 'culture_follows';
        dbDelta( "CREATE TABLE {$follows_table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            follower_id bigint(20) NOT NULL,
            followed_id bigint(20) NOT NULL,
            notify_posts tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY follower_followed (follower_id, followed_id),
            KEY followed_idx (followed_id)
        ) {$charset_collate};" );

        update_option( 'culture_db_version', CULTURE_VERSION );

        // ── Badge threshold migration (v2.0+) ────────────────────────────────
        // Old defaults: taste_maker_badge=500, culture_authority_badge=1500.
        // New defaults match REPUTATION_TIERS: 2500 and 10000 respectively.
        // Delete stale DB values so get_badge_threshold() falls back to the
        // updated BADGES constant defaults.
        $stale_badge_resets = array(
            'culture_badge_taste_maker_badge'       => array( 500, 1500 ),
            'culture_badge_culture_authority_badge' => array( 500, 1500 ),
        );
        foreach ( $stale_badge_resets as $option_key => $old_values ) {
            $current = (int) get_option( $option_key, 0 );
            if ( in_array( $current, $old_values, true ) ) {
                delete_option( $option_key );
            }
        }
    }

    /**
     * Seed the two default culture_access taxonomy terms.
     *
     * Safe to call multiple times — skips any term that already exists.
     */
    public static function seed_access_levels() {
        if ( ! taxonomy_exists( 'culture_access' ) ) {
            return;
        }

        $terms = array(
            'member-only' => __( 'Member Only', 'culture-community' ),
            'patron-only' => __( 'Patron Only', 'culture-community' ),
        );

        foreach ( $terms as $slug => $name ) {
            if ( ! term_exists( $slug, 'culture_access' ) ) {
                wp_insert_term( $name, 'culture_access', array( 'slug' => $slug ) );
            }
        }
    }

    /**
     * Seed the eight default culture_dir_type taxonomy terms.
     *
     * Safe to call multiple times — skips terms that already exist.
     */
    public static function seed_dir_types() {
        if ( ! taxonomy_exists( 'culture_dir_type' ) ) {
            return;
        }

        $terms = array(
            'person'      => __( 'Person', 'culture-community' ),
            'place'       => __( 'Place', 'culture-community' ),
            'movement'    => __( 'Movement', 'culture-community' ),
            'genre'       => __( 'Genre', 'culture-community' ),
            'concept'     => __( 'Concept', 'culture-community' ),
            'artwork'     => __( 'Artwork', 'culture-community' ),
            'food'        => __( 'Food & Drink', 'culture-community' ),
            'fashion'     => __( 'Fashion', 'culture-community' ),
            'album'       => __( 'Album', 'culture-community' ),
            'restaurant'  => __( 'Restaurant', 'culture-community' ),
            'event-venue' => __( 'Event Venue', 'culture-community' ),
            'recipe'      => __( 'Recipe', 'culture-community' ),
        );

        foreach ( $terms as $slug => $name ) {
            if ( ! term_exists( $slug, 'culture_dir_type' ) ) {
                wp_insert_term( $name, 'culture_dir_type', array( 'slug' => $slug ) );
            }
        }
    }

    /**
     * Seed the canonical culture_interest taxonomy terms.
     *
     * These terms must exist before events, newsletters, or directory entries
     * can be tagged with them (term_exists() guards block orphan term creation).
     * Safe to call multiple times — skips terms that already exist.
     */
    public static function seed_interests() {
        if ( ! taxonomy_exists( 'culture_interest' ) ) {
            return;
        }

        $terms = array(
            'fashion-streetwear' => 'Fashion & Streetwear',
            'food-drink'         => 'Specialty Coffee & Dining',
            'street-food'        => 'Street Food & Markets',
            'nightlife'          => 'Nightlife & Bars',
            'live-music'         => 'Live Music',
            'music-production'   => 'Music Production',
            'independent-film'   => 'Independent Film',
            'visual-art'         => 'Visual Art',
            'architecture'       => 'Architecture',
            'photography'        => 'Photography',
            'literature'         => 'Literature & Poetry',
            'visual-design'      => 'Visual Design',
            'tech-culture'       => 'Tech & Digital Culture',
            'sport-wellness'     => 'Sport & Wellness',
            'travel'             => 'Travel & Exploration',
            'ideas'              => 'Ideas & Culture Theory',
            // Event-specific categories used by the member submission form.
            'event-performance'  => 'Performance',
            'event-community'    => 'Community',
        );

        foreach ( $terms as $slug => $name ) {
            if ( ! term_exists( $slug, 'culture_interest' ) ) {
                wp_insert_term( $name, 'culture_interest', array( 'slug' => $slug ) );
            }
        }
    }

    /**
     * Create the Chapter Leader role with specific capabilities.
     */
    public static function create_roles() {
        // Remove existing role first to update capabilities cleanly.
        remove_role( 'chapter_leader' );

        add_role( 'chapter_leader', __( 'Chapter Leader', 'culture-community' ), array(
            'read'                     => true,
            'edit_posts'               => true,
            'upload_files'             => true,
            'culture_manage_events'    => true,
            'culture_scan_qr'          => true,
            'culture_manage_chapter'   => true,
            'culture_view_attendance'  => true,
        ) );

        // Grant admins the culture capabilities.
        $admin_role = get_role( 'administrator' );
        if ( $admin_role ) {
            $admin_role->add_cap( 'culture_manage_events' );
            $admin_role->add_cap( 'culture_scan_qr' );
            $admin_role->add_cap( 'culture_manage_chapter' );
            $admin_role->add_cap( 'culture_view_attendance' );
        }
    }
}
