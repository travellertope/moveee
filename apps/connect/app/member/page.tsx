import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MemberReferralCopy from "@/components/MemberReferralCopy";
import MemberDashboard from "@/components/MemberDashboard";
import MemberBadges from "@/components/MemberBadges";
import PasskeyBanner from "@/components/PasskeyBanner";
import MemberNavSelect from "@/components/MemberNavSelect";
import "../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Account | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

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
    <>
      {/* ── PROFILE HERO ── */}
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initial}
          </div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee &mdash; Culture Community</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
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

      {!user.hasPasskey && <PasskeyBanner creditsEscrowed={user.creditsEscrowed ?? 0} />}
      {/* ── STATS (live data) ── */}
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

      <div className="mem-body">
        <div className="mem-grid">
          {/* ── MAIN COLUMN ── */}
          <div className="mem-col-main">

            {/* Badges (live data) */}
            <MemberBadges initialBadges={liveBadges} />

            {/* How to earn */}
            <section className="mem-card">
              <div className="mem-card-label">How to Earn</div>
              <p style={{ fontSize: "0.78rem", color: "var(--mute)", margin: "0 0 12px", lineHeight: 1.5 }}>
                Credits are spendable (capped at 50/day). Points are permanent and unlock status.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 12px", fontSize: "0.75rem", fontWeight: 700, color: "var(--mute)", marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid var(--rule)" }}>
                <span>Action</span><span>Credits</span><span>Points</span>
              </div>
              <div className="mem-points-list">
                {[
                  ["Post validated (5 reactions or 3 comments)", "+10 cr", "+5"],
                  ["Hidden Gem or Food Review validated",         "+15 cr", "+10"],
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
                  <div key={action} className="mem-points-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 12px" }}>
                    <span>{action}</span>
                    <span className="mem-points-val" style={{ color: "var(--ochre)" }}>{cr}</span>
                    <span className="mem-points-val">{rep}</span>
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
                  Upgrade to Moveee Pro
                </div>
                <h3 className="mem-upgrade-title">
                  Unlock the full experience.
                </h3>
                <ul className="mem-upgrade-perks">
                  <li>Moveee Pro badge on your Pulse posts</li>
                  <li>Exclusive gated content &amp; editorials</li>
                  <li>10% Moveee Shop discount</li>
                  <li>Early access to new features</li>
                </ul>
                <Link href="/connect/membership" className="mem-upgrade-btn">
                  Become a Moveee Pro →
                </Link>
              </section>
            )}

            {/* Referral */}
            {referralUrl && (
              <section className="mem-card">
                <div className="mem-card-label">Invite a Friend</div>
                <p className="mem-card-desc">
                  Share your link. Earn +30 reputation and +5 credits for every member who joins.
                </p>
                <MemberReferralCopy url={referralUrl} />
                <div className="mem-referral-count">
                  {user.referralCount ?? 0} successful referral
                  {(user.referralCount ?? 0) !== 1 ? "s" : ""}
                  {" — "}
                  <Link href="/member/referrals" style={{ color: "var(--ochre)", textDecoration: "none" }}>
                    View details →
                  </Link>
                </div>
              </section>
            )}

            {/* Quick links */}
            <MemberNavSelect items={[
              { label: "My Wallet",        href: "/member/wallet" },
              { label: "My Coupons",       href: "/member/coupons" },
              { label: "Notifications",    href: "/member/notifications" },
              { label: "My Analytics",     href: "/member/analytics" },
              ...(isPatron ? [{ label: "My Events", href: "/member/events" }] : []),
              myCluster
                ? { label: "My Stoop", href: `/cluster/${myCluster.id}` }
                : { label: "Find your Stoop", href: "/connect/people" },
              { label: "Refer a Friend",   href: "/member/referrals" },
              { label: "Browse Perks",     href: "/connect/perks" },
              { label: "My Collection",    href: "/member/collection" },
              { label: "Account Settings", href: "/member/settings" },
              { label: "Newsletters",      href: "https://themoveee.com/newsletter" },
              { label: "Upcoming Events",  href: "/events" },
              { label: "Magazine",         href: "https://themoveee.com/magazine" },
              { label: "Discover",         href: "/discover" },
              { label: "Quotes Archive",   href: "/quotes" },
              { label: "Sign out",         href: "/api/auth/signout", muted: true },
            ]} />
          </div>
        </div>
      </div>
    </>
  );
}
