"use client";

import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import {
  averageRating,
  isNew,
  isOutOfStock,
  reviewCount,
  vendorName,
} from "./ShopFilterContext";
import { useShopFilter } from "./ShopFilterContext";
import { clearShopFilters } from "@/lib/shopFiltersBus";

interface Props {
  isFiltered: boolean;
  activeLabel: string;
}

export default function ShopProductGrid({ isFiltered, activeLabel }: Props) {
  const { filtered } = useShopFilter();

  return (
    <section id="lfs-grid" className="sl-grid">
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
            <button type="button" className="sl-empty-clear" onClick={clearShopFilters}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="sl-product-grid">
            {filtered.map((p: any) => {
              const vname = vendorName(p);
              const outOfStock = isOutOfStock(p);
              const proPrice: string = p.proPrice ?? "";
              const hasReviews = reviewCount(p) > 0;
              return (
                <Link
                  key={p.id}
                  href={`/lifestyle/${p.slug}`}
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
                      <div style={{ width: "100%", height: "100%", background: "var(--paper-deep)" }} />
                    )}
                    {!outOfStock && isNew(p) && (
                      <div className="sl-pcard-new-pip">New</div>
                    )}
                    {outOfStock && (
                      <div className="sl-pcard-sold-overlay">
                        <span>Sold Out</span>
                      </div>
                    )}
                    {!outOfStock && p.databaseId && (
                      <div className="sl-pcard-quickadd">
                        <AddToCartButton productId={p.databaseId} className="sl-pcard-quickadd-btn">
                          +
                        </AddToCartButton>
                      </div>
                    )}
                  </div>

                  <div className={`sl-pcard-body${outOfStock ? " sl-pcard-body--muted" : ""}`}>
                    {vname && <p className="sl-pcard-vendor">{vname}</p>}
                    <p className="sl-pcard-name">{p.name}</p>
                    <p className="sl-pcard-rating">
                      {hasReviews
                        ? `★ ${averageRating(p).toFixed(1)} (${reviewCount(p)})`
                        : "New listing"}
                    </p>
                    <div className="sl-pcard-price-row">
                      {outOfStock ? (
                        <span className="sl-pcard-price-now">Sold out</span>
                      ) : (
                        <>
                          {proPrice && <span className="sl-pcard-price-was">{p.price}</span>}
                          <span className="sl-pcard-price-now">
                            {proPrice ? `Pro ${proPrice}` : p.price}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
