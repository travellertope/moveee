"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const key = searchParams.get("key") ?? "";
  const login = searchParams.get("login") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!key || !login) {
    return (
      <div style={s.card}>
        <p style={s.eyebrow}>The Moveee</p>
        <h1 style={s.heading}>Invalid link</h1>
        <p style={s.body}>
          This password-reset link is missing required information. Please request a new one.
        </p>
        <Link href="/" style={s.link} onClick={() => {}}>
          Back to home
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, login, password }),
    });
    const data = await res.json();

    if (data.success) {
      setStatus("done");
      setMessage(data.message ?? "Password updated. Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 2500);
    } else {
      setStatus("error");
      setMessage(data.message ?? "Something went wrong. Please request a new link.");
    }
  }

  return (
    <div style={s.card}>
      <p style={s.eyebrow}>The Moveee &mdash; Culture Community</p>
      <h1 style={s.heading}>Set a new password</h1>

      {status === "done" ? (
        <p style={{ ...s.body, color: "#27ae60" }}>{message}</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div style={s.field}>
            <label style={s.label} htmlFor="pw">New password</label>
            <input
              id="pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={s.input}
              disabled={status === "loading"}
            />
            <span style={s.hint}>At least 8 characters</span>
          </div>
          <div style={s.field}>
            <label style={s.label} htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={s.input}
              disabled={status === "loading"}
            />
          </div>
          {status === "error" && <p style={s.error}>{message}</p>}
          <button
            type="submit"
            style={{ ...s.btn, opacity: status === "loading" ? 0.7 : 1 }}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Updating…" : "Set new password →"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={s.page}>
      <Suspense>
        <ResetForm />
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
    background: "#ffffff",
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
    margin: "0 0 24px",
    color: "#14110d",
  },
  body: { fontSize: 15, color: "#7a6f5c", lineHeight: 1.6, margin: "0 0 20px" },
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
  hint: { display: "block", fontSize: 12, color: "#7a6f5c", marginTop: 4 },
  error: {
    fontSize: 14,
    color: "#c0392b",
    background: "#fef2f2",
    border: "1px solid rgba(192,57,43,.15)",
    borderRadius: 3,
    padding: "10px 14px",
    margin: "0 0 14px",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "12px 24px",
    background: "#14110d",
    color: "#ffffff",
    border: "none",
    borderRadius: 3,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  link: {
    fontSize: 13,
    color: "#14110d",
    textDecoration: "underline",
  },
};
