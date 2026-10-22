import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortfolioManager from "./PortfolioManager";
import "../../../connect-member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Portfolio | Moveee" },
};

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/portfolio");

  const user = session.user as any;
  const username = user.username ?? "";
  const isPatron = user.tier === "patron";
  const reputation = user.reputation ?? 0;

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <PortfolioManager reputation={reputation} username={username} />
      </div>
    </div>
  );
}
