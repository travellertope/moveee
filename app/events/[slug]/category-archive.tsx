import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import EventTimeline from "../components/EventTimeline";

interface CategoryInfo { name: string; icon: string; desc: string }

const WP_BASE_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

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

/** Fetch events from REST filtered directly by the culture_interest taxonomy term slug. */
async function getEventsByInterestSlug(termSlug: string): Promise<any[]> {
  try {
    // First look up the term ID
    const termRes = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/culture_interest?slug=${encodeURIComponent(termSlug)}&per_page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!termRes.ok) return [];
    const terms = await termRes.json();
    if (!Array.isArray(terms) || terms.length === 0) return [];
    const termId = terms[0].id;

    // Fetch events with that term
    const evRes = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/culture_event?culture_interest=${termId}&per_page=100&status=publish&_embed=1`,
      { next: { revalidate: 3600 } }
    );
    if (!evRes.ok) return [];
    const json = await evRes.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export default async function CategoryArchive({ slug, categoryInfo }: { slug: string; categoryInfo: CategoryInfo }) {
  // Fetch from REST filtered by taxonomy — more reliable than filtering GraphQL results
  const [allEvents, termEvents] = await Promise.all([
    getEventsWithFallback(100).catch(() => []),
    getEventsByInterestSlug(slug),
  ]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const isUpcoming = (e: any) => {
    const end = e.endDate || e.end_date;
    if (end) { const d = new Date(end); d.setHours(0,0,0,0); return isNaN(d.getTime()) || d >= today; }
    const start = e.eventDate || e.event_date || e.date;
    if (start) { const d = new Date(start); d.setHours(0,0,0,0); return isNaN(d.getTime()) || d >= today; }
    return true;
  };

  const matchesCategory = (event: any): boolean => {
    const nodes: Array<{ name: string; slug: string }> = event.cultureInterests?.nodes ?? [];
    if (nodes.some(n => n.slug === slug || n.slug.includes(slug) || slug.includes(n.slug))) return true;
    if (nodes.some(n => n.name.toLowerCase() === categoryInfo.name.toLowerCase())) return true;
    return false;
  };

  // Merge: term-filtered REST events take priority, supplement with GraphQL-matched events
  const termSlugs = new Set(termEvents.map((e: any) => e.slug));
  const gqlMatched = allEvents.filter(matchesCategory).filter((e: any) => !termSlugs.has(e.slug));

  // Map term-filtered REST events to the same shape as GraphQL events
  const mapRestEvent = (e: any) => ({
    slug: e.slug,
    title: e.title?.rendered ?? e.title ?? "",
    eventDate: e.meta?._culture_event_date || e.acf?.event_date || e.culture_event_meta?.event_date || null,
    endDate: e.meta?._culture_event_end_date || e.acf?.end_date || e.culture_event_meta?.end_date || null,
    date: e.date,
    location: e.meta?._culture_location || e.acf?.location || e.culture_event_meta?.location || null,
    city: e.meta?._culture_event_city || e.acf?.city || e.culture_event_meta?.city || null,
    featuredImage: e._embedded?.["wp:featuredmedia"]?.[0]?.source_url
      ? { node: { sourceUrl: e._embedded["wp:featuredmedia"][0].source_url } }
      : null,
    cultureInterests: { nodes: Array.isArray(e.culture_interests) ? e.culture_interests : [] },
    isAiGenerated: true,
  });

  const upcoming = [
    ...termEvents.filter(isUpcoming).map(mapRestEvent),
    ...gqlMatched.filter(isUpcoming),
  ].sort((a, b) =>
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
