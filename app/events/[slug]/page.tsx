import { getWPData, GET_EVENT_BY_SLUG } from "@/lib/wp";
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
    const data = await getWPData(GET_EVENT_BY_SLUG, { slug });
    event = data?.cultureEvent ?? null;
  } catch { /* CMS unreachable */ }

  if (!event) notFound();

  const img = event.featuredImage?.node?.sourceUrl;
  const cat = event.cultureInterests?.nodes?.[0]?.name || "Happening";
  const dateObj = new Date(event.eventDate || event.date);
  const dateFormatted = dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  
  const endObj = event.endDate ? new Date(event.endDate) : null;
  const endFormatted = endObj ? endObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

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
          </div>
        )}
        
        <div className="happening-hero-content">
          <span className="tag">{cat}</span>
          <h1 dangerouslySetInnerHTML={{ __html: event.title.replace(/ /g, ' <em class="font-serif italic text-gold">') + '</em>' }} />
          
          {event.attribution && (
            <div className="attribution">— {event.attribution}</div>
          )}

          <div className="happening-meta-grid">
            <div className="item">
              <div className="label">Date</div>
              <div className="value">{dateFormatted}</div>
            </div>
            <div className="item">
              <div className="label">Location</div>
              <div className="value">{event.location || "Venue TBA"}</div>
            </div>
            {event.openingHours && (
              <div className="item">
                <div className="label">Opening Hours</div>
                <div className="value whitespace-pre-line">{event.openingHours}</div>
              </div>
            )}
            {endFormatted && (
              <div className="item">
                <div className="label">On View Until</div>
                <div className="value">{endFormatted}</div>
              </div>
            )}
            <div className="item">
              <div className="label">Admission</div>
              <div className="value">{event.admission || "Free"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NARRATIVE & QUOTE ── */}
      <section className="happening-narrative">
        <div className="narrative-grid">
          <div className="narrative-content prose-custom">
            <div className="section-label mb-8">Concept</div>
            <div dangerouslySetInnerHTML={{ __html: event.content }} />
          </div>
          
          <div className="sidebar-meta">
             {event.tagline && (
               <div className="narrative-quote pt-0 border-t-0 mt-0">
                 <blockquote className="italic font-serif text-3xl leading-tight">
                    "{event.tagline}"
                 </blockquote>
               </div>
             )}
             
             {hasSchedule && (
               <div className="mt-16 bg-paper-deep p-8 border-l-2 border-ochre">
                 <div className="section-label mb-6">Program</div>
                 <div className="space-y-8">
                   {event.schedule.map((item: any, i: number) => (
                     <div key={i} className="session">
                       <div className="font-mono text-[10px] text-ochre uppercase mb-1">{item.time}</div>
                       <h4 className="font-serif italic text-xl mb-1">{item.title}</h4>
                       <p className="text-sm text-ink-soft mb-2">{item.description}</p>
                       <span className="text-[9px] font-mono border border-ink/20 px-2 py-0.5 uppercase opacity-60">
                         {item.access?.replace('_', ' ')}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE GRID (Smart Hiding) ── */}
      {hasShowcase && (
        <section className="happening-showcase">
          <div className="showcase-header">
            <h2>{cat === 'Art' ? 'Selected' : 'Event'} <em>Works</em></h2>
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

      {/* ── JOURNEY & PRESS (New Blocks) ── */}
      {(event.associatedJourney || (event.pressDetails && event.pressDetails.content)) && (
        <section className="happening-comm-blocks bg-paper">
          {event.associatedJourney && (
            <div className="comm-card journey">
               <span className="eyebrow">Origins Journey</span>
               <h3>{event.associatedJourney.title}</h3>
               <p>{event.associatedJourney.excerpt?.replace(/<[^>]*>/g, "")}</p>
               <Link href={`/journeys/${event.associatedJourney.slug}`} className="cta">
                 View Journey →
               </Link>
            </div>
          )}
          
          {event.pressDetails && event.pressDetails.content && (
            <div className="comm-card press">
               <span className="eyebrow">{event.pressDetails.eyebrow || 'Press & Media'}</span>
               <h3>{event.pressDetails.title || 'Press enquiries'}</h3>
               <p>{event.pressDetails.content}</p>
               {event.pressDetails.link && (
                 <a href={event.pressDetails.link} className="cta">
                   {event.pressDetails.link.includes('@') ? event.pressDetails.link.replace('mailto:', '') : 'Contact PR'} →
                 </a>
               )}
            </div>
          )}
        </section>
      )}

      {/* ── SUMMARY & RSVP ── */}
      <section className="happening-summary">
        <div className="summary-content">
          <div className="eyebrow">Participation</div>
          <h3 dangerouslySetInnerHTML={{ 
            __html: endFormatted 
              ? (cat === 'Art' ? `On view through <em>${endFormatted}</em>` 
                 : cat === 'Music' ? `Sessions through <em>${endFormatted}</em>` 
                 : cat === 'Food' ? `Available through <em>${endFormatted}</em>`
                 : `Running through <em>${endFormatted}</em>`)
              : `Join the<em> ${cat}</em> Experience`
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

          <div className="rsvp-box max-w-md">
            <RSVPForm eventSlug={event.slug} eventTitle={event.title} />
          </div>
        </div>

        <div className="summary-visual">
          {img && <Image src={img} alt="Summary" fill className="object-cover opacity-50 contrast-125 grayscale" />}
          <div className="absolute inset-0 bg-ink/40" />
        </div>
      </section>

      {/* ── TALENT BIO (Smart Hiding) ── */}
      {host && (
        <section className="happening-host border-t border-rule/10">
          <div className="host-avatar">
             {host.featuredImage?.node?.sourceUrl ? (
               <Image src={host.featuredImage.node.sourceUrl} alt={host.title} fill className="object-cover" />
             ) : (
               <div className="bg-paper-deep w-full h-full flex items-center justify-center font-serif italic opacity-40">Profile</div>
             )}
          </div>
          <div className="host-info">
            <span className="label">The Host</span>
            <h4>{host.title} <em>{host.instagramHandle ? `@${host.instagramHandle}` : ''}</em></h4>
            <div className="bio" dangerouslySetInnerHTML={{ __html: host.excerpt }} />
            <div className="host-socials">
              {host.websiteUrl && <a href={host.websiteUrl} target="_blank">Website</a>}
              {host.instagramHandle && <a href={`https://instagram.com/${host.instagramHandle}`} target="_blank">Instagram</a>}
              {host.twitterHandle && <a href={`https://twitter.com/${host.twitterHandle}`} target="_blank">Twitter</a>}
              <Link href={`/directory/${host.slug}`}>View Profile</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER NAV ── */}
      <footer className="py-20 px-10 flex justify-between items-center border-t border-rule/5">
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
