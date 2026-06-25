import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import EventTimeline from "../components/EventTimeline";

interface CityInfo { name: string; country: string }

const CATEGORIES = [
  { slug: "music",       name: "Music",       icon: "♪" },
  { slug: "film",        name: "Film",        icon: "◉" },
  { slug: "visual-arts", name: "Visual Arts", icon: "◈" },
  { slug: "fashion",     name: "Fashion",     icon: "✦" },
  { slug: "food",        name: "Food",        icon: "◆" },
  { slug: "literature",  name: "Literature",  icon: "▬" },
  { slug: "design",      name: "Design",      icon: "◻" },
  { slug: "performance", name: "Performance", icon: "★" },
  { slug: "community",   name: "Community",   icon: "◇" },
  { slug: "tech",        name: "Tech",        icon: "○" },
];

const ALL_CITIES = [
  { slug: "lagos",    name: "Lagos",    country: "Nigeria" },
  { slug: "london",   name: "London",   country: "UK" },
  { slug: "accra",    name: "Accra",    country: "Ghana" },
  { slug: "nairobi",  name: "Nairobi",  country: "Kenya" },
  { slug: "new-york", name: "New York", country: "USA" },
  { slug: "paris",    name: "Paris",    country: "France" },
];

export default async function CityArchive({ slug, cityInfo }: { slug: string; cityInfo: CityInfo }) {
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

  const sidebarCities = ALL_CITIES.map((c) => ({
    ...c,
    count: allEvents.filter((e) =>
      `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(c.name.toLowerCase())
    ).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="evt-archive-page">
      <div className="evt-archive-header">
        <Link href="/events" className="evt-archive-back">← All Happenings</Link>
        <div className="evt-archive-title-row">
          <h1>Happening in <em>{cityInfo.name}</em></h1>
          <span className="evt-archive-country">{cityInfo.country}</span>
        </div>
        <p className="evt-archive-meta">
          {cityEvents.length} upcoming event{cityEvents.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="evt-timeline-section">
        <EventTimeline
          events={cityEvents}
          sidebarCities={sidebarCities}
          sidebarCategories={CATEGORIES}
          activeCitySlug={slug}
          emptyMessage={`No upcoming events in ${cityInfo.name} right now — check back soon.`}
        />
      </div>

      <div className="evt-archive-footer">
        <Link href="/events" className="evt-archive-back">← All Happenings</Link>
      </div>
    </div>
  );
}
