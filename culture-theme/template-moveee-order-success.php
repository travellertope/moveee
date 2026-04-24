<?php
/**
 * Template Name: Moveee Order Success
 * Template Post Type: page
 *
 * Assign this template to the WooCommerce "Order Received" page via:
 * WP Admin → Pages → Order Received → Page Attributes → Template → Moveee Order Success
 *
 * Then confirm in WooCommerce → Settings → Advanced → Page setup → Thank you page
 * is pointing to that same page.
 */
defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'WC' ) ) {
    wp_redirect( home_url() );
    exit;
}

// Resolve the order from the URL token (standard WooCommerce flow)
$order_id  = absint( get_query_var( 'order-received' ) );
$order_key = wc_clean( wp_unslash( $_GET['key'] ?? '' ) );
$order     = $order_id ? wc_get_order( $order_id ) : null;

// Validate order key
if ( $order && $order->get_order_key() !== $order_key ) {
    $order = null;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Order Confirmed · The Moveee</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=DM+Sans:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300&display=swap" rel="stylesheet">
<?php wp_head(); ?>
<style>
/* ── Reset + tokens ───────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --paper:      #f3ece0;
  --paper-deep: #ebe1d0;
  --ink:        #14110d;
  --mute:       #7a6f5c;
  --rule:       rgba(42,36,28,0.15);
  --ochre:      #c5491f;
  --gold:       #b38238;
  --font-serif: "Fraunces", Georgia, serif;
  --font-sans:  "DM Sans", system-ui, sans-serif;
}
html, body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  min-height: 100vh;
}
body { display: flex; flex-direction: column; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.mc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 64px;
  border-bottom: 1px solid var(--rule);
  background: var(--paper);
}
.mc-wordmark {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  letter-spacing: -0.02em;
}
.mc-nav-link {
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--mute);
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.2s;
}
.mc-nav-link:hover { color: var(--ink); }

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.mc-success-hero {
  text-align: center;
  padding: 72px 24px 56px;
  max-width: 600px;
  margin: 0 auto;
}
.mc-success-icon {
  width: 56px;
  height: 56px;
  border: 1.5px solid var(--ink);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  font-size: 22px;
  color: var(--ink);
}
.mc-success-label {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mute);
  margin-bottom: 14px;
}
.mc-success-heading {
  font-family: var(--font-serif);
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--ink);
  line-height: 1.15;
  margin-bottom: 16px;
}
.mc-success-heading em { font-style: italic; color: var(--ochre); }
.mc-success-sub {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--mute);
  line-height: 1.7;
  max-width: 440px;
  margin: 0 auto;
}

/* ── Order summary ───────────────────────────────────────────────────────── */
.mc-order-wrap {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 24px 80px;
}
.mc-order-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
  margin-bottom: 40px;
}
.mc-order-meta-cell {
  background: var(--paper);
  padding: 18px 20px;
}
.mc-order-meta-cell .label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
  display: block;
  margin-bottom: 5px;
}
.mc-order-meta-cell .value {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--ink);
}

/* Item list */
.mc-order-items {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
}
.mc-order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--rule);
}
.mc-order-item:first-child { border-top: 1px solid var(--rule); }
.mc-item-img {
  width: 64px;
  height: 64px;
  background: var(--paper-deep);
  overflow: hidden;
  flex-shrink: 0;
}
.mc-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.mc-item-info { flex: 1; }
.mc-item-name {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 3px;
}
.mc-item-qty {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--mute);
}
.mc-item-price {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--ink);
}

/* Totals */
.mc-order-totals {
  border-top: 1px solid rgba(42,36,28,0.3);
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 40px;
}
.mc-total-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
  font-size: 13px;
  color: var(--mute);
}
.mc-total-row.mc-grand {
  font-family: var(--font-serif);
  font-size: 20px;
  color: var(--ink);
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--rule);
}

/* CTAs */
.mc-ctas {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.mc-cta-primary {
  display: inline-block;
  background: var(--ink);
  color: var(--paper);
  padding: 15px 40px;
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.2s;
}
.mc-cta-primary:hover { background: var(--ochre); }
.mc-cta-secondary {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--mute);
  text-decoration: underline;
  transition: color 0.2s;
}
.mc-cta-secondary:hover { color: var(--ink); }

/* ── Footer ──────────────────────────────────────────────────────────────── */
.mc-footer {
  margin-top: auto;
  border-top: 1px solid var(--rule);
  padding: 24px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.mc-footer-copy {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--mute);
  letter-spacing: 0.06em;
}
.mc-footer-links { display: flex; gap: 20px; }
.mc-footer-links a {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--mute);
  text-decoration: none;
  letter-spacing: 0.06em;
  transition: color 0.2s;
}
.mc-footer-links a:hover { color: var(--ink); }

@media (max-width: 640px) {
  .mc-header  { padding: 0 20px; }
  .mc-footer  { padding: 20px; flex-direction: column; align-items: flex-start; }
  .mc-order-wrap { padding: 0 20px 60px; }
}
</style>
</head>
<body class="woocommerce-order-received-moveee">

<header class="mc-header">
  <a href="https://themoveee.com" class="mc-wordmark">The Moveee</a>
  <a href="https://themoveee.com/shop" class="mc-nav-link">Continue Shopping →</a>
</header>

<div class="mc-success-hero">
  <div class="mc-success-icon">✓</div>
  <div class="mc-success-label">Order Confirmed</div>
  <h1 class="mc-success-heading">Thank you for your <em>order</em></h1>
  <?php if ( $order ) : ?>
    <p class="mc-success-sub">
      A confirmation has been sent to
      <strong><?php echo esc_html( $order->get_billing_email() ); ?></strong>.
      Your order is now being prepared by the maker.
    </p>
  <?php else : ?>
    <p class="mc-success-sub">
      Your order has been received. A confirmation email is on its way.
    </p>
  <?php endif; ?>
</div>

<?php if ( $order ) : ?>
<div class="mc-order-wrap">

  <!-- Order meta grid -->
  <div class="mc-order-meta">
    <div class="mc-order-meta-cell">
      <span class="label">Order</span>
      <span class="value">#<?php echo esc_html( $order->get_order_number() ); ?></span>
    </div>
    <div class="mc-order-meta-cell">
      <span class="label">Date</span>
      <span class="value"><?php echo esc_html( wc_format_datetime( $order->get_date_created() ) ); ?></span>
    </div>
    <div class="mc-order-meta-cell">
      <span class="label">Status</span>
      <span class="value"><?php echo esc_html( wc_get_order_status_name( $order->get_status() ) ); ?></span>
    </div>
    <div class="mc-order-meta-cell">
      <span class="label">Payment</span>
      <span class="value"><?php echo esc_html( $order->get_payment_method_title() ); ?></span>
    </div>
  </div>

  <!-- Items -->
  <ul class="mc-order-items">
    <?php foreach ( $order->get_items() as $item ) :
      $product = $item->get_product();
      $img_url = $product ? wp_get_attachment_image_url( $product->get_image_id(), 'thumbnail' ) : '';
    ?>
      <li class="mc-order-item">
        <div class="mc-item-img">
          <?php if ( $img_url ) : ?>
            <img src="<?php echo esc_url( $img_url ); ?>" alt="<?php echo esc_attr( $item->get_name() ); ?>">
          <?php endif; ?>
        </div>
        <div class="mc-item-info">
          <div class="mc-item-name"><?php echo esc_html( $item->get_name() ); ?></div>
          <div class="mc-item-qty">Qty: <?php echo esc_html( $item->get_quantity() ); ?></div>
        </div>
        <div class="mc-item-price">
          <?php echo wp_kses_post( $order->get_formatted_line_subtotal( $item ) ); ?>
        </div>
      </li>
    <?php endforeach; ?>
  </ul>

  <!-- Totals -->
  <div class="mc-order-totals">
    <?php if ( $order->get_subtotal() !== $order->get_total() ) : ?>
      <div class="mc-total-row">
        <span>Subtotal</span>
        <span><?php echo wp_kses_post( $order->get_subtotal_to_display() ); ?></span>
      </div>
    <?php endif; ?>
    <?php if ( $order->get_shipping_total() > 0 ) : ?>
      <div class="mc-total-row">
        <span>Shipping</span>
        <span><?php echo wp_kses_post( wc_price( $order->get_shipping_total() ) ); ?></span>
      </div>
    <?php endif; ?>
    <div class="mc-total-row mc-grand">
      <span>Total</span>
      <span><?php echo wp_kses_post( $order->get_formatted_order_total() ); ?></span>
    </div>
  </div>

  <!-- CTAs -->
  <div class="mc-ctas">
    <a href="https://themoveee.com/shop" class="mc-cta-primary">Continue Shopping →</a>
    <a href="<?php echo esc_url( $order->get_view_order_url() ); ?>" class="mc-cta-secondary">
      View full order details
    </a>
  </div>

</div>
<?php endif; ?>

<footer class="mc-footer">
  <span class="mc-footer-copy">© <?php echo date('Y'); ?> The Moveee · All rights reserved</span>
  <div class="mc-footer-links">
    <a href="https://themoveee.com/privacy">Privacy</a>
    <a href="https://themoveee.com/terms">Terms</a>
    <a href="https://themoveee.com/shop">Shop</a>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
