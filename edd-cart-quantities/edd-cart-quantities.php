<?php
/**
 * Plugin Name:       EDD Cart Quantities
 * Plugin URI:        https://themoveee.com
 * Description:       Real-time quantity adjustment for Easy Digital Downloads cart items on the checkout page.
 * Version:           1.0.0
 * Author:            The Moveee
 * License:           GPL-2.0-or-later
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * EDD Tested up to:  3.3
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'EDDCQ_VERSION', '1.0.0' );
define( 'EDDCQ_URL', plugin_dir_url( __FILE__ ) );

final class EDDCQ_Plugin {

	private static ?self $instance = null;

	public static function instance(): self {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'plugins_loaded', [ $this, 'init' ] );
	}

	public function init(): void {
		if ( ! class_exists( 'Easy_Digital_Downloads' ) ) {
			add_action( 'admin_notices', [ $this, 'missing_edd_notice' ] );
			return;
		}

		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue' ] );

		// Allow both logged-in and guest checkout users.
		foreach ( [ 'wp_ajax_', 'wp_ajax_nopriv_' ] as $prefix ) {
			add_action( $prefix . 'eddcq_update', [ $this, 'ajax_update' ] );
		}
	}

	// ─── Assets ────────────────────────────────────────────────────────────────

	public function enqueue(): void {
		if ( ! function_exists( 'edd_is_checkout' ) || ! edd_is_checkout() ) {
			return;
		}

		wp_enqueue_style(
			'eddcq',
			EDDCQ_URL . 'assets/css/cart-quantities.css',
			[],
			EDDCQ_VERSION
		);

		wp_enqueue_script(
			'eddcq',
			EDDCQ_URL . 'assets/js/cart-quantities.js',
			[ 'jquery' ],
			EDDCQ_VERSION,
			true
		);

		wp_localize_script( 'eddcq', 'eddcq', [
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'eddcq_nonce' ),
		] );
	}

	// ─── AJAX: update quantity and return fresh cart HTML ──────────────────────

	public function ajax_update(): void {
		check_ajax_referer( 'eddcq_nonce', 'nonce' );

		$cart_key = isset( $_POST['cart_key'] ) ? absint( $_POST['cart_key'] ) : false;
		$quantity  = isset( $_POST['quantity'] )  ? absint( $_POST['quantity'] )  : 1;

		if ( false === $cart_key ) {
			wp_send_json_error( 'Invalid cart key.' );
		}

		$quantity = max( 1, $quantity );

		// EDD 3.x exposes a typed method; fall back to direct session write for 2.x.
		if ( method_exists( EDD()->cart, 'set_item_quantity' ) ) {
			$updated = EDD()->cart->set_item_quantity( $cart_key, $quantity );
		} else {
			$cart = edd_get_cart_contents();
			if ( ! isset( $cart[ $cart_key ] ) ) {
				wp_send_json_error( 'Cart item not found.' );
			}
			$cart[ $cart_key ]['quantity'] = $quantity;
			EDD()->session->set( 'edd_cart', $cart );
			$updated = true;
		}

		if ( ! $updated ) {
			wp_send_json_error( 'Could not update cart.' );
		}

		// Capture fresh cart table HTML so JS can swap it in.
		ob_start();
		edd_checkout_cart();
		$cart_html = ob_get_clean();

		wp_send_json_success( [
			'cart_html' => $cart_html,
			'total'     => edd_currency_filter( edd_format_amount( edd_get_cart_total() ) ),
		] );
	}

	public function missing_edd_notice(): void {
		echo '<div class="notice notice-error"><p><strong>EDD Cart Quantities</strong> requires Easy Digital Downloads.</p></div>';
	}
}

EDDCQ_Plugin::instance();
