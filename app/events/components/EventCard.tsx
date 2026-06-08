import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        {image ? (
          <Image src={image} alt={title} fill style={{ objectFit: "cover" }} />
        ) : (
          <div className="ec-thumb-placeholder" />
        )}
      </div>
      <div className="ec-body">
        <div className="ec-meta-top">
          <span className="ec-date-str">{date}</span>
          {time && <span className="ec-time">{time}</span>}
        </div>
        <h4 className="ec-title" dangerouslySetInnerHTML={{ __html: title }} />
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
