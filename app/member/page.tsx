import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MemberReferralCopy from "@/components/MemberReferralCopy";
import MemberDashboard from "@/components/MemberDashboard";
import MemberBadges from "@/components/MemberBadges";
import "../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Account | The Moveee" },
};

export default async function MemberPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member");

  const user = session.user as any;
  const isPatron = user.tier === "patron";
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const referralUrl = user.referralCode
    ? `https://themoveee.com/register?ref=${user.referralCode}`
    : null;

  return (
    <>
      {/* ── PROFILE HERO ── */}
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar">{initial}</div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee &mdash; Culture Community</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Connect Pro" : "Connect Citizen"}
              </span>
              {user.city && (
                <>
                  <span className="mem-sep">·</span>
                  <span>{user.city}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        {/* ── STATS (live data) ── */}
        <MemberDashboard
          initialPoints={user.points ?? 0}
          initialBadges={user.badges ?? []}
          referralCount={user.referralCount ?? 0}
          membership={isPatron ? "Connect Pro" : "Connect Citizen"}
        />

        <div className="mem-grid">
          {/* ── MAIN COLUMN ── */}
          <div className="mem-col-main">

            {/* Badges (live data) */}
            <MemberBadges initialBadges={user.badges ?? []} />

            {/* How to earn points */}
            <section className="mem-card">
              <div className="mem-card-label">How to Earn Points</div>
              <div className="mem-points-list">
                {[
                  ["Event RSVP", "+5 pts"],
                  ["Event check-in", "+15 pts"],
                  ["Refer a member", "+25 pts"],
                  ["Newsletter comment", "+10 pts"],
                  ["Newsletter reaction", "+2 pts"],
                  ["Share a quote", "+10 pts"],
                  ["Quote liked", "+1 pt"],
                  ["Read a magazine article", "+5 pts"],
                  ["Share a magazine article", "+5 pts"],
                  ["Directory submission", "+25 pts"],
                ].map(([action, pts]) => (
                  <div key={action} className="mem-points-row">
                    <span>{action}</span>
                    <span className="mem-points-val">{pts}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── SIDE COLUMN ── */}
          <div className="mem-col-side">

            {/* Upgrade CTA — Citizens only */}
            {!isPatron && (
              <section className="mem-card mem-card--dark">
                <div className="mem-card-label" style={{ color: "var(--ochre)" }}>
                  Upgrade to Connect Pro
                </div>
                <h3 className="mem-upgrade-title">
                  Unlock the full experience.
                </h3>
                <ul className="mem-upgrade-perks">
                  <li>Connect Pro badge on your Pulse posts</li>
                  <li>Exclusive gated content &amp; editorials</li>
                  <li>10% Moveee Shop discount</li>
                  <li>Early access to new features</li>
                </ul>
                <Link href="/connect/membership" className="mem-upgrade-btn">
                  Become a Connect Pro →
                </Link>
              </section>
            )}

            {/* Referral */}
            {referralUrl && (
              <section className="mem-card">
                <div className="mem-card-label">Invite a Friend</div>
                <p className="mem-card-desc">
                  Share your link. Earn 25 points for every member who joins.
                </p>
                <MemberReferralCopy url={referralUrl} />
                <div className="mem-referral-count">
                  {user.referralCount ?? 0} successful referral
                  {(user.referralCount ?? 0) !== 1 ? "s" : ""}
                </div>
              </section>
            )}

            {/* Quick links */}
            <section className="mem-card mem-links-card">
              <Link href="/member/collection" className="mem-link">
                My Collection →
              </Link>
              <Link href="/member/settings" className="mem-link">
                Account Settings →
              </Link>
              <Link href="/newsletter" className="mem-link">
                Newsletters →
              </Link>
              <Link href="/events" className="mem-link">
                Upcoming Events →
              </Link>
              <Link href="/magazine" className="mem-link">
                Magazine →
              </Link>
              <Link href="/directory" className="mem-link">
                Culture Directory →
              </Link>
              <Link href="/quotes" className="mem-link">
                Quotes Archive →
              </Link>
              <Link
                href="/api/auth/signout"
                className="mem-link mem-link--muted"
              >
                Sign out
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
