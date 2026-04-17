import Link from "next/link";
import { getEventsWithFallback } from "@/lib/wp";
import EventHero from "./components/EventHero";
import SpotlightCard from "./components/SpotlightCard";
import EventCard from "./components/EventCard";
import Marquee from "@/components/Marquee";
import "@/app/events.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
  description: "Curated openings, listening sessions, film screenings, and community gatherings across Africa and the diaspora.",
};

/** Group events by Month Year with robust fallback */
function groupEventsByMonth(events: any[]) {
  const groups: { month: string; events: any[] }[] = [];
  
  events.forEach(event => {
    // Prefer metadata eventDate, then post publication date, then "now"
    const targetDate = event.eventDate || event.date || new Date().toISOString();
    let dateObj = new Date(targetDate);
    
    // Check for "Invalid Date"
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date(); // Fallback to now
    }
    
    const monthStr = dateObj.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const month = monthStr === "Invalid Date" ? "Happening Soon" : monthStr;
    
    let group = groups.find(g => g.month === month);
    if (!group) {
      group = { month, events: [] };
      groups.push(group);
    }
    group.events.push(event);
  });
  
  // Sort months chronologically
  groups.sort((a, b) => {
    if (a.month === "Happening Soon") return -1;
    if (b.month === "Happening Soon") return 1;
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  });
  
  return groups;
}

export default async function EventsPage() {
  let events: any[] = [];
  try {
    events = await getEventsWithFallback(50, { revalidate: 0 });
  } catch { /* CMS unreachable */ }

  const spotlightEvent = events.find(e => e.isFeatured) || events[0];
  const otherEvents = spotlightEvent ? events.filter(e => e.id !== spotlightEvent.id) : events;
  const groupedEvents = groupEventsByMonth(otherEvents);

  return (
    <div className="events-page bg-paper pb-24">
      {/* ── HERO ── */}
      <EventHero 
        title="Moveee <em>Events</em>"
        standfirst="Curated openings, listening sessions, film screenings, supper clubs and community gatherings — across Africa and the diaspora. Not everything happens online."
        stats={[
          { num: events.length, label: `Events · ${new Date().getFullYear()}` },
          { num: "06", label: "Cities this quarter" },
          { num: "04", label: "Members-only experiences" }
        ]}
      />

      <Marquee />

      {/* ── SPOTLIGHT ── */}
      {spotlightEvent && (
        <SpotlightCard 
          slug={spotlightEvent.slug}
          title={spotlightEvent.title}
          subtitle={spotlightEvent.excerpt?.replace(/<[^>]*>/g, "").slice(0, 120)}
          date={(() => {
            const d = new Date(spotlightEvent.eventDate || spotlightEvent.date || Date.now());
            return isNaN(d.getTime()) ? "TBA Date" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
          })()}
          dayName={(() => {
            const d = new Date(spotlightEvent.eventDate || spotlightEvent.date || Date.now());
            return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { weekday: "long" });
          })()}
          venue={spotlightEvent.location || "Venue TBA"}
          time="Doors 6 PM"
          admission={spotlightEvent.admission || "Free · RSVP required"}
          image={spotlightEvent.featuredImage?.node?.sourceUrl}
          statusBadge="Featured"
        />
      )}

      {/* ── FILTERS (Placholder for now) ── */}
      <div className="filter-bar">
        <div className="filter-inner">
          <span className="filter-label">Filter</span>
          <button className="filter-btn active">All</button>
          <button className="filter-btn">Visual Art</button>
          <button className="filter-btn">Music</button>
          <button className="filter-btn">Film</button>
          <button className="filter-btn">Food</button>
          <button className="filter-btn">Members Only</button>
          <span className="filter-count">Showing {events.length} events</span>
        </div>
      </div>

      {/* ── GRID ── */}
      <section className="events-section">
        {groupedEvents.length === 0 && events.length === 0 ? (
          <p className="textAlign-center py-20 font-serif italic text-2xl text-mute">
            No upcoming events — check back soon.
          </p>
        ) : (
          groupedEvents.map((group, idx) => (
            <div key={idx} className="month-group">
              <div className="month-label">
                <h3>{group.month.split(' ')[0]} <em>{group.month.split(' ')[1]}</em></h3>
                <div className="line"></div>
                <span className="count">{group.events.length} events</span>
              </div>

              <div className="events-grid">
                {group.events.map((event) => (
                  <EventCard 
                    key={event.id}
                    slug={event.slug}
                    title={event.title}
                    date={(() => {
                      const d = new Date(event.eventDate || event.date || Date.now());
                      return isNaN(d.getTime()) ? "TBA Date" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
                    })()}
                    location={event.location || "Lagos, Nigeria"}
                    time="18:00 – 21:00"
                    category={Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0 ? event.cultureInterests.nodes[0].name : "Culture"}
                    image={event.featuredImage?.node?.sourceUrl}
                    status={event.status || 'upcoming'}
                    tags={['RSVP']}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

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
