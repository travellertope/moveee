const shadows = [
  {
    name: "Card",
    token: "card-shadow",
    value: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
    description: "Standard content cards and list items",
    elevation: "1dp",
    accentColor: "#3A342B",
  },
  {
    name: "Modal",
    token: "modal-shadow",
    value: "0px 20px 60px rgba(20,17,13,0.18)",
    description: "Bottom sheets, dialogs, overlays",
    elevation: "8dp",
    accentColor: "#3A342B",
  },
  {
    name: "FAB",
    token: "fab-shadow",
    value: "0px 4px 12px rgba(197,73,31,0.35)",
    description: "Floating action button — ochre tinted",
    elevation: "3dp",
    accentColor: "#C5491F",
  },
];

export function ShadowsSection() {
  return (
    <section style={{ padding: "32px 24px 0" }}>
      <Eyebrow>Elevation & Shadows</Eyebrow>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {shadows.map((s) => (
          <div key={s.token} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            {/* Demo surface */}
            <div
              style={{
                flexShrink: 0,
                width: "80px",
                height: "80px",
                borderRadius: "12px",
                backgroundColor: s.name === "FAB" ? "#C5491F" : "#FFFFFF",
                boxShadow: s.value,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {s.name === "FAB" && (
                <span style={{ fontSize: "24px", color: "#FFFFFF" }}>+</span>
              )}
              {s.name === "Card" && (
                <div style={{ width: "40px" }}>
                  <div style={{ height: "6px", backgroundColor: "#F3ECE0", borderRadius: "3px", marginBottom: "4px" }} />
                  <div style={{ height: "6px", backgroundColor: "#EDE9FE", borderRadius: "3px", marginBottom: "4px", width: "70%" }} />
                  <div style={{ height: "6px", backgroundColor: "#F3ECE0", borderRadius: "3px", width: "50%" }} />
                </div>
              )}
              {s.name === "Modal" && (
                <div style={{ width: "44px" }}>
                  <div style={{ height: "8px", backgroundColor: "#14110D", borderRadius: "4px", marginBottom: "6px", opacity: 0.1 }} />
                  <div style={{ height: "6px", backgroundColor: "#C5491F", borderRadius: "3px", marginBottom: "4px", opacity: 0.3 }} />
                  <div style={{ height: "6px", backgroundColor: "#14110D", borderRadius: "3px", opacity: 0.08 }} />
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "#14110D",
                    lineHeight: 1.2,
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#C8BFB0",
                    backgroundColor: "#F5F5F5",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {s.elevation}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  color: "#7A6F5C",
                  margin: "0 0 6px",
                  lineHeight: 1.4,
                }}
              >
                {s.description}
              </p>
              <code
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 400,
                  color: s.accentColor,
                  backgroundColor: "rgba(20,17,13,0.04)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "block",
                  lineHeight: 1.6,
                  wordBreak: "break-all",
                }}
              >
                {s.value}
              </code>
            </div>
          </div>
        ))}
      </div>

      {/* Border radius reference */}
      <div style={{ marginTop: "32px" }}>
        <Eyebrow>Border Radius</Eyebrow>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          {[
            { r: 2, label: "sm" },
            { r: 4, label: "md" },
            { r: 6, label: "lg" },
            { r: 12, label: "xl" },
            { r: 20, label: "2xl" },
            { r: 9999, label: "full", displayR: 9999 },
          ].map(({ r, label, displayR }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: r === 9999 ? "40px" : "40px",
                  height: r === 9999 ? "22px" : "40px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: `${r}px`,
                  boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
                  border: "1.5px solid rgba(20,17,13,0.08)",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#7A6F5C",
                  textAlign: "center",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "9px",
                  color: "#C8BFB0",
                  textAlign: "center",
                }}
              >
                {r === 9999 ? "pill" : `${r}px`}
              </span>
            </div>
          ))}
        </div>
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
