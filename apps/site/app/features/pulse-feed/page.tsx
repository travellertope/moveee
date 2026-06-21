import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Pulse Feed — Ten Ways to Share Culture | Moveee",
  description:
    "The Moveee Pulse Feed is where culture gets posted in real time — hidden gems, hot takes, food reviews, polls, itineraries, events and more. Every post earns Culture Credits.",
  alternates: { canonical: "https://themoveee.com/features/pulse-feed" },
  openGraph: {
    title: "Pulse Feed — Ten Ways to Share Culture | Moveee",
    description:
      "Hidden gems, hot takes, food reviews, polls, itineraries, events and more — posted by people who live for culture, rewarded with every post.",
    url: "https://themoveee.com/features/pulse-feed",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Pulse Feed" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse Feed — Ten Ways to Share Culture | Moveee",
    description:
      "Hidden gems, hot takes, food reviews, polls, itineraries, events and more — posted by people who live for culture, rewarded with every post.",
  },
};

const TEMPLATES = [
  { icon: "📝", title: "Standard Post", body: "Say what's on your mind — tag the section it belongs to and let the feed find its people." },
  { icon: "💎", title: "Hidden Gem", body: "The spot nobody's posted yet. Location, price range, opening hours — pinned for everyone after you." },
  { icon: "🗣️", title: "Cultural Take", body: "Your hot take, headline-first. No image required — just the argument." },
  { icon: "🍽️", title: "Food Review", body: "Rate taste, value and vibe separately. Link the restaurant straight to Discover." },
  { icon: "📚", title: "Book Review", body: "Status, star rating, a breakdown by writing/story/characters/pacing, and your favourite quote." },
  { icon: "🎨", title: "Creative Showcase", body: "Photography, film, music, writing — show the work, credit your collaborators." },
  { icon: "📊", title: "Poll", body: "Ask the community to settle it. Runs 1, 3 or 7 days." },
  { icon: "🗺️", title: "Itinerary", body: "Stop-by-stop plans for a city or a night out, with budget and best time to go." },
  { icon: "📅", title: "Event", body: "Post your own event with RSVP and a capacity cap — Moveee Pro members can manage attendees." },
  { icon: "❝", title: "Quote", body: "A line worth keeping, with the source and why it stuck with you." },
];

export default function PulseFeedPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Pulse Feed</p>
            <h1 className="fp-h1">
              Culture, <em>posted as it happens.</em>
            </h1>
            <p className="fp-subhead">
              Not just another caption box. Ten purpose-built templates for the way culture
              actually gets shared — a hidden gem, a hot take, a poll, an itinerary — so every
              post shows up exactly the way it should.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#templates" className="mz-btn-secondary">See all 10 templates</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · Every post earns Culture Credits</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">10</span>
                <span className="fp-stat-label">Post templates</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">Cr</span>
                <span className="fp-stat-label">Earned per post</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">∞</span>
                <span className="fp-stat-label">Reasons to scroll</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== TEMPLATE GRID ===== */}
      <section className="fp-section" id="templates">
        <div className="fp-section-inner">
          <div className="fp-intro">
            <p className="mz-eyebrow mz-eyebrow--centred">Nine — actually ten — ways to share</p>
            <h2 className="fp-h2">Pick the format that fits the moment.</h2>
            <p className="fp-body fp-body--centred">
              Every template is built for one specific kind of post, so it always renders right —
              star ratings on a food review, a live vote count on a poll, a countdown on an event.
            </p>
          </div>
          <div className="fp-grid">
            {TEMPLATES.map((t) => (
              <div key={t.title} className="fp-card">
                <span className="fp-card-icon">{t.icon}</span>
                <div className="fp-card-title">{t.title}</div>
                <p className="fp-card-body">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR YOU / TRENDING ===== */}
      <section className="fp-section fp-section--white">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1556656793-08538906a9f8?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">For You</p>
              <h3 className="fp-row-title">A feed that learns your taste.</h3>
              <p className="fp-row-body">
                Pick your interests once and the feed re-ranks around them — boosted by what's
                trending nearby, who you follow, and posts from members with real standing in the
                community.
              </p>
              <ul className="fp-row-list">
                <li>Interest-based ranking, re-sorted on demand</li>
                <li>Trending sidebar — what's getting the most reactions this week</li>
                <li>Follow members whose taste you trust, get notified when they post</li>
                <li>Event Spotlight — the city's best happenings, surfaced automatically</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">React, comment, @mention</p>
              <h3 className="fp-row-title">A real conversation, not just likes.</h3>
              <p className="fp-row-body">
                React with love, fire or clap — one reaction per post, switch anytime. Comment
                threads on every post type. Mention anyone with @username and they'll know.
              </p>
              <ul className="fp-row-list">
                <li>One consistent reaction model across every surface</li>
                <li>Threaded comments on posts, pulse stories, quotes and articles</li>
                <li>@mentions notify the person you tagged — across the whole platform</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="pulse-feed"
        heading="Your first post is one tap away."
        body="Download Moveee, claim your handle, and post your first hidden gem, hot take or review — every one of them earns Culture Credits from the start."
      />
    </>
  );
}
