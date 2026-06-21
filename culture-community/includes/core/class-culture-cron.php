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
 *  - House Fellowship cluster forming-expiry sweep (daily) — pure WP-side
 *    logic, archives 'forming' clusters past their window (no Next.js call).
 *  - House Fellowship host service award (monthly) — Phase 4 — awards
 *    'cluster_host_served' once per active cluster's host per month.
 *  - House Fellowship check-in reminder (daily) — Phase 4 — notifies all
 *    active members of clusters meeting today.
 *  - Literati Connect attendance sweep (daily) — Phase 5 — awards
 *    'literati_connect_attended' once per event per confirmed RSVP attendee,
 *    for literati-flagged culture_event posts that ended in the last 48h.
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
    const HOOK_CLUSTER_SWEEP           = 'culture_check_cluster_forming_expiry';
    const HOOK_CLUSTER_ELECTION_TALLY  = 'culture_check_cluster_elections';
    const HOOK_CLUSTER_GRACE_SWEEP     = 'culture_check_cluster_host_vacancy_grace';
    const HOOK_CLUSTER_HOST_SERVICE    = 'culture_award_cluster_host_service';
    const HOOK_CLUSTER_CHECKIN_REMINDER = 'culture_send_cluster_checkin_reminders';
    const HOOK_LITERATI_ATTENDANCE      = 'culture_sweep_literati_attendance';

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
        add_action( self::HOOK_CLUSTER_SWEEP,  array( __CLASS__, 'sweep_forming_clusters' ) );
        add_action( self::HOOK_CLUSTER_ELECTION_TALLY, array( __CLASS__, 'tally_cluster_elections' ) );
        add_action( self::HOOK_CLUSTER_GRACE_SWEEP,    array( __CLASS__, 'sweep_cluster_host_vacancy' ) );
        add_action( self::HOOK_CLUSTER_HOST_SERVICE,   array( __CLASS__, 'award_cluster_host_service' ) );
        add_action( self::HOOK_CLUSTER_CHECKIN_REMINDER, array( __CLASS__, 'send_cluster_checkin_reminders' ) );
        add_action( self::HOOK_LITERATI_ATTENDANCE,      array( __CLASS__, 'sweep_literati_attendance' ) );

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
        if ( ! isset( $schedules['monthly'] ) ) {
            $schedules['monthly'] = array(
                'interval' => 30 * DAY_IN_SECONDS,
                'display'  => __( 'Once a Month', 'culture-community' ),
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
            'culture_check_perk_expiry'        => 'hourly',
            self::HOOK_CLUSTER_SWEEP           => 'daily',
            self::HOOK_CLUSTER_ELECTION_TALLY  => 'daily',
            self::HOOK_CLUSTER_GRACE_SWEEP     => 'daily',
            self::HOOK_CLUSTER_HOST_SERVICE      => 'monthly',
            self::HOOK_CLUSTER_CHECKIN_REMINDER  => 'daily',
            self::HOOK_LITERATI_ATTENDANCE       => 'daily',
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
            self::HOOK_CLUSTER_SWEEP,
            self::HOOK_CLUSTER_ELECTION_TALLY,
            self::HOOK_CLUSTER_GRACE_SWEEP,
            self::HOOK_CLUSTER_HOST_SERVICE,
            self::HOOK_CLUSTER_CHECKIN_REMINDER,
            self::HOOK_LITERATI_ATTENDANCE,
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

    /**
     * Archive House Fellowship clusters still 'forming' past their window
     * (default 30 days — see Culture_Clusters::forming_window_days()),
     * notifying the founder with a CTA to merge into a nearby active
     * cluster instead. Runs daily.
     */
    public static function sweep_forming_clusters() {
        if ( ! class_exists( 'Culture_Clusters' ) ) {
            return;
        }

        $window_days = Culture_Clusters::forming_window_days();
        $cutoff      = gmdate( 'Y-m-d H:i:s', strtotime( '-' . $window_days . ' days' ) );

        $stale_ids = get_posts( array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'   => '_cluster_status',
                    'value' => Culture_Clusters::STATUS_FORMING,
                ),
                array(
                    'key'     => '_cluster_created_at',
                    'value'   => $cutoff,
                    'compare' => '<=',
                    'type'    => 'DATETIME',
                ),
            ),
        ) );

        foreach ( $stale_ids as $cluster_id ) {
            update_post_meta( $cluster_id, '_cluster_status', 'archived' );

            $founder_id = (int) get_post_meta( $cluster_id, '_cluster_founder_id', true );
            if ( $founder_id && class_exists( 'Culture_Notifications' ) ) {
                Culture_Notifications::add(
                    $founder_id,
                    'cluster_forming_expired',
                    'Your House Fellowship didn\'t reach activation',
                    get_post_meta( $cluster_id, '_cluster_name', true ) . ' didn\'t reach enough members in time. Try joining a nearby House Fellowship instead.',
                    '/connect/people',
                    array( 'cluster_id' => $cluster_id, 'archived' => true )
                );
            }
        }
    }

    /**
     * Tally any House Fellowship host election whose voting window has
     * closed. Runs daily. Pure WP-side logic, no Next.js call.
     */
    public static function tally_cluster_elections() {
        if ( ! class_exists( 'Culture_Clusters' ) ) {
            return;
        }

        $now = gmdate( 'Y-m-d H:i:s' );

        $expired_ids = get_posts( array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'     => '_cluster_election_open_until',
                    'value'   => $now,
                    'compare' => '<=',
                    'type'    => 'DATETIME',
                ),
            ),
        ) );

        foreach ( $expired_ids as $cluster_id ) {
            Culture_Clusters::tally_election( $cluster_id );
        }
    }

    /**
     * Archive 'active' House Fellowships that have had zero members for
     * longer than the 14-day grace period. The grace-period start is read
     * from the departed host's own (now 'left') membership row's joined_at
     * column, repurposed as a vacancy marker by
     * Culture_Clusters::handle_host_departure() — no new field needed.
     * Runs daily.
     */
    public static function sweep_cluster_host_vacancy() {
        if ( ! class_exists( 'Culture_Clusters' ) ) {
            return;
        }

        global $wpdb;
        $grace_days = 14;
        $cutoff     = gmdate( 'Y-m-d H:i:s', strtotime( '-' . $grace_days . ' days' ) );
        $table      = Culture_Clusters::table();

        $active_ids = get_posts( array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'   => '_cluster_status',
                    'value' => Culture_Clusters::STATUS_ACTIVE,
                ),
            ),
        ) );

        foreach ( $active_ids as $cluster_id ) {
            if ( Culture_Clusters::get_member_count( $cluster_id ) > 0 ) {
                continue;
            }

            $last_row = $wpdb->get_row( $wpdb->prepare(
                "SELECT user_id, joined_at FROM {$table} WHERE cluster_id = %d ORDER BY joined_at DESC LIMIT 1",
                $cluster_id
            ), ARRAY_A );

            if ( ! $last_row || strtotime( $last_row['joined_at'] ) > strtotime( $cutoff ) ) {
                continue; // not stale yet
            }

            update_post_meta( $cluster_id, '_cluster_status', 'archived' );

            $last_user_id = (int) $last_row['user_id'];
            if ( $last_user_id && class_exists( 'Culture_Notifications' ) ) {
                Culture_Notifications::add(
                    $last_user_id,
                    'cluster_forming_expired',
                    'Your House Fellowship has been archived',
                    get_post_meta( $cluster_id, '_cluster_name', true ) . ' had no remaining members for 14 days and has been archived.',
                    '/connect/people',
                    array( 'cluster_id' => $cluster_id, 'archived' => true )
                );
            }
        }
    }

    /**
     * Award the recurring 'cluster_host_served' reward to every current host
     * of an 'active' House Fellowship, once per calendar month per cluster.
     * Idempotency is checked against the credit ledger directly (source_id =
     * cluster_id, scoped to the current month) rather than
     * Culture_Gamification::ledger_has_entry() — that helper matches on
     * source_id alone with no time window, which would only ever allow one
     * award per host for all time. Runs monthly.
     */
    public static function award_cluster_host_service() {
        if ( ! class_exists( 'Culture_Clusters' ) || ! class_exists( 'Culture_Gamification' ) ) {
            return;
        }

        global $wpdb;

        $active_ids = get_posts( array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'   => '_cluster_status',
                    'value' => Culture_Clusters::STATUS_ACTIVE,
                ),
            ),
        ) );

        $month_start = gmdate( 'Y-m-01 00:00:00' );

        foreach ( $active_ids as $cluster_id ) {
            $host_id = (int) get_post_meta( $cluster_id, '_cluster_host_id', true );
            if ( ! $host_id ) {
                continue;
            }

            $already_awarded = (bool) $wpdb->get_var( $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}culture_credit_ledger
                 WHERE user_id = %d AND source = 'cluster_host_served' AND source_id = %d AND created_at >= %s LIMIT 1",
                $host_id, $cluster_id, $month_start
            ) );
            if ( $already_awarded ) {
                continue;
            }

            Culture_Gamification::award_points( $host_id, 'cluster_host_served' );
        }
    }

    /**
     * Same-day morning reminder to all active members of a House Fellowship
     * whose meeting day is today, per §6.4/§6.3 — `cluster_checkin_reminder`.
     * Runs daily; the day-of-week match against `_cluster_meeting_day`
     * (lowercase day name, e.g. "monday") keeps this a single sweep rather
     * than seven separate per-day schedules.
     */
    public static function send_cluster_checkin_reminders() {
        if ( ! class_exists( 'Culture_Clusters' ) || ! class_exists( 'Culture_Notifications' ) ) {
            return;
        }

        $today = strtolower( current_time( 'l' ) ); // e.g. "monday"

        $active_ids = get_posts( array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'   => '_cluster_status',
                    'value' => Culture_Clusters::STATUS_ACTIVE,
                ),
                array(
                    'key'   => '_cluster_meeting_day',
                    'value' => $today,
                ),
            ),
        ) );

        foreach ( $active_ids as $cluster_id ) {
            $name = get_post_meta( $cluster_id, '_cluster_name', true );
            foreach ( Culture_Clusters::get_members( $cluster_id ) as $member ) {
                Culture_Notifications::add(
                    (int) $member['id'],
                    'cluster_checkin_reminder',
                    'House Fellowship meets today',
                    $name . ' meets today — don\'t forget to check in.',
                    '/cluster/' . $cluster_id,
                    array( 'cluster_id' => $cluster_id )
                );
            }
        }
    }

    /**
     * Award `literati_connect_attended` reputation + credits, once per event
     * per attendee, to confirmed RSVPs on Literati Connect editorial events
     * (`culture_event` posts flagged `_culture_event_is_literati`) whose date
     * has passed. Runs daily; only scans events that ended in the last 48h so
     * each event is only checked a couple of times rather than forever.
     *
     * `wp_culture_event_rsvp` (Culture_Event_RSVP) has no `user_id` column —
     * only `email` and `event_slug` — so attendees are resolved to a WP user
     * via get_user_by('email', ...), the same lookup already used by
     * Culture_Event_RSVP::handle_submit(). RSVPs with no matching registered
     * user are silently skipped (mirrors that existing precedent).
     */
    public static function sweep_literati_attendance() {
        if ( ! class_exists( 'Culture_Gamification' ) || ! class_exists( 'Culture_Event_RSVP' ) ) {
            return;
        }

        global $wpdb;

        $window_start = gmdate( 'Y-m-d H:i:s', strtotime( '-48 hours' ) );
        $now          = current_time( 'mysql', true );

        $event_ids = get_posts( array(
            'post_type'      => 'culture_event',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_query'     => array(
                array(
                    'key'   => '_culture_event_is_literati',
                    'value' => '1',
                ),
                array(
                    'key'     => '_culture_event_date',
                    'value'   => array( $window_start, $now ),
                    'compare' => 'BETWEEN',
                    'type'    => 'DATETIME',
                ),
            ),
        ) );

        if ( empty( $event_ids ) ) {
            return;
        }

        $rsvp_table = $wpdb->prefix . 'culture_event_rsvp';

        foreach ( $event_ids as $event_id ) {
            $slug = get_post_field( 'post_name', $event_id );
            if ( ! $slug ) {
                continue;
            }

            $rows = $wpdb->get_results( $wpdb->prepare(
                "SELECT email FROM {$rsvp_table} WHERE event_slug = %s AND status = 'confirmed'",
                $slug
            ), ARRAY_A );

            foreach ( $rows as $row ) {
                $user = get_user_by( 'email', $row['email'] );
                if ( ! $user ) {
                    continue;
                }

                if ( Culture_Gamification::ledger_has_entry( $user->ID, 'literati_connect_attended', $event_id ) ) {
                    continue;
                }

                Culture_Gamification::award_reputation(
                    $user->ID,
                    Culture_Gamification::get_point_value( 'literati_connect_attended' ),
                    'literati_connect_attended',
                    $event_id
                );
                Culture_Gamification::award_credits(
                    $user->ID,
                    Culture_Gamification::get_credit_bonus( 'literati_connect_attended' ),
                    'literati_connect_attended',
                    $event_id
                );
            }
        }
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
