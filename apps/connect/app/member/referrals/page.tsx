import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReferralsClient from "./ReferralsClient";
import AccountNav from "@/components/AccountNav";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Refer a Friend | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function fetchReferrals(userId: number) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/user/referrals?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ReferralsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/referrals");

  const user = session.user as any;
  const userId = Number(user.id);
  const isPatron = user.tier === "patron";
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const data = await fetchReferrals(userId);

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
            <h1 className="acct-name">Refer a Friend</h1>
            <div className="acct-meta">
              <span className="acct-meta-text">Earn credits &amp; points every time someone you invite joins Moveee.</span>
            </div>
          </div>
        </div>

        <AccountNav isPatron={isPatron} />

        <ReferralsClient initialData={data} />
      </div>
    </div>
  );
}
