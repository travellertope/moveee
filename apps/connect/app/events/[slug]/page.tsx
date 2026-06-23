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
import { sanitizeHtml } from "@/lib/sanitize";

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
  "travel":              { name: "Travel",              icon: "→", desc: "Exploration, discovery & journeys" },
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
      description: `${c.desc} — curated for our global community.`,
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
    <div className="bg-paper">

      {/* ── DETAIL HERO ── */}
      <section className="evt-detail-hero">
        <div className="evt-detail-img-col">
          <div className="evt-detail-img">
            {citySlug && (
              <Link href={`/events/${citySlug}`} className="evt-detail-featured-pill">
                ↗ Featured in {event.city}
              </Link>
            )}
            {img ? (
              <Image src={img} alt={event.title} fill priority style={{ objectFit: "cover" }} />
            ) : (
              <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                <rect width="400" height="500" fill="var(--evt-ink)" />
                <circle cx="200" cy="250" r="100" fill="var(--evt-ochre)" opacity="0.1" />
              </svg>
            )}
          </div>
        </div>

        <div className="evt-detail-info-col">
          <Link href="/events" className="evt-detail-back">← Happenings</Link>

          <div className="evt-detail-badges">
            <span className="evt-detail-cat-pill">{cat}</span>
            <span className="evt-detail-status">
              <span className="evt-status-dot" />
              {eventStatus}
            </span>
          </div>

          <h1 className="evt-detail-title">{event.title}</h1>
          {event.tagline && <p className="evt-detail-tagline">{event.tagline}</p>}

          {/* Date row */}
          <div className="evt-meta-row">
            <div className="evt-meta-icon-box">
              <span className="evt-meta-icon-month">{monthShort}</span>
              <span className="evt-meta-icon-day">{dayNum}</span>
            </div>
            <div>
              <p className="evt-meta-text-main">{weekday}, {dateFormatted}{endFormatted ? ` — ${endFormatted}` : ""}</p>
              <p className="evt-meta-text-sub">{event.openingHours || "Time TBA"}</p>
            </div>
          </div>

          {/* Venue row */}
          <div className="evt-meta-row">
            <div className="evt-meta-icon-box">
              <span style={{ fontSize: "18px" }}>📍</span>
            </div>
            <div>
              <p className="evt-meta-text-main">{event.location || "Venue TBA"}</p>
              {venueAddress && <p className="evt-meta-text-sub">{venueAddress}</p>}
            </div>
          </div>

          {/* Registration box */}
          <div className="evt-register-box">
            <div>
              <div className="evt-register-label">Event Details</div>
              {event.ticketingUrl ? (
                <p className="evt-register-note">{event.admission || "Paid Entry"} · {event.location}</p>
              ) : (
                <p className="evt-register-note">Secure your place below.</p>
              )}
            </div>
            {event.ticketingUrl ? (
              <a href={event.ticketingUrl} target="_blank" rel="noopener noreferrer" className="evt-register-btn">
                Find Out More →
              </a>
            ) : (
              <a href="#rsvp-section" className="evt-register-btn">RSVP Now →</a>
            )}
          </div>
        </div>
      </section>

      {/* ── DETAIL TICKER ── */}
      <div className="evt-detail-ticker">
        <div className="evt-ticker-container">
          {["a", "b"].map((variant) => (
            <div key={variant} className={`evt-ticker-track${variant === "b" ? " evt-ticker-track--b" : ""}`} aria-hidden={variant === "b"}>
              <span className="evt-ticker-item evt-ticker-item--bold">{event.title}</span>
              <span className="evt-ticker-item evt-ticker-item--gold">★</span>
              {host?.title && <span className="evt-ticker-item">{host.title}</span>}
              {host?.title && <span className="evt-ticker-item evt-ticker-item--gold">★</span>}
              {event.location && <span className="evt-ticker-item">{event.location}</span>}
              {event.location && <span className="evt-ticker-item evt-ticker-item--gold">★</span>}
              <span className="evt-ticker-item evt-ticker-item--bold">{dateFormatted}</span>
              <span className="evt-ticker-item evt-ticker-item--gold">★</span>
              {hasShowcase ? <span className="evt-ticker-item">{event.showcase.length} Works</span> : <span className="evt-ticker-item">Culture Archive</span>}
              <span className="evt-ticker-item evt-ticker-item--gold">★</span>
              {event.rsvpCapacity ? <span className="evt-ticker-item">Limited Capacity — {event.rsvpCapacity} Spots</span> : null}
              {event.rsvpCapacity && <span className="evt-ticker-item evt-ticker-item--gold">★</span>}
              {membersNote && <span className="evt-ticker-item evt-ticker-item--gold">Members: early access</span>}
              {membersNote && <span className="evt-ticker-item evt-ticker-item--gold">★</span>}
              <span className="evt-ticker-item">{event.admission || "Free Admission"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <main className="evt-body">
        {/* LEFT COLUMN */}
        <div className="evt-body-left">
          <div className="evt-section-label">{aboutLabel}</div>
          <div className="evt-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.content || "<p>Event details coming soon.</p>") }} />

          {event.tagline && (
            <div className="evt-pull-quote">
              <blockquote>"{event.tagline}"</blockquote>
              {(host?.title || event.attribution) && <cite>— {host?.title || event.attribution}</cite>}
            </div>
          )}

          {hasShowcase && (
            <div className="evt-works-section">
              <div className="evt-section-label" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                {showcaseLabel ? <span>{showcaseLabel}</span> : <span>Selected <em>works</em></span>}
                <small style={{ fontWeight: 400, textTransform: "none" }}>Preview · {event.showcase.length} items</small>
              </div>
              <div className="evt-works-grid">
                {event.showcase.map((item: any, i: number) => (
                  <div key={i} className="evt-work-card">
                    <div className="evt-work-frame">
                      {item.imageUrl && <Image src={item.imageUrl} alt={item.title} fill style={{ objectFit: "cover" }} />}
                    </div>
                    <span className="evt-work-num">N°0{i + 1}</span>
                    <div className="evt-work-title">{item.title}</div>
                    <div className="evt-work-meta">{item.media} · {item.dimensions} · {item.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasSchedule && (
            <div className="evt-programme" id="programme-section">
              <div className="evt-section-label">Programme</div>
              {event.schedule.map((item: any, i: number) => (
                <div key={i} className="evt-prog-row">
                  <div className="evt-prog-time">{item.time}</div>
                  <div className="evt-prog-body">
                    <div className="evt-prog-title-row">
                      <span className="evt-prog-title">{item.title}</span>
                      <span className={`evt-prog-tag ${item.access === "members_only" ? "evt-prog-tag--members" : "evt-prog-tag--open"}`}>
                        {item.access?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="evt-prog-desc">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="evt-body-sidebar">
          <div className="evt-sidebar-card" id="rsvp-section">
            {event.ticketingUrl ? (
              <>
                <h3 className="evt-rsvp-heading">More <em>details</em></h3>
                <p className="evt-meta-text-sub" style={{ marginBottom: "20px" }}>{event.location} · {event.admission || "Paid Entry"}</p>
                <a href={event.ticketingUrl} target="_blank" rel="noopener noreferrer" className="evt-submit-btn" style={{ display: "flex", textDecoration: "none" }}>
                  Find Out More →
                </a>
                <p className="evt-rsvp-members-note">Opens external partner site</p>
              </>
            ) : (
              <RSVPForm
                eventSlug={event.slug} eventTitle={event.title}
                capacity={event.rsvpCapacity ?? undefined}
                spotsRemaining={event.spotsRemaining ?? undefined}
                ticketTypes={rsvpTicketTypes} membersNote={membersNote || undefined}
              />
            )}
          </div>

          {event.organiserName && (
            <div className="evt-sidebar-card evt-sidebar-card--organiser">
              <span className="evt-sidebar-eyebrow" style={{ color: "#3c3489" }}>Organised by</span>
              {event.organiserSlug ? (
                <Link href={`/directory/${event.organiserSlug}`} className="evt-organiser-row" style={{ justifyContent: "space-between", textDecoration: "none" }}>
                  <span className="evt-organiser-name">{event.organiserName}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--evt-mute)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9L9 3M4 3h5v5"/></svg>
                </Link>
              ) : (
                <p className="evt-organiser-name">{event.organiserName}</p>
              )}
            </div>
          )}

          {event.associatedJourney && (
            <div className="evt-sidebar-card evt-sidebar-card--dark">
              <span className="evt-sidebar-eyebrow">★ {event.associatedJourney.title}</span>
              <h4>Join the exclusive journey</h4>
              <Link href={`/origins/${event.associatedJourney.slug}`} className="evt-outline-pill">
                View Journey →
              </Link>
            </div>
          )}

          <div className="evt-sidebar-card evt-sidebar-card--press">
            <span className="evt-sidebar-eyebrow">{event.pressDetails?.eyebrow || "Press & Media"}</span>
            <h4>{event.pressDetails?.title || "Press enquiries"}</h4>
            <p>
              {event.pressDetails?.content
                ? event.pressDetails.content.replace(/<[^>]*>/g, "")
                : "For accreditation, image requests, and interview coordination, contact Moveee PR."}
            </p>
            {event.pressDetails?.link && (
              <a href={event.pressDetails.link}>{event.pressDetails.link.replace(/^mailto:/, "")} →</a>
            )}
          </div>
        </aside>
      </main>

      {/* ARTIST STRIP */}
      {hasHost && (
        <section className="evt-artist-strip">
          <div className="evt-artist-card">
            <div className="evt-artist-avatar" style={{ position: "relative", overflow: "hidden" }}>
              {host.featuredImage?.node?.sourceUrl && (
                <Image src={host.featuredImage.node.sourceUrl} alt={host.title} fill style={{ objectFit: "cover" }} />
              )}
            </div>
            <div>
              <span className="evt-artist-eyebrow">{artistSectionLabel}</span>
              <h3 className="evt-artist-name">{host.title?.split(" ")[0] || "Featured"} <em>{host.title?.split(" ").slice(1).join(" ") || "Artist"}</em></h3>
              <p className="evt-artist-excerpt" dangerouslySetInnerHTML={{ __html: sanitizeHtml(host.excerpt) }} />
              <Link href={`/directory/${host.slug}`} className="evt-artist-link">
                {artistLinkLabel} →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
