"use client";

import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import {
  averageRating,
  formatGBP,
  isNew,
  isOutOfStock,
  parsePrice,
  reviewCount,
  vendorName,
} from "./ShopFilterContext";
import { useShopFilter } from "./ShopFilterContext";

interface Props {
  isFiltered: boolean;
  activeLabel: string;
}

export default function ShopProductGrid({ isFiltered, activeLabel }: Props) {
  const { filtered, view, clearAll } = useShopFilter();

  return (
    <section className="sl-grid">
      <div className="sl-grid-inner">
        <div className="sl-grid-header">
          <div className="sl-grid-label">
            {isFiltered ? activeLabel : "All Products"}{" "}
            <span className="sl-grid-count">— {filtered.length} pieces</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="sl-empty">
            <p className="sl-empty-text">No products found.</p>
            <button type="button" className="sl-empty-clear" onClick={clearAll}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className={view === "grid" ? "sl-product-grid" : "sl-product-list"}>
            {filtered.map((p: any) => {
              const vname = vendorName(p);
              const outOfStock = isOutOfStock(p);
              const proPrice = formatGBP(parsePrice(p.price) * 0.9);
              const hasReviews = reviewCount(p) > 0;
              return (
                <Link
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  className={`sl-pcard${outOfStock ? " sl-pcard--sold" : ""}`}
                >
                  <div className="sl-pcard-img">
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
                    <div className="sl-pcard-vetted">
                      <span className="sl-pcard-vetted-star">★</span> Vetted
                    </div>
                    {!outOfStock && isNew(p) && (
                      <div className="sl-pcard-new-pip">New</div>
                    )}
                    {outOfStock && (
                      <div className="sl-pcard-sold-overlay">
                        <span>Sold Out</span>
                      </div>
                    )}
                  </div>

                  <div className={`sl-pcard-body${outOfStock ? " sl-pcard-body--muted" : ""}`}>
                    {vname && <div className="sl-pcard-vendor">{vname}</div>}
                    <div className="sl-pcard-name">{p.name}</div>
                    {p.price && (
                      <div className="sl-pcard-prices">
                        <span className="sl-pcard-price">{p.price}</span>
                        {!outOfStock && (
                          <span className="sl-pcard-pro-price">{proPrice} with Pro</span>
                        )}
                      </div>
                    )}
                    <div className="sl-pcard-rating">
                      {hasReviews
                        ? `★ ${averageRating(p).toFixed(1)} (${reviewCount(p)})`
                        : "New listing"}
                    </div>
                  </div>

                  {outOfStock ? (
                    <button type="button" className="sl-pcard-sold-btn" disabled>
                      Sold out
                    </button>
                  ) : (
                    p.databaseId && (
                      <div className="sl-pcard-add">
                        <AddToCartButton productId={p.databaseId} />
                      </div>
                    )
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
