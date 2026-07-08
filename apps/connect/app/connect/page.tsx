import { Metadata } from "next";
import Link from "next/link";
import "../sections.css";
import "../feed/feed.css";
import "./connect-landing.css";

export const metadata: Metadata = {
  title: "Literati Connect — Moveee",
  description:
    "Two ways to meet the people who live for culture the way you do — Literati Connect, a monthly city-wide gathering, and Stoop, a weekly circle in your own area.",
};

export default function LiteratiConnectPage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="mco-hero">
        <div className="mco-hero-inner">
          <div className="mco-hero-text">
            <p className="mco-eyebrow">Moveee · Literati Connect</p>
            <h1 className="mco-headline">
              Culture, <em>in person.</em>
            </h1>
            <p className="mco-lede">
              Two ways to meet the people who live for culture the way you do —
              a monthly gathering across the whole city, and a weekly circle
              in your own area. Free for every member, Citizen and Pro.
            </p>
          </div>
          <div className="mco-hero-cta">
            <Link href="/connect/people" className="con-btn-primary">Find your Stoop →</Link>
            <Link href="/events" className="con-btn-ghost">See Literati Connect events →</Link>
          </div>
        </div>

        <nav className="mco-section-nav" aria-label="Connect sections">
          <Link href="/feed" className="mco-nav-link">Pulse Feed</Link>
          <Link href="/connect/people" className="mco-nav-link">People Near Me</Link>
          <Link href="/connect/membership" className="mco-nav-link">Membership</Link>
          <span className="mco-nav-link mco-nav-link--active">Literati Connect</span>
        </nav>
      </section>

      {/* ── TWO OFFERINGS ── */}
      <section className="lc-offers">
        <div className="lc-offer-card">
          <span className="lc-offer-emoji">🪶</span>
          <span className="lc-offer-eyebrow">Monthly · City-wide</span>
          <h2 className="lc-offer-title">Literati Connect</h2>
          <p className="lc-offer-desc">
            One evening a month, the whole city shows up. Readings, screenings,
            dinners, discussions — the gatherings worth leaving the house for,
            open to every member and free to attend.
          </p>
          <Link href="/events" className="lc-offer-cta">See upcoming events →</Link>
        </div>

        <div className="lc-offer-card lc-offer-card--fellowship">
          <span className="lc-offer-emoji">🏠</span>
          <span className="lc-offer-eyebrow">Weekly · Your area</span>
          <h2 className="lc-offer-title">Stoop</h2>
          <p className="lc-offer-desc">
            A small circle of members near you, meeting every week. Founded by
            a neighbour, hosted by the community — never more than a short
            walk from home.
          </p>
          <Link href="/connect/people" className="lc-offer-cta">Find your Stoop →</Link>
        </div>
      </section>

      {/* ── HOW STOOP WORKS ── */}
      <section className="lc-steps">
        <div className="lc-steps-head">
          <p className="mco-section-eyebrow">How it works</p>
          <h2 className="mco-section-title">Starting one is as easy as showing up.</h2>
          <p className="mco-section-desc">
            No approval process, no admin gatekeeping — any member can start a
            Stoop in their own area.
          </p>
        </div>
        <div className="lc-steps-grid">
          <div>
            <p className="lc-step-num">01</p>
            <h3 className="lc-step-title">Start it</h3>
            <p className="lc-step-desc">
              Any member can start a Stoop in their area —
              no approval needed.
            </p>
          </div>
          <div>
            <p className="lc-step-num">02</p>
            <h3 className="lc-step-title">Invite your neighbours</h3>
            <p className="lc-step-desc">
              Share your invite link. Once four people join, it goes live and
              becomes publicly discoverable.
            </p>
          </div>
          <div>
            <p className="lc-step-num">03</p>
            <h3 className="lc-step-title">Meet weekly</h3>
            <p className="lc-step-desc">
              Pick a day, a time, a place. Check in with a host-generated QR
              code each week you show up.
            </p>
          </div>
          <div>
            <p className="lc-step-num">04</p>
            <h3 className="lc-step-title">Earn as you go</h3>
            <p className="lc-step-desc">
              Culture Credits and Reputation Points for every check-in — plus
              badges for regulars and hosts.
            </p>
          </div>
        </div>
      </section>

      {/* ── REWARDS ── */}
      <section className="lc-rewards">
        <div className="lc-rewards-inner">
          <div className="lc-rewards-text">
            <p className="mco-section-eyebrow">Rewards</p>
            <h2 className="mco-section-title">Showing up is worth something.</h2>
            <p className="mco-section-desc">
              Every check-in earns Culture Credits and Reputation Points, the
              same currency the rest of Moveee runs on. Keep it up and it
              shows.
            </p>
          </div>
          <div className="lc-badges">
            <div className="lc-badge-card">
              <span className="lc-badge-emoji">🔥</span>
              <h3 className="lc-badge-name">Cluster Regular</h3>
              <p className="lc-badge-desc">Check in eight weeks in a row.</p>
            </div>
            <div className="lc-badge-card">
              <span className="lc-badge-emoji">🗝️</span>
              <h3 className="lc-badge-name">City Convener</h3>
              <p className="lc-badge-desc">Host for three consecutive months.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="lc-trust">
        <h2 className="lc-trust-title">Every Stoop plays by the same rules.</h2>
        <p className="lc-trust-desc">
          Ground rules on safety and mutual respect apply to every cluster,
          city-wide — visible before you join, and always one tap away once
          you&apos;re in.
        </p>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lc-cta-band">
        <h2 className="lc-cta-title">Ready to meet <em>your people?</em></h2>
        <div className="lc-cta-row">
          <Link href="/connect/people" className="lc-cta-btn lc-cta-btn--primary">Find your Stoop →</Link>
          <Link href="/events" className="lc-cta-btn lc-cta-btn--ghost">See Literati Connect events →</Link>
        </div>
      </section>
    </div>
  );
}
