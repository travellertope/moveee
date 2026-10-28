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
      <div>
        <div className="sett-section-label">Password</div>
        <div className="mem-field-list" style={{ marginTop: 12 }}>
          <div className="mem-field mem-field--action">
            <div>
              <div className="mem-field-label">Change password</div>
              <div className="mem-field-value mem-field-value--muted">
                Change your password via email reset
              </div>
            </div>
            <Link
              href={`/forgot-password?email=${encodeURIComponent(user.email as string)}`}
              className="mem-field-btn"
            >
              Change →
            </Link>
          </div>
        </div>
      </div>
      <hr className="sett-divider" />
      <PasskeyManager />
    </>
  );
}
