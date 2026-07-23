import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventsWithFallback } from "@/lib/wp";
import EventTimeline from "../components/EventTimeline";
import EventsSearchBar from "../components/EventsSearchBar";

interface CityInfo { name: string; country: string }

const ALL_CITIES = [
  { slug: "lagos",    name: "Lagos",    country: "Nigeria" },
  { slug: "london",   name: "London",   country: "UK" },
  { slug: "accra",    name: "Accra",    country: "Ghana" },
  { slug: "nairobi",  name: "Nairobi",  country: "Kenya" },
  { slug: "new-york", name: "New York", country: "USA" },
  { slug: "paris",    name: "Paris",    country: "France" },
];

export default async function CityArchive({ slug, cityInfo }: { slug: string; cityInfo: CityInfo }) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userCity = (session?.user as any)?.city?.toLowerCase().trim();

  let allEvents: any[] = [];
  try { allEvents = await getEventsWithFallback(100); } catch { /* CMS unreachable */ }

  const cityEvents = allEvents
    .filter((e) => {
      const haystack = `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase();
      return haystack.includes(cityInfo.name.toLowerCase());
    })
    .sort((a, b) =>
      new Date(a.eventDate || a.date || 0).getTime() -
      new Date(b.eventDate || b.date || 0).getTime()
    );

  // Other cities worth exploring — excludes the one already being viewed.
  const sidebarCities = ALL_CITIES
    .filter((c) => c.slug !== slug)
    .map((c) => ({
      ...c,
      count: allEvents.filter((e) =>
        `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(c.name.toLowerCase())
      ).length,
    }))
    .filter((c) => c.count > 0);

  const literatiAll = cityEvents.filter((e) => e.isLiterati);
  const literatiNearby = userCity
    ? literatiAll.filter((e) => `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(userCity))
    : [];

  return (
    <div className="bg-paper">
      <div className="evt-headline-wrap">
        <Link href="/events" className="evt-archive-back">← All Happenings</Link>
        <h1 className="evt-headline">Happening in <em>{cityInfo.name}</em></h1>
        <p className="evt-archive-meta">
          {cityInfo.country} · {cityEvents.length} upcoming event{cityEvents.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="evt-search-wrap">
        <EventsSearchBar />
      </div>

      <div className="evt-timeline-section" id="timeline">
        <EventTimeline
          events={cityEvents}
          emptyMessage={`No upcoming events in ${cityInfo.name} right now — check back soon.`}
          rightRail={
            <>
              {sidebarCities.length > 0 && (
                <div className="evt-sb-block">
                  <div className="evt-sb-label">Other Cities</div>
                  {sidebarCities.map((c) => (
                    <Link key={c.slug} href={`/events/${c.slug}`} className="evt-sb-row">
                      <span className="evt-sb-name">{c.name}</span>
                      <span className="evt-sb-count">{c.count}</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="evt-literati-teaser">
                <p className="evt-sb-label">🪶 Literati Connect</p>
                <p className="evt-literati-teaser-title">Members go first.</p>
                <p className="evt-literati-teaser-desc">
                  Monthly, city-wide gatherings for Moveee members — supper tables, private
                  views, and salons before anyone else hears about them.
                </p>
                {literatiAll.length > 0 && (
                  <Link href="#timeline" className="evt-literati-teaser-link">
                    {userCity && literatiNearby.length > 0 ? "See gatherings near you →" : `See ${cityInfo.name} gatherings →`}
                  </Link>
                )}
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
