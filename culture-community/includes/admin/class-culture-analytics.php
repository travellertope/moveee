<?php
/**
 * Admin Analytics Dashboard.
 *
 * Provides an overview page with:
 * - Member statistics (total, by tier, new this month)
 * - Event attendance trends (check-ins per month)
 * - Popular chapters (by member count and attendance)
 * - Revenue overview (Patron subscribers, churn)
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Analytics {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
    }

    /**
     * Register the Analytics submenu page under Culture Community.
     */
    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Analytics', 'culture-community' ),
            __( 'Analytics', 'culture-community' ),
            'manage_options',
            'culture-analytics',
            array( __CLASS__, 'render_page' )
        );
    }

    /**
     * Enqueue Chart.js on our analytics page.
     */
    public static function enqueue_assets( $hook ) {
        if ( 'culture-community_page_culture-analytics' !== $hook ) {
            return;
        }

        wp_enqueue_style(
            'culture-analytics',
            CULTURE_PLUGIN_URL . 'assets/css/culture-analytics.css',
            array(),
            CULTURE_VERSION
        );

        wp_enqueue_script(
            'chartjs',
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
            array(),
            '4.4.1',
            true
        );

        wp_enqueue_script(
            'culture-analytics',
            CULTURE_PLUGIN_URL . 'assets/js/culture-analytics.js',
            array( 'chartjs', 'jquery' ),
            CULTURE_VERSION,
            true
        );

        wp_localize_script( 'culture-analytics', 'cultureAnalytics', array(
            'attendance' => self::get_monthly_attendance(),
            'members'    => self::get_monthly_registrations(),
            'labels'     => array(
                'attendance_title' => __( 'Check-ins per Month', 'culture-community' ),
                'members_title'    => __( 'New Members per Month', 'culture-community' ),
                'checkins'         => __( 'Check-ins', 'culture-community' ),
                'new_members'      => __( 'New Members', 'culture-community' ),
            ),
        ) );
    }

    /**
     * Render the analytics dashboard page (community + newsletter tabs).
     */
    public static function render_page() {
        $tab = isset( $_GET['tab'] ) ? sanitize_text_field( $_GET['tab'] ) : 'community';
        ?>
        <div class="wrap culture-analytics">
            <h1><?php esc_html_e( 'Analytics', 'culture-community' ); ?></h1>

            <nav class="nav-tab-wrapper" style="margin-bottom:20px;">
                <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-analytics&tab=community' ) ); ?>"
                   class="nav-tab<?php echo 'community' === $tab ? ' nav-tab-active' : ''; ?>">
                    <?php esc_html_e( 'Community', 'culture-community' ); ?>
                </a>
                <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-analytics&tab=newsletter' ) ); ?>"
                   class="nav-tab<?php echo 'newsletter' === $tab ? ' nav-tab-active' : ''; ?>">
                    <?php esc_html_e( 'Newsletter', 'culture-community' ); ?>
                </a>
            </nav>

            <?php if ( 'newsletter' === $tab ) : ?>
                <?php Culture_NL_Analytics_Admin::render_for_tab(); ?>
                </div><!-- .wrap -->
            <?php return; endif; ?>

        <?php
        $stats         = self::get_member_stats();
        $top_members   = self::get_top_members();
        $recent_events = self::get_recent_event_stats();
        ?>

            <!-- KPI Cards -->
            <div class="culture-analytics__cards">
                <div class="culture-analytics__card">
                    <div class="culture-analytics__card-value"><?php echo esc_html( $stats['total_members'] ); ?></div>
                    <div class="culture-analytics__card-label"><?php esc_html_e( 'Total Members', 'culture-community' ); ?></div>
                </div>
                <div class="culture-analytics__card culture-analytics__card--accent">
                    <div class="culture-analytics__card-value"><?php echo esc_html( $stats['patron_count'] ); ?></div>
                    <div class="culture-analytics__card-label"><?php esc_html_e( 'Patron Members', 'culture-community' ); ?></div>
                </div>
                <div class="culture-analytics__card">
                    <div class="culture-analytics__card-value"><?php echo esc_html( $stats['citizen_count'] ); ?></div>
                    <div class="culture-analytics__card-label"><?php esc_html_e( 'Citizen Members', 'culture-community' ); ?></div>
                </div>
                <div class="culture-analytics__card culture-analytics__card--success">
                    <div class="culture-analytics__card-value"><?php echo esc_html( $stats['new_this_month'] ); ?></div>
                    <div class="culture-analytics__card-label"><?php esc_html_e( 'New This Month', 'culture-community' ); ?></div>
                </div>
                <div class="culture-analytics__card">
                    <div class="culture-analytics__card-value"><?php echo esc_html( $stats['total_checkins'] ); ?></div>
                    <div class="culture-analytics__card-label"><?php esc_html_e( 'Total Check-ins', 'culture-community' ); ?></div>
                </div>
                <div class="culture-analytics__card culture-analytics__card--warning">
                    <div class="culture-analytics__card-value"><?php echo esc_html( $stats['grace_period_count'] ); ?></div>
                    <div class="culture-analytics__card-label"><?php esc_html_e( 'In Grace Period', 'culture-community' ); ?></div>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="culture-analytics__charts">
                <div class="culture-analytics__chart-box">
                    <h2><?php esc_html_e( 'Check-ins per Month', 'culture-community' ); ?></h2>
                    <div class="culture-analytics__chart-wrap">
                        <canvas id="culture-attendance-chart"></canvas>
                    </div>
                </div>
                <div class="culture-analytics__chart-box">
                    <h2><?php esc_html_e( 'New Members per Month', 'culture-community' ); ?></h2>
                    <div class="culture-analytics__chart-wrap">
                        <canvas id="culture-members-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Tables Row -->
            <div class="culture-analytics__tables">
                <!-- Top Members -->
                <div class="culture-analytics__table-box">
                    <h2><?php esc_html_e( 'Top Members by Points', 'culture-community' ); ?></h2>
                    <?php if ( empty( $top_members ) ) : ?>
                        <p class="culture-analytics__empty"><?php esc_html_e( 'No member data yet.', 'culture-community' ); ?></p>
                    <?php else : ?>
                        <table class="wp-list-table widefat fixed striped">
                            <thead>
                                <tr>
                                    <th><?php esc_html_e( '#', 'culture-community' ); ?></th>
                                    <th><?php esc_html_e( 'Member', 'culture-community' ); ?></th>
                                    <th><?php esc_html_e( 'Points', 'culture-community' ); ?></th>
                                    <th><?php esc_html_e( 'Badges', 'culture-community' ); ?></th>
                                    <th><?php esc_html_e( 'Tier', 'culture-community' ); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ( $top_members as $rank => $member ) : ?>
                                    <tr>
                                        <td><?php echo esc_html( $rank + 1 ); ?></td>
                                        <td><?php echo esc_html( $member['display_name'] ); ?></td>
                                        <td><strong><?php echo esc_html( $member['points'] ); ?></strong></td>
                                        <td><?php echo esc_html( $member['badge_count'] ); ?></td>
                                        <td>
                                            <span class="culture-analytics__tier culture-analytics__tier--<?php echo esc_attr( $member['tier'] ); ?>">
                                                <?php echo esc_html( ucfirst( $member['tier'] ) ); ?>
                                            </span>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Recent Events Performance -->
            <div class="culture-analytics__section">
                <h2><?php esc_html_e( 'Recent Event Performance', 'culture-community' ); ?></h2>
                <?php if ( empty( $recent_events ) ) : ?>
                    <p class="culture-analytics__empty"><?php esc_html_e( 'No event data yet.', 'culture-community' ); ?></p>
                <?php else : ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php esc_html_e( 'Event', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Date', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'RSVPs', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Check-ins', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Conversion', 'culture-community' ); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $recent_events as $event ) : ?>
                                <tr>
                                    <td><strong><?php echo esc_html( $event['title'] ); ?></strong></td>
                                    <td><?php echo esc_html( $event['date'] ); ?></td>
                                    <td>
                                        <span class="culture-analytics__event-type culture-analytics__event-type--<?php echo esc_attr( $event['type'] ); ?>">
                                            <?php echo esc_html( $event['type_label'] ); ?>
                                        </span>
                                    </td>
                                    <td><?php echo esc_html( $event['rsvps'] ); ?></td>
                                    <td><?php echo esc_html( $event['checkins'] ); ?></td>
                                    <td><?php echo esc_html( $event['conversion'] ); ?>%</td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }

    /**
     * Get aggregate member statistics.
     *
     * @return array
     */
    private static function get_member_stats() {
        global $wpdb;

        $total = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->usermeta} WHERE meta_key = '_culture_membership_tier'"
        );

        $patron = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->usermeta} WHERE meta_key = '_culture_membership_tier' AND meta_value = %s",
            'patron'
        ) );

        $citizen = $total - $patron;

        $first_of_month = gmdate( 'Y-m-01 00:00:00' );
        $new_this_month = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->users} u
             INNER JOIN {$wpdb->usermeta} um ON u.ID = um.user_id AND um.meta_key = '_culture_membership_tier'
             WHERE u.user_registered >= %s",
            $first_of_month
        ) );

        $table = $wpdb->prefix . 'culture_attendance';
        $total_checkins = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} WHERE status = 'checked_in'"
        );

        $grace_period = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT user_id) FROM {$wpdb->usermeta} WHERE meta_key = '_culture_subscription_status' AND meta_value = %s",
            'non-renewing'
        ) );

        return array(
            'total_members'      => $total,
            'patron_count'       => $patron,
            'citizen_count'      => $citizen,
            'new_this_month'     => $new_this_month,
            'total_checkins'     => $total_checkins,
            'grace_period_count' => $grace_period,
        );
    }

    /**
     * Get monthly attendance data for the past 12 months.
     *
     * @return array [ ['month' => '2025-01', 'count' => 42], ... ]
     */
    private static function get_monthly_attendance() {
        global $wpdb;
        $table = $wpdb->prefix . 'culture_attendance';

        $results = $wpdb->get_results(
            "SELECT DATE_FORMAT(checkin_time, '%Y-%m') AS month, COUNT(*) AS count
             FROM {$table}
             WHERE status = 'checked_in'
               AND checkin_time >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY month
             ORDER BY month ASC",
            ARRAY_A
        );

        // Fill in missing months.
        $filled = array();
        for ( $i = 11; $i >= 0; $i-- ) {
            $month = gmdate( 'Y-m', strtotime( "-{$i} months" ) );
            $found = 0;
            foreach ( $results as $row ) {
                if ( $row['month'] === $month ) {
                    $found = (int) $row['count'];
                    break;
                }
            }
            $filled[] = array( 'month' => $month, 'count' => $found );
        }

        return $filled;
    }

    /**
     * Get monthly new member registrations for the past 12 months.
     *
     * @return array [ ['month' => '2025-01', 'count' => 15], ... ]
     */
    private static function get_monthly_registrations() {
        global $wpdb;

        $results = $wpdb->get_results(
            "SELECT DATE_FORMAT(u.user_registered, '%Y-%m') AS month, COUNT(*) AS count
             FROM {$wpdb->users} u
             INNER JOIN {$wpdb->usermeta} um ON u.ID = um.user_id AND um.meta_key = '_culture_membership_tier'
             WHERE u.user_registered >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY month
             ORDER BY month ASC",
            ARRAY_A
        );

        $filled = array();
        for ( $i = 11; $i >= 0; $i-- ) {
            $month = gmdate( 'Y-m', strtotime( "-{$i} months" ) );
            $found = 0;
            foreach ( $results as $row ) {
                if ( $row['month'] === $month ) {
                    $found = (int) $row['count'];
                    break;
                }
            }
            $filled[] = array( 'month' => $month, 'count' => $found );
        }

        return $filled;
    }

    /**
     * Get the top 10 members by points.
     *
     * @return array
     */
    private static function get_top_members() {
        global $wpdb;

        $results = $wpdb->get_results(
            "SELECT u.ID, u.display_name, CAST(um.meta_value AS UNSIGNED) AS points
             FROM {$wpdb->users} u
             INNER JOIN {$wpdb->usermeta} um ON u.ID = um.user_id AND um.meta_key = '_culture_points'
             WHERE um.meta_value > 0
             ORDER BY points DESC
             LIMIT " . absint( class_exists( 'Culture_Settings' ) ? Culture_Settings::get( 'culture_analytics_limit_top_members' ) : 10 ),
            ARRAY_A
        );

        $members = array();
        foreach ( $results as $row ) {
            $badges = get_user_meta( $row['ID'], '_culture_badges', true );
            $tier   = get_user_meta( $row['ID'], '_culture_membership_tier', true ) ?: 'citizen';

            $members[] = array(
                'display_name' => $row['display_name'],
                'points'       => (int) $row['points'],
                'badge_count'  => is_array( $badges ) ? count( $badges ) : 0,
                'tier'         => $tier,
            );
        }

        return $members;
    }

    /**
     * Get stats for the 10 most recent events.
     *
     * @return array
     */
    private static function get_recent_event_stats() {
        global $wpdb;
        $table = $wpdb->prefix . 'culture_attendance';

        $events = get_posts( array(
            'post_type'      => 'culture_event',
            'posts_per_page' => class_exists( 'Culture_Settings' ) ? (int) Culture_Settings::get( 'culture_analytics_limit_events' ) : 10,
            'post_status'    => 'publish',
            'meta_key'       => '_culture_event_date',
            'orderby'        => 'meta_value',
            'order'          => 'DESC',
        ) );

        $stats = array();
        foreach ( $events as $event ) {
            $is_physical = get_post_meta( $event->ID, '_culture_is_physical', true );
            $event_date  = get_post_meta( $event->ID, '_culture_event_date', true );

            $rsvps = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table} WHERE event_id = %d AND status IN ('rsvp', 'checked_in')",
                $event->ID
            ) );

            $checkins = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table} WHERE event_id = %d AND status = 'checked_in'",
                $event->ID
            ) );

            $conversion = $rsvps > 0 ? round( ( $checkins / $rsvps ) * 100 ) : 0;

            $stats[] = array(
                'title'      => $event->post_title,
                'date'       => $event_date ? date_i18n( get_option( 'date_format' ), strtotime( $event_date ) ) : '-',
                'type'       => '1' === $is_physical ? 'physical' : 'virtual',
                'type_label' => '1' === $is_physical ? __( 'In-Person', 'culture-community' ) : __( 'Virtual', 'culture-community' ),
                'rsvps'      => $rsvps,
                'checkins'   => $checkins,
                'conversion' => $conversion,
            );
        }

        return $stats;
    }
}
