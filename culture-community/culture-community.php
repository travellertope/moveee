<?php
/**
 * Plugin Name: Culture Community
 * Plugin URI:  https://themoveee.com
 * Description: Core plugin for Moveee Connect — membership tiers, community feed, newsletters, events, gamification, and mobile API.
 * Version:     2.0.0
 * Author:      Moveee
 * Text Domain: culture-community
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'CULTURE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CULTURE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Core includes.
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-post-types.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-community.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-gamification.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-referrals.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-newsletter-queue.php';
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-nl-analytics.php';

// Admin includes.
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-settings.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-newsletter-send.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-subscribers.php';
require_once CULTURE_PLUGIN_DIR . 'includes/admin/class-culture-email-templates.php';

// Email helpers.
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-emails.php';

// Payment gateways.
require_once CULTURE_PLUGIN_DIR . 'includes/payment/class-culture-paystack.php';
require_once CULTURE_PLUGIN_DIR . 'includes/payment/class-culture-stripe.php';

// Directory.
require_once CULTURE_PLUGIN_DIR . 'includes/core/class-culture-directory.php';

// API includes.
require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-rest-api.php';
require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-mobile-api.php';
require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-ajax.php';

// Frontend includes.
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-shortcodes.php';
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-registration.php';
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-leader-dashboard.php';
require_once CULTURE_PLUGIN_DIR . 'includes/frontend/class-culture-templates.php';

// Event RSVP.
require_once CULTURE_PLUGIN_DIR . 'includes/api/class-culture-event-rsvp.php';

/**
 * Bootstrap all plugin subsystems.
 */
function culture_community_init() {
    Culture_Post_Types::init();
    Culture_Gamification::init();
    Culture_REST_API::init();
    Culture_Mobile_API::init();
    Culture_Ajax::init();
    Culture_Shortcodes::init();
    Culture_Paystack::init();

    if ( class_exists( 'Culture_NL_Analytics' ) ) {
        Culture_NL_Analytics::init();
    }

    if ( class_exists( 'Culture_Event_RSVP' ) ) {
        Culture_Event_RSVP::init();
    }

    if ( class_exists( 'Culture_Settings' ) ) {
        Culture_Settings::init();
    }

    if ( class_exists( 'Culture_Newsletter_Send' ) ) {
        Culture_Newsletter_Send::init();
    }

    if ( class_exists( 'Culture_Subscribers' ) ) {
        Culture_Subscribers::init();
    }

    if ( class_exists( 'Culture_Registration' ) ) {
        Culture_Registration::init();
    }

    if ( class_exists( 'Culture_Leader_Dashboard' ) ) {
        Culture_Leader_Dashboard::init();
    }

    if ( class_exists( 'Culture_Email_Templates' ) ) {
        Culture_Email_Templates::init();
    }
}
add_action( 'plugins_loaded', 'culture_community_init' );
