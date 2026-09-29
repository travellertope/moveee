"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * The email → 6-digit-code flow that /login and /register both lead with.
 *
 * One component serves both pages because WordPress makes no distinction:
 * Culture_Magic_OTP::verify_otp() finds-or-creates the account, so the same
 * two taps sign an existing member in and register a new one. Only the copy
 * around it differs, which is what the props are for.
 *
 * Step 1 posts to /api/auth/magic-otp/request. Step 2 does NOT go through a
 * proxy — it calls signIn("credentials", { otpEmail, otpCode }) so next-auth
 * establishes the session itself; authorize() in packages/shared/lib/auth.ts
 * is what actually reaches WordPress. See that file's OTP branch.
 *
 * otpList is deliberately sent as "" — the code is a credential here, not a
 * newsletter opt-in, and an explicitly-empty list tells WordPress to skip
 * subscribing. Don't pass a real slug from an auth page.
 */
export default function MagicCodeSignIn({
  callbackUrl,
  referral = "",
  emailLabel = "Email",
  submitLabel = "Continue",
  autoFocus = false,
}: {
  callbackUrl: string;
  referral?: string;
  emailLabel?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Move focus to the code box as soon as it appears, so the flow is
  // type-email → enter → type-code with no pointer use in between.
  useEffect(() => {
    if (stage === "code") codeRef.current?.focus();
  }, [stage]);

  // WordPress rate-limits to 3 requests per 10 minutes per address; this
  // countdown keeps someone from burning all three on impatient taps.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function finish() {
    // A callbackUrl from another origin (e.g. themoveee.com/stoop) can't be
    // handed to the client router — same check the password path uses.
    if (callbackUrl.startsWith("http")) {
      window.location.href = callbackUrl;
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function requestCode(addr: string, isResend = false) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addr }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't send a code — try again.");
        return false;
      }
      setResendIn(30);
      if (isResend) setNotice("A new code is on its way.");
      return true;
    } catch {
      setError("Couldn't reach the server — check your connection.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const addr = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setError("Enter a valid email address.");
      return;
    }
    setNotice("");
    if (await requestCode(addr)) setStage("code");
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const entered = code.replace(/\D/g, "");
    if (entered.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);

    const result = await signIn("credentials", {
      otpEmail: email.trim(),
      otpCode: entered,
      otpList: "",
      otpReferral: referral,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      // authorize() returns null for every failure mode WordPress reports
      // (wrong code, expired, too many attempts), so there is no more
      // specific message to surface here than this.
      setError("That code didn't work. Check it, or send a new one.");
      return;
    }
    finish();
  }

  if (stage === "code") {
    return (
      <form onSubmit={handleCodeSubmit} noValidate>
        <p className="auth-code-sent">
          We sent a 6-digit code to <b>{email.trim()}</b>
        </p>

        <div className="auth-field">
          <label htmlFor="otp-code" className="auth-label">
            Your code
          </label>
          <input
            id="otp-code"
            ref={codeRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`auth-input auth-input--code${error ? " auth-input--error" : ""}`}
            disabled={loading}
          />
        </div>

        {error && <p className="auth-error">{error}</p>}
        {notice && !error && <p className="auth-notice">{notice}</p>}

        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? "Checking…" : "Continue →"}
        </button>

        <div className="auth-code-actions">
          <button
            type="button"
            className="auth-footer-btn"
            disabled={loading || resendIn > 0}
            onClick={() => requestCode(email.trim(), true)}
          >
            {resendIn > 0 ? `Resend in ${resendIn}s` : "Send a new code"}
          </button>
          <button
            type="button"
            className="auth-footer-btn"
            disabled={loading}
            onClick={() => {
              setStage("email");
              setCode("");
              setError("");
              setNotice("");
            }}
          >
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} noValidate>
      <div className="auth-field">
        <label htmlFor="otp-email" className="auth-label">
          {emailLabel}
        </label>
        <input
          id="otp-email"
          type="email"
          autoComplete="email"
          autoFocus={autoFocus}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`auth-input${error ? " auth-input--error" : ""}`}
          disabled={loading}
        />
      </div>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="auth-btn-primary" disabled={loading}>
        {loading ? "Sending a code…" : `${submitLabel} →`}
      </button>
    </form>
  );
}
