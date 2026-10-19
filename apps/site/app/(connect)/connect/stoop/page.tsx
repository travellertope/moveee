import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StoopBrowser from "@/components/connect/StoopBrowser";
import FeedRightSidebar from "@/components/pulse/FeedRightSidebar";
import Link from "next/link";
import "../../../connect-stoop.css";
import "@/app/pulse-layout.css";

export const metadata: Metadata = {
  title: "Stoop",
  description: "Small, weekly gatherings of Moveee members in your own area.",
};

export default async function StoopPage() {
  const session = await getServerSession(authOptions);
  const loggedIn = !!session;
  const viewerCity = (session?.user as any)?.city ?? "";
  const viewerCountry = (session?.user as any)?.countryOfResidence ?? "";

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <div className="pulse-layout pulse-layout--feed">
        <main className="pulse-timeline" style={{ background: "#fff" }}>
          <div className="stoop-wrap" style={{ maxWidth: "none", padding: "0 0 40px" }}>
            {loggedIn ? (
              <StoopBrowser viewerCity={viewerCity} viewerCountry={viewerCountry} />
            ) : (
              <div className="stoop-empty">
                <span className="stoop-empty-icon" aria-hidden="true">🚪</span>
                <h4>Log in to find or start a Stoop near you.</h4>
                <p>Stoop is open to every Moveee member — sign in to see who&apos;s meeting near you.</p>
                <Link href="/login?callbackUrl=/connect/stoop" className="stoop-start-btn">Log in →</Link>
              </div>
            )}
          </div>
        </main>

        <aside className="pulse-sidebar-right" style={{ background: "#fff" }}>
          <FeedRightSidebar />
        </aside>
      </div>
    </div>
  );
}
