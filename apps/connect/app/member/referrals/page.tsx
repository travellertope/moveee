import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReferralsClient from "./ReferralsClient";
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

  const userId = Number(session.user.id);
  const data = await fetchReferrals(userId);

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-hero-body">
            <div className="mem-eyebrow">
              <Link href="/member" style={{ color: "inherit", textDecoration: "none" }}>
                Dashboard
              </Link>{" "}&rsaquo;{" "}Refer a Friend
            </div>
            <h1 className="mem-name">Refer a Friend</h1>
            <div className="mem-meta">
              Earn credits &amp; points every time someone you invite joins Moveee.
            </div>
          </div>
        </div>
      </div>
      <div className="mem-body">
        <ReferralsClient initialData={data} />
      </div>
    </>
  );
}
