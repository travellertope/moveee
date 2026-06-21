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

// ─── Password helpers ─────────────────────────────────────────────────────────
function getStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  let s = 0;
  if (pw.length >= 8)         s++;
  if (/[A-Z]/.test(pw))       s++;
  if (/[0-9]/.test(pw))       s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
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
function CheckSVG() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function CircleSVG() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.ghost} strokeWidth="1.7"><circle cx="12" cy="12" r="8"/></svg>;
}
function BackSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function Spinner() {
  return (
    <>
      <style>{`@keyframes rss{to{transform:rotate(360deg)}}`}</style>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: "rss .7s linear infinite" }}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label, id, type = "text", value, onChange, placeholder,
  leftEl, rightEl, focused, onFocus, onBlur, error, hint, autoComplete,
}: {
  label: string; id: string; type?: string;
  value: string; onChange: (v: string) => void; placeholder: string;
  leftEl?: React.ReactNode; rightEl?: React.ReactNode;
  focused: boolean; onFocus: () => void; onBlur: () => void;
  error?: string; hint?: string; autoComplete?: string;
}) {
  const borderColor = error ? C.error : focused ? C.ink : C.ghost;
  const borderW = focused && !error ? "1.5px" : "1px";
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.mute, marginBottom: 4 }}>
        {label}
      </label>
      <div style={{
        height: 52, background: C.white,
        border: `${borderW} solid ${borderColor}`, borderRadius: 6,
        display: "flex", alignItems: "center", paddingLeft: 14, paddingRight: 14,
        gap: 8, transition: "border-color 0.15s",
      }}>
        {leftEl && <span style={{ flexShrink: 0, display: "flex" }}>{leftEl}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete ?? id}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontFamily: "'DM Sans',sans-serif", fontSize: 15,
            color: C.ink, minWidth: 0,
          }}
        />
        {rightEl && <span style={{ flexShrink: 0, display: "flex", cursor: "pointer" }}>{rightEl}</span>}
      </div>
      {error && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.error, margin: "5px 0 0" }}>{error}</p>}
      {hint && !error && <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ghost, margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const strength = getStrength(password);
  const strengthMeta = STRENGTH_META[strength];
  const reqs = REQS.map(r => r.test(password));
  const isValid = email.includes("@") && username.length >= 3 && strength >= 3;

  const segColors = [
    strength >= 1 ? C.error   : C.ghost,
    strength >= 2 ? C.warning : C.ghost,
    strength >= 3 ? C.gold    : C.ghost,
    strength >= 4 ? C.success : C.ghost,
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email.includes("@")) errs.email = "Please enter a valid email address.";
    if (username.length < 3)  errs.username = "Username must be at least 3 characters.";
    if (strength < 3)         errs.password = "Password is too weak.";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/verify"); }, 1800);
  }

  return (
    <div style={{ background: C.bgWarm, minHeight: "100%" }}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ padding: "20px 32px 0" }}>
          {/* Back + wordmark */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ position: "absolute", left: -10, width: 44, height: 44, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            >
              <BackSVG />
            </button>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: "-0.5px" }}>moveee</span>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: "2px", textTransform: "uppercase", marginTop: 3 }}>connect</span>
              <div style={{ width: 32, height: 2, background: C.ochre, borderRadius: 9999, marginTop: 8 }} />
            </div>
          </div>

          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>Create your account.</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.mute, margin: "0 0 24px" }}>Just three fields to get started.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <Field
              label="Email address" id="new-email" type="email"
              value={email} onChange={v => { setEmail(v); setErrors(p => ({ ...p, email: "" })); }}
              placeholder="you@example.com"
              leftEl={<MailSVG />}
              focused={focused === "email"} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
              error={errors.email} autoComplete="email"
            />

            {/* Username */}
            <Field
              label="Username" id="username" type="text"
              value={username} onChange={v => { setUsername(v.replace(/[^a-zA-Z0-9_]/g, "")); setErrors(p => ({ ...p, username: "" })); }}
              placeholder="yourhandle"
              leftEl={<span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, fontWeight: 600, lineHeight: 1, opacity: 0.7 }}>@</span>}
              focused={focused === "username"} onFocus={() => setFocused("username")} onBlur={() => setFocused(null)}
              error={errors.username}
              hint="Letters, numbers and underscores only"
              autoComplete="username"
            />

            {/* Password */}
            <div>
              <Field
                label="Password" id="new-password" type={showPw ? "text" : "password"}
                value={password} onChange={v => { setPassword(v); setErrors(p => ({ ...p, password: "" })); }}
                placeholder="Create a password"
                leftEl={<LockSVG />}
                rightEl={<span onClick={() => setShowPw(p => !p)}><EyeSVG off={showPw} /></span>}
                focused={focused === "password"} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                error={errors.password} autoComplete="new-password"
              />

              {/* Strength bar */}
              {password.length > 0 && (
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
                  {/* Requirements */}
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 24, width: "100%", height: 52, borderRadius: 9999,
              background: C.ochre, border: "none",
              cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: loading ? 0.9 : !isValid ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading
              ? <Spinner />
              : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: C.white }}>Create account</span>
            }
          </button>

          {/* Terms */}
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: C.mute, textAlign: "center", margin: "14px 0 0", lineHeight: 1.6 }}>
            By creating an account you agree to our{" "}
            <span style={{ color: C.ochre, cursor: "pointer" }}>Terms</span>
            {" & "}
            <span style={{ color: C.ochre, cursor: "pointer" }}>Privacy Policy</span>
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 32px 28px", textAlign: "center" }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} style={{ color: C.ochre, textDecoration: "underline", cursor: "pointer" }}>
              Sign in
            </span>
          </span>
        </div>
      </form>
    </div>
  );
}
