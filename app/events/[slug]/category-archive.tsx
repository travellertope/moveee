import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import EventCard from "../components/EventCard";
import DiscoveredEventRow from "../components/DiscoveredEventRow";

interface CategoryInfo {
  name: string;
  icon: string;
  desc: string;
}

function isEventPast(event: any): boolean {
  const checkDate = event.endDate || event.eventDate;
  if (!checkDate) return false;
  const d = new Date(checkDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

function fmtShort(raw?: string): string {
  if (!raw) return "TBA";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "TBA" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtDiscRow(raw?: string): string {
  if (!raw) return "TBA";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "TBA" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function CategoryArchive({
  slug,
  categoryInfo,
}: {
  slug: string;
  categoryInfo: CategoryInfo;
}) {
  let allEvents: any[] = [];
  try {
    allEvents = await getEventsWithFallback(100);
  } catch { /* CMS unreachable */ }

  const matchesCategory = (event: any): boolean => {
    const nodes: Array<{ name: string; slug: string }> = event.cultureInterests?.nodes ?? [];
    return nodes.some(
      (n) =>
        n.slug === slug ||
        n.name.toLowerCase() === categoryInfo.name.toLowerCase() ||
        n.slug.includes(slug) ||
        slug.includes(n.slug)
    );
  };

  const upcoming = allEvents
    .filter((e) => !isEventPast(e) && matchesCategory(e))
    .sort(
      (a, b) =>
        new Date(a.eventDate || a.date || 0).getTime() -
        new Date(b.eventDate || b.date || 0).getTime()
    );

  const curated = upcoming.filter((e) => !e.isAiGenerated);
  const discovered = upcoming.filter((e) => e.isAiGenerated);

  return (
    <div className="ev-archive-page">
      <div className="ev-archive-header">
        <div className="ev-archive-header-inner">
          <Link href="/events" className="ev-archive-back">← All Happenings</Link>
          <div className="ev-archive-title-row">
            <span className="ev-archive-icon">{categoryInfo.icon}</span>
            <h1><em>{categoryInfo.name}</em></h1>
          </div>
          <p className="ev-archive-meta">{categoryInfo.desc} · {upcoming.length} upcoming</p>
        </div>
      </div>

      <div className="ev-archive-body">
        {upcoming.length === 0 ? (
          <p className="ev-archive-empty">No upcoming {categoryInfo.name.toLowerCase()} events right now — check back soon.</p>
        ) : (
          <>
            {curated.length > 0 && (
              <div className="ev-archive-curated">
                <div className="ev-archive-section-label">Curated</div>
                <div className="ev-cat-grid">
                  {curated.map((event) => {
                    const cat = Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
                      ? event.cultureInterests.nodes[0].name : categoryInfo.name;
                    return (
                      <EventCard
                        key={event.id}
                        slug={event.slug}
                        title={event.title}
                        date={fmtShort(event.eventDate || event.date)}
                        location={event.city || event.location || ""}
                        time={event.openingHours || ""}
                        category={cat}
                        image={event.featuredImage?.node?.sourceUrl || event.eventImageUrl}
                        status="upcoming"
                        tags={["RSVP"]}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {discovered.length > 0 && (
              <div className="ev-archive-discovered">
                <div className="ev-archive-section-label">Discovered</div>
                <div className="disc-list">
                  {discovered.map((event) => {
                    const cat = Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
                      ? event.cultureInterests.nodes[0].name : "";
                    return (
                      <DiscoveredEventRow
                        key={event.id}
                        slug={event.slug}
                        title={event.title}
                        date={fmtDiscRow(event.eventDate || event.date)}
                        city={event.city || ""}
                        location={event.location || ""}
                        category={cat}
                        ticketingUrl={event.ticketingUrl}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="ev-archive-footer">
        <Link href="/events" className="ev-archive-back">← All Happenings</Link>
      </div>
    </div>
  );
}
