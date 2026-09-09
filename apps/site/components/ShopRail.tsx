"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { decodeHtml } from "@/lib/decode-html";

interface ShopRailProduct {
  slug: string;
  name: string;
  price: string;
  image: string | null;
  vendor: string | null;
  databaseId?: number | null;
}

const AUTO_SCROLL_SPEED = 0.035; // px per ms — same ambient drift as HeroCarousel
const RESUME_DELAY = 2200; // ms after a manual nudge before autoplay resumes

// Plain, flush "archive style" card (.arc-shop-card) — see the homepage restyle
// that retired the pastel colorForCard() fills. Auto-scrolls continuously and
// loops infinitely, same mechanism as HeroCarousel.tsx: the product list renders
// twice back-to-back, and once the rail has scrolled exactly one full set's
// width, scrollLeft is silently wound back by that same width — since both
// halves are identical, the reset is invisible. Arrows still work (smooth-scroll
// a card width, pausing autoplay briefly), and hovering/touching the rail
// pauses it too.
export default function ShopRail({ products }: { products: ShopRailProduct[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const looped = products.length > 1 ? [...products, ...products] : products;
  const canLoop = products.length > 1;

  useEffect(() => {
    if (!canLoop) return;

    function tick(ts: number) {
      const rail = railRef.current;
      if (!rail) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 100);
      lastTsRef.current = ts;

      if (!pausedRef.current) {
        const setWidth = rail.scrollWidth / 2;
        let next = rail.scrollLeft + AUTO_SCROLL_SPEED * dt;
        if (setWidth > 0 && next >= setWidth) next -= setWidth;
        rail.scrollLeft = next;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [canLoop]);

  function step(dir: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".arc-shop-card");
    const gap = parseFloat(getComputedStyle(rail).columnGap || "22") || 22;
    const w = card ? card.getBoundingClientRect().width + gap : 220;
    pauseOnInteraction();
    resumeAfterInteraction();
    rail.scrollBy({ left: dir * w, behavior: "smooth" });
  }

  function pauseOnInteraction() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    pausedRef.current = true;
  }

  function resumeAfterInteraction() {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY);
  }

  if (products.length === 0) return null;

  return (
    <div
      className="shop-rail-wrap"
      onMouseEnter={pauseOnInteraction}
      onMouseLeave={resumeAfterInteraction}
      onTouchStart={pauseOnInteraction}
      onTouchEnd={resumeAfterInteraction}
    >
      <button className="shop-arrow shop-arrow--prev" aria-label="Previous products" onClick={() => step(-1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="shop-rail" ref={railRef}>
        {looped.map((p, i) => {
          const name = decodeHtml(p.name || "");
          const vendor = p.vendor ? decodeHtml(p.vendor) : null;
          return (
            <Link key={`${p.slug}-${i}`} href={`/lifestyle/${p.slug}`} className="arc-shop-card">
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
