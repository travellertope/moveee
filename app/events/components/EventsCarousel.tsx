"use client";

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
  cultureInterests?: { nodes: Array<{ name: string; slug: string }> };
  isAiGenerated?: boolean;
}

interface EventsCarouselProps {
  events: CarouselEvent[];
}

function fmtDate(raw?: string): { day: string; month: string } {
  if (!raw) return { day: "TBA", month: "" };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { day: "TBA", month: "" };
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
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
    const amount = (card?.offsetWidth ?? 280) + 24;
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
          const { day, month } = fmtDate(event.eventDate || event.date);
          const cat = event.cultureInterests?.nodes?.[0]?.name || "";
          const img = event.featuredImage?.node?.sourceUrl;
          const place = event.city || event.location || "";

          return (
            <Link key={event.slug} href={`/events/${event.slug}`} className="evc-card">
              <div className="evc-image">
                {event.isAiGenerated && (
                  <span className="evc-discovered">Discovered</span>
                )}
                {img ? (
                  <Image src={img} alt={event.title} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className="evc-placeholder" />
                )}
              </div>
              <div className="evc-body">
                <div className="evc-date">
                  <span className="evc-day">{day}</span>
                  <span className="evc-month">{month}</span>
                </div>
                <h4 className="evc-title" dangerouslySetInnerHTML={{ __html: event.title }} />
                <div className="evc-meta">
                  {place}{place && cat ? " · " : ""}{cat}
                </div>
                <span className="evc-cta">View →</span>
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
