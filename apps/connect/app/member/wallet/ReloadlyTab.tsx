"use client";

import { useState, useEffect, useRef } from "react";

interface Operator {
  operatorId: number;
  name: string;
  logoUrls?: string[];
  minAmount?: number;
  maxAmount?: number;
  denominationType?: "RANGE" | "FIXED";
  fixedAmounts?: number[];
  localFixedAmounts?: number[];
  localDenominationAmounts?: number[];
  minLocalTransactionAmount?: number;
  maxLocalTransactionAmount?: number;
  senderCurrencyCode?: string;
  destinationCurrencyCode?: string;
}

interface GiftCardProduct {
  productId: number;
  productName: string;
  logoUrls?: string[];
  minRecipientDenomination?: number;
  maxRecipientDenomination?: number;
  recipientCurrencyCode?: string;
  denominationType?: "RANGE" | "FIXED";
  fixedRecipientDenominations?: number[];
  redeemInstruction?: { concise?: string; verbose?: string };
}

const AIRTIME_COUNTRIES = [
  { iso: "NG", label: "Nigeria", flag: "🇳🇬", currency: "NGN", symbol: "₦", dialCode: "+234" },
  { iso: "GB", label: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£", dialCode: "+44" },
  { iso: "US", label: "United States", flag: "🇺🇸", currency: "USD", symbol: "$", dialCode: "+1" },
  { iso: "GH", label: "Ghana", flag: "🇬🇭", currency: "GHS", symbol: "₵", dialCode: "+233" },
  { iso: "ZA", label: "South Africa", flag: "🇿🇦", currency: "ZAR", symbol: "R", dialCode: "+27" },
  { iso: "KE", label: "Kenya", flag: "🇰🇪", currency: "KES", symbol: "Ksh", dialCode: "+254" },
];

const GC_COUNTRIES = [
  { iso: "NG", label: "Nigeria", flag: "🇳🇬" },
  { iso: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { iso: "US", label: "United States", flag: "🇺🇸" },
  { iso: "GH", label: "Ghana", flag: "🇬🇭" },
  { iso: "ZA", label: "South Africa", flag: "🇿🇦" },
];

const AIRTIME_PRESETS: Record<string, number[]> = {
  NG: [200, 500, 1000, 2000, 5000],
  GB: [5, 10, 15, 20],
  US: [5, 10, 20, 25],
  GH: [5, 10, 20, 50],
  ZA: [10, 20, 50, 100],
  KE: [50, 100, 200, 500],
};

export default function ReloadlyTab({
  userCredits,
  userEmail,
  creditsPerGbp,
}: {
  userCredits: number;
  userEmail: string;
  creditsPerGbp: number;
}) {
  const [subTab, setSubTab] = useState<"airtime" | "giftcard">("airtime");

  /* ── Airtime state ──────────────────────────────────────────── */
  const [atCountry, setAtCountry]       = useState("NG");
  const [atPhone, setAtPhone]           = useState("");
  const [atOperators, setAtOperators]   = useState<Operator[]>([]);
  const [atOperator, setAtOperator]     = useState<Operator | null>(null);
  const [atAmount, setAtAmount]         = useState<number | null>(null);
  const [atCustomAmt, setAtCustomAmt]   = useState("");
  const [atLoading, setAtLoading]       = useState(false);
  const [atDetecting, setAtDetecting]   = useState(false);
  const [atSubmitting, setAtSubmitting] = useState(false);
  const [atResult, setAtResult]         = useState<{ success: boolean; message: string } | null>(null);
  const [atError, setAtError]           = useState("");
  const [currentCredits, setCurrentCredits] = useState(userCredits);

  /* ── Gift card state ────────────────────────────────────────── */
  const [gcCountry, setGcCountry]         = useState("NG");
  const [gcProducts, setGcProducts]       = useState<GiftCardProduct[]>([]);
  const [gcProduct, setGcProduct]         = useState<GiftCardProduct | null>(null);
  const [gcAmount, setGcAmount]           = useState<number | null>(null);
  const [gcCustomAmt, setGcCustomAmt]     = useState("");
  const [gcEmail, setGcEmail]             = useState(userEmail);
  const [gcLoading, setGcLoading]         = useState(false);
  const [gcSubmitting, setGcSubmitting]   = useState(false);
  const [gcResult, setGcResult]           = useState<{ success: boolean; message: string; code?: string; pin?: string } | null>(null);
  const [gcError, setGcError]             = useState("");

  const phoneRef = useRef<HTMLInputElement>(null);

  /* ── Credit cost helpers ────────────────────────────────────── */
  function creditCostForAirtime(amount: number, countryIso: string): number {
    const c = AIRTIME_COUNTRIES.find(x => x.iso === countryIso);
    if (!c) return Math.ceil(amount * (creditsPerGbp / 100));
    switch (c.currency) {
      case "NGN": return Math.ceil((amount / 1000) * Math.round(creditsPerGbp * 0.55));
      case "GBP": return Math.ceil(amount * creditsPerGbp);
      case "USD": return Math.ceil(amount * Math.round(creditsPerGbp * 0.75));
      default:    return Math.ceil(amount * Math.round(creditsPerGbp * 0.75));
    }
  }

  function creditCostForGC(amount: number, currencyCode: string): number {
    switch (currencyCode) {
      case "GBP": return Math.ceil(amount * creditsPerGbp);
      case "USD": return Math.ceil(amount * Math.round(creditsPerGbp * 0.75));
      case "NGN": return Math.ceil((amount / 1000) * Math.round(creditsPerGbp * 0.55));
      default:    return Math.ceil(amount * Math.round(creditsPerGbp * 0.75));
    }
  }

  /* ── Airtime: detect operator on phone blur ─────────────────── */
  async function detectOperator() {
    const dial = AIRTIME_COUNTRIES.find(x => x.iso === atCountry)?.dialCode ?? "";
    const normalized = atPhone.startsWith("+") ? atPhone : dial + atPhone.replace(/^0/, "");
    if (normalized.length < 8) return;

    setAtDetecting(true);
    setAtOperator(null);
    setAtOperators([]);
    setAtError("");
    try {
      const res = await fetch(
        `/api/wallet/reloadly-operators?country_iso=${atCountry}&phone=${encodeURIComponent(normalized)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setAtError(data.message || "Could not detect operator — please select manually.");
        const fallbackRes = await fetch(`/api/wallet/reloadly-operators?country_iso=${atCountry}`);
        const fallbackData = await fallbackRes.json();
        const list: Operator[] = fallbackData.content ?? fallbackData ?? [];
        setAtOperators(list);
        return;
      }
      // auto-detect returns a single operator object
      if (data.operatorId) {
        setAtOperator(data);
      } else {
        const list: Operator[] = data.content ?? data ?? [];
        setAtOperators(list);
      }
    } catch {
      setAtError("Network error. Please try again.");
    } finally {
      setAtDetecting(false);
    }
  }

  /* ── Airtime: load operator list for country ────────────────── */
  async function loadOperators() {
    setAtLoading(true);
    setAtOperator(null);
    setAtOperators([]);
    try {
      const res = await fetch(`/api/wallet/reloadly-operators?country_iso=${atCountry}`);
      const data = await res.json();
      setAtOperators(data.content ?? data ?? []);
    } catch { /* non-fatal */ }
    finally { setAtLoading(false); }
  }

  useEffect(() => {
    if (!atPhone) loadOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atCountry]);

  /* ── Airtime: submit top-up ─────────────────────────────────── */
  async function submitTopup() {
    const finalAmount = atAmount ?? parseFloat(atCustomAmt);
    if (!atOperator || !finalAmount || finalAmount <= 0 || !atPhone) return;

    const dial = AIRTIME_COUNTRIES.find(x => x.iso === atCountry)?.dialCode ?? "";
    const normalized = atPhone.startsWith("+") ? atPhone : dial + atPhone.replace(/^0/, "");
    const cost = creditCostForAirtime(finalAmount, atCountry);

    if (currentCredits < cost) {
      setAtError(`You need ${cost} credits but only have ${currentCredits}.`);
      return;
    }

    setAtSubmitting(true);
    setAtError("");
    try {
      const res = await fetch("/api/wallet/reloadly-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator_id: atOperator.operatorId,
          amount:      finalAmount,
          currency:    AIRTIME_COUNTRIES.find(x => x.iso === atCountry)?.currency ?? "NGN",
          phone:       normalized,
          country_iso: atCountry,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentCredits(data.new_balance ?? (currentCredits - cost));
        setAtResult({ success: true, message: `Top-up sent! ${cost} credits deducted.` });
      } else {
        setAtError(data.error || data.message || "Top-up failed. Please try again.");
      }
    } catch {
      setAtError("Network error. Please try again.");
    } finally {
      setAtSubmitting(false);
    }
  }

  /* ── Gift cards: load products ──────────────────────────────── */
  async function loadGCProducts() {
    setGcLoading(true);
    setGcProduct(null);
    setGcProducts([]);
    setGcAmount(null);
    setGcCustomAmt("");
    try {
      const res = await fetch(`/api/wallet/reloadly-products?country_iso=${gcCountry}`);
      const data = await res.json();
      const list: GiftCardProduct[] = data.content ?? data ?? [];
      setGcProducts(list.slice(0, 30));
    } catch { /* non-fatal */ }
    finally { setGcLoading(false); }
  }

  useEffect(() => { loadGCProducts(); }, [gcCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Gift cards: submit order ───────────────────────────────── */
  async function submitGiftCard() {
    const finalAmount = gcAmount ?? parseFloat(gcCustomAmt);
    if (!gcProduct || !finalAmount || finalAmount <= 0 || !gcEmail) return;

    const currency = gcProduct.recipientCurrencyCode ?? "USD";
    const cost = creditCostForGC(finalAmount, currency);

    if (currentCredits < cost) {
      setGcError(`You need ${cost} credits but only have ${currentCredits}.`);
      return;
    }

    setGcSubmitting(true);
    setGcError("");
    try {
      const res = await fetch("/api/wallet/reloadly-giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: gcProduct.productId,
          amount:     finalAmount,
          currency,
          email:      gcEmail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentCredits(data.new_balance ?? (currentCredits - cost));
        setGcResult({
          success: true,
          message: `Gift card ordered! ${cost} credits deducted. Code sent to ${gcEmail}.`,
          code:    data.redeemCode ?? data.cardNumber ?? undefined,
          pin:     data.pinCode ?? undefined,
        });
      } else {
        setGcError(data.error || data.message || "Order failed. Please try again.");
      }
    } catch {
      setGcError("Network error. Please try again.");
    } finally {
      setGcSubmitting(false);
    }
  }

  /* ── Shared helpers ─────────────────────────────────────────── */
  const atCountryInfo = AIRTIME_COUNTRIES.find(x => x.iso === atCountry)!;
  const atFinalAmt    = atAmount ?? (atCustomAmt ? parseFloat(atCustomAmt) : null);
  const atCost        = atFinalAmt ? creditCostForAirtime(atFinalAmt, atCountry) : 0;
  const atCanSubmit   = !atSubmitting && !!atOperator && !!atFinalAmt && atFinalAmt > 0 && atPhone.length >= 6 && currentCredits >= atCost;

  const gcFinalAmt = gcAmount ?? (gcCustomAmt ? parseFloat(gcCustomAmt) : null);
  const gcCurrency = gcProduct?.recipientCurrencyCode ?? "USD";
  const gcCost     = gcFinalAmt ? creditCostForGC(gcFinalAmt, gcCurrency) : 0;
  const gcCanSubmit = !gcSubmitting && !!gcProduct && !!gcFinalAmt && gcFinalAmt > 0 && !!gcEmail && currentCredits >= gcCost;

  return (
    <div className="rl-wrap">

      {/* Live credit balance badge */}
      <div className="rl-balance-bar">
        <span className="rl-balance-label">Your balance</span>
        <span className="rl-balance-val">{currentCredits} Cr</span>
      </div>

      {/* Sub-tab switcher */}
      <div className="rl-subtabs">
        <button
          type="button"
          onClick={() => setSubTab("airtime")}
          className={`rl-subtab${subTab === "airtime" ? " rl-subtab--active" : ""}`}
        >
          📱 Airtime &amp; Data
        </button>
        <button
          type="button"
          onClick={() => setSubTab("giftcard")}
          className={`rl-subtab${subTab === "giftcard" ? " rl-subtab--active" : ""}`}
        >
          🎁 Gift Cards
        </button>
      </div>

      {/* ── AIRTIME TAB ────────────────────────────────────────── */}
      {subTab === "airtime" && (
        atResult ? (
          <div className={`rl-result ${atResult.success ? "rl-result--ok" : "rl-result--err"}`}>
            <p>{atResult.message}</p>
            <button
              type="button"
              className="rl-result-reset"
              onClick={() => { setAtResult(null); setAtPhone(""); setAtAmount(null); setAtCustomAmt(""); }}
            >
              Send another top-up
            </button>
          </div>
        ) : (
          <div className="rl-section">

            {/* Country */}
            <div className="rl-field">
              <label className="rl-label">Country</label>
              <div className="rl-country-row">
                {AIRTIME_COUNTRIES.map(c => (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => { setAtCountry(c.iso); setAtPhone(""); setAtOperator(null); setAtAmount(null); }}
                    className={`rl-country-chip${atCountry === c.iso ? " rl-country-chip--active" : ""}`}
                  >
                    {c.flag} {c.iso}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div className="rl-field">
              <label className="rl-label">Phone number</label>
              <div className="rl-phone-row">
                <span className="rl-dial-code">{atCountryInfo.dialCode}</span>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={atPhone}
                  onChange={e => { setAtPhone(e.target.value); setAtOperator(null); }}
                  onBlur={detectOperator}
                  placeholder="e.g. 08012345678"
                  className="rl-input rl-input--phone"
                />
                {atDetecting && <span className="rl-detecting">detecting…</span>}
              </div>
              {!atOperator && atOperators.length === 0 && !atDetecting && !atLoading && (
                <p className="rl-hint">Enter number to auto-detect operator</p>
              )}
            </div>

            {/* Operator */}
            {(atOperator || atOperators.length > 0) && (
              <div className="rl-field">
                <label className="rl-label">Operator</label>
                {atOperator ? (
                  <div className="rl-operator-detected">
                    {atOperator.logoUrls?.[0] && (
                      <img src={atOperator.logoUrls[0]} alt="" className="rl-operator-logo" />
                    )}
                    <span>{atOperator.name}</span>
                    <button type="button" className="rl-change-link" onClick={() => { setAtOperator(null); loadOperators(); }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <select
                    className="rl-input"
                    value={atOperator ? (atOperator as Operator).operatorId : ""}
                    onChange={e => {
                      const op = atOperators.find(o => o.operatorId === parseInt(e.target.value));
                      setAtOperator(op ?? null);
                    }}
                  >
                    <option value="">Select operator…</option>
                    {atOperators.map(o => (
                      <option key={o.operatorId} value={o.operatorId}>{o.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {atLoading && <p className="rl-loading">Loading operators…</p>}

            {/* Amount */}
            {atOperator && (
              <div className="rl-field">
                <label className="rl-label">Amount ({atCountryInfo.symbol})</label>
                <div className="rl-preset-row">
                  {(AIRTIME_PRESETS[atCountry] ?? [5, 10, 20, 50]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setAtAmount(p); setAtCustomAmt(""); }}
                      className={`rl-preset${atAmount === p ? " rl-preset--active" : ""}`}
                    >
                      {atCountryInfo.symbol}{p.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setAtAmount(null); setTimeout(() => document.getElementById("at-custom")?.focus(), 50); }}
                    className={`rl-preset${atAmount === null && atCustomAmt ? " rl-preset--active" : ""}`}
                  >
                    Other
                  </button>
                </div>
                {(atAmount === null) && (
                  <input
                    id="at-custom"
                    type="number"
                    value={atCustomAmt}
                    onChange={e => setAtCustomAmt(e.target.value)}
                    placeholder={`Amount in ${atCountryInfo.symbol}`}
                    className="rl-input"
                    style={{ marginTop: 8 }}
                    min={atOperator.minLocalTransactionAmount ?? 1}
                    max={atOperator.maxLocalTransactionAmount ?? 99999}
                  />
                )}
              </div>
            )}

            {/* Cost preview */}
            {atFinalAmt !== null && atFinalAmt > 0 && atOperator && (
              <div className="rl-cost-box">
                <div className="rl-cost-row">
                  <span>Top-up amount</span>
                  <span>{atCountryInfo.symbol}{atFinalAmt.toLocaleString()}</span>
                </div>
                <div className="rl-cost-row rl-cost-row--total">
                  <span>Credits required</span>
                  <span className={currentCredits < atCost ? "rl-cost-overdrawn" : ""}>{atCost} Cr</span>
                </div>
                {currentCredits < atCost && (
                  <p className="rl-cost-warn">You need {atCost - currentCredits} more credits.</p>
                )}
              </div>
            )}

            {atError && <p className="rl-error">{atError}</p>}

            <button
              type="button"
              onClick={submitTopup}
              disabled={!atCanSubmit}
              className="rl-submit"
            >
              {atSubmitting ? "Sending top-up…" : `Send ${atFinalAmt ? atCountryInfo.symbol + atFinalAmt.toLocaleString() : "top-up"} (${atCost} Cr)`}
            </button>
          </div>
        )
      )}

      {/* ── GIFT CARDS TAB ─────────────────────────────────────── */}
      {subTab === "giftcard" && (
        gcResult ? (
          <div className={`rl-result ${gcResult.success ? "rl-result--ok" : "rl-result--err"}`}>
            <p>{gcResult.message}</p>
            {gcResult.code && (
              <div className="rl-gc-code-box">
                <div className="rl-gc-code-label">Redeem code</div>
                <div className="rl-gc-code">{gcResult.code}</div>
                {gcResult.pin && (
                  <>
                    <div className="rl-gc-code-label" style={{ marginTop: 8 }}>PIN</div>
                    <div className="rl-gc-code">{gcResult.pin}</div>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              className="rl-result-reset"
              onClick={() => { setGcResult(null); setGcProduct(null); setGcAmount(null); setGcCustomAmt(""); }}
            >
              Order another gift card
            </button>
          </div>
        ) : (
          <div className="rl-section">

            {/* Country */}
            <div className="rl-field">
              <label className="rl-label">Country</label>
              <div className="rl-country-row">
                {GC_COUNTRIES.map(c => (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => { setGcCountry(c.iso); setGcProduct(null); setGcAmount(null); }}
                    className={`rl-country-chip${gcCountry === c.iso ? " rl-country-chip--active" : ""}`}
                  >
                    {c.flag} {c.iso}
                  </button>
                ))}
              </div>
            </div>

            {/* Product list */}
            {gcLoading ? (
              <p className="rl-loading">Loading gift cards…</p>
            ) : gcProducts.length === 0 ? (
              <p className="rl-hint">No gift cards available for this country right now.</p>
            ) : (
              <div className="rl-field">
                <label className="rl-label">Choose a gift card</label>
                <div className="rl-gc-grid">
                  {gcProducts.map(p => (
                    <button
                      key={p.productId}
                      type="button"
                      onClick={() => { setGcProduct(p); setGcAmount(null); setGcCustomAmt(""); }}
                      className={`rl-gc-card${gcProduct?.productId === p.productId ? " rl-gc-card--active" : ""}`}
                    >
                      {p.logoUrls?.[0] ? (
                        <img src={p.logoUrls[0]} alt={p.productName} className="rl-gc-logo" />
                      ) : (
                        <div className="rl-gc-logo-placeholder">🎁</div>
                      )}
                      <span className="rl-gc-name">{p.productName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount */}
            {gcProduct && (
              <div className="rl-field">
                <label className="rl-label">
                  Amount ({gcProduct.recipientCurrencyCode ?? "local currency"})
                </label>
                {gcProduct.denominationType === "FIXED" && gcProduct.fixedRecipientDenominations?.length ? (
                  <div className="rl-preset-row">
                    {gcProduct.fixedRecipientDenominations.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setGcAmount(d); setGcCustomAmt(""); }}
                        className={`rl-preset${gcAmount === d ? " rl-preset--active" : ""}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="number"
                    value={gcCustomAmt}
                    onChange={e => { setGcCustomAmt(e.target.value); setGcAmount(null); }}
                    placeholder={`${gcProduct.minRecipientDenomination ?? 1} – ${gcProduct.maxRecipientDenomination ?? "max"}`}
                    className="rl-input"
                    min={gcProduct.minRecipientDenomination ?? 1}
                    max={gcProduct.maxRecipientDenomination}
                  />
                )}
              </div>
            )}

            {/* Recipient email */}
            {gcProduct && (
              <div className="rl-field">
                <label className="rl-label">Delivery email</label>
                <input
                  type="email"
                  value={gcEmail}
                  onChange={e => setGcEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="rl-input"
                />
                <p className="rl-hint">The code will be emailed here</p>
              </div>
            )}

            {/* Cost preview */}
            {gcFinalAmt !== null && gcFinalAmt > 0 && gcProduct && (
              <div className="rl-cost-box">
                <div className="rl-cost-row">
                  <span>{gcProduct.productName}</span>
                  <span>{gcFinalAmt} {gcCurrency}</span>
                </div>
                <div className="rl-cost-row rl-cost-row--total">
                  <span>Credits required</span>
                  <span className={currentCredits < gcCost ? "rl-cost-overdrawn" : ""}>{gcCost} Cr</span>
                </div>
                {currentCredits < gcCost && (
                  <p className="rl-cost-warn">You need {gcCost - currentCredits} more credits.</p>
                )}
              </div>
            )}

            {gcProduct?.redeemInstruction?.concise && (
              <p className="rl-hint" style={{ marginTop: 4 }}>{gcProduct.redeemInstruction.concise}</p>
            )}

            {gcError && <p className="rl-error">{gcError}</p>}

            <button
              type="button"
              onClick={submitGiftCard}
              disabled={!gcCanSubmit}
              className="rl-submit"
            >
              {gcSubmitting ? "Ordering…" : `Order gift card (${gcCost} Cr)`}
            </button>
          </div>
        )
      )}
    </div>
  );
}
