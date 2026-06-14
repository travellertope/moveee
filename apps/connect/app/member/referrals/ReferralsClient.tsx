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
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Share link card */}
      <div className="mem-card">
        <div className="mem-card-header">Your Referral Link</div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Share your personal link. Every friend who signs up earns you{" "}
            <strong>+{repPerReferral} reputation</strong> and{" "}
            <strong>+{creditsPerReferral} credits</strong>.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <input
              readOnly
              value={referralUrl}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 8,
                border: "1px solid var(--rule)", background: "var(--paper-deep)",
                fontFamily: "monospace", fontSize: 13, color: "var(--ink)",
              }}
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none",
                background: copied ? "var(--success, #2D6A4F)" : "var(--ink)",
                color: "var(--paper)", fontWeight: 700, fontSize: 14,
                cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.2s",
              }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>
            Or share the short URL:{" "}
            <strong>connect.themoveee.com/r/{data.referralCode}</strong>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        {[
          { label: "Friends referred", value: referralCount },
          { label: "Reputation earned", value: `+${referralCount * repPerReferral}` },
          { label: "Credits earned", value: `+${referralCount * creditsPerReferral}` },
        ].map(({ label, value }) => (
          <div key={label} className="mem-card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <div style={{ fontSize: 28, fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--ochre)" }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Badge progress */}
      <div className="mem-card">
        <div className="mem-card-header">Badge Progress</div>
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[
            { label: "Connector", emoji: "🔗", threshold: connectorThreshold, pct: connectorPct },
            { label: "Super Connector", emoji: "⚡", threshold: superConnectorThreshold, pct: superPct },
          ].map(({ label, emoji, threshold, pct }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  {emoji} {label}
                </span>
                <span style={{ fontSize: 12, color: "var(--mute)" }}>
                  {Math.min(referralCount, threshold)}/{threshold} referrals
                  {referralCount >= threshold && " ✓"}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "var(--paper-deep)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${pct}%`,
                  background: pct >= 100 ? "var(--success, #2D6A4F)" : "var(--ochre)",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          ))}
          {nextBadge && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
              Refer <strong>{nextBadge.target - referralCount}</strong> more friend
              {nextBadge.target - referralCount !== 1 ? "s" : ""} to unlock the{" "}
              <strong>{nextBadge.label}</strong> badge.
            </p>
          )}
        </div>
      </div>

      {/* Referred users list */}
      <div className="mem-card">
        <div className="mem-card-header">
          Friends You&apos;ve Invited ({referredUsers.length})
        </div>
        <div>
          {referredUsers.length === 0 ? (
            <p style={{ padding: "1.25rem 1.5rem", color: "var(--mute)", fontSize: 14, margin: 0 }}>
              No one has joined with your link yet. Share it to get started!
            </p>
          ) : (
            referredUsers.map((u) => (
              <div key={u.username} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 1.5rem", borderBottom: "1px solid var(--rule)",
              }}>
                <div>
                  <Link href={`/${u.username}`} style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none", fontSize: 14 }}>
                    {u.displayName}
                  </Link>
                  <div style={{ fontSize: 12, color: "var(--mute)" }}>@{u.username}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--ghost, #999)" }}>
                  {timeAgo(u.joinedAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="mem-card">
        <div className="mem-card-header">How It Works</div>
        <div style={{ padding: "1.25rem 1.5rem" }}>
          {[
            { n: "1", text: `Share your link — send it via WhatsApp, Instagram DMs, or email.` },
            { n: "2", text: `Your friend signs up at connect.themoveee.com using your link.` },
            { n: "3", text: `You instantly earn +${repPerReferral} reputation and +${creditsPerReferral} credits. No waiting.` },
            { n: "4", text: `Refer 3 friends → Connector badge. Refer 10 → Super Connector badge.` },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "var(--ochre)",
                color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>{n}</div>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
