const typeStyles: Array<{
  label: string;
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
  tracking?: string;
  transform?: string;
  sample: string;
}> = [
  {
    label: "Display / Hero",
    family: "'Fraunces', serif",
    size: 36,
    weight: 700,
    lineHeight: 1.15,
    tracking: "-0.5px",
    sample: "Culture First",
  },
  {
    label: "Display / Title",
    family: "'Fraunces', serif",
    size: 28,
    weight: 700,
    lineHeight: 1.2,
    sample: "Diaspora Stories",
  },
  {
    label: "Display / Subtitle",
    family: "'Fraunces', serif",
    size: 22,
    weight: 400,
    lineHeight: 1.3,
    sample: "Community & Connection",
  },
  {
    label: "Body / Large",
    family: "'DM Sans', sans-serif",
    size: 17,
    weight: 400,
    lineHeight: 1.5,
    sample: "Explore events, voices, and hidden gems from the African diaspora.",
  },
  {
    label: "Body / Medium",
    family: "'DM Sans', sans-serif",
    size: 15,
    weight: 400,
    lineHeight: 1.5,
    sample: "Share your cultural take with the Moveee community.",
  },
  {
    label: "Body / Small",
    family: "'DM Sans', sans-serif",
    size: 13,
    weight: 400,
    lineHeight: 1.4,
    sample: "Lagos · London · New York · Accra · Paris",
  },
  {
    label: "Body / Medium Bold",
    family: "'DM Sans', sans-serif",
    size: 15,
    weight: 700,
    lineHeight: 1.5,
    sample: "Connect Pro membership",
  },
  {
    label: "Body / Small Bold",
    family: "'DM Sans', sans-serif",
    size: 13,
    weight: 700,
    lineHeight: 1.4,
    sample: "2 400 points earned",
  },
  {
    label: "Label / Eyebrow",
    family: "'DM Sans', sans-serif",
    size: 9,
    weight: 700,
    lineHeight: 1.5,
    tracking: "1.5px",
    transform: "uppercase",
    sample: "Cultural Take",
  },
  {
    label: "Label / Mono",
    family: "'JetBrains Mono', monospace",
    size: 11,
    weight: 400,
    lineHeight: 1.5,
    sample: "#F3ECE0 — paper-warm",
  },
  {
    label: "Label / Mono Bold",
    family: "'JetBrains Mono', monospace",
    size: 11,
    weight: 700,
    lineHeight: 1.5,
    sample: "PRO · 4 820 pts",
  },
];

export function TypographySection() {
  return (
    <section style={{ padding: "32px 24px 0" }}>
      <Eyebrow>Typography</Eyebrow>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
          overflow: "hidden",
        }}
      >
        {typeStyles.map((t, i) => (
          <div
            key={t.label}
            style={{
              padding: "16px 20px",
              borderBottom:
                i < typeStyles.length - 1
                  ? "1px solid rgba(20,17,13,0.06)"
                  : "none",
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#C8BFB0",
                margin: "0 0 6px",
              }}
            >
              {t.label} · {t.size}px / {t.weight}
            </p>
            <p
              style={{
                fontFamily: t.family,
                fontSize: `${t.size}px`,
                fontWeight: t.weight,
                lineHeight: t.lineHeight,
                letterSpacing: t.tracking ?? "normal",
                textTransform: (t.transform as any) ?? "none",
                color: "#14110D",
                margin: 0,
              }}
            >
              {t.sample}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#C5491F",
        marginBottom: "16px",
      }}
    >
      {children}
    </p>
  );
}
