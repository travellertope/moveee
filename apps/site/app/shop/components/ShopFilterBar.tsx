"use client";

import { usePathname } from "next/navigation";
import { PRICE_BANDS, useShopFilter } from "./ShopFilterContext";

interface Category {
  name: string;
  slug: string;
  count?: number;
}

interface Props {
  categories: Category[];
  activeCategorySlug?: string;
}

export default function ShopFilterBar({ categories, activeCategorySlug }: Props) {
  const pathname = usePathname();
  const {
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
  } = useShopFilter();

  const isActive = (href: string) => pathname === href;
  const activeCategoryName = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)?.name
    : null;

  return (
    <div className="filter-bar filter-bar--dd">
      <div className="filter-bar-inner">
        <div className="filter-dd-row">
          <div className="filter-dd-pill">
            <span>{activeCategoryName ?? "Category"}</span>
            <select
              aria-label="Filter by category"
              value={activeCategorySlug ?? ""}
              onChange={(e) => {
                window.location.href = e.target.value ? `/shop/category/${e.target.value}` : "/shop";
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="dd-caret">▾</span>
          </div>

          <div className="filter-dd-pill">
            <span>{priceBand ? PRICE_BANDS.find((b) => b.id === priceBand)?.label : "Price"}</span>
            <select
              aria-label="Filter by price"
              value={priceBand ?? ""}
              onChange={(e) => setPriceBand(e.target.value || null)}
            >
              <option value="">Any Price</option>
              {PRICE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <span className="dd-caret">▾</span>
          </div>

          <div className="filter-dd-pill">
            <span>{material ?? "Material"}</span>
            <select
              aria-label="Filter by material"
              value={material ?? ""}
              onChange={(e) => setMaterial(e.target.value || null)}
            >
              <option value="">Any Material</option>
              {availableMaterials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="dd-caret">▾</span>
          </div>

          <div className="filter-dd-pill">
            <span>{location ?? "Maker Location"}</span>
            <select
              aria-label="Filter by maker location"
              value={location ?? ""}
              onChange={(e) => setLocation(e.target.value || null)}
            >
              <option value="">Any Location</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span className="dd-caret">▾</span>
          </div>

          <button
            type="button"
            className={`filter-dd-stock${inStockOnly ? " active" : ""}`}
            onClick={() => setInStockOnly(!inStockOnly)}
          >
            In Stock Only
          </button>

          <button
            className={`ftab ftab-search${searchOpen ? " active" : ""}`}
            onClick={() => setSearchOpen(!searchOpen)}
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
  );
}
