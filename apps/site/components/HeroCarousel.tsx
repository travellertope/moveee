"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { decodeHtml } from "@/lib/decode-html";

interface CarouselStory {
  slug: string;
  title: string;
  categoryName: string;
  image: string | null;
  alt: string;
}

const AUTO_SCROLL_SPEED = 0.035; // px per ms — slow, ambient drift
const RESUME_DELAY = 2200; // ms after a manual nudge before autoplay resumes

// Arrow-paged flush-card rail — same card language as ShopRail.tsx's "From The
// Shop" strip (see the homepage restyle in CLAUDE.md). Auto-scrolls continuously
// and loops infinitely: the story list is rendered twice back-to-back, and once
// the rail has scrolled exactly one full set's width, scrollLeft is silently
// wound back by that same width — since the two sets are identical, the jump is
// invisible. Arrows still work (smooth-scroll a card width, pausing autoplay
// briefly), and hovering/touching the rail pauses it too.
export default function HeroCarousel({ stories }: { stories: CarouselStory[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const looped = stories.length > 1 ? [...stories, ...stories] : stories;
  const canLoop = stories.length > 1;

  useEffect(() => {
    if (!canLoop) return;

    function tick(ts: number) {
      const rail = railRef.current;
      if (!rail) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 100); // clamp big gaps (tab switch etc.)
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

  function pauseTemporarily() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY);
  }

  function step(dir: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".hero-rail-card");
    const gap = parseFloat(getComputedStyle(rail).columnGap || "24") || 24;
    const w = card ? card.getBoundingClientRect().width + gap : 236;
    pauseTemporarily();
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

  if (stories.length === 0) return null;

  return (
    <div
      className="hero-rail-wrap"
      onMouseEnter={pauseOnInteraction}
      onMouseLeave={resumeAfterInteraction}
      onTouchStart={pauseOnInteraction}
      onTouchEnd={resumeAfterInteraction}
    >
      <button className="shop-arrow shop-arrow--prev" aria-label="Previous stories" onClick={() => step(-1)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="hero-rail" ref={railRef}>
        {looped.map((s, i) => {
          const title = decodeHtml(s.title || "");
          return (
            <Link key={`${s.slug}-${i}`} href={`/magazine/${s.slug}`} className="hero-rail-card">
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
