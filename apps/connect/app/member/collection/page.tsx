import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CollectionTabs from "./CollectionTabs";
import AccountNav from "@/components/AccountNav";
import "../../member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Collection | Moveee" },
};

export default async function CollectionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/collection");

  const user = session.user as any;
  const isPatron = user.tier === "patron";

  return (
    <div className="acct-page">
      <div className="acct-wrap">
        <AccountNav isPatron={isPatron} />
        <CollectionTabs />
      </div>
    </div>
  );
}
