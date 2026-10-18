import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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
      <div className="pulse-layout">

        {/* Left sidebar — stoop navigation */}
        <aside className="pulse-sidebar-left">
          <Link
            href="/stoop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--mute)",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              paddingBottom: "1rem",
              borderBottom: "1px solid var(--rule, #e8e2d8)",
              marginBottom: "1rem",
            }}
          >
            ← All Stoops
          </Link>
          <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--mute)", marginBottom: 8 }}>
            Browse
          </p>
          <Link href="/stoop/discover" style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: "var(--radius-lg, 6px)", fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-soft)" }}>
            <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>✦</span> Discover
          </Link>
          <Link href="/stoop" style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: "var(--radius-lg, 6px)", fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-soft)" }}>
            <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>📌</span> My Stoops
          </Link>
        </aside>

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
