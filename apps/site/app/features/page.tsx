import Link from "next/link";
import type { Metadata } from "next";
import { FEATURE_PAGES } from "@/lib/features";

export const metadata: Metadata = {
  title: "Moveee Features — Everything Inside the App",
  description:
    "Pulse Feed, Discover, Literati Connect, Events, Culture Credits & Reputation, Partner Perks, Daily Games, the Lifestyle Shop, and Membership — everything Moveee gives you for being an active part of culture.",
  alternates: { canonical: "https://themoveee.com/features" },
  openGraph: {
    title: "Moveee Features — Everything Inside the App",
    description:
      "Everything Moveee gives you for being an active part of culture — post, discover, connect in person, and get rewarded for your taste.",
    url: "https://themoveee.com/features",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Features" }],
  },
};

const BLURBS: Record<string, { hook: string; body: string; icon: string }> = {
  "pulse-feed": { icon: "🌊", hook: "Ten ways to share", body: "Hidden gems, hot takes, polls, itineraries — posted in the format that actually fits." },
  "discover": { icon: "🧭", hook: "The map only the community could write", body: "People, places, dishes, films, movements — browsable by type and city." },
  "literati-connect": { icon: "🤝", hook: "Culture, in person", body: "Monthly city-wide meetups and weekly House Fellowship clusters near you." },
  "events": { icon: "📅", hook: "Know what's actually happening", body: "RSVP to shows, pop-ups and talks — curated by us, submitted by you." },
  "culture-credits": { icon: "🏆", hook: "Get rewarded for having taste", body: "Earn Culture Credits and Reputation Points for every contribution that lands." },
  "perks-wallet": { icon: "🎁", hook: "Spend it, or cash it out", body: "Redeem Culture Credits for real discounts, or convert them straight to cash." },
  "games": { icon: "🎮", hook: "Keep your culture IQ sharp", body: "Trivia and Who Said It? — two minutes a day, bragging rights forever." },
  "shop": { icon: "🛍️", hook: "Style, sourced by the community", body: "Independent makers and curated drops — Moveee Pro members get 10% off and early access." },
  "membership": { icon: "✦", hook: "Free to join. More for the obsessed.", body: "Compare Moveee Citizen and Moveee Pro and see what each tier unlocks." },
};

export default function FeaturesHubPage() {
  return (
    <>
      <section className="fp-hero">
        <div className="fp-hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <p className="mz-eyebrow">Moveee</p>
            <h1 className="fp-h1">
              Everything inside the app, <em>explained.</em>
            </h1>
            <p className="fp-subhead">
              Moveee is a community and discovery platform built for people who live for culture.
              Here's what's inside — and what it's like once you're in.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · No spam, ever</p>
          </div>
        </div>
      </section>

      <section className="fp-section">
        <div className="fp-section-inner">
          <div className="fp-grid fp-grid--2col">
            {FEATURE_PAGES.map((f) => {
              const b = BLURBS[f.slug];
              return (
                <Link key={f.slug} href={`/features/${f.slug}`} className="fp-card" style={{ textDecoration: "none" }}>
                  <span className="fp-card-icon">{b?.icon}</span>
                  <div className="fp-card-title">{f.label}</div>
                  <p className="fp-card-body" style={{ fontWeight: 700, color: "var(--mz-ink-soft, #3a342b)" }}>{b?.hook}</p>
                  <p className="fp-card-body">{b?.body}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
