import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Events — Know What's Actually Happening | Moveee",
  description:
    "Moveee Events surfaces shows, pop-ups and talks curated by the Moveee team and submitted by the community — RSVP, get reminders, and never miss what's happening in your city.",
  alternates: { canonical: "https://themoveee.com/features/events" },
  openGraph: {
    title: "Events — Know What's Actually Happening | Moveee",
    description:
      "RSVP to shows, pop-ups and talks — curated by us, submitted by you.",
    url: "https://themoveee.com/features/events",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Events" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events — Know What's Actually Happening | Moveee",
    description:
      "RSVP to shows, pop-ups and talks — curated by us, submitted by you.",
  },
};

export default function EventsPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Events</p>
            <h1 className="fp-h1">
              Know what's <em>actually happening.</em>
            </h1>
            <p className="fp-subhead">
              Editorial picks curated by Moveee, plus events posted straight from the
              community — shows, pop-ups, talks and meetups, all RSVP-able from inside
              the app.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#spotlight" className="mz-btn-secondary">See Event Spotlight</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · Curated and community-submitted</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">RSVP</span>
                <span className="fp-stat-label">One tap, in the app</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">🎫</span>
                <span className="fp-stat-label">Capacity caps + attendee lists</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">✦</span>
                <span className="fp-stat-label">Editorial Spotlight carousel</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== SPOTLIGHT + DETAILS ===== */}
      <section className="fp-section fp-section--white" id="spotlight">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Event Spotlight</p>
              <h3 className="fp-row-title">The city's best happenings, surfaced automatically.</h3>
              <p className="fp-row-body">
                A horizontally-scrolling carousel of the best editorial and community events
                appears right in your feed — ranked by how complete, featured and popular
                each event is, so the best ones rise to the top without you having to search
                for them.
              </p>
              <ul className="fp-row-list">
                <li>Mixes Moveee-curated picks with community-submitted events</li>
                <li>Ranked by featured status, completeness and RSVP momentum</li>
                <li>Appears automatically in your Pulse Feed</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Post your own</p>
              <h3 className="fp-row-title">Running something? Post it yourself.</h3>
              <p className="fp-row-body">
                Any member with enough standing in the community can post their own event —
                date, venue, ticket link, category and an organiser profile linked straight
                to Discover. Moveee Pro members can additionally cap capacity and manage a
                full RSVP attendee list.
              </p>
              <ul className="fp-row-list">
                <li>Free RSVP with capacity caps — Moveee Pro manages the guest list</li>
                <li>Organiser profile linked to Discover</li>
                <li>Ticket link, admission price, venue and category fields</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="events"
        heading="The next great night out is one RSVP away."
        body="Download Moveee to RSVP to what's happening near you — or post your own event and let the community show up."
      />
    </>
  );
}
