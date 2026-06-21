import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PortfolioManager from "./PortfolioManager";
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
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initial}
          </div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee — Creative Portfolio</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
              </span>
              {username && (
                <>
                  <span className="mem-sep">·</span>
                  <Link href={`/connect/${username}`} style={{ color: "var(--ochre)", fontSize: "0.78rem" }}>
                    View public profile →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member/settings" className="mem-settings-back-link">← Back to Settings</Link>
        </div>
        <div style={{ maxWidth: "720px" }}>
          <PortfolioManager reputation={reputation} username={username} />
        </div>
      </div>
    </>
  );
}
