<?php
/**
 * Cron jobs for scheduled tasks.
 *
 * - Grace period expiry: downgrades Patron users to Citizen after
 *   7 days of failed payment (non-renewing status).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Cron {

    /** Default grace period duration in days. */
    const GRACE_PERIOD_DAYS = 7;

    /**
     * Get the configured grace period in days.
     *
     * @return int
     */
    public static function get_grace_period_days() {
        return class_exists( 'Culture_Settings' ) ? (int) Culture_Settings::get( 'culture_grace_period_days' ) : self::GRACE_PERIOD_DAYS;
    }

    /** Cron hook name. */
    const HOOK_GRACE_CHECK = 'culture_check_grace_periods';

    public static function init() {
        add_action( self::HOOK_GRACE_CHECK, array( __CLASS__, 'process_grace_periods' ) );
    }

    /**
     * Schedule the cron event on plugin activation.
     */
    public static function schedule() {
        if ( ! wp_next_scheduled( self::HOOK_GRACE_CHECK ) ) {
            wp_schedule_event( time(), 'daily', self::HOOK_GRACE_CHECK );
        }
    }

    /**
     * Clear the cron event on plugin deactivation.
     */
    public static function unschedule() {
        $timestamp = wp_next_scheduled( self::HOOK_GRACE_CHECK );
        if ( $timestamp ) {
            wp_unschedule_event( $timestamp, self::HOOK_GRACE_CHECK );
        }
    }

    /**
     * Process users in the grace period.
     *
     * Finds users with '_culture_subscription_status' = 'non-renewing'
     * and '_culture_grace_period_start' older than GRACE_PERIOD_DAYS.
     * Downgrades them to Citizen and removes secondary chapter.
     */
    public static function process_grace_periods() {
        $cutoff = gmdate( 'Y-m-d H:i:s', strtotime( '-' . self::get_grace_period_days() . ' days' ) );

        $users = get_users( array(
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key'   => '_culture_subscription_status',
                    'value' => 'non-renewing',
                ),
                array(
                    'key'     => '_culture_grace_period_start',
                    'value'   => $cutoff,
                    'compare' => '<=',
                    'type'    => 'DATETIME',
                ),
            ),
            'fields' => 'ID',
        ) );

        foreach ( $users as $user_id ) {
            // Downgrade to Citizen.
            update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
            update_user_meta( $user_id, '_culture_subscription_status', 'expired' );

            // Remove secondary chapter access.
            delete_user_meta( $user_id, '_culture_secondary_chapter_id' );

            // Clean up grace period flag.
            delete_user_meta( $user_id, '_culture_grace_period_start' );

            do_action( 'culture_grace_period_expired', $user_id );
        }
    }
}
