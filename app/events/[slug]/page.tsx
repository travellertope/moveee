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
    <article className="bg-paper min-h-screen selection:bg-gold selection:text-ink">
      {/* ── IMMERSIVE HAPPENING HERO ── */}
      <section className="happening-hero">
        {img && (
          <div className="happening-hero-bg">
            <Image src={img} alt={event.title} fill className="object-cover grayscale hover:grayscale-0 transition-all duration-700" priority />
            <div className="absolute inset-0 bg-ink/60" />
          </div>
        )}
        
        <div className="happening-hero-content">
          <span className="tag">{cat}</span>
          <h1 dangerouslySetInnerHTML={{ __html: event.title.replace(/ /g, ' <em class="font-serif italic text-gold">') + '</em>' }} />
          
          {event.attribution && (
            <div className="attribution">— {event.attribution}</div>
          )}

          <div className="happening-hero-actions">
            <button className="btn-secondary">Save for Later</button>
            <button className="btn-gold">RSVP Connect</button>
          </div>

          <div className="happening-meta-grid">
            <div className="item">
              <div className="label">Date</div>
              <div className="value">{dateFormatted}</div>
            </div>
            <div className="item">
              <div className="label">Location</div>
              <div className="value">{event.location || "Venue TBA"}</div>
            </div>
            <div className="item">
              <div className="label">Doors</div>
              <div className="value">18h00 — 22h00</div>
            </div>
            <div className="item">
              <div className="label">Admission</div>
              <div className="value">{event.admission || "Free"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NARRATIVE ── */}
      <section className="happening-narrative">
        <div className="narrative-content prose-custom">
          <div className="section-label">Concept</div>
          <div dangerouslySetInnerHTML={{ __html: event.content }} />
        </div>
      </section>

      {/* ── QUOTE BLOCK ── */}
      {event.tagline && (
        <section className="happening-quote">
          <blockquote className="italic font-serif">
             "{event.tagline}"
          </blockquote>
        </section>
      )}

      {/* ── PROGRAM (Un-nested) ── */}
      {hasSchedule && (
        <section className="happening-program">
          <div className="section-label">Program</div>
          <div className="program-list">
            {event.schedule.map((item: any, i: number) => (
              <div key={i} className="program-item">
                <div className="time">{item.time}</div>
                <div className="details">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  <span className="access-tag">{item.access?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SHOWCASE GRID ── */}
      {hasShowcase && (
        <section className="happening-showcase">
          <div className="showcase-header">
            <h2>Selected <em>works</em></h2>
            <div className="font-mono text-[10px] opacity-40 uppercase tracking-widest">Gallery v.01</div>
          </div>
          
          <div className="showcase-grid">
            {event.showcase.map((item: any, i: number) => (
              <div key={i} className="showcase-card group">
                <div className="showcase-img">
                  {item.image?.sourceUrl && (
                    <Image src={item.image.sourceUrl} alt={item.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  )}
                </div>
                <div className="showcase-info">
                  <span className="num">N°0{i+1}</span>
                  <h4>{item.title}</h4>
                  <div className="showcase-meta">
                    {item.media && <span>{item.media}</span>}
                    {item.dimensions && <span>{item.dimensions}</span>}
                    {item.year && <span>{item.year}</span>}
                    {item.price && <span className="text-ochre mt-2">{item.price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SUMMARY & RSVP ── */}
      <section className="happening-summary">
        <div className="summary-content">
          <div className="eyebrow">Participation</div>
          <h3 dangerouslySetInnerHTML={{ 
            __html: endFormatted 
              ? `On view through <em class="block text-gold">${endFormatted}</em>` 
              : `Join the <em class="block text-gold">${cat}</em> Experience`
          }} />
          
          <div className="summary-metrics">
            <div className="metric">
              <div className="label">Opens</div>
              <div className="value">{dateFormatted}</div>
            </div>
            {endFormatted && (
              <div className="metric">
                <div className="label">Closes</div>
                <div className="value">{endFormatted}</div>
              </div>
            )}
            {hasMetrics && event.metrics.map((m: any, i: number) => (
              <div key={i} className="metric">
                <div className="label">{m.label}</div>
                <div className="value">{m.value}</div>
              </div>
            ))}
            <div className="metric">
              <div className="label">Admission</div>
              <div className="value">{event.admission || "Free"}</div>
            </div>
          </div>

          <div className="rsvp-box">
             <button className="btn-gold-lg">RSVP for a Studio Visit →</button>
          </div>
        </div>

        <div className="summary-visual">
          {img && <Image src={img} alt="Summary" fill className="object-cover opacity-80" />}
        </div>
      </section>

      {/* ── TALENT BIO ── */}
      {host && (
        <section className="happening-host">
          <div className="host-avatar">
             {host.featuredImage?.node?.sourceUrl ? (
               <Image src={host.featuredImage.node.sourceUrl} alt={host.title} fill className="object-cover" />
             ) : (
               <div className="bg-paper-deep w-full h-full flex items-center justify-center font-serif italic opacity-40">Profile</div>
             )}
          </div>
          <div className="host-info">
            <span className="label">The Host</span>
            <h4>{host.title.split(' ')[0]} <em>{host.title.split(' ')[1]}</em></h4>
            <div className="bio" dangerouslySetInnerHTML={{ __html: host.excerpt }} />
            <div className="host-socials">
              <Link href={`/directory/${host.slug}`}>View Profile →</Link>
              {host.instagramHandle && <a href={`https://instagram.com/${host.instagramHandle}`} target="_blank">Instagram</a>}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER NAV ── */}
      <footer className="py-20 px-10 flex justify-between items-center border-t border-rule/10">
        <Link href="/events" className="font-mono text-xs uppercase tracking-widest border-b border-ink">
          ← Back to Events
        </Link>
        <div className="font-mono text-[10px] opacity-30 text-right">
          © 2026 THE MOVEEE<br/>CULTURE ARCHIVE
        </div>
      </footer>
    </article>
  );
}
