"use client";

import Link from "next/link";
import { useRef } from "react";
import { decodeHtml } from "@/lib/decode-html";

interface CarouselStory {
  slug: string;
  title: string;
  categoryName: string;
  image: string | null;
  alt: string;
}

// Arrow-paged flush-card rail — same mechanism and card language as
// ShopRail.tsx's "From The Shop" strip (see the homepage restyle in
// CLAUDE.md that retired this section's old dark, perforated "filmstrip"
// band and pastel colorForCard-style frames in favour of the plain,
// hairline-ruled treatment every other homepage section now uses).
export default function HeroCarousel({ stories }: { stories: CarouselStory[] }) {
  const railRef = useRef<HTMLDivElement>(null);

  function step(dir: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".hero-rail-card");
    const gap = parseFloat(getComputedStyle(rail).columnGap || "24") || 24;
    const w = card ? card.getBoundingClientRect().width + gap : 236;
    rail.scrollLeft += dir * w;
  }

  if (stories.length === 0) return null;

  return (
    <div className="hero-rail-wrap">
      <button className="shop-arrow shop-arrow--prev" aria-label="Previous stories" onClick={() => step(-1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="hero-rail" ref={railRef}>
        {stories.map((s) => {
          const title = decodeHtml(s.title || "");
          return (
            <Link key={s.slug} href={`/magazine/${s.slug}`} className="hero-rail-card">
              <div className="arc-card-img">{s.image && <img src={s.image} alt={s.alt} />}</div>
              <span className="hero-rail-kicker">{s.categoryName}</span>
              <h3>{title}</h3>
            </Link>
          );
        })}
      </div>
      <button className="shop-arrow shop-arrow--next" aria-label="Next stories" onClick={() => step(1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
