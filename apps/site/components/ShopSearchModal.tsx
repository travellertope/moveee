"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  getShopFilters,
  getShopFilterMeta,
  setShopFilters,
  clearShopFilters,
  subscribeShopFilters,
  ShopFilters,
  ShopFilterMeta,
} from "@/lib/shopFiltersBus";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SORT_OPTIONS: { id: string; label: string }[] = [
  { id: "default", label: "Featured" },
  { id: "price-asc", label: "Price: Low–High" },
  { id: "price-desc", label: "Price: High–Low" },
  { id: "newest", label: "Newest" },
  { id: "most-loved", label: "Most Loved" },
];

export default function ShopSearchModal({ isOpen, onClose }: Props) {
  const [filters, setFilters] = useState<ShopFilters>(getShopFilters());
  const [meta, setMeta] = useState<ShopFilterMeta>(getShopFilterMeta());

  useEffect(
    () =>
      subscribeShopFilters(() => {
        setFilters(getShopFilters());
        setMeta(getShopFilterMeta());
      }),
    []
  );

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasActiveFilters =
    !!filters.query.trim() || !!filters.priceBand || !!filters.material || !!filters.location || filters.inStockOnly;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        {/* ── Input row ── */}
        <div className="search-input-row">
          <Search size={20} strokeWidth={1.5} className="search-icon-lead" />
          <input
            type="text"
            autoFocus
            placeholder="Search makers & products…"
            value={filters.query}
            onChange={(e) => setShopFilters({ query: e.target.value })}
            className="search-input"
          />
          <button onClick={onClose} className="search-close-btn" aria-label="Close search">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="shop-search-body">
          {/* Category */}
          {meta.categories.length > 0 && (
            <div className="shop-search-group">
              <p className="shop-search-group-label">Category</p>
              <div className="shop-search-pills">
                <Link href="/shop" onClick={onClose} className={`sl-fpill${!meta.activeCategorySlug ? " sl-fpill--active" : ""}`}>
                  All Categories
                </Link>
                {meta.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/shop/category/${cat.slug}`}
                    onClick={onClose}
                    className={`sl-fpill${meta.activeCategorySlug === cat.slug ? " sl-fpill--active" : ""}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          {meta.priceBands.length > 0 && (
            <div className="shop-search-group">
              <p className="shop-search-group-label">Price</p>
              <div className="shop-search-pills">
                <button
                  type="button"
                  className={`sl-fpill${!filters.priceBand ? " sl-fpill--active" : ""}`}
                  onClick={() => setShopFilters({ priceBand: null })}
                >
                  Any Price
                </button>
                {meta.priceBands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`sl-fpill${filters.priceBand === b.id ? " sl-fpill--active" : ""}`}
                    onClick={() => setShopFilters({ priceBand: b.id })}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Material */}
          {meta.availableMaterials.length > 0 && (
            <div className="shop-search-group">
              <p className="shop-search-group-label">Material</p>
              <div className="shop-search-pills">
                <button
                  type="button"
                  className={`sl-fpill${!filters.material ? " sl-fpill--active" : ""}`}
                  onClick={() => setShopFilters({ material: null })}
                >
                  Any Material
                </button>
                {meta.availableMaterials.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`sl-fpill${filters.material === m ? " sl-fpill--active" : ""}`}
                    onClick={() => setShopFilters({ material: filters.material === m ? null : m })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Maker location */}
          {meta.availableLocations.length > 0 && (
            <div className="shop-search-group">
              <p className="shop-search-group-label">Maker Location</p>
              <div className="shop-search-pills">
                <button
                  type="button"
                  className={`sl-fpill${!filters.location ? " sl-fpill--active" : ""}`}
                  onClick={() => setShopFilters({ location: null })}
                >
                  Any Location
                </button>
                {meta.availableLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className={`sl-fpill${filters.location === loc ? " sl-fpill--active" : ""}`}
                    onClick={() => setShopFilters({ location: filters.location === loc ? null : loc })}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="shop-search-group">
            <p className="shop-search-group-label">Sort</p>
            <div className="shop-search-pills">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`sl-fpill${filters.sort === s.id ? " sl-fpill--active" : ""}`}
                  onClick={() => setShopFilters({ sort: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* In stock only */}
          <div className="shop-search-group">
            <button
              type="button"
              className={`sl-fpill${filters.inStockOnly ? " sl-fpill--filled" : " sl-fpill--unfilled"}`}
              onClick={() => setShopFilters({ inStockOnly: !filters.inStockOnly })}
            >
              In Stock Only
            </button>
          </div>

          <div className="shop-search-footer">
            {hasActiveFilters && (
              <button type="button" className="sl-filter-clear" onClick={clearShopFilters}>
                Clear all filters
              </button>
            )}
            <button type="button" className="shop-search-view-btn" onClick={onClose}>
              View {meta.resultCount} {meta.resultCount === 1 ? "Result" : "Results"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
