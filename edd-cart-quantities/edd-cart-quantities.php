<?php
/**
 * Plugin Name:       EDD Cart Quantities
 * Plugin URI:        https://themoveee.com
 * Description:       Real-time quantity adjustment for Easy Digital Downloads — checkout, cart, and download pages.
 * Version:           1.0.5
 * Author:            The Moveee
 * License:           GPL-2.0-or-later
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * EDD Tested up to:  3.3
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'EDDCQ_VERSION', '1.0.5' );
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

		// Render a quantity input inside the download purchase form (PHP-side).
		add_action( 'edd_purchase_download_form_top', [ $this, 'render_download_qty' ], 10, 2 );

		foreach ( [ 'wp_ajax_', 'wp_ajax_nopriv_' ] as $prefix ) {
			add_action( $prefix . 'eddcq_update', [ $this, 'ajax_update' ] );
		}
	}

	// ─── Page detection helpers ────────────────────────────────────────────────

	private function is_cart_page(): bool {
		if ( function_exists( 'edd_is_cart' ) && edd_is_cart() ) {
			return true;
		}
		$cart_page = (int) edd_get_option( 'cart_page', 0 );
		return $cart_page > 0 && is_page( $cart_page );
	}

	// ─── Assets ────────────────────────────────────────────────────────────────

	public function enqueue(): void {
		$is_checkout = function_exists( 'edd_is_checkout' ) && edd_is_checkout();
		$is_cart     = $this->is_cart_page();
		$is_download = is_singular( 'download' );

		if ( ! $is_checkout && ! $is_cart && ! $is_download ) {
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
			'ajaxUrl'         => admin_url( 'admin-ajax.php' ),
			'nonce'           => wp_create_nonce( 'eddcq_nonce' ),
			// Currency formatting so JS can rebuild price strings client-side.
			'currencySymbol'  => html_entity_decode( edd_currency_symbol() ),
			'currencyPos'     => edd_get_option( 'currency_position', 'before' ),
			'decimalSep'      => edd_get_option( 'decimal_separator', '.' ),
			'thousandsSep'    => edd_get_option( 'thousands_separator', ',' ),
			'decimals'        => (int) edd_get_option( 'decimal_count', 2 ),
		] );
	}

	// ─── Download page: render a qty input inside the purchase form ────────────

	public function render_download_qty( int $download_id, array $args ): void {
		// Skip if EDD already outputs a quantity field.
		if ( ! empty( $args['show_quantity'] ) ) {
			return;
		}
		?>
		<div class="eddcq-dl-qty-wrap">
			<label class="eddcq-dl-label" for="eddcq_dl_qty_<?php echo esc_attr( $download_id ); ?>">
				<?php esc_html_e( 'Quantity', 'eddcq' ); ?>
			</label>
			<div class="eddcq-wrap eddcq-wrap--inline">
				<button class="eddcq-btn eddcq-minus" type="button" aria-label="<?php esc_attr_e( 'Decrease', 'eddcq' ); ?>">&#8722;</button>
				<input
					id="eddcq_dl_qty_<?php echo esc_attr( $download_id ); ?>"
					class="eddcq-input edd_item_quantity"
					name="quantity"
					type="number"
					value="1"
					min="1"
					max="999"
					aria-label="<?php esc_attr_e( 'Quantity', 'eddcq' ); ?>"
				>
				<button class="eddcq-btn eddcq-plus" type="button" aria-label="<?php esc_attr_e( 'Increase', 'eddcq' ); ?>">+</button>
			</div>
		</div>
		<?php
	}

	// ─── AJAX: persist quantity, return updated totals ─────────────────────────

	public function ajax_update(): void {
		check_ajax_referer( 'eddcq_nonce', 'nonce' );

		$cart_key = isset( $_POST['cart_key'] ) ? absint( $_POST['cart_key'] ) : false;
		$quantity  = isset( $_POST['quantity'] )  ? absint( $_POST['quantity'] )  : 1;

		if ( false === $cart_key ) {
			wp_send_json_error( 'Invalid cart key.' );
		}

		$quantity = max( 1, $quantity );

		if ( method_exists( EDD()->cart, 'set_item_quantity' ) ) {
			$ok = EDD()->cart->set_item_quantity( $cart_key, $quantity );
		} else {
			$cart = edd_get_cart_contents();
			if ( ! isset( $cart[ $cart_key ] ) ) {
				wp_send_json_error( 'Cart item not found.' );
			}
			$cart[ $cart_key ]['quantity'] = $quantity;
			EDD()->session->set( 'edd_cart', $cart );
			$ok = true;
		}

		if ( ! $ok ) {
			wp_send_json_error( 'Update failed.' );
		}

		wp_send_json_success( [
			'subtotal' => edd_currency_filter( edd_format_amount( edd_get_cart_subtotal() ) ),
			'total'    => edd_currency_filter( edd_format_amount( edd_get_cart_total() ) ),
		] );
	}

	public function missing_edd_notice(): void {
		echo '<div class="notice notice-error"><p><strong>EDD Cart Quantities</strong> requires Easy Digital Downloads.</p></div>';
	}
}

EDDCQ_Plugin::instance();
