import { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUnifiedFeed } from "@/lib/unified-feed";
import PulseFeed from "@/components/pulse/PulseFeed";
import Link from "next/link";
import "../sections.css";
import "./connect.css";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Moveee Connect — Community for Black & Diaspora Creatives",
  description:
    "Where Black and diaspora creatives, entrepreneurs, professionals, and culture lovers gather. Pulse feed, member directory, and community membership.",
};

export default async function ConnectPage() {
  const [items, session] = await Promise.all([
    getUnifiedFeed(),
    getServerSession(authOptions),
  ]);

  const user = session?.user as any;
  const loggedIn = !!session;

  return (
    <div>
      {/* ── HERO ── */}
      <section className="mco-hero">
        <div className="mco-hero-inner">
          <div className="mco-hero-text">
            <p className="mco-eyebrow">N°06 · Moveee Connect</p>
            <h1 className="mco-headline">
              Where diaspora<br />culture <em>gathers.</em>
            </h1>
            <p className="mco-lede">
              Black and diaspora creatives, entrepreneurs, professionals, and culture lovers —
              self-selected, high-intent, and deeply invested in where African culture is going.
              Not a general public. A community.
            </p>
            <div className="con-cta-row">
              {loggedIn ? (
                <Link href="/member" className="con-btn-primary">Member Dashboard →</Link>
              ) : (
                <>
                  <Link href="/register" className="con-btn-primary">Join Moveee Connect →</Link>
                  <Link href="/login" className="con-btn-ghost">Already a member? Sign in</Link>
                </>
              )}
            </div>
            {loggedIn ? (
              <p className="con-price">Welcome back, {user?.name}</p>
            ) : (
              <p className="con-price">
                Citizen — Free · <PatronPrice variant="yearly" showTierLabel={true} />
              </p>
            )}
          </div>

          <div className="mco-hero-stats">
            {[
              ["500+", "Members worldwide"],
              ["12",   "City chapters"],
              ["200+", "Events hosted"],
              ["Weekly", "Pulse digest"],
            ].map(([stat, label]) => (
              <div key={label} className="mco-stat">
                <div className="mco-stat-num">{stat}</div>
                <div className="mco-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <nav className="mco-section-nav" aria-label="Connect sections">
          <a href="#feed" className="mco-nav-link">Pulse Feed</a>
          <Link href="/connect/people" className="mco-nav-link">The Directory</Link>
          <Link href="/connect/membership" className="mco-nav-link">Membership</Link>
        </nav>
      </section>

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
