<?php
/**
 * Template Name: Moveee Cart
 * Template Post Type: page
 *
 * Assign this template to the WooCommerce cart page via:
 * WP Admin → Pages → Cart → Page Attributes → Template → Moveee Cart
 *
 * Then confirm in WooCommerce → Settings → Advanced → Page setup → Cart page
 * is pointing to that same page.
 */
defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'WC' ) ) {
    wp_redirect( home_url() );
    exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your Cart · The Moveee</title>
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
  position: sticky;
  top: 0;
  background: var(--paper);
  z-index: 100;
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

/* ── Main layout ─────────────────────────────────────────────────────────── */
.mc-main {
  flex: 1;
  max-width: 1040px;
  margin: 0 auto;
  width: 100%;
  padding: 48px 24px 80px;
}
.mc-cart-heading {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 36px;
}
.mc-cart-heading em { font-style: italic; color: var(--ochre); }

/* ── Cart table ──────────────────────────────────────────────────────────── */
.woocommerce-cart table.cart,
.woocommerce-cart table.shop_table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 14px;
  margin-bottom: 32px;
}
.woocommerce-cart table.cart th,
.woocommerce-cart table.shop_table th {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
  font-weight: 400;
  padding: 0 12px 14px;
  border-bottom: 1px solid var(--rule);
  text-align: left;
}
.woocommerce-cart table.cart th.product-thumbnail { width: 80px; }
.woocommerce-cart table.cart th.product-subtotal  { text-align: right; }
.woocommerce-cart table.cart th.product-remove    { width: 32px; }

.woocommerce-cart table.cart td {
  padding: 20px 12px;
  border-bottom: 1px solid var(--rule);
  vertical-align: middle;
  color: var(--ink);
}

/* Product thumbnail */
.woocommerce-cart table.cart td.product-thumbnail {
  width: 80px;
  padding-right: 0;
}
.woocommerce-cart table.cart td.product-thumbnail a {
  display: block;
  width: 68px;
  height: 68px;
  overflow: hidden;
  background: var(--paper-deep);
}
.woocommerce-cart table.cart td.product-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Product name */
.woocommerce-cart table.cart td.product-name a {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  text-decoration: none;
  transition: color 0.2s;
}
.woocommerce-cart table.cart td.product-name a:hover { color: var(--ochre); }
.woocommerce-cart table.cart td.product-name .variation {
  font-size: 12px;
  color: var(--mute);
  margin-top: 4px;
}
.woocommerce-cart table.cart td.product-name .variation dt,
.woocommerce-cart table.cart td.product-name .variation dd {
  display: inline;
  font-weight: 400;
}

/* Price columns */
.woocommerce-cart table.cart td.product-price,
.woocommerce-cart table.cart td.product-subtotal {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--ink);
}
.woocommerce-cart table.cart td.product-subtotal { text-align: right; }

/* Quantity input */
.woocommerce-cart table.cart td.product-quantity .qty {
  width: 60px;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid rgba(42,36,28,0.3);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  border-radius: 0;
  outline: none;
  text-align: center;
  -moz-appearance: textfield;
  appearance: textfield;
}
.woocommerce-cart table.cart td.product-quantity .qty:focus {
  border-color: var(--ink);
}
.woocommerce-cart table.cart td.product-quantity .qty::-webkit-inner-spin-button,
.woocommerce-cart table.cart td.product-quantity .qty::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

/* Remove button */
.woocommerce-cart table.cart td.product-remove {
  width: 32px;
  text-align: center;
}
.woocommerce-cart table.cart td.product-remove a.remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--mute) !important;
  font-size: 16px;
  text-decoration: none;
  transition: color 0.2s;
  line-height: 1;
}
.woocommerce-cart table.cart td.product-remove a.remove:hover {
  color: var(--ochre) !important;
  background: transparent;
}

/* ── Cart actions row (coupon + update) ──────────────────────────────────── */
.woocommerce-cart .cart_item td.actions {
  padding-top: 24px;
  padding-bottom: 8px;
}
.woocommerce-cart .actions .coupon {
  display: flex;
  gap: 10px;
  align-items: center;
}
.woocommerce-cart .actions .coupon label { display: none; }
.woocommerce-cart .actions .coupon #coupon_code {
  padding: 10px 14px;
  background: transparent;
  border: 1px solid rgba(42,36,28,0.3);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 13px;
  border-radius: 0;
  outline: none;
  min-width: 180px;
  transition: border-color 0.2s;
}
.woocommerce-cart .actions .coupon #coupon_code::placeholder { color: var(--mute); }
.woocommerce-cart .actions .coupon #coupon_code:focus { border-color: var(--ink); }
.woocommerce-cart .actions .coupon .button,
.woocommerce-cart .actions button[name="apply_coupon"] {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(42,36,28,0.3);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 0;
  transition: border-color 0.2s, background 0.2s;
}
.woocommerce-cart .actions .coupon .button:hover { border-color: var(--ink); background: var(--paper-deep); }

.woocommerce-cart .actions button[name="update_cart"] {
  float: right;
  padding: 10px 20px;
  background: var(--ink);
  border: none;
  color: var(--paper);
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.2s;
}
.woocommerce-cart .actions button[name="update_cart"]:hover { background: var(--ochre); }
.woocommerce-cart .actions button[name="update_cart"]:disabled { opacity: 0.4; cursor: default; }

/* ── Cart totals ─────────────────────────────────────────────────────────── */
.woocommerce-cart .cart-collaterals {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.woocommerce-cart .cart_totals {
  width: 100%;
  max-width: 360px;
}
.woocommerce-cart .cart_totals h2 {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
  font-weight: 400;
  margin-bottom: 16px;
}
.woocommerce-cart .cart_totals table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-sans);
  font-size: 13px;
}
.woocommerce-cart .cart_totals table th,
.woocommerce-cart .cart_totals table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--rule);
  vertical-align: top;
  color: var(--mute);
}
.woocommerce-cart .cart_totals table td { text-align: right; }
.woocommerce-cart .cart_totals table .order-total th,
.woocommerce-cart .cart_totals table .order-total td {
  font-family: var(--font-serif);
  font-size: 20px;
  color: var(--ink);
  border-bottom: none;
  padding-top: 18px;
}
.woocommerce-cart .cart_totals .wc-proceed-to-checkout {
  margin-top: 20px;
}
.woocommerce-cart .cart_totals .wc-proceed-to-checkout .checkout-button,
.woocommerce-cart .cart_totals .checkout-button {
  display: block;
  width: 100%;
  padding: 16px;
  background: var(--ink);
  color: var(--paper) !important;
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0;
}
.woocommerce-cart .cart_totals .checkout-button:hover { background: var(--ochre); }

/* ── Notices ─────────────────────────────────────────────────────────────── */
.woocommerce-cart .woocommerce-error,
.woocommerce-cart .woocommerce-message,
.woocommerce-cart .woocommerce-info {
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border-left: 3px solid var(--gold);
  background: var(--paper-deep);
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.woocommerce-cart .woocommerce-error { border-color: var(--ochre); }
.woocommerce-cart .woocommerce-message .button,
.woocommerce-cart .woocommerce-info .button {
  white-space: nowrap;
  padding: 8px 16px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0;
}
.woocommerce-cart .woocommerce-message .button:hover { background: var(--ochre); }

/* Empty cart return-to-shop link */
.woocommerce-cart .return-to-shop {
  margin-top: 24px;
  text-align: center;
}
.woocommerce-cart .return-to-shop .button {
  display: inline-block;
  padding: 14px 36px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.2s;
  border-radius: 0;
}
.woocommerce-cart .return-to-shop .button:hover { background: var(--ochre); }

/* Shipping calculator */
.woocommerce-cart .shipping-calculator-button {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--mute);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
.woocommerce-cart .shipping-calculator-form input,
.woocommerce-cart .shipping-calculator-form select {
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid rgba(42,36,28,0.3);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 13px;
  border-radius: 0;
  outline: none;
  margin: 8px 0;
  appearance: none;
}
.woocommerce-cart .shipping-calculator-form .button {
  padding: 10px 20px;
  background: var(--ink);
  color: var(--paper);
  border: none;
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.2s;
}
.woocommerce-cart .shipping-calculator-form .button:hover { background: var(--ochre); }

/* ── Footer ──────────────────────────────────────────────────────────────── */
.mc-footer {
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

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .mc-header  { padding: 0 20px; }
  .mc-main    { padding: 32px 20px 60px; }
  .mc-footer  { padding: 20px; flex-direction: column; align-items: flex-start; gap: 12px; }

  .woocommerce-cart table.cart thead { display: none; }
  .woocommerce-cart table.cart,
  .woocommerce-cart table.cart tbody,
  .woocommerce-cart table.cart tr,
  .woocommerce-cart table.cart td { display: block; width: 100%; }

  .woocommerce-cart table.cart tr {
    display: grid;
    grid-template-columns: 68px 1fr 32px;
    grid-template-rows: auto auto;
    gap: 0 12px;
    padding: 16px 0;
    border-bottom: 1px solid var(--rule);
  }
  .woocommerce-cart table.cart td { border-bottom: none; padding: 0; }

  .woocommerce-cart table.cart td.product-thumbnail { grid-column: 1; grid-row: 1 / 3; }
  .woocommerce-cart table.cart td.product-name      { grid-column: 2; grid-row: 1; padding-top: 2px; }
  .woocommerce-cart table.cart td.product-remove    { grid-column: 3; grid-row: 1; }
  .woocommerce-cart table.cart td.product-price     { display: none; }
  .woocommerce-cart table.cart td.product-quantity  { grid-column: 2; grid-row: 2; padding-top: 10px; }
  .woocommerce-cart table.cart td.product-subtotal  {
    grid-column: 2; grid-row: 2;
    text-align: left;
    padding-top: 10px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .woocommerce-cart table.cart td.actions {
    grid-column: 1 / -1; grid-row: auto;
    padding-top: 16px;
  }
  .woocommerce-cart .actions .coupon { flex-wrap: wrap; }
  .woocommerce-cart .actions .coupon #coupon_code { min-width: 0; flex: 1; }
  .woocommerce-cart .actions button[name="update_cart"] {
    float: none;
    width: 100%;
    margin-top: 10px;
  }

  .woocommerce-cart .cart-collaterals { justify-content: stretch; }
  .woocommerce-cart .cart_totals      { max-width: 100%; }
}
</style>
</head>
<body class="woocommerce-cart-moveee">

<header class="mc-header">
  <a href="https://themoveee.com" class="mc-wordmark">The Moveee</a>
  <a href="https://themoveee.com/shop" class="mc-nav-link">Continue Shopping →</a>
</header>

<main class="mc-main">
  <h1 class="mc-cart-heading">Your <em>cart</em></h1>
  <?php echo do_shortcode( '[woocommerce_cart]' ); ?>
</main>

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
