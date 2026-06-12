import { ColorSection } from "./components/ColorSection";
import { TypographySection } from "./components/TypographySection";
import { SpacingSection } from "./components/SpacingSection";
import { BadgesSection } from "./components/BadgesSection";
import { ShadowsSection } from "./components/ShadowsSection";

export default function DesignSystem() {
  return (
    <div
      style={{
        width: "390px",
        minHeight: "844px",
        margin: "0 auto",
        backgroundColor: "#F3ECE0",
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: "48px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "48px 24px 24px",
          borderBottom: "1px solid rgba(20,17,13,0.10)",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#7A6F5C",
            marginBottom: "8px",
          }}
        >
          Design System
        </p>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "28px",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#14110D",
            margin: 0,
          }}
        >
          Moveee Connect
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "15px",
            color: "#7A6F5C",
            marginTop: "4px",
          }}
        >
          Foundation tokens & components
        </p>
      </div>

      <ColorSection />
      <TypographySection />
      <SpacingSection />
      <BadgesSection />
      <ShadowsSection />
    </div>
  );
}
