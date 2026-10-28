import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PasskeyManager from "../PasskeyManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Security Settings | Moveee" },
};

export default async function SecuritySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings/security");

  const user = session.user as any;

  return (
    <>
      <div className="sett-section-card">
        <div className="sett-section-card-header">
          <div>
            <div className="sett-section-card-title">Password</div>
            <div className="sett-section-card-desc">Change your password via email reset</div>
          </div>
          <Link
            href={`/forgot-password?email=${encodeURIComponent(user.email as string)}`}
            className="sett-section-card-link"
          >
            CHANGE →
          </Link>
        </div>
      </div>
      <PasskeyManager />
    </>
  );
}
