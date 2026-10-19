import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeHtml } from "@/lib/sanitize";
import { getCategoryImage, getCategoryGradient } from "../utils/categoryImages";

interface EventCardProps {
  slug: string;
  title: string;
  date: string;
  location: string;
  time: string;
  category: string;
  image?: string;
  status?: 'upcoming' | 'live' | 'past' | 'members-only';
  tags?: string[];
}

const EventCard: React.FC<EventCardProps> = ({
  slug,
  title,
  date,
  location,
  time,
  category,
  image,
  status = 'upcoming',
  tags = []
}) => {
  return (
    <Link href={`/events/${slug}`} className="event-card">
      <div className="ec-thumb">
        <Image
          src={image || getCategoryImage(category)}
          alt={title}
          fill
          style={{ objectFit: "cover" }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            const ph = el.parentElement?.querySelector<HTMLElement>(".ec-thumb-placeholder");
            if (ph) ph.style.display = "block";
          }}
        />
        <div
          className="ec-thumb-placeholder"
          style={{ background: getCategoryGradient(category), display: "none" }}
        />
      </div>
      <div className="ec-body">
        <div className="ec-meta-top">
          <span className="ec-date-str">{date}</span>
          {time && <span className="ec-time">{time}</span>}
        </div>
        <h4 className="ec-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} />
        <div className="ec-meta-bottom">
          {location && <span className="ec-location">{location}</span>}
          {category && <span className="ec-category">{category}</span>}
        </div>
      </div>
      <div className="ec-arrow">→</div>
    </Link>
  );
};

export default EventCard;
