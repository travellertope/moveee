import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsTabs from "./SettingsTabs";
import "../../../connect-member.css";

export const metadata = {
  title: { absolute: "Settings | Moveee" },
};

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings");

  const user = session.user as any;

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <SettingsTabs />

        <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
