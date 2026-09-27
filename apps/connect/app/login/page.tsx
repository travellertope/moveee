"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";
import MagicCodeSignIn from "@/components/MagicCodeSignIn";
import "../auth.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/member";
  const isNewMember = searchParams.get("registered") === "1";

  // A one-time code is the default way in: it needs nothing remembered, and
  // it works identically whether or not this email already has an account.
  // The password form is still here for members who have one — it just isn't
  // what the page opens on any more.
  const [usePassword, setUsePassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  function finish() {
    if (callbackUrl.startsWith("http")) {
      window.location.href = callbackUrl;
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

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
      finish();
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") {
        setError(err.message ?? "Passkey sign-in failed. Try a code instead.");
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
    } else {
      finish();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">{isNewMember ? "You're in!" : "Sign in"}</h1>
        <p className="auth-sub">
          {isNewMember
            ? "Your account is ready. Sign in to pick up where you left off."
            : usePassword
              ? "Enter the username and password you signed up with."
              : "Enter your email and we'll send you a 6-digit code. No password needed."}
        </p>

        {usePassword ? (
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
        ) : (
          <MagicCodeSignIn callbackUrl={callbackUrl} submitLabel="Email me a code" autoFocus />
        )}

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-label">or</span>
          <div className="auth-divider-line" />
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="auth-btn-secondary"
        >
          <span className="auth-google-glyph">G</span>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handlePasskeySignIn}
          disabled={passkeyLoading || loading}
          className="auth-btn-secondary"
        >
          <span>🔑</span>
          {passkeyLoading ? "Waiting for device…" : "Sign in with a passkey"}
        </button>

        <button
          type="button"
          className="auth-btn-secondary"
          onClick={() => {
            setUsePassword((v) => !v);
            setError("");
          }}
        >
          <span>{usePassword ? "✉" : "🔒"}</span>
          {usePassword ? "Sign in with a code instead" : "Sign in with a password"}
        </button>

        <div className="auth-footer">
          {usePassword && (
            <p><Link href="/forgot-password" className="auth-link">Forgot your password?</Link></p>
          )}
          <p>New here? <Link href="/register" className="auth-link">Create an account</Link> — it takes about a minute.</p>
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
