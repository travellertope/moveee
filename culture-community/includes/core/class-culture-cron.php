<?php
/**
 * Scheduled jobs for Culture Community.
 *
 * This class is the canonical owner for the five jobs below — automation runs
 * via WordPress cron, triggered by a real server cron on Lightsail every 30
 * minutes (see wp-config.php: DISABLE_WP_CRON = true). These same five jobs
 * must NOT also be scheduled on cron-job.org (the external scheduler used for
 * jobs that have no WP-side logic) — running both would double-fire the seed
 * with mismatched frequencies. See "Split cron ownership" in CLAUDE.md.
 *
 * Jobs:
 *  - Grace period check (daily) — downgrades lapsed Patron accounts.
 *  - Directory seed (weekly)    — triggers Next.js /api/directory/auto-populate.
 *  - Pulse refresh (daily)      — triggers Next.js /api/pulse/refresh.
 *  - Events seed (daily)        — triggers Next.js /api/events/auto-seed.
 *  - Quotes seed (weekly)       — triggers Next.js /api/quotes/auto-populate.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Cron {

    // ── Hook names ────────────────────────────────────────────────────────

    const HOOK_GRACE_CHECK      = 'culture_check_grace_periods';
    const HOOK_SEED_DIRECTORY   = 'culture_seed_directory';
    const HOOK_REFRESH_PULSE    = 'culture_refresh_pulse';
    const HOOK_SEED_EVENTS      = 'culture_seed_events';
    const HOOK_SEED_QUOTES      = 'culture_seed_quotes';

    /** Default grace period in days. */
    const GRACE_PERIOD_DAYS = 7;

    // ── Bootstrap ─────────────────────────────────────────────────────────

    public static function init() {
        add_filter( 'cron_schedules',      array( __CLASS__, 'add_schedules' ) );
        add_action( self::HOOK_GRACE_CHECK,    array( __CLASS__, 'process_grace_periods' ) );
        add_action( self::HOOK_SEED_DIRECTORY, array( __CLASS__, 'seed_directory' ) );
        add_action( self::HOOK_REFRESH_PULSE,  array( __CLASS__, 'refresh_pulse' ) );
        add_action( self::HOOK_SEED_EVENTS,    array( __CLASS__, 'seed_events' ) );
        add_action( self::HOOK_SEED_QUOTES,    array( __CLASS__, 'seed_quotes' ) );

        // Deferred gamification: newsletter subscribe fires this instead of calling
        // award_points() synchronously inside the public unauthenticated endpoint.
        add_action( 'culture_award_newsletter_points', function( $user_id ) {
            if ( class_exists( 'Culture_Gamification' ) ) {
                Culture_Gamification::award_points( (int) $user_id, 'newsletter_subscribed' );
            }
        } );

        // Self-heal: schedule any jobs that are missing without requiring re-activation.
        // Runs on admin_init (not init) so REST/GraphQL requests are not affected,
        // and only once per hour via transient to avoid 7 wp_next_scheduled() calls
        // on every admin page load.
        add_action( 'admin_init', array( __CLASS__, 'maybe_schedule' ), 99 );
    }

    /**
     * Register custom cron intervals that WordPress doesn't include by default.
     */
    public static function add_schedules( $schedules ) {
        if ( ! isset( $schedules['thirtyminutes'] ) ) {
            $schedules['thirtyminutes'] = array(
                'interval' => 30 * MINUTE_IN_SECONDS,
                'display'  => __( 'Every 30 Minutes', 'culture-community' ),
            );
        }
        if ( ! isset( $schedules['weekly'] ) ) {
            $schedules['weekly'] = array(
                'interval' => 7 * DAY_IN_SECONDS,
                'display'  => __( 'Once a Week', 'culture-community' ),
            );
        }
        return $schedules;
    }

    // ── Schedule / Unschedule ─────────────────────────────────────────────

    /**
     * Self-heal wrapper: only runs the schedule check once per hour.
     */
    public static function maybe_schedule() {
        if ( get_transient( 'culture_cron_scheduled' ) ) {
            return;
        }
        set_transient( 'culture_cron_scheduled', 1, HOUR_IN_SECONDS );
        self::schedule();
    }

    /**
     * Register all recurring events. Called on plugin activation and by maybe_schedule().
     */
    public static function schedule() {
        $jobs = array(
            self::HOOK_GRACE_CHECK      => 'daily',
            self::HOOK_SEED_DIRECTORY   => 'weekly',
            self::HOOK_REFRESH_PULSE    => 'daily',
            self::HOOK_SEED_EVENTS      => 'daily',
            self::HOOK_SEED_QUOTES      => 'weekly',
            'culture_check_perk_expiry' => 'hourly',
        );

        foreach ( $jobs as $hook => $recurrence ) {
            if ( ! wp_next_scheduled( $hook ) ) {
                wp_schedule_event( time(), $recurrence, $hook );
            }
        }
    }

    /**
     * Remove all recurring events. Called on plugin deactivation.
     */
    public static function unschedule() {
        $hooks = array(
            self::HOOK_GRACE_CHECK,
            self::HOOK_SEED_DIRECTORY,
            self::HOOK_REFRESH_PULSE,
            self::HOOK_SEED_EVENTS,
            self::HOOK_SEED_QUOTES,
            'culture_check_perk_expiry',
        );

        foreach ( $hooks as $hook ) {
            $timestamp = wp_next_scheduled( $hook );
            if ( $timestamp ) {
                wp_unschedule_event( $timestamp, $hook );
            }
        }
    }

    // ── Job handlers ──────────────────────────────────────────────────────

    /**
     * Downgrade Patron users whose grace period has expired,
     * and also expire any manually-set subscriptions past their expiry date.
     */
    public static function process_grace_periods() {

        // ── 1. Grace-period expiry (payment gateway lapsed subscribers) ──────
        $days   = class_exists( 'Culture_Settings' )
            ? (int) Culture_Settings::get( 'culture_grace_period_days' )
            : self::GRACE_PERIOD_DAYS;
        $cutoff = gmdate( 'Y-m-d H:i:s', strtotime( '-' . $days . ' days' ) );

        $grace_users = get_users( array(
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

        foreach ( $grace_users as $user_id ) {
            update_user_meta( $user_id, '_culture_membership_tier',     'citizen' );
            update_user_meta( $user_id, '_culture_subscription_status', 'expired' );
            delete_user_meta( $user_id, '_culture_grace_period_start' );
            do_action( 'culture_grace_period_expired', $user_id );
        }

        // ── 2. Manual expiry (admin-set expiry date has passed) ──────────────
        $now = time();

        $manual_users = get_users( array(
            'meta_query' => array(
                'relation' => 'AND',
                array(
                    'key'   => '_culture_membership_tier',
                    'value' => 'patron',
                ),
                array(
                    'key'     => '_culture_subscription_expiry',
                    'value'   => 0,
                    'compare' => '>',       // only users with a real expiry date set
                    'type'    => 'NUMERIC',
                ),
                array(
                    'key'     => '_culture_subscription_expiry',
                    'value'   => $now,
                    'compare' => '<',       // expiry timestamp is in the past
                    'type'    => 'NUMERIC',
                ),
                array(
                    'key'     => '_culture_subscription_status',
                    'value'   => 'expired',
                    'compare' => '!=',      // skip already-expired rows
                ),
            ),
            'fields' => 'ID',
        ) );

        foreach ( $manual_users as $user_id ) {
            update_user_meta( $user_id, '_culture_membership_tier',     'citizen' );
            update_user_meta( $user_id, '_culture_subscription_status', 'expired' );
            do_action( 'culture_manual_subscription_expired', $user_id );
        }
    }

    /**
     * Trigger the Culture Directory AI seeder on Next.js.
     * Runs weekly. Sends a small batch to stay within Vercel execution limits.
     */
    public static function seed_directory() {
        self::call_nextjs( '/api/directory/auto-populate', array(
            'batchSize'      => 3,
            'generateImages' => true,
        ) );
    }

    /**
     * Trigger the Pulse story refresh on Next.js.
     * Runs daily.
     */
    public static function refresh_pulse() {
        self::call_nextjs( '/api/pulse/refresh' );
    }

    /**
     * Trigger the Events seeder on Next.js.
     * Runs daily.
     */
    public static function seed_events() {
        self::call_nextjs( '/api/events/auto-seed', array( 'citiesPerRun' => 3 ) );
    }

    /**
     * Trigger the Quotes seeder on Next.js.
     * Runs weekly.
     */
    public static function seed_quotes() {
        self::call_nextjs( '/api/quotes/auto-populate' );
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * POST to a Next.js API endpoint using the stored cron secret for auth.
     *
     * @param string $path  API path, e.g. '/api/pulse/refresh'.
     * @param array  $body  Optional JSON body parameters.
     */
    private static function call_nextjs( $path, $body = array() ) {
        $frontend_url = rtrim( Culture_Settings::get( 'culture_frontend_url' ), '/' );
        $cron_secret  = Culture_Settings::get( 'culture_cron_secret' );

        if ( empty( $frontend_url ) || empty( $cron_secret ) ) {
            error_log( '[Culture Cron] ' . $path . ' — Frontend URL or Cron Secret not set in Culture Community → Settings → General.' );
            return;
        }

        $url      = $frontend_url . $path;
        $response = wp_remote_post( $url, array(
            'timeout'     => 60, // generous; Vercel Hobby caps at 10s but won't hang WP
            'blocking'    => false, // fire-and-forget; WP doesn't need the response
            'headers'     => array(
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $cron_secret,
            ),
            'body'        => wp_json_encode( $body ),
        ) );

        // blocking=false means $response is always true, but log if misconfigured.
        if ( is_wp_error( $response ) ) {
            error_log( '[Culture Cron] ' . $path . ' error: ' . $response->get_error_message() );
        } else {
            error_log( '[Culture Cron] Fired ' . $path );
        }
    }

    // ── Legacy accessor (used by Culture_Settings UI) ─────────────────────

    public static function get_grace_period_days() {
        return class_exists( 'Culture_Settings' )
            ? (int) Culture_Settings::get( 'culture_grace_period_days' )
            : self::GRACE_PERIOD_DAYS;
    }
}
