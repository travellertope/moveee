import { getEventBySlugWithFallback, getEventsWithFallback } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import RSVPForm from "../components/RSVPForm";
import DiscoveredEventPage from "../components/DiscoveredEventPage";
import CityArchive from "./city-archive";
import CategoryArchive from "./category-archive";
import "@/app/events.css";

export const revalidate = 300;
export const dynamicParams = true;

// ── Archive slug lookup tables ────────────────────────────────────────────────

const CITY_SLUGS: Record<string, { name: string; country: string }> = {
  "lagos":    { name: "Lagos",    country: "Nigeria" },
  "london":   { name: "London",   country: "UK" },
  "accra":    { name: "Accra",    country: "Ghana" },
  "nairobi":  { name: "Nairobi",  country: "Kenya" },
  "new-york": { name: "New York", country: "USA" },
  "paris":    { name: "Paris",    country: "France" },
};

const CATEGORY_SLUGS: Record<string, { name: string; icon: string; desc: string }> = {
  // Short legacy slugs (used in some existing posts + form fallback)
  "music":       { name: "Music",       icon: "♪", desc: "Concerts, listening sessions & releases" },
  "film":        { name: "Film",        icon: "◉", desc: "Screenings, premieres & cinema" },
  "visual-arts": { name: "Visual Arts", icon: "◈", desc: "Exhibitions, galleries & installations" },
  "fashion":     { name: "Fashion",     icon: "✦", desc: "Shows, presentations & pop-ups" },
  "food":        { name: "Food",        icon: "◆", desc: "Supper clubs, markets & tastings" },
  "literature":  { name: "Literature",  icon: "▬", desc: "Book launches, readings & discussions" },
  "design":      { name: "Design",      icon: "◻", desc: "Architecture, craft & creative direction" },
  "performance": { name: "Performance", icon: "★", desc: "Theatre, dance & live arts" },
  "community":   { name: "Community",   icon: "◇", desc: "Gatherings, panels & cultural events" },
  "tech":        { name: "Tech",        icon: "○", desc: "Innovation, startups & digital culture" },
  // Canonical culture_interest taxonomy slugs
  "live-music":          { name: "Live Music",          icon: "♪", desc: "Concerts, gigs & live sessions" },
  "music-production":    { name: "Music Production",    icon: "♪", desc: "Studio, beatmaking & sound" },
  "independent-film":    { name: "Independent Film",    icon: "◉", desc: "Screenings, premieres & cinema" },
  "visual-art":          { name: "Visual Art",          icon: "◈", desc: "Exhibitions, galleries & installations" },
  "architecture":        { name: "Architecture",        icon: "◈", desc: "Built environment & spatial design" },
  "photography":         { name: "Photography",         icon: "◈", desc: "Shows, zines & photography" },
  "fashion-streetwear":  { name: "Fashion",             icon: "✦", desc: "Shows, presentations & pop-ups" },
  "food-drink":          { name: "Food & Drink",        icon: "◆", desc: "Supper clubs, markets & tastings" },
  "street-food":         { name: "Street Food",         icon: "◆", desc: "Street food & market events" },
  "nightlife":           { name: "Nightlife",           icon: "★", desc: "Clubs, bars & after-dark events" },
  "visual-design":       { name: "Design",              icon: "◻", desc: "Craft, visual & creative direction" },
  "tech-culture":        { name: "Tech & Culture",      icon: "○", desc: "Innovation, startups & digital culture" },
  "sport-wellness":      { name: "Sport & Wellness",    icon: "●", desc: "Fitness, sports & wellness" },
  "travel":              { name: "Travel",              icon: "→", desc: "Exploration, diaspora & journeys" },
  "ideas":               { name: "Ideas & Culture",     icon: "◇", desc: "Panels, talks & cultural theory" },
  "event-performance":   { name: "Performance",         icon: "★", desc: "Theatre, dance & live arts" },
  "event-community":     { name: "Community",           icon: "◇", desc: "Gatherings, panels & community events" },
};

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  if (CITY_SLUGS[slug]) {
    const c = CITY_SLUGS[slug];
    return {
      title: { absolute: `Happenings in ${c.name} | The Moveee` },
      description: `Upcoming cultural events in ${c.name}, ${c.country} — music, art, film, food and community happenings.`,
    };
  }
  if (CATEGORY_SLUGS[slug]) {
    const c = CATEGORY_SLUGS[slug];
    return {
      title: { absolute: `${c.name} Events | Moveee Happenings` },
      description: `${c.desc} — curated for the African and diaspora community.`,
    };
  }

  let event: any = null;
  try { event = await getEventBySlugWithFallback(slug, { revalidate: 300 }); } catch { /* CMS unreachable */ }
  if (!event) return { title: { absolute: "Event Not Found | The Moveee" }, description: "This event could not be found." };

  const dateRaw = event.eventDate || event.date || new Date().toISOString();
  const dateObj = new Date(dateRaw);
  const dateFormatted = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "TBA";
  const location = event.location || "Venue TBA";
  const excerpt = event.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || event.tagline || "A curated cultural event from The Moveee";

  return {
    title: { absolute: `${event.title} · ${dateFormatted} · ${location} | Moveee Happenings` },
    description: excerpt,
    openGraph: {
      title: event.title, description: excerpt,
      url: `https://themoveee.com/events/${slug}`, type: "website",
      images: (event.featuredImage?.node?.sourceUrl || event.eventImageUrl) ? [{ url: event.featuredImage?.node?.sourceUrl || event.eventImageUrl as string, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image", title: event.title, description: excerpt,
      images: (event.featuredImage?.node?.sourceUrl || event.eventImageUrl) ? [event.featuredImage?.node?.sourceUrl || event.eventImageUrl as string] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // City archive
  if (CITY_SLUGS[slug]) return <CityArchive slug={slug} cityInfo={CITY_SLUGS[slug]} />;

  // Category archive
  if (CATEGORY_SLUGS[slug]) return <CategoryArchive slug={slug} categoryInfo={CATEGORY_SLUGS[slug]} />;

  // Individual event
  let event: any = null;
  try { event = await getEventBySlugWithFallback(slug, { revalidate: 300 }); } catch { /* CMS unreachable */ }
  if (!event) notFound();

  if (event.isAiGenerated) {
    let relatedEvents: any[] = [];
    try {
      const pool = await getEventsWithFallback(50, { revalidate: 3600 });
      const aiPool = pool.filter((e: any) => e.isAiGenerated && e.slug !== event.slug);
      const sameCity = event.city ? aiPool.filter((e: any) => e.city && e.city.toLowerCase() === event.city.toLowerCase()) : [];
      const others = aiPool.filter((e: any) => !sameCity.some((s: any) => s.slug === e.slug));
      relatedEvents = [...sameCity, ...others].slice(0, 4);
    } catch { /* non-fatal */ }
    return <DiscoveredEventPage event={event} relatedEvents={relatedEvents} />;
  }

  const img          = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
  const cat          = event.cultureInterests?.nodes?.[0]?.name || "Happening";
  const dateRaw      = event.eventDate || event.date || new Date().toISOString();
  const dateObj      = new Date(dateRaw);
  const dateValid    = !isNaN(dateObj.getTime()) ? dateObj : new Date();
  const dateFormatted = dateValid.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const weekday      = dateValid.toLocaleDateString("en-GB", { weekday: "long" });
  const dayNum       = dateValid.toLocaleDateString("en-GB", { day: "numeric" });
  const monthShort   = dateValid.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();

  const endObj = event.endDate ? new Date(event.endDate) : null;
  const endFormatted = (endObj && !isNaN(endObj.getTime())) ? endObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  const now = new Date();
  const eventStatus = dateValid > now ? "Upcoming" : (endObj && endObj > now ? "Current" : "Past");

  const venueAddress = event.venueAddress || "";
  const membersNote  = event.rsvpMembersNote || "";
  const rsvpTicketTypes = event.rsvpTicketTypes?.length
    ? event.rsvpTicketTypes.map((t: any) => ({
        ticketName: t.ticketName, ticketSlug: t.ticketSlug, ticketInfo: t.ticketInfo,
        ticketPrice: t.ticketPrice || null, ticketAmount: t.ticketAmount ?? 0, ticketCurrency: t.ticketCurrency ?? "NGN",
      }))
    : undefined;

  const hasMetrics  = event.metrics?.length > 0;
  const hasSchedule = Array.isArray(event.schedule) && event.schedule.length > 0;
  const hasShowcase = Array.isArray(event.showcase) && event.showcase.length > 0;
  const hasHost     = event.featuredHost && typeof event.featuredHost === "object" && event.featuredHost?.title;
  const host        = hasHost ? event.featuredHost : null;
  const showcaseLabel       = event.showcaseLabel || null;
  const artistSectionLabel  = event.artistSectionLabel || "The artist";
  const artistLinkLabel     = event.artistLinkLabel || "Read the full portrait";
  const aboutLabel          = event.aboutLabel || "About the event";

  // City slug for breadcrumb
  const citySlug = event.city
    ? Object.entries(CITY_SLUGS).find(([, v]) => v.name.toLowerCase() === event.city?.toLowerCase())?.[0]
    : null;

  return (
    <div className="events-page-wrapper">

      {/* ── COMPACT HERO — image LEFT, info RIGHT (Luma-inspired) ── */}
      <section className="event-hero-luma">

        {/* Left: portrait image */}
        <div className="ehl-image-col">
          {citySlug && (
            <Link href={`/events/${citySlug}`} className="ehl-location-chip">
              ↗ Featured in {event.city}
            </Link>
          )}
          {img ? (
            <Image src={img} alt={event.title} fill priority className="ehl-img" style={{ objectFit: "cover" }} />
          ) : (
            <div className="ehl-img-placeholder">
              <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="500" fill="var(--ink)" />
                <circle cx="200" cy="250" r="100" fill="var(--ochre)" opacity="0.1" />
              </svg>
            </div>
          )}
        </div>

        {/* Right: info + RSVP */}
        <div className="ehl-info-col">
          <Link href="/events" className="ehl-back">← Happenings</Link>

          <div className="ehl-cat-pill">{cat} · <span className={`ehl-status ${eventStatus.toLowerCase()}`}>● {eventStatus}</span></div>

          <h1 className="ehl-title">{event.title}</h1>
          {event.tagline && <p className="ehl-tagline">{event.tagline}</p>}

          {/* Date chip */}
          <div className="ehl-date-chip">
            <div className="ehl-date-icon">
              <span className="ehl-date-month">{monthShort}</span>
              <span className="ehl-date-day">{dayNum}</span>
            </div>
            <div>
              <p className="ehl-date-weekday">{weekday}, {dateFormatted}{endFormatted ? ` — ${endFormatted}` : ""}</p>
              <p className="ehl-date-time">{event.openingHours || "Time TBA"}</p>
            </div>
          </div>

          {/* Venue chip */}
          <div className="ehl-venue-chip">
            <span className="ehl-venue-pin">📍</span>
            <div>
              <p className="ehl-venue-name">{event.location || "Venue TBA"}</p>
              {venueAddress && <p className="ehl-venue-addr">{venueAddress}</p>}
            </div>
          </div>

          {/* Registration box */}
          <div className="ehl-register-box">
            <div className="ehl-register-label">Event Details</div>
            {event.ticketingUrl ? (
              <>
                <p className="ehl-register-note">{event.admission || "Paid Entry"} · {event.location}</p>
                <a href={event.ticketingUrl} target="_blank" rel="noopener noreferrer" className="ehl-register-btn">
                  Find Out More →
                </a>
              </>
            ) : (
              <>
                <p className="ehl-register-note">Secure your place below.</p>
                <a href="#rsvp-section" className="ehl-register-btn">RSVP Now →</a>
              </>
            )}
          </div>
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

          {event.tagline && (
            <div className="pull-quote">
              <div className="bar" />
              <div>
                <blockquote>"{event.tagline}"</blockquote>
                {(host?.title || event.attribution) && <cite>— {host?.title || event.attribution}</cite>}
              </div>
            </div>
          )}

          {hasShowcase && (
            <div className="works-section">
              <div className="works-header">
                {showcaseLabel ? <h3>{showcaseLabel}</h3> : <h3>Selected <em>works</em></h3>}
                <small>Preview · {event.showcase.length} items</small>
              </div>
              <div className="works-grid">
                {event.showcase.map((item: any, i: number) => (
                  <div key={i} className="work-card">
                    <div className="work-frame">
                      {item.imageUrl && <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />}
                    </div>
                    <div className="work-num">N°0{i + 1}</div>
                    <div className="work-title">{item.title}</div>
                    <div className="work-meta">{item.media} · {item.dimensions} · {item.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasSchedule && (
            <div className="programme" id="programme-section">
              <div className="section-label">Programme</div>
              {event.schedule.map((item: any, i: number) => (
                <div key={i} className="programme-row">
                  <div className="prog-time">{item.time}</div>
                  <div>
                    <div className="prog-event-title">{item.title}</div>
                    <div className="prog-event-desc">{item.description}</div>
                    <span className={`prog-tag ${item.access === "members_only" ? "members" : "open"}`}>
                      {item.access?.replace("_", " ")}
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
                <h3>More <em>details</em></h3>
                <div className="event-date">{event.location} · {event.admission || "Paid Entry"}</div>
                <a href={event.ticketingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: "24px" }}>
                  Find Out More →
                </a>
                <p className="rsvp-small">Opens external partner site</p>
              </>
            ) : (
              <>
                <h3>Secure your <em>place</em></h3>
                <div className="event-date">{event.location} · {event.openingHours || "See details"}</div>
                <RSVPForm
                  eventSlug={event.slug} eventTitle={event.title}
                  capacity={event.rsvpCapacity ?? undefined}
                  spotsRemaining={event.spotsRemaining ?? undefined}
                  ticketTypes={rsvpTicketTypes} membersNote={membersNote || undefined}
                />
              </>
            )}
          </div>


          {event.organiserName && (
            <div className="info-card" style={{ borderLeft: "3px solid #3c3489" }}>
              <span className="label" style={{ color: "#3c3489" }}>Organised by</span>
              {event.organiserSlug ? (
                <Link href={`/directory/${event.organiserSlug}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#14110d", textDecoration: "none" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{event.organiserName}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#7a6f5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9L9 3M4 3h5v5"/></svg>
                </Link>
              ) : (
                <p style={{ fontWeight: 700, margin: 0 }}>{event.organiserName}</p>
              )}
            </div>
          )}

          {event.associatedJourney && (
            <div className="info-card" style={{ background: "var(--ink)", color: "var(--paper)" }}>
              <span className="label" style={{ color: "var(--ochre)" }}>★ {event.associatedJourney.title}</span>
              <p style={{ color: "rgba(243,236,224,0.85)" }}>Join the exclusive journey</p>
              <Link href={`/origins/${event.associatedJourney.slug}`} style={{ color: "var(--paper)", borderColor: "var(--paper)" }}>
                View Journey →
              </Link>
            </div>
          )}

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

      {/* ARTIST STRIP */}
      {hasHost && (
        <section className="artist-strip">
          <div className="artist-avatar">
            {host.featuredImage?.node?.sourceUrl && (
              <Image src={host.featuredImage.node.sourceUrl} alt={host.title} fill className="object-cover" />
            )}
          </div>
          <div className="artist-info">
            <div className="section-label">{artistSectionLabel}</div>
            <h3>{host.title?.split(" ")[0] || "Featured"} <em>{host.title?.split(" ").slice(1).join(" ") || "Artist"}</em></h3>
            <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "18px", color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: "20px" }}
              dangerouslySetInnerHTML={{ __html: host.excerpt }} />
            <Link href={`/directory/${host.slug}`}
              style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", borderBottom: "1px solid var(--ink)", paddingBottom: "2px", textDecoration: "none", color: "var(--ink)" }}>
              {artistLinkLabel} →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

