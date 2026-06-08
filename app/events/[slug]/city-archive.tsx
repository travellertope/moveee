import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import DiscoveredEventRow from "../components/DiscoveredEventRow";
import EventCard from "../components/EventCard";

interface CityInfo {
  name: string;
  country: string;
}

function isEventPast(event: any): boolean {
  const checkDate = event.endDate || event.eventDate;
  if (!checkDate) return false;
  const d = new Date(checkDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

function fmtDay(raw?: string): string {
  if (!raw) return "TBA";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "TBA" : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function fmtShort(raw?: string): string {
  if (!raw) return "TBA";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "TBA" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function CityArchive({ slug, cityInfo }: { slug: string; cityInfo: CityInfo }) {
  let allEvents: any[] = [];
  try {
    allEvents = await getEventsWithFallback(100);
  } catch { /* CMS unreachable */ }

  const cityEvents = allEvents
    .filter((e) => {
      if (isEventPast(e)) return false;
      const haystack = `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase();
      return haystack.includes(cityInfo.name.toLowerCase());
    })
    .sort((a, b) =>
      new Date(a.eventDate || a.date || 0).getTime() -
      new Date(b.eventDate || b.date || 0).getTime()
    );

  // Group by date string
  const dayMap = new Map<string, any[]>();
  for (const e of cityEvents) {
    const key = fmtDay(e.eventDate || e.date);
    if (!dayMap.has(key)) dayMap.set(key, []);
    dayMap.get(key)!.push(e);
  }
  const grouped = Array.from(dayMap.entries());

  return (
    <div className="ev-archive-page">
      <div className="ev-archive-header">
        <div className="ev-archive-header-inner">
          <Link href="/events" className="ev-archive-back">← All Happenings</Link>
          <div className="ev-archive-title-row">
            <h1>Happening in <em>{cityInfo.name}</em></h1>
            <span className="ev-archive-country">{cityInfo.country}</span>
          </div>
          <p className="ev-archive-meta">
            {cityEvents.length} upcoming event{cityEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="ev-archive-body">
        {grouped.length === 0 ? (
          <p className="ev-archive-empty">No upcoming events in {cityInfo.name} right now — check back soon.</p>
        ) : (
          grouped.map(([dateStr, events]) => (
            <div key={dateStr} className="ev-date-group">
              <div className="ev-date-group-label">{dateStr}</div>
              <div className="ev-date-group-cards">
                {events.map((event) => {
                  const cat = Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
                    ? event.cultureInterests.nodes[0].name
                    : "Culture";
                  const shortDate = fmtShort(event.eventDate || event.date);
                  const [d, m] = shortDate.split(" ");
                  return (
                    <EventCard
                      key={event.id}
                      slug={event.slug}
                      title={event.title}
                      date={shortDate}
                      location={event.location || event.city || cityInfo.name}
                      time={event.openingHours || ""}
                      category={cat}
                      image={event.featuredImage?.node?.sourceUrl}
                      status={event.isAiGenerated ? "upcoming" : (event.isFeatured ? "upcoming" : "upcoming")}
                      tags={event.isAiGenerated ? [] : ["RSVP"]}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="ev-archive-footer">
        <Link href="/events" className="ev-archive-back">← All Happenings</Link>
      </div>
    </div>
  );
}
