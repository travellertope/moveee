<?php
/**
 * In-house mobile checkout for the Moveee Lifestyle Shop (WooCommerce + WCFM
 * Marketplace). Replaces the hosted-checkout-page handoff for mobile with a
 * native flow: quote totals (real WC shipping zones) → pay (Paystack NGN /
 * Stripe everything-else) → webhook creates the real WC_Order.
 *
 * Order creation always goes through WC_Checkout::create_order(), the exact
 * method WooCommerce's own checkout form uses — this fires the standard
 * 'woocommerce_checkout_order_processed' / 'woocommerce_new_order' /
 * 'woocommerce_payment_complete' hooks that WCFM Marketplace relies on to
 * split the order per-vendor and credit vendor ledgers. Do not hand-roll
 * order creation with wc_create_order() + add_product() — that bypasses
 * those hooks and will silently break vendor payouts.
 *
 * Underlying WC_Order totals are always booked in the WooCommerce store
 * currency (GBP). Nigeria-resident shoppers see and pay a converted NGN
 * amount via Paystack; the order itself still records the true GBP total
 * (using the same FX rate at the moment of quoting) so vendor commissions
 * and reporting stay in one consistent currency.
 *
 * REST endpoints (all under /wp-json/culture/v1/):
 *   POST mobile/checkout/totals            — quote cart + real shipping rates (auth required)
 *   POST mobile/checkout/pay                — start payment for a quote (auth required)
 *   POST shop/checkout/webhook/paystack     — Paystack charge.success webhook
 *   POST shop/checkout/webhook/stripe       — Stripe checkout.session.completed webhook
 *   GET  mobile/checkout/order/{id}         — order status lookup (auth required, ownership-checked)
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Shop_Checkout {

    const QUOTE_TTL = 900;  // 15 minutes
    const PAY_TTL   = 1800; // 30 minutes

    public static function init(): void {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
        add_filter( 'woocommerce_payment_gateways', array( __CLASS__, 'register_gateway' ) );
    }

    // ── Internal payment gateway ──────────────────────────────────────────
    // Registered only so WC_Checkout::create_order() has a valid, enabled
    // payment_method to attach to the order. Never shown at a real
    // storefront checkout — Paystack/Stripe capture happens before this
    // gateway is ever touched; process_payment() is never called by our
    // flow (we call $order->payment_complete() directly from the webhook).

    public static function register_gateway( $gateways ) {
        $gateways[] = 'WC_Gateway_Culture_External';
        return $gateways;
    }

    // ── REST routes ───────────────────────────────────────────────────────

    public static function register_routes(): void {
        register_rest_route( 'culture/v1', '/mobile/checkout/totals', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_totals' ),
            'permission_callback' => array( 'Culture_Mobile_API', 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/checkout/pay', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_pay' ),
            'permission_callback' => array( 'Culture_Mobile_API', 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/shop/checkout/webhook/paystack', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_paystack_webhook' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/shop/checkout/webhook/stripe', array(
            'methods'             => 'POST',
            'callback'            => array( __CLASS__, 'handle_stripe_webhook' ),
            'permission_callback' => '__return_true',
        ) );

        register_rest_route( 'culture/v1', '/mobile/checkout/order/(?P<id>\d+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_order' ),
            'permission_callback' => array( 'Culture_Mobile_API', 'mobile_permission' ),
        ) );

        register_rest_route( 'culture/v1', '/mobile/checkout/order-by-reference/(?P<reference>[A-Za-z0-9\-]+)', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_get_order_by_reference' ),
            'permission_callback' => array( 'Culture_Mobile_API', 'mobile_permission' ),
        ) );
    }

    // ── Totals (quote) ───────────────────────────────────────────────────

    /**
     * POST /mobile/checkout/totals
     * Body: cart_items [{id, qty, variation_id?}], country, state, city,
     *       postcode, address_1, coupon_code?
     *
     * Populates a fresh WC cart/session for this request only (no reliance
     * on session continuity between requests — the resulting quote is
     * persisted in our own transient and resolved again in handle_pay()).
     */
    public static function handle_totals( WP_REST_Request $request ) {
        if ( ! function_exists( 'WC' ) ) {
            return new WP_Error( 'woocommerce_missing', 'WooCommerce not active', array( 'status' => 503 ) );
        }

        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Not logged in', array( 'status' => 401 ) );
        }

        $items = self::sanitize_cart_items( $request->get_param( 'cart_items' ) );
        if ( empty( $items ) ) {
            return new WP_Error( 'empty_cart', 'Cart is empty.', array( 'status' => 400 ) );
        }

        $address = array(
            'country'   => sanitize_text_field( $request->get_param( 'country' ) ?: '' ),
            'state'     => sanitize_text_field( $request->get_param( 'state' ) ?: '' ),
            'city'      => sanitize_text_field( $request->get_param( 'city' ) ?: '' ),
            'postcode'  => sanitize_text_field( $request->get_param( 'postcode' ) ?: '' ),
            'address_1' => sanitize_text_field( $request->get_param( 'address_1' ) ?: '' ),
        );
        $coupon_code = sanitize_text_field( $request->get_param( 'coupon_code' ) ?: '' );

        $cart_result = self::build_cart( $items, $address, $coupon_code );
        if ( is_wp_error( $cart_result ) ) {
            return $cart_result;
        }

        $shipping_options = self::get_shipping_options();
        $chosen            = self::choose_cheapest_rates( $shipping_options );
        $shipping_available = ! empty( $chosen );

        if ( $shipping_available ) {
            WC()->session->set( 'chosen_shipping_methods', $chosen );
            WC()->cart->calculate_shipping();
        }
        WC()->cart->calculate_totals();

        $fx = Culture_Mobile_API::resolve_shop_currency( $request );

        $subtotal = (float) WC()->cart->get_subtotal();
        $discount = (float) WC()->cart->get_discount_total();
        $shipping = (float) WC()->cart->get_shipping_total();
        $tax      = (float) WC()->cart->get_total_tax();
        $total    = (float) WC()->cart->get_total( 'edit' );

        $quote = array(
            'user_id'      => $user_id,
            'items'        => $items,
            'address'      => $address,
            'coupon_code'  => $coupon_code,
            'chosen_rates' => $chosen,
            'currency'     => 'GBP',
            'subtotal'     => $subtotal,
            'discount'     => $discount,
            'shipping'     => $shipping,
            'tax'          => $tax,
            'total'        => $total,
        );

        $quote_token = bin2hex( random_bytes( 24 ) );
        set_transient( 'culture_shop_quote_' . $quote_token, $quote, self::QUOTE_TTL );

        return rest_ensure_response( array(
            'quoteToken'        => $quote_token,
            'expiresInSeconds'  => self::QUOTE_TTL,
            'currency'          => 'GBP',
            'currencySymbol'    => '£',
            'subtotal'          => round( $subtotal, 2 ),
            'discount'          => round( $discount, 2 ),
            'shipping'          => round( $shipping, 2 ),
            'tax'               => round( $tax, 2 ),
            'total'             => round( $total, 2 ),
            'shippingAvailable' => $shipping_available,
            'shippingOptions'   => $shipping_options,
            'display'           => array(
                'currency'       => $fx['code'],
                'currencySymbol' => $fx['symbol'],
                'subtotal'       => Culture_Mobile_API::convert_shop_price( $subtotal, $fx ),
                'discount'       => Culture_Mobile_API::convert_shop_price( $discount, $fx ),
                'shipping'       => Culture_Mobile_API::convert_shop_price( $shipping, $fx ),
                'tax'            => Culture_Mobile_API::convert_shop_price( $tax, $fx ),
                'total'          => Culture_Mobile_API::convert_shop_price( $total, $fx ),
            ),
        ) );
    }

    // ── Pay ──────────────────────────────────────────────────────────────

    /**
     * POST /mobile/checkout/pay
     * Body: quote_token, name, email, phone (billing contact for the order
     *       and the payment gateway's receipt).
     *
     * Gateway selection mirrors the existing ticket/membership convention:
     * NGN (Nigeria-resident shopper) → Paystack, everything else → Stripe.
     */
    public static function handle_pay( WP_REST_Request $request ) {
        if ( ! function_exists( 'WC' ) ) {
            return new WP_Error( 'woocommerce_missing', 'WooCommerce not active', array( 'status' => 503 ) );
        }

        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Not logged in', array( 'status' => 401 ) );
        }

        $quote_token = sanitize_text_field( $request->get_param( 'quote_token' ) ?: '' );
        $quote       = $quote_token ? get_transient( 'culture_shop_quote_' . $quote_token ) : false;

        if ( ! $quote || (int) $quote['user_id'] !== $user_id ) {
            return new WP_Error( 'quote_expired', 'This quote has expired — please refresh your order summary.', array( 'status' => 410 ) );
        }

        $name  = sanitize_text_field( $request->get_param( 'name' ) ?: '' );
        $email = sanitize_email( $request->get_param( 'email' ) ?: '' );
        $phone = sanitize_text_field( $request->get_param( 'phone' ) ?: '' );

        if ( ! $name || ! is_email( $email ) ) {
            return new WP_Error( 'missing_contact', 'Name and a valid email are required.', array( 'status' => 400 ) );
        }

        $fx      = Culture_Mobile_API::resolve_shop_currency( $request );
        $gateway = ( 'NGN' === $fx['code'] ) ? 'paystack' : 'stripe';

        $reference = 'SHOP-' . strtoupper( bin2hex( random_bytes( 8 ) ) );

        $pending = $quote;
        $pending['name']     = $name;
        $pending['email']    = $email;
        $pending['phone']    = $phone;
        $pending['gateway']  = $gateway;
        $pending['fx_code']  = $fx['code'];
        $pending['fx_rate']  = $fx['rate'];
        set_transient( 'culture_shop_pay_' . $reference, $pending, self::PAY_TTL );

        $result = ( 'paystack' === $gateway )
            ? self::init_paystack( $reference, $email, $quote['total'], $fx )
            : self::init_stripe( $reference, $email, $quote['total'] );

        if ( is_wp_error( $result ) ) {
            delete_transient( 'culture_shop_pay_' . $reference );
            return $result;
        }

        return rest_ensure_response( array(
            'url'       => $result['url'],
            'reference' => $reference,
            'gateway'   => $gateway,
        ) );
    }

    private static function init_paystack( string $reference, string $email, float $total_gbp, array $fx ) {
        $display_total = round( $total_gbp * $fx['rate'], 2 );
        $amount_minor  = (int) round( $display_total * 100 );

        $response = Culture_Paystack::charge_initiate( array(
            'email'     => $email,
            'amount'    => $amount_minor,
            'currency'  => $fx['code'],
            'reference' => $reference,
            'metadata'  => array( 'shop_reference' => $reference ),
        ) );

        if ( is_wp_error( $response ) ) return $response;
        if ( empty( $response['data']['authorization_url'] ) ) {
            return new WP_Error( 'paystack_error', 'Could not initialize Paystack payment.' );
        }

        return array( 'url' => $response['data']['authorization_url'] );
    }

    private static function init_stripe( string $reference, string $email, float $total_gbp ) {
        $frontend_url = untrailingslashit( get_option( 'culture_frontend_url', home_url( '/' ) ) );
        $success_url  = $frontend_url . '/shop/order-confirmation?shop_ref=' . $reference . '&session_id={CHECKOUT_SESSION_ID}';
        $cancel_url   = $frontend_url . '/shop/cart?checkout_cancelled=1';

        $response = Culture_Stripe::payment_session( array(
            'mode'                => 'payment',
            'client_reference_id' => $reference,
            'customer_email'      => $email,
            'success_url'         => $success_url,
            'cancel_url'          => $cancel_url,
            'line_items'          => array( array(
                'price_data' => array(
                    'currency'     => 'gbp',
                    'unit_amount'  => (int) round( $total_gbp * 100 ),
                    'product_data' => array(
                        'name' => 'Moveee Shop order',
                    ),
                ),
                'quantity' => 1,
            ) ),
            'metadata' => array( 'shop_reference' => $reference ),
        ) );

        if ( is_wp_error( $response ) ) return $response;
        if ( empty( $response['url'] ) ) {
            return new WP_Error( 'stripe_error', 'Could not initialize Stripe payment.' );
        }

        return array( 'url' => $response['url'] );
    }

    // ── Webhooks ─────────────────────────────────────────────────────────

    public static function handle_paystack_webhook( WP_REST_Request $request ) {
        $payload   = $request->get_body();
        $signature = $request->get_header( 'x-paystack-signature' ) ?? '';
        $secret    = get_option( 'culture_paystack_secret_key', '' );

        if ( $secret && ! hash_equals( hash_hmac( 'sha512', $payload, $secret ), $signature ) ) {
            return new WP_REST_Response( array( 'error' => 'invalid_signature' ), 403 );
        }

        $data  = json_decode( $payload, true );
        $event = $data['event'] ?? '';

        if ( 'charge.success' === $event ) {
            $d         = $data['data'] ?? array();
            $reference = $d['reference'] ?? '';
            if ( $reference && str_starts_with( $reference, 'SHOP-' ) ) {
                self::confirm_order( $reference, $reference, 'paystack' );
            }
        }

        return new WP_REST_Response( array( 'status' => 'ok' ), 200 );
    }

    public static function handle_stripe_webhook( WP_REST_Request $request ) {
        $payload = $request->get_body();
        $data    = json_decode( $payload, true );

        if ( ! $data || ! isset( $data['type'] ) ) {
            return new WP_REST_Response( array( 'error' => 'invalid_payload' ), 400 );
        }

        $webhook_secret = get_option( 'culture_stripe_webhook_secret', '' );
        if ( $webhook_secret ) {
            $sig = $request->get_header( 'stripe-signature' ) ?? '';
            if ( ! self::verify_stripe_sig( $payload, $sig, $webhook_secret ) ) {
                return new WP_REST_Response( array( 'error' => 'invalid_signature' ), 403 );
            }
        }

        if ( 'checkout.session.completed' === $data['type'] ) {
            $session   = $data['data']['object'] ?? array();
            $reference = $session['client_reference_id'] ?? '';
            $charge_id = $session['payment_intent'] ?? ( $session['id'] ?? '' );
            if ( $reference && str_starts_with( $reference, 'SHOP-' ) ) {
                self::confirm_order( $reference, $charge_id, 'stripe' );
            }
        }

        return new WP_REST_Response( array( 'status' => 'ok' ), 200 );
    }

    /**
     * Creates the real WC_Order from the pending-pay transient and marks it
     * paid. Idempotent: if an order already exists for this reference
     * (looked up via order meta), does nothing.
     */
    private static function confirm_order( string $reference, string $transaction_id, string $gateway ): bool {
        global $wpdb;

        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_culture_shop_reference' AND meta_value = %s LIMIT 1",
            $reference
        ) );
        if ( $existing ) {
            return true; // already processed — idempotent
        }

        $pending = get_transient( 'culture_shop_pay_' . $reference );
        if ( ! $pending ) {
            return false; // expired or unknown reference
        }

        $cart_result = self::build_cart( $pending['items'], $pending['address'], $pending['coupon_code'] );
        if ( is_wp_error( $cart_result ) ) {
            return false;
        }

        if ( ! empty( $pending['chosen_rates'] ) ) {
            WC()->session->set( 'chosen_shipping_methods', $pending['chosen_rates'] );
            WC()->cart->calculate_shipping();
        }
        WC()->cart->calculate_totals();

        $name_parts = preg_split( '/\s+/', trim( $pending['name'] ), 2 );
        $first_name = $name_parts[0] ?? '';
        $last_name  = $name_parts[1] ?? '';
        $country_code = self::country_to_wc_code( $pending['address']['country'] ?? '' );

        $order_data = array(
            'billing_first_name'  => $first_name,
            'billing_last_name'   => $last_name,
            'billing_email'       => $pending['email'],
            'billing_phone'       => $pending['phone'],
            'billing_country'     => $country_code,
            'billing_state'       => $pending['address']['state'] ?? '',
            'billing_city'        => $pending['address']['city'] ?? '',
            'billing_postcode'    => $pending['address']['postcode'] ?? '',
            'billing_address_1'   => $pending['address']['address_1'] ?? '',
            'shipping_first_name' => $first_name,
            'shipping_last_name'  => $last_name,
            'shipping_country'    => $country_code,
            'shipping_state'      => $pending['address']['state'] ?? '',
            'shipping_city'       => $pending['address']['city'] ?? '',
            'shipping_postcode'   => $pending['address']['postcode'] ?? '',
            'shipping_address_1'  => $pending['address']['address_1'] ?? '',
            'payment_method'      => 'culture_external',
            'payment_method_title' => 'paystack' === $gateway ? 'Paystack' : 'Stripe',
        );

        try {
            $order = WC()->checkout()->create_order( $order_data );
        } catch ( Exception $e ) {
            return false;
        }

        if ( is_wp_error( $order ) || ! $order ) {
            return false;
        }

        $order = wc_get_order( $order );
        $order->set_customer_id( (int) $pending['user_id'] );
        $order->update_meta_data( '_culture_shop_reference', $reference );
        $order->update_meta_data( '_culture_shop_gateway', $gateway );
        $order->update_meta_data( '_culture_shop_fx_code', $pending['fx_code'] ?? 'GBP' );
        $order->update_meta_data( '_culture_shop_fx_rate', $pending['fx_rate'] ?? 1.0 );
        $order->save();

        $order->payment_complete( $transaction_id );

        delete_transient( 'culture_shop_pay_' . $reference );

        WC()->cart->empty_cart();

        return true;
    }

    // ── Order lookup ─────────────────────────────────────────────────────

    public static function handle_get_order( WP_REST_Request $request ) {
        $user_id  = get_current_user_id();
        $order_id = (int) $request['id'];

        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Not logged in', array( 'status' => 401 ) );
        }

        $order = wc_get_order( $order_id );
        if ( ! $order || (int) $order->get_customer_id() !== $user_id ) {
            return new WP_Error( 'not_found', 'Order not found', array( 'status' => 404 ) );
        }

        $items = array();
        foreach ( $order->get_items() as $item ) {
            $items[] = array(
                'name'     => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'total'    => (float) $item->get_total(),
            );
        }

        return rest_ensure_response( array(
            'id'            => $order->get_id(),
            'status'        => $order->get_status(),
            'total'         => (float) $order->get_total(),
            'currency'      => $order->get_currency(),
            'createdAt'     => $order->get_date_created() ? $order->get_date_created()->date( 'c' ) : null,
            'items'         => $items,
            'reference'     => $order->get_meta( '_culture_shop_reference' ),
        ) );
    }

    /**
     * GET /mobile/checkout/order-by-reference/{reference}
     * Lets the app poll for order creation after returning from the
     * Paystack/Stripe hosted payment page, before it knows the real WC
     * order ID (the order is only created once the webhook fires).
     */
    public static function handle_get_order_by_reference( WP_REST_Request $request ) {
        $user_id   = get_current_user_id();
        $reference = sanitize_text_field( $request['reference'] );

        if ( ! $user_id ) {
            return new WP_Error( 'unauthorized', 'Not logged in', array( 'status' => 401 ) );
        }

        global $wpdb;
        $order_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_culture_shop_reference' AND meta_value = %s LIMIT 1",
            $reference
        ) );

        if ( ! $order_id ) {
            $pending = get_transient( 'culture_shop_pay_' . $reference );
            if ( $pending && (int) $pending['user_id'] === $user_id ) {
                return rest_ensure_response( array( 'status' => 'pending' ) );
            }
            return new WP_Error( 'not_found', 'Order not found', array( 'status' => 404 ) );
        }

        $order = wc_get_order( (int) $order_id );
        if ( ! $order || (int) $order->get_customer_id() !== $user_id ) {
            return new WP_Error( 'not_found', 'Order not found', array( 'status' => 404 ) );
        }

        $request->set_param( 'id', $order->get_id() );
        return self::handle_get_order( $request );
    }

    // ── Shared cart/shipping helpers ────────────────────────────────────

    private static function sanitize_cart_items( $raw_items ): array {
        $items = array();
        if ( is_array( $raw_items ) ) {
            foreach ( $raw_items as $raw ) {
                $product_id   = absint( $raw['id'] ?? 0 );
                $variation_id = absint( $raw['variation_id'] ?? 0 );
                $qty          = max( 1, absint( $raw['qty'] ?? 1 ) );
                if ( $product_id > 0 ) {
                    $items[] = array( 'id' => $product_id, 'variation_id' => $variation_id, 'qty' => $qty );
                }
            }
        }
        return $items;
    }

    /**
     * Populates a fresh WC()->cart for the current request and sets the
     * customer address used for shipping/tax calculation. Does not persist
     * across requests — callers that need the cart again (handle_pay,
     * confirm_order) rebuild it from the items/address stored in their own
     * transient.
     */
    private static function build_cart( array $items, array $address, string $coupon_code ) {
        WC()->initialize_session();
        WC()->initialize_cart();
        WC()->cart->empty_cart();

        foreach ( $items as $item ) {
            $added = WC()->cart->add_to_cart( $item['id'], $item['qty'], $item['variation_id'] ?: 0 );
            if ( ! $added ) {
                return new WP_Error( 'invalid_item', 'One or more items are no longer available.', array( 'status' => 400 ) );
            }
        }

        if ( $coupon_code ) {
            WC()->cart->add_discount( $coupon_code );
        }

        $country_code = self::country_to_wc_code( $address['country'] ?? '' );
        WC()->customer->set_shipping_country( $country_code );
        WC()->customer->set_shipping_state( $address['state'] ?? '' );
        WC()->customer->set_shipping_city( $address['city'] ?? '' );
        WC()->customer->set_shipping_postcode( $address['postcode'] ?? '' );
        WC()->customer->set_billing_country( $country_code );
        WC()->customer->set_billing_state( $address['state'] ?? '' );
        WC()->customer->set_billing_city( $address['city'] ?? '' );
        WC()->customer->set_billing_postcode( $address['postcode'] ?? '' );

        return true;
    }

    /**
     * Reads available shipping rates per package straight from WooCommerce's
     * own shipping zones — no flat-rate shortcut. WCFM Marketplace splits
     * the cart into one package per vendor transparently via its own
     * 'woocommerce_cart_shipping_packages' hook, so this can return more
     * than one package.
     */
    private static function get_shipping_options(): array {
        WC()->cart->calculate_shipping();
        $packages = WC()->shipping()->get_packages();

        $options = array();
        foreach ( $packages as $pkg_key => $package ) {
            $rates = array();
            foreach ( $package['rates'] ?? array() as $rate_id => $rate ) {
                $rates[] = array(
                    'id'    => $rate_id,
                    'label' => $rate->get_label(),
                    'cost'  => round( (float) $rate->get_cost(), 2 ),
                );
            }
            $options[] = array( 'packageKey' => (string) $pkg_key, 'rates' => $rates );
        }
        return $options;
    }

    private static function choose_cheapest_rates( array $shipping_options ): array {
        $chosen = array();
        foreach ( $shipping_options as $opt ) {
            if ( empty( $opt['rates'] ) ) continue;
            $rates = $opt['rates'];
            usort( $rates, fn( $a, $b ) => $a['cost'] <=> $b['cost'] );
            $chosen[ $opt['packageKey'] ] = $rates[0]['id'];
        }
        return $chosen;
    }

    /**
     * Maps the free-text country names used by the mobile registration
     * dropdown (RegisterCompleteScreen.tsx COUNTRIES) to ISO-3166 alpha-2
     * codes WooCommerce needs for shipping-zone matching.
     */
    private static function country_to_wc_code( string $country ): string {
        $map = array(
            'nigeria'             => 'NG',
            'united kingdom'      => 'GB',
            'united states'       => 'US',
            'ghana'                => 'GH',
            'kenya'                => 'KE',
            'south africa'         => 'ZA',
            'canada'               => 'CA',
            'australia'            => 'AU',
            'germany'              => 'DE',
            'france'               => 'FR',
            'netherlands'          => 'NL',
            'sweden'               => 'SE',
            'uae'                  => 'AE',
            'jamaica'              => 'JM',
            'trinidad & tobago'    => 'TT',
        );
        return $map[ strtolower( trim( $country ) ) ] ?? 'GB';
    }

    private static function verify_stripe_sig( string $payload, string $sig_header, string $secret ): bool {
        $parts = array();
        foreach ( explode( ',', $sig_header ) as $part ) {
            [ $k, $v ] = array_pad( explode( '=', $part, 2 ), 2, '' );
            $parts[ trim( $k ) ] = trim( $v );
        }
        $ts  = $parts['t']  ?? '';
        $sig = $parts['v1'] ?? '';
        if ( ! $ts || ! $sig ) return false;
        return hash_equals( hash_hmac( 'sha256', "{$ts}.{$payload}", $secret ), $sig );
    }
}

/**
 * Minimal internal WooCommerce gateway used only so WC_Checkout::create_order()
 * has a valid, enabled payment_method to attach. process_payment() is never
 * invoked by our flow — Culture_Shop_Checkout calls $order->payment_complete()
 * directly after Paystack/Stripe has already captured funds.
 */
add_action( 'plugins_loaded', function () {
    if ( ! class_exists( 'WC_Payment_Gateway' ) || class_exists( 'WC_Gateway_Culture_External' ) ) {
        return;
    }

    class WC_Gateway_Culture_External extends WC_Payment_Gateway {
        public function __construct() {
            $this->id                 = 'culture_external';
            $this->method_title       = 'Moveee App Checkout (internal)';
            $this->method_description = 'Internal gateway used by the Moveee mobile app in-house checkout. Funds are captured via Paystack/Stripe before the order is created — do not enable at storefront checkout.';
            $this->has_fields         = false;
            $this->enabled            = 'yes';
            $this->title              = 'Card payment';
        }

        public function is_available() {
            return false; // never shown at a real checkout form
        }

        public function process_payment( $order_id ) {
            $order = wc_get_order( $order_id );
            $order->payment_complete();
            return array( 'result' => 'success', 'redirect' => $this->get_return_url( $order ) );
        }
    }
} );
