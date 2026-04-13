import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CollectionTabs from "./CollectionTabs";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Collection · The Moveee",
};

export default async function CollectionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/collection");

  const user = session.user as any;
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const isPatron = user.tier === "patron";

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar">{initial}</div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee &mdash; My Collection</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Patron" : "Citizen"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member" className="mem-settings-back-link">
            ← Back to Dashboard
          </Link>
        </div>

        <CollectionTabs />
      </div>
    </>
  );
}
