import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileEditor from "../ProfileEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Profile Settings | The Moveee" },
};

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/profile");

  const user = session.user as any;
  const displayName = user.displayName || user.name || user.username || "Member";

  return (
    <section className="mem-card">
      <div className="mem-card-label">Profile</div>
      <ProfileEditor user={{
        displayName,
        email: user.email as string,
        username: user.username ?? "",
        phone: user.phone ?? "",
        whatsapp: user.whatsapp ?? "",
        gender: user.gender ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
        nationality: user.nationality ?? "",
        countryOfResidence: user.countryOfResidence ?? "",
        city: user.city ?? "",
        occupation: user.occupation ?? "",
        avatarUrl: user.avatarUrl ?? "",
      }} />
    </section>
  );
}
