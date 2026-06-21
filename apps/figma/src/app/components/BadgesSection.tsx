const templateBadges = [
  { label: "Hidden Gem", bg: "#FEF3C7", text: "#92400E" },
  { label: "Cultural Take", bg: "#E0F2FE", text: "#075985" },
  { label: "Food Review", bg: "#FCE7F3", text: "#9D174D" },
  { label: "Creative Showcase", bg: "#F3E8FF", text: "#6B21A8" },
  { label: "Itinerary", bg: "#D1FAE5", text: "#065F46" },
  { label: "Poll", bg: "#EDE9FE", text: "#4C1D95" },
  { label: "Event Post", bg: "#FEE2E2", text: "#991B1B" },
  { label: "Quote", bg: "#FEF3C7", text: "#78350F" },
];

const feedBadges = [
  { label: "Pulse", bg: "#14110D", text: "#FFFFFF" },
  { label: "Editorial", bg: "#F3ECE0", text: "#14110D" },
  { label: "Happening", bg: "#EDE9FE", text: "#4C1D95" },
  { label: "Directory", bg: "#EDF7ED", text: "#065F46" },
  { label: "Quote", bg: "#FEF3C7", text: "#78350F" },
];

const membershipBadges = [
  { label: "★ CONNECT PRO", bg: "#B38238", text: "#FFFFFF" },
  { label: "CONNECT CITIZEN", bg: "#F5F5F5", text: "#C8BFB0" },
];

export function BadgesSection() {
  return (
    <section style={{ padding: "32px 24px 0" }}>
      <Eyebrow>Badges</Eyebrow>

      {/* Template type badges */}
      <SubLabel>Community post templates</SubLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
        {templateBadges.map((b) => (
          <Badge key={b.label} {...b} />
        ))}
      </div>

      {/* Feed type badges */}
      <SubLabel>Feed item types</SubLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
        {feedBadges.map((b) => (
          <Badge key={b.label} {...b} outlined={b.label === "Editorial"} />
        ))}
      </div>

      {/* Membership */}
      <SubLabel>Membership tiers</SubLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {membershipBadges.map((b) => (
          <Badge key={b.label} {...b} />
        ))}
      </div>
    </section>
  );
}

function Badge({
  label,
  bg,
  text,
  outlined,
}: {
  label: string;
  bg: string;
  text: string;
  outlined?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        paddingLeft: "10px",
        paddingRight: "10px",
        paddingTop: "4px",
        paddingBottom: "4px",
        borderRadius: "9999px",
        backgroundColor: bg,
        color: text,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.4px",
        border: outlined ? "1px solid rgba(20,17,13,0.15)" : "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        color: "#7A6F5C",
        margin: "0 0 8px",
      }}
    >
      {children}
    </p>
  );
}
