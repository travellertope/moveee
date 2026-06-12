import { Link } from "react-router";

const C = {
  bgWarm:  "#F3ECE0",
  white:   "#FFFFFF",
  ink:     "#14110D",
  inkSoft: "#3A342B",
  mute:    "#7A6F5C",
  ghost:   "#C8BFB0",
  ochre:   "#C5491F",
  gold:    "#B38238",
  border:  "rgba(20,17,13,0.10)",
};

const cardShadow = "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)";

const pages = [
  {
    path: "/design-system",
    eyebrow: "Foundation",
    title: "Design System",
    desc: "Colour tokens, typography, spacing, badges, and shadow reference.",
    accent: C.ochre,
    tag: "13 tokens",
  },
  {
    path: "/components",
    eyebrow: "UI Kit",
    title: "Component Library",
    desc: "Buttons, inputs, avatars, tier badges, notifications, reactions, and nav bars — all states.",
    accent: C.gold,
    tag: "7 components",
  },
  {
    path: "/feed",
    eyebrow: "Feed",
    title: "Feed Card Library",
    desc: "All 13 card variants in the Connect Feed — editorial, community posts, and quotes.",
    accent: "#2D6A4F",
    tag: "13 cards",
  },
  {
    path: "/onboarding",
    eyebrow: "Onboarding",
    title: "Onboarding Flow",
    desc: "Interactive 4-screen iOS onboarding — splash, cultural home, feature tour, earn screen.",
    accent: "#4C1D95",
    tag: "4 screens",
  },
  {
    path: "/auth",
    eyebrow: "Auth",
    title: "Auth Flow",
    desc: "Login (default, error, loading), register with password strength, and verify email — 5 frames.",
    accent: "#1E3A5F",
    tag: "5 frames",
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: C.bgWarm, padding: "64px 24px 80px" }}>
      {/* Header */}
      <div style={{ maxWidth: 480, margin: "0 auto 48px" }}>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
          letterSpacing: "1.5px", textTransform: "uppercase", color: C.mute, margin: "0 0 8px",
        }}>
          Moveee Connect
        </p>
        <h1 style={{
          fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 700,
          lineHeight: 1.15, letterSpacing: "-0.5px", color: C.ink, margin: "0 0 12px",
        }}>
          Design workspace
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, color: C.mute, margin: 0, lineHeight: 1.5 }}>
          All screens and component libraries for the Moveee Connect cultural community app.
        </p>
      </div>

      {/* Page cards */}
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {pages.map(p => (
          <Link
            key={p.path}
            to={p.path}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: C.white, borderRadius: 12, boxShadow: cardShadow,
              padding: "20px 20px 20px 20px",
              display: "flex", alignItems: "center", gap: 16,
              transition: "box-shadow 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0px 4px 16px rgba(20,17,13,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = cardShadow)}
            >
              {/* Colour dot */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: p.accent, opacity: 0.9,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase", color: C.mute, margin: "0 0 3px",
                }}>
                  {p.eyebrow}
                </p>
                <p style={{
                  fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700,
                  color: C.ink, margin: "0 0 4px", lineHeight: 1.2,
                }}>
                  {p.title}
                </p>
                <p style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute,
                  margin: 0, lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {p.desc}
                </p>
              </div>

              {/* Tag + arrow */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                  color: C.ghost, whiteSpace: "nowrap",
                }}>
                  {p.tag}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={C.ghost} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <p style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ghost,
        textAlign: "center", marginTop: 56,
      }}>
        Moveee Connect · Design System v1.0
      </p>
    </div>
  );
}
