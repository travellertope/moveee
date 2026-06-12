import { useState } from "react";

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bgWarm:    "#F3ECE0",
  white:     "#FFFFFF",
  paperDeep: "#F5F5F5",
  ink:       "#14110D",
  inkSoft:   "#3A342B",
  mute:      "#7A6F5C",
  ghost:     "#C8BFB0",
  ochre:     "#C5491F",
  gold:      "#B38238",
  success:   "#2D6A4F",
  error:     "#C62828",
  warning:   "#E65100",
  border:    "rgba(20,17,13,0.10)",
  borderMid: "rgba(20,17,13,0.18)",
};

const cardShadow = "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)";

// ─── Layout primitives ──────────────────────────────────────────────────────
function Section({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "32px 0 0" }}>{children}</div>;
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: C.ochre, margin: 0 }}>
        Component
      </p>
      <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.3, color: C.ink, margin: "2px 0 0" }}>
        {title}
      </h2>
    </div>
  );
}

function StateTag({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: C.mute, margin: "0 0 8px" }}>
      {children}
    </p>
  );
}

function Rule() {
  return <div style={{ height: 1, background: C.border, margin: "32px 0 0" }} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, boxShadow: cardShadow, ...style }}>
      {children}
    </div>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────────────
function Spinner({ color = C.white }: { color?: string }) {
  return (
    <>
      <style>{`@keyframes mc-spin{to{transform:rotate(360deg)}}`}</style>
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: "mc-spin .75s linear infinite", display: "block" }}>
        <circle cx="9" cy="9" r="6.5" fill="none" stroke={color} strokeWidth="2"
          strokeDasharray="30" strokeDashoffset="10" strokeLinecap="round" />
      </svg>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUTTONS
// ══════════════════════════════════════════════════════════════════════════════
type BtnVariant = "primary" | "secondary" | "ghost";

function PillBtn({
  label, variant, state,
}: {
  label: string;
  variant: BtnVariant;
  state: "default" | "loading" | "disabled" | "destructive";
}) {
  const bg =
    state === "destructive" ? C.error :
    variant === "primary"   ? C.ochre :
    variant === "secondary" ? C.white : "transparent";

  const textColor =
    state === "destructive" ? C.white :
    variant === "primary"   ? C.white :
    variant === "secondary" ? C.ink   : C.ochre;

  const border =
    variant === "secondary" && state !== "destructive" ? `1.5px solid ${C.ink}` :
    variant === "secondary" && state === "destructive" ? `1.5px solid ${C.error}` : "none";

  return (
    <div
      style={{
        height: 52, borderRadius: 9999, background: bg,
        border, opacity: state === "disabled" ? 0.4 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingLeft: 24, paddingRight: 24, gap: 8,
        boxSizing: "border-box",
      }}
    >
      {state === "loading"
        ? <Spinner color={variant === "ghost" ? C.ochre : C.white} />
        : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: textColor, whiteSpace: "nowrap" }}>
            {label}
          </span>
      }
    </div>
  );
}

function IconBtn({ icon, bg = C.paperDeep, opacity = 1 }: { icon: React.ReactNode; bg?: string; opacity?: number }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: "50%", background: bg, opacity,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {icon}
    </div>
  );
}

function ButtonsSection() {
  const COL_W = 72;
  const cols = ["Default", "Loading", "Disabled", "Destructive"];
  const rows: Array<{ id: string; variant: BtnVariant; label: string; dLabel: string }> = [
    { id: "A", variant: "primary",   label: "Join now", dLabel: "Primary"   },
    { id: "B", variant: "secondary", label: "Follow",   dLabel: "Secondary" },
    { id: "C", variant: "ghost",     label: "See all",  dLabel: "Ghost"     },
  ];

  return (
    <Section>
      <SectionHead title="Buttons" />

      {/* Column headers */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, paddingLeft: COL_W + 8 }}>
        {cols.map(c => (
          <div key={c} style={{ flex: 1, textAlign: "center" }}>
            <StateTag>{c}</StateTag>
          </div>
        ))}
      </div>

      {/* Pill rows */}
      {rows.map(row => (
        <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: COL_W, flexShrink: 0 }}>
            <StateTag>{row.dLabel}</StateTag>
          </div>
          {(["default","loading","disabled","destructive"] as const).map(s => (
            <div key={s} style={{ flex: 1 }}>
              <PillBtn label={row.label} variant={row.variant} state={s} />
            </div>
          ))}
        </div>
      ))}

      {/* Icon button row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <div style={{ width: COL_W, flexShrink: 0 }}><StateTag>Icon</StateTag></div>
        <IconBtn icon={<SearchSVG color={C.mute} />} />
        <IconBtn icon={<PlusSVG color={C.white} />} bg={C.ochre} />
        <IconBtn icon={<BellSVG color={C.ink} size={18} />} bg={C.paperDeep} />
        <IconBtn icon={<TrashSVG />} bg={`${C.error}14`} />
        <IconBtn icon={<SearchSVG color={C.mute} />} opacity={0.4} />
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INPUTS
// ══════════════════════════════════════════════════════════════════════════════
type InputState = "empty" | "focused" | "filled" | "error" | "disabled";

function InputField({
  state, value, placeholder = "Search communities…", errorMsg, textarea,
}: {
  state: InputState; value?: string; placeholder?: string; errorMsg?: string; textarea?: boolean;
}) {
  const isFocused   = state === "focused";
  const isError     = state === "error";
  const isDisabled  = state === "disabled";

  const borderColor = isError ? C.error : isFocused ? C.ink : C.ghost;
  const borderW     = isFocused ? "1.5px" : "1px";

  const baseBox: React.CSSProperties = {
    width: "100%", background: C.white, borderRadius: 6,
    border: `${borderW} solid ${borderColor}`,
    opacity: isDisabled ? 0.5 : 1,
    boxSizing: "border-box" as const,
    position: "relative" as const,
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={baseBox}>
        {/* Left icon */}
        <div style={{
          position: "absolute", left: 14,
          top: textarea ? 16 : "50%",
          transform: textarea ? "none" : "translateY(-50%)",
        }}>
          <SearchSVG color={C.ghost} />
        </div>

        {textarea ? (
          <div style={{
            minHeight: 120, padding: "14px 16px 14px 42px",
            fontFamily: "'DM Sans',sans-serif", fontSize: 15,
            color: value ? C.ink : C.ghost, lineHeight: 1.5,
          }}>
            {value ?? placeholder}
          </div>
        ) : (
          <div style={{
            height: 52, display: "flex", alignItems: "center",
            paddingLeft: 42, paddingRight: 16,
            fontFamily: "'DM Sans',sans-serif", fontSize: 15,
            color: value ? C.ink : C.ghost,
          }}>
            {value ?? placeholder}
          </div>
        )}
      </div>

      {isError && errorMsg && (
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.error, margin: "5px 0 0 2px" }}>
          {errorMsg}
        </p>
      )}
      {textarea && (
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute, textAlign: "right", margin: "5px 0 0" }}>
          48 / 280
        </p>
      )}
    </div>
  );
}

function InputsSection() {
  const fields: Array<{ label: string; state: InputState; value?: string; error?: string; textarea?: boolean }> = [
    { label: "Empty",    state: "empty"   },
    { label: "Focused",  state: "focused" },
    { label: "Filled",   state: "filled",  value: "Lagos food spots 🍲" },
    { label: "Error",    state: "error",   value: "x", error: "Must be at least 3 characters." },
    { label: "Disabled", state: "disabled" },
    { label: "Textarea + counter", state: "filled", textarea: true,
      value: "Honestly the jollof rice at Ikoyi was transcendent — smoky, perfectly seasoned, with the ideal crust at the bottom…" },
  ];

  return (
    <Section>
      <SectionHead title="Inputs" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {fields.map(f => (
          <div key={f.label}>
            <StateTag>{f.label}</StateTag>
            <InputField state={f.state} value={f.value} errorMsg={f.error} textarea={f.textarea} />
          </div>
        ))}
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AVATARS
// ══════════════════════════════════════════════════════════════════════════════
type AvatarVariant = "photo" | "initials" | "citizen" | "pro";

function AvatarCircle({ size, variant, initials = "AO" }: { size: number; variant: AvatarVariant; initials?: string }) {
  const fontSize = size >= 96 ? 28 : size >= 64 ? 20 : size >= 44 ? 15 : size >= 32 ? 11 : 8;
  const ringGap  = 3;

  const circle = (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: variant === "photo" ? "#C4A27A" : C.paperDeep,
      border: variant === "citizen" ? `2px solid ${C.ghost}` :
              variant === "pro"     ? `2.5px solid ${C.gold}` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {variant === "photo"
        ? <AvatarPhotoSVG size={size} />
        : <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize, fontWeight: 700, color: C.inkSoft, userSelect: "none" }}>{initials}</span>
      }
    </div>
  );

  if (variant === "pro") {
    return (
      <div style={{ position: "relative", width: size + ringGap * 2, height: size + ringGap * 2, flexShrink: 0 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          boxShadow: `0 0 0 3px ${C.gold}38`,
        }} />
        <div style={{ position: "absolute", inset: ringGap }}>
          {circle}
        </div>
      </div>
    );
  }
  return circle;
}

function AvatarsSection() {
  const sizes: Array<{ px: number; label: string; initials: string }> = [
    { px: 96, label: "XL", initials: "NB" },
    { px: 64, label: "LG", initials: "AO" },
    { px: 44, label: "MD", initials: "TK" },
    { px: 32, label: "SM", initials: "EB" },
    { px: 24, label: "XS", initials: "KD" },
  ];
  const variants: AvatarVariant[] = ["photo", "initials", "citizen", "pro"];
  const variantLabels = ["Photo", "Initials", "Citizen", "Pro"];

  return (
    <Section>
      <SectionHead title="Avatars" />
      {/* Header */}
      <div style={{ display: "flex", marginBottom: 12 }}>
        <div style={{ width: 40, flexShrink: 0 }} />
        {variantLabels.map(v => (
          <div key={v} style={{ flex: 1, textAlign: "center" }}>
            <StateTag>{v}</StateTag>
          </div>
        ))}
      </div>
      {/* Rows */}
      {sizes.map(s => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 40, flexShrink: 0 }}>
            <StateTag>{s.label}</StateTag>
          </div>
          {variants.map(v => (
            <div key={v} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <AvatarCircle size={s.px} variant={v} initials={s.initials} />
            </div>
          ))}
        </div>
      ))}
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TIER BADGES
// ══════════════════════════════════════════════════════════════════════════════
function TierBadge({ tier }: { tier: "pro" | "citizen" }) {
  const isPro = tier === "pro";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: isPro ? C.gold : C.ghost,
      borderRadius: 9999, paddingTop: 4, paddingBottom: 4, paddingLeft: 10, paddingRight: 10,
    }}>
      {isPro && <span style={{ fontSize: 10, lineHeight: 1, color: C.white }}>★</span>}
      <span style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
        letterSpacing: "1.5px", textTransform: "uppercase" as const,
        color: isPro ? C.white : C.inkSoft,
      }}>
        {isPro ? "Connect Pro" : "Connect Citizen"}
      </span>
    </div>
  );
}

function TierBadgesSection() {
  return (
    <Section>
      <SectionHead title="Tier Badges" />
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          <StateTag>Pro</StateTag>
          <TierBadge tier="pro" />
        </div>
        <div>
          <StateTag>Citizen</StateTag>
          <TierBadge tier="citizen" />
        </div>
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION BELL
// ══════════════════════════════════════════════════════════════════════════════
function NotificationBellSection() {
  return (
    <Section>
      <SectionHead title="Notification Bell" />
      <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
        <div>
          <StateTag>Clean</StateTag>
          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BellSVG color={C.ink} size={24} />
          </div>
        </div>
        <div>
          <StateTag>Unread (3)</StateTag>
          <div style={{ position: "relative", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BellSVG color={C.ink} size={24} />
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 16, height: 16, borderRadius: "50%",
              background: C.ochre, border: `2px solid ${C.bgWarm}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, fontWeight: 700, color: C.white, lineHeight: 1 }}>3</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REACTION BAR
// ══════════════════════════════════════════════════════════════════════════════
function ReactionBarSection() {
  const [loveOn, setLoveOn] = useState(false);
  const [fireOn, setFireOn] = useState(false);
  const [clapOn, setClapOn] = useState(false);

  function ReactionBar({ interactive }: { interactive?: boolean }) {
    const reactions = [
      { emoji: "❤️", baseCount: 47, active: interactive && loveOn, color: C.error,   toggle: () => setLoveOn(p => !p) },
      { emoji: "🔥", baseCount: 23, active: interactive && fireOn, color: C.warning,  toggle: () => setFireOn(p => !p) },
      { emoji: "👏", baseCount: 91, active: interactive && clapOn, color: C.success,  toggle: () => setClapOn(p => !p) },
    ];
    return (
      <div style={{
        height: 44, background: C.white, borderRadius: 12,
        display: "flex", alignItems: "center", paddingLeft: 16, paddingRight: 16,
        justifyContent: "space-between", boxShadow: cardShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {reactions.map(r => (
            <button
              key={r.emoji}
              onClick={interactive ? r.toggle : undefined}
              style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: interactive ? "pointer" : "default", padding: 0 }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }}>{r.emoji}</span>
              <span style={{
                fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                color: r.active ? r.color : C.mute,
                fontWeight: r.active ? 700 : 400,
              }}>
                {r.active ? r.baseCount + 1 : r.baseCount}
              </span>
            </button>
          ))}
        </div>
        <ShareUpSVG color={C.ghost} />
      </div>
    );
  }

  return (
    <Section>
      <SectionHead title="Reaction Bar" />
      <StateTag>Default</StateTag>
      <ReactionBar />
      <div style={{ height: 16 }} />
      <StateTag>Interactive — tap to toggle</StateTag>
      <ReactionBar interactive />
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.ghost, margin: "6px 0 0" }}>
        ❤️ → error red · 🔥 → warning orange · 👏 → success green
      </p>
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV
// ══════════════════════════════════════════════════════════════════════════════
const NAV_TABS = ["Connect", "Magazine", "Games", "Events", "Me"] as const;
type NavTab = typeof NAV_TABS[number];

function NavTabIcons({ tab, color }: { tab: NavTab; color: string }) {
  switch (tab) {
    case "Connect":  return <PeopleSVG color={color} />;
    case "Magazine": return <BookSVG color={color} />;
    case "Games":    return <GameSVG color={color} />;
    case "Events":   return <CalendarSVG color={color} />;
    case "Me":       return <PersonSVG color={color} />;
  }
}

function NavBar({
  platform, proMe, active, onTab,
}: {
  platform: "ios" | "android";
  proMe?: boolean;
  active: number;
  onTab: (i: number) => void;
}) {
  const totalH = platform === "ios" ? 83 : 64;
  const tabH   = 49;

  return (
    <div style={{
      background: C.white, borderTop: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden", boxShadow: cardShadow,
    }}>
      <div style={{ height: tabH, display: "flex" }}>
        {NAV_TABS.map((tab, i) => {
          const isActive = active === i;
          const isMe     = tab === "Me";
          const color    = isActive ? (isMe && proMe ? C.gold : C.ochre) : C.mute;

          return (
            <button
              key={tab}
              onClick={() => onTab(i)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <NavTabIcons tab={tab} color={color} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: isActive ? 700 : 400, color }}>
                {tab}
              </span>
            </button>
          );
        })}
      </div>
      {platform === "ios" && (
        <div style={{ height: totalH - tabH, display: "flex", justifyContent: "center", alignItems: "flex-end", paddingBottom: 8 }}>
          <div style={{ width: 134, height: 5, background: C.ink, borderRadius: 9999, opacity: 0.18 }} />
        </div>
      )}
    </div>
  );
}

function BottomNavSection() {
  const [iosTab,  setIosTab]  = useState(0);
  const [andTab,  setAndTab]  = useState(2);
  const [proTab,  setProTab]  = useState(4);

  return (
    <Section>
      <SectionHead title="Bottom Navigation" />

      <StateTag>iOS — 83px (34px home indicator)</StateTag>
      <NavBar platform="ios" active={iosTab} onTab={setIosTab} />
      <div style={{ height: 20 }} />

      <StateTag>Android — 64px</StateTag>
      <NavBar platform="android" active={andTab} onTab={setAndTab} />
      <div style={{ height: 20 }} />

      <StateTag>Pro member — gold "Me" tab</StateTag>
      <NavBar platform="ios" proMe active={proTab} onTab={setProTab} />
    </Section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SVG ICONS
// ══════════════════════════════════════════════════════════════════════════════
const SVG = ({ size = 22, children, ...rest }: { size?: number; color?: string; children: React.ReactNode; [k: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={rest.color ?? C.mute}
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
    {children}
  </svg>
);

function SearchSVG({ color }: { color: string }) {
  return <SVG size={16} color={color}><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></SVG>;
}
function PlusSVG({ color }: { color: string }) {
  return <SVG size={16} color={color}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></SVG>;
}
function TrashSVG() {
  return <SVG size={16} color={C.error}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></SVG>;
}
function BellSVG({ color, size = 22 }: { color: string; size?: number }) {
  return <SVG size={size} color={color}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></SVG>;
}
function ShareUpSVG({ color }: { color: string }) {
  return <SVG size={18} color={color}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></SVG>;
}
function PeopleSVG({ color }: { color: string }) {
  return <SVG size={22} color={color}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SVG>;
}
function BookSVG({ color }: { color: string }) {
  return <SVG size={22} color={color}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></SVG>;
}
function GameSVG({ color }: { color: string }) {
  return <SVG size={22} color={color}><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M8 12h2m-1-1v2"/><circle cx="15.5" cy="11.5" r=".75" fill={color} stroke="none"/><circle cx="17.5" cy="13.5" r=".75" fill={color} stroke="none"/></SVG>;
}
function CalendarSVG({ color }: { color: string }) {
  return <SVG size={22} color={color}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SVG>;
}
function PersonSVG({ color }: { color: string }) {
  return <SVG size={22} color={color}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SVG>;
}
function AvatarPhotoSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" fill="#C4A27A"/>
      <ellipse cx="48" cy="38" rx="18" ry="20" fill="#8B5E3C"/>
      <ellipse cx="48" cy="86" rx="32" ry="22" fill="#8B5E3C"/>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function ComponentShowcase() {
  return (
    <div style={{
      width: 390, minHeight: 1600, margin: "0 auto",
      background: C.bgWarm, fontFamily: "'DM Sans',sans-serif",
      paddingBottom: 80,
    }}>
      {/* Page header */}
      <div style={{ padding: "48px 24px 24px", borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.mute, margin: "0 0 6px" }}>
          Moveee Connect
        </p>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: C.ink, margin: 0 }}>
          Component Library
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.mute, margin: "4px 0 0" }}>
          All states · iOS & Android
        </p>
      </div>

      <div style={{ padding: "0 24px" }}>
        <ButtonsSection />
        <Rule /><InputsSection />
        <Rule /><AvatarsSection />
        <Rule /><TierBadgesSection />
        <Rule /><NotificationBellSection />
        <Rule /><ReactionBarSection />
        <Rule /><BottomNavSection />
      </div>
    </div>
  );
}
