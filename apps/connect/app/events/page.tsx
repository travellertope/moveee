import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventsWithFallback } from "@/lib/wp";
import { getCommunityPosts } from "@/lib/unified-feed";
import { isEventItem } from "@/lib/event-spotlight";
import EventHero from "./components/EventHero";
import EventTimeline from "./components/EventTimeline";
import EventsCarousel from "./components/EventsCarousel";
import EventThumb from "./components/EventThumb";
import "@/app/events.css";
import { sanitizeHtml } from "@/lib/sanitize";

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

const TICKER_ITEMS = ["Visual Art", "Film", "Literature", "Music", "Fashion", "Food", "Design", "Community"];

function cityCount(events: any[], name: string) {
  const q = name.toLowerCase();
  return events.filter((e) => `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(q)).length;
}

function fmtMonth(raw?: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
}

function fmtDay(raw?: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.getDate().toString();
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

  // Literati Connect — monthly, city-wide meetups (§1 of literati-connect-plan.md), editorial-only
  const literatiAll = upcoming.filter((e) => e.isLiterati);
  const literatiNearby = userCity
    ? literatiAll.filter((e) => `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(userCity))
    : [];
  const literatiEvents = (literatiNearby.length > 0 ? literatiNearby : literatiAll).slice(0, 10);

  const sidebarCities = FEATURED_CITIES
    .map((c) => ({ ...c, count: cityCount(upcoming, c.name) }))
    .filter((c) => c.count > 0);

  // Featured: isFeatured first, then any upcoming events — always show up to 4
  const withImage = (e: any) => e.featuredImage?.node?.sourceUrl || e.eventImageUrl;
  const featured = [
    ...upcoming.filter((e) => e.isFeatured),
    ...upcoming.filter((e) => !e.isFeatured && withImage(e)),
    ...upcoming.filter((e) => !e.isFeatured && !withImage(e)),
  ].slice(0, 4);

  return (
    <div className="bg-paper">

      {/* ── HERO ── */}
      <EventHero
        title="Moveee <em>Happenings</em>"
        standfirst="Curated openings, listening sessions, film screenings, supper clubs and community gatherings — from around the world."
        stats={[
          { num: upcoming.length, label: `Happenings · ${new Date().getFullYear()}` },
          { num: sidebarCities.length, label: "Cities covered" },
          { num: CATEGORIES.length, label: "Categories" },
        ]}
      />

      {/* ── TICKER ── */}
      <div className="evt-ticker">
        <div className="evt-ticker-container">
          {["a", "b"].map((variant) => (
            <div key={variant} className={`evt-ticker-track${variant === "b" ? " evt-ticker-track--b" : ""}`} aria-hidden={variant === "b"}>
              {TICKER_ITEMS.map((item, i) => (
                <span key={item}>
                  <span className="evt-ticker-item">{item}</span>
                  <span className="evt-ticker-item evt-ticker-item--star">★</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <main className="evt-main">
        {/* ── FEATURED EVENTS GRID ── */}
        {upcoming.length > 0 && (
          <section className="evt-section">
            <div className="evt-section-head">
              <div>
                <span className="evt-section-eyebrow">Spotlight</span>
                <h3>Featured</h3>
              </div>
              <Link href="#timeline" className="evt-section-all">All happenings →</Link>
            </div>
            <div className="evt-feat-grid">
              {featured.map((event) => {
                const img = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
                const cat = event.cultureInterests?.nodes?.[0]?.name || "";
                const catSlug = event.cultureInterests?.nodes?.[0]?.slug || "";
                const month = fmtMonth(event.eventDate || event.date);
                const day = fmtDay(event.eventDate || event.date);
                return (
                  <Link key={event.slug} href={event.href || `/events/${event.slug}`} className="evt-feat-card">
                    <div className="evt-feat-img">
                      <EventThumb src={img} title={event.title} categorySlug={catSlug} fontSize={28} />
                      {(month || day) && (
                        <div className="evt-feat-date-badge">
                          <span className="evt-feat-date-month">{month}</span>
                          <span className="evt-feat-date-day">{day}</span>
                        </div>
                      )}
                    </div>
                    <div className="evt-feat-body">
                      {cat && <span className="evt-feat-cat">{cat}</span>}
                      <h3 className="evt-feat-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.title) }} />
                      {(event.city || event.location) && (
                        <span className="evt-feat-place">◍ {event.city || event.location}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── BY CITY GRID ── */}
        <section className="evt-section">
          <div className="evt-section-head">
            <div>
              <span className="evt-section-eyebrow">Discover</span>
              <h3>By City</h3>
            </div>
          </div>
          <div className="evt-city-grid">
            {FEATURED_CITIES.map((city) => {
              const count = cityCount(upcoming, city.name);
              return (
                <Link key={city.slug} href={`/events/${city.slug}`} className="evt-city-card">
                  <span className="evt-city-flag">{city.flag}</span>
                  <span className="evt-city-name">{city.name}</span>
                  <span className="evt-city-country">{city.country}</span>
                  {count > 0 && <span className="evt-city-count">{count} live</span>}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── LITERATI CONNECT RAIL ── */}
      {literatiEvents.length > 0 && (
        <section className="evt-literati-band">
          <div className="evt-section">
            <div className="evt-section-head">
              <div>
                <span className="evt-section-eyebrow">Members go first</span>
                <h3>🪶 Literati Connect{userCity && literatiNearby.length > 0 ? " near you" : ""}</h3>
              </div>
              <Link href="#timeline" className="evt-section-all">See all →</Link>
            </div>
            <EventsCarousel events={literatiEvents} />
          </div>
        </section>
      )}

      {/* ── TIMELINE + SIDEBAR ── */}
      <div className="evt-timeline-section" id="timeline">
        <EventTimeline
          events={upcoming}
          sidebarCities={sidebarCities}
          sidebarCategories={CATEGORIES}
          emptyMessage="No upcoming events right now — check back soon."
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
