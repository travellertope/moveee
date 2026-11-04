"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import MagicCodeSignIn from "@/components/MagicCodeSignIn";
import "@/app/auth.css";

type Mode = "code" | "password" | "forgot";

export function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5831-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
      <path fill="#FBBC05" d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1731 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z"/>
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.43 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1627 6.6564 3.5795 9 3.5795z"/>
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2.5" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="M2 6l10 7 10-7" />
    </svg>
  );
}

interface SignInPanelProps {
  /** Where to land after a successful sign-in, and what Google's own
   * redirect-back URL points at. Ignored for code/password/passkey success
   * when `onAuthenticated` is given — that callback decides instead. */
  callbackUrl: string;
  /** Bold heading at the top of the panel. */
  heading?: string;
  /** Sub-line shown under the heading only in the default code view. */
  codeIntro?: string;
  /** Called after a successful password or passkey sign-in, and passed as
   * MagicCodeSignIn's onSuccess. When omitted, all three fall back to
   * navigating to `callbackUrl` (push+refresh, or a hard redirect for an
   * absolute URL) — the right default for a dedicated page. A modal
   * overlay passes this to close itself and refresh in place instead. */
  onAuthenticated?: () => void;
  /** Called when the "Create an account" link is clicked (e.g. to close a
   * modal before the navigation happens). */
  onRegisterLinkClick?: () => void;
  /** Skip the built-in "New here? Create an account" footer — for a caller
   * (e.g. /login) that renders its own .auth-crosslink box outside the
   * card instead. */
  hideFooter?: boolean;
}

export default function SignInPanel({
  callbackUrl,
  heading = "Sign in to continue",
  codeIntro = "Enter your email and we'll send you a 6-digit code. No password needed.",
  onAuthenticated,
  onRegisterLinkClick,
  hideFooter = false,
}: SignInPanelProps) {
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

  function navigate() {
    if (onAuthenticated) {
      onAuthenticated();
      return;
    }
    if (callbackUrl.startsWith("http")) {
      window.location.href = callbackUrl;
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
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
      navigate();
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
      navigate();
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

  return (
    <>
      <p className="auth-panel-heading">{heading}</p>

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
              <label className="auth-label" htmlFor="sip-fp-email">Email address</label>
              <input id="sip-fp-email" type="email" autoComplete="email" required
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
            <label className="auth-label" htmlFor="sip-username">Username or Email</label>
            <input id="sip-username" type="text" autoComplete="username" autoFocus required
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="auth-input" disabled={loginLoading} />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="sip-password">Password</label>
            <input id="sip-password" type="password" autoComplete="current-password" required
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
          <p className="auth-sub">{codeIntro}</p>
          <MagicCodeSignIn callbackUrl={callbackUrl} submitLabel="Email me a code" autoFocus onSuccess={navigate} />
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
              onClick={() => signIn("google", { callbackUrl })}>
              <GoogleLogo />
            </button>
            <button type="button" className="auth-icon-btn"
              aria-label={passkeyLoading ? "Waiting for your device…" : "Sign in with a passkey"}
              title="Sign in with a passkey" onClick={handlePasskeySignIn} disabled={passkeyLoading}>
              {passkeyLoading ? <span className="auth-icon-spinner" /> : <KeyIcon />}
            </button>
            <button type="button" className="auth-icon-btn"
              aria-label={mode === "password" ? "Sign in with a code instead" : "Sign in with a password"}
              title={mode === "password" ? "Sign in with a code instead" : "Sign in with a password"}
              onClick={() => { setMode(mode === "password" ? "code" : "password"); setLoginError(""); }}>
              {mode === "password" ? <MailIcon /> : <LockIcon />}
            </button>
          </div>
        </>
      )}

      {mode !== "forgot" && !hideFooter && (
        <div className="auth-footer">
          <p>
            New here?{" "}
            <Link href="/register" className="auth-link" onClick={onRegisterLinkClick}>Create an account</Link>
          </p>
        </div>
      )}
    </>
  );
}
