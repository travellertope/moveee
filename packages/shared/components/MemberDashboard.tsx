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
    <div className="mem-stats" ref={tooltipRef}>
      {/* Credits */}
      <div className="mem-stat mem-stat--credits">
        <span className="mem-stat-value">{credits}</span>
        <span className="mem-stat-label">
          Moveee Credits
          <button
            className="mem-stat-info"
            aria-label="About credits"
            onClick={() => setOpenTooltip(openTooltip === 'credits' ? null : 'credits')}
          >ⓘ</button>
          {openTooltip === 'credits' && (
            <div className="mem-tooltip" role="tooltip">
              <strong>Moveee Credits</strong> are your spendable currency. Earn them by posting, engaging, and participating in the community. Redeem them for partner perks or cash out (Connect Pro only, 40% fee). Daily cap: <strong>50 credits</strong>.
            </div>
          )}
        </span>
        {capHit ? (
          <span className="mem-stat-sublabel mem-stat-sublabel--cap">Daily limit reached</span>
        ) : (
          <span className="mem-stat-sublabel">{dailyLeft} remaining today</span>
        )}
      </div>

      {/* Reputation */}
      <div className="mem-stat mem-stat--reputation">
        <span className="mem-stat-value">{reputation}</span>
        <span className="mem-stat-label">
          Reputation
          <button
            className="mem-stat-info"
            aria-label="About reputation"
            onClick={() => setOpenTooltip(openTooltip === 'reputation' ? null : 'reputation')}
          >ⓘ</button>
          {openTooltip === 'reputation' && (
            <div className="mem-tooltip" role="tooltip">
              <strong>Reputation</strong> is your permanent standing in the community — it never decreases. It unlocks status tiers: Culture Contributor (100), Taste Maker (500), Culture Authority (1,500). Unlike credits, reputation cannot be spent.
            </div>
          )}
        </span>
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
