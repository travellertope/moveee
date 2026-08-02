'use client';

import { useState, useRef, useEffect } from 'react';

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
  'culture-icon':       'Culture Icon',
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
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const TOTAL_BADGES = 18;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setOpenTooltip(null);
      }
    }
    if (openTooltip) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openTooltip]);


  const tierLabel = TIER_LABELS[repTier] ?? 'Member';
  const capHit    = dailyCreditsRemaining === 0;

  return (
    <div className="acct-stats" ref={tooltipRef}>
      {/* Credits */}
      <div className="acct-stat-card">
        <div className="acct-stat-icon">💰</div>
        <span className="acct-stat-value">{credits}</span>
        <div className="acct-stat-label">
          Credits
          <button
            className="acct-stat-info"
            aria-label="About credits"
            onClick={() => setOpenTooltip(openTooltip === 'credits' ? null : 'credits')}
          >i</button>
        </div>
        {openTooltip === 'credits' && (
          <div className="acct-stat-tooltip" role="tooltip">
            <strong>Moveee Credits</strong> are your spendable currency. Earn them by posting, engaging, and participating in the community. Redeem them for partner perks or cash out (Moveee Pro only, 40% fee). Daily cap: <strong>50 credits</strong>.
          </div>
        )}
        {capHit ? (
          <div className="acct-stat-sub acct-stat-sub--warn">Daily limit reached</div>
        ) : (
          <div className="acct-stat-sub">{dailyLeft} remaining today</div>
        )}
      </div>

      {/* Reputation */}
      <div className="acct-stat-card">
        <div className="acct-stat-icon">⭐</div>
        <span className="acct-stat-value">{reputation}</span>
        <div className="acct-stat-label">
          Points
          <button
            className="acct-stat-info"
            aria-label="About points"
            onClick={() => setOpenTooltip(openTooltip === 'reputation' ? null : 'reputation')}
          >i</button>
        </div>
        {openTooltip === 'reputation' && (
          <div className="acct-stat-tooltip" role="tooltip">
            <strong>Points</strong> is your permanent standing in the community — it never decreases. It unlocks status tiers: Culture Contributor (100), Taste Maker (500), Culture Authority (1,500). Unlike credits, points cannot be spent.
          </div>
        )}
        <div className="acct-stat-sub">{tierLabel}</div>
      </div>

      {/* Badges */}
      <div className="acct-stat-card">
        <div className="acct-stat-icon">🏅</div>
        <span className="acct-stat-value">{badgeCount} / {TOTAL_BADGES}</span>
        <div className="acct-stat-label">Badges</div>
      </div>

      {/* Referrals */}
      <div className="acct-stat-card">
        <div className="acct-stat-icon">🤝</div>
        <span className="acct-stat-value">{referralCount}</span>
        <div className="acct-stat-label">Referrals</div>
      </div>

      {/* Membership */}
      <div className="acct-stat-card">
        <div className="acct-stat-icon">👤</div>
        <span className="acct-stat-value acct-stat-value--sm">{membership}</span>
        <div className="acct-stat-label">Membership</div>
      </div>
    </div>
  );
}
