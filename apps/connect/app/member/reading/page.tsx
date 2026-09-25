import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReadingTrackerClient from "./ReadingTrackerClient";
import AccountNav from "@/components/AccountNav";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Reading Tracker | The Moveee" },
};

export default async function ReadingTrackerPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/reading");

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
          <h2 className="acct-page-title">Reading Tracker</h2>
          <p className="acct-page-sub">Keep a private shelf of what you want to read, what you&apos;re reading, and what you&apos;ve finished.</p>
        </div>

        <ReadingTrackerClient />
      </div>
    </div>
  );
}
