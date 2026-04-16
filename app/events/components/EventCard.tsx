import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface EventCardProps {
  slug: string;
  title: string;
  date: string; // "19 April"
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
  const parts = date ? date.split(' ') : ["TBA", "Date"];
  const day = parts[0] || "TBA";
  const month = parts[1] || "Date";

  return (
    <Link href={`/events/${slug}`} className="event-card">
      <div className="ec-image">
        {status === 'upcoming' && <span className="ec-badge upcoming">● Upcoming</span>}
        {status === 'live' && <span className="ec-badge live">● Live</span>}
        {status === 'past' && <span className="ec-badge past">Past</span>}
        {status === 'members-only' && <span className="ec-badge members-badge">★ Members</span>}
        
        {image ? (
          <Image src={image} alt={title} fill />
        ) : (
          <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="250" fill="var(--ink)"/>
            <circle cx="200" cy="125" r="80" fill="var(--ochre)" opacity="0.1"/>
          </svg>
        )}
      </div>
      
      <div className="ec-body">
        <div className="ec-date">
          <span className="day">{day}</span>
          <span className="month">{month}</span>
        </div>
        
        <h4 className="ec-title" dangerouslySetInnerHTML={{ __html: title }} />
        
        <div className="ec-meta">
          {location}<br />
          {time} · {category}
        </div>
        
        <div className="ec-bottom">
          <div className="ec-tags">
            {tags.map((tag, idx) => (
              <span key={idx} className={`ec-tag ${tag.toLowerCase() === 'members' ? 'members' : ''}`}>
                {tag}
              </span>
            ))}
          </div>
          <span className="ec-cta">View →</span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
