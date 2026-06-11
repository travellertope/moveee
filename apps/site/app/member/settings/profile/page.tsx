import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileEditor from "../ProfileEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Profile Settings | The Moveee" },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/profile");

  const user = session.user as any;
  const displayName = user.displayName || user.name || user.username || "Member";

  // Fetch KYC/contact fields directly — not stored in JWT.
  let pii = { phone: "", whatsapp: "", gender: "", dateOfBirth: "", nationality: "", countryOfResidence: "" };
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/profile?user_id=${user.id}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      pii = {
        phone: data.phone ?? "",
        whatsapp: data.whatsapp ?? "",
        gender: data.gender ?? "",
        dateOfBirth: data.date_of_birth ?? "",
        nationality: data.nationality ?? "",
        countryOfResidence: data.country_of_residence ?? "",
      };
    }
  } catch {}

  return (
    <section className="mem-card">
      <div className="mem-card-label">Profile</div>
      <ProfileEditor user={{
        displayName,
        email: user.email as string,
        username: user.username ?? "",
        ...pii,
        city: user.city ?? "",
        occupation: user.occupation ?? "",
        avatarUrl: user.avatarUrl ?? "",
      }} />
    </section>
  );
}
