import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EarningsClient from "./EarningsClient";
import "../../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Creator Earnings | Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function fetchEarnings(userId: number) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/creator/earnings?user_id=${userId}&per_page=50`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export default async function EarningsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/earnings");

  const user        = session.user;
  const userId      = Number(user.id);
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial     = displayName.charAt(0).toUpperCase();
  const isPatron    = user.tier === "patron";

  const data = await fetchEarnings(userId);

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <div className="acct-profile">
          <div
            className="acct-avatar"
            style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
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

        <div className="acct-page-head">
          <p className="acct-page-eyebrow">Event Creator</p>
          <h2 className="acct-page-title">Creator Earnings</h2>
          <p className="acct-page-sub">Track revenue from your paid events and request payouts to your bank account.</p>
        </div>

        <EarningsClient
          balance={data?.balance ?? {}}
          history={data?.history?.items ?? []}
          total={data?.history?.total ?? 0}
          feeRate={data?.fee_rate ?? 0.20}
        />
      </div>
    </div>
  );
}
