import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PatronPrice from "@/components/PatronPrice";
import Link from "next/link";
import "../../sections.css";
import "../../feed/feed.css";

export const metadata: Metadata = {
  title: "Membership — Moveee",
  description:
    "Join Moveee as a Citizen for free, or upgrade to Moveee Pro for patron-only content, 10% shop discount, credit cashout, 5 game plays per day, and more.",
};

export default async function MembershipPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const loggedIn = !!session;
  const isPro = user?.tier === "patron";

  return (
    <div>
      {/* ── HERO ── */}
      <section className="mco-hero">
        <div className="mco-hero-inner">
          <div className="mco-hero-text">
            <p className="mco-eyebrow">Moveee · Membership</p>
            <h1 className="mco-headline">
              Belong to <em>something.</em>
            </h1>
            <p className="mco-lede">
              Moveee is for creatives from around the world, entrepreneurs, professionals,
              and culture lovers. Membership is how you show up.
            </p>
          </div>
          <div className="mco-hero-cta">
            {!loggedIn && (
              <Link href="/register" className="con-btn-primary">Join free →</Link>
            )}
            {loggedIn && !isPro && (
              <Link href="/register?upgrade=patron" className="con-btn-primary">Upgrade to Moveee Pro →</Link>
            )}
            {loggedIn && isPro && (
              <Link href="/member" className="con-btn-primary">Member Dashboard →</Link>
            )}
          </div>
        </div>

        <nav className="mco-section-nav" aria-label="Connect sections">
          <Link href="/feed" className="mco-nav-link">Pulse Feed</Link>
          <Link href="/connect/people" className="mco-nav-link">People Near Me</Link>
          <span className="mco-nav-link mco-nav-link--active">Membership</span>
        </nav>
      </section>

      {/* ── TIERS ── */}
      <section className="mco-membership-full">
        <div className="mco-membership-inner">

          {/* Citizen */}
          <div className="mco-tier-card">
            <div className="mco-tier-eyebrow">Free</div>
            <h2 className="mco-tier-name">Moveee<br />Citizen</h2>
            <div className="mco-tier-price">Free forever</div>
            <ul className="mco-tier-perks">
              <li>Pulse feed &amp; community posts</li>
              <li>Member directory listing</li>
              <li>Online event access</li>
              <li>GetMeLit &amp; Culture Drop newsletters</li>
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
              <span className="mco-tier-status mco-tier-status--muted">Included in Moveee Pro</span>
            )}
          </div>

          {/* Moveee Pro */}
          <div className="mco-tier-card mco-tier-card--pro">
            <div className="mco-tier-eyebrow">Premium</div>
            <h2 className="mco-tier-name">Moveee<br /><em>Pro</em></h2>
            <div className="mco-tier-price">
              <PatronPrice variant="yearly" /> · <PatronPrice variant="monthly" /> — cancel anytime
            </div>
            <ul className="mco-tier-perks">
              <li>Everything in Citizen, plus:</li>
              <li>Exclusive patron-only articles &amp; editorials</li>
              <li>10% off in the Moveee Shop + early access to new drops</li>
              <li>Cash out your credits to your bank account</li>
              <li>100 culture credits per day (vs 50 for Citizen)</li>
              <li>5 game plays per day (vs 1 for Citizen)</li>
              <li>Poll &amp; itinerary post templates unlocked</li>
              <li>All events — online &amp; in-person</li>
              <li>Moveee Pro badge on your profile &amp; posts</li>
              <li>Early access to new features</li>
            </ul>
            <Link href="/connect/perks" className="mco-perks-link">See all shop perks →</Link>
            {!loggedIn && (
              <Link href="/register?tier=patron" className="mco-tier-btn mco-tier-btn--pro">
                Become a Moveee Pro →
              </Link>
            )}
            {loggedIn && !isPro && (
              <Link href="/register?upgrade=patron" className="mco-tier-btn mco-tier-btn--pro">
                Upgrade to Moveee Pro →
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
                  <th>Moveee Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Pulse feed & community posts",                   true,     true],
                  ["Member directory listing",                       true,     true],
                  ["All events (online & in-person)",               true,     true],
                  ["GetMeLit & Culture Drop newsletters",            true,     true],
                  ["Culture points & badges",                        true,     true],
                  ["Game plays per day",                             "1",      "5"],
                  ["Daily culture credit cap",                       "50",     "100"],
                  ["Cash out credits",                               false,    true],
                  ["Poll & itinerary post templates",                false,    true],
                  ["Patron-only articles & editorials",              false,    true],
                  ["10% Moveee Shop discount",                       false,    true],
                  ["Early access to new drops",                      false,    true],
                  ["Moveee Pro badge",                              false,    true],
                  ["Early access to new features",                   false,    true],
                ].map(([feature, citizen, pro]) => (
                  <tr key={feature as string}>
                    <td>{feature as string}</td>
                    <td>{typeof citizen === "string" ? <span className="mco-check">{citizen}</span> : citizen ? <span className="mco-check">✓</span> : <span className="mco-cross">—</span>}</td>
                    <td>{typeof pro === "string" ? <span className="mco-check mco-check--pro">{pro}</span> : pro ? <span className="mco-check mco-check--pro">✓</span> : <span className="mco-cross">—</span>}</td>
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
