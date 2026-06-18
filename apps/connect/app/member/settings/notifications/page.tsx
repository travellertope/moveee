import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationPreferences from "../NotificationPreferences";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Notification Preferences | The Moveee" },
};

export default async function NotificationsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/notifications");

  return (
    <section className="mem-card">
      <div className="mem-card-label">Notification Preferences</div>
      <NotificationPreferences />
    </section>
  );
}
