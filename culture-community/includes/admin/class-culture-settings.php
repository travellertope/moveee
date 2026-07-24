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

        // Shop.
        'culture_shop_fx_ngn_per_gbp'          => 1900,
        'culture_shop_flat_shipping_gbp'       => 4.99,

        // Gamification – point values. Every action awards both points and
        // credits — keep these in sync with Culture_Gamification::POINTS.
        'culture_points_event_rsvp'             => 5,
        'culture_points_event_checkin'          => 20,
        'culture_points_magazine_comment'       => 5,
        'culture_points_newsletter_comment'     => 10,
        'culture_points_newsletter_reaction'    => 1,
        'culture_points_referral'               => 30,
        'culture_points_quote_submission'       => 10,
        'culture_points_quote_like'             => 1,
        'culture_points_magazine_read'          => 1,
        'culture_points_magazine_share'         => 2,
        'culture_points_community_comment'      => 8,
        'culture_points_community_like'         => 1,
        'culture_points_directory_entry'        => 20,
        'culture_points_game_completed'         => 1,
        'culture_points_community_post'         => 10,
        'culture_points_profile_completed'      => 15,
        'culture_points_email_verified'         => 5,
        'culture_points_directory_opt_in'       => 10,
        'culture_points_newsletter_subscribed'  => 5,
        'culture_points_poll_vote'              => 1,

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
        'culture_google_client_id_web'     => '',
        'culture_google_client_id_ios'      => '',
        'culture_google_client_id_android'  => '',
        'culture_analytics_limit_top_members' => 10,
        'culture_analytics_limit_events'      => 10,

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
        $key = 'culture_badge_' . $badge_slug;
        // Use the BADGES constant threshold as the canonical default
        $default = 0;
        if ( class_exists( 'Culture_Gamification' ) && isset( Culture_Gamification::BADGES[ $badge_slug ]['threshold'] ) ) {
            $default = (int) Culture_Gamification::BADGES[ $badge_slug ]['threshold'];
        } elseif ( isset( self::$defaults[ $key ] ) ) {
            $default = (int) self::$defaults[ $key ];
        }
        $saved = get_option( $key, null );
        return ( $saved !== null && (int) $saved > 0 ) ? (int) $saved : $default;
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

        // Shop (multi-currency + flat-rate fallback shipping).
        register_setting( 'culture_settings_payment', 'culture_shop_fx_ngn_per_gbp', array( 'sanitize_callback' => 'floatval' ) );
        register_setting( 'culture_settings_payment', 'culture_shop_flat_shipping_gbp', array( 'sanitize_callback' => 'floatval' ) );

        // Credits – per action bonuses. Every action awards both credits and
        // reputation, so this list mirrors the Reputation tab's action list.
        $credit_keys = array(
            'culture_credits_event_rsvp', 'culture_credits_event_checkin',
            'culture_credits_referral', 'culture_credits_newsletter_comment',
            'culture_credits_newsletter_reaction',
            'culture_credits_quote_submission', 'culture_credits_quote_like',
            'culture_credits_magazine_read',
            'culture_credits_magazine_share', 'culture_credits_directory_entry',
            'culture_credits_community_comment', 'culture_credits_community_like',
            'culture_credits_game_completed', 'culture_credits_community_post',
            'culture_credits_profile_completed', 'culture_credits_email_verified',
            'culture_credits_directory_opt_in', 'culture_credits_newsletter_subscribed',
            'culture_credits_poll_vote',
        );
        foreach ( $credit_keys as $key ) {
            register_setting( 'culture_settings_credits', $key, $int );
        }
        register_setting( 'culture_settings_credits', 'culture_daily_credit_cap', $int );
        register_setting( 'culture_settings_credits', 'culture_credits_per_gbp', $int );
        register_setting( 'culture_settings_credits', 'culture_credits_per_usd', $int );
        register_setting( 'culture_settings_credits', 'culture_credits_per_ngn', $int );
        register_setting( 'culture_settings_credits', 'culture_credits_post_validated_standard', $int );
        register_setting( 'culture_settings_credits', 'culture_credits_post_validated_special', $int );

        // Reputation – per action. Uses the culture_points_* option prefix —
        // this is the prefix actually read at award time by
        // Culture_Gamification::get_point_value()/award_points(). (The legacy
        // culture_rep_* per-action keys were never read anywhere and have been
        // retired; culture_rep_tier_* below is unrelated and still live.)
        $rep_keys = array(
            'culture_points_event_rsvp', 'culture_points_event_checkin',
            'culture_points_newsletter_comment', 'culture_points_newsletter_reaction',
            'culture_points_referral', 'culture_points_quote_submission', 'culture_points_quote_like',
            'culture_points_magazine_read', 'culture_points_magazine_share',
            'culture_points_community_comment', 'culture_points_community_like',
            'culture_points_directory_entry', 'culture_points_game_completed',
            'culture_points_community_post', 'culture_points_profile_completed',
            'culture_points_email_verified', 'culture_points_directory_opt_in',
            'culture_points_newsletter_subscribed', 'culture_points_poll_vote',
        );
        foreach ( $rep_keys as $key ) {
            register_setting( 'culture_settings_reputation', $key, $int );
        }
        register_setting( 'culture_settings_reputation', 'culture_rep_tier_contributor', $int );
        register_setting( 'culture_settings_reputation', 'culture_rep_tier_taste-maker', $int );
        register_setting( 'culture_settings_reputation', 'culture_rep_tier_authority', $int );

        // Gamification – badge thresholds, dynamically registered from BADGES constant.
        if ( class_exists( 'Culture_Gamification' ) ) {
            foreach ( array_keys( Culture_Gamification::BADGES ) as $slug ) {
                register_setting( 'culture_settings_gamification', 'culture_badge_' . $slug, $int );
            }
        }

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
        register_setting( 'culture_settings_general', 'culture_google_client_id_web', $text );
        register_setting( 'culture_settings_general', 'culture_google_client_id_ios', $text );
        register_setting( 'culture_settings_general', 'culture_google_client_id_android', $text );
        register_setting( 'culture_settings_general', 'culture_analytics_limit_top_members', $int );
        register_setting( 'culture_settings_general', 'culture_analytics_limit_events', $int );

        // Cloudflare R2 storage (mobile media uploads).
        register_setting( 'culture_settings_general', 'culture_r2_account_id', $text );
        register_setting( 'culture_settings_general', 'culture_r2_access_key_id', $text );
        register_setting( 'culture_settings_general', 'culture_r2_secret_access_key', $text );
        register_setting( 'culture_settings_general', 'culture_r2_bucket_name', $text );
        register_setting( 'culture_settings_general', 'culture_r2_public_url', array( 'sanitize_callback' => 'esc_url_raw' ) );

        // Literati Connect / Stoop (culture_cluster CPT).
        register_setting( 'culture_settings_general', 'culture_cluster_min_activation_members', $int );
        register_setting( 'culture_settings_general', 'culture_cluster_forming_window_days', $int );
        register_setting( 'culture_settings_general', 'culture_cluster_default_capacity', $int );
        register_setting( 'culture_settings_general', 'culture_cluster_election_window_days', $int );


        // Advertising.
        register_setting( 'culture_settings_moderation', 'culture_community_blocklist', array(
            'sanitize_callback' => 'sanitize_textarea_field',
        ) );
        register_setting( 'culture_settings_moderation', 'culture_new_member_review_days', $int );

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
            'credits'      => __( 'Credits', 'culture-community' ),
            'reputation'   => __( 'Reputation', 'culture-community' ),
            'referrals'    => __( 'Referrals', 'culture-community' ),
            'emails'       => __( 'Emails', 'culture-community' ),
            'membership'   => __( 'Membership', 'culture-community' ),
            'general'      => __( 'General', 'culture-community' ),
            'moderation'   => __( 'Moderation', 'culture-community' ),
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
                    case 'credits':
                        self::render_credits_tab();
                        break;
                    case 'reputation':
                        self::render_reputation_tab();
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
                    case 'moderation':
                        self::render_moderation_tab();
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

        <hr />
        <h3><?php esc_html_e( 'Lifestyle Shop', 'culture-community' ); ?></h3>
        <p class="description"><?php esc_html_e( 'Shop products are priced in GBP (the WooCommerce store currency). Nigerian shoppers are shown a converted NGN price and pay via Paystack at this rate; everyone else pays in GBP via Stripe. The underlying order is always recorded in GBP.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_shop_fx_ngn_per_gbp"><?php esc_html_e( 'NGN per GBP exchange rate', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" step="0.01" id="culture_shop_fx_ngn_per_gbp" name="culture_shop_fx_ngn_per_gbp"
                           value="<?php echo esc_attr( self::get( 'culture_shop_fx_ngn_per_gbp' ) ); ?>" class="small-text" />
                    <p class="description"><?php esc_html_e( 'Update periodically to track the market rate. Used to convert GBP shop prices to NGN for display and Paystack charges.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_shop_flat_shipping_gbp"><?php esc_html_e( 'Fallback flat shipping (GBP)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" step="0.01" id="culture_shop_flat_shipping_gbp" name="culture_shop_flat_shipping_gbp"
                           value="<?php echo esc_attr( self::get( 'culture_shop_flat_shipping_gbp' ) ); ?>" class="small-text" />
                    <p class="description"><?php esc_html_e( 'Used only for a package if no WooCommerce shipping zone matches the destination address.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }

    private static function render_gamification_tab() {
        if ( ! class_exists( 'Culture_Gamification' ) ) return;
        $badges = Culture_Gamification::BADGES;

        // Human-readable unit label per trigger type
        $trigger_labels = array(
            'event_count'           => __( 'events attended', 'culture-community' ),
            'city_count'            => __( 'different cities visited', 'culture-community' ),
            'comment_count'         => __( 'newsletter comments', 'culture-community' ),
            'points'                => __( 'total reputation', 'culture-community' ),
            'quote_count'           => __( 'quotes shared', 'culture-community' ),
            'quote_likes_count'     => __( 'quote likes received', 'culture-community' ),
            'dir_entry_count'       => __( 'directory entries submitted', 'culture-community' ),
            'total_comment_count'   => __( 'total comments', 'culture-community' ),
            'magazine_read_count'   => __( 'articles read', 'culture-community' ),
            'magazine_share_count'  => __( 'articles shared', 'culture-community' ),
            'community_post_count'  => __( 'community posts', 'culture-community' ),
            'community_comment_count' => __( 'community comments', 'culture-community' ),
            'food_review_count'     => __( 'food reviews', 'culture-community' ),
            'cultural_take_count'   => __( 'cultural takes', 'culture-community' ),
            'itinerary_count'       => __( 'itineraries created', 'culture-community' ),
            'poll_count'            => __( 'polls created', 'culture-community' ),
            'hidden_gem_count'      => __( 'hidden gems shared', 'culture-community' ),
            'referral_count'        => __( 'successful referrals', 'culture-community' ),
            'profile_completed'     => __( 'profile completed (boolean)', 'culture-community' ),
            'directory_opted_in'    => __( 'opted into directory (boolean)', 'culture-community' ),
            'post_reactions_count'  => __( 'reactions received on posts', 'culture-community' ),
            'passkey_registered'    => __( 'passkey registered (boolean)', 'culture-community' ),
            'like_count'            => __( 'likes given', 'culture-community' ),
        );
        ?>
        <h2><?php esc_html_e( 'Badge Thresholds', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Set the threshold required to unlock each badge. Credit and reputation values per action are configured in the Credits and Reputation tabs.', 'culture-community' ); ?></p>
        <table class="form-table">
            <?php foreach ( $badges as $slug => $badge ) :
                $key     = 'culture_badge_' . $slug;
                $default = (int) $badge['threshold'];
                $saved   = get_option( $key, null );
                $display = ( $saved !== null && (int) $saved > 0 ) ? (int) $saved : $default;
                $unit    = isset( $trigger_labels[ $badge['trigger'] ] ) ? $trigger_labels[ $badge['trigger'] ] : $badge['trigger'];
            ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $badge['name'] ); ?></label></th>
                    <td>
                        <input type="number" id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>"
                               value="<?php echo esc_attr( $display ); ?>" min="1" step="1" class="small-text" />
                        <span class="description"><?php echo esc_html( $unit ); ?>
                            <em style="color:#888;margin-left:4px;">(default: <?php echo (int) $default; ?>)</em>
                        </span>
                        <p class="description" style="color:#999;font-size:11px;margin-top:2px;"><?php echo esc_html( $badge['description'] ); ?></p>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
        <?php
    }

    private static function render_credits_tab() {
        // Helper: resolve default from CREDIT_BONUSES constant if class exists.
        $credit_defaults = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::CREDIT_BONUSES : array();

        $credit_actions = array(
            'event_rsvp'             => __( 'Event RSVP', 'culture-community' ),
            'event_checkin'          => __( 'Event Check-in', 'culture-community' ),
            'referral'               => __( 'Successful Referral', 'culture-community' ),
            'newsletter_comment'     => __( 'Newsletter Comment', 'culture-community' ),
            'newsletter_reaction'    => __( 'Newsletter Reaction', 'culture-community' ),
            'quote_submission'       => __( 'Quote Submitted', 'culture-community' ),
            'quote_like'             => __( 'Quote Liked by Others', 'culture-community' ),
            'magazine_read'          => __( 'Magazine Article Read', 'culture-community' ),
            'magazine_share'         => __( 'Magazine Article Shared', 'culture-community' ),
            'directory_entry'        => __( 'Directory Entry Submitted', 'culture-community' ),
            'community_comment'      => __( 'Community Comment', 'culture-community' ),
            'community_like'         => __( 'Community Reaction', 'culture-community' ),
            'game_completed'         => __( 'Game Completed', 'culture-community' ),
            'community_post'         => __( 'Community Post Submitted', 'culture-community' ),
            'profile_completed'      => __( 'Profile Completed', 'culture-community' ),
            'email_verified'         => __( 'Email Verified', 'culture-community' ),
            'directory_opt_in'       => __( 'Opted into Member Directory', 'culture-community' ),
            'newsletter_subscribed'  => __( 'Newsletter Subscribed', 'culture-community' ),
            'poll_vote'              => __( 'Poll Vote', 'culture-community' ),
        );
        ?>
        <h2><?php esc_html_e( 'Credit Bonuses per Action', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Credits are spendable and capped daily. Set how many credits each action awards.', 'culture-community' ); ?></p>
        <table class="form-table">
            <?php foreach ( $credit_actions as $action => $label ) :
                $key     = 'culture_credits_' . $action;
                $default = isset( $credit_defaults[ $action ] ) ? $credit_defaults[ $action ] : 0;
                $value   = get_option( $key, $default );
            ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
                    <td>
                        <input type="number" id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>"
                               value="<?php echo esc_attr( $value ); ?>" min="0" step="1" class="small-text" />
                        <span class="description"><?php esc_html_e( 'credits', 'culture-community' ); ?></span>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>

        <h2><?php esc_html_e( 'Post Validation Credits', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Credits awarded when a community post reaches the validation threshold (5 reactions or 3 unique commenters).', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_credits_post_validated_standard"><?php esc_html_e( 'Standard Post', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_credits_post_validated_standard" name="culture_credits_post_validated_standard"
                           value="<?php echo esc_attr( get_option( 'culture_credits_post_validated_standard', 10 ) ); ?>" min="0" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'credits (default: 10)', 'culture-community' ); ?></span>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_credits_post_validated_special"><?php esc_html_e( 'Special Posts (Place, Food Review)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_credits_post_validated_special" name="culture_credits_post_validated_special"
                           value="<?php echo esc_attr( get_option( 'culture_credits_post_validated_special', 15 ) ); ?>" min="0" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'credits (default: 15)', 'culture-community' ); ?></span>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Daily Credit Cap', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Maximum credits a member can earn in a single calendar day, across all actions.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_daily_credit_cap"><?php esc_html_e( 'Daily Cap', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_daily_credit_cap" name="culture_daily_credit_cap"
                           value="<?php echo esc_attr( get_option( 'culture_daily_credit_cap', 50 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'credits per day (default: 50)', 'culture-community' ); ?></span>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Currency Exchange Rates', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'How many credits equal 1 unit of each currency. Used for cashout calculations.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_credits_per_gbp"><?php esc_html_e( 'Credits per £1 GBP', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_credits_per_gbp" name="culture_credits_per_gbp"
                           value="<?php echo esc_attr( get_option( 'culture_credits_per_gbp', 10 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'credits = £1 (default: 10)', 'culture-community' ); ?></span>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_credits_per_usd"><?php esc_html_e( 'Credits per $1 USD', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_credits_per_usd" name="culture_credits_per_usd"
                           value="<?php echo esc_attr( get_option( 'culture_credits_per_usd', 13 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'credits = $1 (default: 13)', 'culture-community' ); ?></span>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_credits_per_ngn"><?php esc_html_e( 'Credits per ₦1,000 NGN', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_credits_per_ngn" name="culture_credits_per_ngn"
                           value="<?php echo esc_attr( get_option( 'culture_credits_per_ngn', 8 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'credits = ₦1,000 (default: 8)', 'culture-community' ); ?></span>
                </td>
            </tr>
        </table>
        <?php
    }

    private static function render_reputation_tab() {
        // Helper: resolve defaults from POINTS constant if class exists.
        $rep_defaults = class_exists( 'Culture_Gamification' ) ? Culture_Gamification::POINTS : array();

        $rep_actions = array(
            'event_rsvp'             => __( 'Event RSVP', 'culture-community' ),
            'event_checkin'          => __( 'Event Check-in', 'culture-community' ),
            'referral'               => __( 'Successful Referral', 'culture-community' ),
            'newsletter_comment'     => __( 'Newsletter Comment', 'culture-community' ),
            'newsletter_reaction'    => __( 'Newsletter Reaction', 'culture-community' ),
            'quote_submission'       => __( 'Quote Submitted', 'culture-community' ),
            'quote_like'             => __( 'Quote Liked by Others', 'culture-community' ),
            'magazine_read'          => __( 'Magazine Article Read', 'culture-community' ),
            'magazine_share'         => __( 'Magazine Article Shared', 'culture-community' ),
            'community_comment'      => __( 'Community Comment', 'culture-community' ),
            'community_like'         => __( 'Community Reaction', 'culture-community' ),
            'directory_entry'        => __( 'Directory Entry Submitted', 'culture-community' ),
            'game_completed'         => __( 'Game Completed', 'culture-community' ),
            'community_post'         => __( 'Community Post Submitted', 'culture-community' ),
            'profile_completed'      => __( 'Profile Completed', 'culture-community' ),
            'email_verified'         => __( 'Email Verified', 'culture-community' ),
            'directory_opt_in'       => __( 'Opted into Member Directory', 'culture-community' ),
            'newsletter_subscribed'  => __( 'Newsletter Subscribed', 'culture-community' ),
            'poll_vote'              => __( 'Poll Vote', 'culture-community' ),
        );

        ?>
        <h2><?php esc_html_e( 'Reputation per Action', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Reputation is permanent — it never decreases and cannot be spent. Every action awards both reputation and credits (see the Credits tab).', 'culture-community' ); ?></p>
        <table class="form-table">
            <?php foreach ( $rep_actions as $action => $label ) :
                $key     = 'culture_points_' . $action;
                $default = isset( $rep_defaults[ $action ] ) ? $rep_defaults[ $action ] : 0;
                $value   = get_option( $key, $default );
            ?>
                <tr>
                    <th scope="row"><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
                    <td>
                        <input type="number" id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>"
                               value="<?php echo esc_attr( $value ); ?>" min="0" step="1" class="small-text" />
                        <span class="description"><?php esc_html_e( 'reputation', 'culture-community' ); ?></span>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>

        <h2><?php esc_html_e( 'Reputation Tier Thresholds', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'The minimum reputation score required to reach each tier. Tiers are evaluated in descending order — a member reaches the highest tier their score qualifies for.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_rep_tier_contributor"><?php esc_html_e( 'Culture Contributor', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_rep_tier_contributor" name="culture_rep_tier_contributor"
                           value="<?php echo esc_attr( get_option( 'culture_rep_tier_contributor', 100 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'reputation (default: 100)', 'culture-community' ); ?></span>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_rep_tier_taste-maker"><?php esc_html_e( 'Taste Maker', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_rep_tier_taste-maker" name="culture_rep_tier_taste-maker"
                           value="<?php echo esc_attr( get_option( 'culture_rep_tier_taste-maker', 500 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'reputation (default: 500)', 'culture-community' ); ?></span>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_rep_tier_authority"><?php esc_html_e( 'Culture Authority', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_rep_tier_authority" name="culture_rep_tier_authority"
                           value="<?php echo esc_attr( get_option( 'culture_rep_tier_authority', 1500 ) ); ?>" min="1" step="1" class="small-text" />
                    <span class="description"><?php esc_html_e( 'reputation (default: 1500)', 'culture-community' ); ?></span>
                </td>
            </tr>
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
                <tr><td><?php esc_html_e( 'Physical &amp; virtual events', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'GetMeLit &amp; Culture Drop', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Cash out credits', 'culture-community' ); ?></td><td>&#10007;</td><td>&#10003;</td></tr>
                <tr><td><?php esc_html_e( 'Daily credit cap', 'culture-community' ); ?></td><td>50</td><td>100</td></tr>
                <tr><td><?php esc_html_e( 'Games plays per day', 'culture-community' ); ?></td><td>1</td><td>5</td></tr>
                <tr><td><?php esc_html_e( 'Points &amp; badges', 'culture-community' ); ?></td><td>&#10003;</td><td>&#10003;</td></tr>
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

        <h2><?php esc_html_e( 'Google Sign-In', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'OAuth Client IDs from Google Cloud Console, used to validate Google ID tokens on login. Leave a field blank to disable Google Sign-In for that surface.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_google_client_id_web"><?php esc_html_e( 'Web Client ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_google_client_id_web" name="culture_google_client_id_web"
                           value="<?php echo esc_attr( self::get( 'culture_google_client_id_web' ) ); ?>" class="large-text"
                           placeholder="xxxxxxxxxx.apps.googleusercontent.com" />
                    <p class="description"><?php esc_html_e( 'Used by the Next.js (web.themoveee.com) NextAuth Google provider. Must match the GOOGLE_CLIENT_ID environment variable on Vercel.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_google_client_id_ios"><?php esc_html_e( 'iOS Client ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_google_client_id_ios" name="culture_google_client_id_ios"
                           value="<?php echo esc_attr( self::get( 'culture_google_client_id_ios' ) ); ?>" class="large-text"
                           placeholder="xxxxxxxxxx.apps.googleusercontent.com" />
                    <p class="description"><?php esc_html_e( 'Used by the mobile app on iOS via expo-auth-session.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_google_client_id_android"><?php esc_html_e( 'Android Client ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_google_client_id_android" name="culture_google_client_id_android"
                           value="<?php echo esc_attr( self::get( 'culture_google_client_id_android' ) ); ?>" class="large-text"
                           placeholder="xxxxxxxxxx.apps.googleusercontent.com" />
                    <p class="description"><?php esc_html_e( 'Used by the mobile app on Android via expo-auth-session.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Cloudflare R2 Storage', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Credentials for the shared media bucket. Mobile app uploads (community post images, avatars, cover photos) are stored here, the same bucket used by the web app.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_r2_account_id"><?php esc_html_e( 'Account ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_r2_account_id" name="culture_r2_account_id"
                           value="<?php echo esc_attr( self::get( 'culture_r2_account_id' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'Must match the R2_ACCOUNT_ID environment variable on Vercel.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_r2_access_key_id"><?php esc_html_e( 'Access Key ID', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_r2_access_key_id" name="culture_r2_access_key_id"
                           value="<?php echo esc_attr( self::get( 'culture_r2_access_key_id' ) ); ?>" class="regular-text"
                           autocomplete="new-password" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_r2_secret_access_key"><?php esc_html_e( 'Secret Access Key', 'culture-community' ); ?></label></th>
                <td>
                    <input type="password" id="culture_r2_secret_access_key" name="culture_r2_secret_access_key"
                           value="<?php echo esc_attr( self::get( 'culture_r2_secret_access_key' ) ); ?>" class="regular-text"
                           autocomplete="new-password" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_r2_bucket_name"><?php esc_html_e( 'Bucket Name', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_r2_bucket_name" name="culture_r2_bucket_name"
                           value="<?php echo esc_attr( self::get( 'culture_r2_bucket_name' ) ); ?>" class="regular-text" placeholder="moveee-media" />
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_r2_public_url"><?php esc_html_e( 'Public URL', 'culture-community' ); ?></label></th>
                <td>
                    <input type="url" id="culture_r2_public_url" name="culture_r2_public_url"
                           value="<?php echo esc_attr( self::get( 'culture_r2_public_url' ) ); ?>" class="large-text" placeholder="https://media.themoveee.com" />
                    <p class="description"><?php esc_html_e( 'Public base URL the bucket is served from. Must match R2_PUBLIC_URL on Vercel.', 'culture-community' ); ?></p>
                </td>
            </tr>
        </table>

        <h2><?php esc_html_e( 'Literati Connect / Stoop', 'culture-community' ); ?></h2>
        <p class="description"><?php esc_html_e( 'Controls the culture_cluster CPT lifecycle — area-level Stoop clusters that form, activate, and (if they never reach enough members) auto-archive.', 'culture-community' ); ?></p>
        <table class="form-table">
            <tr>
                <th scope="row"><label for="culture_cluster_min_activation_members"><?php esc_html_e( 'Min. Members to Activate', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_cluster_min_activation_members" name="culture_cluster_min_activation_members"
                           value="<?php echo esc_attr( self::get( 'culture_cluster_min_activation_members' ) ?: 4 ); ?>" min="2" max="50" step="1" class="small-text" />
                    <p class="description"><?php esc_html_e( 'Number of active members a "forming" cluster needs to auto-flip to "active" and become publicly discoverable.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_cluster_forming_window_days"><?php esc_html_e( 'Forming Window (days)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_cluster_forming_window_days" name="culture_cluster_forming_window_days"
                           value="<?php echo esc_attr( self::get( 'culture_cluster_forming_window_days' ) ?: 30 ); ?>" min="1" max="120" step="1" class="small-text" />
                    <p class="description"><?php esc_html_e( 'A cluster still "forming" after this many days is auto-archived by the daily cron sweep, notifying the founder.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_cluster_default_capacity"><?php esc_html_e( 'Default Capacity', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_cluster_default_capacity" name="culture_cluster_default_capacity"
                           value="<?php echo esc_attr( self::get( 'culture_cluster_default_capacity' ) ?: 12 ); ?>" min="0" max="500" step="1" class="small-text" />
                    <p class="description"><?php esc_html_e( 'Default member cap for a newly-founded cluster unless the founder overrides it. 0 = unlimited.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row"><label for="culture_cluster_election_window_days"><?php esc_html_e( 'Host Election Window (days)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="number" id="culture_cluster_election_window_days" name="culture_cluster_election_window_days"
                           value="<?php echo esc_attr( self::get( 'culture_cluster_election_window_days' ) ?: 7 ); ?>" min="1" max="30" step="1" class="small-text" />
                    <p class="description"><?php esc_html_e( 'Reserved for the Phase 2 host-election flow — how long voting stays open after a host vacancy is triggered.', 'culture-community' ); ?></p>
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
                <tr><td><code>[culture_digest]</code></td><td><?php esc_html_e( 'Latest newsletter issues (GetMeLit / Culture Drop).', 'culture-community' ); ?></td></tr>
                <tr><td><code>[culture_referral]</code></td><td><?php esc_html_e( 'Referral link widget with share button and stats.', 'culture-community' ); ?></td></tr>
                <tr><td><code>[culture_register]</code></td><td><?php esc_html_e( 'Multi-step registration wizard.', 'culture-community' ); ?></td></tr>
            </tbody>
        </table>
        <?php
    }

    private static function render_moderation_tab() {
        $blocklist   = get_option( 'culture_community_blocklist', '' );
        $review_days = (int) get_option( 'culture_new_member_review_days', 7 );
        ?>
        <h2><?php esc_html_e( 'Community Moderation', 'culture-community' ); ?></h2>
        <p><?php esc_html_e( 'Configure spam protection for the Connect community feed.', 'culture-community' ); ?></p>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="culture_new_member_review_days"><?php esc_html_e( 'New-member review period', 'culture-community' ); ?></label>
                </th>
                <td>
                    <input type="number" id="culture_new_member_review_days"
                           name="culture_new_member_review_days"
                           value="<?php echo esc_attr( $review_days ); ?>"
                           min="0" max="90" style="width:80px;" />
                    <?php esc_html_e( 'days', 'culture-community' ); ?>
                    <p class="description"><?php esc_html_e( 'Posts from accounts registered within this many days are held as Pending until approved. Set to 0 to disable.', 'culture-community' ); ?></p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="culture_community_blocklist"><?php esc_html_e( 'Custom blocked phrases', 'culture-community' ); ?></label>
                </th>
                <td>
                    <textarea id="culture_community_blocklist"
                              name="culture_community_blocklist"
                              rows="12"
                              style="width:100%;max-width:600px;font-family:monospace;font-size:13px;"
                    ><?php echo esc_textarea( $blocklist ); ?></textarea>
                    <p class="description">
                        <?php esc_html_e( 'One phrase or word per line. Case-insensitive. Single words are matched as whole words; multi-word phrases match anywhere in the post. These are added on top of the built-in default list in the codebase.', 'culture-community' ); ?>
                    </p>
                    <p class="description">
                        <?php esc_html_e( 'Changes take effect within 5 minutes (Next.js caches the list).', 'culture-community' ); ?>
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
