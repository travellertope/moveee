"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReferredUser {
  username: string;
  displayName: string;
  joinedAt: number;
}

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  referralCount: number;
  repPerReferral: number;
  creditsPerReferral: number;
  referredUsers: ReferredUser[];
  connectorThreshold: number;
  superConnectorThreshold: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReferralsClient({ initialData }: { initialData: ReferralData | null }) {
  const [data, setData] = useState<ReferralData | null>(initialData);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetch("/api/member/referrals")
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [initialData]);

  const handleCopy = async () => {
    if (!data?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) return <p style={{ padding: "2rem", color: "var(--mute)" }}>Loading…</p>;
  if (!data) return <p style={{ padding: "2rem", color: "var(--mute)" }}>Unable to load referral data.</p>;

  const { referralUrl, referralCount, repPerReferral, creditsPerReferral,
          referredUsers, connectorThreshold, superConnectorThreshold } = data;

  const connectorPct = Math.min(100, (referralCount / connectorThreshold) * 100);
  const superPct = Math.min(100, (referralCount / superConnectorThreshold) * 100);
  const nextBadge = referralCount < connectorThreshold
    ? { label: "Connector", target: connectorThreshold }
    : referralCount < superConnectorThreshold
    ? { label: "Super Connector", target: superConnectorThreshold }
    : null;

  return (
    <>
      {/* Share link card */}
      <section className="acct-card">
        <div className="acct-card-header"><span className="acct-card-title">Your Referral Link</span></div>
        <p className="ref-desc">
          Share your personal link. Every friend who signs up earns you{" "}
          <strong>+{repPerReferral} reputation</strong> and{" "}
          <strong>+{creditsPerReferral} credits</strong>.
        </p>
        <div className="ref-link-row">
          <input readOnly value={referralUrl} className="ref-link-input" onFocus={(e) => e.target.select()} />
          <button onClick={handleCopy} className={`ref-copy-btn${copied ? " ref-copy-btn--copied" : ""}`}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
        <p className="ref-short">
          Or share the short URL: <strong>web.themoveee.com/r/{data.referralCode}</strong>
        </p>
      </section>

      {/* Stats row */}
      <div className="ref-stats">
        {[
          { label: "Friends referred", value: referralCount },
          { label: "Points earned", value: `+${referralCount * repPerReferral}` },
          { label: "Credits earned", value: `+${referralCount * creditsPerReferral}` },
        ].map(({ label, value }) => (
          <div key={label} className="ref-stat">
            <div className="ref-stat-value">{value}</div>
            <div className="ref-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Badge progress */}
      <section className="acct-card">
        <div className="acct-card-header"><span className="acct-card-title">Badge Progress</span></div>
        {[
          { label: "Connector", emoji: "🔗", threshold: connectorThreshold, pct: connectorPct },
          { label: "Super Connector", emoji: "⚡", threshold: superConnectorThreshold, pct: superPct },
        ].map(({ label, emoji, threshold, pct }) => (
          <div key={label} className="ref-badge-row">
            <div className="ref-badge-head">
              <span className="ref-badge-label">{emoji} {label}</span>
              <span className="ref-badge-count">
                {Math.min(referralCount, threshold)}/{threshold} referrals
                {referralCount >= threshold && " ✓"}
              </span>
            </div>
            <div className="ref-track">
              <div className={`ref-fill${pct >= 100 ? " ref-fill--done" : ""}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
        {nextBadge && (
          <p className="ref-next-note">
            Refer <strong>{nextBadge.target - referralCount}</strong> more friend
            {nextBadge.target - referralCount !== 1 ? "s" : ""} to unlock the{" "}
            <strong>{nextBadge.label}</strong> badge.
          </p>
        )}
      </section>

      {/* Referred users list */}
      <section className="acct-card">
        <div className="acct-card-header"><span className="acct-card-title">Friends You&apos;ve Invited ({referredUsers.length})</span></div>
        {referredUsers.length === 0 ? (
          <p style={{ color: "var(--mute)", fontSize: 14, margin: 0 }}>
            No one has joined with your link yet. Share it to get started!
          </p>
        ) : (
          referredUsers.map((u) => (
            <div key={u.username} className="ref-user-row">
              <div>
                <Link href={`/${u.username}`} className="ref-user-name">{u.displayName}</Link>
                <div className="ref-user-handle">@{u.username}</div>
              </div>
              <div className="ref-user-time">{timeAgo(u.joinedAt)}</div>
            </div>
          ))
        )}
      </section>

      {/* How it works */}
      <section className="acct-card" style={{ marginBottom: 0 }}>
        <div className="acct-card-header"><span className="acct-card-title">How It Works</span></div>
        {[
          { n: "1", text: `Share your link — send it via WhatsApp, Instagram DMs, or email.` },
          { n: "2", text: `Your friend signs up at web.themoveee.com using your link.` },
          { n: "3", text: `You instantly earn +${repPerReferral} reputation and +${creditsPerReferral} credits. No waiting.` },
          { n: "4", text: `Refer 3 friends → Connector badge. Refer 10 → Super Connector badge.` },
        ].map(({ n, text }) => (
          <div key={n} className="ref-step">
            <div className="ref-step-num">{n}</div>
            <p className="ref-step-text">{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
