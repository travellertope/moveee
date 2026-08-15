// Pure product-formatting helpers, deliberately NOT "use client" — a file with
// that directive turns every export into a client-only reference, which a
// server component (ShopArchiveWrapper.tsx) can't call directly even though
// these are plain functions. Keep this file free of hooks/context so both
// server and client shop components can import from it safely.
// ShopFilterContext.tsx re-exports these for its existing client consumers.

export const PRICE_BANDS = [
  { id: "under-50", label: "Under £50", test: (n: number) => n < 50 },
  { id: "50-100", label: "£50–£100", test: (n: number) => n >= 50 && n < 100 },
  { id: "100-200", label: "£100–£200", test: (n: number) => n >= 100 && n < 200 },
  { id: "200-plus", label: "£200+", test: (n: number) => n >= 200 },
];

export function vendorName(p: any): string {
  return p.vendorProfile?.storeName || "";
}

export function vendorLocation(p: any): string {
  return p.vendorProfile?.city || p.vendorProfile?.country || "";
}

export function averageRating(p: any): number {
  return parseFloat(p.averageRating) || 0;
}

export function reviewCount(p: any): number {
  return p.reviewCount ?? 0;
}

export function isNew(p: any): boolean {
  return p.productTags?.nodes?.some((t: any) => t.slug === "new") ?? false;
}

export function isOutOfStock(p: any): boolean {
  return p.stockStatus === "OUT_OF_STOCK";
}

export function parsePrice(price?: string): number {
  if (!price) return 0;
  const cleaned = price.replace(/<[^>]*>/g, "").replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// WooCommerce/WPGraphQL's `price` field is pre-formatted with whatever
// currency the store is actually configured for (historically GBP, but the
// store's currency setting is not something this app controls or can rely
// on staying fixed — it has shown up as NGN in production). Never assume a
// symbol; derive it from the real price string instead, so a computed price
// (e.g. the 10%-off "Pro" price) always matches the currency the base price
// is already showing.
const ENTITY_TO_SYMBOL: Record<string, string> = {
  "&pound;": "£",
  "&#163;": "£",
  "&euro;": "€",
  "&#8364;": "€",
  "&dollar;": "$",
  "&#36;": "$",
  "&#8358;": "₦",
};

const SYMBOL_TO_CODE: Record<string, string> = {
  "£": "GBP",
  "€": "EUR",
  "$": "USD",
  "₦": "NGN",
};

export function getCurrencySymbol(price?: string): string {
  if (!price) return "£";
  let cleaned = price.replace(/<[^>]*>/g, "");
  for (const [entity, symbol] of Object.entries(ENTITY_TO_SYMBOL)) {
    cleaned = cleaned.split(entity).join(symbol);
  }
  const match = cleaned.match(/[^\s0-9.,]+/);
  return match ? match[0] : "£";
}

export function getCurrencyCode(price?: string): string {
  return SYMBOL_TO_CODE[getCurrencySymbol(price)] ?? "GBP";
}

export function formatPrice(n: number, symbol = "£"): string {
  return `${symbol}${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}
