const colors = [
  // Backgrounds & surfaces
  { name: "paper-warm", hex: "#F3ECE0", label: "Primary background", dark: false },
  { name: "paper", hex: "#FFFFFF", label: "Card surface", dark: false },
  { name: "paper-deep", hex: "#F5F5F5", label: "Elevated surface", dark: false },
  { name: "community", hex: "#EDF7ED", label: "Community card bg", dark: false },
  // Text
  { name: "ink", hex: "#14110D", label: "Primary text", dark: true },
  { name: "ink-soft", hex: "#3A342B", label: "Body text", dark: true },
  { name: "mute", hex: "#7A6F5C", label: "Secondary text", dark: false },
  { name: "ghost", hex: "#C8BFB0", label: "Disabled / hint", dark: false },
  // Actions & accents
  { name: "ochre", hex: "#C5491F", label: "Primary action", dark: true },
  { name: "gold", hex: "#B38238", label: "Pro tier accent", dark: true },
  // Semantic
  { name: "success", hex: "#2D6A4F", label: "Success", dark: true },
  { name: "error", hex: "#C62828", label: "Error", dark: true },
  { name: "warning", hex: "#E65100", label: "Warning", dark: true },
];

export function ColorSection() {
  return (
    <section style={{ padding: "32px 24px 0" }}>
      <SectionEyebrow>Colour Tokens</SectionEyebrow>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {colors.map((c) => (
          <div
            key={c.hex}
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
            }}
          >
            <div
              style={{
                backgroundColor: c.hex,
                height: "56px",
                border: c.hex === "#FFFFFF" || c.hex === "#F5F5F5" || c.hex === "#F3ECE0"
                  ? "1px solid rgba(20,17,13,0.08)"
                  : "none",
              }}
            />
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "8px 10px",
              }}
            >
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#14110D",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {c.hex}
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#7A6F5C",
                  margin: "2px 0 0",
                }}
              >
                {c.name}
              </p>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "11px",
                  color: "#C8BFB0",
                  margin: "1px 0 0",
                  lineHeight: 1.3,
                }}
              >
                {c.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
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
