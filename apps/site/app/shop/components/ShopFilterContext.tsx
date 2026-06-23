"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";

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

interface Chip {
  id: string;
  label: string;
  clear: () => void;
}

interface ShopFilterContextValue {
  products: any[];
  filtered: any[];
  query: string;
  setQuery: (v: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  priceBand: string | null;
  setPriceBand: (v: string | null) => void;
  material: string | null;
  setMaterial: (v: string | null) => void;
  location: string | null;
  setLocation: (v: string | null) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  sort: string;
  setSort: (v: string) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
  availableMaterials: string[];
  availableLocations: string[];
  activeChips: Chip[];
  clearAll: () => void;
}

const ShopFilterCtx = createContext<ShopFilterContextValue | null>(null);

export function ShopFilterProvider({ products, children }: { products: any[]; children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const m of p.productMaterials ?? []) set.add(m);
    }
    return [...set].slice(0, 8);
  }, [products]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const loc = vendorLocation(p);
      if (loc) set.add(loc);
    }
    return [...set].slice(0, 8);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || vendorName(p).toLowerCase().includes(q)
      );
    }
    if (priceBand) {
      const band = PRICE_BANDS.find((b) => b.id === priceBand);
      if (band) list = list.filter((p) => band.test(parsePrice(p.price)));
    }
    if (material) {
      list = list.filter((p) => p.productMaterials?.includes(material));
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
  }, [products, query, priceBand, material, location, inStockOnly, sort]);

  const activeChips: Chip[] = [];
  if (query.trim()) activeChips.push({ id: "q", label: `"${query.trim()}"`, clear: () => setQuery("") });
  if (priceBand) {
    const band = PRICE_BANDS.find((b) => b.id === priceBand);
    if (band) activeChips.push({ id: "price", label: band.label, clear: () => setPriceBand(null) });
  }
  if (material) activeChips.push({ id: "material", label: material, clear: () => setMaterial(null) });
  if (location) activeChips.push({ id: "location", label: location, clear: () => setLocation(null) });
  if (inStockOnly) activeChips.push({ id: "stock", label: "In stock only", clear: () => setInStockOnly(false) });

  function clearAll() {
    setQuery("");
    setPriceBand(null);
    setMaterial(null);
    setLocation(null);
    setInStockOnly(false);
  }

  const value: ShopFilterContextValue = {
    products,
    filtered,
    query,
    setQuery,
    searchOpen,
    setSearchOpen,
    priceBand,
    setPriceBand,
    material,
    setMaterial,
    location,
    setLocation,
    inStockOnly,
    setInStockOnly,
    sort,
    setSort,
    view,
    setView,
    availableMaterials,
    availableLocations,
    activeChips,
    clearAll,
  };

  return <ShopFilterCtx.Provider value={value}>{children}</ShopFilterCtx.Provider>;
}

export function useShopFilter() {
  const ctx = useContext(ShopFilterCtx);
  if (!ctx) throw new Error("useShopFilter must be used within a ShopFilterProvider");
  return ctx;
}
