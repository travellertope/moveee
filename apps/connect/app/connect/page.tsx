import { Suspense } from "react";
import { Metadata } from "next";
import { getUnifiedFeed } from "@/lib/unified-feed";
import PulseFeed from "@/components/pulse/PulseFeed";
import ConnectHero from "./ConnectHero";
import Link from "next/link";
import "../sections.css";
import "./connect.css";

// No session dependency in the RSC — hero and per-user features are handled
// client-side (ConnectHero uses useSession; PulseFeed uses useSession for
// For You scoring). This allows the full page to be ISR-cached once for all
// users rather than once per user cookie.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Moveee — Community for Black & Diaspora Creatives",
  description:
    "Where Black and diaspora creatives, entrepreneurs, professionals, and culture lovers gather. Pulse feed, member directory, and community membership.",
};

export default async function ConnectPage() {
  const items = await getUnifiedFeed();

  return (
    <div>
      {/* ── HERO + SECTION NAV — shown to logged-out visitors only (client-side check) ── */}
      <ConnectHero />

      {/* ── PULSE FEED ── */}
      <section id="feed" className="mco-feed-section">
        <Suspense fallback={<div className="mco-feed-loading">Loading feed…</div>}>
          <PulseFeed initialItems={items} />
        </Suspense>
      </section>

      {/* ── DIRECTORY TEASER ── */}
      <section className="mco-directory-teaser">
        <div className="mco-directory-teaser-inner">
          <div>
            <p className="mco-section-eyebrow">Find Each Other</p>
            <h2 className="mco-section-title" style={{ marginBottom: 8 }}>The Directory</h2>
            <p className="mco-section-desc">
              A searchable index of members — who they are, what they do, and where they're based.
              The Lagos photographer. The UK art director. The Nigerian lawyer in New York.
            </p>
          </div>
          <Link href="/connect/people" className="mco-directory-teaser-cta">
            Browse the directory →
          </Link>
        </div>
      </section>

      {/* ── MEMBERSHIP TEASER ── */}
      <section className="mco-membership-teaser">
        <div className="mco-membership-teaser-inner">
          <div>
            <p className="mco-section-eyebrow">Membership</p>
            <h2 className="mco-section-title" style={{ marginBottom: 8 }}>Connect Citizen &amp; Connect Pro</h2>
            <p className="mco-section-desc">
              Free membership gets you in. Connect Pro gets you featured, gated content, a Pro badge,
              and more. Two tiers. One community.
            </p>
          </div>
          <Link href="/connect/membership" className="mco-membership-teaser-cta">
            View membership →
          </Link>
        </div>
      </section>
    </div>
  );
}
