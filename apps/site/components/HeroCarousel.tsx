"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface CarouselStory {
  slug: string;
  title: string;
  categoryName: string;
  image: string | null;
  alt: string;
}

// Rotating card background, matching the mockup's 6-color cycle (see the
// .frame--* rules in homepage-v2.css) — derived from each card's own
// position in the real (unrepeated) story list, so a clone always matches
// its original's color.
const FRAMES = ["frame--cream", "frame--teal", "frame--gold", "frame--clay", "frame--plum", "frame--paper"];

const GAP = 20;
// Clones on each side. Centering any given card needs roughly 2 card-widths
// of *trailing* content after it (half the ~4-card-wide viewport on each
// side of the centered one) — scrollLeft can never exceed
// scrollWidth-clientWidth, so a card with less than that much real/clone
// content after it can never actually be centered. N=4 leaves 3 trailing
// cards past the outermost clone, comfortably enough. Ported verbatim from
// the mockup's own carousel — see its "Hero carousel: centre-snap..."
// comment for the full reasoning.
const N = 4;

interface RenderItem extends CarouselStory {
  _key: string;
  _clone: boolean;
  _origIndex: number;
}

// Centered-snap, genuinely infinite-looping carousel: the card nearest the
// viewport centre scales up, N clones of the tail/head are prepended/
// appended (aria-hidden, not tabbable) so there's always something cropped
// at each edge, and once scrolling settles inside a cloned region the track
// silently jumps by exactly one full lap to the matching real card — same
// scrollLeft-within-the-lap, so the jump is imperceptible. Ported from the
// mockup's own carousel algorithm (mockups/web/moveee_homepage_wepresent_concept.html).
export default function HeroCarousel({ stories }: { stories: CarouselStory[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(N);

  const realCount = stories.length;

  const renderList: RenderItem[] = realCount
    ? [
        ...stories.slice(-N).map((s, i, arr) => ({
          ...s,
          _key: `lead-clone-${i}`,
          _clone: true,
          _origIndex: realCount - arr.length + i,
        })),
        ...stories.map((s, i) => ({ ...s, _key: `real-${i}`, _clone: false, _origIndex: i })),
        ...stories.slice(0, N).map((s, i) => ({ ...s, _key: `trail-clone-${i}`, _clone: true, _origIndex: i })),
      ]
    : [];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || realCount === 0) return;

    function cardEls() {
      return Array.from(track!.querySelectorAll<HTMLElement>(".strip-card"));
    }

    function layout() {
      const containerW = track!.parentElement?.clientWidth || 900;
      const cardW = Math.max(180, (containerW - GAP * 4) / 4);
      document.documentElement.style.setProperty("--carousel-card-w", cardW + "px");
      return cardW;
    }

    function currentCardW() {
      return (
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--carousel-card-w")) || 0
      );
    }

    function updateActive(): number {
      const cards = cardEls();
      const trackRect = track!.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      let closestIndex = 0;
      let closestDist = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const d = Math.abs(cx - centerX);
        if (d < closestDist) {
          closestDist = d;
          closestIndex = i;
        }
      });
      setActiveIndex(closestIndex);
      return closestIndex;
    }

    function positionOn(index: number) {
      const cardW = layout();
      const cards = cardEls();
      const target = cards[index];
      if (!target) return;
      const trackRect = track!.getBoundingClientRect();
      const cardRect = target.getBoundingClientRect();
      const currentOffset = cardRect.left - trackRect.left + track!.scrollLeft;
      const peek = cardW / 2; // exactly half a card left cropped at the edge
      track!.scrollLeft = Math.max(0, currentOffset - peek);
      updateActive();
    }

    // Real cards occupy combined positions [N, N + LAP - 1]. Once scrolling
    // settles with a clone centered (idx outside that range), jump exactly
    // one lap so the equivalent real card is centered in the identical spot.
    const LAP = realCount;
    let settleTimer: ReturnType<typeof setTimeout>;

    function checkLoopJump() {
      const idx = updateActive();
      const step = currentCardW() + GAP;
      if (idx < N) {
        track!.scrollLeft += LAP * step;
      } else if (idx >= N + LAP) {
        track!.scrollLeft -= LAP * step;
      }
      updateActive();
    }

    let raf: number | null = null;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActive);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(checkLoopJump, 120);
    };
    const onResize = () => positionOn(N);

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const rafId = requestAnimationFrame(() => positionOn(N));

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stories, realCount]);

  if (realCount === 0) return null;

  return (
    <div className="index-strip">
      <div className="carousel-track" ref={trackRef}>
        {renderList.map((s, i) => (
          <div
            className={`strip-card${i === activeIndex ? " is-active" : ""}`}
            key={s._key}
            aria-hidden={s._clone ? true : undefined}
          >
            <Link
              className={`fcell ${FRAMES[s._origIndex % FRAMES.length]}`}
              href={`/magazine/${s.slug}`}
              tabIndex={s._clone ? -1 : undefined}
            >
              <div className="fcell-photo">{s.image && <img src={s.image} alt={s.alt} />}</div>
              <div className="fcell-kicker">{s.categoryName}</div>
              <h3 dangerouslySetInnerHTML={{ __html: s.title }} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
