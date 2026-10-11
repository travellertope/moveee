import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import DashboardSidebar from "./DashboardSidebar";
import ProBadge from "@/components/ProBadge";
import "@/app/pulse-layout.css";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Dashboard | Moveee" },
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/analytics");

  const user = session.user as any;
  const isPatron = user.tier === "patron";
  const isLit = user.tier === "lit";
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const city = user.city ?? "";
  const username = user.username ?? "";

  const tierLabel = isPatron ? "Moveee Pro" : isLit ? "Moveee Lit" : "Moveee Citizen";
  const profileUrl = `https://web.themoveee.com/connect/${username}`;

  return (
    <div style={{ background: "var(--feed-bg, #f8fafc)", minHeight: "100vh" }}>
      <div className="pulse-layout pulse-layout--feed">

        {/* Main content */}
        <main className="pulse-timeline">
          <div className="pulse-timeline-inner" style={{ padding: "20px 0 60px" }}>

            {/* User header card */}
            <div className="dash-user-card">
              <div className="dash-user-avatar-wrap">
                <div className={`dash-user-avatar${isPatron ? " dash-user-avatar--patron" : ""}`}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} />
                  ) : initial}
                </div>
              </div>
              <div className="dash-user-info">
                <h1 className="dash-user-name">
                  {displayName}
                  {isPatron && <ProBadge size={18} />}
                </h1>
                <div className="dash-user-meta">
                  <span className={`dash-tier-pill${isPatron ? " dash-tier-pill--patron" : isLit ? " dash-tier-pill--lit" : ""}`}>
                    {tierLabel}
                  </span>
                  {city && (
                    <span className="dash-user-city">
                      <span aria-hidden="true">📍</span> {city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics data — stat cards, charts, top posts */}
            <AnalyticsClient userId={user.id} isPatron={isPatron} />

          </div>
        </main>

        {/* Right sidebar */}
        <aside className="pulse-sidebar-right" style={{ paddingTop: "20px" }}>
          <DashboardSidebar profileUrl={profileUrl} />
        </aside>

      </div>
    </div>
  );
}
