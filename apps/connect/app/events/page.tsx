import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventsWithFallback } from "@/lib/wp";
import { getCommunityPosts } from "@/lib/unified-feed";
import { isEventItem } from "@/lib/event-spotlight";
import EventTimeline from "./components/EventTimeline";
import EventsSearchBar from "./components/EventsSearchBar";
import "@/app/events.css";

export const revalidate = 300;
export const dynamicParams = true;

export const metadata = {
  title: { absolute: "Happenings | The Moveee" },
  description: "Curated cultural events from around the world — openings, listening sessions, film screenings, performances, and community gatherings worth your time.",
};

const FEATURED_CITIES = [
  { slug: "lagos",    name: "Lagos",    country: "Nigeria", flag: "🇳🇬" },
  { slug: "london",   name: "London",   country: "UK",      flag: "🇬🇧" },
  { slug: "accra",    name: "Accra",    country: "Ghana",   flag: "🇬🇭" },
  { slug: "nairobi",  name: "Nairobi",  country: "Kenya",   flag: "🇰🇪" },
  { slug: "new-york", name: "New York", country: "USA",     flag: "🇺🇸" },
  { slug: "paris",    name: "Paris",    country: "France",  flag: "🇫🇷" },
];

function cityCount(events: any[], name: string) {
  const q = name.toLowerCase();
  return events.filter((e) => `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(q)).length;
}

/** Map a community culture_post (template_type=event) FeedItem into the editorial-event shape consumed by the shared display components. */
function mapCommunityEvent(item: any) {
  const catName = item.eventCategory || "";
  const catSlug = catName ? catName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "";
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    eventDate: item.eventDate,
    endDate: item.endDate,
    date: item.date,
    location: item.venueAddress || item.location,
    city: item.city,
    admission: item.admission,
    isFeatured: item.isFeatured,
    // Community-organised events have no virtual/in-person concept in the
    // composer (RSVP/venue fields assume a real place) — always physical,
    // unlike editorial events where isPhysical is a real WP Admin field.
    isPhysical: true,
    eventImageUrl: item.image,
    cultureInterests: catName ? { nodes: [{ name: catName, slug: catSlug }] } : undefined,
    href: item.href,
    isAiGenerated: false,
  };
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const userCity = (session?.user as any)?.city?.toLowerCase().trim();

  let editorialEvents: any[] = [];
  try {
    editorialEvents = await getEventsWithFallback(50, { revalidate: 180 });
  } catch { /* CMS unreachable */ }

  let communityEvents: any[] = [];
  try {
    const communityPosts = await getCommunityPosts();
    communityEvents = communityPosts.filter(isEventItem).map(mapCommunityEvent);
  } catch { /* community feed unreachable */ }

  const events = [...editorialEvents, ...communityEvents];

  const upcoming = events.sort(
    (a, b) => new Date(a.eventDate || a.date || 0).getTime() - new Date(b.eventDate || b.date || 0).getTime()
  );

  // Literati Connect — monthly, city-wide meetups (§1 of literati-connect-plan.md),
  // editorial-only. No longer sliced into its own carousel list — it's just used here
  // to decide the right-rail teaser card's copy/link (events themselves are tagged
  // rows inside the unified timeline, see EventTimeline's evt-row--literati).
  const literatiAll = upcoming.filter((e) => e.isLiterati);
  const literatiNearby = userCity
    ? literatiAll.filter((e) => `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(userCity))
    : [];

  const sidebarCities = FEATURED_CITIES
    .map((c) => ({ ...c, count: cityCount(upcoming, c.name) }))
    .filter((c) => c.count > 0);

  return (
    <div className="bg-paper">

      {/* ── HEADLINE ── */}
      <div className="evt-headline-wrap">
        <h1 className="evt-headline">Happenings <em>worth your time</em></h1>
      </div>

      {/* ── SEARCH ── */}
      <div className="evt-search-wrap">
        <EventsSearchBar />
      </div>

      {/* ── TIMELINE + RIGHT RAIL ── */}
      {/* Featured and Literati Connect events are no longer separate
          sections — they're tagged rows inside this one timeline (see
          EventTimeline's evt-row--featured/--literati). The old By City
          grid moved into the search modal's City filter. */}
      <div className="evt-timeline-section" id="timeline">
        <EventTimeline
          events={upcoming}
          emptyMessage="No upcoming events right now — check back soon."
          rightRail={
            <>
              {sidebarCities.length > 0 && (
                <div className="evt-sb-block">
                  <div className="evt-sb-label">Trending Cities</div>
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
                    {userCity && literatiNearby.length > 0 ? "See gatherings near you →" : "See this month's gatherings →"}
                  </Link>
                )}
              </div>
            </>
          }
        />
      </div>

      {/* ── CONNECT CTA BAND ── */}
      <section className="evt-connect-band">
        <div className="evt-connect-inner">
          <div>
            <span className="evt-connect-eyebrow">Moveee</span>
            <h3>Members go <em>first</em>.</h3>
            <p>Private views, supper tables, and early RSVP access — all yours with a Moveee membership. The culture doesn&rsquo;t wait; neither should you.</p>
          </div>
          <div>
            <div className="evt-connect-perks">
              <div className="evt-perk"><span className="evt-perk-num">01</span><p>Early RSVP on <em>all events</em> — 48 hours before public</p></div>
              <div className="evt-perk"><span className="evt-perk-num">02</span><p>Access to <em>private views</em> and members-only dinners</p></div>
              <div className="evt-perk"><span className="evt-perk-num">03</span><p>Priority for <em>Origins journeys</em> and supper tables</p></div>
              <div className="evt-perk"><span className="evt-perk-num">04</span><p>15% off everything in the <em>Lifestyle</em> shop, always</p></div>
            </div>
            <div className="evt-connect-cta">
              <Link href="/feed" className="evt-btn-white">Become a Member →</Link>
              <span className="evt-connect-caption">from $9 / month</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
