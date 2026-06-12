import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

const C = {
  bgWarm:  "#F3ECE0",
  white:   "#FFFFFF",
  ink:     "#14110D",
  inkSoft: "#3A342B",
  mute:    "#7A6F5C",
  ghost:   "#C8BFB0",
  ochre:   "#C5491F",
  gold:    "#B38238",
};

// Available height inside phone frame (844 - 59 status bar - 34 home indicator)
const CONTENT_H = 751;
const W = 390;

// ─── Shared UI ────────────────────────────────────────────────────────────────
function PrimaryBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const [down, setDown] = useState(false);
  return (
    <button
      onPointerDown={() => setDown(true)}
      onPointerUp={() => { setDown(false); onPress(); }}
      onPointerLeave={() => setDown(false)}
      style={{
        width: "100%", height: 52, borderRadius: 9999, background: C.ochre,
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: down ? "scale(0.97)" : "scale(1)",
        opacity: down ? 0.88 : 1,
        transition: "transform 0.1s, opacity 0.1s",
      }}
    >
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 700, color: C.white }}>
        {label}
      </span>
    </button>
  );
}

function GhostBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button onClick={onPress} style={{
      width: "100%", height: 44, background: "none", border: "none",
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.ochre }}>{label}</span>
    </button>
  );
}

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 6, borderRadius: 9999,
          width: i === active ? 20 : 6,
          background: i === active ? C.ochre : C.ghost,
          transition: "width 0.25s ease, background 0.2s",
        }} />
      ))}
    </div>
  );
}

function BottomCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, borderRadius: "20px 20px 0 0", padding: "32px 32px 40px", boxShadow: "0 -4px 24px rgba(20,17,13,0.07)" }}>
      {children}
    </div>
  );
}

// ─── Slide 0: Splash ─────────────────────────────────────────────────────────
function Splash({ onDone }: { onDone: () => void }) {
  const [rot, setRot]   = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const spin = setInterval(() => setRot(r => r + 4), 16);
    const go   = setTimeout(() => { setFade(true); setTimeout(onDone, 450); }, 2200);
    return () => { clearInterval(spin); clearTimeout(go); };
  }, []);

  const r = 16; const cx = 20; const cy = 20;
  const arc = 270 * (Math.PI / 180);
  const x2 = cx + r * Math.cos(-Math.PI / 2 + arc);
  const y2 = cy + r * Math.sin(-Math.PI / 2 + arc);

  return (
    <div
      onClick={() => { setFade(true); setTimeout(onDone, 400); }}
      style={{
        width: "100%", height: CONTENT_H, background: C.bgWarm,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", opacity: fade ? 0 : 1, transition: "opacity 0.42s ease",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 36, fontWeight: 700, color: C.ink, letterSpacing: "-1px" }}>moveee</span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: "2px", textTransform: "uppercase", marginTop: 4 }}>connect</span>
        <div style={{ width: 40, height: 2, background: C.ochre, borderRadius: 9999, marginTop: 16 }} />
        <div style={{ marginTop: 40 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: `rotate(${rot}deg)`, display: "block" }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C.ochre}28`} strokeWidth="2" />
            <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${x2} ${y2}`} fill="none" stroke={C.ochre} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.mute, marginTop: 8 }}>Loading</span>
      </div>
    </div>
  );
}

// ─── Textile collage SVG ──────────────────────────────────────────────────────
function Textile({ height }: { height: number }) {
  return (
    <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={{ display: "block" }}>
      <rect width={W} height={height} fill="#7A3010" />
      <rect x="0"   y="0"   width="130" height="140" fill="#C5491F" />
      <rect x="130" y="0"   width="130" height="140" fill="#B38238" />
      <rect x="260" y="0"   width="130" height="140" fill="#3A1A08" />
      <rect x="0"   y="140" width="130" height="140" fill="#5C2A0E" />
      <rect x="130" y="140" width="130" height="140" fill="#C5491F" />
      <rect x="260" y="140" width="130" height="140" fill="#B38238" />
      <rect x="0"   y="280" width="130" height="140" fill="#B38238" />
      <rect x="130" y="280" width="130" height="140" fill="#4A1A06" />
      <rect x="260" y="280" width="130" height="140" fill="#C5491F" />
      {Array.from({ length: 26 }).map((_, i) => (
        <line key={i} x1={i * 32 - 160} y1="0" x2={i * 32 + 240} y2={height} stroke="rgba(255,255,255,0.055)" strokeWidth="12" />
      ))}
      <rect x="0" y="137" width={W} height="8" fill="rgba(243,236,224,0.14)" />
      <rect x="0" y="277" width={W} height="8" fill="rgba(243,236,224,0.14)" />
      {[65, 195, 325].map(cx2 => [28, 19, 11].map(r2 => (
        <circle key={`${cx2}-${r2}`} cx={cx2} cy={100} r={r2} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
      )))}
      <defs>
        <linearGradient id="ob-vig" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"  stopColor="#14110D" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#14110D" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={W} height={height} fill="url(#ob-vig)" />
    </svg>
  );
}

// ─── Slide 1: Your cultural home ─────────────────────────────────────────────
function Slide1({ onNext, navigate }: { onNext: () => void; navigate: ReturnType<typeof useNavigate> }) {
  const topH = Math.round(CONTENT_H * 0.56);
  return (
    <div style={{ height: CONTENT_H, display: "flex", flexDirection: "column", background: C.bgWarm, overflow: "hidden" }}>
      <div style={{ height: topH, flexShrink: 0, overflow: "hidden" }}>
        <Textile height={topH} />
      </div>
      <div style={{ flex: 1 }}>
        <BottomCard>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.2 }}>Your cultural home.</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "8px 0 0", lineHeight: 1.55, maxWidth: 300 }}>
            Discover, connect and create with people who share your cultural vision.
          </p>
          <div style={{ marginTop: 24 }}><Dots total={3} active={0} /></div>
          <div style={{ marginTop: 24 }}><PrimaryBtn label="Get started" onPress={onNext} /></div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.mute }}>
              Already a member?{" "}
              <span onClick={() => navigate("/login")} style={{ textDecoration: "underline", cursor: "pointer", color: C.mute }}>Sign in</span>
            </span>
          </div>
        </BottomCard>
      </div>
    </div>
  );
}

// ─── Mini card grid (Slide 2) ─────────────────────────────────────────────────
const MINI_CARDS = [
  { label: "Editorial",  bg: "#C5491F", pattern: "stripe"  },
  { label: "Happening",  bg: "#4C1D95", pattern: "dot"     },
  { label: "Hidden Gem", bg: "#92400E", pattern: "diamond" },
  { label: "Pulse",      bg: "#14110D", pattern: "grid"    },
  { label: "Quote",      bg: "#065F46", pattern: "circle"  },
  { label: "Poll",       bg: "#1E3A5F", pattern: "cross"   },
];

function MiniPattern({ bg, pattern, w, h }: { bg: string; pattern: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <rect width={w} height={h} fill={bg} />
      {pattern === "stripe"  && Array.from({ length: 10 }).map((_, i) => <line key={i} x1={i*18-20} y1="0" x2={i*18+40} y2={h} stroke="rgba(255,255,255,0.10)" strokeWidth="8" />)}
      {pattern === "dot"     && Array.from({ length: 9 }).map((_, i)  => <circle key={i} cx={(i%3)*52+26} cy={Math.floor(i/3)*38+19} r="7" fill="rgba(255,255,255,0.10)" />)}
      {pattern === "diamond" && <polygon points={`${w/2},10 ${w-10},${h/2} ${w/2},${h-10} 10,${h/2}`} fill="rgba(255,255,255,0.08)" />}
      {pattern === "grid"    && Array.from({ length: 5 }).map((_, i) => <g key={i}><line x1={i*36} y1="0" x2={i*36} y2={h} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/><line x1="0" y1={i*28} x2={w} y2={i*28} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/></g>)}
      {pattern === "circle"  && [32, 22, 12].map(r => <circle key={r} cx={w/2} cy={h/2} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />)}
      {pattern === "cross"   && <><line x1={w/2} y1="10" x2={w/2} y2={h-10} stroke="rgba(255,255,255,0.10)" strokeWidth="2"/><line x1="10" y1={h/2} x2={w-10} y2={h/2} stroke="rgba(255,255,255,0.10)" strokeWidth="2"/></>}
    </svg>
  );
}

function Slide2({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const topH  = Math.round(CONTENT_H * 0.50);
  const colW  = W / 2;
  const rowH  = Math.round(topH / 3);
  return (
    <div style={{ height: CONTENT_H, display: "flex", flexDirection: "column", background: C.bgWarm, overflow: "hidden" }}>
      <div style={{ height: topH, flexShrink: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {MINI_CARDS.map(mc => (
            <div key={mc.label} style={{ width: colW, height: rowH, position: "relative", overflow: "hidden" }}>
              <MiniPattern bg={mc.bg} pattern={mc.pattern} w={colW} h={rowH} />
              <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.92)", borderRadius: 9999, padding: "2px 8px" }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: mc.bg }}>{mc.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <BottomCard>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.2 }}>Built for your world.</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
            Magazine stories, community posts, events, games — all in one place.
          </p>
          <div style={{ marginTop: 24 }}><Dots total={3} active={1} /></div>
          <div style={{ marginTop: 24 }}><PrimaryBtn label="Continue" onPress={onNext} /></div>
          <div style={{ marginTop: 10 }}><GhostBtn label="Skip" onPress={onSkip} /></div>
        </BottomCard>
      </div>
    </div>
  );
}

// ─── Earn illustration (Slide 3) ─────────────────────────────────────────────
function EarnIllustration({ h }: { h: number }) {
  const cx = W / 2; const cy = h / 2 + 8; const br = 110;
  const badges = [
    { angle: -90, label: "+10 CR" },
    { angle:   0, label: "+30 CR" },
    { angle:  90, label: "+50 CR" },
    { angle: 180, label: "🏆 Badge" },
  ];
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} style={{ display: "block" }}>
      {[160, 130, 100, 72].map(r => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,191,176,0.28)" strokeWidth="1" />)}
      {badges.map(b => {
        const rad = b.angle * (Math.PI / 180);
        const bx = cx + br * Math.cos(rad); const by = cy + br * Math.sin(rad);
        const ix = cx + 42 * Math.cos(rad); const iy = cy + 42 * Math.sin(rad);
        return <line key={b.angle} x1={ix} y1={iy} x2={bx} y2={by} stroke={C.ochre} strokeWidth="1" strokeDasharray="4 3" opacity="0.45" />;
      })}
      <circle cx={cx} cy={cy} r={40} fill={C.ink} />
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="'Fraunces',serif" fontSize="36" fontWeight="700" fill={C.white}>C</text>
      {badges.map(b => {
        const rad = b.angle * (Math.PI / 180);
        const bx = cx + br * Math.cos(rad); const by = cy + br * Math.sin(rad);
        const cw = b.label.length > 5 ? 76 : 64;
        return (
          <g key={b.angle}>
            <rect x={bx - cw/2} y={by - 14} width={cw} height={28} rx={14} fill={C.gold} />
            <text x={bx} y={by + 4.5} textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="12" fontWeight="700" fill={C.white}>{b.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Slide3({ onNext, navigate }: { onNext: () => void; navigate: ReturnType<typeof useNavigate> }) {
  const topH = Math.round(CONTENT_H * 0.46);
  return (
    <div style={{ height: CONTENT_H, display: "flex", flexDirection: "column", background: C.bgWarm, overflow: "hidden" }}>
      <div style={{ height: topH, flexShrink: 0 }}><EarnIllustration h={topH} /></div>
      <div style={{ flex: 1 }}>
        <BottomCard>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.2 }}>Earn as you create.</h2>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.inkSoft, margin: "8px 0 0", lineHeight: 1.55 }}>
            Post, engage, and earn Culture Points™ redeemable for real-world perks and cash.
          </p>
          <div style={{ marginTop: 24 }}><Dots total={3} active={2} /></div>
          <div style={{ marginTop: 24 }}><PrimaryBtn label="Create my account" onPress={() => navigate("/register")} /></div>
          <div style={{ marginTop: 10 }}><GhostBtn label="Sign in instead" onPress={() => navigate("/login")} /></div>
        </BottomCard>
      </div>
    </div>
  );
}

// ─── Slide transition ─────────────────────────────────────────────────────────
function SlideTransition({ step, children }: { step: number; children: React.ReactNode[] }) {
  const [shown,      setShown]      = useState(step);
  const [prev,       setPrev]       = useState<number | null>(null);
  const [animating,  setAnimating]  = useState(false);
  const dir = useRef(1);

  useEffect(() => {
    if (step === shown) return;
    dir.current = step > shown ? 1 : -1;
    setPrev(shown);
    setAnimating(true);
    const id = setTimeout(() => { setShown(step); setPrev(null); setAnimating(false); }, 360);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div style={{ position: "relative", width: "100%", height: CONTENT_H, overflow: "hidden" }}>
      <style>{`
        @keyframes ob-out-l{from{transform:translateX(0)}to{transform:translateX(-100%)}}
        @keyframes ob-out-r{from{transform:translateX(0)}to{transform:translateX(100%)}}
        @keyframes ob-in-l {from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes ob-in-r {from{transform:translateX(-100%)}to{transform:translateX(0)}}
      `}</style>
      {animating && prev !== null && (
        <div style={{ position: "absolute", inset: 0, animation: `ob-out-${dir.current > 0 ? "l" : "r"} 0.36s cubic-bezier(0.4,0,0.2,1) forwards` }}>
          {children[prev as number]}
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, animation: animating ? `ob-in-${dir.current > 0 ? "l" : "r"} 0.36s cubic-bezier(0.4,0,0.2,1) forwards` : "none" }}>
        {children[shown]}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(s + 1, 3));
  const skip = () => setStep(3);

  const slides = [
    <Splash key={0} onDone={next} />,
    <Slide1 key={1} onNext={next} navigate={navigate} />,
    <Slide2 key={2} onNext={next} onSkip={skip} />,
    <Slide3 key={3} onNext={next} navigate={navigate} />,
  ];

  return <SlideTransition step={step}>{slides}</SlideTransition>;
}
