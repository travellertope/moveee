<?php
/**
 * Follow system — members following other members.
 */
class Culture_Follows {

    public static function init() {
        add_action( 'culture_new_follower', array( 'Culture_Notifications', 'on_new_follower' ), 10, 2 );
    }

    /* ——————————————————————————————————————
     *  Core writes
     * —————————————————————————————————————— */

    public static function follow( int $follower_id, int $followed_id, bool $notify_posts = false ) : bool {
        if ( $follower_id === $followed_id || $follower_id <= 0 || $followed_id <= 0 ) {
            return false;
        }
        global $wpdb;
        $table = $wpdb->prefix . 'culture_follows';

        if ( self::is_following( $follower_id, $followed_id ) ) {
            // Already following — just update the notify flag.
            $wpdb->update(
                $table,
                array( 'notify_posts' => $notify_posts ? 1 : 0 ),
                array( 'follower_id' => $follower_id, 'followed_id' => $followed_id ),
                array( '%d' ), array( '%d', '%d' )
            );
            return true;
        }

        $inserted = $wpdb->insert(
            $table,
            array(
                'follower_id'  => $follower_id,
                'followed_id'  => $followed_id,
                'notify_posts' => $notify_posts ? 1 : 0,
                'created_at'   => current_time( 'mysql' ),
            ),
            array( '%d', '%d', '%d', '%s' )
        );

        if ( $inserted ) {
            do_action( 'culture_new_follower', $followed_id, $follower_id );
        }

        return (bool) $inserted;
    }

    public static function unfollow( int $follower_id, int $followed_id ) : bool {
        global $wpdb;
        $deleted = $wpdb->delete(
            $wpdb->prefix . 'culture_follows',
            array( 'follower_id' => $follower_id, 'followed_id' => $followed_id ),
            array( '%d', '%d' )
        );
        return (bool) $deleted;
    }

    public static function set_notify( int $follower_id, int $followed_id, bool $notify_posts ) : bool {
        global $wpdb;
        $updated = $wpdb->update(
            $wpdb->prefix . 'culture_follows',
            array( 'notify_posts' => $notify_posts ? 1 : 0 ),
            array( 'follower_id' => $follower_id, 'followed_id' => $followed_id ),
            array( '%d' ), array( '%d', '%d' )
        );
        return false !== $updated;
    }

    /* ——————————————————————————————————————
     *  Core reads
     * —————————————————————————————————————— */

    public static function is_following( int $follower_id, int $followed_id ) : bool {
        global $wpdb;
        $row = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}culture_follows WHERE follower_id = %d AND followed_id = %d",
            $follower_id, $followed_id
        ) );
        return (bool) $row;
    }

    public static function followers_count( int $user_id ) : int {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}culture_follows WHERE followed_id = %d",
            $user_id
        ) );
    }

    public static function following_count( int $user_id ) : int {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}culture_follows WHERE follower_id = %d",
            $user_id
        ) );
    }

    public static function get_followers( int $user_id, int $limit = 50, int $offset = 0 ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT follower_id, created_at FROM {$wpdb->prefix}culture_follows
             WHERE followed_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $user_id, $limit, $offset
        ), ARRAY_A );
        return $rows ?: [];
    }

    public static function get_following( int $user_id, int $limit = 50, int $offset = 0 ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT followed_id, notify_posts, created_at FROM {$wpdb->prefix}culture_follows
             WHERE follower_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $user_id, $limit, $offset
        ), ARRAY_A );
        return $rows ?: [];
    }

    /**
     * Usernames of accounts $user_id follows — used by the frontend feed-ranking
     * boost (matches against community post author usernames, since FeedItem
     * carries usernames rather than numeric author IDs on the web side).
     */
    public static function get_following_usernames( int $user_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_col( $wpdb->prepare(
            "SELECT u.user_login FROM {$wpdb->prefix}culture_follows f
             INNER JOIN {$wpdb->users} u ON u.ID = f.followed_id
             WHERE f.follower_id = %d",
            $user_id
        ) );
        return $rows ?: [];
    }

    /**
     * Get the user IDs of followers who opted in to post notifications for $author_id.
     */
    public static function get_post_notify_follower_ids( int $author_id ) : array {
        global $wpdb;
        $rows = $wpdb->get_col( $wpdb->prepare(
            "SELECT follower_id FROM {$wpdb->prefix}culture_follows
             WHERE followed_id = %d AND notify_posts = 1",
            $author_id
        ) );
        return array_map( 'intval', $rows ?: [] );
    }

    /**
     * Notify opted-in followers that $author_id published a new post.
     */
    public static function notify_followers_of_post( int $author_id, int $post_id ) : void {
        $follower_ids = self::get_post_notify_follower_ids( $author_id );
        if ( empty( $follower_ids ) ) return;

        $author   = get_userdata( $author_id );
        $name     = $author ? $author->display_name : 'Someone you follow';
        $post     = get_post( $post_id );
        $excerpt  = $post ? wp_trim_words( $post->post_title ?: $post->post_content, 8, '…' ) : '';

        foreach ( $follower_ids as $follower_id ) {
            Culture_Notifications::add(
                $follower_id,
                'new_follower_post',
                "{$name} just posted",
                $excerpt ? "\"{$excerpt}\"" : 'Check out their latest post.',
                '/connect/' . ( $author ? $author->user_login : '' ) . '#community',
                array( 'author_id' => $author_id, 'post_id' => $post_id )
            );
        }
    }
}
