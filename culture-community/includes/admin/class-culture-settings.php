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
        'culture_paystack_public_key'  => '',
        'culture_paystack_secret_key'  => '',
        'culture_paystack_plan_code'   => '',

        // Gamification – point values.
        'culture_points_event_rsvp'          => 5,
        'culture_points_event_checkin'       => 15,
        'culture_points_newsletter_comment'  => 10,
        'culture_points_newsletter_reaction' => 2,
        'culture_points_referral'            => 25,

        // Gamification – badge thresholds.
        'culture_badge_first_steps'    => 1,
        'culture_badge_regular'        => 5,
        'culture_badge_culture_vulture'=> 25,
        'culture_badge_explorer'       => 3,
        'culture_badge_globetrotter'   => 10,
        'culture_badge_commentator'    => 10,
        'culture_badge_century_club'   => 100,

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
        'culture_analytics_limit_top_members' => 10,
        'culture_analytics_limit_events'      => 10,
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
        register_setting( self::OPTION_GROUP, 'culture_paystack_public_key', $text );
        register_setting( self::OPTION_GROUP, 'culture_paystack_secret_key', $text );
        register_setting( self::OPTION_GROUP, 'culture_paystack_plan_code', $text );

        // Gamification – points.
        register_setting( self::OPTION_GROUP, 'culture_points_event_rsvp', $int );
        register_setting( self::OPTION_GROUP, 'culture_points_event_checkin', $int );
        register_setting( self::OPTION_GROUP, 'culture_points_newsletter_comment', $int );
        register_setting( self::OPTION_GROUP, 'culture_points_newsletter_reaction', $int );
        register_setting( self::OPTION_GROUP, 'culture_points_referral', $int );

        // Gamification – badge thresholds.
        register_setting( self::OPTION_GROUP, 'culture_badge_first_steps', $int );
        register_setting( self::OPTION_GROUP, 'culture_badge_regular', $int );
        register_setting( self::OPTION_GROUP, 'culture_badge_culture_vulture', $int );
        register_setting( self::OPTION_GROUP, 'culture_badge_explorer', $int );
        register_setting( self::OPTION_GROUP, 'culture_badge_globetrotter', $int );
        register_setting( self::OPTION_GROUP, 'culture_badge_commentator', $int );
        register_setting( self::OPTION_GROUP, 'culture_badge_century_club', $int );

        // Referrals.
        register_setting( self::OPTION_GROUP, 'culture_referral_cookie_days', $int );

        // Emails.
        register_setting( self::OPTION_GROUP, 'culture_email_from_name', $text );
        register_setting( self::OPTION_GROUP, 'culture_email_header_color', $color );
        register_setting( self::OPTION_GROUP, 'culture_email_button_color', $color );

        // Membership.
        register_setting( self::OPTION_GROUP, 'culture_grace_period_days', $int );
        register_setting( self::OPTION_GROUP, 'culture_patron_label', $text );
        register_setting( self::OPTION_GROUP, 'culture_citizen_label', $text );

        // General.
        register_setting( self::OPTION_GROUP, 'culture_registration_page', $text );
        register_setting( self::OPTION_GROUP, 'culture_analytics_limit_top_members', $int );
        register_setting( self::OPTION_GROUP, 'culture_analytics_limit_events', $int );
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
                <?php settings_fields( self::OPTION_GROUP ); ?>

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
            <tr>
                <th scope="row"><label for="culture_paystack_plan_code"><?php esc_html_e( 'Plan Code (Patron)', 'culture-community' ); ?></label></th>
                <td>
                    <input type="text" id="culture_paystack_plan_code" name="culture_paystack_plan_code"
                           value="<?php echo esc_attr( self::get( 'culture_paystack_plan_code' ) ); ?>" class="regular-text" />
                    <p class="description"><?php esc_html_e( 'The Paystack subscription plan code for the Patron tier (starts with PLN_).', 'culture-community' ); ?></p>
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
}
