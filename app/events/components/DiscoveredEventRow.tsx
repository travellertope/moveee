import Link from "next/link";

interface DiscoveredEventRowProps {
  slug: string;
  title: string;
  date: string;
  city: string;
  category: string;
  ticketingUrl?: string | null;
}

export default function DiscoveredEventRow({
  slug,
  title,
  date,
  city,
  category,
  ticketingUrl,
}: DiscoveredEventRowProps) {
  return (
    <div className="disc-row">
      <span className="disc-date-pill">{date}</span>
      <Link href={`/events/${slug}`} className="disc-title">
        <span dangerouslySetInnerHTML={{ __html: title }} />
      </Link>
      <span className="disc-meta">
        {city}
        {category ? ` · ${category}` : ""}
      </span>
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
