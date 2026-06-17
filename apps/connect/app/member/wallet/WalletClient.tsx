"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

interface LedgerEntry {
  id: number;
  amount: number;
  source: string;
  source_id: number;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  post_validated:       "Post published",
  community_post:       "Community post",
  perk_redeem:          "Perk redeemed",
  perk_redeem_rollback: "Perk refund",
  cashout:              "Cash out",
  cashout_refund:       "Cash out refund",
  profile_completed:    "Profile completed",
  email_verified:       "Email verified",
  directory_opt_in:     "Directory opt-in",
  newsletter_subscribed:"Newsletter signup",
  poll_vote:            "Poll vote",
};

const CURRENCY_SYMBOL: Record<string, string> = { GBP: "£", USD: "$", NGN: "₦" };

const NGN_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
  "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Globus Bank",
  "Guaranty Trust Bank (GTBank)", "Heritage Bank", "Keystone Bank", "Lotus Bank",
  "Polaris Bank", "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered",
  "Sterling Bank", "SunTrust Bank", "Titan Trust Bank", "Union Bank of Nigeria",
  "United Bank for Africa (UBA)", "Unity Bank", "Wema Bank", "Zenith Bank",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid rgba(42,36,28,.15)",
  borderRadius: 3,
  fontSize: "0.85rem",
  fontFamily: "inherit",
  background: "var(--paper)",
  color: "var(--ink)",
  boxSizing: "border-box",
};

const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const labelStyle: React.CSSProperties = {
  fontSize: "8px", fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ochre)",
};
const hintStyle: React.CSSProperties = {
  fontSize: "0.7rem", color: "var(--mute)",
  fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".04em",
};

export default function WalletClient({
  credits,
  creditsPerGbp,
  entries,
  isPro,
}: {
  credits: number;
  creditsPerGbp: number;
  entries: LedgerEntry[];
  isPro: boolean;
}) {
  const [tab, setTab]               = useState<"history" | "cashout">("history");
  const [cashCredits, setCashCredits] = useState("");
  const [currency, setCurrency]     = useState("GBP");
  const [accountName, setAccountName] = useState("");
  const [sortCode, setSortCode]     = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [bankName, setBankName]     = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cashResult, setCashResult] = useState<{ success: boolean; message: string } | null>(null);
  const [stepUpError, setStepUpError] = useState("");

  async function doStepUp(): Promise<string | null> {
    try {
      const optRes = await fetch("/api/auth/passkey/step-up", { method: "POST" });
      if (!optRes.ok) return null;
      const options = await optRes.json();
      const assResp = await startAuthentication({ optionsJSON: options });
      const verRes = await fetch("/api/auth/passkey/step-up-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assResp),
      });
      if (!verRes.ok) return null;
      const data = await verRes.json();
      return data.step_up_token as string;
    } catch {
      return null;
    }
  }

  const creditsNum  = parseInt(cashCredits) || 0;
  const feePercent  = 30;
  const feeCredits  = Math.round(creditsNum * feePercent / 100);
  const netCredits  = creditsNum - feeCredits;
  const symbol      = CURRENCY_SYMBOL[currency] ?? currency;
  // Approximate conversion — server will use live rate for non-GBP
  const cashAmount  = (netCredits / creditsPerGbp).toFixed(2);

  // Per-currency validation
  const gbpValid  = currency !== "GBP"  || (sortCode.trim().length > 0 && accountNumber.trim().length > 0);
  const usdValid  = currency !== "USD"  || (bankName.trim().length > 0 && routingNumber.trim().length > 0 && accountNumber.trim().length > 0);
  const ngnValid  = currency !== "NGN"  || (bankName.trim().length > 0 && accountNumber.trim().length > 0);
  const formValid = creditsNum >= 100 && creditsNum <= credits && accountName.trim().length > 0 && gbpValid && usdValid && ngnValid;

  async function handleCashout(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) return;
    setSubmitting(true);
    setCashResult(null);
    setStepUpError("");
    try {
      const stepUpToken = await doStepUp();
      if (!stepUpToken) {
        setStepUpError("Passkey verification is required for cash-out. Please set up a passkey in Security settings.");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/wallet/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits:        creditsNum,
          method:         "bank_transfer",
          currency,
          account_name:   accountName,
          account_number: accountNumber,
          sort_code:      sortCode   || undefined,
          routing_number: routingNumber || undefined,
          bank_name:      bankName   || undefined,
          step_up_token:  stepUpToken,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCashResult({ success: true, message: `Cash out request submitted. You'll receive ${symbol}${cashAmount} after admin approval (48 hr hold).` });
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
          {!isPro ? (
            <div style={{ border: "1px solid var(--ochre)", borderRadius: 8, padding: "20px 16px", marginTop: 8 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--ochre)", color: "#fff", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, marginBottom: 12 }}>
                Connect Pro
              </div>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--ink)", margin: "0 0 6px" }}>
                Cash out your credits
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Convert your earned credits to real money — a Connect Pro exclusive. Upgrade to start cashing out.
              </p>
              <a href="/connect/membership" style={{ display: "inline-block", background: "var(--ink)", color: "var(--paper)", padding: "10px 20px", borderRadius: 4, fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
                Upgrade to Connect Pro →
              </a>
            </div>
          ) : (
          <>
          <p style={{ fontSize: "0.78rem", color: "var(--mute)", margin: "0 0 8px", lineHeight: 1.5 }}>
            Minimum 100 credits. A flat 40% fee applies.
            Partner perks are fee-free —{" "}
            <a href="/connect/perks" style={{ color: "var(--ochre)" }}>browse perks</a> instead.
          </p>
          <p style={{ fontSize: "0.76rem", color: "var(--mute)", margin: "0 0 20px" }}>
            🔑 Passkey verification required at checkout.
          </p>

          {stepUpError && (
            <div style={{ padding: "10px 14px", background: "rgba(197,73,31,.06)", border: "1px solid rgba(197,73,31,.2)", borderRadius: 3, fontSize: "0.8rem", color: "#c5491f", marginBottom: 12 }}>
              {stepUpError}
            </div>
          )}

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
            <form onSubmit={handleCashout} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Amount */}
              <div style={fieldStyle}>
                <div style={labelStyle}>Credits to cash out</div>
                <input
                  type="number" min={100} max={credits}
                  value={cashCredits} onChange={e => setCashCredits(e.target.value)}
                  placeholder="Min 100" style={inputStyle} required
                />
                {creditsNum >= 100 && (
                  <div style={hintStyle}>
                    Fee: {feePercent}% ({feeCredits} cr) · You receive: {symbol}{cashAmount}
                  </div>
                )}
              </div>

              {/* Currency */}
              <div style={fieldStyle}>
                <div style={labelStyle}>Currency</div>
                <select
                  value={currency}
                  onChange={e => { setCurrency(e.target.value); setSortCode(""); setRoutingNumber(""); setBankName(""); setAccountNumber(""); }}
                  style={inputStyle}
                >
                  <option value="GBP">GBP — British Pound (£)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="NGN">NGN — Nigerian Naira (₦)</option>
                </select>
              </div>

              {/* Account holder name — always shown */}
              <div style={fieldStyle}>
                <div style={labelStyle}>Account holder name</div>
                <input
                  type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                  placeholder="Full name as on your bank account" style={inputStyle} required
                />
              </div>

              {/* GBP fields */}
              {currency === "GBP" && (
                <>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Sort code</div>
                    <input
                      type="text" value={sortCode} onChange={e => setSortCode(e.target.value)}
                      placeholder="00-00-00" maxLength={8} style={inputStyle} required
                    />
                  </div>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Account number</div>
                    <input
                      type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                      placeholder="8 digits" maxLength={8} style={inputStyle} required
                    />
                  </div>
                </>
              )}

              {/* USD fields */}
              {currency === "USD" && (
                <>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Bank name</div>
                    <input
                      type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. Chase, Bank of America" style={inputStyle} required
                    />
                  </div>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Routing number (ABA)</div>
                    <input
                      type="text" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)}
                      placeholder="9-digit ABA routing number" maxLength={9} style={inputStyle} required
                    />
                  </div>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Account number</div>
                    <input
                      type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Your bank account number" style={inputStyle} required
                    />
                  </div>
                </>
              )}

              {/* NGN fields */}
              {currency === "NGN" && (
                <>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Bank name</div>
                    <select value={bankName} onChange={e => setBankName(e.target.value)} style={inputStyle} required>
                      <option value="">Select your bank…</option>
                      {NGN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <div style={labelStyle}>Account number (NUBAN)</div>
                    <input
                      type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                      placeholder="10-digit NUBAN" maxLength={10} style={inputStyle} required
                    />
                    <div style={hintStyle}>10-digit number — same for all Nigerian banks</div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting || !formValid}
                className="mem-action-btn"
              >
                {submitting ? "Submitting…" : "Request Cash Out"}
              </button>
            </form>
          )}
          </>
          )}
        </section>
      )}
    </>
  );
}
