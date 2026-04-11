<?php
/**
 * Plugin Name: Culture Connect
 * Plugin URI:  https://example.com/culture-connect
 * Description: A hybrid community plugin for culture lovers with dual-chapter membership, events, and gamification.
 * Version:     1.0.0
 * Author:      Antigravity
 * Author URI:  https://example.com
 * License:     GPL-2.0+
 * Text Domain: culture-connect
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Current plugin version.
 */
define( 'CULTURE_CONNECT_VERSION', '1.0.0' );

/**
 * The code that runs during plugin activation.
 */
function activate_culture_connect() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/core/class-culture-activator.php';
	Culture_Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_culture_connect() {
	require_once plugin_dir_path( __FILE__ ) . 'includes/core/class-culture-deactivator.php';
	Culture_Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_culture_connect' );
register_deactivation_hook( __FILE__, 'deactivate_culture_connect' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path( __FILE__ ) . 'includes/core/class-culture-connect.php';

/**
 * Begins execution of the plugin.
 */
function run_culture_connect() {
	$plugin = new Culture_Connect();
	$plugin->run();
}
run_culture_connect();
