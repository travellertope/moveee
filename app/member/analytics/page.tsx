import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AnalyticsClient from "./AnalyticsClient";
import "../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Analytics | The Moveee" },
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/analytics");

  const user = session.user as any;

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-hero-body">
            <div className="mem-eyebrow">
              <Link href="/member" style={{ color: "inherit", textDecoration: "none" }}>Dashboard</Link>
              {" "}&rsaquo;{" "}Analytics
            </div>
            <h1 className="mem-name">My Analytics</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${user.tier === "patron" ? "patron" : "citizen"}`}>
                {user.tier === "patron" ? "Connect Pro" : "Connect Citizen"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <AnalyticsClient userId={user.id} />
      </div>
    </>
  );
}
