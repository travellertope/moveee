import Link from "next/link";
import Image from "next/image";
import { getEventsWithFallback } from "@/lib/wp";
import EventHero from "./components/EventHero";
import EventTimeline from "./components/EventTimeline";
import "@/app/events.css";

export const revalidate = 180;

export const metadata = {
  title: { absolute: "Happenings | The Moveee" },
  description: "Curated cultural events across Africa and the diaspora — openings, listening sessions, film screenings, performances, and community gatherings worth your time.",
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
  let events: any[] = [];
  try { events = await getEventsWithFallback(100); } catch { /* CMS unreachable */ }

  const upcoming = events.sort(
    (a, b) => new Date(a.eventDate || a.date || 0).getTime() - new Date(b.eventDate || b.date || 0).getTime()
  );

  const sidebarCities = FEATURED_CITIES
    .map((c) => ({ ...c, count: cityCount(upcoming, c.name) }))
    .filter((c) => c.count > 0);

  // Featured: isFeatured first, then events with images, up to 4
  const withImage = (e: any) => e.featuredImage?.node?.sourceUrl || e.eventImageUrl;
  const featured = [
    ...upcoming.filter((e) => e.isFeatured && withImage(e)),
    ...upcoming.filter((e) => !e.isFeatured && withImage(e)),
  ].slice(0, 4);

  return (
    <div className="events-page bg-paper">

      {/* ── HERO ── */}
      <EventHero
        title="Moveee <em>Happenings</em>"
        standfirst="Curated openings, listening sessions, film screenings, supper clubs and community gatherings — across Africa and the diaspora."
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
      {featured.length > 0 && (
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
                return (
                  <Link key={event.slug} href={`/events/${event.slug}`} className="ev-feat-card">
                    <div className="ev-feat-img">
                      {img && <Image src={img} alt={event.title} fill style={{ objectFit: "cover" }} />}
                      <div className="ev-feat-overlay" />
                      {cat && <span className="ev-feat-cat">{cat}</span>}
                      {dateStr && <span className="ev-feat-date">{dateStr}</span>}
                    </div>
                    <div className="ev-feat-body">
                      <h3 className="ev-feat-title" dangerouslySetInnerHTML={{ __html: event.title }} />
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
      {sidebarCities.length > 0 && (
        <section className="ev-cities-section">
          <div className="ev-cities-inner">
            <div className="ev-featured-header">
              <span className="ev-featured-label">By City</span>
            </div>
            <div className="ev-cities-grid">
              {sidebarCities.map((city) => (
                <Link key={city.slug} href={`/events/${city.slug}`} className="ev-city-card">
                  <span className="ev-city-name">{city.name}</span>
                  <span className="ev-city-country">{city.country}</span>
                  <span className="ev-city-count">{city.count}</span>
                </Link>
              ))}
            </div>
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
            <div className="connect-num">Moveee Connect</div>
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
              <Link href="/connect" className="btn-gold">Become a Member →</Link>
              <span className="font-serif italic text-paper/50 text-base">from $9 / month</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
