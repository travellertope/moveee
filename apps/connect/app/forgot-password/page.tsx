"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "../auth.css";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(prefillEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // always show success to avoid enumeration
    }

    setStatus("sent");
  }

  return (
    <div className="auth-card">
      <h1 className="auth-heading">Reset your password</h1>

      {status === "sent" ? (
        <>
          <p className="auth-sub">
            If an account exists for <strong>{email}</strong>, you&rsquo;ll receive a reset link
            shortly. Check your spam folder if you don&rsquo;t see it within a few minutes.
          </p>
          <Link href="/login" className="auth-link">Back to sign in</Link>
        </>
      ) : (
        <>
          <p className="auth-sub">
            Enter the email address on your account and we&rsquo;ll send you a link to set a new
            password.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                disabled={status === "loading"}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="auth-btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "Sending…" : "Send reset link →"}
            </button>
          </form>
          <div className="auth-footer">
            <p>Remember your password? <Link href="/login" className="auth-link">Sign in</Link></p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
