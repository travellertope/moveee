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
      <section className="acct-card">
        <span className="acct-card-title">Loading…</span>
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
      <div className="cpn-section-header">Active ({active.length})</div>
      {active.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic" }}>
          No active coupons. <a href="/connect/perks" style={{ color: "var(--ochre)" }}>Browse perks</a> to redeem one.
        </p>
      ) : (
        <div className="cpn-grid">
          {active.map(r => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${SITE_URL}/api/perks/verify?token=${r.qr_token}`)}`;
            const days = daysUntil(r.expires_at!);
            const expiringSoon = days <= 3;
            return (
              <div key={r.id} className={`cpn-card${expiringSoon ? " cpn-card--warn" : ""}`}>
                <span className="cpn-badge">Active</span>
                <h3 className="cpn-card-title">{r.perk_title || `Perk #${r.perk_id}`}</h3>
                <img src={qrUrl} alt="QR" width={120} height={120} style={{ flexShrink: 0 }} />
                <span className="cpn-card-meta">{r.credits_spent} credits · Redeemed {formatDate(r.created_at)}</span>
                <span className={`cpn-card-expiry ${expiringSoon ? "cpn-card-expiry--warn" : "cpn-card-expiry--ok"}`}>
                  {days === 0 ? "Expires today" : `Expires in ${days} day${days !== 1 ? "s" : ""}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Used */}
      {used.length > 0 && (
        <>
          <div className="cpn-section-header">Used ({used.length})</div>
          <div className="cpn-row-list">
            {used.map(r => (
              <div key={r.id} className="cpn-row cpn-row--used">
                <div>
                  <div className="cpn-row-title">{r.perk_title || `Perk #${r.perk_id}`}</div>
                  <div className="cpn-row-meta">{r.credits_spent} credits · Redeemed {formatDate(r.created_at)}</div>
                </div>
                <span className="cpn-row-status cpn-row-status--used">Used</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <>
          <div className="cpn-section-header">Expired ({expired.length})</div>
          <div className="cpn-row-list">
            {expired.map(r => (
              <div key={r.id} className="cpn-row cpn-row--expired">
                <div>
                  <div className="cpn-row-title">{r.perk_title || `Perk #${r.perk_id}`}</div>
                  <div className="cpn-row-meta">{r.credits_spent} credits · Redeemed {formatDate(r.created_at)}</div>
                </div>
                <span className="cpn-row-status cpn-row-status--expired">Expired</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
