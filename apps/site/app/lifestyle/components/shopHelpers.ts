// Pure product-formatting helpers, deliberately NOT "use client" — a file with
// that directive turns every export into a client-only reference, which a
// server component (ShopArchiveWrapper.tsx) can't call directly even though
// these are plain functions. Keep this file free of hooks/context so both
// server and client shop components can import from it safely.
// ShopFilterContext.tsx re-exports these for its existing client consumers.

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

export interface PriceBand {
  id: string;
  label: string;
  test: (n: number) => boolean;
}

// Rounds n to a "nice" 1/2/5-times-a-power-of-ten value (the same trick
// chart libraries use for axis ticks), so band cutoffs read like £50/₦50,000
// rather than an arbitrary £47.32.
function roundNice(n: number): number {
  if (!(n > 0)) return 0;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const frac = n / base;
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return niceFrac * base;
}

const FALLBACK_BANDS: PriceBand[] = [
  { id: "under-1", label: "Under £50", test: (n) => n < 50 },
  { id: "band-1", label: "£50–£100", test: (n) => n >= 50 && n < 100 },
  { id: "band-2", label: "£100–£200", test: (n) => n >= 100 && n < 200 },
  { id: "band-3", label: "£200+", test: (n) => n >= 200 },
];

// Price filter pills for the shop archive — WooCommerce's price scale isn't
// fixed (it's shown up as both GBP tens/hundreds and NGN tens-of-thousands
// in production, see getCurrencySymbol above), so fixed band thresholds like
// "Under £50" silently stop matching anything once the store's currency or
// typical price range changes. Bands are instead derived from the real
// fetched products: the currency symbol comes from an actual price string,
// and the three cutoffs scale off the highest price in the set (roughly
// 1x/2x/4x a "nice" base, mirroring the shop's original 50/100/200 spread)
// so they always land somewhere inside the real price range.
export function getPriceBands(products: any[]): PriceBand[] {
  const prices = products.map((p) => parsePrice(p?.price)).filter((n) => n > 0);
  if (!prices.length) return FALLBACK_BANDS;

  const symbolSource = products.find((p) => p?.price)?.price;
  const symbol = getCurrencySymbol(symbolSource);
  const max = Math.max(...prices);
  const base = roundNice(max / 5) || 50;
  const t1 = base;
  const t2 = base * 2;
  const t3 = base * 4;
  const fmt = (n: number) => `${symbol}${n.toLocaleString("en-US")}`;

  return [
    { id: "under-1", label: `Under ${fmt(t1)}`, test: (n) => n < t1 },
    { id: "band-1", label: `${fmt(t1)}–${fmt(t2)}`, test: (n) => n >= t1 && n < t2 },
    { id: "band-2", label: `${fmt(t2)}–${fmt(t3)}`, test: (n) => n >= t2 && n < t3 },
    { id: "band-3", label: `${fmt(t3)}+`, test: (n) => n >= t3 },
  ];
}
