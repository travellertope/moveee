import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CouponsClient from "./CouponsClient";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Coupons | The Moveee" },
};

export default async function CouponsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/coupons");

  const user = session.user;
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const isPatron = user.tier === "patron";

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
            <div className="mem-eyebrow">My Coupons</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Connect Pro" : "Connect Citizen"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member" className="mem-settings-back-link">← Back to Dashboard</Link>
        </div>

        <div className="mem-settings-grid">
          <div className="mem-col-main">
            <CouponsClient />
          </div>
          <div className="mem-col-side">
            <section className="mem-card mem-links-card">
              <Link href="/connect/perks" className="mem-link">Browse Perks →</Link>
              <Link href="/member/wallet" className="mem-link">My Wallet →</Link>
              <Link href="/member" className="mem-link">Dashboard →</Link>
              <Link href="/member/settings" className="mem-link">Settings →</Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
