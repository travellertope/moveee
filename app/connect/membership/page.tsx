import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PatronPrice from "@/components/PatronPrice";
import Link from "next/link";
import "../connect.css";

export const metadata: Metadata = {
  title: "Membership — Moveee Connect",
  description:
    "Join Moveee Connect as a Citizen for free, or become a Connect Pro member for featured directory listing, gated content access, exclusive perks, and more.",
};

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const loggedIn = !!session;
  const isPro = user?.tier === "patron";

  return (
    <div>
      {/* ── HERO ── */}
      <section className="mco-hero" style={{ paddingBottom: 0 }}>
        <div className="mco-hero-inner" style={{ gridTemplateColumns: "1fr" }}>
          <div className="mco-hero-text">
            <p className="mco-eyebrow">Moveee Connect · Membership</p>
            <h1 className="mco-headline">
              Belong to <em>something.</em>
            </h1>
            <p className="mco-lede" style={{ maxWidth: 540 }}>
              Moveee Connect is for Black and diaspora creatives, entrepreneurs, professionals,
              and culture lovers. Membership is how you show up — and how the community shows up for you.
            </p>
          </div>
        </div>

        <nav className="mco-section-nav" aria-label="Connect sections">
          <Link href="/connect" className="mco-nav-link">Pulse Feed</Link>
          <Link href="/connect/people" className="mco-nav-link">The Directory</Link>
          <span className="mco-nav-link" style={{ color: "rgba(243,236,224,.85)", borderBottom: "1px solid rgba(243,236,224,.2)", paddingBottom: 13 }}>
            Membership
          </span>
        </nav>
      </section>

      {/* ── TIERS ── */}
      <section className="mco-membership-full">
        <div className="mco-membership-inner">

          {/* Citizen */}
          <div className="mco-tier-card">
            <div className="mco-tier-eyebrow">Free</div>
            <h2 className="mco-tier-name">Connect<br />Citizen</h2>
            <div className="mco-tier-price">Free forever</div>
            <ul className="mco-tier-perks">
              <li>Pulse feed &amp; community posts</li>
              <li>Member directory listing</li>
              <li>Primary chapter</li>
              <li>Online event access</li>
              <li>The Cultural Digest newsletter</li>
              <li>Culture points &amp; badges</li>
            </ul>
            {!loggedIn && (
              <Link href="/register?tier=citizen" className="mco-tier-btn">
                Become a Citizen →
              </Link>
            )}
            {loggedIn && !isPro && (
              <span className="mco-tier-status">Your current membership</span>
            )}
            {loggedIn && isPro && (
              <span className="mco-tier-status mco-tier-status--muted">Included in Connect Pro</span>
            )}
          </div>

          {/* Connect Pro */}
          <div className="mco-tier-card mco-tier-card--pro">
            <div className="mco-tier-eyebrow">Premium</div>
            <h2 className="mco-tier-name">Connect<br /><em>Pro</em></h2>
            <div className="mco-tier-price">
              <PatronPrice variant="yearly" /> · <PatronPrice variant="monthly" /> — cancel anytime
            </div>
            <ul className="mco-tier-perks">
              <li>Everything in Citizen</li>
              <li>Featured directory listing</li>
              <li>Connect Pro badge on your Pulse posts</li>
              <li>Exclusive gated content &amp; editorials</li>
              <li>Priority RSVP for all events</li>
              <li>Full GetMeLit newsletter edition</li>
              <li>10% discount in the Moveee Shop</li>
              <li>Early access to new features</li>
            </ul>
            {!loggedIn && (
              <Link href="/register?tier=patron" className="mco-tier-btn mco-tier-btn--pro">
                Become a Connect Pro →
              </Link>
            )}
            {loggedIn && !isPro && (
              <Link href="/register?upgrade=patron" className="mco-tier-btn mco-tier-btn--pro">
                Upgrade to Connect Pro →
              </Link>
            )}
            {loggedIn && isPro && (
              <span className="mco-tier-status">Your current membership</span>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div className="mco-compare">
          <div className="mco-compare-inner">
            <table className="mco-compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Citizen</th>
                  <th>Connect Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Pulse feed & community posts",         true,  true],
                  ["Member directory listing",             true,  true],
                  ["Featured directory listing",           false, true],
                  ["Pro badge on Pulse posts",             false, true],
                  ["Primary chapter",                      true,  true],
                  ["Online event access",                  true,  true],
                  ["Priority RSVP",                        false, true],
                  ["The Cultural Digest",                  true,  true],
                  ["Full GetMeLit edition",                false, true],
                  ["Exclusive gated content",              false, true],
                  ["10% Moveee Shop discount",             false, true],
                  ["Early access to features",             false, true],
                  ["Culture points & badges",              true,  true],
                ].map(([feature, citizen, pro]) => (
                  <tr key={feature as string}>
                    <td>{feature as string}</td>
                    <td>{citizen ? <span className="mco-check">✓</span> : <span className="mco-cross">—</span>}</td>
                    <td>{pro ? <span className="mco-check mco-check--pro">✓</span> : <span className="mco-cross">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
