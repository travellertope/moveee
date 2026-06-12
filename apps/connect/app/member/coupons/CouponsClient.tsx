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
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {active.map(r => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${SITE_URL}/api/perks/verify?token=${r.qr_token}`)}`;
              const days = daysUntil(r.expires_at!);
              return (
                <div key={r.id} style={{ border: "1px solid rgba(42,36,28,.1)", padding: "16px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                  <img src={qrUrl} alt="QR" width={120} height={120} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>
                      {r.perk_title || `Perk #${r.perk_id}`}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--mute)", marginBottom: "4px" }}>
                      {r.credits_spent} credits · Redeemed {formatDate(r.created_at)}
                    </div>
                    <div style={{
                      fontSize: "0.72rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: days <= 3 ? "#c5491f" : "#2e7d32",
                    }}>
                      {days === 0 ? "Expires today" : `Expires in ${days} day${days !== 1 ? "s" : ""}`}
                    </div>
                  </div>
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
          {used.map(r => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(42,36,28,.06)", display: "flex", justifyContent: "space-between", opacity: 0.6 }}>
              <span style={{ fontSize: "0.82rem" }}>{r.perk_title || `Perk #${r.perk_id}`}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace" }}>
                {formatDate(r.created_at)}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <section className="mem-card">
          <div className="mem-card-label">Expired ({expired.length})</div>
          {expired.map(r => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(42,36,28,.06)", display: "flex", justifyContent: "space-between", opacity: 0.4 }}>
              <span style={{ fontSize: "0.82rem" }}>{r.perk_title || `Perk #${r.perk_id}`}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace" }}>
                {formatDate(r.created_at)}
              </span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
