import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEventsWithFallback } from "@/lib/wp";
import { getCategoryImage, getCategoryGradient } from "./utils/categoryImages";
import EventHero from "./components/EventHero";
import EventTimeline from "./components/EventTimeline";
import EventsCarousel from "./components/EventsCarousel";
import "@/app/events.css";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 300;
export const dynamicParams = true;

export const metadata = {
  title: { absolute: "Happenings | The Moveee" },
  description: "Curated cultural events from around the world — openings, listening sessions, film screenings, performances, and community gatherings worth your time.",
};

const FEATURED_CITIES = [
  { slug: "lagos",    name: "Lagos",    country: "Nigeria" },
  { slug: "london",   name: "London",   country: "UK" },
  { slug: "accra",    name: "Accra",    country: "Ghana" },
  { slug: "nairobi",  name: "Nairobi",  country: "Kenya" },
  { slug: "new-york", name: "New York", country: "USA" },
  { slug: "paris",    name: "Paris",    country: "France" },
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

function cityCount(events: any[], name: string) {
  const q = name.toLowerCase();
  return events.filter((e) => `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase().includes(q)).length;
}

function fmtShort(raw?: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const userCity = (session?.user as any)?.city?.toLowerCase().trim();

  let events: any[] = [];
  try {
    events = await getEventsWithFallback(50, { revalidate: 180 });
  } catch { /* CMS unreachable */ }

  const upcoming = events.sort(
    (a, b) => new Date(a.eventDate || a.date || 0).getTime() - new Date(b.eventDate || b.date || 0).getTime()
  );

  // Literati Connect — monthly, city-wide meetups (§1 of literati-connect-plan.md)
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
    <div className="events-page bg-paper">

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
      <div className="ticker-wrap">
        <div className="ticker-track" aria-hidden>
          {[
            "Visual Art","★","Film","★","Literature","★","Music","★",
            "Fashion","★","Food","★","Design","★","Community","★",
            "Visual Art","★","Film","★","Literature","★","Music","★",
            "Fashion","★","Food","★","Design","★","Community","★",
          ].map((item, i) => (
            <span key={i} className={item === "★" ? "a" : undefined}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURED EVENTS GRID ── */}
      {upcoming.length > 0 && (
        <section className="ev-featured-section">
          <div className="ev-featured-inner">
            <div className="ev-featured-header">
              <span className="ev-featured-label">Featured</span>
              <Link href="#timeline" className="ev-featured-all">All happenings ↓</Link>
            </div>
            <div className="ev-featured-grid">
              {featured.map((event) => {
                const img = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
                const cat = event.cultureInterests?.nodes?.[0]?.name || "";
                const dateStr = fmtShort(event.eventDate || event.date);
                const catSlug = event.cultureInterests?.nodes?.[0]?.slug || "";
                return (
                  <Link key={event.slug} href={`/events/${event.slug}`} className="ev-feat-card">
                    <div className="ev-feat-img" style={!img ? { background: getCategoryGradient(catSlug) } : undefined}>
                      <Image
                        src={img || getCategoryImage(catSlug)}
                        alt={event.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                      <div className="ev-feat-overlay" />
                      {cat && <span className="ev-feat-cat">{cat}</span>}
                      {dateStr && <span className="ev-feat-date">{dateStr}</span>}
                    </div>
                    <div className="ev-feat-body">
                      <h3 className="ev-feat-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.title) }} />
                      {(event.city || event.location) && (
                        <span className="ev-feat-place">◍ {event.city || event.location}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED CITIES GRID ── */}
      <section className="ev-cities-section">
        <div className="ev-cities-inner">
          <div className="ev-featured-header">
            <span className="ev-featured-label">By City</span>
          </div>
          <div className="ev-cities-grid">
            {FEATURED_CITIES.map((city) => {
              const count = cityCount(upcoming, city.name);
              return (
                <Link key={city.slug} href={`/events/${city.slug}`} className="ev-city-card">
                  <span className="ev-city-name">{city.name}</span>
                  <span className="ev-city-country">{city.country}</span>
                  {count > 0 && <span className="ev-city-count">{count}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LITERATI CONNECT RAIL ── */}
      {literatiEvents.length > 0 && (
        <section className="ev-featured-section">
          <div className="ev-featured-inner">
            <div className="ev-featured-header">
              <span className="ev-featured-label">🪶 Literati Connect{userCity && literatiNearby.length > 0 ? " near you" : ""}</span>
              <Link href="#timeline" className="ev-featured-all">All happenings ↓</Link>
            </div>
            <EventsCarousel events={literatiEvents} />
          </div>
        </section>
      )}

      {/* ── TIMELINE + SIDEBAR ── */}
      <div className="ev-timeline-section" id="timeline">
        <EventTimeline
          events={upcoming}
          sidebarCities={sidebarCities}
          sidebarCategories={CATEGORIES}
          emptyMessage="No upcoming events right now — check back soon."
        />
      </div>

      {/* ── CONNECT CTA BAND ── */}
      <section className="connect-band">
        <div className="connect-inner">
          <div>
            <div className="connect-num">Moveee</div>
            <h3>Members go <em>first</em>.</h3>
            <p>Private views, supper tables, and early RSVP access — all yours with a Connect membership. The culture doesn&rsquo;t wait; neither should you.</p>
          </div>
          <div>
            <div className="connect-perks">
              <div className="perk"><span className="n">01</span><p>Early RSVP on <em>all events</em> — 48 hours before public</p></div>
              <div className="perk"><span className="n">02</span><p>Access to <em>private views</em> and members-only dinners</p></div>
              <div className="perk"><span className="n">03</span><p>Priority for <em>Origins journeys</em> and supper tables</p></div>
              <div className="perk"><span className="n">04</span><p>15% off everything in the <em>Lifestyle</em> shop, always</p></div>
            </div>
            <div className="connect-cta">
              <Link href="/feed" className="btn-gold">Become a Member →</Link>
              <span className="font-serif italic text-paper/50 text-base">from $9 / month</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
