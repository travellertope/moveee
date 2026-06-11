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
}: {
  perks: Perk[];
  credits: number;
  isLoggedIn: boolean;
}) {
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [confirmPerk, setConfirmPerk] = useState<Perk | null>(null);
  const [result, setResult] = useState<{ qr_token: string; expires_at: string; new_balance: number } | null>(null);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(credits);
  const [stepUpNeeded, setStepUpNeeded] = useState(false);
  const [stepUpWorking, setStepUpWorking] = useState(false);
  const [pendingPerk, setPendingPerk] = useState<Perk | null>(null);

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

      const res = await fetch("/api/perks/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perk_id: perk.id, step_up_token: stepUpToken }),
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

  const qrUrl = result
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${SITE_URL}/api/perks/verify?token=${result.qr_token}`)}`
    : "";

  return (
    <>
      {/* No passkey — prompt to set up */}
      {stepUpNeeded && (
        <div style={{
          background: "rgba(179,130,56,.08)",
          border: "1px solid rgba(179,130,56,.25)",
          borderRadius: 6,
          padding: "14px 18px",
          margin: "0 0 20px",
          fontSize: "0.82rem",
          lineHeight: 1.5,
        }}>
          <strong>Passkey required to redeem perks.</strong>{" "}
          <Link href="/member/settings#passkeys" style={{ color: "var(--ochre)" }}>
            Set up a passkey in settings →
          </Link>
        </div>
      )}

      {/* Step-up working state */}
      {stepUpWorking && (
        <div style={{
          background: "rgba(42,36,28,.04)",
          border: "1px solid rgba(42,36,28,.1)",
          borderRadius: 6,
          padding: "14px 18px",
          margin: "0 0 20px",
          fontSize: "0.82rem",
          color: "var(--ochre)",
        }}>
          ⬡ Waiting for your device biometrics…
        </div>
      )}

      {/* Success state */}
      {result && (
        <section className="perks-grid-section">
          <div className="perk-success">
            <h2 className="perk-success-title">Perk redeemed!</h2>
            <p className="perk-success-desc">Show this QR code at the partner venue.</p>
            <img src={qrUrl} alt="QR code" className="perk-success-qr" width={200} height={200} />
            <p className="perk-success-expiry">
              Expires: {new Date(result.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="perk-success-balance">New balance: {result.new_balance} credits</p>
            <div className="perk-success-actions">
              <button type="button" className="perks-filter-btn perks-filter-btn--active" onClick={() => setResult(null)}>
                Browse more perks
              </button>
              <Link href="/member/coupons" className="perks-filter-btn">My Coupons →</Link>
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
              return (
                <div key={perk.id} className="perk-card">
                  <div className="perk-card-body">
                    <div className="perk-card-cost">{perk.credit_cost} credits</div>
                    <h3 className="perk-card-title">{perk.title}</h3>
                    {perk.description && <p className="perk-card-desc">{perk.description}</p>}
                    <div className="perk-card-meta">
                      {perk.min_spend > 0 && (
                        <span>Min spend: {formatMinSpend(perk.min_spend, perk.min_spend_currency)}</span>
                      )}
                      <span>Valid {perk.expiry_days} days</span>
                    </div>
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
              <h3 className="perk-modal-title">Confirm redemption</h3>
              <p className="perk-modal-desc">
                Spend <strong>{confirmPerk.credit_cost} credits</strong> for &ldquo;{confirmPerk.title}&rdquo;?
              </p>
              <p className="perk-modal-desc">
                Your coupon will expire in {confirmPerk.expiry_days} days.
                Your balance after: <strong>{balance - confirmPerk.credit_cost} credits</strong>.
              </p>
              {error && <p className="perk-modal-error">{error}</p>}
              <div className="perk-modal-actions">
                <button type="button" className="perk-card-btn" onClick={() => handleRedeem(confirmPerk)} disabled={!!redeeming}>
                  {redeeming ? "Processing…" : "Confirm"}
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
