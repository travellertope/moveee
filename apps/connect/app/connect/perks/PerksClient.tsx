"use client";

import { useState } from "react";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";

interface Perk {
  id: number;
  title: string;
  description: string;
  credit_cost: number;
  min_spend: number;
  min_spend_currency: string;
  expiry_days: number;
  max_per_user: number;
  max_total: number;
  redeemed_count: number;
  status: string;
  partner_directory_id: number;
  perk_type?: string;
  airtime_country?: string;
  airtime_amount_local?: number;
}

function currencySymbol(code: string) {
  switch (code) {
    case "GBP": return "£";
    case "USD": return "$";
    case "NGN": return "₦";
    default: return code + " ";
  }
}

function formatMinSpend(amount: number, currency: string) {
  const sym = currencySymbol(currency);
  return `${sym}${(amount / 100).toFixed(amount % 100 === 0 ? 0 : 2)}`;
}

const SITE_URL = typeof window !== "undefined"
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com");

export default function PerksClient({
  perks,
  credits,
  isLoggedIn,
  savedPhone,
}: {
  perks: Perk[];
  credits: number;
  isLoggedIn: boolean;
  savedPhone?: string;
}) {
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [confirmPerk, setConfirmPerk] = useState<Perk | null>(null);
  const [result, setResult] = useState<{
    qr_token?: string;
    expires_at?: string;
    new_balance: number;
    perk_type?: string;
    phone?: string;
    airtime_amount?: number;
    airtime_country?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(credits);
  const [stepUpNeeded, setStepUpNeeded] = useState(false);
  const [stepUpWorking, setStepUpWorking] = useState(false);
  const [pendingPerk, setPendingPerk] = useState<Perk | null>(null);
  const [phoneInput, setPhoneInput] = useState(savedPhone ?? "");

  async function doStepUp(): Promise<string | null> {
    try {
      const optRes = await fetch("/api/auth/passkey/step-up", { method: "POST" });
      if (!optRes.ok) {
        const e = await optRes.json();
        if (e.code === "no_passkey") setStepUpNeeded(true);
        return null;
      }
      const options = await optRes.json();
      const assResp = await startAuthentication({ optionsJSON: options });
      const verRes = await fetch("/api/auth/passkey/step-up-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assResp),
      });
      const verData = await verRes.json();
      if (!verRes.ok) return null;
      return verData.step_up_token as string;
    } catch {
      return null;
    }
  }

  async function handleRedeem(perk: Perk) {
    setRedeeming(perk.id);
    setError("");
    try {
      setStepUpWorking(true);
      const stepUpToken = await doStepUp();
      setStepUpWorking(false);
      if (!stepUpToken) {
        setPendingPerk(perk);
        setRedeeming(null);
        return;
      }

      const isAirtime = perk.perk_type === "airtime";
      const payload: Record<string, unknown> = { perk_id: perk.id, step_up_token: stepUpToken };
      if (isAirtime && phoneInput) payload.phone = phoneInput;

      const res = await fetch("/api/perks/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setConfirmPerk(null);
      } else {
        setResult(data);
        setBalance(data.new_balance ?? balance - perk.credit_cost);
        setConfirmPerk(null);
      }
    } catch {
      setError("Network error. Please try again.");
      setConfirmPerk(null);
      setStepUpWorking(false);
    }
    setRedeeming(null);
  }

  if (perks.length === 0) {
    return (
      <section className="perks-grid-section">
        <div className="perks-empty">
          <p className="perks-empty-title">No perks available yet</p>
          <p className="perks-empty-desc">Partner perks are coming soon. Keep earning credits in the meantime!</p>
        </div>
      </section>
    );
  }

  const qrUrl = result?.qr_token
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${SITE_URL}/api/perks/verify?token=${result.qr_token}`)}`
    : "";

  return (
    <>
      {/* No passkey — prompt to set up */}
      {stepUpNeeded && (
        <div style={{
          background: "rgba(245,166,35,.1)",
          border: "1px solid var(--warning)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          margin: "0 0 20px",
          fontSize: "0.82rem",
          lineHeight: 1.5,
          color: "var(--warning-dark)",
        }}>
          <strong>Passkey required to redeem perks.</strong>{" "}
          <Link href="/member/settings#passkeys" style={{ color: "var(--ochre)" }}>
            Set up a passkey in settings →
          </Link>
        </div>
      )}

      {/* Step-up working state */}
      {stepUpWorking && (
        <div className="perk-stepup-working" style={{
          background: "var(--ink)",
          border: "1px solid var(--ink)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          margin: "0 0 20px",
          fontSize: "0.82rem",
          color: "#fff",
        }}>
          ⬡ Waiting for your device biometrics…
        </div>
      )}

      {/* Success state */}
      {result && (
        <section className="perks-grid-section">
          <div className="perk-success">
            {result.perk_type === "airtime" ? (
              <>
                <h2 className="perk-success-title">Airtime sent!</h2>
                <p className="perk-success-desc" style={{ fontSize: "2rem", margin: "0.5rem 0" }}>📱</p>
                <p className="perk-success-desc">
                  <strong>
                    {result.airtime_country === "NG" ? "₦" : ""}{result.airtime_amount?.toLocaleString()} airtime
                  </strong>{" "}has been sent to <strong>{result.phone}</strong>.
                </p>
                <p className="perk-success-balance">New balance: {result.new_balance} credits</p>
              </>
            ) : (
              <>
                <h2 className="perk-success-title">Perk redeemed!</h2>
                <p className="perk-success-desc">Show this QR code at the partner venue.</p>
                <img src={qrUrl} alt="QR code" className="perk-success-qr" width={200} height={200} />
                {result.expires_at && (
                  <p className="perk-success-expiry">
                    Expires: {new Date(result.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                <p className="perk-success-balance">New balance: {result.new_balance} credits</p>
                <div className="perk-success-actions">
                  <Link href="/member/coupons" className="perks-filter-btn">My Coupons →</Link>
                </div>
              </>
            )}
            <div className="perk-success-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="perks-filter-btn perks-filter-btn--active" onClick={() => setResult(null)}>
                Browse more perks
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Perk grid */}
      {!result && (
        <section className="perks-grid-section">
          <div className="perks-grid">
            {perks.map(perk => {
              const canAfford = balance >= perk.credit_cost;
              const soldOut = perk.max_total > 0 && perk.redeemed_count >= perk.max_total;
              const isAirtime = perk.perk_type === "airtime";
              return (
                <div key={perk.id} className="perk-card">
                  <div className="perk-card-body">
                    <div className="perk-card-cost">{perk.credit_cost} credits</div>
                    {isAirtime && (
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ochre)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
                        📱 Airtime Reward
                      </div>
                    )}
                    <h3 className="perk-card-title">{perk.title}</h3>
                    {perk.description && <p className="perk-card-desc">{perk.description}</p>}
                    {isAirtime && perk.airtime_amount_local ? (
                      <div className="perk-card-meta">
                        <span style={{ fontWeight: 600 }}>
                          {perk.airtime_country === "NG" ? "₦" : ""}{perk.airtime_amount_local.toLocaleString()} airtime
                        </span>
                        <span>Instant delivery</span>
                      </div>
                    ) : (
                      <div className="perk-card-meta">
                        {perk.min_spend > 0 && (
                          <span>Min spend: {formatMinSpend(perk.min_spend, perk.min_spend_currency)}</span>
                        )}
                        <span>Valid {perk.expiry_days} days</span>
                      </div>
                    )}
                    {!isLoggedIn ? (
                      <Link href="/login?callbackUrl=/connect/perks" className="perk-card-btn perk-card-btn--outline">
                        Sign in to redeem
                      </Link>
                    ) : soldOut ? (
                      <span className="perk-card-btn perk-card-btn--disabled">Sold out</span>
                    ) : !canAfford ? (
                      <span className="perk-card-btn perk-card-btn--disabled">Not enough credits</span>
                    ) : (
                      <button
                        type="button"
                        className="perk-card-btn"
                        disabled={redeeming === perk.id || stepUpWorking}
                        onClick={() => setConfirmPerk(perk)}
                      >
                        {redeeming === perk.id && stepUpWorking ? "Verifying…" : redeeming === perk.id ? "Redeeming…" : `Redeem — ${perk.credit_cost} credits`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Confirmation modal */}
      {confirmPerk && (
        <div className="perk-modal-backdrop" onClick={() => setConfirmPerk(null)}>
          <div className="perk-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="perk-modal-close" onClick={() => setConfirmPerk(null)}>✕</button>
            <div className="perk-modal-body">
              <h3 className="perk-modal-title">
                {confirmPerk.perk_type === "airtime" ? "Confirm airtime" : "Confirm redemption"}
              </h3>
              <p className="perk-modal-desc">
                Spend <strong>{confirmPerk.credit_cost} credits</strong> for &ldquo;{confirmPerk.title}&rdquo;?
              </p>
              {confirmPerk.perk_type === "airtime" ? (
                <div style={{ margin: "0.75rem 0" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)", marginBottom: "0.4rem" }}>
                    Phone number (airtime will be sent here)
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="+2348012345678"
                    style={{
                      width: "100%", boxSizing: "border-box",
                      padding: "0.55rem 0.75rem",
                      border: "1.5px solid var(--rule)", borderRadius: "var(--radius-md)",
                      fontSize: "0.9rem", color: "var(--ink)",
                      background: "var(--paper)",
                    }}
                  />
                  <p style={{ fontSize: "0.72rem", color: "var(--mute)", margin: "0.35rem 0 0" }}>
                    Airtime is sent instantly. Your balance after: <strong>{balance - confirmPerk.credit_cost} credits</strong>.
                  </p>
                </div>
              ) : (
                <p className="perk-modal-desc">
                  Your coupon will expire in {confirmPerk.expiry_days} days.
                  Your balance after: <strong>{balance - confirmPerk.credit_cost} credits</strong>.
                </p>
              )}
              {error && <p className="perk-modal-error">{error}</p>}
              <div className="perk-modal-actions">
                <button
                  type="button"
                  className="perk-card-btn"
                  onClick={() => handleRedeem(confirmPerk)}
                  disabled={!!redeeming || (confirmPerk.perk_type === "airtime" && !phoneInput.trim())}
                >
                  {redeeming ? "Processing…" : confirmPerk.perk_type === "airtime" ? "Send airtime" : "Confirm"}
                </button>
                <button type="button" className="perk-card-btn perk-card-btn--outline" onClick={() => setConfirmPerk(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
