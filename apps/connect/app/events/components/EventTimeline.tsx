import type { ReactNode } from "react";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";
import EventThumb from "./EventThumb";

interface TimelineEvent {
  id: string | number;
  slug: string;
  title: string;
  eventDate?: string;
  endDate?: string;
  date?: string;
  location?: string;
  city?: string;
  openingHours?: string;
  admission?: string;
  isFeatured?: boolean;
  isLiterati?: boolean;
  /** Real WP Admin field on editorial events ("Physical Event" checkbox) —
   * absent/false means Virtual, matching the WP theme templates' own
   * default direction (single/archive-culture_event.php). Community events
   * are always mapped to true (see mapCommunityEvent in events/page.tsx). */
  isPhysical?: boolean;
  isAiGenerated?: boolean;
  featuredImage?: { node?: { sourceUrl?: string } };
  eventImageUrl?: string;
  cultureInterests?: { nodes: Array<{ name: string; slug: string }> };
  href?: string;
}

interface SidebarCity  { slug: string; name: string; country: string; count: number }
interface SidebarCat   { slug: string; name: string; icon: string }

interface EventTimelineProps {
  events: TimelineEvent[];
  sidebarCities?: SidebarCity[];
  sidebarCategories?: SidebarCat[];
  activeCitySlug?: string;
  activeCategorySlug?: string;
  emptyMessage?: string;
  /** Overrides the default cities/categories sidebar with custom content —
   * used by the main /events page for its trending-cities + Literati
   * Connect teaser rail. Archive pages that don't pass this keep the
   * original cities/categories list unchanged. */
  rightRail?: ReactNode;
}

function getMonthKey(raw?: string): string {
  if (!raw) return "Upcoming";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "Upcoming";
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function fmtDateRange(eventDate?: string, endDate?: string): string {
  const fmt = (raw?: string) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
  };
  const start = fmt(eventDate);
  const end   = fmt(endDate);
  if (!start) return "TBA";
  return end && end !== start ? `${start} — ${end}` : start;
}

function fmtDayHeading(raw?: string): { short: string; weekday: string } {
  if (!raw) return { short: "TBA", weekday: "" };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { short: "TBA", weekday: "" };
  return {
    short:   d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    weekday: d.toLocaleDateString("en-GB", { weekday: "long" }),
  };
}

function fmtTimeRange(eventDate?: string, endDate?: string): string {
  const fmt = (raw?: string) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" }).toUpperCase();
  };
  const start = fmt(eventDate);
  const end   = fmt(endDate);
  if (!start) return "";
  return end ? `${start} – ${end}` : start;
}

function groupByDay(events: TimelineEvent[]) {
  const map = new Map<string, { heading: { short: string; weekday: string }; events: TimelineEvent[] }>();
  for (const e of events) {
    const raw = e.eventDate || e.date;
    const heading = fmtDayHeading(raw);
    const key = heading.short || "TBA";
    if (!map.has(key)) map.set(key, { heading, events: [] });
    map.get(key)!.events.push(e);
  }
  return Array.from(map.values());
}

function groupByMonth(events: TimelineEvent[]) {
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const key = getMonthKey(e.eventDate || e.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([month, evs]) => ({ month, days: groupByDay(evs) }));
}

const CAT_DOT: Record<string, string> = {
  music: "#C5491F",
  film: "#1976D2",
  "visual-arts": "#6B48A8",
  literature: "#78350F",
  food: "#B38238",
  community: "#2D6A4F",
};

function EventRow({ event }: { event: TimelineEvent }) {
  const img     = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
  const catNode = event.cultureInterests?.nodes?.[0];
  const cat     = catNode?.name || "";
  const catSlug = catNode?.slug || "default";
  const place   = event.city || event.location || "";
  const timeRange = fmtTimeRange(event.eventDate, event.endDate);
  const free = !event.admission || /free/i.test(event.admission);
  // Featured and Literati Connect are no longer separate sections — they're
  // just rows in the same timeline, distinguished only by a tag + faint tint.
  const rowModifier = event.isLiterati ? " evt-row--literati" : event.isFeatured ? " evt-row--featured" : "";

  return (
    <Link href={event.href || `/events/${event.slug}`} className={`evt-row${rowModifier}`}>
      <div className="evt-row-thumb">
        <EventThumb src={img} title={event.title} categorySlug={catSlug} fontSize={14} />
      </div>
      <div className="evt-row-body">
        <div className="evt-row-title-line">
          <h4 className="evt-row-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.title) }} />
          {event.isLiterati ? (
            <span className="evt-tag evt-tag--literati">🪶 Literati Connect</span>
          ) : event.isFeatured ? (
            <span className="evt-tag evt-tag--featured">★ Featured</span>
          ) : null}
          {event.isPhysical === false && (
            <span className="evt-tag evt-tag--virtual">◎ Virtual</span>
          )}
        </div>
        <div className="evt-row-meta">
          {place && <span>◍ {place}</span>}
          {place && cat && <span> · </span>}
          {cat && <span>{cat}</span>}
        </div>
      </div>
      <div className="evt-row-right">
        {timeRange && <span className="evt-row-time">{timeRange}</span>}
        <span className={`evt-row-price${free ? " evt-row-price--free" : ""}`}>
          {free ? "Free" : event.admission}
        </span>
      </div>
      <span className="evt-row-arrow">→</span>
    </Link>
  );
}

export default function EventTimeline({
  events,
  sidebarCities = [],
  sidebarCategories = [],
  activeCitySlug,
  activeCategorySlug,
  emptyMessage = "No upcoming events right now — check back soon.",
  rightRail,
}: EventTimelineProps) {
  const months = groupByMonth(events);

  return (
    <div className="evt-timeline-wrap">
      <div className="evt-timeline-main">
        {events.length === 0 ? (
          <p className="evt-empty">{emptyMessage}</p>
        ) : (
          months.map(({ month, days }) => (
            <div key={month} className="evt-month">
              <div className="evt-month-heading">
                <span className="evt-month-dot" />
                <span className="evt-month-label">{month}</span>
              </div>

              {days.map(({ heading, events: dayEvents }, di) => (
                <div key={di} className="evt-day">
                  <div className="evt-day-heading">
                    <span className="evt-day-num">{heading.short}</span>
                    <span className="evt-day-weekday">{heading.weekday}</span>
                  </div>
                  <div className="evt-day-rows">
                    {dayEvents.map((e) => <EventRow key={e.id} event={e} />)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <aside className="evt-timeline-sidebar">
        {rightRail ?? (
          <>
            {sidebarCities.length > 0 && (
              <div className="evt-sb-block">
                <div className="evt-sb-label">Cities</div>
                {sidebarCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/events/${c.slug}`}
                    className={`evt-sb-row${activeCitySlug === c.slug ? " active" : ""}`}
                  >
                    <span className="evt-sb-name">{c.name}</span>
                    <span className="evt-sb-count">{c.count}</span>
                  </Link>
                ))}
                <Link href="/events" className="evt-sb-all">All cities →</Link>
              </div>
            )}

            {sidebarCategories.length > 0 && (
              <div className="evt-sb-block">
                <div className="evt-sb-label">Categories</div>
                {sidebarCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/events/${c.slug}`}
                    className={`evt-sb-row${activeCategorySlug === c.slug ? " active" : ""}`}
                  >
                    <span className="evt-sb-dot" style={{ background: CAT_DOT[c.slug] || "var(--evt-gold)" }} />
                    <span className="evt-sb-name">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
