'use client';

import { useState, useEffect } from 'react';

const ALL_BADGES = [
  { slug: 'first_steps', name: 'First Steps', desc: 'Attended your first event' },
  { slug: 'regular', name: 'Regular', desc: 'Attended 5 events' },
  { slug: 'culture_vulture', name: 'Culture Vulture', desc: 'Attended 25 events' },
  { slug: 'explorer', name: 'Explorer', desc: 'Events in 3 chapters' },
  { slug: 'globetrotter', name: 'Globetrotter', desc: 'Events in 10 chapters' },
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
  initialPoints: number;
  initialBadges: string[];
  referralCount: number;
  membership: string;
}

export default function MemberDashboard({
  initialPoints,
  initialBadges,
  referralCount,
  membership,
}: Props) {
  const [points, setPoints] = useState(initialPoints);
  const [earnedBadges, setEarnedBadges] = useState<string[]>(initialBadges);

  useEffect(() => {
    fetch('/api/user/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.points === 'number') setPoints(data.points);
        if (Array.isArray(data.badges)) setEarnedBadges(data.badges);
      })
      .catch(() => {});
  }, []);

  const earnedCount = earnedBadges.length;

  const sortedBadges = [...ALL_BADGES].sort((a, b) => {
    const aEarned = earnedBadges.includes(a.slug) ? 0 : 1;
    const bEarned = earnedBadges.includes(b.slug) ? 0 : 1;
    return aEarned - bEarned;
  });

  return (
    <>
      {/* ── STATS ── */}
      <div className="mem-stats">
        <div className="mem-stat">
          <span className="mem-stat-value">{points}</span>
          <span className="mem-stat-label">Culture Points</span>
        </div>
        <div className="mem-stat">
          <span className="mem-stat-value">{earnedCount} / {ALL_BADGES.length}</span>
          <span className="mem-stat-label">Badges Earned</span>
        </div>
        <div className="mem-stat">
          <span className="mem-stat-value">{referralCount}</span>
          <span className="mem-stat-label">Referrals</span>
        </div>
        <div className="mem-stat">
          <span className="mem-stat-value">{membership}</span>
          <span className="mem-stat-label">Membership</span>
        </div>
      </div>

      {/* ── BADGES ── */}
      <section className="mem-card">
        <div className="mem-card-header">
          <div className="mem-card-label">Achievements</div>
          <span className="mem-card-count">
            {earnedCount} of {ALL_BADGES.length} earned
          </span>
        </div>
        <div className="mem-badges-grid">
          {sortedBadges.map((badge) => {
            const earned = earnedBadges.includes(badge.slug);
            return (
              <div
                key={badge.slug}
                className={`mem-badge ${earned ? 'earned' : 'locked'}`}
              >
                <div className="mem-badge-icon">{earned ? '★' : '○'}</div>
                <div className="mem-badge-name">{badge.name}</div>
                <div className="mem-badge-desc">{badge.desc}</div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
