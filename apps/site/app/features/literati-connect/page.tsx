import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Literati Connect & Stoop — Culture, In Person | Moveee",
  description:
    "Literati Connect is Moveee's monthly city-wide meetup. Stoop is your weekly area-cluster gathering. Both are how Moveee turns an app into real friendships.",
  alternates: { canonical: "https://themoveee.com/features/literati-connect" },
  openGraph: {
    title: "Literati Connect & Stoop — Culture, In Person | Moveee",
    description:
      "Monthly city-wide meetups and weekly Stoop clusters near you — Moveee, offline.",
    url: "https://themoveee.com/features/literati-connect",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Literati Connect" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Literati Connect & Stoop — Culture, In Person | Moveee",
    description:
      "Monthly city-wide meetups and weekly Stoop clusters near you — Moveee, offline.",
  },
};

export default function LiteratiConnectPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Literati Connect &amp; Stoop</p>
            <h1 className="fp-h1">
              Culture, <em>in person.</em>
            </h1>
            <p className="fp-subhead">
              Moveee doesn't stop at the feed. Literati Connect brings your whole city
              together once a month. Stoop brings your area together every
              week. Same community, two rhythms.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#how" className="mz-btn-secondary">How it works</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · Open to every membership tier</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">Monthly</span>
                <span className="fp-stat-label">Literati Connect, city-wide</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">Weekly</span>
                <span className="fp-stat-label">Stoop, your area</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">QR</span>
                <span className="fp-stat-label">Check in, earn Cr</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== TWO PROGRAMS ===== */}
      <section className="fp-section" id="how">
        <div className="fp-section-inner">
          <div className="fp-intro">
            <p className="mz-eyebrow mz-eyebrow--centred">Two programs, one community</p>
            <h2 className="fp-h2">Find your people, near and wide.</h2>
          </div>
          <div className="fp-grid fp-grid--2col">
            <div className="fp-card fp-card--dark">
              <span className="fp-card-icon">🏙️</span>
              <div className="fp-card-title">Literati Connect</div>
              <p className="fp-card-body" style={{ fontWeight: 700 }}>Monthly, city-wide</p>
              <p className="fp-card-body">
                A monthly meetup that brings every Moveee member in your city into the same
                room — readings, talks, screenings and socials curated around culture.
                Built on the same editorial events system Moveee already runs.
              </p>
            </div>
            <div className="fp-card fp-card--dark">
              <span className="fp-card-icon">🏠</span>
              <div className="fp-card-title">Stoop</div>
              <p className="fp-card-body" style={{ fontWeight: 700 }}>Weekly, your area</p>
              <p className="fp-card-body">
                A smaller, weekly gathering of members who live near you. Hosted by a fellow
                member — appointed, self-nominated, or elected by the cluster — with a simple
                QR check-in each week, open to every membership tier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DETAIL ROWS ===== */}
      <section className="fp-section fp-section--white">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Stoop</p>
              <h3 className="fp-row-title">A cluster that picks its own host.</h3>
              <p className="fp-row-body">
                Every Stoop cluster is built around your local area — and run by
                someone from it. Hosts get there one of three ways: appointed by Moveee,
                self-nominated, or elected by the cluster itself. If your home cluster is
                full, you can join a nearby one as overflow.
              </p>
              <ul className="fp-row-list">
                <li>Area-level clusters — find your people closest to home</li>
                <li>Three host-selection paths: appointed, self-nominated, elected</li>
                <li>Overflow joining when your home cluster reaches capacity</li>
                <li>Weekly QR check-in, mirroring the Perks redemption flow you already know</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Rewards, badges &amp; the feed</p>
              <h3 className="fp-row-title">Showing up earns you something.</h3>
              <p className="fp-row-body">
                Attending Literati Connect or checking into Stoop earns Culture
                Credits and Reputation Points, just like posting or reacting in the app. Hit
                attendance milestones and unlock dedicated badges — and a Stoop
                reminder card surfaces right in your Pulse Feed so you never miss the week's
                gathering.
              </p>
              <ul className="fp-row-list">
                <li>Culture Credits and Reputation Points for every check-in</li>
                <li>Dedicated attendance badges and milestones</li>
                <li>Stoop feed reminder card — never miss a week</li>
                <li>Literati Connect events surfaced in Discover and Events</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="literati-connect"
        heading="Your community is closer than you think."
        body="Download Moveee, find your Stoop cluster, and RSVP to the next Literati Connect in your city."
      />
    </>
  );
}
