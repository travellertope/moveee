"use client"

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

interface Category {
  name: string;
  slug: string;
  count?: number;
}

interface ShopBrowserProps {
  products: any[];
  categories: Category[];
  isFiltered: boolean;
  activeLabel: string;
}

const PRICE_BANDS = [
  { id: "under-50", label: "Under £50", test: (n: number) => n < 50 },
  { id: "50-100", label: "£50–£100", test: (n: number) => n >= 50 && n < 100 },
  { id: "100-200", label: "£100–£200", test: (n: number) => n >= 100 && n < 200 },
  { id: "200-plus", label: "£200+", test: (n: number) => n >= 200 },
];

function vendorName(p: any): string {
  return p.vendorProfile?.storeName || "";
}

function vendorLocation(p: any): string {
  return p.vendorProfile?.city || p.vendorProfile?.country || "";
}

function averageRating(p: any): number {
  return parseFloat(p.averageRating) || 0;
}

function reviewCount(p: any): number {
  return p.reviewCount ?? 0;
}

function isNew(p: any): boolean {
  return p.productTags?.nodes?.some((t: any) => t.slug === "new") ?? false;
}

function isOutOfStock(p: any): boolean {
  return p.stockStatus === "OUT_OF_STOCK";
}

function parsePrice(price?: string): number {
  if (!price) return 0;
  const cleaned = price.replace(/<[^>]*>/g, "").replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function formatGBP(n: number): string {
  return `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
}

export default function ShopBrowser({
  products,
  categories,
  isFiltered,
  activeLabel,
}: ShopBrowserProps) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  const isActive = (href: string) => pathname === href;

  const availableTags = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of products) {
      for (const t of p.productTags?.nodes ?? []) {
        if (t.slug !== "new") set.set(t.slug, t.name);
      }
    }
    return [...set.entries()].slice(0, 6);
  }, [products]);

  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const m of p.productMaterials ?? []) set.add(m);
    }
    return [...set].slice(0, 6);
  }, [products]);

  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const loc = vendorLocation(p);
      if (loc) set.add(loc);
    }
    return [...set].slice(0, 6);
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
    if (tag) {
      list = list.filter((p) => p.productTags?.nodes?.some((t: any) => t.slug === tag));
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
  }, [products, query, priceBand, tag, material, location, inStockOnly, sort]);

  const activeChips: Array<{ id: string; label: string; clear: () => void }> = [];
  if (query.trim()) activeChips.push({ id: "q", label: `"${query.trim()}"`, clear: () => setQuery("") });
  if (priceBand) {
    const band = PRICE_BANDS.find((b) => b.id === priceBand);
    if (band) activeChips.push({ id: "price", label: band.label, clear: () => setPriceBand(null) });
  }
  if (tag) {
    const found = availableTags.find(([slug]) => slug === tag);
    activeChips.push({ id: "tag", label: found?.[1] ?? tag, clear: () => setTag(null) });
  }
  if (material) activeChips.push({ id: "material", label: material, clear: () => setMaterial(null) });
  if (location) activeChips.push({ id: "location", label: location, clear: () => setLocation(null) });
  if (inStockOnly) activeChips.push({ id: "stock", label: "In stock only", clear: () => setInStockOnly(false) });

  function clearAll() {
    setQuery("");
    setPriceBand(null);
    setTag(null);
    setMaterial(null);
    setLocation(null);
    setInStockOnly(false);
  }

  return (
    <>
      {/* ── FILTER BAR ── */}
      <div className="filter-bar">
        <div className="filter-bar-inner">
          <div className="filter-tabs">
            <Link href="/shop" className={`ftab${isActive("/shop") ? " active" : ""}`}>
              All
            </Link>
            {categories.map((cat) => {
              const href = `/shop/category/${cat.slug}`;
              return (
                <Link key={cat.slug} href={href} className={`ftab${isActive(href) ? " active" : ""}`}>
                  {cat.name}
                </Link>
              );
            })}
            <button
              className={`ftab ftab-search${searchOpen ? " active" : ""}`}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              type="button"
            >
              ⌕
            </button>
          </div>

          <div className="filter-right">
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort products"
            >
              <option value="default">Sort: Featured</option>
              <option value="price-asc">Price: Low–High</option>
              <option value="price-desc">Price: High–Low</option>
              <option value="newest">Newest</option>
              <option value="most-loved">Most Loved</option>
            </select>

            <div className="view-toggle">
              <button
                className={`vt-btn${view === "grid" ? " active" : ""}`}
                onClick={() => setView("grid")}
                aria-label="Grid view"
                type="button"
              >
                ⊞
              </button>
              <button
                className={`vt-btn${view === "list" ? " active" : ""}`}
                onClick={() => setView("list")}
                aria-label="List view"
                type="button"
              >
                ☰
              </button>
            </div>

            <div className="result-count">{filtered.length} items</div>
          </div>
        </div>

        {searchOpen && (
          <div className="filter-search-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by product or maker…"
              className="filter-search-input"
              autoFocus
            />
          </div>
        )}

        <div className="filter-facets">
          {PRICE_BANDS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`facet-pill${priceBand === b.id ? " active" : ""}`}
              onClick={() => setPriceBand(priceBand === b.id ? null : b.id)}
            >
              {b.label}
            </button>
          ))}
          {availableTags.map(([slug, name]) => (
            <button
              key={slug}
              type="button"
              className={`facet-pill${tag === slug ? " active" : ""}`}
              onClick={() => setTag(tag === slug ? null : slug)}
            >
              {name}
            </button>
          ))}
          {availableMaterials.map((m) => (
            <button
              key={m}
              type="button"
              className={`facet-pill${material === m ? " active" : ""}`}
              onClick={() => setMaterial(material === m ? null : m)}
            >
              {m}
            </button>
          ))}
          {availableLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              className={`facet-pill${location === loc ? " active" : ""}`}
              onClick={() => setLocation(location === loc ? null : loc)}
            >
              {loc}
            </button>
          ))}
          <button
            type="button"
            className={`facet-pill${inStockOnly ? " active" : ""}`}
            onClick={() => setInStockOnly((v) => !v)}
          >
            In Stock Only
          </button>
        </div>

        {activeChips.length > 0 && (
          <div className="filter-chips">
            {activeChips.map((chip) => (
              <button key={chip.id} type="button" className="filter-chip" onClick={chip.clear}>
                {chip.label} ✕
              </button>
            ))}
            <button type="button" className="filter-chip filter-chip-clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN PRODUCT GRID ── */}
      <section className="shop-grid-section">
        <div className="sec-label">
          {isFiltered ? activeLabel : "All Products"} — {filtered.length} pieces
        </div>
        {filtered.length === 0 ? (
          <div className="shop-empty">
            <p style={{ color: "var(--mute)", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
              No products found.
            </p>
            {activeChips.length > 0 && (
              <button type="button" className="filter-chip filter-chip-clear" onClick={clearAll}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={view === "grid" ? "product-grid" : "product-list"}>
            {filtered.map((p: any) => {
              const vname = vendorName(p);
              const outOfStock = isOutOfStock(p);
              const proPrice = formatGBP(parsePrice(p.price) * 0.9);
              return (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className="pcard"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="pimg">
                    {p.image?.sourceUrl ? (
                      <Image
                        src={p.image.sourceUrl}
                        alt={p.image.altText || p.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                    <div className="vetted-pip"><span className="s">★</span> Vetted</div>
                    {isNew(p) && <div className="new-pip">New</div>}
                    {outOfStock && (
                      <div className="sold-pip"><span>Sold Out</span></div>
                    )}
                  </div>
                  {vname && <div className="pvendor">{vname}</div>}
                  <div className="pname">{p.name}</div>
                  {p.price && (
                    <div className="pprice">
                      <span className="main">{p.price}</span>
                      {!outOfStock && <span className="pro">{proPrice} with Pro</span>}
                    </div>
                  )}
                  <div className="prating">
                    {reviewCount(p) > 0
                      ? `★ ${averageRating(p).toFixed(1)} (${reviewCount(p)})`
                      : "New listing"}
                  </div>
                  {!outOfStock && p.databaseId && (
                    <AddToCartButton productId={p.databaseId} />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
