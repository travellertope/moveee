import type { Metadata } from "next";
import { getUnifiedFeed } from "@/lib/unified-feed";
import PulseFeed from "@/components/pulse/PulseFeed";

export const revalidate = 60;

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
      <PulseFeed initialItems={items} />
    </div>
  );
}
