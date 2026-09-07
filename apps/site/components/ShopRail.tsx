"use client";

import Link from "next/link";
import { useRef } from "react";
import { decodeHtml } from "@/lib/decode-html";

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
// Cards are the plain, flush "archive style" card (.arc-shop-card) — see
// the homepage restyle that retired the pastel colorForCard() fills.
export default function ShopRail({ products }: { products: ShopRailProduct[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function step(dir: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".arc-shop-card");
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
        {products.map((p) => {
          const name = decodeHtml(p.name || "");
          const vendor = p.vendor ? decodeHtml(p.vendor) : null;
          return (
            <Link key={p.slug} href={`/shop/${p.slug}`} className="arc-shop-card">
              <div className="arc-card-img">{p.image && <img src={p.image} alt={name} />}</div>
              {vendor && <span className="arc-shop-vendor">{vendor}</span>}
              <h3>{name}</h3>
              {p.price && <span className="arc-shop-price" dangerouslySetInnerHTML={{ __html: p.price }} />}
            </Link>
          );
        })}
      </div>
      <button className="shop-arrow shop-arrow--next" aria-label="Next products" onClick={() => step(1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
