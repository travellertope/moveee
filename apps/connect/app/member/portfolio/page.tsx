import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PortfolioManager from "./PortfolioManager";
import AccountNav from "@/components/AccountNav";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Portfolio | The Moveee" },
};

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/portfolio");

  const user = session.user as any;
  const displayName = user.displayName || user.name || "Member";
  const username = user.username ?? "";
  const isPatron = user.tier === "patron";
  const reputation = user.reputation ?? 0;
  const initial = displayName.charAt(0).toUpperCase();

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
            <h1 className="acct-name">Creative Portfolio</h1>
            <div className="acct-meta">
              <span className={`acct-tier-pill ${isPatron ? "acct-tier-pill--patron" : "acct-tier-pill--citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
              </span>
              {username && (
                <Link href={`/connect/${username}`} className="acct-meta-link">
                  View public profile →
                </Link>
              )}
            </div>
          </div>
        </div>

        <AccountNav isPatron={isPatron} />

        <PortfolioManager reputation={reputation} username={username} />
      </div>
    </div>
  );
}
