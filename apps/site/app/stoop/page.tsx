import StoopCtas from "@/components/StoopCtas";
import "./stoop.css";

// Site B owns auth — every CTA on this page leaves for web.themoveee.com.
// Same constant/shape as Header.tsx and ShopFooter.tsx in this app.
const CONNECT_URL = "https://web.themoveee.com";

// The two main CTA pairs are <StoopCtas />, a client island: what they should
// say depends on whether the visitor is already signed in, and the rest of
// this page has no reason to go dynamic for it. See that component.

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
    <div className="stp-page">
      <div className="stp-wrap">
        {/* ── HERO ── */}
        <section className="stp-section stp-hero">
          <div className="stp-hero-grid">
            <div className="stp-hero-copy">
              <h1>A small group of people near you, meeting every week.</h1>
              <p className="stp-hero-sub">
                Stoop is a small group of people who live in the same area and meet in person to
                connect and engage with culture. It is free to join and open to all.
              </p>
              <StoopCtas />
              <p className="stp-hero-note">Most groups have between four and twelve people.</p>
            </div>
            <span className="stp-ph stp-ph--hero stp-hero-img" role="presentation" />
          </div>

          <div className="stp-strip">
            <span className="stp-ph stp-ph--talking" role="presentation" />
            <span className="stp-ph stp-ph--table" role="presentation" />
            <span className="stp-ph stp-ph--doorstep" role="presentation" />
          </div>
        </section>
      </div>

      {/* ── WHAT A WEEK LOOKS LIKE ── */}
      <section className="stp-section stp-tint">
        <div className="stp-wrap">
          <div className="stp-sec-head">
            <h2>What a week looks like.</h2>
          </div>
          <div className="stp-steps">
            <div className="stp-step">
              <span className="stp-ph stp-ph--arriving" role="presentation" />
              <div className="stp-step-body">
                <h3>You turn up</h3>
                <p>
                  Same day, same place, every week. Nothing to arrange and no one to chase &mdash;
                  you already know where you are going and who will be there.
                </p>
              </div>
            </div>
            <div className="stp-step">
              <span className="stp-ph stp-ph--talking" role="presentation" />
              <div className="stp-step-body">
                <h3>You eat, talk and share what you are into</h3>
                <p>
                  A record someone has had on repeat. A book, a film, a meal worth cooking. A place
                  in the city nobody else has been to yet. It is a conversation, not a programme.
                </p>
              </div>
            </div>
            <div className="stp-step">
              <span className="stp-ph stp-ph--planning" role="presentation" />
              <div className="stp-step-body">
                <h3>You make plans together</h3>
                <p>
                  A gig, an exhibition, a market, a film someone wants to see. Groups keep their
                  own space in the app, so plans carry on between meetings.
                </p>
              </div>
            </div>
          </div>
          <p className="stp-week-note">
            Taking part earns you credits and points you can use across Moveee.
          </p>
        </div>
      </section>

      {/* ── HOSTING ── */}
      <section className="stp-section stp-tint">
        <div className="stp-wrap">
          <div className="stp-two">
            <div>
              <div className="stp-sec-head stp-sec-head--tight">
                <h2>One member hosts the group.</h2>
                <p>
                  Every group has one member who hosts it. They pick the place, the day and how
                  many people can come, and they decide who can see the address. If they stop
                  hosting, the group chooses someone else and carries on.
                </p>
              </div>
              <div className="stp-cta-row">
                <a className="stp-btn stp-btn--ghost" href={`${CONNECT_URL}/cluster/create`}>
                  Read about hosting
                </a>
              </div>
            </div>
            <div className="stp-opts">
              <div className="stp-opt">
                <span className="stp-opt-k">Where you meet</span>
                <span className="stp-opt-v">
                  Your home, a caf&eacute;, a shared workspace, or somewhere else you choose.
                </span>
              </div>
              <div className="stp-opt">
                <span className="stp-opt-k">How many people</span>
                <span className="stp-opt-v">
                  You set the number, between <b>2 and 20</b>, based on the space you have.
                </span>
              </div>
              <div className="stp-opt">
                <span className="stp-opt-k">Your address</span>
                <span className="stp-opt-v">
                  Show it to <b>members only</b>, <b>when someone asks</b>, or{" "}
                  <b>share the area and nothing more</b>.
                </span>
              </div>
              <div className="stp-opt">
                <span className="stp-opt-k">Getting in</span>
                <span className="stp-opt-v">
                  Say whether the space can be reached <b>without steps</b>, so no one arrives to
                  a problem.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUESTIONS ── */}
      <div className="stp-wrap">
        <section className="stp-section">
          <div className="stp-sec-head">
            <h2>Common questions.</h2>
          </div>
          <div className="stp-faq">
            <div className="stp-q">
              <h3>Does it cost anything?</h3>
              <p>
                No. Stoop is open to all Moveee members, including free membership. There is
                nothing to pay for.
              </p>
            </div>
            <div className="stp-q">
              <h3>What if there is no group near me?</h3>
              <p>
                You can create one. It stays closed until four people join. You can also join a
                group nearby that still has space.
              </p>
            </div>
            <div className="stp-q">
              <h3>Do I have to host?</h3>
              <p>
                No. Most members never host. People host because they offer to, and they can hand
                it to someone else at any time.
              </p>
            </div>
            <div className="stp-q">
              <h3>Do I have to go every week?</h3>
              <p>No. Go when you can &mdash; missing a week changes nothing.</p>
            </div>
            <div className="stp-q">
              <h3>Will people see my address?</h3>
              <p>
                Only if you host, and only if you choose to share it. By default people browsing
                see the area, not the address.
              </p>
            </div>
            <div className="stp-q">
              <h3>What happens between meetings?</h3>
              <p>
                Each group has its own space in the app, where members post and plan until the
                next meeting.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── CLOSE ── */}
      <div className="stp-wrap">
        <section className="stp-section stp-close-section">
          <div className="stp-close-band">
            <span className="stp-ph stp-ph--street" role="presentation" />
            <div className="stp-close-inner">
              <h2>See which groups are near you.</h2>
              <p>
                Groups are forming in areas across the city. Find one near you, or start one
                yourself &mdash; it costs nothing either way.
              </p>
              <StoopCtas />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
