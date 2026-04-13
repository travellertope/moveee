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
            'description' => 'Attended events in 3 different chapters.',
            'icon'        => 'dashicons-admin-site',
            'trigger'     => 'chapter_count',
            'threshold'   => 3,
        ),
        'globetrotter' => array(
            'name'        => 'Globetrotter',
            'description' => 'Attended events in 10 different chapters.',
            'icon'        => 'dashicons-admin-site-alt3',
            'trigger'     => 'chapter_count',
            'threshold'   => 10,
        ),
        'commentator' => array(
            'name'        => 'Commentator',
            'description' => 'Left 10 comments on The Cultural Digest.',
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
    );

    /**
     * Default point values for actions (used as fallback if options not set).
     */
    const POINTS = array(
        'event_rsvp'          => 5,
        'event_checkin'       => 15,
        'newsletter_comment'  => 10,
        'newsletter_reaction' => 2,
        'referral'            => 25,
        'quote_submission'    => 10,
        'quote_like'          => 1,
    );

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
            return Culture_Settings::get_points( $action );
        }
        return self::POINTS[ $action ] ?? 0;
    }

    public static function init() {
        // No hooks needed at init - methods are called directly by other components.
    }

    /**
     * Award points to a user for an action.
     *
     * @param int    $user_id The user ID.
     * @param string $action  The action key from self::POINTS.
     * @param int    $custom_points Optional override for point value.
     * @return int New total points.
     */
    public static function award_points( $user_id, $action, $custom_points = 0 ) {
        $points_to_add = $custom_points > 0 ? $custom_points : self::get_point_value( $action );

        if ( $points_to_add <= 0 ) {
            return self::get_points( $user_id );
        }

        $current = self::get_points( $user_id );
        $new_total = $current + $points_to_add;
        update_user_meta( $user_id, '_culture_points', $new_total );

        // Check for point-based badges after awarding.
        self::evaluate_badges( $user_id );

        do_action( 'culture_points_awarded', $user_id, $action, $points_to_add, $new_total );

        return $new_total;
    }

    /**
     * Get a user's total points.
     *
     * @param int $user_id
     * @return int
     */
    public static function get_points( $user_id ) {
        return (int) get_user_meta( $user_id, '_culture_points', true );
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
        foreach ( self::BADGES as $slug => $badge ) {
            $threshold = class_exists( 'Culture_Settings' ) ? Culture_Settings::get_badge_threshold( $slug ) : $badge['threshold'];
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

            case 'chapter_count':
                return (int) $wpdb->get_var( $wpdb->prepare(
                    "SELECT COUNT(DISTINCT pm.meta_value)
                     FROM {$table} a
                     INNER JOIN {$wpdb->postmeta} pm ON a.event_id = pm.post_id AND pm.meta_key = '_culture_chapter_id'
                     WHERE a.user_id = %d AND a.status = 'checked_in'",
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
                return self::get_points( $user_id );

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
