"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  getPriceBands,
  PriceBand,
  vendorName,
  vendorLocation,
  averageRating,
  reviewCount,
  isNew,
  isOutOfStock,
  parsePrice,
  getCurrencySymbol,
  getCurrencyCode,
  formatPrice,
} from "./shopHelpers";
import {
  getShopFilters,
  setShopFilters,
  setShopFilterMeta,
  clearShopFilterMeta,
  subscribeShopFilters,
} from "@/lib/shopFiltersBus";

// Re-exported for existing client consumers (ShopProductGrid.tsx).
// The real definitions live in ./shopHelpers.ts, which is deliberately NOT
// "use client" so server components (ShopArchiveWrapper.tsx) can call them
// directly — importing pure functions from a "use client" file makes every
// export a client-only reference, which a server component can't invoke.
export {
  vendorName,
  vendorLocation,
  averageRating,
  reviewCount,
  isNew,
  isOutOfStock,
  parsePrice,
  getCurrencySymbol,
  getCurrencyCode,
  formatPrice,
};
export type { PriceBand };

interface ShopFilterContextValue {
  filtered: any[];
}

const ShopFilterCtx = createContext<ShopFilterContextValue | null>(null);

interface Category {
  name: string;
  slug: string;
}

export function ShopFilterProvider({
  products,
  categories = [],
  activeCategorySlug,
  children,
}: {
  products: any[];
  categories?: Category[];
  activeCategorySlug?: string;
  children: ReactNode;
}) {
  // Search + filter state now lives on shopFiltersBus (apps/site/lib/) — the
  // controls themselves moved into <ShopSearchModal>, which is mounted from
  // Header.tsx, well outside this provider's tree. Mirror the bus into local
  // state here purely so `filtered` can be a memo that re-derives on change.
  const [filters, setFilters] = useState(getShopFilters());
  useEffect(() => subscribeShopFilters(() => setFilters(getShopFilters())), []);

  const { query, priceBand, location, inStockOnly, sort } = filters;

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const loc = vendorLocation(p);
      if (loc) set.add(loc);
    }
    return [...set].slice(0, 8);
  }, [products]);

  // Derived from the real fetched products (currency + price range), not a
  // fixed GBP scale — see shopHelpers.ts's getPriceBands() for why.
  const priceBands = useMemo(() => getPriceBands(products), [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || vendorName(p).toLowerCase().includes(q)
      );
    }
    if (priceBand) {
      const band = priceBands.find((b) => b.id === priceBand);
      if (band) list = list.filter((p) => band.test(parsePrice(p.price)));
    }
    if (location) {
      list = list.filter((p) => vendorLocation(p) === location);
    }
    if (inStockOnly) {
      list = list.filter((p) => !isOutOfStock(p));
    }

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === "price-desc") sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    else if (sort === "newest") sorted.sort((a, b) => (b.databaseId ?? 0) - (a.databaseId ?? 0));
    else if (sort === "most-loved") {
      sorted.sort((a, b) => reviewCount(b) - reviewCount(a) || averageRating(b) - averageRating(a));
    }
    return sorted;
  }, [products, query, priceBand, priceBands, location, inStockOnly, sort]);

  // Push this page's facets + result count up to the bus so <ShopSearchModal>
  // (mounted in Header.tsx, outside this tree) can render them — and clear
  // them on unmount so the modal knows it's no longer on a shop page.
  useEffect(() => {
    setShopFilterMeta({
      categories,
      activeCategorySlug,
      availableLocations,
      priceBands: priceBands.map((b) => ({ id: b.id, label: b.label })),
      resultCount: filtered.length,
    });
    return () => clearShopFilterMeta();
  }, [categories, activeCategorySlug, availableLocations, priceBands, filtered.length]);

  // Reset any leftover filters from a previous shop page the moment a new
  // one mounts (e.g. navigating from /shop to /shop/category/ceramics) —
  // otherwise a search term or filter picked earlier would silently keep
  // narrowing a page the visitor never applied it to.
  useEffect(() => {
    setShopFilters({ query: "", priceBand: null, location: null, inStockOnly: false, sort: "default" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ShopFilterContextValue = { filtered };

  return <ShopFilterCtx.Provider value={value}>{children}</ShopFilterCtx.Provider>;
}

export function useShopFilter() {
  const ctx = useContext(ShopFilterCtx);
  if (!ctx) throw new Error("useShopFilter must be used within a ShopFilterProvider");
  return ctx;
}
