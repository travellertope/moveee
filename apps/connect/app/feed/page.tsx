import { Suspense } from "react";
import { Metadata } from "next";
import { getUnifiedFeed } from "@/lib/unified-feed";
import PulseFeed from "@/components/pulse/PulseFeed";
import "../sections.css";
import "./feed.css";

// No session dependency in the RSC — per-user features are handled
// client-side (PulseFeed uses useSession for For You scoring). This allows
// the full page to be ISR-cached once for all users rather than once per
// user cookie.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Moveee — Community for Global Creatives",
  description:
    "Where creatives from around the world, entrepreneurs, professionals, and culture lovers gather. Pulse feed, member directory, and community membership.",
};

export default async function ConnectPage() {
  const items = await getUnifiedFeed();

  return (
    <div>
      {/* ── PULSE FEED ── */}
      <section id="feed" className="mco-feed-section">
        <Suspense fallback={<div className="mco-feed-loading">Loading feed…</div>}>
          <PulseFeed initialItems={items} />
        </Suspense>
      </section>
    </div>
  );
}
