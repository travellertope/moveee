// Google Play subscription product IDs. These must exist verbatim as
// subscriptions in Play Console (Monetize > Subscriptions) under this app's
// package (com.moveee.connect) AND match the "Monthly/Annual Subscription
// Product ID" fields in WP Admin → Culture Community → Payment → Google Play
// Billing — the client requests a purchase by SKU, and the server verifies
// it against the same SKU via the Play Developer API. If these three don't
// agree, purchases will fail client-side or verification will fail
// server-side. See CLAUDE.md "Google Play Billing" for the full setup.
export const MOVEEE_PRO_MONTHLY_SKU = "moveee_pro_monthly";
export const MOVEEE_PRO_ANNUAL_SKU = "moveee_pro_annual";

export const MOVEEE_PRO_SKUS = [MOVEEE_PRO_MONTHLY_SKU, MOVEEE_PRO_ANNUAL_SKU];
