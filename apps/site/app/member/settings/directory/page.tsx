import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DirectoryProfile from "../DirectoryProfile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Directory Settings | The Moveee" },
};

export default async function DirectorySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/directory");

  const user = session.user as any;
  const displayName = user.displayName || user.name || user.username || "Member";

  return (
    <section className="mem-card">
      <div className="mem-card-label">Moveee Connect Directory</div>
      <DirectoryProfile
        displayName={displayName}
        occupation={user.occupation ?? ""}
        city={user.city ?? ""}
        country={user.countryOfResidence ?? ""}
      />
    </section>
  );
}
