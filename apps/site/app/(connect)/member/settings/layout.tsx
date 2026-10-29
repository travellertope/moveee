import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsTabs from "./SettingsTabs";
import RightSidebar from "../../RightSidebar";
import "../../../connect-member.css";

export const metadata = {
  title: { absolute: "Settings | Moveee" },
};

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings");

  return (
    <div className="sett-page">
      <div className="sett-wrap">
        <div className="sett-shell">
          <SettingsTabs />
          <div className="sett-body">
            {children}
          </div>
        </div>
        <Suspense fallback={null}>
          <RightSidebar />
        </Suspense>
      </div>
    </div>
  );
}
