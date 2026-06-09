"use client";

import { useState } from "react";

interface LedgerEntry {
  id: number;
  amount: number;
  source: string;
  source_id: number;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  post_validated: "Post published",
  community_post: "Community post",
  perk_redeem: "Perk redeemed",
  perk_redeem_rollback: "Perk refund",
  cashout: "Cash out",
  cashout_refund: "Cash out refund",
  profile_completed: "Profile completed",
  email_verified: "Email verified",
  directory_opt_in: "Directory opt-in",
  newsletter_subscribed: "Newsletter signup",
  poll_vote: "Poll vote",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function WalletClient({
  credits,
  creditsPerGbp,
  entries,
}: {
  credits: number;
  creditsPerGbp: number;
  entries: LedgerEntry[];
}) {
  const [tab, setTab] = useState<"history" | "cashout">("history");
  const [cashCredits, setCashCredits] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [accountName, setAccountName] = useState("");
  const [accountRef, setAccountRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cashResult, setCashResult] = useState<{ success: boolean; message: string } | null>(null);

  const creditsNum = parseInt(cashCredits) || 0;
  const feePercent = 30;
  const feeCredits = Math.round(creditsNum * feePercent / 100);
  const netCredits = creditsNum - feeCredits;
  const cashAmount = (netCredits / creditsPerGbp).toFixed(2);

  async function handleCashout(e: React.FormEvent) {
    e.preventDefault();
    if (creditsNum < 100 || creditsNum > credits) return;
    setSubmitting(true);
    setCashResult(null);
    try {
      const res = await fetch("/api/wallet/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits: creditsNum,
          method: "bank_transfer",
          account_name: accountName,
          account_ref: accountRef,
          currency,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCashResult({ success: true, message: `Cash out request submitted. You'll receive £${cashAmount} after admin approval (48hr hold).` });
      } else {
        setCashResult({ success: false, message: data.error || "Something went wrong." });
      }
    } catch {
      setCashResult({ success: false, message: "Network error." });
    }
    setSubmitting(false);
  }

  return (
    <>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(42,36,28,.1)", marginBottom: "24px" }}>
        <button type="button" onClick={() => setTab("history")} className={`prf-tab${tab === "history" ? " prf-tab--active" : ""}`}>
          Transaction History
        </button>
        <button type="button" onClick={() => setTab("cashout")} className={`prf-tab${tab === "cashout" ? " prf-tab--active" : ""}`}>
          Cash Out
        </button>
      </div>

      {/* History */}
      {tab === "history" && (
        <section className="mem-card">
          <div className="mem-card-label">Recent Transactions</div>
          {entries.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic" }}>No transactions yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(42,36,28,.06)", border: "1px solid rgba(42,36,28,.08)" }}>
              {entries.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--paper)" }}>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "var(--ink)", fontWeight: 500 }}>
                      {SOURCE_LABELS[e.source] ?? e.source.replace(/_/g, " ")}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--mute)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".06em" }}>
                      {formatDate(e.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: e.amount > 0 ? "#2e7d32" : "#c5491f",
                  }}>
                    {e.amount > 0 ? "+" : ""}{e.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Cashout */}
      {tab === "cashout" && (
        <section className="mem-card">
          <div className="mem-card-label">Cash Out Credits</div>
          <p style={{ fontSize: "0.78rem", color: "var(--mute)", margin: "0 0 16px", lineHeight: 1.5 }}>
            Minimum 100 credits. A flat 30% fee applies.
            Partner perks are fee-free — consider <a href="/connect/perks" style={{ color: "var(--ochre)" }}>browsing perks</a> instead.
          </p>

          {cashResult ? (
            <div style={{
              padding: "16px",
              background: cashResult.success ? "rgba(46,125,50,.06)" : "rgba(197,73,31,.06)",
              border: `1px solid ${cashResult.success ? "rgba(46,125,50,.2)" : "rgba(197,73,31,.2)"}`,
              fontSize: "0.82rem",
              color: cashResult.success ? "#2e7d32" : "#c5491f",
              lineHeight: 1.5,
            }}>
              {cashResult.message}
            </div>
          ) : (
            <form onSubmit={handleCashout}>
              <div className="mem-field-list">
                <div className="mem-field">
                  <div className="mem-field-label">Credits to cash out</div>
                  <input
                    type="number"
                    min={100}
                    max={credits}
                    value={cashCredits}
                    onChange={e => setCashCredits(e.target.value)}
                    placeholder="Min 100"
                    className="composer-input"
                    required
                  />
                  {creditsNum >= 100 && (
                    <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginTop: "4px", fontFamily: "'JetBrains Mono', monospace" }}>
                      Fee: {feePercent}% ({feeCredits} credits) · You receive: £{cashAmount}
                    </div>
                  )}
                </div>
                <div className="mem-field">
                  <div className="mem-field-label">Currency</div>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="composer-input">
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </div>
                <div className="mem-field">
                  <div className="mem-field-label">Account holder name</div>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className="composer-input"
                    required
                  />
                </div>
                <div className="mem-field">
                  <div className="mem-field-label">Account number / reference</div>
                  <input
                    type="text"
                    value={accountRef}
                    onChange={e => setAccountRef(e.target.value)}
                    className="composer-input"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || creditsNum < 100 || creditsNum > credits || !accountName.trim() || !accountRef.trim()}
                className="perk-card-btn"
                style={{ marginTop: "16px" }}
              >
                {submitting ? "Submitting…" : "Request Cash Out"}
              </button>
            </form>
          )}
        </section>
      )}
    </>
  );
}
