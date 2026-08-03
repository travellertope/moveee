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
  const feePercent  = 40;
  const feeCredits  = Math.round(creditsNum * feePercent / 100);
  const netCredits  = creditsNum - feeCredits;
  const symbol      = CURRENCY_SYMBOL[currency] ?? currency;
  // Approximate conversion — server will use live rate for non-GBP
  const cashAmount  = (netCredits / creditsPerGbp).toFixed(2);

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  const recent = entries.filter(e => new Date(e.created_at).getTime() >= cutoff);
  const earned30d = recent.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  const spent30d  = recent.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0);

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
      {/* Stat row */}
      <div className="wal-stats">
        <div className="wal-stat-card wal-stat-card--balance">
          <div className="wal-stat-label">Balance</div>
          <div><span className="wal-stat-value">{credits}</span><span className="wal-stat-unit">Cr</span></div>
        </div>
        <div className="wal-stat-card">
          <div className="wal-stat-label">Earned (30d)</div>
          <div className="wal-stat-value" style={{ color: "var(--success)" }}>+{earned30d}</div>
        </div>
        <div className="wal-stat-card">
          <div className="wal-stat-label">Spent (30d)</div>
          <div className="wal-stat-value" style={{ color: "var(--error)" }}>{spent30d}</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="wal-tabs">
        <button type="button" onClick={() => setTab("history")} className={`wal-tab${tab === "history" ? " wal-tab--active" : ""}`}>
          Transaction History
        </button>
        <button type="button" onClick={() => setTab("cashout")} className={`wal-tab${tab === "cashout" ? " wal-tab--active" : ""}`}>
          Cash Out
        </button>
      </div>

      {/* History */}
      {tab === "history" && (
        <section className="acct-card">
          <div className="acct-card-header"><span className="acct-card-title">Recent Transactions</span></div>
          {entries.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic" }}>No transactions yet.</p>
          ) : (
            <div className="wal-txn-list">
              {entries.map(e => (
                <div key={e.id} className="wal-txn">
                  <div>
                    <div className="wal-txn-title">{SOURCE_LABELS[e.source] ?? e.source.replace(/_/g, " ")}</div>
                    <div className="wal-txn-date">{formatDate(e.created_at)}</div>
                  </div>
                  <span className={`wal-txn-amt ${e.amount > 0 ? "wal-txn-amt--pos" : "wal-txn-amt--neg"}`}>
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
        !isPro ? (
          <div className="wal-cashout-grid">
            <div className="wal-upsell">
              <span className="wal-upsell-badge">Moveee Pro</span>
              <h3 className="wal-upsell-title">Cash out your credits</h3>
              <p className="wal-upsell-desc">
                Convert your earned credits to real money — a Moveee Pro exclusive. Upgrade to start cashing out.
              </p>
              <a href="/connect/membership" className="wal-upsell-btn">Become a Moveee Pro →</a>
            </div>
            <div />
          </div>
        ) : (
          <div className="wal-cashout-grid">
            <section className="acct-card">
              <div className="acct-card-header"><span className="acct-card-title">Cash Out Credits</span></div>

              <div className="wal-passkey-banner">
                🔒 Passkey verification required to confirm a cash out.
              </div>

              {stepUpError && (
                <div style={{ padding: "10px 14px", background: "color-mix(in srgb, var(--error) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", color: "var(--error)", marginBottom: 16 }}>
                  {stepUpError}
                </div>
              )}

              {cashResult ? (
                <div style={{
                  padding: "16px",
                  background: cashResult.success ? "color-mix(in srgb, var(--success) 8%, transparent)" : "color-mix(in srgb, var(--error) 8%, transparent)",
                  border: `1px solid ${cashResult.success ? "color-mix(in srgb, var(--success) 20%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
                  borderRadius: "var(--radius-lg)",
                  fontSize: "0.82rem",
                  color: cashResult.success ? "var(--success)" : "var(--error)",
                  lineHeight: 1.5,
                }}>
                  {cashResult.message}
                </div>
              ) : (
                <form onSubmit={handleCashout}>

                  {/* Amount */}
                  <div className="wal-field">
                    <div className="wal-label">Credits to cash out</div>
                    <input
                      type="number" min={100} max={credits}
                      value={cashCredits} onChange={e => setCashCredits(e.target.value)}
                      placeholder="Min 100" className="wal-input" required
                    />
                    {creditsNum >= 100 && (
                      <div className="wal-fee-box">
                        <div className="wal-fee-row"><span>{creditsNum} Cr</span><span>{symbol}{(creditsNum / creditsPerGbp).toFixed(2)}</span></div>
                        <div className="wal-fee-row"><span>Platform fee ({feePercent}%)</span><span>−{feeCredits} Cr</span></div>
                        <div className="wal-fee-row" style={{ fontWeight: 700, color: "var(--ink)", borderTop: "1px solid var(--rule-dark)", marginTop: 4, paddingTop: 8 }}>
                          <span>You receive</span><span>{symbol}{cashAmount}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Currency */}
                  <div className="wal-field">
                    <div className="wal-label">Currency</div>
                    <select
                      value={currency}
                      onChange={e => { setCurrency(e.target.value); setSortCode(""); setRoutingNumber(""); setBankName(""); setAccountNumber(""); }}
                      className="wal-input"
                    >
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="NGN">NGN — Nigerian Naira (₦)</option>
                    </select>
                  </div>

                  {/* Account holder name — always shown */}
                  <div className="wal-field">
                    <div className="wal-label">Account holder name</div>
                    <input
                      type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                      placeholder="Full name as on your bank account" className="wal-input" required
                    />
                  </div>

                  {/* GBP fields */}
                  {currency === "GBP" && (
                    <>
                      <div className="wal-field">
                        <div className="wal-label">Sort code</div>
                        <input
                          type="text" value={sortCode} onChange={e => setSortCode(e.target.value)}
                          placeholder="00-00-00" maxLength={8} className="wal-input" required
                        />
                      </div>
                      <div className="wal-field">
                        <div className="wal-label">Account number</div>
                        <input
                          type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                          placeholder="8 digits" maxLength={8} className="wal-input" required
                        />
                      </div>
                    </>
                  )}

                  {/* USD fields */}
                  {currency === "USD" && (
                    <>
                      <div className="wal-field">
                        <div className="wal-label">Bank name</div>
                        <input
                          type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                          placeholder="e.g. Chase, Bank of America" className="wal-input" required
                        />
                      </div>
                      <div className="wal-field">
                        <div className="wal-label">Routing number (ABA)</div>
                        <input
                          type="text" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)}
                          placeholder="9-digit ABA routing number" maxLength={9} className="wal-input" required
                        />
                      </div>
                      <div className="wal-field">
                        <div className="wal-label">Account number</div>
                        <input
                          type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                          placeholder="Your bank account number" className="wal-input" required
                        />
                      </div>
                    </>
                  )}

                  {/* NGN fields */}
                  {currency === "NGN" && (
                    <>
                      <div className="wal-field">
                        <div className="wal-label">Bank name</div>
                        <select value={bankName} onChange={e => setBankName(e.target.value)} className="wal-input" required>
                          <option value="">Select your bank…</option>
                          {NGN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="wal-field">
                        <div className="wal-label">Account number (NUBAN)</div>
                        <input
                          type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                          placeholder="10-digit NUBAN" maxLength={10} className="wal-input" required
                        />
                        <div className="wal-hint">10-digit number — same for all Nigerian banks</div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !formValid}
                    className="wal-submit-btn"
                  >
                    {submitting ? "Submitting…" : "Request Cash Out"}
                  </button>
                </form>
              )}
            </section>

            <div className="acct-card">
              <div className="acct-card-header"><span className="acct-card-title">How Cash Out Works</span></div>
              <p className="acct-card-desc">
                Minimum 100 credits. A flat 40% platform fee applies. Partner perks are fee-free —{" "}
                <a href="/connect/perks" style={{ color: "var(--ochre)" }}>browse perks</a> instead. Payouts
                are sent within 5 business days of admin approval (48hr hold).
              </p>
            </div>
          </div>
        )
      )}
    </>
  );
}
