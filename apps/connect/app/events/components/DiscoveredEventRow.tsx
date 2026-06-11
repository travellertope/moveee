import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";

interface DiscoveredEventRowProps {
  slug: string;
  title: string;
  date: string;
  city: string;
  location: string;
  category: string;
  ticketingUrl?: string | null;
}

export default function DiscoveredEventRow({
  slug,
  title,
  date,
  city,
  location,
  category,
  ticketingUrl,
}: DiscoveredEventRowProps) {
  const displayLocation = city || location;

  return (
    <div className="disc-row">
      <span className="disc-date-pill">{date}</span>
      {displayLocation && (
        <span className="disc-location-pill" title={location || city}>
          {displayLocation}
        </span>
      )}
      <Link href={`/events/${slug}`} className="disc-title">
        <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} />
      </Link>
      <span className="disc-meta">
        {category}
      </span>
      <span className="disc-ai-badge" style={{ marginLeft: "auto", marginRight: "12px" }}>AI</span>
      {ticketingUrl ? (
        <a
          href={ticketingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="disc-ext-cta"
        >
          View ↗
        </a>
      ) : (
        <Link href={`/events/${slug}`} className="disc-ext-cta">
          Details →
        </Link>
      )}
    </div>
  );
}
