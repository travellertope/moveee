'use client';

import { useState } from 'react';

const ALL_BADGES = [
  { slug: 'first_steps', name: 'First Steps', desc: 'Attended your first event' },
  { slug: 'regular', name: 'Regular', desc: 'Attended 5 events' },
  { slug: 'culture_vulture', name: 'Culture Vulture', desc: 'Attended 25 events' },
  { slug: 'explorer', name: 'Explorer', desc: 'Events in 3 different cities' },
  { slug: 'globetrotter', name: 'Globetrotter', desc: 'Events in 10 different cities' },
  { slug: 'commentator', name: 'Commentator', desc: '10 newsletter comments' },
  { slug: 'century_club', name: 'Century Club', desc: 'Earned 100 points' },
  { slug: 'wordsmith', name: 'Wordsmith', desc: 'Shared your first quote' },
  { slug: 'librarian', name: 'Librarian', desc: 'Shared 10 quotes' },
  { slug: 'philosopher', name: 'Philosopher', desc: 'Shared 50 quotes' },
  { slug: 'influencer', name: 'Influencer', desc: 'Received 10 quote likes' },
  { slug: 'thought_leader', name: 'Thought Leader', desc: 'Received 100 quote likes' },
  { slug: 'culture_archivist', name: 'Culture Archivist', desc: 'Submitted your first directory entry' },
  { slug: 'knowledge_keeper', name: 'Knowledge Keeper', desc: 'Submitted 5 directory entries' },
  { slug: 'cultural_encyclopaedist', name: 'Cultural Encyclopaedist', desc: 'Submitted 20 directory entries' },
  { slug: 'cultural_specialist', name: 'Cultural Specialist', desc: 'Left 10 comments on articles' },
  { slug: 'deep_diver', name: 'Deep Diver', desc: 'Read 10 magazine articles' },
  { slug: 'culture_liaison', name: 'Culture Liaison', desc: 'Shared 10 magazine articles' },
];

interface Props {
  initialBadges: string[];
}

/** Renders the achievements grid; fetches live badge data on mount. */
export default function MemberBadges({ initialBadges }: Props) {
  const [earnedBadges, setEarnedBadges] = useState<string[]>(initialBadges);
  const [showAll, setShowAll] = useState(false);

  const earnedCount = earnedBadges.length;

  const sortedBadges = [...ALL_BADGES].sort((a, b) => {
    const aEarned = earnedBadges.includes(a.slug) ? 0 : 1;
    const bEarned = earnedBadges.includes(b.slug) ? 0 : 1;
    return aEarned - bEarned;
  });

  const visibleBadges = showAll ? sortedBadges : sortedBadges.slice(0, 6);

  return (
    <section className="acct-card">
      <div className="acct-card-header">
        <span className="acct-card-title">Achievements</span>
        <span className="acct-card-count">{earnedCount} of {ALL_BADGES.length} earned</span>
      </div>
      <div className="acct-badges">
        {visibleBadges.map((badge) => {
          const earned = earnedBadges.includes(badge.slug);
          return (
            <div
              key={badge.slug}
              className={`acct-badge ${earned ? 'acct-badge--earned' : 'acct-badge--locked'}`}
            >
              <div className="acct-badge-icon">{earned ? '★' : '○'}</div>
              <div className="acct-badge-text">
                <div className="acct-badge-name">{badge.name}</div>
                <div className="acct-badge-desc">{badge.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      {sortedBadges.length > 6 && (
        <button type="button" className="acct-card-more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${ALL_BADGES.length}`}
        </button>
      )}
    </section>
  );
}
