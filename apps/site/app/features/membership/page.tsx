import Link from "next/link";
import type { Metadata } from "next";
import PatronPrice from "@/components/PatronPrice";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Membership — Moveee Citizen vs Moveee Pro | Moveee",
  description:
    "Moveee is free to join as a Moveee Citizen. Upgrade to Moveee Pro for exclusive stories, 10% off the Lifestyle Shop with early access, and first access to new features.",
  alternates: { canonical: "https://themoveee.com/features/membership" },
  openGraph: {
    title: "Membership — Moveee Citizen vs Moveee Pro | Moveee",
    description: "Compare Moveee Citizen and Moveee Pro and see what each tier unlocks.",
    url: "https://themoveee.com/features/membership",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Membership" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Membership — Moveee Citizen vs Moveee Pro | Moveee",
    description: "Compare Moveee Citizen and Moveee Pro and see what each tier unlocks.",
  },
};

const COMPARE = [
  { feature: "Post to Pulse Feed, all 10 templates", citizen: true, pro: true },
  { feature: "Browse Discover & RSVP to events", citizen: true, pro: true },
  { feature: "GetMeLit & Culture Drop newsletters", citizen: true, pro: true },
  { feature: "Daily Games — Trivia & Who Said It?", citizen: true, pro: true },
  { feature: "Earn Culture Credits & Reputation", citizen: true, pro: true },
  { feature: "Literati Connect & House Fellowship", citizen: true, pro: true },
  { feature: "Post links in the feed", citizen: false, pro: true },
  { feature: "Create RSVP-managed events with attendee lists", citizen: false, pro: true },
  { feature: "10% off the Lifestyle Shop", citizen: false, pro: true },
  { feature: "Early access to new Shop drops", citizen: false, pro: true },
  { feature: "Exclusive Moveee Pro patron stories", citizen: false, pro: true },
  { feature: "First access to new features", citizen: false, pro: true },
];

export default function MembershipPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Membership</p>
            <h1 className="fp-h1">
              Free to join. <em>More for the obsessed.</em>
            </h1>
            <p className="fp-subhead">
              Every member gets the full Moveee experience for free as a Moveee Citizen.
              Moveee Pro adds more — at the shop, in the feed, and at the front of the line
              for what's new.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join free</Link>
              <Link href="/register?tier=patron" className="mz-btn-secondary">Upgrade to Pro</Link>
            </div>
            <p className="fp-trust">No card required for Citizen · Cancel Pro anytime</p>
          </div>
        </div>
      </section>

      {/* ===== TIER CARDS ===== */}
      <section className="fp-section">
        <div className="fp-section-inner">
          <div className="fp-grid fp-grid--2col">
            <div className="fp-card">
              <div className="fp-card-title">Moveee Citizen</div>
              <p className="fp-card-body" style={{ fontWeight: 700, color: "var(--mz-success, #2f6b3c)" }}>Free, forever</p>
              <p className="fp-card-body">
                Post to the feed, browse Discover, RSVP to events, play Daily Games, and
                get our newsletters — GetMeLit and Culture Drop — straight to your inbox.
                Earn Culture Credits and Reputation Points from day one.
              </p>
              <Link href="/register" className="mz-btn-ghost">Join free</Link>
            </div>
            <div
              className="fp-card fp-card--dark"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(20,17,13,0.86), rgba(20,17,13,0.92)), url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80&auto=format&fit=crop')",
              }}
            >
              <div className="fp-card-title">
                Moveee Pro — from <PatronPrice variant="monthly" />
              </div>
              <p className="fp-card-body" style={{ fontWeight: 700 }}>Everything in Citizen, plus more</p>
              <p className="fp-card-body">
                Exclusive patron stories, 10% off the Lifestyle Shop with early access to
                every drop, RSVP-managed events with full attendee lists, and first access
                to new features before anyone else.
              </p>
              <Link href="/register?tier=patron" className="mz-btn-gold">Upgrade to Pro</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="fp-section fp-section--white">
        <div className="fp-section-inner">
          <div className="fp-intro">
            <p className="mz-eyebrow mz-eyebrow--centred">Side by side</p>
            <h2 className="fp-h2">Every feature, compared.</h2>
          </div>
          <div style={{ maxWidth: 720, margin: "0 auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--mz-ink, #14110d)" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px", fontSize: 14 }}>Feature</th>
                  <th style={{ textAlign: "center", padding: "12px 8px", fontSize: 14 }}>Citizen</th>
                  <th style={{ textAlign: "center", padding: "12px 8px", fontSize: 14, color: "var(--mz-gold, #b38238)" }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.feature} style={{ borderBottom: "1px solid var(--mz-ghost, #e2dccf)" }}>
                    <td style={{ padding: "10px 8px", fontSize: 14 }}>{row.feature}</td>
                    <td style={{ textAlign: "center", padding: "10px 8px" }}>{row.citizen ? "✓" : "—"}</td>
                    <td style={{ textAlign: "center", padding: "10px 8px", color: "var(--mz-gold, #b38238)" }}>{row.pro ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="membership"
        heading="Start free. Go Pro whenever you're ready."
        body="Download Moveee and join as a Moveee Citizen today — upgrade to Pro the moment you want more."
      />
    </>
  );
}
