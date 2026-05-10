<?php
/**
 * Comprehensive admin settings page with tabbed interface.
 *
 * Manages all configurable values: payment, gamification, referrals,
 * emails, membership & grace period, and general options.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Settings {

    /** Option group key. */
    const OPTION_GROUP = 'culture_community_settings';

    /** Default values for all settings. */
    private static $defaults = array(
        // Payment (Paystack).
        'culture_paystack_public_key'          => '',
        'culture_paystack_secret_key'          => '',
        'culture_paystack_plan_monthly_ngn'    => '',
        'culture_paystack_plan_yearly_ngn'     => '',
        'culture_paystack_plan_monthly_usd'    => '',
        'culture_paystack_plan_yearly_usd'     => '',
        'culture_paystack_amount_monthly_ngn'  => 4500,
        'culture_paystack_amount_yearly_ngn'   => 45000,
        'culture_paystack_amount_monthly_usd'  => 4,
        'culture_paystack_amount_yearly_usd'   => 40,

        // Payment (Stripe).
        'culture_stripe_publishable_key'       => '',
        'culture_stripe_secret_key'            => '',
        'culture_stripe_price_monthly_usd'     => '',
        'culture_stripe_price_yearly_usd'      => '',

        // Gamification – point values.
        'culture_points_event_rsvp'          => 5,
        'culture_points_event_checkin'       => 15,
        'culture_points_newsletter_comment'  => 10,
        'culture_points_newsletter_reaction' => 2,
        'culture_points_referral'            => 25,
        'culture_points_quote_submission'    => 10,
        'culture_points_quote_like'          => 1,
        'culture_points_magazine_read'       => 5,
        'culture_points_magazine_share'      => 5,

        // Gamification – badge thresholds.
        'culture_badge_first_steps'              => 1,
        'culture_badge_regular'                  => 5,
        'culture_badge_culture_vulture'          => 25,
        'culture_badge_explorer'                 => 3,
        'culture_badge_globetrotter'             => 10,
        'culture_badge_commentator'              => 10,
        'culture_badge_century_club'             => 100,
        'culture_badge_wordsmith'                => 1,
        'culture_badge_librarian'                => 10,
        'culture_badge_philosopher'              => 50,
        'culture_badge_influencer'               => 10,
        'culture_badge_thought_leader'           => 100,
        'culture_badge_culture_archivist'        => 1,
        'culture_badge_knowledge_keeper'         => 5,
        'culture_badge_cultural_encyclopaedist'  => 20,
        'culture_badge_cultural_specialist'      => 10,
        'culture_badge_deep_diver'               => 10,
        'culture_badge_culture_liaison'          => 10,

        // Referrals.
        'culture_referral_cookie_days' => 30,

        // Emails.
        'culture_email_from_name'      => 'Culture Community',
        'culture_email_header_color'   => '#2c3e50',
        'culture_email_button_color'   => '#e67e22',

        // Membership.
        'culture_grace_period_days'    => 7,
        'culture_patron_label'         => 'Patron',
        'culture_citizen_label'        => 'Citizen',

        // General.
        'culture_registration_page'    => '',
        'culture_frontend_url'         => '',
        'culture_api_secret'           => '',
        'culture_cron_secret'          => '',
        'culture_analytics_limit_top_members' => 10,
        'culture_analytics_limit_events'      => 10,

        // Automation — Twitter / X.
        'culture_twitter_enabled'             => '0',
        'culture_twitter_api_key'             => '',
        'culture_twitter_api_secret'          => '',
        'culture_twitter_access_token'        => '',
        'culture_twitter_access_token_secret' => '',
        'culture_twitter_interval'            => 'thirtyminutes',

        // Advertising — Google Ads / AdSense.
        'culture_ads_enabled'                    => '0',
        'culture_ads_publisher_id'               => '',
        'culture_ads_custom_script'              => '',
        'culture_ads_slot_leaderboard_top'       => '',
        'culture_ads_slot_leaderboard_mid'       => '',
        'culture_ads_slot_leaderboard_pre_quotes'=> '',
        'culture_ads_slot_hero_sidebar'          => '',
    );

    /**
     * Get an option value with default fallback.
     *
     * @param string $key Option key.
     * @return mixed
     */
    public static function get( $key ) {
        $default = isset( self::$defaults[ $key ] ) ? self::$defaults[ $key ] : '';
        return get_option( $key, $default );
    }

    /**
     * Get point value for a gamification action.
     *
     * @param string $action One of: event_rsvp, event_checkin, newsletter_comment, newsletter_reaction, referral.
     * @return int
     */
    public static function get_points( $action ) {
        $key     = 'culture_points_' . $action;
        $default = isset( self::$defaults[ $key ] ) ? self::$defaults[ $key ] : 0;
        return (int) get_option( $key, $default );
    }

    /**
     * Get badge threshold value.
     *
     * @param string $badge_slug Badge slug.
     * @return int
     */
    public static function get_badge_threshold( $badge_slug ) {
        $key     = 'culture_badge_' . $badge_slug;
        $default = isset( self::$defaults[ $key ] ) ? self::$defaults[ $key ] : 0;
        return (int) get_option( $key, $default );
    }

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ), 9 );
        add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
    }

    /**
     * Register the main Culture Community admin menu and Settings submenu.
     */
    public static function register_menu() {
        add_menu_page(
            __( 'Culture Community', 'culture-community' ),
            __( 'Culture Community', 'culture-community' ),
            'manage_options',
            'culture-community',
            array( __CLASS__, 'render_page' ),
            'dashicons-groups',
            30
        );

        add_submenu_page(
            'culture-community',
            __( 'Settings', 'culture-community' ),
            __( 'Settings', 'culture-community' ),
            'manage_options',
            'culture-community',
            array( __CLASS__, 'render_page' )
        );
    }

    /**
     * Enqueue settings page assets.
     */
    public static function enqueue_assets( $hook ) {
        if ( 'toplevel_page_culture-community' !== $hook ) {
            return;
        }
        wp_enqueue_style( 'wp-color-picker' );
        wp_enqueue_script( 'wp-color-picker' );
    }

    /**
     * Register all settings with the WordPress Settings API.
     */
    public static function register_settings() {
        $text    = array( 'sanitize_callback' => 'sanitize_text_field' );
        $int     = array( 'sanitize_callback' => 'absint' );
        $color   = array( 'sanitize_callback' => 'sanitize_hex_color' );

        // Payment.
        register_setting( 'culture_settings_payment', 'culture_paystack_public_key', $text );
        register_setting( 'culture_settings_payment', 'culture_paystack_secret_key', $text );
        register_setting( 'culture_settings_payment', 'culture_paystack_plan_monthly_ngn', $text );
        register_setting( 'culture_settings_payment', 'culture_paystack_plan_yearly_ngn', $text );
        register_setting( 'culture_settings_payment', 'culture_paystack_plan_monthly_usd', $text );
        register_setting( 'culture_settings_payment', 'culture_paystack_plan_yearly_usd', $text );
        register_setting( 'culture_settings_payment', 'culture_paystack_amount_monthly_ngn', $int );
        register_setting( 'culture_settings_payment', 'culture_paystack_amount_yearly_ngn', $int );
        register_setting( 'culture_settings_payment', 'culture_paystack_amount_monthly_usd', $int );
        register_setting( 'culture_settings_payment', 'culture_paystack_amount_yearly_usd', $int );

        // Stripe.
        register_setting( 'culture_settings_payment', 'culture_stripe_publishable_key', $text );
        register_setting( 'culture_settings_payment', 'culture_stripe_secret_key', $text );
        register_setting( 'culture_settings_payment', 'culture_stripe_price_monthly_usd', $text );
        register_setting( 'culture_settings_payment', 'culture_stripe_price_yearly_usd', $text );

        // Gamification – points.
        register_setting( 'culture_settings_gamification', 'culture_points_event_rsvp', $int );
        register_setting( 'culture_settings_gamification', 'culture_points_event_checkin', $int );
        register_setting( 'culture_settings_gamification', 'culture_points_newsletter_comment', $int );
        register_setting( 'culture_settings_gamification', 'culture_points_newsletter_reaction', $int );
        register_setting( 'culture_settings_gamification', 'culture_points_referral', $int );

        // Gamification – badge thresholds.
        register_setting( 'culture_settings_gamification', 'culture_badge_first_steps', $int );
        register_setting( 'culture_settings_gamification', 'culture_badge_regular', $int );
        register_setting( 'culture_settings_gamification', 'culture_badge_culture_vulture', $int );
        register_setting( 'culture_settings_gamification', 'culture_badge_explorer', $int );
        register_setting( 'culture_settings_gamification', 'culture_badge_globetrotter', $int );
        register_setting( 'culture_settings_gamification', 'culture_badge_commentator', $int );
        register_setting( 'culture_settings_gamification', 'culture_badge_century_club', $int );

        // Referrals.
        register_setting( 'culture_settings_referrals', 'culture_referral_cookie_days', $int );

        // Emails.
        register_setting( 'culture_settings_emails', 'culture_email_from_name', $text );
        register_setting( 'culture_settings_emails', 'culture_email_header_color', $color );
        register_setting( 'culture_settings_emails', 'culture_email_button_color', $color );

        // Membership.
        register_setting( 'culture_settings_membership', 'culture_grace_period_days', $int );
        register_setting( 'culture_settings_membership', 'culture_patron_label', $text );
        register_setting( 'culture_settings_membership', 'culture_citizen_label', $text );

        // General.
        register_setting( 'culture_settings_general', 'culture_registration_page', $text );
        register_setting( 'culture_settings_general', 'culture_frontend_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
        register_setting( 'culture_settings_general', 'culture_api_secret', $text );
        register_setting( 'culture_settings_general', 'culture_cron_secret', $text );
        register_setting( 'culture_settings_general', 'culture_analytics_limit_top_members', $int );
        register_setting( 'culture_settings_general', 'culture_analytics_limit_events', $int );

        // Automation — Twitter.
        $bool = array( 'sanitize_callback' => 'absint' );
        register_setting( 'culture_settings_automation', 'culture_twitter_enabled',             $bool );
        register_setting( 'culture_settings_automation', 'culture_twitter_api_key',             $text );
        register_setting( 'culture_settings_automation', 'culture_twitter_api_secret',          $text );
        register_setting( 'culture_settings_automation', 'culture_twitter_access_token',        $text );
        register_setting( 'culture_settings_automation', 'culture_twitter_access_token_secret', $text );
        register_setting( 'culture_settings_automation', 'culture_twitter_interval',            $text );

        // Advertising.
        register_setting( 'culture_settings_advertising', 'culture_ads_enabled',                     $bool );
        register_setting( 'culture_settings_advertising', 'culture_ads_publisher_id',                $text );
        register_setting( 'culture_settings_advertising', 'culture_ads_custom_script',               array( 'sanitize_callback' => 'wp_kses_post' ) );
        register_setting( 'culture_settings_advertising', 'culture_ads_slot_leaderboard_top',        $text );
        register_setting( 'culture_settings_advertising', 'culture_ads_slot_leaderboard_mid',        $text );
        register_setting( 'culture_settings_advertising', 'culture_ads_slot_leaderboard_pre_quotes', $text );
        register_setting( 'culture_settings_advertising', 'culture_ads_slot_hero_sidebar',           $text );
    }

    /**
     * Render the tabbed settings page.
     */
    public static function render_page() {
        $active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'payment';
        $tabs = array(
            'payment'      => __( 'Payment', 'culture-community' ),
            'gamification' => __( 'Gamification', 'culture-community' ),
            'referrals'    => __( 'Referrals', 'culture-community' ),
            'emails'       => __( 'Emails', 'culture-community' ),
            'membership'   => __( 'Membership', 'culture-community' ),
            'general'      => __( 'General', 'culture-community' ),
            'automation'   => __( 'Automation', 'culture-community' ),
            'advertising'  => __( 'Advertising', 'culture-community' ),
        );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Culture Community Settings', 'culture-community' ); ?></h1>

            <nav class="nav-tab-wrapper">
                <?php foreach ( $tabs as $slug => $label ) : ?>
                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-community&tab=' . $slug ) ); ?>"
                       class="nav-tab <?php echo $active_tab === $slug ? 'nav-tab-active' : ''; ?>">
                        <?php echo esc_html( $label ); ?>
                    </a>
                <?php endforeach; ?>
            </nav>

            <form method="post" action="options.php">
                <?php settings_fields( 'culture_settings_' . $active_tab ); ?>

                <?php
                switch ( $active_tab ) {
                    case 'gamification':
                        self::render_gamification_tab();
                        break;
                    case 'referrals':
                        self::render_referrals_tab();
                        break;
                    case 'emails':
                        self::render_emails_tab();
                        break;
                    case 'membership':
                        self::render_membership_tab();
                        break;
                    case 'general':
                        self::render_general_tab();
                        break;
                    case 'automation':
                        self::render_automation_tab();
                        break;
                    case 'advertising':
                        self::render_advertising_tab();
                        break;
                    default:
                        self::render_payment_tab();
                        break;
                }
                ?>

                <?php submit_button(); ?>
            </form>
        </div>

        <script>
        jQuery(document).ready(function($) {
            $('.culture-color-picker').wpColorPicker();
        });
        </script>
        <?php
    }

    /* -------------------------------------------------------------- */
    /*  Tab renderers                                                  */
    /* -------------------------------------------------------------- */

    private static function render_payment_tab() {
        ?>
        <h2><?php esc_html_e( 'Paystack Payment Gateway', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Configure your Paystack API keys for processing Patron subscription payments.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_paystack_public_key"><?php esc_html_e( 'Public Key', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_paystack_public_key" name="culture_paystack_public_key"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_public_key' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Your Paystack public/test key (starts with pk_).', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_paystack_secret_key"><?php esc_html_e( 'Secret Key', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_paystack_secret_key" name="culture_paystack_secret_key"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_secret_key' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Your Paystack secret/test key (starts with sk_). Keep this private.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h3><?php esc_html_e( 'Nigeria (NGN) Plans', 'culture-community' ); ?></h3>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_paystack_plan_monthly_ngn"><?php esc_html_e( 'Monthly Plan Code (NGN)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_paystack_plan_monthly_ngn" name="culture_paystack_plan_monthly_ngn"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_plan_monthly_ngn' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Paystack plan code for NGN Monthly (PLN_...).', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_paystack_amount_monthly_ngn"><?php esc_html_e( 'Monthly Price (NGN)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_paystack_amount_monthly_ngn" name="culture_paystack_amount_monthly_ngn"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_amount_monthly_ngn' ) ); ?>" class="small-text" />
                    <p class="description"><?php esc_html_e( 'Price in Naira (e.g. 4500). Used for display and as fallback.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_paystack_plan_yearly_ngn"><?php esc_html_e( 'Yearly Plan Code (NGN)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_paystack_plan_yearly_ngn" name="culture_paystack_plan_yearly_ngn"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_plan_yearly_ngn' ) ); ?>" class="regular-text" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_paystack_amount_yearly_ngn"><?php esc_html_e( 'Yearly Price (NGN)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_paystack_amount_yearly_ngn" name="culture_paystack_amount_yearly_ngn"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_amount_yearly_ngn' ) ); ?>" class="small-text" />
                </td>
            </tr>
        </table>

        <hr />
        <h3><?php esc_html_e( 'Stripe Configuration (International Gateway)', 'culture-community' ); ?></h3>
        <p class="description"><?php esc_html_e( 'If configured, USD transactions will use Stripe instead of Paystack.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_stripe_publishable_key"><?php esc_html_e( 'Publishable Key', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_stripe_publishable_key" name="culture_stripe_publishable_key"
                           value="<?php echo esc_attr( self::get( 'culture_stripe_publishable_key' ) ); ?>" class="regular-text" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_stripe_secret_key"><?php esc_html_e( 'Secret Key', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_stripe_secret_key" name="culture_stripe_secret_key"
                           value="<?php echo esc_attr( self::get( 'culture_stripe_secret_key' ) ); ?>" class="regular-text" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_stripe_price_monthly_usd"><?php esc_html_e( 'Monthly Price ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_stripe_price_monthly_usd" name="culture_stripe_price_monthly_usd"
                           value="<?php echo esc_attr( self::get( 'culture_stripe_price_monthly_usd' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'The Stripe Price ID for the $4 subscription (price_...).', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_stripe_price_yearly_usd"><?php esc_html_e( 'Yearly Price ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_stripe_price_yearly_usd" name="culture_stripe_price_yearly_usd"
                           value="<?php echo esc_attr( self::get( 'culture_stripe_price_yearly_usd' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'The Stripe Price ID for the $40 subscription (price_...).', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }

    private static function render_gamification_tab() {
        ?>
        <h2><?php esc_html_e( 'Point Values', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Set how many Culture Points members earn for each action.', 'culture-community' ); ?></p>
        <table class="form-table">
            <?php
            $point_fields = array(
                'culture_points_event_rsvp'          => __( 'Event RSVP', 'culture-community' ),
                'culture_points_event_checkin'       => __( 'Event Check-in', 'culture-community' ),
                'culture_points_newsletter_comment'  => __( 'Newsletter Comment', 'culture-community' ),
                'culture_points_newsletter_reaction' => __( 'Newsletter Reaction', 'culture-community' ),
                'culture_points_referral'            => __( 'Successful Referral', 'culture-community' ),
            );
            foreach ( $point_fields as $key => $label ) :
            ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
                    <td>
                        <input type="number" id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>"
                               value="<?php echo esc_attr( self::get( $key ) ); ?>" min="0" step="1" class="small-text" />
                        <span class="description"><?php esc_html_e( 'points', 'culture-community' ); ?></span>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>

        <h2><?php esc_html_e( 'Badge Thresholds', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Set the thresholds required to unlock each badge.', 'culture-community' ); ?></p>
        <table class="form-table">
            <?php
            $badge_fields = array(
                'culture_badge_first_steps'     => array( __( 'First Steps', 'culture-community' ), __( 'events attended', 'culture-community' ) ),
                'culture_badge_regular'         => array( __( 'Regular', 'culture-community' ), __( 'events attended', 'culture-community' ) ),
                'culture_badge_culture_vulture' => array( __( 'Culture Vulture', 'culture-community' ), __( 'events attended', 'culture-community' ) ),
                'culture_badge_explorer'        => array( __( 'Explorer', 'culture-community' ), __( 'different chapters visited', 'culture-community' ) ),
                'culture_badge_globetrotter'    => array( __( 'Globetrotter', 'culture-community' ), __( 'different chapters visited', 'culture-community' ) ),
                'culture_badge_commentator'     => array( __( 'Commentator', 'culture-community' ), __( 'digest comments', 'culture-community' ) ),
                'culture_badge_century_club'    => array( __( 'Century Club', 'culture-community' ), __( 'total points', 'culture-community' ) ),
            );
            foreach ( $badge_fields as $key => $meta ) :
            ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $meta[0] ); ?></label></th>
                    <td>
                        <input type="number" id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>"
                               value="<?php echo esc_attr( self::get( $key ) ); ?>" min="1" step="1" class="small-text" />
                        <span class="description"><?php echo esc_html( $meta[1] ); ?></span>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
        <?php
    }

    private static function render_referrals_tab() {
        ?>
        <h2><?php esc_html_e( 'Referral Settings', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Configure how the referral system works.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_referral_cookie_days"><?php esc_html_e( 'Referral Cookie Duration', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_referral_cookie_days" name="culture_referral_cookie_days"
                           value="<?php echo esc_attr( self::get( 'culture_referral_cookie_days' ) ); ?>" min="1" max="365" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'days — how long the referral tracking cookie lasts after a visitor clicks a referral link.', 'culture-community' ); ?></span>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php esc_html_e( 'Points per Referral', 'culture-community' ); ?></th>
                <td>
                    <p class="description">
                        <?php
                        printf(
                            /* translators: %s: link to gamification tab */
                            esc_html__( 'Currently set to %s points. Change this in the %s tab.', 'culture-community' ),
                            '<strong>' . esc_html( self::get( 'culture_points_referral' ) ) . '</strong>',
                            '<a href="' . esc_url( admin_url( 'admin.php?page=culture-community&tab=gamification' ) ) . '">' . esc_html__( 'Gamification', 'culture-community' ) . '</a>'
                        );
                        ?>
                    </p>
                </td>
            </tr>
        </table>
        <?php
    }

    private static function render_emails_tab() {
        ?>
        <h2><?php esc_html_e( 'Email Branding', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Customise the appearance of outgoing plugin emails.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_email_from_name"><?php esc_html_e( 'From Name', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_email_from_name" name="culture_email_from_name"
                           value="<?php echo esc_attr( self::get( 'culture_email_from_name' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'The sender name displayed in members\' inboxes.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_email_header_color"><?php esc_html_e( 'Header Background Color', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_email_header_color" name="culture_email_header_color"
                           value="<?php echo esc_attr( self::get( 'culture_email_header_color' ) ); ?>" class="culture-color-picker" data-default-color="#2c3e50" />
                    <p class="description"><?php esc_html_e( 'Background colour for the email header bar.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_email_button_color"><?php esc_html_e( 'Button Color', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_email_button_color" name="culture_email_button_color"
                           value="<?php echo esc_attr( self::get( 'culture_email_button_color' ) ); ?>" class="culture-color-picker" data-default-color="#e67e22" />
                    <p class="description"><?php esc_html_e( 'Background colour for call-to-action buttons in emails.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Email Notifications', 'culture-community' ); ?></h2>
        <p class="description">
            <?php esc_html_e( 'The following automated emails are sent by the plugin.', 'culture-community' ); ?>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-email-templates' ) ); ?>" class="button button-secondary" style="margin-left:10px;">
                <?php esc_html_e( 'Edit Email Templates', 'culture-community' ); ?> &rarr;
            </a>
        </p>
        <table class="widefat fixed striped" style="max-width:700px;">
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Email', 'culture-community' ); ?></th>
                    <th><?php esc_html_e( 'Trigger', 'culture-community' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr><td><?php esc_html_e( 'Welcome', 'culture-community' ); ?></td><td><?php esc_html_e( 'New member registers', 'culture-community' ); ?></td></tr>
                <tr><td><?php esc_html_e( 'Referral Confirmation', 'culture-community' ); ?></td><td><?php esc_html_e( 'Someone joins via referral link', 'culture-community' ); ?></td></tr>
                <tr><td><?php esc_html_e( 'Payment Receipt', 'culture-community' ); ?></td><td><?php esc_html_e( 'Paystack subscription payment succeeds', 'culture-community' ); ?></td></tr>
                <tr><td><?php esc_html_e( 'Grace Period Warning', 'culture-community' ); ?></td><td><?php esc_html_e( 'Subscription payment fails', 'culture-community' ); ?></td></tr>
                <tr><td><?php esc_html_e( 'Downgrade Notice', 'culture-community' ); ?></td><td><?php esc_html_e( 'Grace period expires, account downgraded', 'culture-community' ); ?></td></tr>
            </tbody>
        </table>
        <?php
    }

    private static function render_membership_tab() {
        ?>
        <h2><?php esc_html_e( 'Membership Tiers', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Configure tier display names and grace period behavior.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_patron_label"><?php esc_html_e( 'Paid Tier Label', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_patron_label" name="culture_patron_label"
                           value="<?php echo esc_attr( self::get( 'culture_patron_label' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Display name for the paid membership tier (internally stored as "patron").', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_citizen_label"><?php esc_html_e( 'Free Tier Label', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_citizen_label" name="culture_citizen_label"
                           value="<?php echo esc_attr( self::get( 'culture_citizen_label' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Display name for the free membership tier (internally stored as "citizen").', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_grace_period_days"><?php esc_html_e( 'Grace Period', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_grace_period_days" name="culture_grace_period_days"
                           value="<?php echo esc_attr( self::get( 'culture_grace_period_days' ) ); ?>" min="1" max="90" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'days — how long to wait after a failed payment before downgrading a Patron to Citizen.', 'culture-community' ); ?></span>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Tier Benefits Summary', 'culture-community' ); ?></h2>
        <table class="widefat fixed striped" style="max-width:700px;">
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Feature', 'culture-community' ); ?></th>
                    <th><?php echo esc_html( self::get( 'culture_citizen_label' ) ); ?> (<?php esc_html_e( 'Free', 'culture-community' ); ?>)</th>
                    <th><?php echo esc_html( self::get( 'culture_patron_label' ) ); ?> (<?php esc_html_e( 'Paid', 'culture-community' ); ?>)</th>
                </tr>
            </thead>
            <tbody>
                <tr><td><?php esc_html_e( 'Virtual events', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Physical events', 'culture-community' ); ?></td><td>&#10007;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Primary chapter', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Secondary chapter', 'culture-community' ); ?></td><td>&#10007;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Cultural Digest', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Priority RSVP', 'culture-community' ); ?></td><td>&#10007;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Points & badges', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Referral system', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
            </tbody>
        </table>
        <?php
    }

    private static function render_general_tab() {
        ?>
        <h2><?php esc_html_e( 'General Settings', 'culture-community' ); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_api_secret"><?php esc_html_e( 'Next.js API Secret', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_api_secret" name="culture_api_secret"
                           value="<?php echo esc_attr( self::get( 'culture_api_secret' ) ); ?>" class="regular-text"
                           autocomplete="new-password" />
                    <p class="description">
                        <?php esc_html_e( 'Shared secret between this plugin and the Next.js frontend. Must match the CULTURE_API_SECRET environment variable on Vercel. Used to authenticate profile update and newsletter preference requests.', 'culture-community' ); ?>
                        <br><strong><?php esc_html_e( 'Generate a strong random string and paste the same value in both places.', 'culture-community' ); ?></strong>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_cron_secret"><?php esc_html_e( 'Cron Secret', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_cron_secret" name="culture_cron_secret"
                           value="<?php echo esc_attr( self::get( 'culture_cron_secret' ) ); ?>" class="regular-text"
                           autocomplete="new-password" />
                    <p class="description">
                        <?php esc_html_e( 'Must match the CRON_SECRET environment variable on Vercel. Used by the Directory Tools admin page to trigger the AI seeder and generate featured images.', 'culture-community' ); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_frontend_url"><?php esc_html_e( 'Frontend Site URL', 'culture-community' ); ?></label></th>
                <td>
                    <input type="url" id="culture_frontend_url" name="culture_frontend_url"
                           value="<?php echo esc_attr( self::get( 'culture_frontend_url' ) ); ?>" class="large-text" placeholder="https://themoveee.com" />
                    <p class="description">
                        <?php esc_html_e( 'The public-facing Next.js frontend URL (no trailing slash). All subscriber-facing links in newsletter emails — unsubscribe, read online — will point here, never to the CMS backend.', 'culture-community' ); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_registration_page"><?php esc_html_e( 'Registration Page URL', 'culture-community' ); ?></label></th>
                <td>
                    <input type="url" id="culture_registration_page" name="culture_registration_page"
                           value="<?php echo esc_attr( self::get( 'culture_registration_page' ) ); ?>" class="large-text" placeholder="<?php echo esc_attr( home_url( '/register/' ) ); ?>" />
                    <p class="description"><?php esc_html_e( 'The URL of your registration/sign-up page. Used in referral links and email CTAs.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Analytics Dashboard', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Control how many items appear in the analytics dashboard tables.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_analytics_limit_top_members"><?php esc_html_e( 'Top Members Shown', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_analytics_limit_top_members" name="culture_analytics_limit_top_members"
                           value="<?php echo esc_attr( self::get( 'culture_analytics_limit_top_members' ) ); ?>" min="5" max="100" step="1" class="small-text" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_analytics_limit_events"><?php esc_html_e( 'Recent Events Shown', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_analytics_limit_events" name="culture_analytics_limit_events"
                           value="<?php echo esc_attr( self::get( 'culture_analytics_limit_events' ) ); ?>" min="5" max="100" step="1" class="small-text" />
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Shortcodes Reference', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Use these shortcodes on any page or post:', 'culture-community' ); ?></p>
        <table class="widefat fixed striped" style="max-width:700px;">
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Shortcode', 'culture-community' ); ?></th>
                    <th><?php esc_html_e( 'Description', 'culture-community' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr><td><code>[culture_passport]</code></td><td><?php esc_html_e( 'Member\'s Cultural Passport with points, badges and QR code.', 'culture-community' ); ?></td></tr>
                <tr><td><code>[culture_events]</code></td><td><?php esc_html_e( 'List of upcoming events with RSVP buttons.', 'culture-community' ); ?></td></tr>
                <tr><td><code>[culture_digest]</code></td><td><?php esc_html_e( 'Latest Cultural Digest newsletters.', 'culture-community' ); ?></td></tr>
                <tr><td><code>[culture_referral]</code></td><td><?php esc_html_e( 'Referral link widget with share button and stats.', 'culture-community' ); ?></td></tr>
                <tr><td><code>[culture_register]</code></td><td><?php esc_html_e( 'Multi-step registration wizard.', 'culture-community' ); ?></td></tr>
            </tbody>
        </table>
        <?php
    }

    private static function render_automation_tab() {
        $next_dir    = wp_next_scheduled( 'culture_seed_directory' );
        $next_pulse  = wp_next_scheduled( 'culture_refresh_pulse' );
        $next_events = wp_next_scheduled( 'culture_seed_events' );
        $next_quotes = wp_next_scheduled( 'culture_seed_quotes' );
        $next_tweet  = wp_next_scheduled( 'culture_tweet_pulse' );
        ?>
        <h2><?php esc_html_e( 'Scheduled Jobs', 'culture-community' ); ?></h2>
        <p class="description">
            <?php esc_html_e( 'All automation is handled by WordPress Cron, triggered by a real server cron on Lightsail every 30 minutes. Make sure DISABLE_WP_CRON is set to true in wp-config.php.', 'culture-community' ); ?>
        </p>
        <table class="widefat fixed striped" style="max-width:700px;margin-bottom:2em;">
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Job', 'culture-community' ); ?></th>
                    <th><?php esc_html_e( 'Frequency', 'culture-community' ); ?></th>
                    <th><?php esc_html_e( 'Next Run', 'culture-community' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php
                $jobs = array(
                    array( __( 'Directory Seed', 'culture-community' ),  __( 'Weekly', 'culture-community' ),       $next_dir ),
                    array( __( 'Pulse Refresh', 'culture-community' ),   __( 'Daily', 'culture-community' ),        $next_pulse ),
                    array( __( 'Events Seed', 'culture-community' ),     __( 'Daily', 'culture-community' ),        $next_events ),
                    array( __( 'Quotes Seed', 'culture-community' ),     __( 'Weekly', 'culture-community' ),       $next_quotes ),
                    array( __( 'Tweet Pulse', 'culture-community' ),     __( 'Every 30 min', 'culture-community' ), $next_tweet ),
                );
                foreach ( $jobs as $job ) :
                    $ts  = $job[2];
                    $due = $ts ? esc_html( get_date_from_gmt( gmdate( 'Y-m-d H:i:s', $ts ), 'Y-m-d H:i:s' ) ) : '<span style="color:#d63638">' . esc_html__( 'Not scheduled', 'culture-community' ) . '</span>';
                ?>
                <tr>
                    <td><?php echo esc_html( $job[0] ); ?></td>
                    <td><?php echo esc_html( $job[1] ); ?></td>
                    <td><?php echo wp_kses_post( $due ); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <h2><?php esc_html_e( 'Twitter / X Auto-Posting', 'culture-community' ); ?></h2>
        <p class="description">
            <?php esc_html_e( 'When enabled, the latest unposted Pulse story is tweeted every 30 minutes. Requires a Twitter Developer App with Read & Write permissions and an Access Token generated for your posting account.', 'culture-community' ); ?>
        </p>
        <table class="form-table">
            <tr>
                <th scope="row"><?php esc_html_e( 'Enable Auto-Posting', 'culture-community' ); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="culture_twitter_enabled" value="1"
                               <?php checked( '1', Culture_Settings::get( 'culture_twitter_enabled' ) ); ?> />
                        <?php esc_html_e( 'Post new Pulse stories to X / Twitter automatically', 'culture-community' ); ?>
                    </label>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_twitter_api_key"><?php esc_html_e( 'API Key (Consumer Key)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_twitter_api_key" name="culture_twitter_api_key"
                           value="<?php echo esc_attr( Culture_Settings::get( 'culture_twitter_api_key' ) ); ?>"
                           class="regular-text" autocomplete="new-password" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_twitter_api_secret"><?php esc_html_e( 'API Secret (Consumer Secret)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_twitter_api_secret" name="culture_twitter_api_secret"
                           value="<?php echo esc_attr( Culture_Settings::get( 'culture_twitter_api_secret' ) ); ?>"
                           class="regular-text" autocomplete="new-password" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_twitter_access_token"><?php esc_html_e( 'Access Token', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_twitter_access_token" name="culture_twitter_access_token"
                           value="<?php echo esc_attr( Culture_Settings::get( 'culture_twitter_access_token' ) ); ?>"
                           class="regular-text" autocomplete="new-password" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_twitter_access_token_secret"><?php esc_html_e( 'Access Token Secret', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_twitter_access_token_secret" name="culture_twitter_access_token_secret"
                           value="<?php echo esc_attr( Culture_Settings::get( 'culture_twitter_access_token_secret' ) ); ?>"
                           class="regular-text" autocomplete="new-password" />
                    <p class="description">
                        <?php esc_html_e( 'Get these from developer.twitter.com → Your App → Keys and Tokens. Generate an Access Token for your @Moveee account under "Authentication Tokens".', 'culture-community' ); ?>
                    </p>
                </td>
            </tr>
        </table>
        <?php
    }

    private static function render_advertising_tab() {
        ?>
        <h2><?php esc_html_e( 'Google Ads / AdSense', 'culture-community' ); ?></h2>
        <p class="description">
            <?php esc_html_e( 'Configure Google AdSense or Ad Manager. Set your Publisher ID and individual slot IDs for each placement. Leave a slot empty to hide that placement entirely — no blank space will appear on the frontend.', 'culture-community' ); ?>
        </p>

        <table class="form-table">
            <tr>
                <th scope="row"><?php esc_html_e( 'Enable Ads', 'culture-community' ); ?></th>
                <td>
                    <label>
                        <input type="checkbox" name="culture_ads_enabled" value="1"
                               <?php checked( '1', self::get( 'culture_ads_enabled' ) ); ?> />
                        <?php esc_html_e( 'Show ads on the frontend', 'culture-community' ); ?>
                    </label>
                    <p class="description"><?php esc_html_e( 'Master switch. Uncheck to pause all ads instantly without losing your slot IDs.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_ads_publisher_id"><?php esc_html_e( 'Publisher ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_ads_publisher_id" name="culture_ads_publisher_id"
                           value="<?php echo esc_attr( self::get( 'culture_ads_publisher_id' ) ); ?>"
                           class="regular-text" placeholder="ca-pub-0000000000000000" />
                    <p class="description"><?php esc_html_e( 'Your AdSense Publisher ID — found in your AdSense account under Account → Account information.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Ad Slot IDs', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Paste the data-ad-slot value for each placement. Find these in your AdSense account under Ads → By ad unit.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_ads_slot_leaderboard_top"><?php esc_html_e( 'Leaderboard — Top', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_ads_slot_leaderboard_top" name="culture_ads_slot_leaderboard_top"
                           value="<?php echo esc_attr( self::get( 'culture_ads_slot_leaderboard_top' ) ); ?>"
                           class="regular-text" placeholder="1234567890" />
                    <p class="description"><?php esc_html_e( 'Appears between the hero section and the magazine strip.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_ads_slot_leaderboard_mid"><?php esc_html_e( 'Leaderboard — Mid', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_ads_slot_leaderboard_mid" name="culture_ads_slot_leaderboard_mid"
                           value="<?php echo esc_attr( self::get( 'culture_ads_slot_leaderboard_mid' ) ); ?>"
                           class="regular-text" placeholder="1234567890" />
                    <p class="description"><?php esc_html_e( 'Appears between the magazine strip and happenings.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_ads_slot_leaderboard_pre_quotes"><?php esc_html_e( 'Leaderboard — Pre Quotes', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_ads_slot_leaderboard_pre_quotes" name="culture_ads_slot_leaderboard_pre_quotes"
                           value="<?php echo esc_attr( self::get( 'culture_ads_slot_leaderboard_pre_quotes' ) ); ?>"
                           class="regular-text" placeholder="1234567890" />
                    <p class="description"><?php esc_html_e( 'Appears above the Quotes section.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_ads_slot_hero_sidebar"><?php esc_html_e( 'Hero Sidebar', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_ads_slot_hero_sidebar" name="culture_ads_slot_hero_sidebar"
                           value="<?php echo esc_attr( self::get( 'culture_ads_slot_hero_sidebar' ) ); ?>"
                           class="regular-text" placeholder="1234567890" />
                    <p class="description"><?php esc_html_e( 'Appears in the right column of the hero section, between stories and the Pulse widget.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Custom Script', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Optional — paste a raw JavaScript snippet here (e.g. Google Tag Manager, Ad Manager tag, or any other ad network initialisation code). Do not include &lt;script&gt; tags. Leave blank if using standard AdSense above.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_ads_custom_script"><?php esc_html_e( 'Custom Ad Script', 'culture-community' ); ?></label></th>
                <td>
                    <textarea id="culture_ads_custom_script" name="culture_ads_custom_script"
                              rows="8" class="large-text code"
                              placeholder="// e.g. GTM or Ad Manager initialisation JS"><?php echo esc_textarea( self::get( 'culture_ads_custom_script' ) ); ?></textarea>
                    <p class="description"><?php esc_html_e( 'Injected as an inline &lt;script&gt; tag on every page after interactive (afterInteractive strategy). Only active when "Enable Ads" is checked.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }
}
