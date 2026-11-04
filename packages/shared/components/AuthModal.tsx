"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import MagicCodeSignIn from "@/components/MagicCodeSignIn";
import "@/app/auth.css";

type Mode = "code" | "password" | "forgot";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("code");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");

  const [fpEmail, setFpEmail] = useState("");
  const [fpStatus, setFpStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [fpError, setFpError] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function finishAndClose() {
    onClose();
    router.refresh();
  }

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });
    setLoginLoading(false);
    if (result?.error) {
      setLoginError("Incorrect username or password.");
    } else {
      finishAndClose();
    }
  }

  async function handlePasskeySignIn() {
    setPasskeyLoading(true);
    setPasskeyError("");
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
      finishAndClose();
    } catch (err: any) {
      if (err?.name !== "NotAllowedError") {
        setPasskeyError(err.message ?? "Passkey sign-in failed. Try a code instead.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setFpError("");
    setFpStatus("loading");
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim() }),
      });
      setFpStatus("sent");
    } catch {
      setFpError("Could not send email. Please try again.");
      setFpStatus("idle");
    }
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "/";

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="auth-modal-overlay">
      <div className="auth-card auth-modal-card" role="dialog" aria-modal="true">
        <button onClick={onClose} className="auth-modal-close" aria-label="Close">✕</button>
        <p className="auth-modal-eyebrow">The Moveee &mdash; Culture Community</p>

        {mode === "forgot" ? (
          fpStatus === "sent" ? (
            <div>
              <p className="auth-success" style={{ marginBottom: 20 }}>
                If an account exists for that email, a reset link is on its way.
                Check your inbox (and spam folder).
              </p>
              <button type="button" className="auth-footer-btn" onClick={() => { setMode("password"); setFpStatus("idle"); }}>
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} noValidate>
              <p className="auth-sub">Enter your email and we&apos;ll send you a link to reset your password.</p>
              <div className="auth-field">
                <label className="auth-label" htmlFor="am-fp-email">Email address</label>
                <input id="am-fp-email" type="email" autoComplete="email" required
                  value={fpEmail} onChange={(e) => setFpEmail(e.target.value)}
                  className="auth-input" disabled={fpStatus === "loading"} />
              </div>
              {fpError && <p className="auth-error">{fpError}</p>}
              <button type="submit" className="auth-btn-primary" disabled={fpStatus === "loading"}>
                {fpStatus === "loading" ? "Sending…" : "Send reset link →"}
              </button>
              <button type="button" className="auth-footer-btn" style={{ marginTop: 14 }} onClick={() => setMode("password")}>
                ← Back to sign in
              </button>
            </form>
          )
        ) : mode === "password" ? (
          <form onSubmit={handlePasswordLogin} noValidate>
            <h2 className="auth-heading auth-heading--sm">Sign in with a password</h2>
            <div className="auth-field">
              <label className="auth-label" htmlFor="am-username">Username or Email</label>
              <input id="am-username" type="text" autoComplete="username" autoFocus required
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="auth-input" disabled={loginLoading} />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="am-password">Password</label>
              <input id="am-password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="auth-input" disabled={loginLoading} />
            </div>
            {loginError && <p className="auth-error">{loginError}</p>}
            <button type="submit" className="auth-btn-primary" disabled={loginLoading}>
              {loginLoading ? "Signing in…" : "Sign in →"}
            </button>
            <button type="button" className="auth-footer-btn" style={{ marginTop: 14 }} onClick={() => setMode("forgot")}>
              Forgot your password?
            </button>
          </form>
        ) : (
          <>
            <h2 className="auth-heading auth-heading--sm">Sign in</h2>
            <p className="auth-sub">Enter your email and we&apos;ll send you a 6-digit code. No password needed.</p>
            <MagicCodeSignIn callbackUrl={currentUrl} submitLabel="Email me a code" autoFocus onSuccess={finishAndClose} />
          </>
        )}

        {mode !== "forgot" && (
          <>
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-label">or</span>
              <div className="auth-divider-line" />
            </div>
            {passkeyError && <p className="auth-error">{passkeyError}</p>}
            <div className="auth-icon-row">
              <button type="button" className="auth-icon-btn" aria-label="Continue with Google" title="Continue with Google"
                onClick={() => signIn("google", { callbackUrl: currentUrl })}>
                <span className="auth-google-glyph">G</span>
              </button>
              <button type="button" className="auth-icon-btn"
                aria-label={passkeyLoading ? "Waiting for your device…" : "Sign in with a passkey"}
                title="Sign in with a passkey" onClick={handlePasskeySignIn} disabled={passkeyLoading}>
                <span>{passkeyLoading ? "…" : "🔑"}</span>
              </button>
              <button type="button" className="auth-icon-btn"
                aria-label={mode === "password" ? "Sign in with a code instead" : "Sign in with a password"}
                title={mode === "password" ? "Sign in with a code instead" : "Sign in with a password"}
                onClick={() => { setMode(mode === "password" ? "code" : "password"); setLoginError(""); }}>
                <span>{mode === "password" ? "✉" : "🔒"}</span>
              </button>
            </div>
          </>
        )}

        {mode !== "forgot" && (
          <div className="auth-footer">
            <p>
              New here?{" "}
              <Link href="/register" className="auth-link" onClick={onClose}>Create an account</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
