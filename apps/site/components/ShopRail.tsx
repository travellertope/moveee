"use client";

import Link from "next/link";
import { useRef } from "react";
import { colorForCard } from "@/lib/cardColors";

interface ShopRailProduct {
  slug: string;
  name: string;
  price: string;
  image: string | null;
  vendor: string | null;
  databaseId?: number | null;
}

// Monocle-style horizontal shop strip — arrow-paged one card at a time
// (not centre-focus/looping like the hero carousel), since reaching the
// real ends of a product rail is expected, not something to hide.
export default function ShopRail({ products }: { products: ShopRailProduct[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function step(dir: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".shop-card");
    const gap = parseFloat(getComputedStyle(rail).columnGap || "22") || 22;
    const w = card ? card.getBoundingClientRect().width + gap : 220;
    rail.scrollLeft += dir * w;
  }

  if (products.length === 0) return null;

  return (
    <div className="shop-rail-wrap">
      <button className="shop-arrow shop-arrow--prev" aria-label="Previous products" onClick={() => step(-1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="shop-rail" ref={railRef}>
        {products.map((p, i) => (
          <Link
            key={p.slug}
            href={`/shop/${p.slug}`}
            className="wcard shop-card"
            style={{ background: colorForCard(p.databaseId ?? p.slug?.length ?? i) }}
          >
            <div className="wcard-photo">
              {p.image && <img src={p.image} alt={p.name} />}
              {p.price && <span className="shop-price-tag" dangerouslySetInnerHTML={{ __html: p.price }} />}
            </div>
            <div className="shop-caption">
              {p.vendor && <div className="shop-caption-maker">{p.vendor}</div>}
              <div className="shop-caption-title">{p.name}</div>
            </div>
          </Link>
        ))}
      </div>
      <button className="shop-arrow shop-arrow--next" aria-label="Next products" onClick={() => step(1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
