import React from 'react';
import { sanitizeHtml } from "@/lib/sanitize";

interface EventHeroProps {
  title: string;
  standfirst?: string;
  stats?: {
    num: string | number;
    label: string;
  }[];
}

const EventHero: React.FC<EventHeroProps> = ({ title, standfirst, stats = [] }) => {
  return (
    <section className="evt-hero">
      <h1 className="evt-hero-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} />
      {standfirst && <p className="evt-hero-standfirst">{standfirst}</p>}
      {stats.length > 0 && (
        <div className="evt-hero-stats">
          {stats.map((s, i) => (
            <React.Fragment key={i}>
              <div className="evt-stat">
                <span className="evt-stat-num">{s.num}</span>
                <span className="evt-stat-label">{s.label}</span>
              </div>
              {i < stats.length - 1 && <div className="evt-stat-divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
};

export default EventHero;
