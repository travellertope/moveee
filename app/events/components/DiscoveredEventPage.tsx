import Link from "next/link";

interface Props {
  event: any;
}

export default function DiscoveredEventPage({ event }: Props) {
  const dateRaw = event.eventDate || event.date || new Date().toISOString();
  const dateObj = new Date(dateRaw);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "TBA";
  const dayName = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-GB", { weekday: "long" })
    : "";

  const endObj = event.endDate ? new Date(event.endDate) : null;
  const endFormatted =
    endObj && !isNaN(endObj.getTime())
      ? endObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null;

  const interests: { name: string; slug: string }[] = event.cultureInterests?.nodes ?? [];
  const excerpt = event.excerpt?.replace(/<[^>]*>/g, "").trim() || "";
  const city = event.city || "";

  return (
    <div className="disc-event-page">
      <div className="disc-event-inner">
        {/* Back + badge */}
        <div className="disc-event-eyebrow">
          <Link href="/events" className="disc-back">← Happenings</Link>
          <span className="disc-badge">Discovered Event{city ? ` · ${city}` : ""}</span>
        </div>

        {/* Title */}
        <h1
          className="disc-event-title"
          dangerouslySetInnerHTML={{ __html: event.title }}
        />

        {event.tagline && (
          <p className="disc-event-tagline">{event.tagline}</p>
        )}

        {/* Key details */}
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
              <span key={i.slug} className="disc-interest-pill">
                {i.name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {excerpt && (
          <p className="disc-event-excerpt">{excerpt}</p>
        )}

        {/* Primary CTA */}
        {event.ticketingUrl ? (
          <a
            href={event.ticketingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="disc-cta-btn"
          >
            View Full Event Details ↗
          </a>
        ) : (
          <div className="disc-cta-note">
            Visit the host&rsquo;s website for full details and tickets.
          </div>
        )}

        {/* Attribution */}
        {event.attribution && (
          <p className="disc-attribution">
            Source: {event.attribution}
          </p>
        )}

        <div className="disc-event-footer">
          <Link href="/events" className="disc-back-footer">← All Happenings</Link>
        </div>
      </div>
    </div>
  );
}
