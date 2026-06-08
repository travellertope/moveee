import Link from "next/link";
import Image from "next/image";

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
  isAiGenerated?: boolean;
  featuredImage?: { node?: { sourceUrl?: string } };
  eventImageUrl?: string;
  cultureInterests?: { nodes: Array<{ name: string; slug: string }> };
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

const CAT_ICONS: Record<string, string> = {
  music: "♪", film: "◉", "visual-arts": "◈", fashion: "✦",
  food: "◆", literature: "▬", design: "◻", performance: "★",
  community: "◇", tech: "○",
};

function EventRow({ event }: { event: TimelineEvent }) {
  const img     = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
  const catNode = event.cultureInterests?.nodes?.[0];
  const cat     = catNode?.name || "";
  const catSlug = catNode?.slug || "default";
  const place   = event.city || event.location || "";
  const dateRange = fmtDateRange(event.eventDate || event.date, event.endDate);

  return (
    <Link href={`/events/${event.slug}`} className="etl-row">
      <div className="etl-thumb">
        {img ? (
          <Image src={img} alt={event.title} fill style={{ objectFit: "cover" }} />
        ) : (
          <div className="etl-thumb-ph" data-cat-ph={catSlug}>
            <div className="ev-cat-ph">
              <span className="ev-cat-ph-icon">{CAT_ICONS[catSlug] || "★"}</span>
            </div>
          </div>
        )}
      </div>
      <div className="etl-body">
        <h4 className="etl-title" dangerouslySetInnerHTML={{ __html: event.title }} />
        <div className="etl-meta">
          {place && <span className="etl-place">◍ {place}</span>}
          {cat && <span className="etl-cat">{cat}</span>}
        </div>
      </div>
      <div className="etl-right">
        <span className="etl-date">{dateRange}</span>
        {event.admission && <span className="etl-admission">{event.admission}</span>}
      </div>
      <span className="etl-arrow">→</span>
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
}: EventTimelineProps) {
  const months = groupByMonth(events);

  return (
    <div className="etl-wrap">
      {/* ── Main timeline ── */}
      <div className="etl-main">
        {events.length === 0 ? (
          <p className="etl-empty">{emptyMessage}</p>
        ) : (
          months.map(({ month, days }) => (
            <div key={month} className="etl-month">
              <div className="etl-month-heading">
                <span className="etl-month-dot" />
                <span className="etl-month-label">{month}</span>
              </div>

              {days.map(({ heading, events: dayEvents }, di) => (
                <div key={di} className="etl-day">
                  <div className="etl-day-heading">
                    <span className="etl-day-short">{heading.short}</span>
                    <span className="etl-day-weekday">{heading.weekday}</span>
                  </div>
                  <div className="etl-day-rows">
                    {dayEvents.map((e) => <EventRow key={e.id} event={e} />)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="etl-sidebar">
        {sidebarCities.length > 0 && (
          <div className="etl-sb-block">
            <div className="etl-sb-label">Cities</div>
            {sidebarCities.map((c) => (
              <Link
                key={c.slug}
                href={`/events/${c.slug}`}
                className={`etl-sb-row${activeCitySlug === c.slug ? " active" : ""}`}
              >
                <span className="etl-sb-name">{c.name}</span>
                <span className="etl-sb-count">{c.count}</span>
              </Link>
            ))}
            <Link href="/events" className="etl-sb-all">All cities →</Link>
          </div>
        )}

        {sidebarCategories.length > 0 && (
          <div className="etl-sb-block">
            <div className="etl-sb-label">Categories</div>
            {sidebarCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/events/${c.slug}`}
                className={`etl-sb-row${activeCategorySlug === c.slug ? " active" : ""}`}
              >
                <span className="etl-sb-icon">{c.icon}</span>
                <span className="etl-sb-name">{c.name}</span>
              </Link>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
