import type { Metadata } from "next";
import { getPulseStories } from "@/lib/pulse-wordpress";
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
  const stories = await getPulseStories({ perPage: 18 });

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "2.5rem 1.5rem 2rem",
          background: "#0d0d0d",
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
                background: "#D4A847",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                color: "#D4A847",
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
              color: "#f0ece4",
              lineHeight: 1.05,
              marginBottom: "0.75rem",
            }}
          >
            Moveee Pulse
          </h1>

          <p
            style={{
              color: "#777",
              fontSize: "0.9rem",
              lineHeight: 1.55,
              maxWidth: "520px",
            }}
          >
            AI-curated cultural intelligence across African and Black diaspora music, fashion,
            travel, events, and ideas — refreshed three times daily.
          </p>
        </div>
      </header>

      <PulseFeed initialStories={stories} />

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
