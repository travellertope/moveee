"use client";

import { useState, useEffect } from "react";

interface Redemption {
  id: number;
  perk_id: number;
  type: string;
  credits_spent: number;
  qr_token: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  perk_title?: string;
  perk_description?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const SITE_URL = typeof window !== "undefined"
  ? window.location.origin
  : "https://themoveee.com";

export default function CouponsClient() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallet/history?type=redemptions")
      .catch(() => null);
    fetch("/api/perks/redeem", { method: "GET" })
      .catch(() => null);

    async function load() {
      try {
        const res = await fetch("/api/wallet/balance");
        if (!res.ok) { setLoading(false); return; }
        const balData = await res.json();

        const rRes = await fetch(`/api/wallet/history?user_id=${balData.user_id || ""}`);
        if (!rRes.ok) { setLoading(false); return; }
      } catch {}

      try {
        const res = await fetch("/api/perks/verify?list=mine");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRedemptions(data);
          }
        }
      } catch {}
      setLoading(false);
    }

    async function loadRedemptions() {
      try {
        const res = await fetch("/api/wallet/redemptions");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRedemptions(data);
        }
      } catch {}
      setLoading(false);
    }

    loadRedemptions();
  }, []);

  if (loading) {
    return (
      <section className="mem-card">
        <div className="mem-card-label">Loading…</div>
      </section>
    );
  }

  const perkRedemptions = redemptions.filter(r => r.type === "perk");
  const active = perkRedemptions.filter(r => r.status === "active" && r.expires_at && new Date(r.expires_at).getTime() > Date.now());
  const used = perkRedemptions.filter(r => r.status === "used");
  const expired = perkRedemptions.filter(r => r.status === "expired" || (r.status === "active" && r.expires_at && new Date(r.expires_at).getTime() <= Date.now()));

  return (
    <>
      {/* Active coupons */}
      <section className="mem-card">
        <div className="mem-card-label">Active Coupons ({active.length})</div>
        {active.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic" }}>
            No active coupons. <a href="/connect/perks" style={{ color: "var(--ochre)" }}>Browse perks</a> to redeem one.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px" }}>
            {active.map(r => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${SITE_URL}/api/perks/verify?token=${r.qr_token}`)}`;
              const days = daysUntil(r.expires_at!);
              const expiringSoon = days <= 3;
              const stateColor = expiringSoon ? "var(--warning)" : "var(--success)";
              const badgeBg = expiringSoon ? "rgba(245,158,11,.1)" : "rgba(45,106,79,.1)";
              const badgeText = expiringSoon ? "var(--warning-dark)" : "var(--success)";
              return (
                <div key={r.id} style={{
                  background: "var(--paper)",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "var(--shadow-card)",
                  border: `1px solid ${expiringSoon ? "rgba(245,158,11,.3)" : "rgba(45,106,79,.3)"}`,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                }}>
                  <span style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: badgeBg,
                    color: badgeText,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                  }}>
                    Active
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink)", margin: "12px 0 16px", lineHeight: 1.3 }}>
                    {r.perk_title || `Perk #${r.perk_id}`}
                  </h3>
                  <img src={qrUrl} alt="QR" width={120} height={120} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.7rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace", marginTop: "8px" }}>
                    {r.credits_spent} credits · Redeemed {formatDate(r.created_at)}
                  </span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: stateColor, marginTop: "8px" }}>
                    {days === 0 ? "Expires today" : `Expires in ${days} day${days !== 1 ? "s" : ""}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Used */}
      {used.length > 0 && (
        <section className="mem-card">
          <div className="mem-card-label">Used ({used.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {used.map(r => (
              <div key={r.id} style={{
                background: "var(--paper-deep, #ede6d9)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(42,36,28,.08)",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: 0.6,
              }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{r.perk_title || `Perk #${r.perk_id}`}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace", marginTop: "4px" }}>
                    {r.credits_spent} credits · Redeemed {formatDate(r.created_at)}
                  </span>
                </div>
                <span style={{
                  background: "rgba(42,36,28,.12)",
                  color: "var(--ink-soft)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}>
                  Used
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <section className="mem-card">
          <div className="mem-card-label">Expired ({expired.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {expired.map(r => (
              <div key={r.id} style={{
                background: "var(--paper-deep, #ede6d9)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid rgba(42,36,28,.08)",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: 0.4,
              }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)", textDecoration: "line-through" }}>
                    {r.perk_title || `Perk #${r.perk_id}`}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace", marginTop: "4px" }}>
                    {r.credits_spent} credits · Redeemed {formatDate(r.created_at)}
                  </span>
                </div>
                <span style={{
                  background: "rgba(198,40,40,.1)",
                  color: "var(--error)",
                  border: "1px solid rgba(198,40,40,.2)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                }}>
                  Expired
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
