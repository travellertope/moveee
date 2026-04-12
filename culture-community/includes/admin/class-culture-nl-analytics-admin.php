<?php
/**
 * Newsletter Analytics admin pages.
 *
 * Registers "Newsletter Analytics" under Culture Community and renders:
 *  - Overview: summary stat cards + all-campaigns table.
 *  - Campaign detail (?campaign=ID): charts, link breakdown, subscriber engagement.
 *  - Subscriber detail (?subscriber=BASE64): lifetime history for one address.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_NL_Analytics_Admin {

    public static function init() {
        add_action( 'admin_menu',            array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
    }

    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Newsletter Analytics', 'culture-community' ),
            __( 'Analytics', 'culture-community' ),
            'manage_options',
            'culture-nl-analytics',
            array( __CLASS__, 'render_page' )
        );
    }

    public static function enqueue_assets( $hook ) {
        if ( 'culture-community_page_culture-nl-analytics' !== $hook ) {
            return;
        }

        // Chart.js — loaded from official CDN.
        wp_enqueue_script(
            'chartjs',
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
            array(),
            '4.4.1',
            true
        );

        wp_enqueue_style(
            'culture-nl-analytics',
            CULTURE_PLUGIN_URL . 'assets/css/culture-nl-analytics.css',
            array(),
            CULTURE_VERSION
        );

        wp_enqueue_script(
            'culture-nl-analytics',
            CULTURE_PLUGIN_URL . 'assets/js/culture-nl-analytics.js',
            array( 'chartjs' ),
            CULTURE_VERSION,
            true
        );
    }

    // ── ROUTER ────────────────────────────────────────────────────────────────

    public static function render_page() {
        if ( isset( $_GET['campaign'] ) ) {
            self::render_campaign_detail( absint( $_GET['campaign'] ) );
            return;
        }
        if ( isset( $_GET['subscriber'] ) ) {
            $email = sanitize_email( base64_decode( sanitize_text_field( $_GET['subscriber'] ) ) );
            if ( is_email( $email ) ) {
                self::render_subscriber_detail( $email );
                return;
            }
        }
        self::render_overview();
    }

    // ── OVERVIEW ──────────────────────────────────────────────────────────────

    private static function render_overview() {
        $data = Culture_NL_Analytics::get_overview();
        ?>
        <div class="wrap culture-nla-wrap">
            <h1 class="culture-nla-page-title">
                <?php esc_html_e( 'Newsletter Analytics', 'culture-community' ); ?>
            </h1>

            <?php /* ── Summary Stat Cards ── */ ?>
            <div class="culture-nla-cards">
                <?php
                self::stat_card(
                    __( 'Avg Open Rate', 'culture-community' ),
                    $data['avg_open_rate'] . '%',
                    self::rate_class( $data['avg_open_rate'] ),
                    'dashicons-visibility'
                );
                self::stat_card(
                    __( 'Avg CTR', 'culture-community' ),
                    $data['avg_ctr'] . '%',
                    self::rate_class( $data['avg_ctr'], 5, 2 ),
                    'dashicons-admin-links'
                );
                self::stat_card(
                    __( 'Campaigns Sent', 'culture-community' ),
                    number_format( count( $data['campaigns'] ) ),
                    '',
                    'dashicons-megaphone'
                );
                self::stat_card(
                    __( 'Current Subscribers', 'culture-community' ),
                    number_format( $data['subscribers'] ),
                    '',
                    'dashicons-groups'
                );
                ?>
            </div>

            <?php /* ── Campaigns Table ── */ ?>
            <h2 class="culture-nla-section-title"><?php esc_html_e( 'Sent Campaigns', 'culture-community' ); ?></h2>

            <?php if ( empty( $data['campaigns'] ) ) : ?>
                <p class="culture-nla-empty">
                    <?php esc_html_e( 'No campaigns have been sent yet. Send your first newsletter issue to start seeing data here.', 'culture-community' ); ?>
                </p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped culture-nla-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Campaign', 'culture-community' ); ?></th>
                            <th class="col-date"><?php esc_html_e( 'Sent', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Recipients', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Unique Opens', 'culture-community' ); ?></th>
                            <th class="col-rate"><?php esc_html_e( 'Open Rate', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Unique Clicks', 'culture-community' ); ?></th>
                            <th class="col-rate"><?php esc_html_e( 'CTR', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $data['campaigns'] as $c ) : ?>
                            <tr>
                                <td>
                                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-nl-analytics&campaign=' . $c['id'] ) ); ?>">
                                        <strong><?php echo esc_html( $c['title'] ); ?></strong>
                                    </a>
                                </td>
                                <td class="col-date">
                                    <?php echo $c['sent_at']
                                        ? esc_html( date_i18n( get_option( 'date_format' ), strtotime( $c['sent_at'] ) ) )
                                        : '—';
                                    ?>
                                </td>
                                <td class="col-num"><?php echo esc_html( number_format( $c['sent'] ) ); ?></td>
                                <td class="col-num"><?php echo esc_html( number_format( $c['opens'] ) ); ?></td>
                                <td class="col-rate">
                                    <span class="culture-nla-rate <?php echo esc_attr( self::rate_class( $c['open_rate'] ) ); ?>">
                                        <?php echo esc_html( $c['open_rate'] ); ?>%
                                    </span>
                                </td>
                                <td class="col-num"><?php echo esc_html( number_format( $c['clicks'] ) ); ?></td>
                                <td class="col-rate">
                                    <span class="culture-nla-rate <?php echo esc_attr( self::rate_class( $c['ctr'], 5, 2 ) ); ?>">
                                        <?php echo esc_html( $c['ctr'] ); ?>%
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    // ── CAMPAIGN DETAIL ───────────────────────────────────────────────────────

    private static function render_campaign_detail( $campaign_id ) {
        $post = get_post( $campaign_id );
        if ( ! $post || 'culture_newsletter' !== $post->post_type ) {
            wp_die( esc_html__( 'Campaign not found.', 'culture-community' ) );
        }

        $stats   = Culture_NL_Analytics::get_campaign_stats( $campaign_id );
        $sent_at = get_post_meta( $campaign_id, '_culture_nl_sent_at', true );
        $page    = max( 1, absint( $_GET['paged'] ?? 1 ) );
        $openers = Culture_NL_Analytics::get_campaign_openers( $campaign_id, $page );

        // Inline chart data for JS.
        $chart_data = array(
            'opens'  => array(
                'labels' => array_column( $stats['opens_by_hour'],  'hour' ),
                'data'   => array_map( 'intval', array_column( $stats['opens_by_hour'],  'count' ) ),
            ),
            'clicks' => array(
                'labels' => array_column( $stats['clicks_by_hour'], 'hour' ),
                'data'   => array_map( 'intval', array_column( $stats['clicks_by_hour'], 'count' ) ),
            ),
        );
        ?>
        <div class="wrap culture-nla-wrap">
            <p>
                <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-nl-analytics' ) ); ?>" class="culture-nla-back">
                    ← <?php esc_html_e( 'All Campaigns', 'culture-community' ); ?>
                </a>
            </p>

            <h1 class="culture-nla-page-title"><?php echo esc_html( $post->post_title ); ?></h1>
            <?php if ( $sent_at ) : ?>
                <p class="culture-nla-subtitle">
                    <?php
                    printf(
                        /* translators: date/time of send */
                        esc_html__( 'Sent %s', 'culture-community' ),
                        esc_html( date_i18n(
                            get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
                            strtotime( $sent_at )
                        ) )
                    );
                    ?>
                </p>
            <?php endif; ?>

            <?php /* ── Primary Stat Cards ── */ ?>
            <div class="culture-nla-cards">
                <?php
                self::stat_card( __( 'Sent',        'culture-community' ), number_format( $stats['sent'] ),          '', 'dashicons-email-alt' );
                self::stat_card( __( 'Unique Opens', 'culture-community' ), number_format( $stats['unique_opens'] ),  '', 'dashicons-visibility' );
                self::stat_card( __( 'Open Rate',   'culture-community' ), $stats['open_rate'] . '%', self::rate_class( $stats['open_rate'] ), 'dashicons-chart-pie' );
                self::stat_card( __( 'Unique Clicks','culture-community' ), number_format( $stats['unique_clicks'] ), '', 'dashicons-admin-links' );
                self::stat_card( __( 'CTR',         'culture-community' ), $stats['ctr'] . '%', self::rate_class( $stats['ctr'], 5, 2 ), 'dashicons-chart-bar' );
                self::stat_card( __( 'CTOR',        'culture-community' ), $stats['ctor'] . '%', self::rate_class( $stats['ctor'], 15, 5 ), 'dashicons-dashboard' );
                self::stat_card( __( 'Unsubscribes','culture-community' ), number_format( $stats['unsubs'] ),         '', 'dashicons-minus-alt' );
                self::stat_card( __( 'Total Opens', 'culture-community' ), number_format( $stats['total_opens'] ),    '', 'dashicons-update-alt' );
                ?>
            </div>

            <?php /* ── Activity Charts ── */ ?>
            <?php if ( ! empty( $stats['opens_by_hour'] ) || ! empty( $stats['clicks_by_hour'] ) ) : ?>
                <div class="culture-nla-charts-row">
                    <div class="culture-nla-chart-card">
                        <h3 class="culture-nla-chart-title"><?php esc_html_e( 'Opens Over Time', 'culture-community' ); ?></h3>
                        <canvas id="chart-opens" height="160"></canvas>
                    </div>
                    <div class="culture-nla-chart-card">
                        <h3 class="culture-nla-chart-title"><?php esc_html_e( 'Clicks Over Time', 'culture-community' ); ?></h3>
                        <canvas id="chart-clicks" height="160"></canvas>
                    </div>
                </div>
                <script>
                window.culturaNLAChartData = <?php echo wp_json_encode( $chart_data ); ?>;
                </script>
            <?php endif; ?>

            <?php /* ── Top Links ── */ ?>
            <?php if ( ! empty( $stats['top_links'] ) ) : ?>
                <h2 class="culture-nla-section-title"><?php esc_html_e( 'Link Activity', 'culture-community' ); ?></h2>
                <table class="wp-list-table widefat fixed striped culture-nla-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'URL', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Total Clicks', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Unique Clickers', 'culture-community' ); ?></th>
                            <th class="col-rate"><?php esc_html_e( '% of Openers', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $stats['top_links'] as $link ) :
                            $pct = $stats['unique_opens'] > 0
                                ? round( $link['unique_clickers'] / $stats['unique_opens'] * 100, 1 )
                                : 0;
                        ?>
                            <tr>
                                <td>
                                    <a href="<?php echo esc_url( $link['url'] ); ?>" target="_blank" rel="noopener">
                                        <?php echo esc_html( self::truncate_url( $link['url'] ) ); ?>
                                    </a>
                                </td>
                                <td class="col-num"><?php echo esc_html( number_format( $link['total_clicks'] ) ); ?></td>
                                <td class="col-num"><?php echo esc_html( number_format( $link['unique_clickers'] ) ); ?></td>
                                <td class="col-rate">
                                    <div class="culture-nla-bar-wrap">
                                        <div class="culture-nla-bar" style="width:<?php echo esc_attr( min( 100, $pct ) ); ?>%;"></div>
                                        <span><?php echo esc_html( $pct ); ?>%</span>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

            <?php /* ── Subscriber Engagement ── */ ?>
            <h2 class="culture-nla-section-title">
                <?php
                printf(
                    /* translators: number of subscribers who opened */
                    esc_html__( 'Subscribers Who Opened (%s)', 'culture-community' ),
                    number_format( $openers['total'] )
                );
                ?>
                <span class="culture-nla-subtitle-note">
                    <?php
                    if ( $stats['sent'] > 0 ) {
                        printf(
                            /* translators: 1: openers 2: total sent */
                            esc_html__( '%1$s of %2$s recipients engaged', 'culture-community' ),
                            number_format( $openers['total'] ),
                            number_format( $stats['sent'] )
                        );
                    }
                    ?>
                </span>
            </h2>

            <?php if ( empty( $openers['rows'] ) ) : ?>
                <p class="culture-nla-empty">
                    <?php esc_html_e( 'No opens recorded yet. Opens are tracked via a pixel in the email; some clients block images.', 'culture-community' ); ?>
                </p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped culture-nla-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Subscriber', 'culture-community' ); ?></th>
                            <th class="col-date"><?php esc_html_e( 'First Opened', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Opens', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Clicks', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $openers['rows'] as $row ) :
                            $sub_url = admin_url( 'admin.php?page=culture-nl-analytics&subscriber='
                                . base64_encode( $row['subscriber'] ) );
                        ?>
                            <tr>
                                <td>
                                    <a href="<?php echo esc_url( $sub_url ); ?>">
                                        <?php echo esc_html( $row['subscriber'] ); ?>
                                    </a>
                                </td>
                                <td class="col-date">
                                    <?php echo $row['first_open']
                                        ? esc_html( date_i18n(
                                            get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
                                            strtotime( $row['first_open'] )
                                          ) )
                                        : '—';
                                    ?>
                                </td>
                                <td class="col-num"><?php echo esc_html( number_format( $row['open_count'] ) ); ?></td>
                                <td class="col-num"><?php echo esc_html( number_format( $row['click_count'] ) ); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php if ( $openers['pages'] > 1 ) : ?>
                    <div class="culture-nla-pagination">
                        <?php
                        $base = admin_url( 'admin.php?page=culture-nl-analytics&campaign=' . $campaign_id . '&paged=%#%' );
                        echo paginate_links( array(
                            'base'      => $base,
                            'format'    => '',
                            'current'   => $page,
                            'total'     => $openers['pages'],
                            'prev_text' => '&laquo;',
                            'next_text' => '&raquo;',
                        ) );
                        ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>

        </div>
        <?php
    }

    // ── SUBSCRIBER DETAIL ─────────────────────────────────────────────────────

    private static function render_subscriber_detail( $email ) {
        $stats = Culture_NL_Analytics::get_subscriber_stats( $email );

        $tier_labels = array(
            'hot'       => __( 'Hot', 'culture-community' ),
            'warm'      => __( 'Warm', 'culture-community' ),
            'cold'      => __( 'Cold', 'culture-community' ),
            'unengaged' => __( 'Unengaged', 'culture-community' ),
        );
        $tier = $stats['engagement'];
        ?>
        <div class="wrap culture-nla-wrap">
            <p>
                <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-nl-analytics' ) ); ?>" class="culture-nla-back">
                    ← <?php esc_html_e( 'All Campaigns', 'culture-community' ); ?>
                </a>
            </p>

            <div class="culture-nla-sub-header">
                <h1 class="culture-nla-page-title"><?php echo esc_html( $email ); ?></h1>
                <span class="culture-nla-engagement-badge culture-nla-tier-<?php echo esc_attr( $tier ); ?>">
                    <?php echo esc_html( $tier_labels[ $tier ] ?? $tier ); ?>
                </span>
            </div>

            <div class="culture-nla-cards">
                <?php
                self::stat_card( __( 'Campaigns Opened',  'culture-community' ), number_format( $stats['campaigns_opened'] ),  '', 'dashicons-visibility' );
                self::stat_card( __( 'Open Rate',         'culture-community' ), $stats['open_rate'] . '%', self::rate_class( $stats['open_rate'] ), 'dashicons-chart-pie' );
                self::stat_card( __( 'Total Opens',       'culture-community' ), number_format( $stats['total_opens'] ),        '', 'dashicons-update-alt' );
                self::stat_card( __( 'Campaigns Clicked', 'culture-community' ), number_format( $stats['campaigns_clicked'] ), '', 'dashicons-admin-links' );
                self::stat_card( __( 'Total Clicks',      'culture-community' ), number_format( $stats['total_clicks'] ),       '', 'dashicons-chart-bar' );
                ?>
            </div>

            <div class="culture-nla-sub-dates">
                <?php if ( $stats['first_open'] ) : ?>
                    <span>
                        <strong><?php esc_html_e( 'First open:', 'culture-community' ); ?></strong>
                        <?php echo esc_html( date_i18n(
                            get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
                            strtotime( $stats['first_open'] )
                        ) ); ?>
                    </span>
                <?php endif; ?>
                <?php if ( $stats['last_open'] ) : ?>
                    <span>
                        <strong><?php esc_html_e( 'Last open:', 'culture-community' ); ?></strong>
                        <?php echo esc_html( date_i18n(
                            get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
                            strtotime( $stats['last_open'] )
                        ) ); ?>
                    </span>
                <?php endif; ?>
                <?php if ( $stats['last_click'] ) : ?>
                    <span>
                        <strong><?php esc_html_e( 'Last click:', 'culture-community' ); ?></strong>
                        <?php echo esc_html( date_i18n(
                            get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
                            strtotime( $stats['last_click'] )
                        ) ); ?>
                    </span>
                <?php endif; ?>
            </div>

            <h2 class="culture-nla-section-title"><?php esc_html_e( 'Campaign History', 'culture-community' ); ?></h2>

            <?php if ( empty( $stats['history'] ) ) : ?>
                <p class="culture-nla-empty">
                    <?php esc_html_e( 'No engagement recorded for this subscriber yet.', 'culture-community' ); ?>
                </p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped culture-nla-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Campaign', 'culture-community' ); ?></th>
                            <th class="col-date"><?php esc_html_e( 'Sent', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Recipients', 'culture-community' ); ?></th>
                            <th class="col-center"><?php esc_html_e( 'Opened?', 'culture-community' ); ?></th>
                            <th class="col-num"><?php esc_html_e( 'Clicks', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $stats['history'] as $row ) : ?>
                            <tr>
                                <td>
                                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-nl-analytics&campaign=' . $row['campaign_id'] ) ); ?>">
                                        <?php echo esc_html( $row['title'] ); ?>
                                    </a>
                                </td>
                                <td class="col-date">
                                    <?php echo $row['sent_at']
                                        ? esc_html( date_i18n( get_option( 'date_format' ), strtotime( $row['sent_at'] ) ) )
                                        : '—';
                                    ?>
                                </td>
                                <td class="col-num">
                                    <?php echo $row['sent_total']
                                        ? esc_html( number_format( (int) $row['sent_total'] ) )
                                        : '—';
                                    ?>
                                </td>
                                <td class="col-center">
                                    <?php if ( (int) $row['opened'] > 0 ) : ?>
                                        <span class="culture-nla-yes">✓</span>
                                    <?php else : ?>
                                        <span class="culture-nla-no">—</span>
                                    <?php endif; ?>
                                </td>
                                <td class="col-num">
                                    <?php echo (int) $row['clicks'] > 0
                                        ? esc_html( number_format( (int) $row['clicks'] ) )
                                        : '—';
                                    ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

        </div>
        <?php
    }

    // ── COMPONENT HELPERS ─────────────────────────────────────────────────────

    /**
     * Render a stat card.
     *
     * @param string $label
     * @param string $value
     * @param string $value_class  Optional CSS class on the value span (e.g. 'good', 'average', 'poor').
     * @param string $dashicon     Dashicons class name.
     */
    private static function stat_card( $label, $value, $value_class = '', $dashicon = '' ) {
        ?>
        <div class="culture-nla-card">
            <?php if ( $dashicon ) : ?>
                <span class="culture-nla-card-icon dashicons <?php echo esc_attr( $dashicon ); ?>"></span>
            <?php endif; ?>
            <div class="culture-nla-card-body">
                <div class="culture-nla-card-value <?php echo esc_attr( $value_class ); ?>">
                    <?php echo esc_html( $value ); ?>
                </div>
                <div class="culture-nla-card-label"><?php echo esc_html( $label ); ?></div>
            </div>
        </div>
        <?php
    }

    /**
     * Return a CSS class based on a percentage rate.
     * Default thresholds are for open rates (good ≥ 20, average ≥ 10).
     *
     * @param  float $rate
     * @param  int   $good    Threshold above which we call it "good".
     * @param  int   $average Threshold above which we call it "average".
     * @return string 'good' | 'average' | 'poor'
     */
    private static function rate_class( $rate, $good = 20, $average = 10 ) {
        if ( $rate >= $good )    return 'good';
        if ( $rate >= $average ) return 'average';
        return 'poor';
    }

    /**
     * Truncate a long URL for display.
     *
     * @param  string $url
     * @param  int    $max
     * @return string
     */
    private static function truncate_url( $url, $max = 80 ) {
        $display = preg_replace( '#^https?://#', '', $url );
        if ( strlen( $display ) > $max ) {
            $display = substr( $display, 0, $max ) . '…';
        }
        return $display;
    }
}
