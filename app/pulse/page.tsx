import type { Metadata } from "next";
import { getUnifiedFeed } from "@/lib/unified-feed";
import PulseFeed from "@/components/pulse/PulseFeed";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

export const metadata: Metadata = {
  title: "Moveee Pulse — Live African & Black Diaspora Culture News",
  description:
    "Real-time AI-curated cultural intelligence covering African and Black diasporan music, fashion, travel, events, and ideas. Updated daily.",
  openGraph: {
    title: "Moveee Pulse",
    description: "Live cultural intelligence for the African and Black diaspora.",
    url: `${SITE_URL}/pulse`,
    siteName: "The Moveee",
    images: [{ url: `${SITE_URL}/og-fallback.png`, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moveee Pulse",
    description: "Live cultural intelligence for the African and Black diaspora.",
    images: [`${SITE_URL}/og-fallback.png`],
  },
  alternates: { canonical: `${SITE_URL}/pulse` },
};

export default async function PulsePage() {
  const items = await getUnifiedFeed();

  return (
    <div style={{ background: "#f7f5f2", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #e8e2d8",
          padding: "2rem 1.5rem 1.5rem",
          background: "#fff",
        }}
      >
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#c5491f",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                color: "#c5491f",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Live
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 700,
              color: "#14110d",
              lineHeight: 1.05,
              marginBottom: "0.5rem",
            }}
          >
            Moveee Pulse
          </h1>

          <p style={{ color: "#7a6f5c", fontSize: "0.85rem", lineHeight: 1.5, maxWidth: "480px" }}>
            Everything happening in African and Black diaspora culture — curated stories, community voices, events, and ideas.
          </p>
        </div>
      </header>

      <PulseFeed initialItems={items} />

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
