"use client";

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
  const {
    filtered,
    query,
    setQuery,
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

  const activeCategoryName = activeCategorySlug
    ? categories.find((c) => c.slug === activeCategorySlug)?.name
    : null;

  return (
    <div className="sl-filter">
      {/* Row 1 — search + pills + right controls */}
      <div className="sl-filter-row1">
        {/* Always-visible search */}
        <input
          type="text"
          className="sl-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search makers & products…"
          aria-label="Search products"
        />

        {/* Filter pills */}
        <div className="sl-filter-pills">
          {/* Category */}
          <div className={`sl-fpill${activeCategorySlug ? " sl-fpill--active" : ""}`}>
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
            <span className="sl-fpill-caret">▾</span>
          </div>

          {/* Price */}
          <div className={`sl-fpill${priceBand ? " sl-fpill--active" : ""}`}>
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
            <span className="sl-fpill-caret">▾</span>
          </div>

          {/* Material */}
          {availableMaterials.length > 0 && (
            <div className={`sl-fpill${material ? " sl-fpill--active" : ""}`}>
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
              <span className="sl-fpill-caret">▾</span>
            </div>
          )}

          {/* Location */}
          {availableLocations.length > 0 && (
            <div className={`sl-fpill${location ? " sl-fpill--active" : ""}`}>
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
              <span className="sl-fpill-caret">▾</span>
            </div>
          )}

          {/* In Stock Only — filled when active */}
          <button
            type="button"
            className={`sl-fpill${inStockOnly ? " sl-fpill--filled" : " sl-fpill--unfilled"}`}
            onClick={() => setInStockOnly(!inStockOnly)}
          >
            In Stock Only
          </button>
        </div>

        {/* Right cluster — count, sort, view toggle */}
        <div className="sl-filter-right">
          <span className="sl-filter-count">{filtered.length} items</span>

          <select
            className="sl-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
          >
            <option value="default">Featured</option>
            <option value="price-asc">Price: Low–High</option>
            <option value="price-desc">Price: High–Low</option>
            <option value="newest">Newest</option>
            <option value="most-loved">Most Loved</option>
          </select>

          <div className="sl-view-toggle">
            <button
              type="button"
              className={`sl-vt-btn${view === "grid" ? " sl-vt-btn--active" : ""}`}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              ⊞
            </button>
            <button
              type="button"
              className={`sl-vt-btn${view === "list" ? " sl-vt-btn--active" : ""}`}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Row 2 — active filter chips */}
      {activeChips.length > 0 && (
        <div className="sl-filter-row2">
          {activeChips.map((chip) => (
            <button key={chip.id} type="button" className="sl-chip" onClick={chip.clear}>
              {chip.label} <span className="sl-chip-x">✕</span>
            </button>
          ))}
          <button type="button" className="sl-filter-clear" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
