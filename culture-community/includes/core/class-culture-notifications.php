<?php
/**
 * In-app notification system for The Moveee.
 * Fires on credit awards, badge unlocks, comments, cashout approvals, etc.
 */
class Culture_Notifications {

    /* ——————————————————————————————————————
     *  Notification types
     * —————————————————————————————————————— */

    const TYPES = array(
        'credit_earned'     => 'Credits Earned',
        'badge_unlocked'    => 'Badge Unlocked',
        'perk_expiring'     => 'Perk Expiring Soon',
        'perk_redeemed'     => 'Perk Redeemed',
        'cashout_approved'  => 'Cash Out Approved',
        'cashout_rejected'  => 'Cash Out Rejected',
        'escrow_released'   => 'Credits Released',
        'comment_received'  => 'New Comment',
        'post_validated'    => 'Post Reached Threshold',
        'system'            => 'System',
        'referral_received' => 'Friend Joined',
        'mention'           => 'You were mentioned',
        'new_follower'      => 'New Follower',
        'new_follower_post' => 'New Post From Someone You Follow',
        'event_rsvp'        => 'Event RSVP',
        'cluster_activated'        => 'House Fellowship Activated',
        'cluster_forming_expired'  => 'House Fellowship Did Not Activate',
        'cluster_new_host'         => 'New Host',
        'cluster_election_started' => 'Host Election Started',
        'cluster_checkin_reminder' => 'House Fellowship Meeting Today',
    );

    /* ——————————————————————————————————————
     *  Bootstrap
     * —————————————————————————————————————— */

    public static function init() {
        add_action( 'culture_credits_awarded',    array( __CLASS__, 'on_credits_awarded'  ), 10, 4 );
        add_action( 'culture_badge_awarded',      array( __CLASS__, 'on_badge_awarded'    ), 10, 2 );
        add_action( 'wp_insert_comment',          array( __CLASS__, 'on_new_comment'      ), 10, 2 );
        add_action( 'culture_cashout_approved',   array( __CLASS__, 'on_cashout_approved' ), 10, 2 );
        add_action( 'culture_cashout_rejected',   array( __CLASS__, 'on_cashout_rejected' ), 10, 2 );
        add_action( 'culture_escrow_released',    array( __CLASS__, 'on_escrow_released'  ), 10, 2 );
        add_action( 'culture_post_validated',     array( __CLASS__, 'on_post_validated'   ), 10, 2 );
        add_action( 'culture_referral_completed', array( __CLASS__, 'on_referral_completed' ), 10, 2 );
        // Perk-expiry check via WP Cron (hourly). Scheduling is handled in
        // Culture_Activator::activate() — not here — to avoid a DB lookup on every request.
        add_action( 'culture_check_perk_expiry',  array( __CLASS__, 'check_perk_expiry'  ) );
    }

    /* ——————————————————————————————————————
     *  Per-type preferences
     * —————————————————————————————————————— */

    // Always delivered regardless of preference — not shown in the prefs UI.
    const ALWAYS_ON_TYPES = array( 'system' );

    /**
     * Returns a complete type => bool map, merging stored prefs over
     * defaults (everything on) so newly-added types are enabled by default
     * without needing a migration.
     */
    public static function get_prefs( int $user_id ) : array {
        $defaults = array_fill_keys( array_keys( self::TYPES ), true );
        $stored   = json_decode( (string) get_user_meta( $user_id, '_culture_notification_prefs', true ), true );
        if ( ! is_array( $stored ) ) {
            $stored = array();
        }
        return array_merge( $defaults, array_intersect_key( $stored, $defaults ) );
    }

    public static function set_prefs( int $user_id, array $prefs ) : array {
        $current = self::get_prefs( $user_id );
        foreach ( $prefs as $type => $enabled ) {
            if ( array_key_exists( $type, $current ) && ! in_array( $type, self::ALWAYS_ON_TYPES, true ) ) {
                $current[ $type ] = (bool) $enabled;
            }
        }
        update_user_meta( $user_id, '_culture_notification_prefs', wp_json_encode( $current ) );
        return $current;
    }

    public static function is_enabled( int $user_id, string $type ) : bool {
        if ( in_array( $type, self::ALWAYS_ON_TYPES, true ) ) {
            return true;
        }
        $prefs = self::get_prefs( $user_id );
        return $prefs[ $type ] ?? true;
    }

    /* ——————————————————————————————————————
     *  Core write
     * —————————————————————————————————————— */

    public static function add(
        int    $user_id,
        string $type,
        string $title,
        string $body,
        string $action_url = '',
        array  $meta       = []
    ) : int {
        if ( ! self::is_enabled( $user_id, $type ) ) {
            return 0;
        }
        global $wpdb;
        $wpdb->insert(
            $wpdb->prefix . 'culture_notifications',
            array(
                'user_id'    => $user_id,
                'type'       => sanitize_key( $type ),
                'title'      => sanitize_text_field( $title ),
                'body'       => sanitize_textarea_field( $body ),
                'action_url' => esc_url_raw( $action_url ),
                'meta'       => wp_json_encode( $meta ),
                'created_at' => current_time( 'mysql' ),
            ),
            array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
        );
        $id = (int) $wpdb->insert_id;

        // Deliver a push notification to the user's registered mobile devices.
        Culture_Push::send( $user_id, $title, $body, $action_url );

        return $id;
    }

    /* ——————————————————————————————————————
     *  Core reads
     * —————————————————————————————————————— */

    public static function get_for_user( int $user_id, int $limit = 30, int $offset = 0 ) : array {
        global $wpdb;
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}culture_notifications
             WHERE user_id = %d
             ORDER BY created_at DESC
             LIMIT %d OFFSET %d",
            $user_id, $limit, $offset
        ), ARRAY_A );
        return $rows ?: [];
    }

    public static function count_unread( int $user_id ) : int {
        global $wpdb;
        return (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}culture_notifications
             WHERE user_id = %d AND read_at IS NULL",
            $user_id
        ) );
    }

    public static function mark_read( int $user_id, int $notification_id ) : void {
        global $wpdb;
        $wpdb->update(
            $wpdb->prefix . 'culture_notifications',
            array( 'read_at' => current_time('mysql') ),
            array( 'id' => $notification_id, 'user_id' => $user_id ),
            array( '%s' ), array( '%d', '%d' )
        );
    }

    public static function mark_all_read( int $user_id ) : void {
        global $wpdb;
        $wpdb->query( $wpdb->prepare(
            "UPDATE {$wpdb->prefix}culture_notifications
             SET read_at = %s WHERE user_id = %d AND read_at IS NULL",
            current_time('mysql'), $user_id
        ) );
    }

    /* ——————————————————————————————————————
     *  Event hooks
     * —————————————————————————————————————— */

    public static function on_credits_awarded( int $user_id, string $source, int $amount, int $new_total ) : void {
        // Only notify for meaningful sources, not tiny poll votes etc.
        $notify_sources = array( 'post_validated', 'escrow_release', 'perk_redeem_rollback', 'cashout_refund', 'directory_opt_in', 'profile_completed', 'email_verified' );
        if ( ! in_array( $source, $notify_sources, true ) ) return;

        $labels = array(
            'post_validated'       => 'Your post was validated',
            'escrow_release'       => 'Escrowed credits released',
            'perk_redeem_rollback' => 'Perk refund',
            'cashout_refund'       => 'Cash-out refund',
            'directory_opt_in'     => 'Directory opt-in bonus',
            'profile_completed'    => 'Profile completed bonus',
            'email_verified'       => 'Email verified bonus',
        );
        $label = $labels[ $source ] ?? ucfirst( str_replace('_', ' ', $source) );
        self::add(
            $user_id,
            'credit_earned',
            "+{$amount} Credits",
            "{$label}. Balance: {$new_total} credits.",
            '/member/wallet',
            array( 'amount' => $amount, 'source' => $source )
        );
    }

    public static function on_badge_awarded( int $user_id, string $badge_slug ) : void {
        $badges = class_exists('Culture_Gamification') ? Culture_Gamification::BADGES : array();
        $badge  = $badges[ $badge_slug ] ?? array();
        $name   = $badge['name'] ?? ucfirst( str_replace('_', ' ', $badge_slug) );
        $emoji  = $badge['emoji'] ?? '🏅';
        self::add(
            $user_id,
            'badge_unlocked',
            "Badge Unlocked: {$name}",
            "{$emoji} You earned the {$name} badge.",
            '/connect/' . get_userdata( $user_id )->user_login . '#badges',
            array( 'badge_slug' => $badge_slug )
        );
    }

    public static function on_new_comment( int $comment_id, $comment ) : void {
        if ( 'comment' !== $comment->comment_type && '' !== $comment->comment_type ) return;

        $post = get_post( $comment->comment_post_ID );
        if ( ! $post || 'culture_post' !== $post->post_type ) return;

        // Get the community post author.
        $author_id = (int) get_post_meta( $post->ID, 'community_author_id', true );
        if ( ! $author_id ) return;

        // Don't notify the author if they commented on their own post.
        if ( (int) $comment->user_id === $author_id ) return;

        $commenter = get_userdata( $comment->user_id );
        $commenter_name = $commenter ? $commenter->display_name : 'Someone';
        $excerpt = wp_trim_words( $post->post_title ?: $post->post_content, 8, '…' );

        self::add(
            $author_id,
            'comment_received',
            "{$commenter_name} commented on your post",
            "\"{$excerpt}\"",
            '/connect/pulse#post-' . $post->ID,
            array( 'comment_id' => $comment_id, 'post_id' => $post->ID )
        );
    }

    public static function on_cashout_approved( int $user_id, int $redemption_id ) : void {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT cashout_amount, cashout_currency FROM {$wpdb->prefix}culture_redemptions WHERE id = %d",
            $redemption_id
        ), ARRAY_A );
        $amount   = $row ? number_format( (float) $row['cashout_amount'] / 100, 2 ) : '—';
        $currency = $row['cashout_currency'] ?? 'GBP';
        self::add(
            $user_id,
            'cashout_approved',
            'Cash Out Approved',
            "Your cash-out of {$currency} {$amount} has been approved and will be transferred within 2 business days.",
            '/member/wallet',
            array( 'redemption_id' => $redemption_id )
        );
    }

    public static function on_cashout_rejected( int $user_id, int $redemption_id ) : void {
        self::add(
            $user_id,
            'cashout_rejected',
            'Cash Out Returned',
            'Your cash-out request was not approved. Your credits have been returned to your balance.',
            '/member/wallet',
            array( 'redemption_id' => $redemption_id )
        );
    }

    public static function on_escrow_released( int $user_id, int $amount ) : void {
        self::add(
            $user_id,
            'escrow_released',
            "{$amount} Credits Released",
            "Your escrowed credits are now available in your wallet after setting up a passkey.",
            '/member/wallet',
            array( 'amount' => $amount )
        );
    }

    public static function on_post_validated( int $post_id, int $author_id ) : void {
        $post    = get_post( $post_id );
        $excerpt = $post ? wp_trim_words( $post->post_title ?: $post->post_content, 8, '…' ) : 'your post';
        self::add(
            $author_id,
            'post_validated',
            'Your post is gaining traction!',
            "\"{$excerpt}\" has reached the engagement threshold — credits on their way.",
            '/member/wallet',
            array( 'post_id' => $post_id )
        );
    }

    public static function on_referral_completed( int $referrer_id, int $new_user_id ) {
        $new_user = get_userdata( $new_user_id );
        if ( ! $new_user ) return;
        $display = $new_user->display_name ?: $new_user->user_login;
        $points  = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::POINTS['referral'] ?? 30 : 30;
        $credits = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::CREDIT_BONUSES['referral'] ?? 5 : 5;
        self::add(
            $referrer_id,
            'referral_received',
            '🎉 ' . $display . ' joined via your link!',
            "You earned +{$points} points and +{$credits} credits. Keep sharing — Connector badge at 3 referrals.",
            '/member/referrals',
            array( 'new_user_id' => $new_user_id, 'points' => $points, 'credits' => $credits )
        );
    }

    public static function on_new_follower( int $followed_id, int $follower_id ) : void {
        $follower = get_userdata( $follower_id );
        if ( ! $follower ) return;
        $name = $follower->display_name ?: $follower->user_login;
        self::add(
            $followed_id,
            'new_follower',
            "{$name} started following you",
            'Tap to view their profile.',
            '/connect/' . $follower->user_login,
            array( 'follower_id' => $follower_id )
        );
    }

    /* ——————————————————————————————————————
     *  Perk-expiry cron check
     * —————————————————————————————————————— */

    public static function check_perk_expiry() : void {
        global $wpdb;
        // Find active perks expiring in the next 48 hours that haven't been notified.
        $rows = $wpdb->get_results(
            "SELECT id, user_id, expires_at FROM {$wpdb->prefix}culture_redemptions
             WHERE type = 'perk' AND status = 'active'
             AND expires_at IS NOT NULL
             AND expires_at > NOW()
             AND expires_at < DATE_ADD(NOW(), INTERVAL 48 HOUR)
             AND expiry_notified = 0",
            ARRAY_A
        );
        foreach ( $rows as $row ) {
            $days = max( 1, (int) ceil( ( strtotime( $row['expires_at'] ) - time() ) / 86400 ) );
            self::add(
                (int) $row['user_id'],
                'perk_expiring',
                'Your perk expires soon!',
                "A perk in your wallet expires in {$days} day" . ( $days > 1 ? 's' : '' ) . ". Use it before it's gone.",
                '/member/coupons',
                array( 'redemption_id' => $row['id'] )
            );
            $wpdb->update(
                $wpdb->prefix . 'culture_redemptions',
                array( 'expiry_notified' => 1 ),
                array( 'id' => (int) $row['id'] ),
                array( '%d' ), array( '%d' )
            );
        }
    }

    /* ——————————————————————————————————————
     *  Housekeeping — trim old notifications
     * —————————————————————————————————————— */

    public static function prune_old( int $user_id, int $keep = 50 ) : void {
        global $wpdb;
        $oldest_to_keep = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}culture_notifications
             WHERE user_id = %d ORDER BY created_at DESC LIMIT 1 OFFSET %d",
            $user_id, $keep - 1
        ) );
        if ( $oldest_to_keep ) {
            $wpdb->query( $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}culture_notifications
                 WHERE user_id = %d AND id < %d",
                $user_id, (int) $oldest_to_keep
            ) );
        }
    }
}
