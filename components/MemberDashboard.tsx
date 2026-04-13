'use client';

import { useState, useEffect } from 'react';

interface Props {
  initialPoints: number;
  initialBadges: string[];
  referralCount: number;
  membership: string;
}

/** Renders only the 4-stat summary row; fetches live data from WP on mount. */
export default function MemberDashboard({
  initialPoints,
  initialBadges,
  referralCount,
  membership,
}: Props) {
  const [points, setPoints] = useState(initialPoints);
  const [badgeCount, setBadgeCount] = useState(initialBadges.length);
  const TOTAL_BADGES = 18;

  useEffect(() => {
    fetch('/api/user/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.points === 'number') setPoints(data.points);
        if (Array.isArray(data.badges)) setBadgeCount(data.badges.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mem-stats">
      <div className="mem-stat">
        <span className="mem-stat-value">{points}</span>
        <span className="mem-stat-label">Culture Points</span>
      </div>
      <div className="mem-stat">
        <span className="mem-stat-value">{badgeCount} / {TOTAL_BADGES}</span>
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
  );
}
