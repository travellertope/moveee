import { useState } from "react";
import { useNavigate, Link } from "react-router";

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
  error:   "#C62828",
};

// ─── Field wrapper with focus/error state ─────────────────────────────────────
function Field({
  label, id, type = "text", value, onChange, placeholder,
  icon, rightEl, focused, onFocus, onBlur, error,
}: {
  label: string; id: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode;
  rightEl?: React.ReactNode;
  focused: boolean; onFocus: () => void; onBlur: () => void;
  error?: string;
}) {
  const borderColor = error ? C.error : focused ? C.ink : C.ghost;
  const borderW     = focused && !error ? "1.5px" : "1px";

  return (
    <div>
      <label htmlFor={id} style={{
        display: "block", fontFamily: "'DM Sans',sans-serif",
        fontSize: 11, color: C.mute, marginBottom: 4,
      }}>
        {label}
      </label>
      <div style={{
        height: 52, background: error ? "#FEF2F2" : C.white,
        border: `${borderW} solid ${borderColor}`, borderRadius: 6,
        display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 14,
        gap: 10, transition: "border-color 0.15s",
      }}>
        <span style={{ flexShrink: 0, display: "flex", opacity: 0.6 }}>{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={id}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontFamily: "'DM Sans',sans-serif", fontSize: 15,
            color: C.ink, minWidth: 0,
          }}
        />
        {rightEl && <span style={{ flexShrink: 0, display: "flex", cursor: "pointer" }}>{rightEl}</span>}
      </div>
      {error && (
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.error, margin: "5px 0 0" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <>
      <style>{`@keyframes ls{to{transform:rotate(360deg)}}`}</style>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: "ls .7s linear infinite" }}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  );
}

function MailSVG() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>;
}
function LockSVG() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function EyeSVG({ off }: { off?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ghost} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {off
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );
}
function FingerprintSVG() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2"/><path d="M12 6a6 6 0 0 1 6 6c0 2.2-.8 4.2-2 5.7"/><path d="M6.3 17.7A9 9 0 0 1 3 12 9 9 0 0 1 12 3"/><path d="M10 20.7A9 9 0 0 0 20.4 14"/></svg>;
}

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    // Simulate auth — always errors for demo (wrong creds)
    setTimeout(() => {
      setLoading(false);
      setError("Incorrect email or password. Please try again.");
    }, 1600);
  }

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

          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
            Welcome back.
          </h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.mute, margin: "0 0 24px" }}>
            Sign in to your Moveee account.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field
              label="Email address" id="email" type="email"
              value={email} onChange={setEmail}
              placeholder="you@example.com" icon={<MailSVG />}
              focused={focused === "email"}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              error={error && email ? undefined : undefined}
            />

            <div>
              <Field
                label="Password" id="current-password" type={showPw ? "text" : "password"}
                value={password} onChange={setPassword}
                placeholder="••••••••" icon={<LockSVG />}
                rightEl={<span onClick={() => setShowPw(p => !p)}><EyeSVG off={showPw} /></span>}
                focused={focused === "password"}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <Link to="/forgot-password" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ochre, textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 6,
              background: "#FEF2F2", border: `1px solid ${C.error}30`,
            }}>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.error, margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 24, width: "100%", height: 52, borderRadius: 9999,
              background: C.ochre, border: "none", cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading ? 0.9 : 1,
            }}
          >
            {loading
              ? <Spinner />
              : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: C.white }}>Sign in</span>
            }
          </button>

          {/* OR divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.mute }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.rule }} />
          </div>

          {/* Passkey */}
          <button
            type="button"
            style={{
              width: "100%", height: 52, borderRadius: 9999,
              background: C.white, border: `1px solid ${C.ink}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer",
            }}
          >
            <FingerprintSVG />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink }}>Continue with passkey</span>
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: "28px 32px 24px", textAlign: "center" }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{ color: C.ochre, textDecoration: "underline", cursor: "pointer" }}
            >
              Create one
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}
