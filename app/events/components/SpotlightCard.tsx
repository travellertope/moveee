import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SpotlightCardProps {
  slug: string;
  title: string;
  subtitle?: string;
  date: string; // "19 April 2026"
  dayName: string; // "Saturday"
  venue: string;
  time: string;
  admission: string;
  image?: string;
  statusBadge?: string; // e.g. "Upcoming"
  counterText?: string; // e.g. "6 of 23 works previewed"
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  slug,
  title,
  subtitle,
  date,
  dayName,
  venue,
  time,
  admission,
  image,
  statusBadge = "Upcoming",
  counterText
}) => {
  const parts = date ? date.split(' ') : ["TBA", "Date", ""];
  const day = parts[0] || "TBA";
  const monthYear = parts.slice(1).join(' ') || "Date";

  return (
    <div className="spotlight">
      <div className="spotlight-label">Featured Event · This Month</div>
      
      <Link href={`/events/${slug}`} className="spotlight-card">
        <div className="spot-image">
          <span className="spot-badge upcoming">● {statusBadge}</span>
          {counterText && <span className="spot-counter">{counterText}</span>}
          
          {image ? (
            <Image src={image} alt={title} fill priority />
          ) : (
            <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <rect width="800" height="500" fill="var(--ink)"/>
              <rect width="800" height="500" fill="var(--ochre)" opacity="0.05"/>
            </svg>
          )}
        </div>

        <div className="spot-info">
          <div className="spot-date">
            <span className="day">{day}</span>
            <span className="month-year">{monthYear}<br />{dayName}</span>
          </div>
          
          <h3 className="spot-title" dangerouslySetInnerHTML={{ __html: title }} />
          {subtitle && <p className="spot-sub">{subtitle}</p>}
          
          <div className="spot-meta">
            <div className="spot-meta-item">
              <div className="label">Venue</div>
              <div className="value">{venue}</div>
            </div>
            <div className="spot-meta-item">
              <div className="label">Time</div>
              <div className="value">{time}</div>
            </div>
            <div className="spot-meta-item">
              <div className="label">Admission</div>
              <div className="value">{admission}</div>
            </div>
          </div>
          
          <div className="spot-cta">
            <span className="btn-primary">RSVP Now →</span>
            <span className="btn-ghost" style={{ border: '1px solid var(--ink)', padding: '15px 24px' }}>View Details</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default SpotlightCard;
