"use client";

import { useState, FormEvent, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startAuthentication } from "@simplewebauthn/browser";

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
      router.push(callbackUrl);
      router.refresh();
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
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>The Moveee &mdash; Culture Community</p>
        <h1 style={styles.heading}>{isNewMember ? "You're in!" : "Sign in"}</h1>
        <p style={styles.subheading}>
          {isNewMember
            ? "Your account is ready. Sign in to access your dashboard and member perks."
            : "Welcome back. Sign in to access your community and member perks."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={error ? { ...styles.input, borderColor: "rgba(192,57,43,.5)" } : styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={error ? { ...styles.input, borderColor: "rgba(192,57,43,.5)" } : styles.input}
              disabled={loading}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 4px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(42,36,28,.12)" }} />
          <span style={{ fontSize: 12, color: "#7a6f5c" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(42,36,28,.12)" }} />
        </div>
        <button
          type="button"
          onClick={handlePasskeySignIn}
          disabled={passkeyLoading || loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "11px 24px",
            background: "transparent",
            color: "#14110d",
            border: "1px solid rgba(42,36,28,.25)",
            borderRadius: 3,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            cursor: passkeyLoading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: passkeyLoading ? 0.7 : 1,
          }}
        >
          <span style={{ fontSize: 16 }}>🔑</span>
          {passkeyLoading ? "Waiting for device…" : "Sign in with Passkey"}
        </button>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "11px 24px",
            background: "transparent",
            color: "#14110d",
            border: "1px solid rgba(42,36,28,.25)",
            borderRadius: 3,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: 10,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: "bold", fontFamily: "sans-serif", width: 16, textAlign: "center" }}>G</span>
          Continue with Google
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <p style={styles.footer}>
            <Link href="/forgot-password" style={styles.link}>
              Forgot your password?
            </Link>
          </p>
          <p style={styles.footer}>
            New to the community?{" "}
            <Link href="/register" style={styles.link}>
              Create an account
            </Link>
          </p>
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

const styles: Record<string, React.CSSProperties> = {
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
    borderRadius: 4,
    border: "1px solid #e8e0d4",
    padding: "40px 40px 32px",
    color: "#14110d",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#7a6f5c",
    margin: "0 0 12px",
  },
  heading: {
    fontSize: 28,
    fontWeight: 300,
    fontFamily: "Georgia, serif",
    margin: "0 0 8px",
    color: "#14110d",
  },
  subheading: {
    fontSize: 15,
    color: "#7a6f5c",
    lineHeight: 1.5,
    margin: "0 0 24px",
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 400,
    color: "#7a6f5c",
    marginBottom: 6,
    letterSpacing: "0.02em",
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
  error: {
    fontSize: 14,
    color: "#c0392b",
    background: "#fef2f2",
    border: "1px solid rgba(192,57,43,.15)",
    borderRadius: 3,
    padding: "10px 14px",
    margin: "0 0 16px",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "14px 20px",
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
