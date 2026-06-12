import { Outlet, NavLink, useLocation, Navigate } from "react-router";

const C = {
  bgWarm: "#F3ECE0",
  ink:    "#14110D",
  mute:   "#7A6F5C",
  ghost:  "#C8BFB0",
  ochre:  "#C5491F",
  gold:   "#B38238",
};

// ─── Sidebar nav definition ───────────────────────────────────────────────────
const NAV = [
  {
    section: "App Screens",
    items: [
      { path: "/onboarding",      label: "Onboarding",       icon: <OnboardIcon />  },
      { path: "/login",           label: "Login",            icon: <LockIcon />     },
      { path: "/forgot-password", label: "Forgot Password",  icon: <KeyIcon />      },
      { path: "/reset-password",  label: "Reset Password",   icon: <ShieldIcon />   },
      { path: "/register",        label: "Register",         icon: <PersonIcon />   },
      { path: "/verify",          label: "Verify Email",     icon: <MailIcon />     },
      { path: "/feed",            label: "Connect Feed",     icon: <FeedIcon />     },
      { path: "/feed-showcase",  label: "Card Showcase",    icon: <GridIcon />     },
    ],
  },
  {
    section: "Design Reference",
    items: [
      { path: "/design-system", label: "Design System",  icon: <TokenIcon /> },
      { path: "/components",    label: "Components",     icon: <GridIcon />  },
    ],
  },
];

// ─── Phone status bar ─────────────────────────────────────────────────────────
function StatusBar({ light = false }: { light?: boolean }) {
  const col = light ? "#FFFFFF" : C.ink;
  return (
    <div style={{
      height: 59, flexShrink: 0, display: "flex", alignItems: "flex-end",
      justifyContent: "space-between", padding: "0 24px 10px",
      position: "relative", zIndex: 20,
    }}>
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: col }}>9:41</span>
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, borderRadius: 20, background: C.ink }} />
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {[3, 4, 5].map(h => <div key={h} style={{ width: 3, height: h, background: col, borderRadius: 1 }} />)}
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path d="M1 4C3.67 1.67 10.33 1.67 13 4" stroke={col} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M3 6.5C4.67 5 9.33 5 11 6.5" stroke={col} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="7" cy="9.5" r="1.2" fill={col} />
        </svg>
        <div style={{ width: 22, height: 11, border: `1.5px solid ${col}`, borderRadius: 3, display: "flex", alignItems: "center", padding: "1.5px", position: "relative" }}>
          <div style={{ width: "75%", height: "100%", background: col, borderRadius: 1.5 }} />
          <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 2.5, height: 5, background: col, borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Home indicator ───────────────────────────────────────────────────────────
function HomeIndicator() {
  return (
    <div style={{ height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.bgWarm }}>
      <div style={{ width: 134, height: 5, borderRadius: 3, background: C.ink, opacity: 0.18 }} />
    </div>
  );
}

// ─── Root shell ───────────────────────────────────────────────────────────────
export default function Root() {
  const { pathname } = useLocation();

  // Light status bar for textile/dark-bg screens
  const lightBar = pathname === "/onboarding";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#171310", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 232, flexShrink: 0,
        background: "#171310",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Wordmark */}
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: C.bgWarm, letterSpacing: "-0.5px" }}>
              moveee
            </span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 700, color: C.gold, letterSpacing: "2px", textTransform: "uppercase" }}>
              connect
            </span>
          </div>
          <div style={{ width: 24, height: 2, background: C.ochre, borderRadius: 9999, marginTop: 6 }} />
        </div>

        {/* Nav sections */}
        <div style={{ padding: "4px 12px", flex: 1 }}>
          {NAV.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 24 }}>
              <p style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
                letterSpacing: "1.5px", textTransform: "uppercase",
                color: "rgba(200,191,176,0.4)", margin: "0 8px 6px",
              }}>
                {section}
              </p>
              {items.map(item => (
                <NavLink key={item.path} to={item.path} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 10px", borderRadius: 8, marginBottom: 2,
                      background: isActive ? "rgba(197,73,31,0.18)" : "transparent",
                      transition: "background 0.15s",
                      cursor: "pointer",
                    }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ opacity: isActive ? 1 : 0.5, display: "flex", flexShrink: 0 }}>{item.icon}</span>
                      <span style={{
                        fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? C.ochre : "rgba(200,191,176,0.75)",
                      }}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: C.ochre }} />
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "rgba(200,191,176,0.3)", margin: 0 }}>
            Design System v1.0
          </p>
        </div>
      </div>

      {/* ── Phone canvas ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#2C2218", overflowY: "auto", padding: "32px 0",
      }}>
        {/* Phone shell */}
        <div style={{
          width: 390, height: 844, borderRadius: 50, flexShrink: 0,
          position: "relative", overflow: "visible",
          boxShadow: "0 0 0 11px #0F0D0B, 0 0 0 13px #2A2218, 0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {/* Physical buttons */}
          <div style={{ position: "absolute", left: -14, top: 130, width: 5, height: 32, background: "#0F0D0B", borderRadius: "3px 0 0 3px" }} />
          <div style={{ position: "absolute", left: -14, top: 176, width: 5, height: 52, background: "#0F0D0B", borderRadius: "3px 0 0 3px" }} />
          <div style={{ position: "absolute", left: -14, top: 242, width: 5, height: 52, background: "#0F0D0B", borderRadius: "3px 0 0 3px" }} />
          <div style={{ position: "absolute", right: -14, top: 176, width: 5, height: 72, background: "#0F0D0B", borderRadius: "0 3px 3px 0" }} />

          {/* Screen */}
          <div style={{ width: 390, height: 844, borderRadius: 50, overflow: "hidden", display: "flex", flexDirection: "column", background: C.bgWarm }}>
            <StatusBar light={lightBar} />

            {/* Scrollable content area */}
            <div
              data-scroll
              style={{ flex: 1, overflowY: "auto", position: "relative" }}
            >
              <style>{`[data-scroll]::-webkit-scrollbar{display:none}[data-scroll]{scrollbar-width:none}`}</style>
              <Outlet />
            </div>

            <HomeIndicator />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar icons (inline SVG) ───────────────────────────────────────────────
function OnboardIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
}
function LockIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function PersonIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function MailIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>;
}
function FeedIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><path d="M4 6h16M4 10h16M4 14h8"/></svg>;
}
function TokenIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>;
}
function GridIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>;
}
function KeyIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><circle cx="8" cy="15" r="5"/><path d="M20 4l-8.3 8.3"/><path d="M18 6l2 2"/><path d="M15 9l2 2"/></svg>;
}
function ShieldIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.ochre }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
