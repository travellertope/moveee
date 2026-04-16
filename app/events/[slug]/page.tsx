import { getWPData, GET_CULTURE_EVENT_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import RSVPForm from "../components/RSVPForm";
import "@/app/events.css";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event: any = null;
  try {
    const data = await getWPData(GET_CULTURE_EVENT_BY_SLUG, { slug });
    event = data?.cultureEvent ?? null;
  } catch { /* CMS unreachable */ }

  if (!event) notFound();

  const img = event.featuredImage?.node?.sourceUrl;
  const cat = event.cultureInterests?.nodes?.[0]?.name || "Culture";
  const dateObj = new Date(event.date);
  const dateFormatted = dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <article className="bg-paper min-h-screen">
      {/* ── IMMERSIVE HERO ── */}
      <section className="event-hero-single">
        {img ? (
          <Image src={img} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}
        <div className="hero-overlay" />
        
        <div className="hero-content-single">
          <div className="hero-eyebrow">
            <span className="pill">Event</span>
            <span className="sep">/</span>
            <span>{dateFormatted}</span>
          </div>
          
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: event.title }} />
          <p className="hero-subtitle">{event.excerpt?.replace(/<[^>]*>/g, "") || "Curated culture happenings by The Moveee."}</p>
          
          <div className="hero-meta-row">
            <div className="hero-meta-item">
              <div className="label">Venue</div>
              <div className="value">{event.location || "Venue TBA"}</div>
            </div>
            <div className="hero-meta-item">
              <div className="label">Date</div>
              <div className="value">{dateFormatted} · {dayName}</div>
            </div>
            <div className="hero-meta-item">
              <div className="label">Category</div>
              <div className="value">{cat}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          <span>{event.title} <span className="text-ochre">✦</span> {cat} <span className="text-ochre">✦</span> {event.location || 'Ikoyi, Lagos'} <span className="text-ochre">✦</span> RSVP Now <span className="text-ochre">✦</span></span>
          <span>{event.title} <span className="text-ochre">✦</span> {cat} <span className="text-ochre">✦</span> {event.location || 'Ikoyi, Lagos'} <span className="text-ochre">✦</span> RSVP Now <span className="text-ochre">✦</span></span>
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="page-body-grid">
        {/* Left Column: Content */}
        <div className="content-area">
          <div className="section-label">Overview</div>
          {event.content && (
            <div
              className="prose-content font-serif text-xl leading-relaxed text-ink-soft mb-12"
              dangerouslySetInnerHTML={{ __html: event.content }}
            />
          )}

          {/* Placeholder for Schedule/Programme */}
          <div className="programme mt-16">
            <div className="section-label">Programme</div>
            <div className="flex flex-col border-t border-rule/10">
               <div className="flex gap-8 py-6 border-b border-rule/10">
                 <div className="font-mono text-ochre text-xs pt-1">18:00</div>
                 <div>
                   <h4 className="font-serif italic text-lg">Doors Open</h4>
                   <p className="text-sm text-mute">Member preview and cocktail reception.</p>
                 </div>
               </div>
               <div className="flex gap-8 py-6 border-b border-rule/10">
                 <div className="font-mono text-ochre text-xs pt-1">19:30</div>
                 <div>
                   <h4 className="font-serif italic text-lg">Event Starts</h4>
                   <p className="text-sm text-mute">Main session and performances.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: RSVP Sidebar */}
        <aside className="sidebar-sticky">
          <div className="rsvp-card">
            <div className="top-label">RSVP Status</div>
            <h3 className="font-serif italic">Secure <em>Access</em></h3>
            <div className="event-date text-paper/60 font-serif italic mb-8">{dateFormatted}</div>

            <div className="capacity-bar">
              <div className="cap-label">
                <span>Availability</span>
                <span className="spots">73% Full</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '73%' }}></div>
              </div>
            </div>

            <div className="ticket-type flex justify-between py-4 border-t border-paper/10">
               <div>
                  <div className="font-serif italic text-lg">Standard Entry</div>
                  <div className="font-mono text-[9px] text-paper/40">Open to all</div>
               </div>
               <div className="font-serif italic text-xl text-moss brightness-150">Free</div>
            </div>

            <RSVPForm eventSlug={event.slug} eventTitle={event.title} />
          </div>

          <div className="bg-paper-deep p-8 mb-4">
             <div className="font-mono text-[9px] text-ochre uppercase tracking-widest mb-4">Location</div>
             <p className="font-serif italic text-ink-soft mb-2">{event.location || "Venue TBA"}</p>
             <button className="text-[9px] font-mono border-b border-ink uppercase">Open in Maps</button>
          </div>
          
          <Link href="/events" className="inline-block mt-4 font-mono text-[10px] border-b border-ink uppercase tracking-wider">
            ← Back to all Events
          </Link>
        </aside>
      </div>
    </article>
  );
}
