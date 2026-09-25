import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReadingStatsClient from "./ReadingStatsClient";
import AccountNav from "@/components/AccountNav";
import "../../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Your Year in Books | The Moveee" },
};

// Reading Tracker stats dashboard — Phase 4, see
// docs/reading-tracker-plan.md §2/§4. Not registered in AccountNav (it's a
// sub-page of Reading Tracker, same "linked from the parent page, not a
// top-level account destination" relationship Analytics quick-links have to
// the Member Dashboard) — reached via the "Your Year in Books →" link on
// /member/reading itself.
export default async function ReadingStatsPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/reading/stats");

  const user = session.user;
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const isPatron = user.tier === "patron";

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
            <h1 className="acct-name">{displayName}</h1>
            <div className="acct-meta">
              <span className={`acct-tier-pill ${isPatron ? "acct-tier-pill--patron" : "acct-tier-pill--citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
              </span>
            </div>
          </div>
        </div>

        <AccountNav isPatron={isPatron} />

        <div className="acct-page-head">
          <p className="acct-page-eyebrow">Books</p>
          <h2 className="acct-page-title">Your Year in Books</h2>
          <p className="acct-page-sub">
            <Link href="/member/reading" className="rt-stats-back">← Back to Reading Tracker</Link>
          </p>
        </div>

        <ReadingStatsClient />
      </div>
    </div>
  );
}
