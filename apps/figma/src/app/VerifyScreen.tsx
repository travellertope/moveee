import { useState } from "react";
import { useNavigate } from "react-router";

const C = {
  bgWarm: "#F3ECE0",
  white:  "#FFFFFF",
  ink:    "#14110D",
  inkSoft:"#3A342B",
  mute:   "#7A6F5C",
  ghost:  "#C8BFB0",
  ochre:  "#C5491F",
  gold:   "#B38238",
  success:"#2D6A4F",
};

function EnvelopeSVG() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="6" y="18" width="60" height="42" rx="5" stroke={C.ochre} strokeWidth="2.5"/>
      <path d="M6 23L36 42L66 23" stroke={C.ochre} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="6"  y1="60" x2="26" y2="42" stroke={C.ochre} strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
      <line x1="66" y1="60" x2="46" y2="42" stroke={C.ochre} strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export default function VerifyScreen() {
  const navigate = useNavigate();
  const [resent,     setResent]     = useState(false);
  const [countdown,  setCountdown]  = useState(0);

  function handleResend() {
    if (countdown > 0) return;
    setResent(true);
    setCountdown(30);
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div style={{ background: C.bgWarm, minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 32px 40px", textAlign: "center" }}>
      {/* Icon */}
      <div style={{ position: "relative" }}>
        <EnvelopeSVG />
        <div style={{
          position: "absolute", top: 2, right: 0,
          width: 22, height: 22, borderRadius: "50%",
          background: C.ochre, border: `2.5px solid ${C.bgWarm}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 11, color: C.white, lineHeight: 1 }}>★</span>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: C.ink, margin: "24px 0 0" }}>
        Check your inbox.
      </h2>

      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.mute, margin: "8px 0 0" }}>
        We've sent a verification link to:
      </p>

      {/* Email chip */}
      <div style={{
        marginTop: 12, border: `1px solid ${C.ghost}`, borderRadius: 9999,
        padding: "8px 18px", display: "inline-block",
      }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: C.ink }}>
          you@example.com
        </span>
      </div>

      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute,
        margin: "20px auto 0", lineHeight: 1.65, maxWidth: 280,
      }}>
        Click the link to continue setting up your profile. The link expires in 24 hours.
      </p>

      {/* Success banner */}
      {resent && (
        <div style={{
          marginTop: 16, padding: "10px 16px", borderRadius: 8,
          background: `${C.success}14`, border: `1px solid ${C.success}30`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.success }}>Email resent successfully</span>
        </div>
      )}

      {/* Resend button */}
      <div style={{ marginTop: 24, width: "100%", maxWidth: 280 }}>
        <button
          onClick={handleResend}
          disabled={countdown > 0}
          style={{
            width: "100%", height: 48, borderRadius: 9999,
            border: `1px solid ${countdown > 0 ? C.ghost : C.ink}`,
            background: C.white, cursor: countdown > 0 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700,
            color: countdown > 0 ? C.ghost : C.ink,
          }}>
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
          </span>
        </button>
      </div>

      {/* Bottom link */}
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        <span
          onClick={() => navigate("/login")}
          style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.mute, cursor: "pointer", textDecoration: "underline" }}
        >
          Sign in with a different account
        </span>
      </div>
    </div>
  );
}
