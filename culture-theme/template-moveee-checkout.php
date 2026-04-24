<?php
/**
 * Template Name: Moveee Checkout
 * Template Post Type: page
 *
 * Assign this template to the WooCommerce checkout page via:
 * WP Admin → Pages → Checkout → Page Attributes → Template → Moveee Checkout
 *
 * Then confirm in WooCommerce → Settings → Advanced → Page setup → Checkout page
 * is pointing to that same page.
 */
defined( 'ABSPATH' ) || exit;

// Ensure WooCommerce is active
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
<title>Checkout · The Moveee</title>
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
  --ink-soft:   #3a342b;
  --mute:       #7a6f5c;
  --rule:       rgba(42,36,28,0.15);
  --ochre:      #c5491f;
  --gold:       #b38238;
  --font-serif: "Fraunces", Georgia, serif;
  --font-sans:  "DM Sans", system-ui, sans-serif;
}
html { background: var(--paper); color: var(--ink); }
body {
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

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
.mc-back-link {
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--mute);
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.2s;
}
.mc-back-link:hover { color: var(--ink); }
.mc-secure-note {
  font-family: var(--font-sans);
  font-size: 11px;
  color: var(--mute);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── Main layout ─────────────────────────────────────────────────────────── */
.mc-main {
  flex: 1;
  max-width: 1040px;
  margin: 0 auto;
  width: 100%;
  padding: 48px 24px 80px;
}
.mc-checkout-heading {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 36px;
}
.mc-checkout-heading em { font-style: italic; color: var(--ochre); }

/* ── WooCommerce field overrides ─────────────────────────────────────────── */
.woocommerce-checkout .form-row {
  margin-bottom: 18px;
}
.woocommerce-checkout label {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mute);
  display: block;
  margin-bottom: 6px;
}
.woocommerce-checkout input[type="text"],
.woocommerce-checkout input[type="email"],
.woocommerce-checkout input[type="tel"],
.woocommerce-checkout input[type="password"],
.woocommerce-checkout select,
.woocommerce-checkout textarea {
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: 1px solid rgba(42,36,28,0.3);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 14px;
  border-radius: 0;
  outline: none;
  transition: border-color 0.2s;
  appearance: none;
}
.woocommerce-checkout input:focus,
.woocommerce-checkout select:focus,
.woocommerce-checkout textarea:focus {
  border-color: var(--ink);
}
.woocommerce-checkout .woocommerce-input-wrapper { width: 100%; }

/* Section headings */
.woocommerce-checkout h3 {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin: 32px 0 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}

/* Order review table */
.woocommerce-checkout-review-order-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-family: var(--font-sans);
  font-size: 13px;
}
.woocommerce-checkout-review-order-table th,
.woocommerce-checkout-review-order-table td {
  padding: 12px 0;
  border-bottom: 1px solid var(--rule);
  color: var(--ink);
  text-align: left;
}
.woocommerce-checkout-review-order-table .order-total td,
.woocommerce-checkout-review-order-table .order-total th {
  font-family: var(--font-serif);
  font-size: 18px;
  border-bottom: none;
  padding-top: 16px;
}

/* Place order button */
#place_order,
.woocommerce #place_order {
  display: block;
  width: 100%;
  padding: 16px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0;
  margin-top: 20px;
}
#place_order:hover { background: var(--ochre); }

/* Payment methods */
.woocommerce-checkout .payment_methods {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  border: 1px solid var(--rule);
}
.woocommerce-checkout .payment_methods li {
  padding: 14px 16px;
  border-bottom: 1px solid var(--rule);
  font-size: 13px;
}
.woocommerce-checkout .payment_methods li:last-child { border-bottom: none; }
.woocommerce-checkout .payment_methods label {
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink);
  cursor: pointer;
}

/* Notices */
.woocommerce-error,
.woocommerce-message,
.woocommerce-info {
  font-family: var(--font-sans);
  font-size: 13px;
  padding: 14px 18px;
  margin-bottom: 20px;
  border-left: 3px solid var(--ochre);
  background: var(--paper-deep);
  list-style: none;
}
.woocommerce-error { border-color: #c5491f; }
.woocommerce-message { border-color: var(--gold); }

/* Coupon row */
.woocommerce-checkout .checkout_coupon {
  margin-bottom: 24px;
  display: flex;
  gap: 10px;
}
.woocommerce-checkout .checkout_coupon input {
  flex: 1;
}
.woocommerce-checkout .checkout_coupon .button {
  background: var(--ink);
  color: var(--paper);
  border: none;
  padding: 12px 20px;
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 0;
}
.woocommerce-checkout .checkout_coupon .button:hover { background: var(--ochre); }

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
.mc-footer-links {
  display: flex;
  gap: 20px;
}
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
  .mc-header { padding: 0 20px; }
  .mc-main   { padding: 32px 20px 60px; }
  .mc-secure-note { display: none; }
  .mc-footer { padding: 20px; flex-direction: column; align-items: flex-start; gap: 12px; }
}
</style>
</head>
<body class="woocommerce-checkout-moveee">

<header class="mc-header">
  <a href="https://themoveee.com" class="mc-wordmark">The Moveee</a>
  <span class="mc-secure-note">
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="6" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/>
      <path d="M3 6V4a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    Secure Checkout
  </span>
  <a href="https://themoveee.com/shop" class="mc-back-link">← Back to Shop</a>
</header>

<main class="mc-main">
  <h1 class="mc-checkout-heading">Complete your <em>order</em></h1>
  <?php echo do_shortcode( '[woocommerce_checkout]' ); ?>
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
