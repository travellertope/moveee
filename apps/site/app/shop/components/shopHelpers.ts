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

export function formatGBP(n: number): string {
  return `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}
