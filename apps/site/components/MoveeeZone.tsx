"use client";

import { useState } from "react";
import Link from "next/link";
import PatronPrice from "@/components/PatronPrice";
import WaitlistModal from "@/components/WaitlistModal";

const FEATURES = [
  {
    icon: "🌊",
    title: "Pulse Feed",
    hook: "Nine ways to share",
    body: "A hidden gem. A hot take. A poll. An itinerary. Post however the moment calls for it — not just another caption.",
  },
  {
    icon: "🏆",
    title: "Culture Credits & Reputation Points",
    hook: "Get rewarded for having taste",
    body: "Every post, comment and validated tip earns Culture Credits (Cr). Build Reputation Points (Pt) and climb from Member to Culture Authority — title and all.",
  },
  {
    icon: "🎁",
    title: "Partner Perks & Wallet",
    hook: "Spend it, or cash it out",
    body: "Redeem Culture Credits (Cr) for real discounts at partner spots across the city, or convert them straight to cash.",
  },
  {
    icon: "🧭",
    title: "Discover",
    hook: "The map only the community could write",
    body: "People, places, dishes, films, movements — a living archive, browsable by type and city.",
  },
  {
    icon: "📅",
    title: "Events",
    hook: "Know what's actually happening",
    body: "RSVP to the shows, pop-ups and talks worth your night — curated by us, submitted by you.",
  },
  {
    icon: "🎮",
    title: "Daily Games",
    hook: "Keep your culture IQ sharp",
    body: "Trivia and Who Said It? — two minutes a day, bragging rights forever.",
  },
];

export default function MoveeeZone() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  return (
    <div className="mz-zone">
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
      {/*
        DEV: This zone intentionally uses the warm paper token (#F3ECE0) to bridge Site A's
        white magazine background with Site B/Connect's visual language — do NOT change the
        global --paper CSS variable (apps/site/app/globals.css), scope the warm background to
        this section locally instead.
      */}

      {/* ===== HERO ===== */}
      <section className="mz-hero">
        <div className="mz-hero-inner">
        <div className="mz-hero-text">
          <p className="mz-eyebrow">A community that rewards you for being an active part of culture</p>
          <h1 className="mz-h1">Moveee for culture. <em>Discover and engage.</em></h1>
          <p className="mz-subhead">
            Post the spot before it&apos;s cool. Call the next big thing. Rate, react, debate —
            every contribution builds your standing and earns you real rewards. Moveee is where
            culture happens with you in it, not just in front of you.
          </p>
          {/*
            DEV: 'Join Moveee' routes to a new /app or /download landing route (does not exist
            yet) that should detect OS via user-agent and deep-link to the correct store; fall
            back to a simple page with both badges + QR for desktop. 'See how it works' anchors
            to the 'What is Moveee' intro block on this same page (#what-is-moveee). Linking to
            /register pragmatically until that route is built.
          */}
          <div className="mz-hero-cta">
            <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
            <Link href="#what-is-moveee" className="mz-btn-secondary">See how it works</Link>
          </div>
          <p className="mz-trust">Free to join · iOS &amp; Android · No spam, ever</p>
        </div>
        <div className="mz-hero-visual" aria-hidden="true">
          <div className="mz-hero-visual-card mz-hero-visual-card--1">
            <span className="mz-hero-visual-tag">🌊 Pulse Feed</span>
            <span className="mz-hero-visual-react">🔥 24 · 💬 6</span>
          </div>
          <div className="mz-hero-visual-card mz-hero-visual-card--2">
            <span className="mz-hero-visual-badge">🏆 Badge unlocked: Culture Contributor</span>
          </div>
          <div className="mz-hero-visual-card mz-hero-visual-card--3">
            <span className="mz-hero-visual-tag">🧭 Discover</span>
            <span className="mz-hero-visual-react">+312 Cr earned</span>
          </div>
        </div>
        </div>
      </section>

      {/* ===== WHAT IS MOVEEE + FEATURE GRID ===== */}
      <section className="mz-section" id="what-is-moveee">
        <div className="mz-section-inner">
        <div className="mz-intro">
          <p className="mz-eyebrow mz-eyebrow--centred">Moveee</p>
          <h2 className="mz-h2">Your taste, with receipts.</h2>
          <p className="mz-body mz-body--centred">
            Moveee is a community and discovery platform built for people who find the spot
            before it&apos;s cool, have a take on every new release, and want it to count for
            something. Post a hidden gem. Rate the meal. Call the next big thing. Every
            contribution builds your standing — and earns Culture Credits (Cr) you can spend on
            real perks from brands that get it.
          </p>
          <Link href="/connect" className="mz-link">See how it works →</Link>
        </div>

        {/*
          DEV: This section replaces the existing thin #connect block in HomepageContent.tsx —
          same anchor id should be preserved if anything else in the site links to #connect.
          (No internal links currently target #connect, so the new anchor id #what-is-moveee
          is used for this section instead.)
        */}
        <div className="mz-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="mz-feature-card">
              <span className="mz-feature-icon">{f.icon}</span>
              <div className="mz-feature-title">{f.title}</div>
              <div className="mz-feature-hook">{f.hook}</div>
              <p className="mz-feature-body">{f.body}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ===== MEMBERSHIP TEASER ===== */}
      <section className="mz-section mz-section--bordered">
        <div className="mz-section-inner">
        <div className="mz-intro">
          <p className="mz-eyebrow mz-eyebrow--centred">Membership</p>
          <h2 className="mz-h2">Free to join. More for the obsessed.</h2>
        </div>
        <div className="mz-membership-cards">
          <div className="mz-tier-card">
            <div className="mz-tier-head">
              <span className="mz-tier-name">Connect Citizen</span>
              <span className="mz-tier-pill">Free</span>
            </div>
            <p className="mz-tier-body">
              Post to the feed, browse Discover, RSVP to events, and get our newsletters —
              GetMeLit and Culture Drop — straight to your inbox.
            </p>
            <Link href="/connect/membership" className="mz-btn-ghost">Compare plans</Link>
          </div>
          <div className="mz-tier-card mz-tier-card--pro">
            <div className="mz-tier-head">
              <span className="mz-tier-name mz-tier-name--white">Connect Pro</span>
              {/*
                DEV: Do not hardcode the Pro price — reuse the existing <PatronPrice />
                component (apps/site/components, already used in the current Connect CTA block)
                so currency/locale logic stays centralised.
              */}
              <span className="mz-tier-pill mz-tier-pill--gold">
                from <PatronPrice variant="monthly" />
              </span>
            </div>
            <p className="mz-tier-body mz-tier-body--light">
              Everything in Citizen, plus exclusive patron stories, 10% off the shop with early
              access to every drop, and first access to new features before anyone else.
            </p>
            <Link href="/register?tier=patron" className="mz-btn-gold">Upgrade to Pro</Link>
          </div>
        </div>

        {/* ===== JOIN MOVEEE DOWNLOAD STRIP ===== */}
        <div className="mz-download-strip">
          <div className="mz-download-text">
            <p className="mz-eyebrow">Join Moveee</p>
            <h3 className="mz-download-h3">Carry the culture in your pocket.</h3>
            <p className="mz-body">
              Moveee is free on iOS and Android. Download it, claim your handle, and start
              earning from your first post.
            </p>
          </div>
          {/*
            DEV: Store URLs do not exist yet — app is not published. Use placeholder badge
            graphics and wire real store IDs at launch; do not hardcode a fake App Store ID.
            Until launch, both badges open a waitlist popup instead of linking out.
          */}
          <div className="mz-download-badges">
            <button type="button" className="mz-store-badge" onClick={() => setWaitlistOpen(true)}>
              App Store
            </button>
            <button type="button" className="mz-store-badge" onClick={() => setWaitlistOpen(true)}>
              Google Play
            </button>
            <div className="mz-qr-block">
              <span className="mz-qr-placeholder" aria-hidden="true" />
              <span className="mz-qr-caption">Scan to download</span>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
