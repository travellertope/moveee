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
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(raw?: string) {
  if (!raw) return "TBA";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? "TBA"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DiscoveredEventPage({ event, relatedEvents = [] }: Props) {
  const dateFormatted = formatDate(event.eventDate || event.date);
  const dayName = (() => {
    const d = new Date(event.eventDate || event.date || "");
    return !isNaN(d.getTime())
      ? d.toLocaleDateString("en-GB", { weekday: "long" })
      : "";
  })();
  const endFormatted = event.endDate ? formatDate(event.endDate) : null;
  const interests: { name: string; slug: string }[] = event.cultureInterests?.nodes ?? [];
  const excerpt = event.excerpt?.replace(/<[^>]*>/g, "").trim() || "";
  const city = event.city || "";

  return (
    <div className="disc-event-page">
      {/* Top bar: back link */}
      <div className="disc-event-topbar">
        <div className="disc-event-eyebrow">
          <Link href="/events" className="disc-back">← Happenings</Link>
          <span className="disc-badge">Discovered Event{city ? ` · ${city}` : ""}</span>
          <span className="disc-ai-badge">Curated with AI</span>
        </div>
      </div>

      {/* Hero: title + tagline */}
      <div className="disc-event-hero">
        {(event.featuredImage?.node?.sourceUrl || event.eventImageUrl) && (
          <div className="disc-event-hero-img">
            <img
              src={event.featuredImage?.node?.sourceUrl || event.eventImageUrl}
              alt={event.title}
              style={{ width: "100%", maxHeight: "360px", objectFit: "cover", borderRadius: "8px", marginBottom: "24px" }}
            />
          </div>
        )}
        <h1 className="disc-event-title" dangerouslySetInnerHTML={{ __html: event.title }} />
        {event.tagline && (
          <p className="disc-event-tagline">{event.tagline}</p>
        )}
      </div>

      {/* Two-column body */}
      <div className="disc-event-body">
        {/* ── Main content ── */}
        <div className="disc-event-main">
          {/* Key details table */}
          <div className="disc-event-details">
            <div className="disc-detail-row">
              <span className="disc-detail-label">Date</span>
              <span className="disc-detail-value">
                {dayName && <>{dayName}, </>}{dateFormatted}
                {endFormatted && <> — {endFormatted}</>}
              </span>
            </div>
            {event.location && (
              <div className="disc-detail-row">
                <span className="disc-detail-label">Location</span>
                <span className="disc-detail-value">{event.location}</span>
              </div>
            )}
            {city && city !== event.location && (
              <div className="disc-detail-row">
                <span className="disc-detail-label">City</span>
                <span className="disc-detail-value">{city}</span>
              </div>
            )}
            {event.admission && (
              <div className="disc-detail-row">
                <span className="disc-detail-label">Admission</span>
                <span className="disc-detail-value">{event.admission}</span>
              </div>
            )}
          </div>

          {/* Interests */}
          {interests.length > 0 && (
            <div className="disc-interests">
              {interests.map((i) => (
                <span key={i.slug} className="disc-interest-pill">{i.name}</span>
              ))}
            </div>
          )}

          {/* Description */}
          {excerpt && (
            <p className="disc-event-excerpt">{excerpt}</p>
          )}

          {event.content && (
            <div 
              className="disc-event-content prose-custom" 
              dangerouslySetInnerHTML={{ __html: event.content }} 
              style={{ marginTop: "24px", color: "var(--ink-soft)", lineHeight: 1.6 }}
            />
          )}

          {/* CTA — prefer ticketing URL, fall back to source attribution */}
          {(event.ticketingUrl || event.attribution) ? (
            <a
              href={event.ticketingUrl || event.attribution}
              target="_blank"
              rel="noopener noreferrer"
              className="disc-cta-btn"
            >
              {event.ticketingUrl ? "Get Tickets ↗" : "View Full Event Details ↗"}
            </a>
          ) : (
            <div className="disc-cta-note">
              Visit the host&rsquo;s website for full details and tickets.
            </div>
          )}

          {event.attribution && (
            <p className="disc-attribution">
              Source:{" "}
              <a href={event.attribution} target="_blank" rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>
                {(() => { try { return new URL(event.attribution).hostname.replace(/^www\./, ""); } catch { return event.attribution; } })()}
              </a>
            </p>
          )}

          <div className="disc-event-footer">
            <Link href="/events" className="disc-back-footer">← All Happenings</Link>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="disc-event-sidebar">
          {/* Quick-info card */}
          <div className="disc-info-card">
            <div className="disc-info-card-label">📅 When</div>
            <div className="disc-info-card-value">
              {dayName && <>{dayName},<br/></>}{dateFormatted}
              {endFormatted && <><br/>Until {endFormatted}</>}
            </div>
          </div>

          {event.location && (
            <div className="disc-info-card">
              <div className="disc-info-card-label">📍 Where</div>
              <div className="disc-info-card-value">{event.location}</div>
              {city && <div className="disc-info-card-sub">{city}</div>}
            </div>
          )}

          {event.admission && (
            <div className="disc-info-card">
              <div className="disc-info-card-label">🎟 Admission</div>
              <div className="disc-info-card-value">{event.admission}</div>
            </div>
          )}

          {event.ticketingUrl && (
            <a
              href={event.ticketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="disc-cta-btn"
              style={{ display: "block", textAlign: "center", marginBottom: "24px" }}
            >
              Get Tickets ↗
            </a>
          )}

          {/* Related events */}
          {relatedEvents.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div className="disc-related-heading">More Happenings</div>
              {relatedEvents.map((e) => (
                <Link key={e.slug} href={`/events/${e.slug}`} className="disc-related-item">
                  <div className="disc-related-item-date">
                    {formatShortDate(e.eventDate || e.date)}
                  </div>
                  <div className="disc-related-item-title">{e.title}</div>
                  {(e.city || e.location) && (
                    <div className="disc-related-item-loc">{e.city || e.location}</div>
                  )}
                </Link>
              ))}
              <div style={{ paddingTop: "14px" }}>
                <Link
                  href="/events"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--ochre)",
                    textDecoration: "none",
                  }}
                >
                  All Happenings →
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
