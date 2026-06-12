const spacingSteps = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

export function SpacingSection() {
  return (
    <section style={{ padding: "32px 24px 0" }}>
      <Eyebrow>Spacing — 4px base grid</Eyebrow>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
        }}
      >
        {spacingSteps.map((s) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: s === 64 ? 0 : "10px",
            }}
          >
            {/* Label */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                fontWeight: 700,
                color: "#3A342B",
                minWidth: "28px",
                textAlign: "right",
              }}
            >
              {s}
            </span>
            {/* Bar */}
            <div
              style={{
                height: "14px",
                width: `${Math.min(s * 3.2, 270)}px`,
                backgroundColor: "#C5491F",
                borderRadius: "2px",
                opacity: 0.15 + (s / 64) * 0.7,
              }}
            />
            {/* px label */}
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#C8BFB0",
              }}
            >
              px
            </span>
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
