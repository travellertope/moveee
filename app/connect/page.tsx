import { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUnifiedFeed } from "@/lib/unified-feed";
import PulseFeed from "@/components/pulse/PulseFeed";
import PatronPrice from "@/components/PatronPrice";
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
          <a href="#membership" className="mco-nav-link">Membership</a>
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

      {/* ── MEMBERSHIP ── */}
      <section id="membership" className="mco-membership-section">
        <div className="mco-membership-head">
          <p className="mco-section-eyebrow">Membership</p>
          <h2 className="mco-section-title">Choose your tier.</h2>
        </div>
        <div className="con-tiers">
          <div className="con-tier-card">
            <div className="con-tier-label">Free</div>
            <h2 className="con-tier-name">Citizen</h2>
            <div className="con-tier-price">Free forever</div>
            <ul className="con-tier-perks">
              <li>Pulse feed &amp; community posts</li>
              <li>Directory listing</li>
              <li>One primary chapter</li>
              <li>Access to online events</li>
              <li>The Cultural Digest newsletter</li>
              <li>Culture points &amp; badges</li>
            </ul>
            {!loggedIn && (
              <Link href="/register?tier=citizen" className="con-tier-btn">
                Become a Citizen →
              </Link>
            )}
            {loggedIn && user?.tier === "citizen" && (
              <span className="con-tier-status">Active Membership</span>
            )}
            {loggedIn && user?.tier === "patron" && (
              <span className="con-tier-status con-tier-status--prev">Basic Membership</span>
            )}
          </div>

          <div className="con-tier-card con-tier-card--patron">
            <div className="con-tier-label">Premium</div>
            <h2 className="con-tier-name">Patron</h2>
            <div className="con-tier-price">
              <PatronPrice variant="yearly" /> / <PatronPrice variant="monthly" /> · Cancel anytime
            </div>
            <ul className="con-tier-perks">
              <li>Everything in Citizen</li>
              <li>Featured directory listing</li>
              <li>Physical events in your chapter</li>
              <li>Secondary chapter membership</li>
              <li>Priority RSVP for all events</li>
              <li>Exclusive Patron-only content</li>
              <li>Direct access to community leaders</li>
            </ul>
            {!loggedIn && (
              <Link href="/register?tier=patron" className="con-tier-btn">
                Become a Patron →
              </Link>
            )}
            {loggedIn && user?.tier === "citizen" && (
              <Link href="/register?upgrade=patron" className="con-tier-btn">
                Upgrade to Patron →
              </Link>
            )}
            {loggedIn && user?.tier === "patron" && (
              <span className="con-tier-status">Active Membership</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
