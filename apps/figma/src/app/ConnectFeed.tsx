import { useRef, useState } from "react";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  bgWarm:    "#F3ECE0",
  white:     "#FFFFFF",
  paperDeep: "#F5F5F5",
  ink:       "#14110D",
  inkSoft:   "#3A342B",
  mute:      "#7A6F5C",
  ghost:     "#C8BFB0",
  rule:      "#E8E2D8",
  ochre:     "#C5491F",
  gold:      "#B38238",
  success:   "#2D6A4F",
  error:     "#C62828",
  warning:   "#E65100",
};

const cardShadow = "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)";
const fabShadow  = "0px 4px 12px rgba(197,73,31,0.35)";

// 844 - 59 status bar - 34 home indicator
const CONTENT_H = 751;
const NAV_H     = 49; // tab bar only (home indicator is Root's)

// ─── Shared primitives ────────────────────────────────────────────────────────
function BadgePill({
  label, bg, color, border,
}: {
  label: string; bg: string; color: string; border?: string;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color, border: border ?? "none",
      borderRadius: 9999, padding: "3px 8px",
      fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
      letterSpacing: "1px", textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const, lineHeight: 1.4, flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Reaction icons (outline SVG — matches FeedShowcase source of truth) ──────
function HeartIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
function FlameIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A4.5 4.5 0 0 0 12 19a4.5 4.5 0 0 0 3.5-4.5c0-2-1-3.5-2-5-.5 1.5-1.5 2-2 3-.5-1-1.5-3-1-5.5C8 9 7.5 11 8.5 14.5z"/></svg>;
}
function HandsIcon({ color }: { color: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H9.5L7 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2L14.5 2z"/><path d="M12 10v4M10 12h4"/></svg>;
}
function ShareIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ghost} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
}

// ─── Reaction bar — matches FeedShowcase exactly ──────────────────────────────
type Counts = { love: number; fire: number; clap: number };

function ReactionBar({ counts, comments }: { counts: Counts; comments?: number }) {
  const [love,  setLove]  = useState(counts.love);
  const [fire,  setFire]  = useState(counts.fire);
  const [clap,  setClap]  = useState(counts.clap);
  const [lOn,   setLOn]   = useState(false);
  const [fOn,   setFOn]   = useState(false);
  const [cOn,   setCOn]   = useState(false);

  type R = { key: string; Icon: (p: { color: string }) => JSX.Element; count: number; active: boolean; toggle: () => void };
  const reactions: R[] = [
    { key: "love",  Icon: HeartIcon, count: love, active: lOn, toggle: () => { setLove(n => lOn ? n-1 : n+1); setLOn(p => !p); } },
    { key: "flame", Icon: FlameIcon, count: fire, active: fOn, toggle: () => { setFire(n => fOn ? n-1 : n+1); setFOn(p => !p); } },
    { key: "hands", Icon: HandsIcon, count: clap, active: cOn, toggle: () => { setClap(n => cOn ? n-1 : n+1); setCOn(p => !p); } },
  ];

  return (
    <div style={{
      height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 16, paddingRight: 16, borderTop: `1px solid ${C.rule}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {reactions.map(r => (
          <button key={r.key} onClick={r.toggle}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <r.Icon color={r.active ? C.ochre : C.ghost} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: r.active ? C.ochre : C.mute, fontWeight: r.active ? 700 : 400 }}>
              {r.active ? r.count + 1 : r.count}
            </span>
          </button>
        ))}
        {comments !== undefined && (
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>
            {comments} comments
          </span>
        )}
      </div>
      <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ShareIcon />
      </button>
    </div>
  );
}

// ─── APP HEADER ───────────────────────────────────────────────────────────────
function AppHeader({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div style={{
      height: 52, background: C.white, flexShrink: 0,
      boxShadow: cardShadow, zIndex: 30,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 16, paddingRight: 12,
    }}>
      {/* Wordmark */}
      <div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
          moveee
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 700, color: C.gold, letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>
          connect
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Refresh */}
        <button onClick={onRefresh} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ghost} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>

        {/* Bell */}
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div style={{
            position: "absolute", top: 2, right: 2,
            width: 16, height: 16, borderRadius: "50%",
            background: C.ochre, border: `2px solid ${C.white}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700, color: C.white, lineHeight: 1 }}>3</span>
          </div>
        </button>

        {/* New post FAB-lite */}
        <button style={{
          width: 32, height: 32, borderRadius: "50%", background: C.ochre,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── FILTER ROW ───────────────────────────────────────────────────────────────
const FILTERS = ["✦ For You", "All", "Music", "Film", "Art", "Fashion", "Food", "Tech", "Sport", "Travel", "Design", "Literature"];

function FilterRow({ active, onSelect }: { active: string; onSelect: (f: string) => void }) {
  return (
    <div style={{
      height: 52, background: C.white, flexShrink: 0,
      borderBottom: `1px solid ${C.rule}`,
      display: "flex", alignItems: "center",
      overflowX: "auto", gap: 0,
      paddingLeft: 12, paddingRight: 12,
    }}>
      <style>{`[data-filters]::-webkit-scrollbar{display:none}[data-filters]{scrollbar-width:none}`}</style>
      <div data-filters style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", scrollbarWidth: "none" }}>
        {FILTERS.map(f => {
          const isActive = active === f;
          return (
            <button
              key={f}
              onClick={() => onSelect(f)}
              style={{
                height: 32, borderRadius: 9999,
                paddingLeft: 12, paddingRight: 12,
                background: isActive ? C.ochre : "transparent",
                border: isActive ? "none" : `1px solid ${C.ghost}`,
                cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <span style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
                color: isActive ? C.white : C.inkSoft,
                whiteSpace: "nowrap",
              }}>
                {f}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── TRENDING STRIP (For You only) ───────────────────────────────────────────
const TRENDING = [
  { badge: "EDITORIAL", title: "Lagos Street Style Goes Global", colors: ["#8B3A1A", "#C5491F"] as [string,string] },
  { badge: "HAPPENING", title: "Afrobeats Festival Lineup Drops", colors: ["#2C1654", "#4C1D95"] as [string,string] },
  { badge: "CULTURE",   title: "Hidden Gems: Accra's Art Scene",  colors: ["#1A3A2A", "#2D6A4F"] as [string,string] },
];

function TrendingStrip() {
  return (
    <div style={{ background: C.white, paddingBottom: 12, borderBottom: `1px solid ${C.rule}`, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px 8px" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.ochre }}>
          Trending now
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.ghost, cursor: "pointer" }}>See all →</span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingLeft: 16, paddingRight: 16 }}>
        {TRENDING.map((t, i) => (
          <div key={i} style={{
            width: 160, height: 88, borderRadius: 10, flexShrink: 0,
            position: "relative", overflow: "hidden", cursor: "pointer",
            background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)`,
          }}>
            {/* Gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(20,17,13,0.75) 0%, rgba(20,17,13,0) 55%)",
            }} />
            {/* Badge */}
            <div style={{ position: "absolute", top: 8, left: 8 }}>
              <span style={{
                background: "rgba(255,255,255,0.18)", color: C.white, borderRadius: 9999,
                padding: "2px 7px", fontFamily: "'DM Sans',sans-serif",
                fontSize: 8, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
              }}>
                {t.badge}
              </span>
            </div>
            {/* Title */}
            <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
              <p style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700,
                color: C.white, margin: 0, lineHeight: 1.35,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {t.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PULL TO REFRESH indicator ────────────────────────────────────────────────
function RefreshIndicator() {
  return (
    <>
      <style>{`@keyframes cf-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: C.bgWarm }}>
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: "cf-spin .8s linear infinite" }}>
          <circle cx="10" cy="10" r="8" fill="none" stroke={`${C.ochre}30`} strokeWidth="2" />
          <path d="M10 2 A8 8 0 0 1 18 10" fill="none" stroke={C.ochre} strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.mute }}>Refreshing…</span>
      </div>
    </>
  );
}

// ─── CARD 1: Editorial — matches CardA1 (Pulse) layout from FeedShowcase ─────
function Card1Editorial() {
  return (
    <div style={{ background: C.white, borderRadius: 12, boxShadow: cardShadow, marginLeft: 16, marginRight: 16, overflow: "hidden" }}>
      <div style={{ padding: 16 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BadgePill label="Editorial" bg="#FFF0EB" color={C.ochre} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: C.mute }}>· FASHION</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.mute }}>4h ago</span>
        </div>

        {/* Headline */}
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, color: C.ink,
          margin: "10px 0 0", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          The New Wave of Lagos Street Style Taking Over Global Fashion
        </p>

        {/* Excerpt */}
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft,
          margin: "6px 0 0", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          From Tejuosho to Tokyo, a generation of Lagos designers is rewriting the rules...
        </p>

        {/* Image — full width inside padding, with ghost border like showcase ImgBox */}
        <div style={{
          marginTop: 10, height: 196, borderRadius: 6,
          background: "linear-gradient(135deg, #4A1A6E 0%, #C5491F 100%)",
          border: `1px solid ${C.ghost}`,
        }} />

        {/* Source */}
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ghost, margin: "8px 0 0" }}>
          📰 Vogue Africa
        </p>
      </div>
      <ReactionBar counts={{ love: 234, fire: 89, clap: 145 }} />
    </div>
  );
}

// ─── CARD 2: Community Hidden Gem — matches CardB3 from FeedShowcase ─────────
function Card2HiddenGem({ forYou = false }: { forYou?: boolean }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, boxShadow: cardShadow,
      marginLeft: 16, marginRight: 16, overflow: "hidden", position: "relative",
    }}>
      {/* For You badge — top-right overlay */}
      {forYou && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5 }}>
          <span style={{
            background: C.ochre, color: C.white, borderRadius: 9999,
            padding: "3px 8px", fontFamily: "'DM Sans',sans-serif",
            fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const,
          }}>✦ For You</span>
        </div>
      )}

      <div style={{ padding: 16 }}>
        {/* Author row — 40px avatar matching showcase */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ghost} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #C4A27A, #8B5E3C)",
              border: `1.5px solid ${C.ghost}`,
            }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: C.ink }}>Kemi Adeyemi</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ghost }}>·</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute }}>5h</span>
              </div>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ghost, display: "block", marginTop: 1 }}>@kemiad</span>
            </div>
          </div>
        </div>

        {/* Template badge — "Hidden Gem ★★★★" matching showcase */}
        <div style={{ marginTop: 10 }}>
          <BadgePill label="Hidden Gem ★★★★" bg="#FEF3C7" color="#92400E" />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute, margin: "6px 0 0" }}>
          📍 Peckham, London
        </p>

        {/* Content */}
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
          Finally found the dopest vinyl shop in South London. If you know you know 🎵
        </p>

        {/* Gallery strip — horizontal scroll with 180×130 images matching showcase */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" as const, paddingBottom: 2 }}>
          <div style={{ width: 180, height: 130, borderRadius: 6, flexShrink: 0, background: "linear-gradient(135deg,#C4A27A,#8B6B4A)", border: `1px solid ${C.ghost}` }} />
          <div style={{ width: 180, height: 130, borderRadius: 6, flexShrink: 0, background: "linear-gradient(135deg,#8B6B4A,#5C3D1A)", border: `1px solid ${C.ghost}` }} />
          <div style={{
            width: 180, height: 130, borderRadius: 6, flexShrink: 0,
            background: "rgba(20,17,13,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.ghost}`,
          }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: C.white }}>+2</span>
          </div>
        </div>
      </div>

      <ReactionBar counts={{ love: 76, fire: 38, clap: 52 }} comments={12} />
    </div>
  );
}

// ─── CARD 3: Happening — matches CardA3 from FeedShowcase ────────────────────
function Card3Happening() {
  return (
    <div style={{ background: C.white, borderRadius: 12, boxShadow: cardShadow, marginLeft: 16, marginRight: 16, overflow: "hidden" }}>
      {/* Badge absolute above full-bleed image — matching showcase exactly */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 10, left: 14, zIndex: 2 }}>
          <BadgePill label="Happening" bg="#EDE9FE" color="#4C1D95" />
        </div>
        {/* Full-width 16:9 image, no horizontal margin */}
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "linear-gradient(135deg,#1A0A3E,#4C1D95)" }}>
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <span style={{
              background: C.gold, color: C.white, borderRadius: 9999,
              padding: "6px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700,
            }}>⭐ Pro Only</span>
          </div>
        </div>
      </div>

      {/* Content area — 14px top padding matching showcase */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 700, color: C.ink, margin: 0 }}>
          Amapiano Night at Jazz Cafe
        </p>

        {/* Metadata with SVG icons — matching showcase CalendarIcon/PinIcon */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>Fri 13 Jun · 9:00 PM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>Jazz Cafe, Camden</span>
          </div>
        </div>

        {/* Bottom row — ink border RSVP button matching showcase */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingBottom: 16 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>Free · Limited spots</span>
          <div style={{
            height: 36, borderRadius: 9999, border: `1px solid ${C.ink}`,
            display: "flex", alignItems: "center", paddingLeft: 20, paddingRight: 20, cursor: "pointer",
          }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink }}>RSVP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CARD 4: Quote — matches CardC1 from FeedShowcase exactly ────────────────
function Card4Quote() {
  return (
    <div style={{ background: C.white, borderRadius: 12, boxShadow: cardShadow, marginLeft: 16, marginRight: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 16px", position: "relative" }}>
        {/* Decorative mark — 52px ghost, absolute top:14 left:14, z-index 0 */}
        <span style={{
          position: "absolute", top: 14, left: 14,
          fontFamily: "'Fraunces',serif", fontSize: 52, color: C.ghost,
          lineHeight: 1, pointerEvents: "none", userSelect: "none", zIndex: 0,
        }}>
          "
        </span>

        {/* Quote text — 19px bold italic, LEFT-aligned, z-index 1 */}
        <p style={{
          fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700,
          fontStyle: "italic", color: C.ink, lineHeight: 1.55,
          margin: "0 0 0 8px", position: "relative", zIndex: 1,
        }}>
          The world doesn't need another copycat. It needs you, fully and specifically yourself.
        </p>

        {/* Attribution — left-aligned, flex column, gap 4 */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft }}>— Chimamanda Ngozi Adichie</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.ghost }}>We Do This 'Til We Free Us</span>
        </div>
      </div>
      <ReactionBar counts={{ love: 412, fire: 134, clap: 289 }} />
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
const NAV_TABS = [
  { label: "Connect",  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: "Magazine", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { label: "Games",    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M8 12h2m-1-1v2"/><circle cx="15.5" cy="11.5" r=".7" fill="currentColor" stroke="none"/><circle cx="17.5" cy="13.5" r=".7" fill="currentColor" stroke="none"/></svg> },
  { label: "Events",   icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { label: "Me",       icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

function BottomNav({ active, onTab }: { active: number; onTab: (i: number) => void }) {
  return (
    <div style={{
      height: NAV_H, background: C.white, flexShrink: 0,
      borderTop: `1px solid ${C.rule}`, display: "flex",
    }}>
      {NAV_TABS.map((tab, i) => {
        const isActive = active === i;
        const color = isActive ? C.ochre : C.mute;
        return (
          <button
            key={tab.label}
            onClick={() => onTab(i)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              color,
            }}
          >
            {tab.icon}
            <span style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 10,
              fontWeight: isActive ? 700 : 400, color,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────
function FAB() {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        position: "absolute",
        bottom: NAV_H + 16,
        right: 16,
        width: 56, height: 56, borderRadius: "50%",
        background: C.ochre, border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: fabShadow,
        transform: pressed ? "scale(0.93)" : "scale(1)",
        transition: "transform 0.1s",
        zIndex: 40,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function ConnectFeed() {
  const [filter,     setFilter]     = useState("All");
  const [activeTab,  setActiveTab]  = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const forYou = filter === "✦ For You";

  function handleRefresh() {
    setRefreshing(true);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setTimeout(() => setRefreshing(false), 2000);
  }

  return (
    <div style={{
      height: CONTENT_H, display: "flex", flexDirection: "column",
      background: C.bgWarm, position: "relative", overflow: "hidden",
    }}>
      <AppHeader onRefresh={handleRefresh} />
      <FilterRow active={filter} onSelect={setFilter} />

      {/* Scrollable feed area */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}
      >
        <style>{`[data-feed-scroll]::-webkit-scrollbar{display:none}`}</style>

        {/* Trending strip (For You only) */}
        {forYou && <TrendingStrip />}

        {/* Pull to refresh indicator */}
        {refreshing && <RefreshIndicator />}

        {/* Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12, paddingBottom: 16 }}>
          <Card1Editorial />
          <Card2HiddenGem forYou={forYou} />
          <Card3Happening />
          <Card4Quote />

          {/* Repeat a couple for scroll depth */}
          <Card1Editorial />
          <Card2HiddenGem forYou={forYou} />
        </div>
      </div>

      <BottomNav active={activeTab} onTab={setActiveTab} />
      <FAB />
    </div>
  );
}
