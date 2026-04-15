import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import "../sections.css";

export const metadata = {
  title: "Join the Community",
  description: "Become a member of The Moveee — a culture community for the curious.",
};

export default async function ConnectPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      {/* ── HERO ── */}
      <div className="con-hero">
        <div className="con-hero-inner">
          <div>
            <div className="con-num">N°06 · Community</div>
            <h1 className="con-headline">
              Culture lives<br />where <em>people</em> gather.
            </h1>
            <p className="con-lede">
              The Moveee is a community for people who take culture seriously —
              events, newsletters, conversations, and the people who make it all happen.
            </p>
            <div className="con-cta-row">
              {session ? (
                <Link href="/member" className="con-btn-primary">Go to Member Dashboard →</Link>
              ) : (
                <>
                  <Link href="/register" className="con-btn-primary">Join Now →</Link>
                  <Link href="/login" className="con-btn-ghost">Already a member? Sign in</Link>
                </>
              )}
            </div>
            {session ? (
              <p className="con-price">Welcome back, {session.user?.name}</p>
            ) : (
              <p className="con-price">Citizen — Free · Patron — $80 / year</p>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              ["500+", "Active members"],
              ["12", "Chapters worldwide"],
              ["200+", "Events hosted"],
              ["Weekly", "Cultural Digest"],
            ].map(([stat, label]) => (
              <div key={label} style={{ borderLeft: "2px solid rgba(243,236,224,.12)", paddingLeft: 20 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 300, color: "var(--paper)", lineHeight: 1 }}>{stat}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(243,236,224,.4)", marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TIERS ── */}
      <div className="con-tiers">
        <div className="con-tier-card">
          <div className="con-tier-label">Free</div>
          <h2 className="con-tier-name">Citizen</h2>
          <div className="con-tier-price">Free forever</div>
          <ul className="con-tier-perks">
            <li>One primary chapter</li>
            <li>Access to online events</li>
            <li>The Cultural Digest newsletter</li>
            <li>Community forum access</li>
            <li>Culture points &amp; badges</li>
          </ul>
          {!session && (
            <Link href="/register?tier=citizen" className="con-tier-btn">Become a Citizen →</Link>
          )}
          {session && (session.user as any).tier === "citizen" && (
            <span className="con-tier-status">Active Membership</span>
          )}
          {session && (session.user as any).tier === "patron" && (
            <span className="con-tier-status con-tier-status--prev">Basic Membership</span>
          )}
        </div>

        <div className="con-tier-card con-tier-card--patron">
          <div className="con-tier-label">Premium</div>
          <h2 className="con-tier-name">Patron</h2>
          <div className="con-tier-price">$80 / year · Cancel anytime</div>
          <ul className="con-tier-perks">
            <li>Everything in Citizen</li>
            <li>Physical events in your chapter</li>
            <li>Secondary chapter membership</li>
            <li>Priority RSVP for all events</li>
            <li>Exclusive Patron-only content</li>
            <li>Direct access to community leaders</li>
          </ul>
          {!session && (
            <Link href="/register?tier=patron" className="con-tier-btn">Become a Patron →</Link>
          )}
          {session && (session.user as any).tier === "citizen" && (
            <Link href="/register?upgrade=patron" className="con-tier-btn">Upgrade to Patron →</Link>
          )}
          {session && (session.user as any).tier === "patron" && (
            <span className="con-tier-status">Active Membership</span>
          )}
        </div>
      </div>
    </>
  );
}
