import StoopCtas from "@/components/StoopCtas";
import StoopFaqAccordion from "@/components/StoopFaqAccordion";
import "./stoop.css";

// The two CTA pairs are <StoopCtas />, a client island: what they should say
// depends on whether the visitor is already signed in, and the rest of this
// page has no reason to go dynamic for it. See that component. The FAQ's
// expand/collapse is likewise isolated to <StoopFaqAccordion />.

export const metadata = {
  // Bare "Moveee", not "Moveee Magazine" — Stoop is a platform/cross-surface
  // feature, not editorial content. See the brand-suffix rules in CLAUDE.md.
  title: { absolute: "Stoop | Moveee" },
  description:
    "Stoop is a small group of people who live in the same area and meet in person to connect and engage with culture. Free to join and open to all.",
  openGraph: {
    title: "Stoop | Moveee",
    description:
      "A small group of people near you, meeting every week. Free to join and open to all.",
    siteName: "Moveee",
    type: "website",
    url: "https://themoveee.com/stoop",
  },
  alternates: { canonical: "https://themoveee.com/stoop" },
};

export default function StoopPage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="stp-hero" id="about">
        <div className="stp-hero-text">
          <p className="stp-hero-tag">The Moveee — Stoop</p>
          <h1 className="stp-hero-h1">A small group of people near you, meeting every week.</h1>
          <p className="stp-hero-p">
            The Stoop is a small group of people who live in the same area and meet in person to
            connect and engage with culture. It is free to join and open to all.
          </p>
          <StoopCtas variant="hero" />
          <p className="stp-hero-caption">Most groups have between four and twelve people.</p>
        </div>
        <div className="stp-hero-visual" aria-hidden="true" />
      </section>

      {/* ── THREE PHOTO PANELS ── */}
      <div className="stp-panels" aria-hidden="true">
        <div className="stp-panel stp-panel-green" />
        <div className="stp-panel stp-panel-amber" />
        <div className="stp-panel stp-panel-slate" />
      </div>

      {/* ── WHAT A WEEK LOOKS LIKE ── */}
      <section className="stp-week" id="how-it-works">
        <span className="stp-label">How it works</span>
        <h2 className="stp-headline">What a week looks like.</h2>
        <div className="stp-steps">
          <div className="stp-step">
            <span className="stp-step-num">01</span>
            <h3>You turn up.</h3>
            <p>
              Same day, same place, every week. Nothing to arrange and no one to chase &mdash; you
              already know where you are going and who will be there.
            </p>
          </div>
          <div className="stp-step">
            <span className="stp-step-num">02</span>
            <h3>You eat, talk and share what you are into.</h3>
            <p>
              A record someone has had on repeat. A book, a film, a meal worth cooking. A place in
              the city nobody else has been to yet. It is a conversation, not a programme.
            </p>
          </div>
          <div className="stp-step">
            <span className="stp-step-num">03</span>
            <h3>You make plans together.</h3>
            <p>
              A gig, an exhibition, a market, a film someone wants to see. Groups keep their own
              space in the app, so plans carry on between meetings.
            </p>
          </div>
        </div>
        <p className="stp-week-note">
          Taking part earns you credits and points you can use across Moveee.
        </p>
      </section>

      {/* ── HOSTING ── */}
      <section className="stp-hosting" id="hosting">
        <div className="stp-hosting-left">
          <h2>One member hosts the group.</h2>
          <p>
            Every group has one member who hosts it. They pick the place, the day and how many
            people can come, and they decide who can see the address. If they stop hosting, the
            group chooses someone else and carries on.
          </p>
          <a className="stp-btn stp-btn-outline stp-hosting-cta" href="https://web.themoveee.com/cluster/create">
            Read about hosting
          </a>
        </div>
        <div className="stp-hosting-right">
          <div className="stp-detail">
            <span className="stp-detail-lbl">Where you meet</span>
            <p className="stp-detail-val">
              Your home, a caf&eacute;, a shared workspace, or somewhere else you choose.
            </p>
          </div>
          <div className="stp-detail">
            <span className="stp-detail-lbl">How many people</span>
            <p className="stp-detail-val">
              You set the number: between <strong>2 and 20</strong>, based on the space you have.
            </p>
          </div>
          <div className="stp-detail">
            <span className="stp-detail-lbl">Your address</span>
            <p className="stp-detail-val">
              Show it to <strong>members only</strong>, when someone asks, or share the area and
              nothing more.
            </p>
          </div>
          <div className="stp-detail">
            <span className="stp-detail-lbl">Getting in</span>
            <p className="stp-detail-val">
              Say whether the space can be reached <strong>without steps</strong>, so no one
              arrives to a problem.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="stp-faq" id="faq">
        <span className="stp-label">Common questions</span>
        <h2 className="stp-headline">Questions people ask.</h2>
        <StoopFaqAccordion />
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="stp-cta" id="join">
        <h2>Find the groups near you.</h2>
        <p>
          Groups are forming in areas across the city. Find one near you, or start one yourself
          &mdash; it costs nothing either way.
        </p>
        <StoopCtas variant="cta" />
      </section>
    </>
  );
}
