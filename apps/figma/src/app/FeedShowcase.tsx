import { useState } from "react";

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
};

const cardShadow = "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)";

// ─── Shared primitives ────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.white, borderRadius: 12, boxShadow: cardShadow,
      marginLeft: 16, marginRight: 16, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function BadgePill({ label, bg, color, border }: { label: string; bg: string; color: string; border?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: bg, color, border: border ?? "none",
      borderRadius: 9999, padding: "3px 10px",
      fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700,
      letterSpacing: "1px", textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const, lineHeight: 1.4,
    }}>
      {label}
    </span>
  );
}

// Outline-only reaction icons (stroke SVGs)
function HeartIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function FlameIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A4.5 4.5 0 0 0 12 19a4.5 4.5 0 0 0 3.5-4.5c0-2-1-3.5-2-5-.5 1.5-1.5 2-2 3-.5-1-1.5-3-1-5.5C8 9 7.5 11 8.5 14.5z" />
    </svg>
  );
}
function HandsIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H9.5L7 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2L14.5 2z" />
      <path d="M12 10v4M10 12h4" />
    </svg>
  );
}
function ShareIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ghost} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
function CalendarIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function PinIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Reaction bar (shared)
function ReactionBar({
  love, flame, hands, comments,
}: {
  love: number; flame: number; hands: number; comments?: number;
}) {
  const [loveOn, setLoveOn] = useState(false);
  const [flameOn, setFlameOn] = useState(false);
  const [handsOn, setHandsOn] = useState(false);

  type Reaction = { key: string; Icon: (p: { color: string }) => JSX.Element; count: number; active: boolean; toggle: () => void };
  const reactions: Reaction[] = [
    { key: "love",  Icon: HeartIcon, count: love,  active: loveOn,  toggle: () => setLoveOn(p => !p)  },
    { key: "flame", Icon: FlameIcon, count: flame, active: flameOn, toggle: () => setFlameOn(p => !p) },
    { key: "hands", Icon: HandsIcon, count: hands, active: handsOn, toggle: () => setHandsOn(p => !p) },
  ];

  return (
    <div style={{
      height: 44, display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingLeft: 16, paddingRight: 16, borderTop: `1px solid ${C.rule}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {reactions.map(r => (
          <button
            key={r.key}
            onClick={r.toggle}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <r.Icon color={r.active ? C.ochre : C.ghost} />
            <span style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              color: r.active ? C.ochre : C.mute, fontWeight: r.active ? 700 : 400,
            }}>
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
        <ShareIcon color={C.ghost} />
      </button>
    </div>
  );
}

// Image placeholder
function ImgBox({
  w, h, radius = 6, src, style,
}: {
  w?: number | string; h: number | string; radius?: number; src?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width: w ?? "100%", height: h, borderRadius: radius,
      background: `linear-gradient(135deg, #C4A27A 0%, #8B6B4A 100%)`,
      overflow: "hidden", flexShrink: 0, border: `1px solid ${C.ghost}`, ...style,
    }} />
  );
}

// Author row
function AuthorRow({
  name, username, time, tier, sectionTag, forYou,
}: {
  name: string; username: string; time: string; tier: "citizen" | "pro"; sectionTag?: string; forYou?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      {/* Flag */}
      <div style={{ position: "absolute", top: 0, right: 0 }}>
        <FlagIcon />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, #C4A27A, #8B5E3C)`,
          border: `1.5px solid ${tier === "pro" ? C.gold : C.ghost}`,
          boxShadow: tier === "pro" ? `0 0 0 2.5px ${C.gold}30` : "none",
        }} />
        {/* Name + meta */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: C.ink }}>{name}</span>
            {tier === "pro" && (
              <span style={{
                background: C.gold, color: C.white, borderRadius: 9999,
                padding: "3px 7px", fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 700,
                letterSpacing: "1px", textTransform: "uppercase" as const,
              }}>Connect Pro</span>
            )}
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ghost }}>·</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute }}>{time}</span>
          </div>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ghost, display: "block", marginTop: 1 }}>{username}</span>
          {sectionTag && (
            <div style={{ marginTop: 4 }}>
              <span style={{
                background: C.paperDeep, color: C.inkSoft, borderRadius: 9999,
                padding: "3px 8px", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700,
              }}>{sectionTag}</span>
            </div>
          )}
          {forYou && (
            <div style={{ marginTop: 4 }}>
              <span style={{
                border: `1px solid rgba(179,130,56,0.40)`, color: C.gold, borderRadius: 9999,
                padding: "2px 8px", fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 700,
                letterSpacing: "1px", textTransform: "uppercase" as const, background: "transparent",
              }}>✦ For You</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Link preview
function LinkPreview({
  domain, title, source,
}: {
  domain?: string; title: string; source: string;
}) {
  return (
    <div style={{
      background: C.paperDeep, borderRadius: 6, padding: 12,
      display: "flex", gap: 10, alignItems: "center", marginTop: 10,
    }}>
      <ImgBox w={60} h={60} radius={6} style={{ border: `1px solid ${C.ghost}`, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: C.mute, margin: 0 }}>
          {source}
        </p>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink,
          margin: "3px 0 0", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {title}
        </p>
        {domain && (
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.ghost, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {domain}
          </p>
        )}
      </div>
    </div>
  );
}

// Section label bar
function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 16px", background: C.bgWarm }}>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: C.mute, margin: 0, letterSpacing: "1.2px" }}>
        {children}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A — EDITORIAL CARDS
// ═══════════════════════════════════════════════════════════════════════════════

// A1 — PULSE
function CardA1() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BadgePill label="Lifestyle" bg="#FEF3E2" color={C.gold} />
            <BadgePill label="UK" bg="transparent" color={C.inkSoft} border={`1px solid ${C.ghost}`} />
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
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft, margin: "6px 0 0", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          From Tejuosho to Tokyo, a generation of designers is rewriting the rules...
        </p>
        {/* Image */}
        <ImgBox h={196} radius={6} style={{ marginTop: 10 }} />
        {/* Source */}
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.ghost, margin: "8px 0 0" }}>
          📰 Vogue Africa
        </p>
      </div>
      <ReactionBar love={234} flame={89} hands={145} />

      {/* Badge legend */}
      <div style={{ padding: "10px 16px 14px", borderTop: `1px solid ${C.rule}` }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, color: C.ghost, margin: "0 0 8px", letterSpacing: "1px" }}>
          ARM badge variants
        </p>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
          <BadgePill label="Lifestyle"   bg="#FEF3E2" color="#B38238" />
          <BadgePill label="Origins"     bg="#EDF7ED" color="#2E7D32" />
          <BadgePill label="Happenings"  bg="#EEEDFE" color="#3C3489" />
          <BadgePill label="Magazine"    bg="#FFF0EB" color={C.ochre} />
        </div>
      </div>
    </Card>
  );
}

// A2 — EDITORIAL
function CardA2() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BadgePill label="Editorial" bg="#FFF0EB" color={C.ochre} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: C.mute }}>· CULTURE</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.mute }}>Jun 9</span>
        </div>
        <p style={{
          fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: C.ink,
          margin: "10px 0 0", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          Afrobeats at the Crossroads: A Conversation with Adekunle Gold
        </p>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft, margin: "6px 0 0", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          In a wide-ranging conversation, Adekunle Gold speaks about identity, collaboration, and what it means to carry Afrobeats to a new generation of listeners who may never have set foot in Lagos.
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ochre, margin: "6px 0 0" }}>
          Read more →
        </p>
        <LinkPreview source="Moveee Magazine" title="Afrobeats at the Crossroads: A Conversation with Adekunle Gold" />
      </div>
    </Card>
  );
}

// A3 — HAPPENING
function CardA3() {
  return (
    <Card>
      {/* Badge sits above image, inside the card */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 10, left: 14, zIndex: 2 }}>
          <BadgePill label="Happening" bg="#EDE9FE" color="#4C1D95" />
        </div>
        {/* Full-width image — edge to edge, no h-padding */}
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "linear-gradient(135deg,#7C5CBF,#3B2A6E)" }}>
          {/* PRO ONLY badge overlay */}
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <span style={{
              background: C.gold, color: C.white, borderRadius: 9999,
              padding: "6px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700,
            }}>⭐ Pro Only</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 0" }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 700, color: C.ink, margin: 0 }}>
          Summer Solstice Rooftop Mixer
        </p>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarIcon color={C.mute} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>Sat, 24 Jun · 8:00 PM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PinIcon color={C.mute} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>The Standard, London</span>
          </div>
        </div>
        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingBottom: 16 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>Admission: £15</span>
          <div style={{
            height: 36, borderRadius: 9999, border: `1px solid ${C.ink}`,
            display: "flex", alignItems: "center", paddingLeft: 20, paddingRight: 20,
          }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink }}>RSVP</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// A4 — DIRECTORY
function CardA4() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BadgePill label="Directory" bg="#E8F5EE" color="#085041" />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: C.mute }}>· VENUE · 📍 London</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.mute }}>Jun 8</span>
        </div>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, color: C.ink,
          margin: "10px 0 0", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          Jazz Cafe — Camden's Cultural Cornerstone
        </p>
        <p style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft, margin: "6px 0 0", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          Since 1990 the Jazz Cafe has stood as one of London's most important live music venues — a space where Afrobeats, soul, reggae, and jazz converge and where community is the constant.
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ochre, margin: "6px 0 0" }}>
          Read more →
        </p>
        <LinkPreview source="Culture Directory" title="Jazz Cafe — Camden's Cultural Cornerstone" />
      </div>
      <ReactionBar love={58} flame={31} hands={74} />
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B — COMMUNITY CARDS
// ═══════════════════════════════════════════════════════════════════════════════

// B1 — Basic post
function CardB1() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Adaeze Okafor" username="@adaeze.o" time="5h" tier="citizen" sectionTag="🎵 Music" />
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "12px 0 0", lineHeight: 1.6 }}>
          Finally caught Burna Boy live at the O2 last night and I have genuinely no words. The man just EXISTS differently on stage. That's the only way I can describe it 🔥
        </p>
        <ImgBox h={220} radius={6} style={{ marginTop: 10, border: `1px solid ${C.ghost}` }} />
      </div>
      <ReactionBar love={112} flame={67} hands={43} comments={8} />
    </Card>
  );
}

// B2 — Post with link preview
function CardB2() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Kofi Mensah" username="@kofi.m" time="2h" tier="citizen" />
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "12px 0 0", lineHeight: 1.6 }}>
          This essay on Afrobeats and the politics of authenticity is essential reading.
        </p>
        <LinkPreview
          source="okayafrica.com"
          domain="okayafrica.com"
          title="Why Afrobeats Belongs to Everyone (and No One)"
        />
      </div>
      <ReactionBar love={88} flame={45} hands={31} comments={14} />
    </Card>
  );
}

// B3 — Hidden Gem
function CardB3() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Yemi Adeyemo" username="@yemi.vibes" time="8h" tier="citizen" />
        <div style={{ marginTop: 10 }}>
          <BadgePill label="Hidden Gem ★★★★" bg="#FEF3C7" color="#92400E" />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute, margin: "6px 0 0" }}>
          📍 Peckham, London
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
          Finally found the dopest vinyl shop in South London. If you know you know 🎵
        </p>
        {/* Gallery strip */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" as const, paddingBottom: 2 }}>
          <ImgBox w={180} h={130} radius={6} style={{ flexShrink: 0, border: `1px solid ${C.ghost}` }} />
          <ImgBox w={180} h={130} radius={6} style={{ flexShrink: 0, border: `1px solid ${C.ghost}`, background: "linear-gradient(135deg,#8B6B4A,#5C3D1A)" }} />
          {/* +1 overlay */}
          <div style={{
            width: 180, height: 130, borderRadius: 6, flexShrink: 0,
            background: "rgba(20,17,13,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.ghost}`,
          }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: C.white }}>+2</span>
          </div>
        </div>
      </div>
      <ReactionBar love={76} flame={38} hands={52} comments={12} />
    </Card>
  );
}

// B4 — Cultural Take
function CardB4() {
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Nkechi Balogun" username="@nkechi.creates" time="1d" tier="pro" forYou />
        <div style={{ marginTop: 10 }}>
          <BadgePill label="Cultural Take" bg="#E0E7FF" color="#3730A3" />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute, margin: "6px 0 0" }}>
          📍 Soho, London
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
          Hot take: the 'diversity' programming at major London galleries has actually made things worse, not better. Tokenism dressed up as progress. Here's why I think this, and what needs to change...
        </p>
        <ImgBox h={180} radius={6} style={{ marginTop: 10, border: `1px solid ${C.ghost}` }} />
      </div>
      <ReactionBar love={203} flame={97} hands={61} comments={19} />
    </Card>
  );
}

// B5 — Food Review
function CardB5() {
  const ratings: Array<{ label: string; score: number }> = [
    { label: "Taste", score: 5 },
    { label: "Value", score: 4 },
    { label: "Vibe",  score: 5 },
  ];

  function Stars({ score }: { score: number }) {
    return (
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ fontSize: 14, color: i < score ? C.ochre : C.ghost, lineHeight: 1 }}>
            {i < score ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Tolu Adeyinka" username="@tolu.eats" time="3h" tier="pro" />
        <div style={{ marginTop: 10 }}>
          <BadgePill label="Food Review · Suya Platter for Two" bg="#FCE7F3" color="#9D174D" />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute, margin: "6px 0 0" }}>
          📍 Shoreditch, London
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
          This underground suya spot changed my life. The marinade is unlike anything I've had in Lagos or London. Criminally underpriced.
        </p>
        {/* Ratings */}
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {ratings.map(r => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft, width: 52, flexShrink: 0 }}>{r.label}</span>
              <Stars score={r.score} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.gold, marginLeft: "auto" }}>
                {r.score}.0
              </span>
            </div>
          ))}
        </div>
        {/* Gallery */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" as const, paddingBottom: 2 }}>
          {["linear-gradient(135deg,#C4A27A,#8B5E3C)","linear-gradient(135deg,#D4A060,#6B3A1F)","linear-gradient(135deg,#A07040,#4A2800)"].map((bg, i) => (
            <div key={i} style={{ width: 200, height: 140, borderRadius: 6, flexShrink: 0, background: bg, border: `1px solid ${C.ghost}` }} />
          ))}
        </div>
      </div>
      <ReactionBar love={184} flame={91} hands={78} comments={21} />
    </Card>
  );
}

// B6 — Creative Showcase
function CardB6() {
  const [dot, setDot] = useState(0);
  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Efua Mensah" username="@efua.art" time="6h" tier="citizen" />
        <div style={{ marginTop: 10 }}>
          <BadgePill label="Creative Showcase" bg="#F3E8FF" color="#6B21A8" />
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
          New work — 'Displacement Series No. 4'. Textile + cyanotype. Limited edition prints available.
        </p>
        {/* Carousel */}
        <div style={{ marginTop: 12, display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 2 }}>
          {[
            "linear-gradient(135deg,#6B21A8,#3B0A6E)",
            "linear-gradient(135deg,#9B59B6,#2C1654)",
            "linear-gradient(135deg,#7C3AED,#4C1D95)",
          ].map((bg, i) => (
            <div key={i} onClick={() => setDot(i)} style={{ width: 260, height: 200, borderRadius: 6, flexShrink: 0, background: bg, cursor: "pointer", border: `1px solid ${C.ghost}` }} />
          ))}
        </div>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {[0,1,2].map(i => (
            <div key={i} onClick={() => setDot(i)} style={{
              width: i === dot ? 7 : 5, height: i === dot ? 7 : 5,
              borderRadius: "50%", background: i === dot ? C.gold : C.ghost, cursor: "pointer",
            }} />
          ))}
        </div>
      </div>
      <ReactionBar love={64} flame={29} hands={18} comments={6} />
    </Card>
  );
}

// B7 — Poll
function CardB7() {
  const options = [
    { label: "90s Fela era",            pct: 18, winner: false },
    { label: "Burna Boy 2020s",         pct: 42, winner: true  },
    { label: "Wizkid Starboy era",      pct: 28, winner: false },
    { label: "It's all interconnected", pct: 12, winner: false },
  ];

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Damilola Adesanya" username="@dam.ade" time="12h" tier="citizen" />
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, margin: "12px 0 0", lineHeight: 1.4 }}>
          What's the best era of Afrobeats? 🎵
        </p>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map(opt => (
            <div key={opt.label} style={{ height: 48, borderRadius: 6, border: `1px solid ${C.rule}`, overflow: "hidden", position: "relative" }}>
              {/* Fill layer */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${opt.pct}%`,
                background: opt.winner ? "rgba(197,73,31,0.10)" : C.paperDeep,
                transition: "width 0.3s",
              }} />
              {/* Text layer */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 16 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink }}>{opt.label}</span>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: opt.winner ? C.ochre : C.mute }}>{opt.pct}%</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.mute, margin: "8px 0 0" }}>
          42 votes · Poll closed
        </p>
      </div>
      <ReactionBar love={95} flame={44} hands={33} comments={17} />
    </Card>
  );
}

// B8 — Itinerary
function CardB8() {
  const stops = [
    { name: "Kalakuta Museum",     note: "Start early — essential history" },
    { name: "Eko Hotel beach bar", note: "Sunset drinks, non-negotiable" },
    { name: "Quilox",              note: "Can't leave Lagos without this" },
    { name: "Terra Kulture",       note: "Sunday brunch to close it out" },
  ];

  return (
    <Card>
      <div style={{ padding: 16 }}>
        <AuthorRow name="Seun Okonkwo" username="@seun.routes" time="2d" tier="pro" />
        <div style={{ marginTop: 10 }}>
          <BadgePill label="Itinerary" bg="#D1FAE5" color="#065F46" />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.mute, margin: "6px 0 0" }}>
          📍 Lagos, Nigeria
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "10px 0 0", lineHeight: 1.6 }}>
          48 hours in Lagos done right. Every stop is worth it.
        </p>

        {/* Stops */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
          {stops.map((stop, i) => (
            <div key={stop.name} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {/* Left: number + connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: C.gold,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: C.white }}>{i + 1}</span>
                </div>
                {i < stops.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 22, borderLeft: `1.5px dashed ${C.gold}`, margin: "3px 0" }} />
                )}
              </div>
              {/* Right: content */}
              <div style={{ paddingBottom: i < stops.length - 1 ? 10 : 0, paddingTop: 2 }}>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>{stop.name}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.mute, margin: "2px 0 0" }}>{stop.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ReactionBar love={143} flame={58} hands={87} comments={9} />
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION C — QUOTE
// ═══════════════════════════════════════════════════════════════════════════════

function CardC1() {
  return (
    <Card>
      <div style={{ padding: "20px 16px", position: "relative" }}>
        {/* Decorative quote mark */}
        <span style={{
          position: "absolute", top: 14, left: 14,
          fontFamily: "'Fraunces',serif", fontSize: 52, color: C.ghost,
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
          zIndex: 0,
        }}>
          "
        </span>
        {/* Quote text */}
        <p style={{
          fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700,
          fontStyle: "italic", color: C.ink, lineHeight: 1.55,
          margin: "0 0 0 8px", position: "relative", zIndex: 1,
        }}>
          Not everything that is faced can be changed, but nothing can be changed until it is faced.
        </p>
        {/* Attribution */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.inkSoft }}>— James Baldwin</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.ghost }}>Notes of a Native Son</span>
        </div>
      </div>
      <ReactionBar love={124} flame={24} hands={8} />
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function FeedShowcase() {
  return (
    <div style={{
      width: 390, minHeight: 4000, margin: "0 auto",
      background: C.bgWarm, fontFamily: "'DM Sans',sans-serif",
      paddingBottom: 80,
    }}>
      {/* Page header */}
      <div style={{ padding: "48px 16px 20px", borderBottom: `1px solid rgba(20,17,13,0.10)` }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.mute, margin: "0 0 6px" }}>
          Moveee Connect
        </p>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: C.ink, margin: 0 }}>
          Feed Card Library
        </h1>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.mute, margin: "4px 0 0" }}>
          All 13 card variants · Connect Feed
        </p>
      </div>

      {/* SECTION A */}
      <div style={{ height: 20 }} />
      <SectionBar>Editorial Feed Cards</SectionBar>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
        <div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.ghost, padding: "4px 16px 6px" }}>A1 — Pulse</p>
          <CardA1 />
        </div>
        <div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.ghost, padding: "4px 16px 6px" }}>A2 — Editorial</p>
          <CardA2 />
        </div>
        <div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.ghost, padding: "4px 16px 6px" }}>A3 — Happening</p>
          <CardA3 />
        </div>
        <div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.ghost, padding: "4px 16px 6px" }}>A4 — Directory</p>
          <CardA4 />
        </div>
      </div>

      {/* SECTION B */}
      <div style={{ height: 20 }} />
      <SectionBar>Community Post Cards</SectionBar>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
        {[
          { label: "B1 — Post", el: <CardB1 /> },
          { label: "B2 — Post with Link Preview", el: <CardB2 /> },
          { label: "B3 — Hidden Gem", el: <CardB3 /> },
          { label: "B4 — Cultural Take", el: <CardB4 /> },
          { label: "B5 — Food Review", el: <CardB5 /> },
          { label: "B6 — Creative Showcase", el: <CardB6 /> },
          { label: "B7 — Poll", el: <CardB7 /> },
          { label: "B8 — Itinerary", el: <CardB8 /> },
        ].map(({ label, el }) => (
          <div key={label}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.ghost, padding: "4px 16px 6px" }}>{label}</p>
            {el}
          </div>
        ))}
      </div>

      {/* SECTION C */}
      <div style={{ height: 20 }} />
      <SectionBar>Quote Card</SectionBar>
      <div style={{ paddingTop: 4 }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.ghost, padding: "4px 16px 6px" }}>C1 — Quote</p>
        <CardC1 />
      </div>
    </div>
  );
}
