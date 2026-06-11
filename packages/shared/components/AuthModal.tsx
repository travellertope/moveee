"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

type Tab = "login" | "forgot";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot-password state
  const [fpEmail, setFpEmail] = useState("");
  const [fpStatus, setFpStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [fpError, setFpError] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleLogin(e: FormEvent) {
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
      // Reload the current page so server components re-render with the session
      window.location.reload();
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
    <div ref={overlayRef} onClick={handleOverlayClick} style={s.overlay}>
      <div style={s.modal} role="dialog" aria-modal="true">
        {/* Close button */}
        <button onClick={onClose} style={s.closeBtn} aria-label="Close">
          ✕
        </button>

        <p style={s.eyebrow}>The Moveee &mdash; Culture Community</p>

        {/* Tab switcher */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === "login" ? s.tabActive : {}) }}
            onClick={() => { setTab("login"); setLoginError(""); }}
          >
            Sign in
          </button>
          <button
            style={{ ...s.tab, ...(tab === "forgot" ? s.tabActive : {}) }}
            onClick={() => { setTab("forgot"); setFpStatus("idle"); setFpError(""); }}
          >
            Forgot password
          </button>
        </div>

        {/* ── LOGIN TAB ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} noValidate>
            <div style={s.field}>
              <label style={s.label} htmlFor="am-username">Username or Email</label>
              <input
                id="am-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={s.input}
                disabled={loginLoading}
              />
            </div>
            <div style={s.field}>
              <label style={s.label} htmlFor="am-password">Password</label>
              <input
                id="am-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={s.input}
                disabled={loginLoading}
              />
            </div>

            {loginError && <p style={s.error}>{loginError}</p>}

            <button
              type="submit"
              style={{ ...s.btn, opacity: loginLoading ? 0.7 : 1 }}
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in…" : "Sign in →"}
            </button>

            <p style={s.footer}>
              New here?{" "}
              <Link href="/register" style={s.textLink} onClick={onClose}>
                Create an account
              </Link>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD TAB ── */}
        {tab === "forgot" && (
          <>
            {fpStatus === "sent" ? (
              <div>
                <p style={{ ...s.body, color: "#27ae60", marginBottom: 20 }}>
                  If an account exists for that email, a reset link is on its way.
                  Check your inbox (and spam folder).
                </p>
                <button
                  style={s.btnOutline}
                  onClick={() => { setTab("login"); setFpStatus("idle"); }}
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} noValidate>
                <p style={s.body}>
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <div style={s.field}>
                  <label style={s.label} htmlFor="am-fp-email">Email address</label>
                  <input
                    id="am-fp-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    style={s.input}
                    disabled={fpStatus === "loading"}
                  />
                </div>
                {fpError && <p style={s.error}>{fpError}</p>}
                <button
                  type="submit"
                  style={{ ...s.btn, opacity: fpStatus === "loading" ? 0.7 : 1 }}
                  disabled={fpStatus === "loading"}
                >
                  {fpStatus === "loading" ? "Sending…" : "Send reset link →"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20,17,13,0.6)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  },
  modal: {
    position: "relative",
    background: "#fffdf8",
    border: "1px solid #e8e0d4",
    borderRadius: 4,
    padding: "40px 40px 32px",
    width: "100%",
    maxWidth: 420,
    color: "#14110d",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 18,
    background: "none",
    border: "none",
    fontSize: 16,
    color: "#7a6f5c",
    cursor: "pointer",
    padding: "4px 6px",
    lineHeight: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#7a6f5c",
    margin: "0 0 18px",
  },
  tabs: {
    display: "flex",
    gap: 0,
    borderBottom: "2px solid #e8e0d4",
    marginBottom: 24,
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: -2,
    padding: "8px 16px 10px",
    fontSize: 13,
    fontWeight: 600,
    color: "#7a6f5c",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.02em",
  },
  tabActive: {
    color: "#14110d",
    borderBottomColor: "#14110d",
  },
  body: {
    fontSize: 14,
    color: "#7a6f5c",
    lineHeight: 1.6,
    margin: "0 0 18px",
  },
  field: { marginBottom: 16 },
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
  error: {
    fontSize: 13,
    color: "#c0392b",
    background: "#fef2f2",
    border: "1px solid rgba(192,57,43,.15)",
    borderRadius: 3,
    padding: "8px 12px",
    margin: "0 0 14px",
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "11px 24px",
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
    marginTop: 4,
  },
  btnOutline: {
    background: "none",
    border: "1px solid #d4cbbf",
    borderRadius: 3,
    padding: "10px 20px",
    fontSize: 13,
    color: "#14110d",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  footer: {
    fontSize: 13,
    color: "#7a6f5c",
    textAlign: "center",
    margin: "20px 0 0",
  },
  textLink: {
    color: "#14110d",
    textDecoration: "underline",
  },
};
