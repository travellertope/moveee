import { getEventBySlugWithFallback } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import RSVPForm from "../components/RSVPForm";
import "@/app/events.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let event: any = null;
  try {
    event = await getEventBySlugWithFallback(slug, { revalidate: 0 });
  } catch { /* CMS unreachable */ }

  if (!event) {
    return {
      title: "Event Not Found | The Moveee",
      description: "This event could not be found.",
    };
  }

  const dateRaw = event.eventDate || event.date || new Date().toISOString();
  const dateObj = new Date(dateRaw);
  const dateFormatted = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "TBA";
  const location = event.location || "Venue TBA";
  const excerpt = event.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || event.tagline || "A curated cultural event from The Moveee";

  return {
    title: `${event.title} · ${dateFormatted} · ${location} | The Moveee Events`,
    description: excerpt,
    openGraph: {
      title: event.title,
      description: excerpt,
      url: `https://themoveee.com/events/${slug}`,
      type: "website",
      images: event.featuredImage?.node?.sourceUrl ? [{ url: event.featuredImage.node.sourceUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: excerpt,
      images: event.featuredImage?.node?.sourceUrl ? [event.featuredImage.node.sourceUrl] : [],
    },
  };
}

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

  // Status derived from event date
  const now = new Date();
  const eventStatus = dateValid > now ? "Upcoming" : (endObj && endObj > now ? "Current" : "Past");

  const eventSubtype = event.eventSubtype || "";
  const aboutLabel = event.aboutLabel || "About the event";
  const galleryRunText = event.galleryRunText || "Admission is free and strictly by RSVP for the opening night. The archive remains open for visitors thereafter during regular gallery hours.";
  const venueAddress = event.venueAddress || "";
  const membersNote = event.rsvpMembersNote || "";
  const rsvpTicketTypes = event.rsvpTicketTypes && event.rsvpTicketTypes.length > 0
    ? event.rsvpTicketTypes.map((t: any) => ({
        ticketName:     t.ticketName,
        ticketSlug:     t.ticketSlug,
        ticketInfo:     t.ticketInfo,
        ticketPrice:    t.ticketPrice    || null,
        ticketAmount:   t.ticketAmount   ?? 0,
        ticketCurrency: t.ticketCurrency ?? 'NGN',
      }))
    : undefined;

  const hasMetrics = event.metrics && event.metrics.length > 0;
  const hasSchedule = Array.isArray(event.schedule) && event.schedule.length > 0;
  const hasShowcase = Array.isArray(event.showcase) && event.showcase.length > 0;
  const hasHost = event.featuredHost && typeof event.featuredHost === 'object' && event.featuredHost?.title;
  const host = hasHost ? event.featuredHost : null;

  // Eyebrow pieces
  const eyebrowType = eventSubtype || cat;
  const eyebrowStatus = `● ${eventStatus}`;

  return (
    <div className="events-page-wrapper">
      {/* ── HERO — left: content, right: featured image ── */}
      <section className="event-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="pill">{eyebrowStatus}</span>
            <span className="sep">·</span>
            <span>{eyebrowType}</span>
            <span className="sep">·</span>
            <span>Moveee Events</span>
          </div>

          <h1 className="hero-title">{event.title}</h1>
          <p className="hero-subtitle">{event.tagline || `${cat} by ${host?.title || "Moveee Talent"}`}</p>

          <div className="hero-meta-row">
            <div className="hero-meta-item">
              <div className="label">{eventSubtype || "Opening Night"}</div>
              <div className="value">{dateFormatted}</div>
            </div>
            <div className="hero-meta-item">
              <div className="label">Venue</div>
              <div className="value">{event.location || "Venue TBA"}</div>
            </div>
            {endFormatted && (
              <div className="hero-meta-item">
                <div className="label">Event run</div>
                <div className="value">{dateFormatted} — {endFormatted}</div>
              </div>
            )}
            {event.metrics?.map((m: any, i: number) => (
              <div key={i} className="hero-meta-item">
                <div className="label">{m.label}</div>
                <div className="value">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="hero-cta-group">
            {hasSchedule && <a href="#programme-section" className="btn-outline">View schedule</a>}
            <a href="#rsvp-section" className="btn-primary">RSVP Now →</a>
          </div>
        </div>

        {/* Right panel: featured image */}
        <div className="hero-image-panel">
          {img && (
            <Image src={img} alt={event.title} fill className="hero-image" priority style={{ objectFit: "cover" }} />
          )}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          <span className="accent">{event.title}</span>
          {host?.title && <span>{host.title}</span>}
          <span className="accent">★</span>
          {event.location && <span>{event.location}</span>}
          <span className="accent">{dateFormatted}</span>
          {hasShowcase ? <span>{event.showcase.length} Works</span> : <span>Culture Archive</span>}
          <span className="accent">★</span>
          {event.rsvpCapacity ? <span>Limited Capacity — {event.rsvpCapacity} Spots</span> : null}
          {membersNote && <span>★ Members: early access</span>}
          <span className="accent">★</span>
          <span>{event.admission || "Free Admission"}</span>
          <span className="accent">★</span>
          {/* duplicate for seamless loop */}
          <span className="accent">{event.title}</span>
          {host?.title && <span>{host.title}</span>}
          <span className="accent">★</span>
          {event.location && <span>{event.location}</span>}
          <span className="accent">{dateFormatted}</span>
          {hasShowcase ? <span>{event.showcase.length} Works</span> : <span>Culture Archive</span>}
          <span className="accent">★</span>
          {event.rsvpCapacity ? <span>Limited Capacity — {event.rsvpCapacity} Spots</span> : null}
          {membersNote && <span>★ Members: early access</span>}
          <span className="accent">★</span>
          <span>{event.admission || "Free Admission"}</span>
          <span className="accent">★</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <main className="page-body">
        {/* LEFT COLUMN */}
        <div className="left-col">
          <div className="section-label">{aboutLabel}</div>
          <div className="about-text prose-custom" dangerouslySetInnerHTML={{ __html: event.content || "<p>Event details coming soon.</p>" }} />

          {/* Pull Quote */}
          {event.tagline && (
            <div className="pull-quote">
              <div className="bar" />
              <div>
                <blockquote>"{event.tagline}"</blockquote>
                {(host?.title || event.attribution) && (
                  <cite>— {host?.title || event.attribution}</cite>
                )}
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
              <div className="section-label">Programme</div>
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
                <h3>Secure your <em>ticket</em></h3>
                <div className="event-date">{event.location} · {event.admission || "Paid Entry"}</div>
                <a
                  href={event.ticketingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: "block", textAlign: "center", marginTop: "24px" }}
                >
                  Buy Ticket Now →
                </a>
                <p className="rsvp-small">Secure access via external partner</p>
              </>
            ) : (
              <>
                <h3>Secure your <em>place</em></h3>
                <div className="event-date">{event.location} · {event.openingHours || "See details"}</div>
                <RSVPForm
                  eventSlug={event.slug}
                  eventTitle={event.title}
                  capacity={event.rsvpCapacity ?? undefined}
                  spotsRemaining={event.spotsRemaining ?? undefined}
                  ticketTypes={rsvpTicketTypes}
                  membersNote={membersNote || undefined}
                />
              </>
            )}
          </div>

          <div className="info-card">
            <div className="label">📍 Venue</div>
            <p>{event.location || "Venue TBA"}</p>
            {venueAddress ? (
              <small style={{ whiteSpace: "pre-line" }}>{venueAddress}</small>
            ) : (
              <small>Please check your confirmation email for exact entry directions.</small>
            )}
          </div>

          <div className="info-card">
            <div className="label">📅 Event dates</div>
            <p>{dateFormatted}{endFormatted ? ` — ${endFormatted}` : ""}</p>
            <small>{event.openingHours || "Hours TBA"}<br/>{event.admission || "Free Admission"}</small>
          </div>

          {event.associatedJourney && (
            <div className="info-card" style={{ background: "var(--ink)", color: "var(--paper)" }}>
              <span className="label" style={{ color: "var(--ochre)" }}>★ {event.associatedJourney.title}</span>
              <p style={{ color: "rgba(243,236,224,0.85)" }}>Join the exclusive journey</p>
              <Link href={`/origins/${event.associatedJourney.slug}`} style={{ color: "var(--paper)", borderColor: "var(--paper)" }}>
                View Journey →
              </Link>
            </div>
          )}

          {/* Press box — always shown, uses defaults when not filled in WordPress */}
          <div className="info-card">
            <span className="label">{event.pressDetails?.eyebrow || "Press & Media"}</span>
            <p>{event.pressDetails?.title || "Press enquiries"}</p>
            <small>
              {event.pressDetails?.content
                ? event.pressDetails.content.replace(/<[^>]*>/g, "")
                : "For accreditation, image requests, and interview coordination, contact Moveee PR."}
            </small>
            {event.pressDetails?.link && (
              <a href={event.pressDetails.link}>{event.pressDetails.link.replace(/^mailto:/, "")} →</a>
            )}
          </div>
        </aside>
      </main>

      {/* ON VIEW / EVENT RUN */}
      <section className="gallery-run">
        <div className="gallery-run-inner">
          <div>
            <div className="section-label">{eyebrowType}</div>
            <h3>On view through<br/><em>{endFormatted || dateFormatted}</em></h3>
            <p>{galleryRunText}</p>

            <div className="run-dates">
              <div className="run-date-item">
                <div className="d-label">Opens</div>
                <div className="d-val">{dateFormatted}</div>
              </div>
              <div className="run-date-item">
                <div className="d-label">Closes</div>
                <div className="d-val">{endFormatted || "TBA"}</div>
              </div>
              <div className="run-date-item">
                <div className="d-label">Hours</div>
                <div className="d-val">{event.openingHours || "See venue"}</div>
              </div>
              <div className="run-date-item">
                <div className="d-label">Admission</div>
                <div className="d-val">{event.admission || "Free"}</div>
              </div>
            </div>

            <a href="#rsvp-section" className="btn-primary">RSVP Now →</a>
          </div>

          {/* On-view image — uses dedicated ACF field if set, falls back to featured image */}
          <div className="gallery-portrait">
            {(event.onViewImage?.node?.sourceUrl || img) && (
              <Image
                src={event.onViewImage?.node?.sourceUrl || img}
                alt={event.onViewImage?.node?.altText || event.title}
                fill
                style={{ objectFit: "cover" }}
              />
            )}
          </div>
        </div>
      </section>

      {/* ARTIST STRIP */}
      {hasHost && (
        <section className="artist-strip">
          <div className="artist-avatar">
            {host.featuredImage?.node?.sourceUrl && (
              <Image src={host.featuredImage.node.sourceUrl} alt={host.title} fill className="object-cover" />
            )}
          </div>
          <div className="artist-info">
            <div className="section-label">The artist</div>
            <h3>{host.title?.split(' ')[0] || "Featured"} <em>{host.title?.split(' ').slice(1).join(' ') || "Artist"}</em></h3>
            <div
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: "20px" }}
              dangerouslySetInnerHTML={{ __html: host.excerpt }}
            />
            <Link
              href={`/directory/${host.slug}`}
              style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", borderBottom: "1px solid var(--ink)", paddingBottom: "2px", textDecoration: "none", color: "var(--ink)" }}
            >
              Read the full portrait →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
