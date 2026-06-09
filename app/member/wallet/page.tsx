import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import WalletClient from "./WalletClient";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Wallet | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function fetchBalance(userId: number) {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/wallet/balance?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchHistory(userId: number) {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/wallet/history?user_id=${userId}&per_page=50`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return { entries: [], total: 0 };
    return await res.json();
  } catch {
    return { entries: [], total: 0 };
  }
}

export default async function WalletPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/wallet");

  const user = session.user;
  const userId = Number(user.id);
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const isPatron = user.tier === "patron";

  const [balance, history] = await Promise.all([
    fetchBalance(userId),
    fetchHistory(userId),
  ]);

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
            <div className="mem-eyebrow">My Wallet</div>
            <h1 className="mem-name">{balance?.credits ?? 0} Credits</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Connect Pro" : "Connect Citizen"}
              </span>
              <span className="mem-sep">·</span>
              <span>≈ £{((balance?.credit_value_gbp ?? 0) / 100).toFixed(2)}</span>
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
            <WalletClient
              credits={balance?.credits ?? 0}
              creditsPerGbp={balance?.credits_per_gbp ?? 10}
              entries={history.entries ?? []}
            />
          </div>

          <div className="mem-col-side">
            <section className="mem-card mem-links-card">
              <Link href="/connect/perks" className="mem-link">Browse Perks →</Link>
              <Link href="/member/coupons" className="mem-link">My Coupons →</Link>
              <Link href="/member" className="mem-link">Dashboard →</Link>
              <Link href="/member/settings" className="mem-link">Settings →</Link>
            </section>

            <section className="mem-card">
              <div className="mem-card-label">How Credits Work</div>
              <div style={{ fontSize: "0.78rem", color: "var(--mute)", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 8px" }}>Earn credits by posting, reviewing, and engaging with the community. Up to 50 credits per day.</p>
                <p style={{ margin: "0 0 8px" }}><strong>Route A:</strong> Redeem at partner venues — 0% fee.</p>
                <p style={{ margin: 0 }}><strong>Route B:</strong> Cash out to your bank — flat 30% fee.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
