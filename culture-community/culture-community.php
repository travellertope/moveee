<?php
/**
 * Plugin Name: Culture Community
 * Plugin URI:  https://example.com/culture-community
 * Description: A hybrid culture community plugin with dual chapter membership, event access restrictions, gamification, and interactive newsletters.
 * Version:     1.0.0
 * Author:      Culture Community Team
 * License:     GPL-2.0+
 * Text Domain: culture-community
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'CULTURE_VERSION', '1.0.0' );
define( 'CULTURE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CULTURE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'CULTURE_PLUGIN_FILE', __FILE__ );

// Composer autoload.
$culture_autoload = CULTURE_PLUGIN_DIR . 'vendor/autoload.php';
if ( file_exists( $culture_autoload ) ) {
    require_once $culture_autoload;
}

// Core includes.
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-activator.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-post-types.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-gamification.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-referrals.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-cron.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-emails.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-newsletter-queue.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-nl-analytics.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-directory.php';

// API includes.
require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-rest-api.php';
require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-ajax.php';

// Frontend includes.
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-shortcodes.php';
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-registration.php';
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-leader-dashboard.php';
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-templates.php';

// Admin includes.
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-settings.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-analytics.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-email-templates.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-newsletter-send.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-subscribers.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-newsletter-importer.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-nl-analytics-admin.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-directory-tools.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-acf-fields.php';

// Payment includes.
require_once CULTURE_PLUGIN_DIR . 'includes/payment/class-culture-paystack.php';
require_once CULTURE_PLUGIN_DIR . 'includes/payment/class-culture-stripe.php';

/**
 * Plugin activation hook.
 */
function culture_community_activate() {
    Culture_Activator::activate();
}
register_activation_hook( __FILE__, 'culture_community_activate' );

/**
 * Plugin deactivation hook.
 */
function culture_community_deactivate() {
    Culture_Activator::deactivate();
}
register_deactivation_hook( __FILE__, 'culture_community_deactivate' );

/**
 * Initialize plugin components.
 */
function culture_community_init() {
    Culture_Post_Types::init();
    Culture_Gamification::init();
    Culture_REST_API::init();
    Culture_Ajax::init();
    Culture_Shortcodes::init();
    Culture_Paystack::init();
    Culture_Referrals::init();
    Culture_Cron::init();
    Culture_Registration::init();
    Culture_Leader_Dashboard::init();
    Culture_Emails::init();
    Culture_Newsletter_Queue::init();
    Culture_Newsletter_Send::init();
    Culture_Subscribers::init();
    Culture_NL_Analytics::init();
    Culture_NL_Analytics_Admin::init();
    Culture_Newsletter_Importer::init();
    Culture_Settings::init();
    Culture_Directory_Tools::init();
    Culture_Analytics::init();
    Culture_Email_Templates::init();
    Culture_Templates::init();
}
add_action( 'init', 'culture_community_init', 5 );

// Initialize ACF fields immediately to catch acf/init hook correctly.
Culture_ACF_Fields::init();

/**
 * Enqueue frontend assets.
 */
function culture_community_enqueue_assets() {
    wp_enqueue_style(
        'culture-community',
        CULTURE_PLUGIN_URL . 'assets/css/culture-community.css',
        array(),
        CULTURE_VERSION
    );
    wp_enqueue_script(
        'culture-community',
        CULTURE_PLUGIN_URL . 'assets/js/culture-community.js',
        array( 'jquery' ),
        CULTURE_VERSION,
        true
    );
    wp_localize_script( 'culture-community', 'cultureData', array(
        'ajaxUrl'  => admin_url( 'admin-ajax.php' ),
        'restUrl'  => rest_url( 'culture/v1/' ),
        'nonce'    => wp_create_nonce( 'culture_nonce' ),
        'restNonce' => wp_create_nonce( 'wp_rest' ),
    ) );
}
add_action( 'wp_enqueue_scripts', 'culture_community_enqueue_assets' );

/* Settings page is now handled by Culture_Settings class (includes/admin/class-culture-settings.php). */

/**
 * Check if the current user can view a target user's phone number.
 *
 * Phone numbers are private. Only the user themselves, administrators,
 * and chapter leaders of the target user's chapter(s) may see them.
 *
 * @param int $target_user_id The user whose phone number is being viewed.
 * @return bool
 */
function culture_can_view_phone( $target_user_id ) {
    $current_user_id = get_current_user_id();

    if ( ! $current_user_id ) {
        return false;
    }

    // Users can always see their own phone number.
    if ( $current_user_id === (int) $target_user_id ) {
        return true;
    }

    // Administrators can see all phone numbers.
    if ( current_user_can( 'manage_options' ) ) {
        return true;
    }

    // Chapter leaders can see phone numbers of members in their chapter.
    $leader_chapters = get_posts( array(
        'post_type'      => 'culture_chapter',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'meta_key'       => '_culture_chapter_leader_id',
        'meta_value'     => $current_user_id,
    ) );

    if ( ! empty( $leader_chapters ) ) {
        $target_primary   = get_user_meta( $target_user_id, '_culture_primary_chapter_id', true );
        $target_secondary = get_user_meta( $target_user_id, '_culture_secondary_chapter_id', true );

        foreach ( $leader_chapters as $chapter_id ) {
            if ( (int) $chapter_id === (int) $target_primary || (int) $chapter_id === (int) $target_secondary ) {
                return true;
            }
        }
    }

    return false;
}
