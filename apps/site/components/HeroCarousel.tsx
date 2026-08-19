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
// .frame--* rules in homepage-v2.css) — derived from each card's own index
// so server and client render identically, same convention as
// MasonryRandomSection.tsx's shapeForRow().
const FRAMES = ["frame--cream", "frame--teal", "frame--gold", "frame--clay", "frame--plum", "frame--paper"];

// Centered-snap carousel: the card nearest the viewport centre scales up,
// the rest recede. Ported from the mockup's carousel-track/strip-card
// behavior, minus its infinite-loop clone trick (a real product with a
// finite story pool doesn't need to fake looping — reaching the real ends
// is fine here, same tradeoff the mockup's own shop rail already makes).
export default function HeroCarousel({ stories }: { stories: CarouselStory[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function layout() {
      const containerW = track!.parentElement?.clientWidth || 900;
      const cardW = Math.max(180, (containerW - 20 * 4) / 4);
      document.documentElement.style.setProperty("--carousel-card-w", cardW + "px");
    }

    function updateActive() {
      const cards = Array.from(track!.querySelectorAll<HTMLElement>(".strip-card"));
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
    }

    layout();
    updateActive();

    let raf: number | null = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        updateActive();
        raf = null;
      });
    };
    const onResize = () => {
      layout();
      updateActive();
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [stories]);

  if (stories.length === 0) return null;

  return (
    <div className="index-strip">
      <div className="carousel-track" ref={trackRef}>
        {stories.map((s, i) => (
          <div className={`strip-card${i === activeIndex ? " is-active" : ""}`} key={s.slug}>
            <Link className={`fcell ${FRAMES[i % FRAMES.length]}`} href={`/magazine/${s.slug}`}>
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
