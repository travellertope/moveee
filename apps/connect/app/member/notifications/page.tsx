import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";
import AccountNav from "@/components/AccountNav";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Notifications | Moveee" },
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
  const isPatron = user.tier === "patron";
  const notifications = await fetchNotifications(Number(user.id));

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <AccountNav isPatron={isPatron} />
        <NotificationsClient initialItems={notifications} />
      </div>
    </div>
  );
}
