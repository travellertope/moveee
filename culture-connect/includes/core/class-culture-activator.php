<?php

/**
 * Fired during plugin activation
 */
class Culture_Activator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate() {
		self::create_tables();
		self::add_roles();
		
		// Flush rewrite rules for CPTs
		flush_rewrite_rules();
	}

	/**
	 * Create custom database tables.
	 */
	private static function create_tables() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'culture_attendance';
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE $table_name (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			user_id bigint(20) NOT NULL,
			event_id bigint(20) NOT NULL,
			status varchar(20) DEFAULT 'checked_in',
			checkin_time datetime DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY user_event (user_id, event_id)
		) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql );
	}

	/**
	 * Add custom user roles
	 */
	private static function add_roles() {
		add_role(
			'chapter_leader',
			__( 'Chapter Leader' ),
			array(
				'read'         => true, 
				'edit_posts'   => false,
			)
		);
	}

}
