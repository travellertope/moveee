"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { decodeHtml } from "@/lib/decode-html";

interface Story {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
    "wp:term"?: Array<Array<{ name: string }>>;
  };
}

export default function IssueCarousel({ stories }: { stories: Story[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [stories, checkScroll]);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(".hp-issue-card")?.offsetWidth ?? 220;
    el.scrollBy({ left: dir === "right" ? cardWidth + 20 : -(cardWidth + 20), behavior: "smooth" });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current.active = false;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = "";
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  if (!stories.length) return null;

  return (
    <div className="hp-carousel-wrap hp-issue-carousel">
      <button
        className={`hp-carousel-btn hp-carousel-btn--prev${canScrollLeft ? "" : " hp-carousel-btn--hidden"}`}
        onClick={() => scroll("left")}
        aria-label="Previous stories"
        tabIndex={canScrollLeft ? 0 : -1}
      >
        ←
      </button>

      <div
        className="hp-carousel-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {stories.map((story) => {
          const img = story._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          const cat = decodeHtml(story._embedded?.["wp:term"]?.[0]?.[0]?.name || "Culture");
          return (
            <Link
              key={story.id}
              href={`/magazine/${story.slug}`}
              className="hp-carousel-card hp-issue-card"
              draggable={false}
            >
              <div className="hp-issue-card-image">
                {img && (
                  <Image
                    src={img}
                    alt={story.title?.rendered || ""}
                    fill
                    className="object-cover"
                    draggable={false}
                  />
                )}
              </div>
              <span className="hp-mag-cat">{cat}</span>
              <h4 className="hp-mag-card-title">{decodeHtml(story.title?.rendered || "")}</h4>
              <span className="hp-mag-card-meta">
                {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </Link>
          );
        })}
      </div>

      <button
        className={`hp-carousel-btn hp-carousel-btn--next${canScrollRight ? "" : " hp-carousel-btn--hidden"}`}
        onClick={() => scroll("right")}
        aria-label="Next stories"
        tabIndex={canScrollRight ? 0 : -1}
      >
        →
      </button>
    </div>
  );
}
