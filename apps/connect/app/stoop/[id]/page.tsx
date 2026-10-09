import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import StoopPageContent from "./StoopPageContent";
import StoopsNearYouWidget from "@/components/pulse/StoopsNearYouWidget";
import "../../stoop.css";
import "../../pulse-layout.css";

export const dynamic = "force-dynamic";

export default async function StoopPage({ params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any;
  const { id } = await params;

  if (!session?.user) {
    redirect(`/auth/sign-in?next=/stoop/${id}`);
  }

  const clusterId = Number(id);
  if (!clusterId || isNaN(clusterId)) {
    redirect("/stoop");
  }

  return (
    <div style={{ background: "var(--feed-bg, #f8fafc)" }}>
      <div className="pulse-layout pulse-layout--feed">

        {/* Center — Stoop Detail */}
        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">
            <StoopPageContent clusterId={clusterId} />
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="pulse-sidebar-right">
          <StoopsNearYouWidget />
          <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--rule, #e8e2d8)" }}>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--mute)", lineHeight: 1.7 }}>
              © {new Date().getFullYear()} The Moveee. All Rights Reserved.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
