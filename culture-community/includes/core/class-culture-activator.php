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

        update_option( 'culture_db_version', CULTURE_VERSION );
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
            'person'   => __( 'Person', 'culture-community' ),
            'place'    => __( 'Place', 'culture-community' ),
            'movement' => __( 'Movement', 'culture-community' ),
            'genre'    => __( 'Genre', 'culture-community' ),
            'concept'  => __( 'Concept', 'culture-community' ),
            'artwork'  => __( 'Artwork', 'culture-community' ),
            'food'     => __( 'Food & Drink', 'culture-community' ),
            'fashion'  => __( 'Fashion', 'culture-community' ),
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
