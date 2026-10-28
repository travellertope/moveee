import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsletterPreferences from "../NewsletterPreferences";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Newsletter Preferences | Moveee" },
};

export default async function NewslettersSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/newsletters");

  const user = session.user as any;

  return (
    <div>
      <div className="sett-section-label">Newsletter Subscriptions</div>
      <NewsletterPreferences email={user.email as string} />
    </div>
  );
}
