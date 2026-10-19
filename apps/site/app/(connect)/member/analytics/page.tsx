import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsTabsClient from "./AnalyticsTabsClient";
import ProBadge from "@/components/ProBadge";
import "../../../connect-member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Analytics & Referrals | Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function fetchReferrals(userId: number) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/user/referrals?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/analytics");

  const user = session.user as any;
  const userId = Number(user.id);
  const isPatron = user.tier === "patron";
  const isLit = user.tier === "lit";
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();

  const tierLabel = isPatron ? "Moveee Pro" : isLit ? "Moveee Lit" : "Moveee Citizen";

  const referralsData = await fetchReferrals(userId);

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <div className="acct-profile">
          <div className="acct-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initial}
          </div>
          <div className="acct-profile-body">
            <h1 className="acct-name">
              {displayName}
              {isPatron && <ProBadge size={16} />}
            </h1>
            <div className="acct-meta">
              <span className={`acct-tier-pill ${isPatron ? "acct-tier-pill--patron" : "acct-tier-pill--citizen"}`}>
                {tierLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="acct-page-head">
          <p className="acct-page-eyebrow">Member Dashboard</p>
          <h2 className="acct-page-title">Analytics &amp; Referrals</h2>
          <p className="acct-page-sub">Track your activity and invite friends to earn credits.</p>
        </div>

        <AnalyticsTabsClient
          userId={String(user.id)}
          isPatron={isPatron}
          referralsData={referralsData}
        />
      </div>
    </div>
  );
}
