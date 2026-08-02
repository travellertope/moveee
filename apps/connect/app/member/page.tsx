import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MemberReferralCopy from "@/components/MemberReferralCopy";
import MemberDashboard from "@/components/MemberDashboard";
import MemberBadges from "@/components/MemberBadges";
import PasskeyBanner from "@/components/PasskeyBanner";
import AccountNav from "@/components/AccountNav";
import "../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Account | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

const EXPLORE_LINKS = [
  { label: "Newsletters", href: "https://themoveee.com/newsletter" },
  { label: "Upcoming Events", href: "/events" },
  { label: "Magazine", href: "https://themoveee.com/magazine" },
  { label: "Discover", href: "/discover" },
  { label: "Quotes Archive", href: "/quotes" },
];

async function fetchLiveStats(userId: string) {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/profile?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${secret}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchMyCluster(userId: string) {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/cluster/my-clusters?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const clusters: Array<{ id: number; status: string }> = data?.clusters ?? [];
    return clusters.find((c) => c.status !== "archived") ?? null;
  } catch { return null; }
}

export default async function MemberPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member");

  const user = session.user as any;
  const isPatron = user.tier === "patron";

  const live = await fetchLiveStats(String(user.id));
  const myCluster = await fetchMyCluster(String(user.id));
  const liveCredits             = live?.credits               ?? user.credits              ?? 0;
  const liveReputation          = live?.reputation            ?? user.reputation            ?? user.points ?? 0;
  const liveReputationTier      = live?.reputation_tier       ?? user.reputationTier        ?? "member";
  const liveDailyCreditsRemaining = live?.daily_credits_remaining ?? user.dailyCreditsRemaining ?? 50;
  const liveBadges: string[]    = Array.isArray(live?.badges) ? live.badges : (user.badges ?? []);
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const referralUrl = user.referralCode
    ? `https://web.themoveee.com/register?ref=${user.referralCode}`
    : null;

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        {/* ── Profile strip ── */}
        <div className="acct-profile">
          <div className="acct-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initial}
          </div>
          <div className="acct-profile-body">
            <h1 className="acct-name">{displayName}</h1>
            <div className="acct-meta">
              <span className={`acct-tier-pill ${isPatron ? "acct-tier-pill--patron" : "acct-tier-pill--citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
              </span>
              {user.city && <span className="acct-meta-text">{user.city}</span>}
            </div>
          </div>
        </div>

        {/* ── Account nav — carries across Wallet/Perks/Notifications/etc. ── */}
        <AccountNav isPatron={isPatron} />

        {!user.hasPasskey && <PasskeyBanner creditsEscrowed={user.creditsEscrowed ?? 0} />}

        {/* ── Stats ── */}
        <MemberDashboard
          initialPoints={liveReputation}
          initialBadges={liveBadges}
          referralCount={user.referralCount ?? 0}
          membership={isPatron ? "Moveee Pro" : "Moveee Citizen"}
          initialCredits={liveCredits}
          initialReputation={liveReputation}
          reputationTier={liveReputationTier}
          dailyCreditsRemaining={liveDailyCreditsRemaining}
        />

        <div className="acct-body">
          {/* ── MAIN COLUMN ── */}
          <div>
            <MemberBadges initialBadges={liveBadges} />

            <section className="acct-card">
              <div className="acct-card-header">
                <span className="acct-card-title">How to Earn</span>
              </div>
              <p className="acct-earn-intro">
                Credits are spendable (capped at 50/day). Points are permanent and unlock status.
              </p>
              <div className="acct-earn-list">
                {[
                  ["Post validated (5 reactions or 3 comments)", "+10 cr", "+5"],
                  ["Place or Food Review validated",              "+15 cr", "+10"],
                  ["Event RSVP",                                  "+1 cr",  "+5"],
                  ["Event check-in",                              "+2 cr",  "+15"],
                  ["Refer a member",                              "+3 cr",  "+25"],
                  ["Newsletter comment",                          "+1 cr",  "+10"],
                  ["Share a quote",              "+1 cr",  "+10"],
                  ["Quote liked by others",       "—",      "+1"],
                  ["Read a magazine article",     "+1 cr",  "+5"],
                  ["Share a magazine article",    "+1 cr",  "+5"],
                  ["Directory entry submitted",   "+2 cr",  "+15"],
                  ["Game completed",              "+1 cr",  "+5"],
                ].map(([action, cr, rep]) => (
                  <div key={action} className="acct-earn-row">
                    <span>{action}</span>
                    <span className="acct-earn-cr">{cr}</span>
                    <span className="acct-earn-pt">{rep}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── SIDE COLUMN ── */}
          <div>
            {/* Upgrade CTA — Citizens only */}
            {!isPatron && (
              <section className="acct-card acct-card--upgrade">
                <span className="acct-card-title">Upgrade to Moveee Pro</span>
                <h3 className="acct-upgrade-title">Unlock the full experience.</h3>
                <ul className="acct-upgrade-perks">
                  <li>Moveee Pro badge on your Pulse posts</li>
                  <li>Exclusive gated content &amp; editorials</li>
                  <li>10% Moveee Shop discount</li>
                  <li>Early access to new features</li>
                </ul>
                <Link href="/connect/membership" className="acct-upgrade-btn">
                  Become a Moveee Pro →
                </Link>
              </section>
            )}

            {/* Stoop */}
            <section className="acct-card">
              <span className="acct-card-title">Stoop</span>
              <p className="acct-card-desc">
                {myCluster
                  ? "You're part of a local Stoop — meet up, check in, earn rewards."
                  : "Join a local Stoop to meet other members near you."}
              </p>
              <Link
                href={myCluster ? `/cluster/${myCluster.id}` : "/connect/people"}
                className="acct-card-link"
              >
                {myCluster ? "View my Stoop →" : "Find your Stoop →"}
              </Link>
            </section>

            {/* Referral */}
            {referralUrl && (
              <section className="acct-card">
                <span className="acct-card-title">Invite a Friend</span>
                <p className="acct-card-desc">
                  Share your link. Earn +30 reputation and +5 credits for every member who joins.
                </p>
                <MemberReferralCopy url={referralUrl} />
                <div className="acct-referral-count">
                  {user.referralCount ?? 0} successful referral
                  {(user.referralCount ?? 0) !== 1 ? "s" : ""}
                  {" — "}
                  <Link href="/member/referrals" className="acct-card-link acct-card-link--inline">
                    View details →
                  </Link>
                </div>
              </section>
            )}

            {/* Explore — general site links, not account nav */}
            <section className="acct-card">
              <span className="acct-card-title">Explore Moveee</span>
              <div className="acct-explore-list">
                {EXPLORE_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="acct-explore-link">
                    <span>{link.label}</span>
                    <span className="acct-explore-arrow">→</span>
                  </Link>
                ))}
                <Link href="/api/auth/signout" className="acct-explore-link acct-explore-link--muted">
                  <span>Sign out</span>
                  <span />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
