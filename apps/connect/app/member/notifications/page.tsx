import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import NotificationsClient from "./NotificationsClient";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Notifications | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function fetchNotifications(userId: number) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/notifications?user_id=${userId}&limit=50`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) redirect("/login?callbackUrl=/member/notifications");

  const user = session.user;
  const notifications = await fetchNotifications(Number(user.id));

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (user.displayName || user.name || user.username || "M").charAt(0).toUpperCase()}
          </div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">My Account</div>
            <h1 className="mem-name">Notifications</h1>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member" className="mem-settings-back-link">← Back to Dashboard</Link>
        </div>
        <div className="mem-settings-grid">
          <div className="mem-col-main">
            <NotificationsClient initialItems={notifications} />
          </div>
          <div className="mem-col-side">
            <section className="mem-card mem-links-card">
              <Link href="/member"          className="mem-link">Dashboard →</Link>
              <Link href="/member/wallet"   className="mem-link">My Wallet →</Link>
              <Link href="/member/coupons"  className="mem-link">My Coupons →</Link>
              <Link href="/member/settings" className="mem-link">Settings →</Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
