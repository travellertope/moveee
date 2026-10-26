"use client";

import { useState } from "react";

// Flutterwave bank codes for NGN transfers
const NGN_BANKS: { name: string; code: string }[] = [
  { name: "Access Bank",                       code: "044" },
  { name: "Citibank Nigeria",                  code: "023" },
  { name: "Ecobank Nigeria",                   code: "050" },
  { name: "Fidelity Bank",                     code: "070" },
  { name: "First Bank of Nigeria",             code: "011" },
  { name: "First City Monument Bank (FCMB)",   code: "214" },
  { name: "Globus Bank",                       code: "103" },
  { name: "Guaranty Trust Bank (GTBank)",      code: "058" },
  { name: "Heritage Bank",                     code: "030" },
  { name: "Keystone Bank",                     code: "082" },
  { name: "Lotus Bank",                        code: "303" },
  { name: "Polaris Bank",                      code: "076" },
  { name: "Providus Bank",                     code: "101" },
  { name: "Stanbic IBTC Bank",                 code: "221" },
  { name: "Standard Chartered",               code: "068" },
  { name: "Sterling Bank",                     code: "232" },
  { name: "SunTrust Bank",                     code: "100" },
  { name: "Titan Trust Bank",                  code: "102" },
  { name: "Union Bank of Nigeria",             code: "032" },
  { name: "United Bank for Africa (UBA)",      code: "033" },
  { name: "Unity Bank",                        code: "215" },
  { name: "Wema Bank",                         code: "035" },
  { name: "Zenith Bank",                       code: "057" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(amount: number | string, currency: string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

interface EarningRow {
  id: number;
  event_id: number;
  rsvp_id: number;
  payment_reference: string;
  gross_amount: string;
  platform_fee: string;
  net_amount: string;
  currency: string;
  status: string;
  created_at: string;
  event_title?: string;
}

interface BalanceEntry {
  available: number;
  paid_out: number;
}

interface Props {
  balance: Record<string, BalanceEntry>;
  history: EarningRow[];
  total: number;
  feeRate: number;
}

export default function EarningsClient({ balance, history, total, feeRate }: Props) {
  const [tab, setTab] = useState<"overview" | "history" | "payout">("overview");

  // Payout form state
  const [amount, setAmount]             = useState("");
  const [bankCode, setBankCode]         = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [result, setResult]             = useState<{ success: boolean; message: string } | null>(null);

  const ngnBalance = balance["NGN"] ?? { available: 0, paid_out: 0 };
  const amountNum  = parseFloat(amount) || 0;
  const formValid  = amountNum > 0 && amountNum <= ngnBalance.available && bankCode && accountNumber.trim() && accountName.trim();

  async function handlePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/creator/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          currency: "NGN",
          bank_code: bankCode,
          account_number: accountNumber.trim(),
          account_name: accountName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "Payout request submitted. We'll process it within 1–2 business days." });
        setAmount(""); setBankCode(""); setAccountNumber(""); setAccountName("");
      } else {
        setResult({ success: false, message: data.error ?? data.message ?? "Something went wrong." });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const platformFeePercent = Math.round(feeRate * 100);

  return (
    <div>
      {/* Tabs */}
      <div className="wal-tabs">
        <button className={`wal-tab${tab === "overview" ? " wal-tab--active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`wal-tab${tab === "history"  ? " wal-tab--active" : ""}`} onClick={() => setTab("history")}>Earnings History</button>
        <button className={`wal-tab${tab === "payout"   ? " wal-tab--active" : ""}`} onClick={() => setTab("payout")}>Request Payout</button>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div>
          {Object.keys(balance).length === 0 ? (
            <div className="wal-empty">
              <p>No earnings yet. Once attendees pay for your events, your earnings will appear here.</p>
            </div>
          ) : (
            Object.entries(balance).map(([currency, b]) => (
              <div key={currency} className="wal-stat-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="wal-stat-card">
                  <span className="wal-stat-label">Available ({currency})</span>
                  <span className="wal-stat-value">{formatAmount(b.available, currency)}</span>
                </div>
                <div className="wal-stat-card">
                  <span className="wal-stat-label">Paid Out ({currency})</span>
                  <span className="wal-stat-value">{formatAmount(b.paid_out, currency)}</span>
                </div>
                <div className="wal-stat-card">
                  <span className="wal-stat-label">Total Earned ({currency})</span>
                  <span className="wal-stat-value">{formatAmount(b.available + b.paid_out, currency)}</span>
                </div>
              </div>
            ))
          )}
          <p className="wal-footnote">
            Moveee retains a {platformFeePercent}% platform fee on each paid RSVP. The amounts shown are your net earnings after the fee.
          </p>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div className="wal-empty">
              <p>No earnings recorded yet.</p>
            </div>
          ) : (
            <ul className="wal-list">
              {history.map(row => (
                <li key={row.id} className="wal-entry">
                  <div className="wal-entry-left">
                    <span className="wal-entry-label">{row.event_title ?? `Event #${row.event_id}`}</span>
                    <span className="wal-entry-meta">{formatDate(row.created_at)} · Ref: {row.payment_reference}</span>
                  </div>
                  <div className="wal-entry-right">
                    <span className={`wal-entry-amount${row.status === "paid_out" ? " wal-entry-amount--dim" : ""}`}>
                      +{formatAmount(row.net_amount, row.currency)}
                    </span>
                    <span className={`wal-entry-status wal-entry-status--${row.status}`}>
                      {row.status === "available" ? "Available" : row.status === "paid_out" ? "Paid out" : row.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {total > history.length && (
            <p className="wal-footnote">Showing {history.length} of {total} earnings.</p>
          )}
        </div>
      )}

      {/* Payout */}
      {tab === "payout" && (
        <div>
          <div className="wal-stat-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="wal-stat-card">
              <span className="wal-stat-label">Available (NGN)</span>
              <span className="wal-stat-value">{formatAmount(ngnBalance.available, "NGN")}</span>
            </div>
          </div>

          {ngnBalance.available <= 0 ? (
            <div className="wal-empty">
              <p>You have no available NGN balance to withdraw.</p>
            </div>
          ) : (
            <form className="wal-cashout-form" onSubmit={handlePayout}>
              <div className="wal-field">
                <label className="wal-label" htmlFor="ern-amount">Amount (NGN)</label>
                <input
                  id="ern-amount"
                  className="wal-input"
                  type="number"
                  min="1"
                  max={ngnBalance.available}
                  step="0.01"
                  placeholder={`Max: ${formatAmount(ngnBalance.available, "NGN")}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="wal-field">
                <label className="wal-label" htmlFor="ern-bank">Bank</label>
                <select
                  id="ern-bank"
                  className="wal-input"
                  value={bankCode}
                  onChange={e => setBankCode(e.target.value)}
                  required
                >
                  <option value="">Select your bank</option>
                  {NGN_BANKS.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="wal-field">
                <label className="wal-label" htmlFor="ern-account-num">Account Number (NUBAN)</label>
                <input
                  id="ern-account-num"
                  className="wal-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit account number"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="wal-field">
                <label className="wal-label" htmlFor="ern-account-name">Account Name</label>
                <input
                  id="ern-account-name"
                  className="wal-input"
                  type="text"
                  placeholder="Name on account"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  required
                />
              </div>

              {result && (
                <p className={`wal-result${result.success ? "" : " wal-result--error"}`}>{result.message}</p>
              )}

              <button
                type="submit"
                className="wal-submit-btn"
                disabled={!formValid || submitting}
              >
                {submitting ? "Submitting…" : "Request Payout"}
              </button>

              <p className="wal-footnote">
                Payouts are processed manually within 1–2 business days. Only NGN withdrawals are supported at this time.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
