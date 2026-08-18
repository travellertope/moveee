"use client";

// Cross-tree pub/sub for shop search + filter state — same pattern as
// apps/connect's discoverFiltersBus.ts/peopleFiltersBus.ts. The shop's
// search+filter UI now lives in <ShopSearchModal> (mounted globally from
// Header.tsx), while the actual product list/derived filter facets
// (categories, materials, locations, price bands) live inside
// <ShopFilterProvider> deep in the /shop page tree. Neither can reach the
// other via props, so the bus is the shared source of truth: the page
// pushes its computed meta in, the modal reads it and pushes filter
// changes back out, and ShopFilterContext applies them to the product list.

export interface ShopPriceBand {
  id: string;
  label: string;
}

export interface ShopCategory {
  name: string;
  slug: string;
}

export interface ShopFilters {
  query: string;
  priceBand: string | null;
  material: string | null;
  location: string | null;
  inStockOnly: boolean;
  sort: string;
}

export interface ShopFilterMeta {
  /** Whether a <ShopFilterProvider> is actually mounted on the current page. */
  active: boolean;
  categories: ShopCategory[];
  activeCategorySlug?: string;
  availableMaterials: string[];
  availableLocations: string[];
  priceBands: ShopPriceBand[];
  resultCount: number;
}

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  query: "",
  priceBand: null,
  material: null,
  location: null,
  inStockOnly: false,
  sort: "default",
};

const DEFAULT_META: ShopFilterMeta = {
  active: false,
  categories: [],
  availableMaterials: [],
  availableLocations: [],
  priceBands: [],
  resultCount: 0,
};

let filters: ShopFilters = { ...DEFAULT_SHOP_FILTERS };
let meta: ShopFilterMeta = { ...DEFAULT_META };

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeShopFilters(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getShopFilters(): ShopFilters {
  return filters;
}

export function getShopFilterMeta(): ShopFilterMeta {
  return meta;
}

export function setShopFilters(patch: Partial<ShopFilters>) {
  filters = { ...filters, ...patch };
  emit();
}

export function clearShopFilters() {
  filters = { ...DEFAULT_SHOP_FILTERS };
  emit();
}

/** Called by ShopFilterProvider whenever the page's derived facets change. */
export function setShopFilterMeta(next: Omit<ShopFilterMeta, "active">) {
  meta = { ...next, active: true };
  emit();
}

/** Called by ShopFilterProvider on unmount, so the modal knows it's no longer on a shop page. */
export function clearShopFilterMeta() {
  meta = { ...DEFAULT_META };
}
