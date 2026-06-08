import Link from "next/link";

interface RelatedEvent {
  slug: string;
  title: string;
  eventDate?: string;
  date?: string;
  city?: string;
  location?: string;
}

interface Props {
  event: any;
  relatedEvents?: RelatedEvent[];
}

function formatDate(raw?: string) {
  if (!raw) return "TBA";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? "TBA"
    : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(raw?: string) {
  if (!raw) return "TBA";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "TBA";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

function getDateParts(raw?: string) {
  if (!raw) return { day: "—", month: "" };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { day: "—", month: "" };
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
}

export default function DiscoveredEventPage({ event, relatedEvents = [] }: Props) {
  const dateFormatted = formatDate(event.eventDate || event.date);
  const endFormatted = event.endDate ? formatDate(event.endDate) : null;
  const { day, month } = getDateParts(event.eventDate || event.date);
  const interests: { name: string; slug: string }[] = event.cultureInterests?.nodes ?? [];
  const excerpt = event.excerpt?.replace(/<[^>]*>/g, "").trim() || "";
  const city = event.city || "";
  const img = event.featuredImage?.node?.sourceUrl || event.eventImageUrl;
  const catSlug = interests[0]?.slug || "default";
  const CAT_ICONS: Record<string, string> = {
    music: "♪", film: "◉", "visual-arts": "◈", fashion: "✦",
    food: "◆", literature: "▬", design: "◻", performance: "★",
    community: "◇", tech: "○",
  };
  const ctaUrl = event.ticketingUrl || event.attribution || null;

  return (
    <div className="luma-event-page">
      <div className="luma-event-inner">

        {/* ── LEFT: image + back ── */}
        <div className="luma-left">
          <div className="luma-poster">
            {img ? (
              <img src={img} alt={event.title} />
            ) : (
              <div className="luma-poster-placeholder" data-cat-ph={catSlug}>
                <div className="ev-cat-ph">
                  <span className="ev-cat-ph-icon">{CAT_ICONS[catSlug] || "★"}</span>
                  <span className="ev-cat-ph-name">{interests[0]?.name || "Happening"}</span>
                  <span style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{day}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>{month}</span>
                </div>
              </div>
            )}
          </div>

          {ctaUrl && (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="luma-cta-btn"
            >
              {event.ticketingUrl ? "Get Tickets ↗" : "View Full Event Details ↗"}
            </a>
          )}

          {event.attribution && (
            <p className="luma-attribution">
              Source:{" "}
              <a href={event.attribution} target="_blank" rel="noopener noreferrer">
                {(() => { try { return new URL(event.attribution).hostname.replace(/^www\./, ""); } catch { return event.attribution; } })()}
              </a>
            </p>
          )}
        </div>

        {/* ── RIGHT: event info ── */}
        <div className="luma-right">

          {/* city + category chips */}
          <div className="luma-chips">
            {city && (
              <Link href={`/events/${city.toLowerCase().replace(/\s+/g, "-")}`} className="luma-city-chip">
                ◉ {city}
              </Link>
            )}
            {interests.length > 0 && (
              <Link href={`/events/${interests[0].slug}`} className="luma-cat-chip">
                {interests[0].name}
              </Link>
            )}
          </div>

          {/* title */}
          <h1 className="luma-title" dangerouslySetInnerHTML={{ __html: event.title }} />

          {/* date row */}
          <div className="luma-meta-rows">
            <div className="luma-meta-row">
              <div className="luma-date-chip">
                <span className="luma-date-month">{month}</span>
                <span className="luma-date-day">{day}</span>
              </div>
              <div className="luma-meta-text">
                <div className="luma-meta-main">{dateFormatted}</div>
                {endFormatted && (
                  <div className="luma-meta-sub">Until {endFormatted}</div>
                )}
              </div>
            </div>

            {(event.location || city) && (
              <div className="luma-meta-row">
                <div className="luma-loc-icon">◍</div>
                <div className="luma-meta-text">
                  <div className="luma-meta-main">{event.location || city}</div>
                  {event.location && city && city !== event.location && (
                    <div className="luma-meta-sub">{city}</div>
                  )}
                </div>
              </div>
            )}

            {interests.length > 0 && (
              <div className="luma-meta-row">
                <div className="luma-loc-icon">◈</div>
                <div className="luma-meta-text">
                  <div className="luma-meta-main">{interests.map((i) => i.name).join(", ")}</div>
                </div>
              </div>
            )}

            {event.admission && (
              <div className="luma-meta-row">
                <div className="luma-loc-icon">◈</div>
                <div className="luma-meta-text">
                  <div className="luma-meta-main">{event.admission}</div>
                </div>
              </div>
            )}
          </div>

          {/* registration box */}
          {ctaUrl && (
            <div className="luma-register-box">
              <div className="luma-register-label">
                {event.ticketingUrl ? "Tickets" : "Registration"}
              </div>
              {event.tagline && (
                <p className="luma-register-note">{event.tagline}</p>
              )}
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="luma-register-btn"
              >
                {event.ticketingUrl ? "Get Tickets" : "View Event Details"}
              </a>
            </div>
          )}

          {/* about */}
          {(excerpt || event.content) && (
            <div className="luma-about">
              <div className="luma-section-label">About</div>
              {excerpt && <p className="luma-excerpt">{excerpt}</p>}
              {event.content && (
                <div
                  className="luma-content"
                  dangerouslySetInnerHTML={{ __html: event.content }}
                />
              )}
            </div>
          )}

          {/* more happenings */}
          {relatedEvents.length > 0 && (
            <div className="luma-related">
              <div className="luma-section-label">More Happenings</div>
              {relatedEvents.map((e) => (
                <Link key={e.slug} href={`/events/${e.slug}`} className="luma-related-row">
                  <span className="luma-related-date">{formatShortDate(e.eventDate || e.date)}</span>
                  <div className="luma-related-info">
                    <span className="luma-related-title">{e.title}</span>
                    {(e.city || e.location) && (
                      <span className="luma-related-loc">{e.city || e.location}</span>
                    )}
                  </div>
                </Link>
              ))}
              <Link href="/events" className="luma-all-link">All Happenings →</Link>
            </div>
          )}

          <div className="luma-footer-nav">
            <Link href="/events" className="luma-back-footer">← All Happenings</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
