"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import "../auth.css";

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
      <div className="auth-card">
        <h1 className="auth-heading">Invalid link</h1>
        <p className="auth-sub">
          This password-reset link is missing required information. Please request a new one.
        </p>
        <Link href="/" className="auth-link">Back to home</Link>
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
    <div className="auth-card">
      <h1 className="auth-heading">Set a new password</h1>

      {status === "done" ? (
        <p className="auth-success">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="pw">New password</label>
            <input
              id="pw"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              disabled={status === "loading"}
            />
            <span className="auth-hint">At least 8 characters</span>
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
              disabled={status === "loading"}
            />
          </div>
          {status === "error" && <p className="auth-error">{message}</p>}
          <button type="submit" className="auth-btn-primary" disabled={status === "loading"}>
            {status === "loading" ? "Updating…" : "Set new password →"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
