"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Step = "email" | "code" | "done";

/**
 * Magic-code subscribe + sign-in for the Literary newsletter landing page
 * (app/literary/subscribe). Enter an email, get a 6-digit code, enter it —
 * that's the whole flow. On success it both subscribes the email to
 * GetMeLit and signs the visitor into the website (new account or existing
 * one alike), via Culture_Magic_OTP / the "otpEmail"/"otpCode" branch on
 * the shared NextAuth CredentialsProvider (packages/shared/lib/auth.ts).
 */
export default function LiterarySubscribeForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleRequestCode(e: React.FormEvent) {
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

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter the code we emailed you.");
      return;
    }
    setBusy(true);
    try {
      const result = await signIn("credentials", {
        otpEmail: email,
        otpCode: code.trim(),
        otpList: "getmelit",
        redirect: false,
      });
      if (!result || result.error) {
        setError("That code didn't work — check it and try again.");
        return;
      }
      setStep("done");
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <h1>You&rsquo;re in.</h1>
        <p className="lit-sub">You&rsquo;re subscribed to GetMeLit and signed in to Moveee.</p>
        <p className="lit-form-hint" style={{ marginTop: 24 }}>
          <a href="/literary">Back to The Moveee Literary →</a>
        </p>
      </div>
    );
  }

  return (
    <>
      {step === "email" && (
        <form className="lit-form" onSubmit={handleRequestCode}>
          <div className="lit-form-field">
            <label htmlFor="lit-sub-email">Email address</label>
            <input
              id="lit-sub-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="lit-form-error">{error}</p>}
          <button type="submit" className="lit-form-submit" disabled={busy}>
            {busy ? "Sending…" : "Subscribe →"}
          </button>
          <p className="lit-form-hint">Unsubscribe anytime, from any issue.</p>
        </form>
      )}

      {step === "code" && (
        <form className="lit-form" onSubmit={handleVerifyCode}>
          <p className="lit-form-hint">We sent a code to {email}.</p>
          <div className="lit-form-field">
            <label htmlFor="lit-sub-code">Verification code</label>
            <input
              id="lit-sub-code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="lit-form-error">{error}</p>}
          <button type="submit" className="lit-form-submit" disabled={busy}>
            {busy ? "Confirming…" : "Confirm →"}
          </button>
          <p className="lit-form-hint" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="lit-form-linklike"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
            >
              Use a different email
            </button>
          </p>
        </form>
      )}
    </>
  );
}
