<?php
/**
 * Directory-entry follows — a member following a culture_directory catalog
 * entry (a Person or a Place, so far — gated client-side per entry type, see
 * DirectoryDetailScreen.tsx) rather than another member's account.
 *
 * Deliberately a separate relationship from Culture_Follows, which is
 * member-to-member (real WP user IDs on both sides). A directory entry is
 * not necessarily a Moveee account at all — most Person entries are
 * catalogued public figures with no login — so there is no "account" on the
 * followed side to reuse that table for.
 *
 * Storage: a small dedicated table (not usermeta — a member can follow many
 * entries, and a lookup needs to run in both directions: "does X follow this
 * entry" and "who follows this entry", the same shape Culture_Follows already
 * needed a real table for).
 *
 * Notification trigger: any new culture_post that gets `_linked_directory_id`
 * set to a followed entry — this covers every composer template that can
 * link to a directory entry (Hidden Gem/Place, Book/Film/Music Review, Food
 * Review, Cultural Take, etc.), on both the mobile PHP submit path and the
 * web submit route (which writes postmeta via native WP REST, bypassing the
 * PHP handler entirely) — see on_directory_link_added(), hooked on core's
 * own `added_post_meta` action rather than called from either submit
 * handler directly, so a future third write path is covered automatically
 * too. Fires once, only when the link is first created (add, not update) and
 * only if the post is already published — a post that starts pending/draft
 * and is published later does not retroactively notify (known v1 limitation,
 * not wired to a status-transition hook).
 */
class Culture_Directory_Follows {

	public static function init() {
		// Not add_post_meta itself — added_post_meta only fires once, the
		// first time a given (post, key) pair is written, which is exactly
		// "a post just got linked to this entry," not "the link changed."
		add_action( 'added_post_meta', array( __CLASS__, 'on_directory_link_added' ), 10, 4 );
	}

	public static function table() : string {
		global $wpdb;
		return $wpdb->prefix . 'culture_directory_follows';
	}

	public static function create_table() {
		global $wpdb;
		$charset_collate = $wpdb->get_charset_collate();
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$table = self::table();
		dbDelta( "CREATE TABLE {$table} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			user_id bigint(20) NOT NULL,
			directory_id bigint(20) NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			UNIQUE KEY user_directory (user_id, directory_id),
			KEY directory_idx (directory_id)
		) {$charset_collate};" );
	}

	/* ——————————————————————————————————————
	 *  Core writes
	 * —————————————————————————————————————— */

	/**
	 * @return bool|WP_Error
	 */
	public static function follow( int $user_id, int $directory_id ) {
		$post = get_post( $directory_id );
		if ( ! $post || 'culture_directory' !== $post->post_type || 'publish' !== $post->post_status ) {
			return new WP_Error( 'invalid_entry', 'This entry could not be found.', array( 'status' => 400 ) );
		}
		if ( self::is_following( $user_id, $directory_id ) ) {
			return true;
		}
		global $wpdb;
		$inserted = $wpdb->insert(
			self::table(),
			array(
				'user_id'      => $user_id,
				'directory_id' => $directory_id,
				'created_at'   => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%s' )
		);
		return (bool) $inserted;
	}

	public static function unfollow( int $user_id, int $directory_id ) : bool {
		global $wpdb;
		$deleted = $wpdb->delete(
			self::table(),
			array( 'user_id' => $user_id, 'directory_id' => $directory_id ),
			array( '%d', '%d' )
		);
		return (bool) $deleted;
	}

	/* ——————————————————————————————————————
	 *  Core reads
	 * —————————————————————————————————————— */

	public static function is_following( int $user_id, int $directory_id ) : bool {
		global $wpdb;
		$row = $wpdb->get_var( $wpdb->prepare(
			"SELECT id FROM " . self::table() . " WHERE user_id = %d AND directory_id = %d",
			$user_id, $directory_id
		) );
		return (bool) $row;
	}

	public static function followers_count( int $directory_id ) : int {
		global $wpdb;
		return (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT COUNT(*) FROM " . self::table() . " WHERE directory_id = %d",
			$directory_id
		) );
	}

	public static function get_follower_ids( int $directory_id ) : array {
		global $wpdb;
		$rows = $wpdb->get_col( $wpdb->prepare(
			"SELECT user_id FROM " . self::table() . " WHERE directory_id = %d",
			$directory_id
		) );
		return array_map( 'intval', $rows ?: array() );
	}

	/**
	 * @return array{isFollowing: bool, followersCount: int}
	 */
	public static function get_status( int $user_id, int $directory_id ) : array {
		return array(
			'isFollowing'    => $user_id > 0 && self::is_following( $user_id, $directory_id ),
			'followersCount' => self::followers_count( $directory_id ),
		);
	}

	/* ——————————————————————————————————————
	 *  Notification hook
	 * —————————————————————————————————————— */

	public static function on_directory_link_added( $meta_id, $object_id, $meta_key, $meta_value ) {
		if ( '_linked_directory_id' !== $meta_key ) {
			return;
		}
		$directory_id = (int) $meta_value;
		if ( $directory_id <= 0 || 'publish' !== get_post_status( $object_id ) ) {
			return;
		}

		$follower_ids = self::get_follower_ids( $directory_id );
		if ( empty( $follower_ids ) ) {
			return;
		}

		$directory_post = get_post( $directory_id );
		$entry_title    = $directory_post ? $directory_post->post_title : 'this entry';
		$post           = get_post( $object_id );
		$post_author_id = $post ? (int) $post->post_author : 0;
		$excerpt        = $post ? wp_trim_words( $post->post_content, 12, '…' ) : '';

		// Directory-entry followings are expected to be small (nowhere near
		// a popular member's follower count), so a direct loop is enough —
		// no batching/cron overflow like Culture_Follows::notify_followers_of_post()
		// needs for member-to-member follows.
		foreach ( $follower_ids as $follower_id ) {
			if ( $follower_id === $post_author_id ) {
				continue; // don't notify someone about their own post
			}
			Culture_Notifications::add(
				$follower_id,
				'directory_new_post',
				"New post about {$entry_title}",
				$excerpt ?: 'Someone just posted about this.',
				'/directory/' . ( $directory_post ? $directory_post->post_name : '' ),
				array( 'directory_id' => $directory_id, 'post_id' => $object_id )
			);
		}
	}
}
