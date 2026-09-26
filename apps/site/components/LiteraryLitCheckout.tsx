"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Step = "email" | "code";
type Cycle = "monthly" | "yearly";
type Currency = "NGN" | "USD";

interface Props {
  variant: "dark" | "light";
  /** Path (relative to the frontend root) to land on after checkout — see
   * app/literary/lit-welcome/page.tsx. */
  returnPath: string;
  /** Geo-detected server-side (see lib/lit-currency.ts) — no manual
   * switch, no visible currency notice. Nigeria gets NGN, everyone else
   * gets USD. */
  currency: Currency;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyPriceUsd: string;
  yearlyPriceUsd: string;
}

/**
 * Email → code → straight to Paystack checkout for Moveee Lit — no
 * registration form in between. The magic-code step (same mechanism as
 * LiterarySubscribeForm / SubscribeForm) creates or signs into an account
 * from just an email; the moment that session exists, /api/membership/
 * upgrade-init can issue a checkout URL, since it needs nothing else.
 * Any remaining profile details (DOB, country, city, occupation) are
 * collected afterward on the lit-welcome page, not before payment.
 */
export default function LiteraryLitCheckout({
  variant,
  returnPath,
  currency,
  monthlyPrice,
  yearlyPrice,
  monthlyPriceUsd,
  yearlyPriceUsd,
}: Props) {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter/magic-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't send a code. Please try again.");
        return;
      }
      setStep("code");
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter the code we emailed you.");
      return;
    }
    setBusy(true);
    try {
      const signInResult = await signIn("credentials", {
        otpEmail: email,
        otpCode: code.trim(),
        otpList: "getmelit",
        redirect: false,
      });
      if (!signInResult || signInResult.error) {
        setError("That code didn't work — check it and try again.");
        return;
      }

      const res = await fetch("/api/membership/upgrade-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "lit",
          plan_key: `${cycle === "monthly" ? "monthly" : "yearly"}_${currency.toLowerCase()}`,
          return_path: returnPath,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.checkout_url) {
        setError(data?.message || "Couldn't start checkout — try again.");
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`lit-checkout lit-checkout--${variant}`}>
      <div className="lit-checkout-toggle">
        <button
          type="button"
          className={`lit-checkout-tab${cycle === "monthly" ? " lit-checkout-tab--active" : ""}`}
          onClick={() => setCycle("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`lit-checkout-tab${cycle === "yearly" ? " lit-checkout-tab--active" : ""}`}
          onClick={() => setCycle("yearly")}
        >
          Annual
        </button>
      </div>

      <div className="lit-checkout-price">
        <span className="lit-checkout-price-amount">
          {currency === "NGN"
            ? (cycle === "monthly" ? monthlyPrice : yearlyPrice)
            : (cycle === "monthly" ? monthlyPriceUsd : yearlyPriceUsd)}
        </span>
        <span className="lit-checkout-price-cycle">{cycle === "monthly" ? "/ mo" : "/ yr"}</span>
      </div>
      {cycle === "yearly" && <div className="lit-checkout-savings">2 months free vs. paying monthly</div>}

      {step === "email" ? (
        <form className="lit-checkout-form" onSubmit={requestCode}>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="lit-checkout-input"
          />
          <button type="submit" disabled={busy} className="lit-checkout-cta">
            {busy ? "Sending…" : "Continue →"}
          </button>
        </form>
      ) : (
        <form className="lit-checkout-form-wrap" onSubmit={verifyAndCheckout}>
          <p className="lit-checkout-hint">
            We emailed a 6-digit code to {email} — check your inbox (and spam folder) to continue.
          </p>
          <div className="lit-checkout-form">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="000000"
              className="lit-checkout-input lit-checkout-input--code"
            />
            <button type="submit" disabled={busy || code.length < 6} className="lit-checkout-cta">
              {busy ? "Verifying…" : "Continue to checkout →"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="lit-checkout-error">{error}</p>}
      {step === "code" && (
        <button
          type="button"
          className="lit-checkout-linklike"
          onClick={() => {
            setStep("email");
            setCode("");
            setError("");
          }}
        >
          Use a different email
        </button>
      )}

      <div className="lit-checkout-footnote">Cancel anytime · instant access</div>
    </div>
  );
}
