import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import InterestEditor from "@/components/InterestEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Interests | Moveee" },
};

export default async function InterestsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/interests");

  const user = session.user as any;

  return (
    <div>
      <div className="sett-section-label">Your Interests</div>
      <p style={{ fontSize: "0.82rem", color: "var(--mute)", margin: "0 0 20px", lineHeight: 1.5 }}>
        Your interests shape your personalised feed. Select at least 3.
      </p>
      <InterestEditor initialInterests={user.interests ?? []} />
    </div>
  );
}
