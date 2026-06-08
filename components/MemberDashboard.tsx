'use client';

import { useState, useEffect } from 'react';

interface Props {
  initialPoints: number;
  initialBadges: string[];
  referralCount: number;
  membership: string;
  initialCredits?: number;
  initialReputation?: number;
  reputationTier?: string;
  dailyCreditsRemaining?: number;
}

const TIER_LABELS: Record<string, string> = {
  'culture-authority':  'Culture Authority',
  'taste-maker':        'Taste Maker',
  'culture-contributor':'Culture Contributor',
  'member':             'Member',
};

export default function MemberDashboard({
  initialPoints,
  initialBadges,
  referralCount,
  membership,
  initialCredits = 0,
  initialReputation,
  reputationTier = 'member',
  dailyCreditsRemaining = 50,
}: Props) {
  const [credits, setCredits]       = useState(initialCredits);
  const [reputation, setReputation] = useState(initialReputation ?? initialPoints);
  const [repTier, setRepTier]       = useState(reputationTier);
  const [dailyLeft, setDailyLeft]   = useState(dailyCreditsRemaining);
  const [badgeCount, setBadgeCount] = useState(initialBadges.length);
  const TOTAL_BADGES = 18;

  useEffect(() => {
    fetch('/api/user/profile', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.credits === 'number')              setCredits(data.credits);
        if (typeof data.reputation === 'number')           setReputation(data.reputation);
        if (typeof data.reputationTier === 'string')       setRepTier(data.reputationTier);
        if (typeof data.dailyCreditsRemaining === 'number') setDailyLeft(data.dailyCreditsRemaining);
        if (Array.isArray(data.badges))                    setBadgeCount(data.badges.length);
      })
      .catch(() => {});
  }, []);

  const tierLabel = TIER_LABELS[repTier] ?? 'Member';
  const capHit    = dailyCreditsRemaining === 0;

  return (
    <div className="mem-stats">
      {/* Credits */}
      <div className="mem-stat mem-stat--credits">
        <span className="mem-stat-value">{credits}</span>
        <span className="mem-stat-label">Moveee Credits</span>
        {capHit ? (
          <span className="mem-stat-sublabel mem-stat-sublabel--cap">Daily limit reached</span>
        ) : (
          <span className="mem-stat-sublabel">{dailyLeft} remaining today</span>
        )}
      </div>

      {/* Reputation */}
      <div className="mem-stat mem-stat--reputation">
        <span className="mem-stat-value">{reputation}</span>
        <span className="mem-stat-label">Reputation</span>
        <span className="mem-stat-sublabel">{tierLabel}</span>
      </div>

      {/* Badges */}
      <div className="mem-stat">
        <span className="mem-stat-value">{badgeCount} / {TOTAL_BADGES}</span>
        <span className="mem-stat-label">Badges Earned</span>
      </div>

      {/* Referrals */}
      <div className="mem-stat">
        <span className="mem-stat-value">{referralCount}</span>
        <span className="mem-stat-label">Referrals</span>
      </div>

      {/* Membership */}
      <div className="mem-stat">
        <span className="mem-stat-value">{membership}</span>
        <span className="mem-stat-label">Membership</span>
      </div>
    </div>
  );
}
