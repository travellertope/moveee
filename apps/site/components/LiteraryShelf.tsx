"use client";

import { useRef } from "react";
import Link from "next/link";
import LiteraryGenreArt from "./LiteraryGenreArt";

export interface LiteraryShelfItem {
  href: string;
  label: string;
  slug: string;
}

// Horizontally-scrolling "shelf" of section tiles — the real, backend-safe
// stand-in for the mockup's back-catalogue shelf (there's no volume/issue
// taxonomy in the CMS, so this links to the six genre archives instead of
// fabricated past issues). Each tile renders a real illustrated cover
// (LiteraryGenreArt) rather than a flat gradient + abbreviation. Arrow
// buttons nudge the same scroll container CSS already makes swipeable/
// scrollable on touch.
export default function LiteraryShelf({ items }: { items: LiteraryShelfItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <div className="lit-shelf">
      <div className="lit-shelf-track" ref={trackRef}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="lit-shelf-item">
            <div className="lit-shelf-cover">
              <LiteraryGenreArt slug={item.slug} />
            </div>
            <div className="lit-shelf-name">{item.label}</div>
          </Link>
        ))}
      </div>
      <button type="button" className="lit-shelf-nav lit-shelf-nav--l" aria-label="Scroll left" onClick={() => scrollBy(-280)}>
        ‹
      </button>
      <button type="button" className="lit-shelf-nav lit-shelf-nav--r" aria-label="Scroll right" onClick={() => scrollBy(280)}>
        ›
      </button>
    </div>
  );
}
