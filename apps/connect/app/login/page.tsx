"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import "../auth.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/member";
  const isNewMember = searchParams.get("registered") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  async function handlePasskeySignIn() {
    setPasskeyLoading(true);
    setError("");
    try {
      const optRes = await fetch("/api/auth/passkey/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!optRes.ok) throw new Error("Could not get passkey options.");
      const options = await optRes.json();

      const assResp = await startAuthentication({ optionsJSON: options });
      const verRes = await fetch("/api/auth/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assResp, _challenge_key: options._challenge_key }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error ?? "Passkey sign-in failed.");

      const result = await signIn("credentials", {
        passkeyToken: verData.passkey_token,
        redirect: false,
      });
      if (result?.error) throw new Error("Sign-in failed after passkey verification.");
      if (callbackUrl.startsWith("http")) {
        window.location.href = callbackUrl;
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") {
        setError(err.message ?? "Passkey sign-in failed. Try password instead.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password. Please try again.");
    } else if (callbackUrl.startsWith("http")) {
      window.location.href = callbackUrl;
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">{isNewMember ? "You're in!" : "Sign in"}</h1>
        <p className="auth-sub">
          {isNewMember
            ? "Your account is ready. Sign in to access your dashboard and member perks."
            : "Welcome back. Sign in to access your community and member perks."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">Username or Email</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`auth-input${error ? " auth-input--error" : ""}`}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`auth-input${error ? " auth-input--error" : ""}`}
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-label">or</span>
          <div className="auth-divider-line" />
        </div>

        <button
          type="button"
          onClick={handlePasskeySignIn}
          disabled={passkeyLoading || loading}
          className="auth-btn-secondary"
        >
          <span>🔑</span>
          {passkeyLoading ? "Waiting for device…" : "Sign in with Passkey"}
        </button>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="auth-btn-secondary"
          style={{ marginTop: 10 }}
        >
          <span style={{ fontWeight: "bold", fontFamily: "sans-serif", width: 16, textAlign: "center" }}>G</span>
          Continue with Google
        </button>

        <div className="auth-footer">
          <p><Link href="/forgot-password" className="auth-link">Forgot your password?</Link></p>
          <p>New to the community? <Link href="/register" className="auth-link">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
