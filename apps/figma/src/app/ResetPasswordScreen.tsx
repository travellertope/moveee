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
  warning: "#E65100",
};

// ─── Password helpers (same as Register) ─────────────────────────────────────
function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return s as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_META = [
  { label: "",            color: C.ghost   },
  { label: "Weak",        color: C.error   },
  { label: "Fair",        color: C.warning },
  { label: "Strong",      color: C.gold    },
  { label: "Very strong", color: C.success },
];

const REQS = [
  { label: "At least 8 characters",  test: (p: string) => p.length >= 8           },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p)         },
  { label: "One number",             test: (p: string) => /[0-9]/.test(p)         },
  { label: "One special character",  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// ─── SVGs ─────────────────────────────────────────────────────────────────────
function LockSVG({ color = C.mute }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeSVG({ off }: { off?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ghost}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {off
        ? <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        : <>
            <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </>
      }
    </svg>
  );
}

function CheckSVG() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CircleSVG() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={C.ghost} strokeWidth="1.7">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes rp-spin{to{transform:rotate(360deg)}}`}</style>
      <svg width="20" height="20" viewBox="0 0 20 20"
        style={{ animation: "rp-spin .7s linear infinite", display: "block" }}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  );
}

// ─── Password field ───────────────────────────────────────────────────────────
function PwField({
  id, label, value, onChange, show, onToggle, focused, onFocus, onBlur, error,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  focused: boolean; onFocus: () => void; onBlur: () => void; error?: string;
}) {
  const borderColor = error ? C.error : focused ? C.ink : C.ghost;
  const borderW     = focused && !error ? "1.5px" : "1px";
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.mute, marginBottom: 4 }}>
        {label}
      </label>
      <div style={{
        height: 52, background: C.white,
        border: `${borderW} solid ${borderColor}`, borderRadius: 6,
        display: "flex", alignItems: "center",
        paddingLeft: 14, paddingRight: 14, gap: 10,
        transition: "border-color 0.15s",
      }}>
        <span style={{ flexShrink: 0, opacity: 0.6 }}><LockSVG /></span>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="••••••••"
          autoComplete={id === "new-pw" ? "new-password" : "new-password"}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.ink, minWidth: 0,
          }}
        />
        <span style={{ flexShrink: 0, cursor: "pointer" }} onClick={onToggle}>
          <EyeSVG off={show} />
        </span>
      </div>
      {error && (
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.error, margin: "5px 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Success view ─────────────────────────────────────────────────────────────
function SuccessView() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100%", background: C.bgWarm,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px", textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: C.ochre,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{
        fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700,
        color: C.ink, margin: "24px 0 0",
      }}>
        Password updated.
      </h2>
      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.mute,
        margin: "8px auto 0", lineHeight: 1.6, maxWidth: 280,
      }}>
        Your password has been reset successfully. You can now sign in with your new password.
      </p>

      <div style={{ width: "100%", maxWidth: 280, marginTop: 36 }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%", height: 52, borderRadius: 9999,
            background: C.ochre, border: "none", cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: C.white,
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ResetPasswordScreen() {
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  const strength     = getStrength(newPw);
  const strengthMeta = STRENGTH_META[strength];
  const reqs         = REQS.map(r => r.test(newPw));
  const segColors    = [
    strength >= 1 ? C.error   : C.ghost,
    strength >= 2 ? C.warning : C.ghost,
    strength >= 3 ? C.gold    : C.ghost,
    strength >= 4 ? C.success : C.ghost,
  ];

  if (done) return <SuccessView />;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (strength < 3)                errs.newPw    = "Password is too weak.";
    if (confirmPw !== newPw)         errs.confirmPw = "Passwords don't match.";
    if (!confirmPw)                  errs.confirmPw = "Please confirm your password.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1600);
  }

  // Match indicator
  const showMatch = confirmPw.length > 0;
  const isMatch   = confirmPw === newPw && confirmPw.length > 0;

  return (
    <div style={{ background: C.bgWarm, minHeight: "100%" }}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ padding: "32px 32px 0" }}>

          {/* Wordmark */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: "-0.5px" }}>moveee</span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: "2px", textTransform: "uppercase", marginTop: 3 }}>connect</span>
            <div style={{ width: 32, height: 2, background: C.ochre, borderRadius: 9999, marginTop: 8 }} />
          </div>

          {/* Key icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="20" cy="20" r="12" stroke={C.ochre} strokeWidth="2.5" />
              <circle cx="20" cy="20" r="5"  stroke={C.ochre} strokeWidth="2"   />
              <path d="M29 29L44 44" stroke={C.ochre} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M38 40L42 36" stroke={C.ochre} strokeWidth="2"   strokeLinecap="round" />
              <path d="M34 44L38 40" stroke={C.ochre} strokeWidth="2"   strokeLinecap="round" />
            </svg>
          </div>

          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
            Set a new password.
          </h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.mute, margin: "0 0 28px", lineHeight: 1.55 }}>
            Choose something strong — you won't be able to reuse your last password.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* New password */}
            <div>
              <PwField
                id="new-pw" label="New password"
                value={newPw} onChange={v => { setNewPw(v); setErrors(p => ({ ...p, newPw: "" })); }}
                show={showNew} onToggle={() => setShowNew(p => !p)}
                focused={focused === "new-pw"}
                onFocus={() => setFocused("new-pw")}
                onBlur={() => setFocused(null)}
                error={errors.newPw}
              />

              {/* Strength bar */}
              {newPw.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {segColors.map((bg, i) => (
                      <div key={i} style={{ flex: 1, height: 8, borderRadius: 9999, background: bg, transition: "background 0.25s" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: strengthMeta.color, fontWeight: 600 }}>
                      {strengthMeta.label}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    {REQS.map((r, i) => (
                      <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {reqs[i] ? <CheckSVG /> : <CircleSVG />}
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: reqs[i] ? C.success : C.mute }}>
                          {r.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <PwField
                id="confirm-pw" label="Confirm new password"
                value={confirmPw} onChange={v => { setConfirmPw(v); setErrors(p => ({ ...p, confirmPw: "" })); }}
                show={showConf} onToggle={() => setShowConf(p => !p)}
                focused={focused === "confirm-pw"}
                onFocus={() => setFocused("confirm-pw")}
                onBlur={() => setFocused(null)}
                error={errors.confirmPw}
              />
              {/* Match indicator */}
              {showMatch && !errors.confirmPw && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  {isMatch
                    ? <><CheckSVG /><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.success }}>Passwords match</span></>
                    : <><CircleSVG /><span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.mute }}>Passwords don't match yet</span></>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 28, width: "100%", height: 52,
              borderRadius: 9999, background: C.ochre, border: "none",
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading ? 0.9 : 1, transition: "opacity 0.2s",
            }}
          >
            {loading
              ? <Spinner />
              : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: C.white }}>
                  Update password
                </span>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
