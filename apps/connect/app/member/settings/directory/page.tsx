import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DirectoryProfile from "../DirectoryProfile";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Directory Settings | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export default async function DirectorySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/directory");

  const user = session.user as any;
  const displayName = user.displayName || user.name || user.username || "Member";

  // countryOfResidence is not stored in JWT — fetch on-demand.
  let countryOfResidence = "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/profile?user_id=${user.id}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      countryOfResidence = data.country_of_residence ?? "";
    }
  } catch {}

  return (
    <section className="mem-card">
      <div className="mem-card-label">Moveee Connect Directory</div>
      <DirectoryProfile
        displayName={displayName}
        occupation={user.occupation ?? ""}
        city={user.city ?? ""}
        country={countryOfResidence}
      />
    </section>
  );
}
