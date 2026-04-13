"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
    <div style={s.card}>
      <p style={s.eyebrow}>The Moveee &mdash; Culture Community</p>
      <h1 style={s.heading}>Reset your password</h1>

      {status === "sent" ? (
        <>
          <p style={s.body}>
            If an account exists for <strong>{email}</strong>, you&rsquo;ll receive a reset link
            shortly. Check your spam folder if you don&rsquo;t see it within a few minutes.
          </p>
          <Link href="/login" style={s.link}>
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <p style={s.body}>
            Enter the email address on your account and we&rsquo;ll send you a link to set a new
            password.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div style={s.field}>
              <label style={s.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={s.input}
                disabled={status === "loading"}
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              style={{ ...s.btn, opacity: status === "loading" ? 0.7 : 1 }}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending…" : "Send reset link →"}
            </button>
          </form>
          <p style={s.footer}>
            Remember your password?{" "}
            <Link href="/login" style={s.link}>
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div style={s.page}>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f0e8",
    padding: "40px 24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: 440,
    width: "100%",
    background: "#fffdf8",
    border: "1px solid #e8e0d4",
    borderRadius: 4,
    padding: "40px 40px 32px",
    color: "#14110d",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#7a6f5c",
    margin: "0 0 20px",
  },
  heading: {
    fontSize: 26,
    fontWeight: 300,
    fontFamily: "Georgia, serif",
    margin: "0 0 16px",
    color: "#14110d",
  },
  body: {
    fontSize: 15,
    color: "#7a6f5c",
    lineHeight: 1.6,
    margin: "0 0 24px",
  },
  field: { marginBottom: 18 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#14110d",
    marginBottom: 6,
  },
  input: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d4cbbf",
    borderRadius: 3,
    fontSize: 15,
    color: "#14110d",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "12px 24px",
    background: "#14110d",
    color: "#f5f0e8",
    border: "none",
    borderRadius: 3,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 8,
  },
  footer: {
    fontSize: 13,
    color: "#7a6f5c",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 0,
  },
  link: {
    color: "#14110d",
    textDecoration: "underline",
  },
};
