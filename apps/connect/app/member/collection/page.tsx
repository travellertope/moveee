import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CollectionTabs from "./CollectionTabs";
import FeedRightSidebar from "@/components/pulse/FeedRightSidebar";
import "@/app/pulse-layout.css";
import "@/app/member.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "My Collection | Moveee" },
};

export default async function CollectionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/collection");

  return (
    <div style={{ background: "var(--feed-bg, #f8fafc)" }}>
      <div className="pulse-layout pulse-layout--feed">
        <main className="pulse-timeline">
          <div className="pulse-timeline-inner" style={{ padding: "20px 20px 40px" }}>
            <CollectionTabs />
          </div>
        </main>
        <aside className="pulse-sidebar-right">
          <FeedRightSidebar />
        </aside>
      </div>
    </div>
  );
}
