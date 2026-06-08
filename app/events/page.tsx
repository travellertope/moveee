import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import EventHero from "./components/EventHero";
import EventCard from "./components/EventCard";
import EventsCarousel from "./components/EventsCarousel";
import CommunityRadarSection from "./components/CommunityRadarSection";
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
  { slug: "music",       name: "Music",       icon: "♪", desc: "Concerts, listening sessions & releases" },
  { slug: "film",        name: "Film",         icon: "◉", desc: "Screenings, premieres & cinema" },
  { slug: "visual-arts", name: "Visual Arts",  icon: "◈", desc: "Exhibitions, galleries & installations" },
  { slug: "fashion",     name: "Fashion",      icon: "✦", desc: "Shows, presentations & pop-ups" },
  { slug: "food",        name: "Food",         icon: "◆", desc: "Supper clubs, markets & tastings" },
  { slug: "literature",  name: "Literature",   icon: "▬", desc: "Book launches, readings & discussions" },
  { slug: "design",      name: "Design",       icon: "◻", desc: "Architecture, craft & creative direction" },
  { slug: "performance", name: "Performance",  icon: "★", desc: "Theatre, dance & live arts" },
  { slug: "community",   name: "Community",    icon: "◇", desc: "Gatherings, panels & cultural events" },
  { slug: "tech",        name: "Tech",         icon: "○", desc: "Innovation, startups & digital culture" },
];

function isEventPast(event: any): boolean {
  const checkDate = event.endDate || event.eventDate;
  if (!checkDate) return false;
  const d = new Date(checkDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d < today;
}

function groupEventsByMonth(events: any[]) {
  const groups: { month: string; events: any[] }[] = [];
  events.forEach((event) => {
    const targetDate = event.eventDate || event.date || new Date().toISOString();
    let dateObj = new Date(targetDate);
    if (isNaN(dateObj.getTime())) dateObj = new Date();
    const monthStr = dateObj.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const month = monthStr === "Invalid Date" ? "Happening Soon" : monthStr;
    let group = groups.find((g) => g.month === month);
    if (!group) { group = { month, events: [] }; groups.push(group); }
    group.events.push(event);
  });
  groups.sort((a, b) => {
    if (a.month === "Happening Soon") return -1;
    if (b.month === "Happening Soon") return 1;
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  });
  return groups;
}

function eventsForCity(events: any[], cityName: string): any[] {
  const q = cityName.toLowerCase();
  return events.filter((e) => {
    const hay = `${e.city ?? ""} ${e.location ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export default async function EventsPage() {
  let events: any[] = [];
  try { events = await getEventsWithFallback(100, { revalidate: 0 }); } catch { /* CMS unreachable */ }

  const upcoming       = events.filter((e) => !isEventPast(e));
  const ownEvents      = upcoming.filter((e) => !e.isAiGenerated);
  const seededEvents   = upcoming.filter((e) => e.isAiGenerated);

  // Top 3 curated for the editorial grid
  const editorialPicks = [...ownEvents]
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(a.eventDate || a.date || 0).getTime() - new Date(b.eventDate || b.date || 0).getTime();
    })
    .slice(0, 3);

  // Remaining own events (after the editorial picks)
  const editorialIds   = new Set(editorialPicks.map((e) => e.id));
  const remainingOwn   = ownEvents.filter((e) => !editorialIds.has(e.id));
  const groupedEvents  = groupEventsByMonth(remainingOwn);

  return (
    <div className="events-page bg-paper">

      {/* ── HERO ── */}
      <EventHero
        title="Moveee <em>Happenings</em>"
        standfirst="Curated openings, listening sessions, film screenings, supper clubs and community gatherings — across Africa and the diaspora."
        stats={[
          { num: events.length, label: `Happenings · ${new Date().getFullYear()}` },
          { num: FEATURED_CITIES.length, label: "Cities covered" },
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

      {/* ── EDITORIAL 3-COL GRID ── */}
      {editorialPicks.length > 0 && (
        <section className="ev-editorial-section">
          <div className="ev-editorial-inner">
            <div className="ev-editorial-header">
              <div>
                <span className="ev-editorial-eyebrow">Curated Picks</span>
                <h2>Happening <em>soon</em></h2>
              </div>
              <Link href="#all-events" className="ev-editorial-all">All events ↓</Link>
            </div>
            <div className="ev-editorial-grid">
              {editorialPicks.map((event) => {
                const cat = Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
                  ? event.cultureInterests.nodes[0].name : "Culture";
                const d = new Date(event.eventDate || event.date || Date.now());
                const dateStr = isNaN(d.getTime()) ? "TBA Date" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
                return (
                  <EventCard
                    key={event.id}
                    slug={event.slug}
                    title={event.title}
                    date={dateStr}
                    location={event.location || event.city || ""}
                    time={event.openingHours || ""}
                    category={cat}
                    image={event.featuredImage?.node?.sourceUrl || event.eventImageUrl}
                    status={event.isFeatured ? "upcoming" : "upcoming"}
                    tags={["RSVP"]}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── PER-CITY CAROUSELS ── */}
      {FEATURED_CITIES.map(({ slug, name, country }) => {
        const cityEvents = eventsForCity(upcoming, name);
        if (cityEvents.length === 0) return null;
        return (
          <section key={slug} className="ev-city-section">
            <div className="ev-city-inner">
              <div className="ev-city-header">
                <div>
                  <span className="ev-city-eyebrow">{country}</span>
                  <h3>Happening in <em>{name}</em></h3>
                </div>
                <Link href={`/events/${slug}`} className="ev-city-viewall">
                  View all in {name} →
                </Link>
              </div>
              <EventsCarousel events={cityEvents.slice(0, 10)} />
            </div>
          </section>
        );
      })}

      {/* ── BROWSE BY CATEGORY ── */}
      <section className="ev-cat-browse-section">
        <div className="ev-cat-browse-inner">
          <div className="ev-cat-browse-header">
            <span className="ev-editorial-eyebrow">Browse</span>
            <h2>By <em>category</em></h2>
          </div>
          <div className="ev-cat-browse-grid">
            {CATEGORIES.map(({ slug, name, icon, desc }) => (
              <Link key={slug} href={`/events/${slug}`} className="ev-cat-tile">
                <span className="ev-cat-icon">{icon}</span>
                <span className="ev-cat-name">{name}</span>
                <span className="ev-cat-desc">{desc}</span>
                <span className="ev-cat-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL CURATED EVENTS (remaining after editorial picks) ── */}
      {groupedEvents.length > 0 && (
        <section className="events-section" id="all-events">
          <div className="ev-section-title-row">
            <span className="ev-editorial-eyebrow">All Happenings</span>
            <h2>Upcoming <em>events</em></h2>
          </div>
          {groupedEvents.map((group, idx) => (
            <div key={idx} className="month-group">
              <div className="month-label">
                <h3>{group.month.split(" ")[0]} <em>{group.month.split(" ")[1]}</em></h3>
                <div className="line" />
                <span className="count">{group.events.length} events</span>
              </div>
              <div className="events-grid">
                {group.events.map((event) => {
                  const cat = Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
                    ? event.cultureInterests.nodes[0].name : "Culture";
                  const d = new Date(event.eventDate || event.date || Date.now());
                  const dateStr = isNaN(d.getTime()) ? "TBA Date" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
                  return (
                    <EventCard
                      key={event.id}
                      slug={event.slug}
                      title={event.title}
                      date={dateStr}
                      location={event.location || event.city || ""}
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
          ))}
        </section>
      )}

      {/* ── COMMUNITY RADAR ── */}
      <CommunityRadarSection events={seededEvents} />

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
