import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";
import AccountNav from "@/components/AccountNav";
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
    <div className="acct-page">
      <div className="acct-wrap">
        <div className="acct-profile">
          <div className="acct-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initial}
          </div>
          <div className="acct-profile-body">
            <h1 className="acct-name">Wallet</h1>
            <div className="acct-meta">
              <span className={`acct-tier-pill ${isPatron ? "acct-tier-pill--patron" : "acct-tier-pill--citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
              </span>
              <span className="acct-meta-text">≈ £{((balance?.credit_value_gbp ?? 0) / 100).toFixed(2)} available</span>
            </div>
          </div>
        </div>

        <AccountNav isPatron={isPatron} />

        <WalletClient
          credits={balance?.credits ?? 0}
          creditsPerGbp={balance?.credits_per_gbp ?? 10}
          entries={history.entries ?? []}
          isPro={isPatron}
        />
      </div>
    </div>
  );
}
