<?php
/**
 * Gamification system - points, badges, and passport.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Gamification {

    /**
     * Badge definitions with point thresholds and trigger conditions.
     */
    const BADGES = array(
        'first_steps' => array(
            'name'        => 'First Steps',
            'description' => 'Attended your first event.',
            'icon'        => 'dashicons-flag',
            'trigger'     => 'event_count',
            'threshold'   => 1,
        ),
        'regular' => array(
            'name'        => 'Regular',
            'description' => 'Attended 5 events.',
            'icon'        => 'dashicons-awards',
            'trigger'     => 'event_count',
            'threshold'   => 5,
        ),
        'culture_vulture' => array(
            'name'        => 'Culture Vulture',
            'description' => 'Attended 25 events.',
            'icon'        => 'dashicons-star-filled',
            'trigger'     => 'event_count',
            'threshold'   => 25,
        ),
        'explorer' => array(
            'name'        => 'Explorer',
            'description' => 'Attended events in 3 different cities.',
            'icon'        => 'dashicons-admin-site',
            'trigger'     => 'city_count',
            'threshold'   => 3,
        ),
        'globetrotter' => array(
            'name'        => 'Globetrotter',
            'description' => 'Attended events in 10 different cities.',
            'icon'        => 'dashicons-admin-site-alt3',
            'trigger'     => 'city_count',
            'threshold'   => 10,
        ),
        'commentator' => array(
            'name'        => 'Commentator',
            'description' => 'Left 10 comments on Moveee newsletters.',
            'icon'        => 'dashicons-format-chat',
            'trigger'     => 'comment_count',
            'threshold'   => 10,
        ),
        'century_club' => array(
            'name'        => 'Century Club',
            'description' => 'Earned 100 culture points.',
            'icon'        => 'dashicons-superhero',
            'trigger'     => 'points',
            'threshold'   => 100,
        ),
        'wordsmith' => array(
            'name'        => 'Wordsmith',
            'description' => 'Shared your first quote.',
            'icon'        => 'dashicons-editor-quote',
            'trigger'     => 'quote_count',
            'threshold'   => 1,
        ),
        'librarian' => array(
            'name'        => 'Librarian',
            'description' => 'Shared 10 quotes.',
            'icon'        => 'dashicons-book-alt',
            'trigger'     => 'quote_count',
            'threshold'   => 10,
        ),
        'philosopher' => array(
            'name'        => 'Philosopher',
            'description' => 'Shared 50 quotes.',
            'icon'        => 'dashicons-welcome-learn-more',
            'trigger'     => 'quote_count',
            'threshold'   => 50,
        ),
        'influencer' => array(
            'name'        => 'Influencer',
            'description' => 'Your quotes received 10 likes.',
            'icon'        => 'dashicons-thumbs-up',
            'trigger'     => 'quote_likes_count',
            'threshold'   => 10,
        ),
        'thought_leader' => array(
            'name'        => 'Thought Leader',
            'description' => 'Your quotes received 100 likes.',
            'icon'        => 'dashicons-megaphone',
            'trigger'     => 'quote_likes_count',
            'threshold'   => 100,
        ),
        // ── Culture Directory badges ─────────────────────────────────────
        'culture_archivist' => array(
            'name'        => 'Culture Archivist',
            'description' => 'Submitted your first Culture Directory entry.',
            'icon'        => 'dashicons-archive',
            'trigger'     => 'dir_entry_count',
            'threshold'   => 1,
        ),
        'knowledge_keeper' => array(
            'name'        => 'Knowledge Keeper',
            'description' => 'Submitted 5 Culture Directory entries.',
            'icon'        => 'dashicons-book-alt',
            'trigger'     => 'dir_entry_count',
            'threshold'   => 5,
        ),
        'cultural_encyclopaedist' => array(
            'name'        => 'Cultural Encyclopaedist',
            'description' => 'Submitted 20 Culture Directory entries.',
            'icon'        => 'dashicons-welcome-learn-more',
            'trigger'     => 'dir_entry_count',
            'threshold'   => 20,
        ),
        // ── Magazine & Engagement badges ─────────────────────────────────
        'cultural_specialist' => array(
            'name'        => 'Cultural Specialist',
            'description' => 'Left 10 total comments on articles.',
            'icon'        => 'dashicons-format-chat',
            'trigger'     => 'total_comment_count',
            'threshold'   => 10,
        ),
        'deep_diver' => array(
            'name'        => 'Deep Diver',
            'description' => 'Read 10 Magazine articles.',
            'icon'        => 'dashicons-visibility',
            'trigger'     => 'magazine_read_count',
            'threshold'   => 10,
        ),
        'culture_liaison' => array(
            'name'        => 'Culture Liaison',
            'description' => 'Shared 10 Magazine articles.',
            'icon'        => 'dashicons-share',
            'trigger'     => 'magazine_share_count',
            'threshold'   => 10,
        ),
        // ── Community contribution badges ────────────────────────────────
        'first_post' => array(
            'name'        => 'First Post',
            'description' => 'Made your first community post.',
            'icon'        => 'dashicons-edit',
            'trigger'     => 'community_post_count',
            'threshold'   => 1,
        ),
        'prolific_poster' => array(
            'name'        => 'Prolific Poster',
            'description' => 'Created 10 community posts.',
            'icon'        => 'dashicons-edit-large',
            'trigger'     => 'community_post_count',
            'threshold'   => 10,
        ),
        'century_scribe' => array(
            'name'        => 'Century Scribe',
            'description' => 'Created 50 community posts.',
            'icon'        => 'dashicons-superhero-alt',
            'trigger'     => 'community_post_count',
            'threshold'   => 50,
        ),
        'conversationalist' => array(
            'name'        => 'Conversationalist',
            'description' => 'Left 25 comments in the community.',
            'icon'        => 'dashicons-format-chat',
            'trigger'     => 'community_comment_count',
            'threshold'   => 25,
        ),
        // ── Template specialist badges ────────────────────────────────────
        'food_critic' => array(
            'name'        => 'Food Critic',
            'description' => 'Posted 10 food reviews.',
            'icon'        => 'dashicons-carrot',
            'trigger'     => 'food_review_count',
            'threshold'   => 10,
        ),
        'culture_guide' => array(
            'name'        => 'Culture Guide',
            'description' => 'Posted 5 cultural takes.',
            'icon'        => 'dashicons-lightbulb',
            'trigger'     => 'cultural_take_count',
            'threshold'   => 5,
        ),
        'itinerary_master' => array(
            'name'        => 'Itinerary Master',
            'description' => 'Created 3 travel itineraries.',
            'icon'        => 'dashicons-location-alt',
            'trigger'     => 'itinerary_count',
            'threshold'   => 3,
        ),
        'poll_champion' => array(
            'name'        => 'Poll Champion',
            'description' => 'Created 5 community polls.',
            'icon'        => 'dashicons-chart-bar',
            'trigger'     => 'poll_count',
            'threshold'   => 5,
        ),
        'gem_hunter' => array(
            'name'        => 'Gem Hunter',
            'description' => 'Shared 5 hidden gems.',
            'icon'        => 'dashicons-star-filled',
            'trigger'     => 'hidden_gem_count',
            'threshold'   => 5,
        ),
        // ── Social & referral badges ──────────────────────────────────────
        'connector' => array(
            'name'        => 'Connector',
            'description' => 'Successfully referred 3 new members.',
            'icon'        => 'dashicons-groups',
            'trigger'     => 'referral_count',
            'threshold'   => 3,
        ),
        'super_connector' => array(
            'name'        => 'Super Connector',
            'description' => 'Successfully referred 10 new members.',
            'icon'        => 'dashicons-networking',
            'trigger'     => 'referral_count',
            'threshold'   => 10,
        ),
        // ── Profile & onboarding badges ───────────────────────────────────
        'profile_complete' => array(
            'name'        => 'Profile Complete',
            'description' => 'Completed your Moveee Connect profile.',
            'icon'        => 'dashicons-id',
            'trigger'     => 'profile_completed',
            'threshold'   => 1,
        ),
        'directory_member' => array(
            'name'        => 'In the Directory',
            'description' => 'Opted into the Moveee Connect member directory.',
            'icon'        => 'dashicons-businessperson',
            'trigger'     => 'directory_opted_in',
            'threshold'   => 1,
        ),
        'newsletter_subscriber' => array(
            'name'        => 'Newsletter Subscriber',
            'description' => 'Subscribed to a Moveee newsletter.',
            'icon'        => 'dashicons-email-alt',
            'trigger'     => 'newsletter_subscribed',
            'threshold'   => 1,
        ),
        // ── Loyalty & tenure badges ───────────────────────────────────────
        'monthly_member' => array(
            'name'        => 'Monthly Member',
            'description' => 'Been a Moveee Connect member for 30 days.',
            'icon'        => 'dashicons-calendar-alt',
            'trigger'     => 'account_age_days',
            'threshold'   => 30,
        ),
        'veteran' => array(
            'name'        => 'Veteran',
            'description' => 'Been a Moveee Connect member for 180 days.',
            'icon'        => 'dashicons-awards',
            'trigger'     => 'account_age_days',
            'threshold'   => 180,
        ),
        'annual_advocate' => array(
            'name'        => 'Annual Advocate',
            'description' => 'Been a Moveee Connect member for a full year.',
            'icon'        => 'dashicons-star-half',
            'trigger'     => 'account_age_days',
            'threshold'   => 365,
        ),
        // ── Reputation milestone badges ───────────────────────────────────
        'rising_star' => array(
            'name'        => 'Rising Star',
            'description' => 'Earned 250 reputation.',
            'icon'        => 'dashicons-star-empty',
            'trigger'     => 'points',
            'threshold'   => 250,
        ),
        'culture_contributor_badge' => array(
            'name'        => 'Culture Contributor',
            'description' => 'Earned 500 reputation — officially a Culture Contributor.',
            'icon'        => 'dashicons-awards',
            'trigger'     => 'points',
            'threshold'   => 500,
        ),
        'taste_maker_badge' => array(
            'name'        => 'Taste Maker',
            'description' => 'Earned 2,500 reputation — reached Taste Maker tier.',
            'icon'        => 'dashicons-star-filled',
            'trigger'     => 'points',
            'threshold'   => 2500,
        ),
        'culture_authority_badge' => array(
            'name'        => 'Culture Authority',
            'description' => 'Earned 10,000 reputation — reached Culture Authority tier.',
            'icon'        => 'dashicons-superhero',
            'trigger'     => 'points',
            'threshold'   => 10000,
        ),
        'culture_icon_badge' => array(
            'name'        => 'Culture Icon',
            'description' => 'Earned 25,000 reputation and nominated by the community.',
            'icon'        => 'dashicons-superhero-alt',
            'trigger'     => 'points',
            'threshold'   => 25000,
        ),
    );

    /**
     * Default reputation values per action. These replace the old points system
     * — reputation is permanent and never spent.
     */
    // Reputation is earned only from quality/community signals (Option B).
    // Passive/low-effort actions (read, share, like, game, poll) give 0 rep —
    // they still earn credits. This makes tier progression meaningful.
    const POINTS = array(
        'event_rsvp'             => 5,
        'event_checkin'          => 20,
        'magazine_comment'       => 5,
        'newsletter_comment'     => 10,
        'newsletter_reaction'    => 0,   // passive — credits only
        'referral'               => 30,
        'quote_submission'       => 10,
        'quote_like'             => 0,   // passive — credits only
        'magazine_read'          => 0,   // passive — credits only
        'magazine_share'         => 0,   // passive — credits only
        'community_comment'      => 8,
        'community_like'         => 0,   // passive — credits only
        'directory_entry'        => 20,
        'game_completed'         => 0,   // passive — credits only
        'community_post'         => 10,
        'profile_completed'      => 15,
        'email_verified'         => 5,
        'directory_opt_in'       => 10,
        'newsletter_subscribed'  => 5,
        'poll_vote'              => 0,   // passive — credits only
    );

    /**
     * Small credit bonuses for non-post actions.
     * Post credits are earned only via validation threshold (see check_post_threshold).
     */
    const CREDIT_BONUSES = array(
        'event_rsvp'            => 1,
        'event_checkin'         => 3,
        'referral'              => 5,
        'magazine_comment'      => 2,
        'newsletter_comment'    => 1,
        'quote_submission'      => 1,
        'magazine_read'         => 1,
        'magazine_share'        => 2,
        'directory_entry'       => 3,
        'game_completed'        => 1,
        'community_post'        => 2,
        'profile_completed'     => 10,
        'email_verified'        => 2,
        'directory_opt_in'      => 2,
        'newsletter_subscribed' => 2,
    );

    const DAILY_CREDIT_CAP = 50;

    // Option A: Raised thresholds so tiers take real community standing to reach.
    // Option C: culture-icon at 25,000 is invite-only — rep alone does not unlock it.
    //           It requires _culture_icon_nominated = 1 user meta set by admins.
    const REPUTATION_TIERS = array(
        25000 => 'culture-icon',        // invite/nomination only
        10000 => 'culture-authority',
        2500  => 'taste-maker',
        500   => 'culture-contributor',
        0     => 'member',
    );

    /**
     * Get the credit bonus for an action, reading from DB with CREDIT_BONUSES as fallback.
     *
     * @param string $action Action slug.
     * @return int
     */
    public static function get_credit_bonus( $action ) {
        $defaults = self::CREDIT_BONUSES;
        $key      = 'culture_credits_' . $action;
        $saved    = get_option( $key, null );
        return $saved !== null ? (int) $saved : ( $defaults[ $action ] ?? 0 );
    }

    /**
     * Get the reputation value for an action, reading from DB with POINTS as fallback.
     *
     * @param string $action Action slug.
     * @return int
     */
    public static function get_reputation_value( $action ) {
        $defaults = self::POINTS;
        $key      = 'culture_rep_' . $action;
        $saved    = get_option( $key, null );
        return $saved !== null ? (int) $saved : ( $defaults[ $action ] ?? 0 );
    }

    /**
     * Get the configured daily credit cap, falling back to DAILY_CREDIT_CAP.
     *
     * @return int
     */
    public static function get_daily_cap( $user_id = 0 ) {
        $saved = get_option( 'culture_daily_credit_cap', null );
        if ( $saved !== null ) return (int) $saved;
        if ( $user_id ) {
            $tier = get_user_meta( (int) $user_id, '_culture_membership_tier', true );
            if ( 'patron' === $tier ) return 100;
        }
        return self::DAILY_CREDIT_CAP;
    }

    /**
     * Get the reputation threshold for a tier, reading from DB with hard-coded defaults.
     *
     * @param string $tier  One of: 'contributor', 'taste-maker', 'authority'.
     * @return int
     */
    public static function get_rep_tier_threshold( $tier ) {
        $defaults = array(
            'contributor' => 500,
            'taste-maker' => 2500,
            'authority'   => 10000,
            // culture-icon threshold is fixed — admin sets the nomination flag instead
        );
        $key   = 'culture_rep_tier_' . $tier;
        $saved = get_option( $key, null );
        return $saved !== null ? (int) $saved : ( $defaults[ $tier ] ?? 0 );
    }

    /**
     * Get reputation tier thresholds with values overridden by DB settings at runtime.
     * Use this instead of self::REPUTATION_TIERS wherever a live value is needed.
     *
     * @return array  Keyed by threshold (int) => tier slug (string), descending.
     */
    public static function get_reputation_tiers() {
        return array(
            25000 => 'culture-icon',    // nomination only — rep threshold not enforced here
            self::get_rep_tier_threshold( 'authority' )    => 'culture-authority',
            self::get_rep_tier_threshold( 'taste-maker' )  => 'taste-maker',
            self::get_rep_tier_threshold( 'contributor' )  => 'culture-contributor',
            0 => 'member',
        );
    }

    /**
     * Get point values, reading from options with const defaults as fallback.
     *
     * @return array
     */
    public static function get_point_values() {
        $values = array();
        foreach ( self::POINTS as $action => $default ) {
            if ( class_exists( 'Culture_Settings' ) ) {
                $values[ $action ] = Culture_Settings::get_points( $action );
            } else {
                $values[ $action ] = $default;
            }
        }
        return $values;
    }

    /**
     * Get point value for a single action.
     *
     * @param string $action
     * @return int
     */
    public static function get_point_value( $action ) {
        if ( class_exists( 'Culture_Settings' ) ) {
            $setting_value = Culture_Settings::get_points( $action );
            // Only use the setting if it is explicitly configured above 0.
            // If the admin left it at 0 (or it was never saved), fall back
            // to the hard-coded defaults so actions always reward points.
            if ( $setting_value > 0 ) {
                return $setting_value;
            }
        }
        return self::POINTS[ $action ] ?? 0;
    }

    public static function init() {
        // No hooks needed at init - methods are called directly by other components.
    }

    // ── Reputation ────────────────────────────────────────────────────────────

    /**
     * Award reputation to a user. Reputation never decreases or gets capped.
     * Also updates legacy _culture_points for backwards compatibility.
     */
    public static function award_reputation( $user_id, $amount, $source = '', $source_id = 0 ) {
        if ( $amount <= 0 ) return self::get_reputation( $user_id );

        $current  = self::get_reputation( $user_id );
        $new_total = $current + $amount;
        update_user_meta( $user_id, '_culture_reputation', $new_total );
        // Keep legacy field in sync so older code still works.
        update_user_meta( $user_id, '_culture_points', $new_total );

        self::ledger_add( $user_id, 'reputation', $amount, $source, $source_id );
        self::evaluate_badges( $user_id );
        do_action( 'culture_reputation_awarded', $user_id, $source, $amount, $new_total );

        return $new_total;
    }

    /**
     * Get a user's reputation score.
     * Falls back to _culture_points for users who existed before Phase 2.
     */
    public static function get_reputation( $user_id ) {
        $rep = get_user_meta( $user_id, '_culture_reputation', true );
        if ( $rep !== '' && $rep !== false ) return (int) $rep;
        // Migration: seed from legacy points on first access.
        $legacy = (int) get_user_meta( $user_id, '_culture_points', true );
        if ( $legacy > 0 ) {
            update_user_meta( $user_id, '_culture_reputation', $legacy );
        }
        return $legacy;
    }

    /**
     * Get the reputation tier string for a given reputation score.
     * culture-icon requires both 25,000 rep AND admin nomination flag.
     */
    public static function get_reputation_tier( $reputation, $user_id = 0 ) {
        foreach ( self::get_reputation_tiers() as $threshold => $tier ) {
            if ( $reputation >= $threshold ) {
                if ( 'culture-icon' === $tier ) {
                    // Only award culture-icon if admin has set the nomination flag.
                    if ( ! $user_id || ! get_user_meta( $user_id, '_culture_icon_nominated', true ) ) {
                        continue;
                    }
                }
                return $tier;
            }
        }
        return 'member';
    }

    // ── Credits ───────────────────────────────────────────────────────────────

    /**
     * Award spendable credits to a user, respecting the daily cap.
     * Returns the number of credits actually awarded (may be less than requested
     * if the daily cap is nearly reached).
     */
    public static function award_credits( $user_id, $amount, $source = '', $source_id = 0 ) {
        global $wpdb;
        if ( $amount <= 0 ) return 0;

        // Advisory mutex prevents concurrent award_credits calls for the same user
        // from racing past the daily-cap check (TOCTOU). Timeout: 3 seconds.
        $lock_name = 'culture_credits_' . (int) $user_id;
        $locked    = $wpdb->get_var( $wpdb->prepare( "SELECT GET_LOCK(%s, 3)", $lock_name ) );
        if ( ! $locked ) return 0; // Could not acquire lock — skip rather than double-award.

        try {
            // Reset daily counter if it's a new day.
            $reset_date = get_user_meta( $user_id, '_culture_credits_reset_date', true );
            $today      = gmdate( 'Y-m-d' );
            if ( $reset_date !== $today ) {
                update_user_meta( $user_id, '_culture_credits_earned_today', 0 );
                update_user_meta( $user_id, '_culture_credits_reset_date', $today );
            }

            $earned_today = (int) get_user_meta( $user_id, '_culture_credits_earned_today', true );
            $remaining    = self::get_daily_cap( $user_id ) - $earned_today;
            if ( $remaining <= 0 ) {
                $wpdb->get_var( $wpdb->prepare( "SELECT RELEASE_LOCK(%s)", $lock_name ) );
                return 0;
            }

            $actual    = min( $amount, $remaining );
            $current   = self::get_credits( $user_id );
            $new_total = $current + $actual;
            update_user_meta( $user_id, '_culture_credits', $new_total );
            update_user_meta( $user_id, '_culture_credits_earned_today', $earned_today + $actual );
        } finally {
            $wpdb->get_var( $wpdb->prepare( "SELECT RELEASE_LOCK(%s)", $lock_name ) );
        }

        self::ledger_add( $user_id, 'credit', $actual, $source, $source_id );
        do_action( 'culture_credits_awarded', $user_id, $source, $actual, $new_total );

        return $actual;
    }

    /** Deduct credits (for redemption). Returns new balance or false if insufficient. */
    public static function deduct_credits( $user_id, $amount, $source = '', $source_id = 0 ) {
        global $wpdb;

        $lock_name = 'culture_credits_' . (int) $user_id;
        $locked    = $wpdb->get_var( $wpdb->prepare( "SELECT GET_LOCK(%s, 3)", $lock_name ) );
        if ( ! $locked ) return false;

        try {
            $current = self::get_credits( $user_id );
            if ( $current < $amount ) return false;
            $new_total = $current - $amount;
            update_user_meta( $user_id, '_culture_credits', $new_total );
        } finally {
            $wpdb->get_var( $wpdb->prepare( "SELECT RELEASE_LOCK(%s)", $lock_name ) );
        }

        self::ledger_add( $user_id, 'credit', -$amount, $source, $source_id );
        return $new_total;
    }

    /** Get a user's spendable credit balance. */
    public static function get_credits( $user_id ) {
        return (int) get_user_meta( $user_id, '_culture_credits', true );
    }

    /** Get how many credits the user can still earn today. */
    public static function get_daily_credits_remaining( $user_id ) {
        $reset_date = get_user_meta( $user_id, '_culture_credits_reset_date', true );
        if ( $reset_date !== gmdate( 'Y-m-d' ) ) return self::get_daily_cap( $user_id );
        $earned = (int) get_user_meta( $user_id, '_culture_credits_earned_today', true );
        return max( 0, self::get_daily_cap( $user_id ) - $earned );
    }

    // ── Threshold (upvote-to-earn) ────────────────────────────────────────────

    /**
     * Check if a community post has crossed the validation threshold and award
     * credits + reputation to its author if so. Safe to call multiple times —
     * checks the ledger to avoid double-awarding.
     *
     * Threshold: 5+ total reactions OR 3+ unique commenters.
     *
     * Credit amounts vary by template type (stored as _template_type post meta).
     */
    public static function check_post_threshold( $post_id ) {
        $post = get_post( $post_id );
        if ( ! $post || 'culture_post' !== $post->post_type ) return;

        $author_id = (int) get_post_meta( $post_id, 'community_author_id', true );
        if ( ! $author_id ) {
            // Fall back to WP post author.
            $author_id = (int) $post->post_author;
        }
        if ( ! $author_id ) return;

        // Already paid out for this post?
        if ( self::ledger_has_entry( $author_id, 'post_validated', $post_id ) ) return;

        // Check reactions.
        $love  = (int) get_post_meta( $post_id, 'reaction_love', true );
        $fire  = (int) get_post_meta( $post_id, 'reaction_fire', true );
        $clap  = (int) get_post_meta( $post_id, 'reaction_clap', true );
        $total_reactions = $love + $fire + $clap;

        // Check unique commenters.
        global $wpdb;
        $unique_commenters = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->comments}
             WHERE comment_post_ID = %d AND user_id > 0 AND comment_approved = '1'",
            $post_id
        ) );

        if ( $total_reactions < 5 && $unique_commenters < 3 ) return;

        // Determine credit/reputation amount by template type.
        $template = get_post_meta( $post_id, '_template_type', true ) ?: 'post';
        $credit_amounts = array(
            'post'              => array( 'credits' => 10, 'reputation' => 5 ),  // overridable via culture_credits_post_validated_standard
            'hidden-gem'        => array( 'credits' => 20, 'reputation' => 10 ),
            'cultural-take'     => array( 'credits' => 12, 'reputation' => 8 ),
            'food-review'       => array( 'credits' => 15, 'reputation' => 10 ),
            'creative-showcase' => array( 'credits' => 12, 'reputation' => 8 ),
            'poll'              => array( 'credits' => 8,  'reputation' => 5 ),
            'itinerary'         => array( 'credits' => 20, 'reputation' => 15 ),
        );
        $amounts = $credit_amounts[ $template ] ?? $credit_amounts['post'];

        self::award_credits( $author_id, $amounts['credits'], 'post_validated', $post_id );
        self::award_reputation( $author_id, $amounts['reputation'], 'post_validated', $post_id );
        do_action( 'culture_post_validated', $post_id, $author_id );
    }

    // ── Ledger ────────────────────────────────────────────────────────────────

    /** Add a row to the credit ledger. */
    public static function ledger_add( $user_id, $type, $amount, $source, $source_id = 0 ) {
        global $wpdb;
        $wpdb->insert(
            $wpdb->prefix . 'culture_credit_ledger',
            array(
                'user_id'   => (int) $user_id,
                'type'      => sanitize_key( $type ),
                'amount'    => (int) $amount,
                'source'    => sanitize_key( $source ),
                'source_id' => (int) $source_id,
            ),
            array( '%d', '%s', '%d', '%s', '%d' )
        );
    }

    /** Check if an exact (user, source, source_id) entry already exists. */
    public static function ledger_has_entry( $user_id, $source, $source_id ) {
        global $wpdb;
        return (bool) $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}culture_credit_ledger
             WHERE user_id = %d AND source = %s AND source_id = %d LIMIT 1",
            (int) $user_id,
            sanitize_key( $source ),
            (int) $source_id
        ) );
    }

    // ── Legacy bridge ─────────────────────────────────────────────────────────

    /**
     * Award points to a user for an action.
     * Now maps to award_reputation() + a small credit bonus for eligible actions.
     * Kept for backwards compatibility — all existing callers continue to work.
     */
    public static function award_points( $user_id, $action, $custom_points = 0 ) {
        $rep_to_add = $custom_points > 0 ? $custom_points : self::get_point_value( $action );

        if ( $rep_to_add <= 0 ) {
            return self::get_reputation( $user_id );
        }

        $new_rep = self::award_reputation( $user_id, $rep_to_add, $action );

        // Award small credit bonus for eligible actions.
        $credit_bonus = self::get_credit_bonus( $action );
        if ( $credit_bonus > 0 ) {
            self::award_credits( $user_id, $credit_bonus, $action );
        }

        return $new_rep;
    }

    /**
     * Get a user's total points (now returns reputation for backwards compat).
     */
    public static function get_points( $user_id ) {
        return self::get_reputation( $user_id );
    }

    /**
     * Get a user's earned badges.
     *
     * @param int $user_id
     * @return array Array of badge slugs.
     */
    public static function get_badges( $user_id ) {
        $badges = get_user_meta( $user_id, '_culture_badges', true );
        return is_array( $badges ) ? $badges : array();
    }

    /**
     * Award a specific badge to a user.
     *
     * @param int    $user_id
     * @param string $badge_slug
     * @return bool Whether the badge was newly awarded.
     */
    public static function award_badge( $user_id, $badge_slug ) {
        if ( ! isset( self::BADGES[ $badge_slug ] ) ) {
            return false;
        }

        $badges = self::get_badges( $user_id );
        if ( in_array( $badge_slug, $badges, true ) ) {
            return false;
        }

        $badges[] = $badge_slug;
        update_user_meta( $user_id, '_culture_badges', $badges );

        do_action( 'culture_badge_awarded', $user_id, $badge_slug );

        return true;
    }

    /**
     * Evaluate all badges for a user based on current stats.
     *
     * @param int $user_id
     */
    public static function evaluate_badges( $user_id ) {
        // Rate-limit badge evaluation to once every 5 minutes per user.
        // Each points/reputation award previously triggered up to 35 DB queries here;
        // the transient gate collapses rapid-fire awards into a single evaluation window.
        $transient_key = 'culture_badge_eval_' . (int) $user_id;
        if ( get_transient( $transient_key ) ) {
            return;
        }
        set_transient( $transient_key, 1, 5 * MINUTE_IN_SECONDS );

        foreach ( self::BADGES as $slug => $badge ) {
            // Always start with the hard-coded const threshold.
            // Only use the admin setting if it has been explicitly saved above 0 —
            // an unconfigured (0) setting would make 0 >= 0 true for every badge.
            $threshold = $badge['threshold'];
            if ( class_exists( 'Culture_Settings' ) ) {
                $setting_threshold = Culture_Settings::get_badge_threshold( $slug );
                if ( $setting_threshold > 0 ) {
                    $threshold = $setting_threshold;
                }
            }
            $current_value = self::get_stat_for_trigger( $user_id, $badge['trigger'] );
            if ( $current_value >= $threshold ) {
                self::award_badge( $user_id, $slug );
            }
        }
    }

    /**
     * Get the current value for a badge trigger type.
     *
     * @param int    $user_id
     * @param string $trigger
     * @return int
     */
    public static function get_stat_for_trigger( $user_id, $trigger ) {
        global $wpdb;
        $table = $wpdb->prefix . 'culture_attendance';

        switch ( $trigger ) {
            case 'event_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND status = 'checked_in'",
                    $user_id
                ) );

            case 'city_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(DISTINCT pm.meta_value)
                     FROM {$table} a
                     INNER JOIN {$wpdb->postmeta} pm ON a.event_id = pm.post_id AND pm.meta_key = '_culture_event_city'
                     WHERE a.user_id = %d AND a.status = 'checked_in' AND pm.meta_value != ''",
                    $user_id
                ) );

            case 'comment_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*)
                     FROM {$wpdb->comments} c
                     INNER JOIN {$wpdb->posts} p ON c.comment_post_ID = p.ID
                     WHERE c.user_id = %d AND p.post_type = 'culture_newsletter' AND c.comment_approved = '1'",
                    $user_id
                ) );

            case 'points':
                return self::get_reputation( $user_id );
            
            case 'quote_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_author = %d AND post_type = 'culture_quote' AND post_status = 'publish'",
                    $user_id
                ) );

            case 'quote_likes_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT SUM(CAST(pm.meta_value AS UNSIGNED))
                     FROM {$wpdb->postmeta} pm
                     INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
                     WHERE p.post_author = %d AND p.post_type = 'culture_quote' AND pm.meta_key = '_quote_likes' AND p.post_status = 'publish'",
                    $user_id
                ) );

            case 'dir_entry_count':
                // Count both published and pending directory posts so the badge
                // fires immediately on submission, not only after admin approval.
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->posts}
                     WHERE post_author = %d
                       AND post_type = 'culture_directory'
                       AND post_status IN ('publish', 'pending')",
                    $user_id
                ) );

            case 'total_comment_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*)
                     FROM {$wpdb->comments}
                     WHERE user_id = %d AND comment_approved = '1'",
                    $user_id
                ) );

            case 'magazine_read_count':
                return (int) get_user_meta( $user_id, '_magazine_read_count', true );

            case 'magazine_share_count':
                return (int) get_user_meta( $user_id, '_magazine_share_count', true );

            // Community post counts — queries culture_post by community_author_id meta
            case 'community_post_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm
                     INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
                     WHERE pm.meta_key = 'community_author_id' AND pm.meta_value = %d
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'",
                    $user_id
                ) );

            case 'community_comment_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->comments} c
                     INNER JOIN {$wpdb->posts} p ON c.comment_post_ID = p.ID
                     WHERE c.user_id = %d AND p.post_type = 'culture_post' AND c.comment_approved = '1'",
                    $user_id
                ) );

            // Template-specific community post counts
            case 'food_review_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
                     INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
                     INNER JOIN {$wpdb->posts} p ON pm1.post_id = p.ID
                     WHERE pm1.meta_key = 'community_author_id' AND pm1.meta_value = %d
                       AND pm2.meta_key = '_template_type' AND pm2.meta_value = 'food-review'
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'",
                    $user_id
                ) );

            case 'cultural_take_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
                     INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
                     INNER JOIN {$wpdb->posts} p ON pm1.post_id = p.ID
                     WHERE pm1.meta_key = 'community_author_id' AND pm1.meta_value = %d
                       AND pm2.meta_key = '_template_type' AND pm2.meta_value = 'cultural-take'
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'",
                    $user_id
                ) );

            case 'itinerary_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
                     INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
                     INNER JOIN {$wpdb->posts} p ON pm1.post_id = p.ID
                     WHERE pm1.meta_key = 'community_author_id' AND pm1.meta_value = %d
                       AND pm2.meta_key = '_template_type' AND pm2.meta_value = 'itinerary'
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'",
                    $user_id
                ) );

            case 'poll_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
                     INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
                     INNER JOIN {$wpdb->posts} p ON pm1.post_id = p.ID
                     WHERE pm1.meta_key = 'community_author_id' AND pm1.meta_value = %d
                       AND pm2.meta_key = '_template_type' AND pm2.meta_value = 'poll'
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'",
                    $user_id
                ) );

            case 'hidden_gem_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->postmeta} pm1
                     INNER JOIN {$wpdb->postmeta} pm2 ON pm1.post_id = pm2.post_id
                     INNER JOIN {$wpdb->posts} p ON pm1.post_id = p.ID
                     WHERE pm1.meta_key = 'community_author_id' AND pm1.meta_value = %d
                       AND pm2.meta_key = '_template_type' AND pm2.meta_value = 'hidden-gem'
                       AND p.post_type = 'culture_post' AND p.post_status = 'publish'",
                    $user_id
                ) );

            // Referral count
            case 'referral_count':
                return class_exists( 'Culture_Referrals' )
                    ? (int) Culture_Referrals::get_referral_count( $user_id )
                    : 0;

            // One-time flags stored as user meta (0 or 1)
            case 'profile_completed':
                return (int) get_user_meta( $user_id, '_culture_profile_completed', true );

            case 'directory_opted_in':
                return (int) get_user_meta( $user_id, '_culture_directory_opt_in', true );

            case 'newsletter_subscribed':
                return (int) get_user_meta( $user_id, '_culture_newsletter_subscribed_badge', true );

            // Account age in full days since registration
            case 'account_age_days':
                $user = get_userdata( $user_id );
                if ( ! $user ) return 0;
                $registered = strtotime( $user->user_registered );
                return (int) floor( ( time() - $registered ) / DAY_IN_SECONDS );

            default:
                return 0;
        }
    }

    /**
     * Get all badge definitions.
     *
     * @return array
     */
    public static function get_all_badges() {
        return self::BADGES;
    }

    /**
     * Get badge info with user's earned status.
     *
     * @param int $user_id
     * @return array
     */
    public static function get_badges_with_status( $user_id ) {
        $earned = self::get_badges( $user_id );
        $result = array();

        foreach ( self::BADGES as $slug => $badge ) {
            $result[ $slug ] = array_merge( $badge, array(
                'earned' => in_array( $slug, $earned, true ),
            ) );
        }

        return $result;
    }
}
