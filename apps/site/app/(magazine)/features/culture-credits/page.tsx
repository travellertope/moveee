import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Culture Credits & Reputation — Get Rewarded for Having Taste | Moveee",
  description:
    "Every post, reaction, RSVP and check-in on Moveee earns Culture Credits (Cr) and Reputation Points (Pt). Climb the reputation tiers and unlock real privileges across the app.",
  alternates: { canonical: "https://themoveee.com/features/culture-credits" },
  openGraph: {
    title: "Culture Credits & Reputation — Get Rewarded for Having Taste | Moveee",
    description:
      "Earn Culture Credits and Reputation Points for every contribution that lands.",
    url: "https://themoveee.com/features/culture-credits",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Culture Credits & Reputation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Culture Credits & Reputation — Get Rewarded for Having Taste | Moveee",
    description:
      "Earn Culture Credits and Reputation Points for every contribution that lands.",
  },
};

const TIERS = [
  { icon: "🌱", name: "Member", req: "0 Pt" },
  { icon: "✍️", name: "Culture Contributor", req: "500 Pt" },
  { icon: "🎯", name: "Taste Maker", req: "2,500 Pt" },
  { icon: "🏛️", name: "Culture Authority", req: "10,000 Pt" },
  { icon: "👑", name: "Culture Icon", req: "25,000 Pt + nomination" },
];

export default function CultureCreditsPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Culture Credits &amp; Reputation</p>
            <h1 className="fp-h1">
              Get rewarded <em>for having taste.</em>
            </h1>
            <p className="fp-subhead">
              Every contribution on Moveee — a post, a reaction, an RSVP, a Stoop
              check-in — earns Culture Credits and Reputation Points. Credits spend. Reputation
              climbs.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#tiers" className="mz-btn-secondary">See reputation tiers</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · Earn from your very first post</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">Cr</span>
                <span className="fp-stat-label">Culture Credits — spendable</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">Pt</span>
                <span className="fp-stat-label">Reputation Points — your standing</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">19</span>
                <span className="fp-stat-label">Ways to earn both</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== TIER LADDER ===== */}
      <section className="fp-section" id="tiers">
        <div className="fp-section-inner">
          <div className="fp-intro">
            <p className="mz-eyebrow mz-eyebrow--centred">Five tiers to climb</p>
            <h2 className="fp-h2">Standing in the community, made visible.</h2>
            <p className="fp-body fp-body--centred">
              Reputation Points aren't just a number — they unlock real privileges across
              the app, from feed visibility to template access to nomination power.
            </p>
          </div>
          <div className="fp-grid">
            {TIERS.map((t) => (
              <div key={t.name} className="fp-card">
                <span className="fp-card-icon">{t.icon}</span>
                <div className="fp-card-title">{t.name}</div>
                <p className="fp-card-body" style={{ fontWeight: 700 }}>{t.req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS / PRIVILEGES ===== */}
      <section className="fp-section fp-section--white">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1565514020179-026b92b2d70b?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">How you earn</p>
              <h3 className="fp-row-title">Every action counts — literally.</h3>
              <p className="fp-row-body">
                Posting, reacting, voting in a poll, finishing a daily game, reading an
                article, attending a Literati Connect meetup, checking into a
                Stoop — every one of these earns both Culture Credits and Reputation
                Points, with a daily cap to keep things fair.
              </p>
              <ul className="fp-row-list">
                <li>19 distinct ways to earn — no dead-end actions</li>
                <li>Daily credit cap keeps the economy balanced for everyone</li>
                <li>Full earning history in your Wallet, day by day</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">What reputation unlocks</p>
              <h3 className="fp-row-title">Standing has real privileges.</h3>
              <p className="fp-row-body">
                Higher reputation doesn't just look good — it changes what you can do.
                Taste Makers get a feed visibility boost and skip the new-member review
                queue. Culture Authorities can nominate members for Culture Icon, the
                platform's highest, invite-only honor.
              </p>
              <ul className="fp-row-list">
                <li>Taste Maker — feed boost, skip new-member review, Poll &amp; Itinerary templates</li>
                <li>Culture Authority — nominate others for Culture Icon</li>
                <li>Culture Icon — the platform's highest honor, by nomination only</li>
                <li>Gated partner perks unlock at higher tiers automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="culture-credits"
        heading="Your taste is worth something here."
        body="Download Moveee and start earning Culture Credits and Reputation Points from your very first post."
      />
    </>
  );
}
