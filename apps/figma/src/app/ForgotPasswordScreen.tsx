import { useState } from "react";
import { useNavigate } from "react-router";

const C = {
  bgWarm:  "#F3ECE0",
  white:   "#FFFFFF",
  ink:     "#14110D",
  inkSoft: "#3A342B",
  mute:    "#7A6F5C",
  ghost:   "#C8BFB0",
  rule:    "#E8E2D8",
  ochre:   "#C5491F",
  gold:    "#B38238",
  success: "#2D6A4F",
  error:   "#C62828",
};

function BackSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function MailSVG({ color = C.mute }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes fp-spin{to{transform:rotate(360deg)}}`}</style>
      <svg width="20" height="20" viewBox="0 0 20 20"
        style={{ animation: "fp-spin .7s linear infinite", display: "block" }}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  );
}

// Lock + key illustration
function LockIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      {/* Lock body */}
      <rect x="14" y="34" width="44" height="30" rx="5" stroke={C.ochre} strokeWidth="2.5" />
      {/* Lock shackle */}
      <path d="M22 34V24a14 14 0 0 1 28 0v10" stroke={C.ochre} strokeWidth="2.5" strokeLinecap="round" />
      {/* Keyhole */}
      <circle cx="36" cy="48" r="4" stroke={C.ochre} strokeWidth="2" />
      <line x1="36" y1="52" x2="36" y2="58" stroke={C.ochre} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Sent confirmation view ───────────────────────────────────────────────────
function SentView({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100%", background: C.bgWarm,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 32px 48px", textAlign: "center",
    }}>
      {/* Success icon */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: `${C.success}12`, border: `2px solid ${C.success}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{
        fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700,
        color: C.ink, margin: "24px 0 0", lineHeight: 1.2,
      }}>
        Check your email.
      </h2>

      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 14,
        color: C.mute, margin: "8px 0 0", lineHeight: 1.6,
      }}>
        We've sent a password reset link to:
      </p>

      {/* Email chip */}
      <div style={{
        marginTop: 12, border: `1px solid ${C.ghost}`,
        borderRadius: 9999, padding: "8px 18px", display: "inline-block",
      }}>
        <span style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 14,
          fontWeight: 700, color: C.ink,
        }}>
          {email}
        </span>
      </div>

      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute,
        margin: "20px auto 0", lineHeight: 1.65, maxWidth: 280,
      }}>
        The link expires in 1 hour. If you don't see it, check your spam folder.
      </p>

      {/* Open email client hint */}
      <div style={{
        marginTop: 28, width: "100%", maxWidth: 280,
        background: C.white, borderRadius: 12,
        padding: "14px 16px",
        boxShadow: "0px 1px 3px rgba(20,17,13,0.08)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${C.ochre}14`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <MailSVG color={C.ochre} />
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>
            Open email app
          </p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.mute, margin: "1px 0 0" }}>
            Tap to open your inbox
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ghost}
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 40, display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 280 }}>
        <button
          onClick={onBack}
          style={{
            width: "100%", height: 48, borderRadius: 9999,
            border: `1px solid ${C.ink}`, background: C.white,
            cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            fontSize: 14, fontWeight: 700, color: C.ink,
          }}
        >
          Try a different email
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute,
          }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  if (sent) return <SentView email={email} onBack={() => setSent(false)} />;

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) { setError("Please enter a valid email address."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  }

  return (
    <div style={{ background: C.bgWarm, minHeight: "100%" }}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ padding: "20px 32px 0" }}>

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              padding: 0, marginBottom: 32,
            }}
          >
            <BackSVG />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>
              Back to sign in
            </span>
          </button>

          {/* Illustration */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <LockIllustration />
          </div>

          <h2 style={{
            fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700,
            color: C.ink, margin: "0 0 4px", lineHeight: 1.2,
          }}>
            Forgot your password?
          </h2>
          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 14,
            color: C.mute, margin: "0 0 28px", lineHeight: 1.55,
          }}>
            No worries. Enter your email and we'll send you a reset link.
          </p>

          {/* Email field */}
          <div>
            <label htmlFor="reset-email" style={{
              display: "block", fontFamily: "'DM Sans',sans-serif",
              fontSize: 11, color: C.mute, marginBottom: 4,
            }}>
              Email address
            </label>
            <div style={{
              height: 52, background: C.white,
              border: `${focused ? "1.5px" : "1px"} solid ${error ? C.error : focused ? C.ink : C.ghost}`,
              borderRadius: 6, display: "flex", alignItems: "center",
              paddingLeft: 14, paddingRight: 14, gap: 10,
              transition: "border-color 0.15s",
            }}>
              <span style={{ flexShrink: 0, opacity: 0.6 }}><MailSVG /></span>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", fontFamily: "'DM Sans',sans-serif",
                  fontSize: 15, color: C.ink, minWidth: 0,
                }}
              />
              {/* Clear button */}
              {email.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEmail("")}
                  style={{
                    background: C.ghost, border: "none", borderRadius: "50%",
                    width: 18, height: 18, cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={C.white} strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {error && (
              <p style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 12,
                color: C.error, margin: "5px 0 0",
              }}>
                {error}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 24, width: "100%", height: 52,
              borderRadius: 9999, background: C.ochre, border: "none",
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading ? 0.9 : !isValid && email.length > 0 ? 0.5 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading
              ? <Spinner />
              : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: C.white }}>
                  Send reset link
                </span>
            }
          </button>

          {/* Helper */}
          <p style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 12,
            color: C.ghost, textAlign: "center", margin: "16px 0 0", lineHeight: 1.6,
          }}>
            Remember your password?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: C.ochre, cursor: "pointer", textDecoration: "underline" }}
            >
              Sign in
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}
