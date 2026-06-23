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
  const { filtered, view, activeChips, clearAll } = useShopFilter();

  return (
    <section className="shop-grid-section">
      <div className="sec-label">
        {isFiltered ? activeLabel : "All Products"} — {filtered.length} pieces
      </div>
      {filtered.length === 0 ? (
        <div className="shop-empty">
          <p className="shop-empty-text">No products found.</p>
          <button type="button" className="shop-empty-clear" onClick={clearAll}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className={view === "grid" ? "product-grid" : "product-list"}>
          {filtered.map((p: any) => {
            const vname = vendorName(p);
            const outOfStock = isOutOfStock(p);
            const proPrice = formatGBP(parsePrice(p.price) * 0.9);
            const hasReviews = reviewCount(p) > 0;
            return (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className={`pcard${outOfStock ? " pcard--sold" : ""}`}
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
                    <div className="pimg-placeholder" />
                  )}
                  <div className="vetted-pip">
                    <span className="s">★</span> Vetted
                  </div>
                  {!outOfStock && isNew(p) && <div className="new-pip">New</div>}
                  {outOfStock && (
                    <div className="sold-pip">
                      <span>Sold Out</span>
                    </div>
                  )}
                </div>
                <div className={`pcard-body${outOfStock ? " pcard-body--muted" : ""}`}>
                  {vname && <div className="pvendor">{vname}</div>}
                  <div className="pname">{p.name}</div>
                  {p.price && (
                    <div className="pprice">
                      <span className="main">{p.price}</span>
                      {!outOfStock && <span className="pro">{proPrice} with Moveee Pro</span>}
                    </div>
                  )}
                  <div className="prating">
                    {hasReviews ? `★ ${averageRating(p).toFixed(1)} (${reviewCount(p)})` : "New listing"}
                  </div>
                </div>
                {outOfStock ? (
                  <button type="button" className="padd padd--sold" disabled>
                    Sold out
                  </button>
                ) : (
                  p.databaseId && <AddToCartButton productId={p.databaseId} />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
