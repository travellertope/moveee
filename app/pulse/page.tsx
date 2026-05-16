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
  alternates: {
    canonical: `${SITE_URL}/pulse`,
  },
};

export default async function PulsePage() {
  const items = await getUnifiedFeed();

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #e0dbd1",
          padding: "2.5rem 1.5rem 2rem",
          background: "var(--paper)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--ochre)",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                color: "var(--ochre)",
                fontSize: "0.65rem",
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
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.05,
              marginBottom: "0.75rem",
            }}
          >
            Moveee Pulse
          </h1>

          <p
            style={{
              color: "#6b6157",
              fontSize: "0.9rem",
              lineHeight: 1.55,
              maxWidth: "520px",
            }}
          >
            Everything happening in African and Black diaspora culture — Pulse stories, editorials,
            happenings, directory picks, and quotes — all in one living feed.
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
