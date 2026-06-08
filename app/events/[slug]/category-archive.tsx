import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import EventTimeline from "../components/EventTimeline";

interface CategoryInfo { name: string; icon: string; desc: string }

const ALL_CITIES = [
  { slug: "lagos",    name: "Lagos",    country: "Nigeria" },
  { slug: "london",   name: "London",   country: "UK" },
  { slug: "accra",    name: "Accra",    country: "Ghana" },
  { slug: "nairobi",  name: "Nairobi",  country: "Kenya" },
  { slug: "new-york", name: "New York", country: "USA" },
  { slug: "paris",    name: "Paris",    country: "France" },
];

const ALL_CATEGORIES = [
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

export default async function CategoryArchive({ slug, categoryInfo }: { slug: string; categoryInfo: CategoryInfo }) {
  let allEvents: any[] = [];
  try { allEvents = await getEventsWithFallback(100); } catch { /* CMS unreachable */ }

  const matchesCategory = (event: any): boolean => {
    const nodes: Array<{ name: string; slug: string }> = event.cultureInterests?.nodes ?? [];
    return nodes.some(
      (n) => n.slug === slug || n.name.toLowerCase() === categoryInfo.name.toLowerCase() ||
             n.slug.includes(slug) || slug.includes(n.slug)
    );
  };

  const upcoming = allEvents
    .filter((e) => matchesCategory(e))
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

      <div className="ev-timeline-section">
        <EventTimeline
          events={upcoming}
          sidebarCities={sidebarCities}
          sidebarCategories={ALL_CATEGORIES}
          activeCategorySlug={slug}
          emptyMessage={`No upcoming ${categoryInfo.name.toLowerCase()} events right now — check back soon.`}
        />
      </div>

      <div className="ev-archive-footer">
        <Link href="/events" className="ev-archive-back">← All Happenings</Link>
      </div>
    </div>
  );
}
