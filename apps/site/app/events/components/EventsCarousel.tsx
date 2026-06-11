"use client";
import { sanitizeHtml } from "@/lib/sanitize";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface CarouselEvent {
  id: string | number;
  slug: string;
  title: string;
  eventDate?: string;
  date?: string;
  location?: string;
  city?: string;
  featuredImage?: { node?: { sourceUrl?: string } };
  eventImageUrl?: string;
  cultureInterests?: { nodes: Array<{ name: string; slug: string }> };
  isAiGenerated?: boolean;
}

interface EventsCarouselProps {
  events: CarouselEvent[];
}

function fmtDate(raw?: string): string {
  if (!raw) return "TBA";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

export default function EventsCarousel({ events }: EventsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
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
  }, [events, checkScroll]);

  const scroll = useCallback((dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".evc-card");
    const amount = (card?.offsetWidth ?? 340) + 20;
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }, []);

  if (!events.length) return null;

  return (
    <div className="evc-wrap">
      <button
        className={`evc-btn evc-btn--prev${canPrev ? "" : " evc-btn--hidden"}`}
        onClick={() => scroll("prev")}
        aria-label="Previous"
        tabIndex={canPrev ? 0 : -1}
      >←</button>

      <div className="evc-track" ref={trackRef}>
        {events.map((event) => {
          const dateStr = fmtDate(event.eventDate || event.date);
          const cat = event.cultureInterests?.nodes?.[0]?.name || "";
          const img = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
          const place = event.city || event.location || "";

          return (
            <Link key={event.slug} href={`/events/${event.slug}`} className="evc-card">
              <div className="evc-image">
                {img ? (
                  <Image src={img} alt={event.title} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className="evc-placeholder" />
                )}
                <div className="evc-image-overlay">
                  <span className="evc-overlay-date">{dateStr}</span>
                  {place && <span className="evc-overlay-place">{place}</span>}
                </div>
              </div>
              <div className="evc-body">
                {cat && <span className="evc-cat">{cat}</span>}
                <h4 className="evc-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.title) }} />
              </div>
            </Link>
          );
        })}
      </div>

      <button
        className={`evc-btn evc-btn--next${canNext ? "" : " evc-btn--hidden"}`}
        onClick={() => scroll("next")}
        aria-label="Next"
        tabIndex={canNext ? 0 : -1}
      >→</button>
    </div>
  );
}
