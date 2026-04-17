import { getEventBySlugWithFallback } from "@/lib/wp";
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
    event = await getEventBySlugWithFallback(slug, { revalidate: 0 });
  } catch { /* CMS unreachable */ }

  if (!event) notFound();

  const img = event.featuredImage?.node?.sourceUrl;
  const cat = event.cultureInterests?.nodes?.[0]?.name || "Happening";
  const dateRaw = event.eventDate || event.date || new Date().toISOString();
  const dateObj = new Date(dateRaw);
  const dateValid = !isNaN(dateObj.getTime()) ? dateObj : new Date();
  const dateFormatted = dateValid.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  
  const endObj = event.endDate ? new Date(event.endDate) : null;
  const endFormatted = (endObj && !isNaN(endObj.getTime())) ? endObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  const hasMetrics = event.metrics && event.metrics.length > 0;
  const hasSchedule = event.schedule && event.schedule.length > 0;
  const hasShowcase = event.showcase && event.showcase.length > 0;
  const host = event.featuredHost;

  return (
    <div className="events-page-wrapper">
      {/* ── HERO ── */}
      <section className="event-hero">
        {img && <Image src={img} alt={event.title} fill className="hero-image" priority />}
        <div className="hero-overlay" />
        
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="pill">● Upcoming</span>
            <span className="sep">·</span>
            <span>{cat} Opening</span>
            <span className="sep">·</span>
            <span>Moveee Events</span>
          </div>

          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: event.title.replace(/ /g, '<br/>') }} />
          <p className="hero-subtitle">{event.tagline || `${cat} by ${host?.title || "Moveee Talent"}`}</p>

          <div className="hero-meta-row">
            <div className="hero-meta-item">
              <div className="label">Opening Night</div>
              <div className="value">{dateFormatted}</div>
            </div>
            <div className="hero-meta-item">
              <div className="label">Venue</div>
              <div className="value">{event.location || "Venue TBA"}</div>
            </div>
            <div className="hero-meta-item">
              <div className="label">Exhibition Run</div>
              <div className="value">{dateFormatted} — {endFormatted || "TBA"}</div>
            </div>
          <div className="hero-cta-group">
            <button 
              className="btn-outline" 
              onClick={() => document.getElementById('programme-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View schedule
            </button>
            <button 
              className="btn-primary" 
              onClick={() => document.getElementById('rsvp-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              RSVP Now →
            </button>
          </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          <span className="accent">{event.title}</span>
          <span>{host?.title}</span>
          <span className="accent">★</span>
          <span>{event.location}</span>
          <span className="accent">{dateFormatted}</span>
          <span>{hasShowcase ? `${event.showcase.length} Works` : "Culture Archive"}</span>
          <span className="accent">★</span>
          <span>Limited Capacity</span>
          <span>Moveee Members: Private View Access</span>
          <span className="accent">★</span>
          <span>{event.admission || "Free Admission"}</span>
          <span className="accent">★</span>
          {/* duplicate for seamless loop */}
          <span className="accent">{event.title}</span>
          <span>{host?.title}</span>
          <span className="accent">★</span>
          <span>{event.location}</span>
          <span className="accent">{dateFormatted}</span>
          <span>{hasShowcase ? `${event.showcase.length} Works` : "Culture Archive"}</span>
          <span className="accent">★</span>
          <span>Limited Capacity</span>
          <span>Moveee Members: Private View Access</span>
          <span className="accent">★</span>
          <span>{event.admission || "Free Admission"}</span>
          <span className="accent">★</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <main className="page-body">
        {/* LEFT COLUMN */}
        <div className="left-col">
          <div className="section-label">About the exhibition</div>
          <div className="about-text prose-custom" dangerouslySetInnerHTML={{ __html: event.content }} />

          {/* Pull Quote */}
          {event.tagline && (
            <div className="pull-quote">
              <div className="bar" />
              <div>
                <blockquote>"{event.tagline}"</blockquote>
                <cite>— {host?.title}, on the work at hand</cite>
              </div>
            </div>
          )}

          {/* Selected Works */}
          {hasShowcase && (
            <div className="works-section">
              <div className="works-header">
                <h3>Selected <em>works</em></h3>
                <small>Preview · {event.showcase.length} items</small>
              </div>
              <div className="works-grid">
                {event.showcase.map((item: any, i: number) => (
                  <div key={i} className="work-card">
                    <div className="work-frame">
                      {item.image?.sourceUrl && (
                        <Image src={item.image.sourceUrl} alt={item.title} fill className="object-cover" />
                      )}
                    </div>
                    <div className="work-num">N°0{i+1}</div>
                    <div className="work-title">{item.title}</div>
                    <div className="work-meta">{item.media} · {item.dimensions} · {item.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Programme */}
          {hasSchedule && (
            <div className="programme" id="programme-section">
              <div className="section-label">Opening night programme</div>
              {event.schedule.map((item: any, i: number) => (
                <div key={i} className="programme-row">
                  <div className="prog-time">{item.time}</div>
                  <div>
                    <div className="prog-event-title">{item.title}</div>
                    <div className="prog-event-desc">{item.description}</div>
                    <span className={`prog-tag ${item.access === 'members_only' ? 'members' : 'open'}`}>
                      {item.access?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="rsvp-card" id="rsvp-section">
            <div className="top-label">RSVP · {dateFormatted}</div>
            
            {event.ticketingUrl ? (
              <>
                <h3 className="mb-4">Secure your <em>ticket</em></h3>
                <div className="event-date mb-10">{event.location} · {event.admission || "Paid Entry"}</div>
                <a 
                  href={event.ticketingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-primary w-full text-center block"
                >
                  Buy Ticket Now →
                </a>
                <div className="rsvp-small mt-6">Secure access via external partner</div>
              </>
            ) : (
              <>
                <h3>Secure your <em>place</em></h3>
                <div className="event-date">{event.location} · {event.openingHours || "Doors from 18:00"}</div>
                
                <div className="rsvp-form mt-8">
                  <RSVPForm eventSlug={event.slug} eventTitle={event.title} />
                </div>
              </>
            )}
          </div>

          <div className="info-card">
            <div className="label">📍 Venue</div>
            <p>{event.location}</p>
            <small>Please check your confirmation email for exact entry directions.</small>
          </div>

          <div className="info-card">
            <div className="label">📅 Exhibition dates</div>
            <p>{dateFormatted} — {endFormatted || "TBA"}</p>
            <small>{event.openingHours || "General Hours TBA"}<br/>Free Admission</small>
          </div>

          {event.associatedJourney && (
            <div className="info-card bg-ink text-paper">
              <div className="label text-gold">★ {event.associatedJourney.title}</div>
              <p className="text-paper opacity-80">Join the exclusive journey</p>
              <Link href={`/origins/${event.associatedJourney.slug}`} className="inline-block mt-4 border-b border-paper text-[10px] uppercase font-mono">
                View Journey →
              </Link>
            </div>
          )}
        </aside>
      </main>

      {/* GALLERY RUN */}
      <section className="gallery-run">
        <div className="gallery-run-inner">
          <div>
            <div className="section-label !border-paper/10">The exhibition</div>
            <h3>On view through<br/><em>{endFormatted || dateFormatted}</em></h3>
            <p>Admission is free and strictly by RSVP for the opening night. The archive remains open for visitors thereafter during regular gallery hours.</p>
            
            <div className="run-dates">
              <div className="run-date-item">
                <div className="d-label opacity-40 uppercase text-[9px] font-mono">Opens</div>
                <div className="text-xl font-serif italic">{dateFormatted}</div>
              </div>
              <div className="run-date-item">
                <div className="d-label opacity-40 uppercase text-[9px] font-mono">Admission</div>
                <div className="text-xl font-serif italic">{event.admission || "Free"}</div>
              </div>
            </div>
          </div>
          
          <div className="relative aspect-[3/4] bg-ochre-deep overflow-hidden">
            {img && <Image src={img} alt="Gallery" fill className="object-cover opacity-60 mix-blend-multiply" />}
          </div>
        </div>
      </section>

      {/* ARTIST STRIP */}
      {host && (
        <section className="artist-strip">
          <div className="artist-avatar">
            {host.featuredImage?.node?.sourceUrl && (
              <Image src={host.featuredImage.node.sourceUrl} alt={host.title} fill className="object-cover" />
            )}
          </div>
          <div className="artist-info">
            <div className="section-label">The artist</div>
            <h3>{host.title.split(' ')[0]} <em>{host.title.split(' ')[1]}</em></h3>
            <div className="font-serif italic text-lg text-ink-soft opacity-80" dangerouslySetInnerHTML={{ __html: host.excerpt }} />
            <Link href={`/directory/${host.slug}`} className="inline-block mt-6 border-b border-ink text-[10px] uppercase font-mono">
              Read the full portrait →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
