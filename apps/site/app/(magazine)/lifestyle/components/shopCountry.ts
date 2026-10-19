import { headers } from "next/headers";

// Server-only — reads the Vercel geo-IP header the same way
// apps/site/app/services/page.tsx and apps/site/app/newsletter/page.tsx
// already do (await headers().get("x-vercel-ip-country"), an ISO 3166-1
// alpha-2 code like "NG"), then maps it to the literal country string
// moveee-graphql-bridge.php's moveee_resolve_shop_currency() expects —
// which mirrors the mobile app's own request-param convention exactly
// ("nigeria", case-insensitive; not an ISO code). Wrapped in try/catch per
// the newsletter page's defensive style, since geo headers aren't
// guaranteed present (e.g. local dev).
const ISO_TO_SHOP_COUNTRY: Record<string, string> = {
  NG: "nigeria",
};

export async function getShopCountryParam(): Promise<string | null> {
  try {
    const h = await headers();
    const iso = (h.get("x-vercel-ip-country") ?? "").toUpperCase();
    return ISO_TO_SHOP_COUNTRY[iso] ?? null;
  } catch {
    return null;
  }
}
