"use client";
import { sanitizeHtml } from "@/lib/sanitize";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import EventThumb from "./EventThumb";

interface CarouselEvent {
  id: string | number;
  slug: string;
  title: string;
  eventDate?: string;
  date?: string;
  location?: string;
  city?: string;
  admission?: string;
  featuredImage?: { node?: { sourceUrl?: string } };
  eventImageUrl?: string;
  cultureInterests?: { nodes: Array<{ name: string; slug: string }> };
  isAiGenerated?: boolean;
  isPro?: boolean;
  href?: string;
}

interface EventsCarouselProps {
  events: CarouselEvent[];
}

function fmtDate(raw?: string): string {
  if (!raw) return "TBA";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
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
    const card = el.querySelector<HTMLElement>(".evt-carousel-card");
    const amount = (card?.offsetWidth ?? 300) + 24;
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  }, []);

  if (!events.length) return null;

  return (
    <div className="evt-carousel-wrap">
      <button
        className={`evt-carousel-btn evt-carousel-btn--prev${canPrev ? "" : " evt-carousel-btn--hidden"}`}
        onClick={() => scroll("prev")}
        aria-label="Previous"
        tabIndex={canPrev ? 0 : -1}
      >←</button>

      <div className="evt-carousel-track" ref={trackRef}>
        {events.map((event) => {
          const dateStr = fmtDate(event.eventDate || event.date);
          const catNode = event.cultureInterests?.nodes?.[0];
          const catSlug = catNode?.slug || "";
          const img = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
          const place = event.city || event.location || "";
          const free = !event.admission || /free/i.test(event.admission);

          return (
            <Link key={event.slug} href={event.href || `/events/${event.slug}`} className="evt-carousel-card">
              {event.isPro && <span className="evt-carousel-pro-badge">Pro Only</span>}
              <div className="evt-carousel-img">
                <EventThumb src={img} title={event.title} categorySlug={catSlug} fontSize={22} />
              </div>
              <div className="evt-carousel-body">
                <h4 className="evt-carousel-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.title) }} />
                <div className="evt-carousel-row">
                  <span>📅 {dateStr}</span>
                </div>
                {place && (
                  <div className="evt-carousel-row">
                    <span>📍 {place}</span>
                  </div>
                )}
                <div className="evt-carousel-footer">
                  <span className="evt-carousel-price">{free ? "Free" : event.admission}</span>
                  <span className="evt-carousel-rsvp-pill">RSVP</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <button
        className={`evt-carousel-btn evt-carousel-btn--next${canNext ? "" : " evt-carousel-btn--hidden"}`}
        onClick={() => scroll("next")}
        aria-label="Next"
        tabIndex={canNext ? 0 : -1}
      >→</button>
    </div>
  );
}
