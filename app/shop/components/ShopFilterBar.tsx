"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Category {
  name: string;
  slug: string;
  count?: number;
}

interface ShopFilterBarProps {
  categories: Category[];
  productCount: number;
  onViewChange?: (view: "grid" | "list") => void;
  onSortChange?: (sort: string) => void;
}

export default function ShopFilterBar({
  categories,
  productCount,
  onViewChange,
  onSortChange,
}: ShopFilterBarProps) {
  const pathname = usePathname();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("default");

  function handleView(v: "grid" | "list") {
    setView(v);
    onViewChange?.(v);
  }

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    setSort(e.target.value);
    onSortChange?.(e.target.value);
  }

  const isActive = (href: string) => pathname === href;

  return (
    <div className="filter-bar">
      <div className="filter-bar-inner">
        <div className="filter-tabs">
          <Link href="/shop" className={`ftab${isActive("/shop") ? " active" : ""}`}>
            All
          </Link>
          {categories.map((cat) => {
            const href = `/shop/category/${cat.slug}`;
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`ftab${isActive(href) ? " active" : ""}`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        <div className="filter-right">
          <select
            className="sort-select"
            value={sort}
            onChange={handleSort}
            aria-label="Sort products"
          >
            <option value="default">Sort: Featured</option>
            <option value="price-asc">Price: Low–High</option>
            <option value="price-desc">Price: High–Low</option>
            <option value="newest">Newest</option>
          </select>

          <div className="view-toggle">
            <button
              className={`vt-btn${view === "grid" ? " active" : ""}`}
              onClick={() => handleView("grid")}
              aria-label="Grid view"
            >
              ⊞
            </button>
            <button
              className={`vt-btn${view === "list" ? " active" : ""}`}
              onClick={() => handleView("list")}
              aria-label="List view"
            >
              ☰
            </button>
          </div>

          <div className="result-count">{productCount} items</div>
        </div>
      </div>
    </div>
  );
}
