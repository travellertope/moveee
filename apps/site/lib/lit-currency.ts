import { headers } from "next/headers";

/**
 * Geo-detects NGN vs USD for the Moveee Lit checkout (LiteraryLitCheckout.tsx)
 * — same `x-vercel-ip-country` header every other geo-detection in this app
 * reads (see app/lifestyle/components/shopCountry.ts, app/services/page.tsx,
 * lib/newsletter-editions.ts), just mapped straight to a currency instead of
 * a country/edition string. No manual switch — Nigeria gets NGN, everyone
 * else gets USD, decided once server-side before the page ever renders.
 * Wrapped in try/catch since geo headers aren't guaranteed present (e.g.
 * local dev), defaulting to NGN in that case.
 */
export async function getLitCurrency(): Promise<"NGN" | "USD"> {
  try {
    const h = await headers();
    const iso = (h.get("x-vercel-ip-country") ?? "").toUpperCase();
    return iso === "NG" ? "NGN" : iso ? "USD" : "NGN";
  } catch {
    return "NGN";
  }
}
