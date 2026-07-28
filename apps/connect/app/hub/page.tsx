import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HubDiscoverClient from "./HubDiscoverClient";
import "@/app/pulse-layout.css";

export const metadata = { title: "Hubs · Moveee" };
export const dynamic = "force-dynamic";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

interface Hub {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  coverImageCredit?: string;
  memberCount: number;
  postCount: number;
}

async function fetchDiscover(): Promise<Hub[]> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/hub/discover?sort=popular&per_page=20`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.hubs ?? [];
  } catch {
    return [];
  }
}

async function fetchMyHubs(userId: number): Promise<{ joined: Hub[]; followed: Hub[] }> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/hub/my-hubs?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return { joined: [], followed: [] };
    return await res.json();
  } catch {
    return { joined: [], followed: [] };
  }
}

export default async function HubBrowsePage() {
  const session = (await getServerSession(authOptions as any)) as any;
  const loggedIn = !!session?.user;

  const [initialHubs, myHubs] = await Promise.all([
    fetchDiscover(),
    loggedIn ? fetchMyHubs(Number(session.user.id)) : Promise.resolve({ joined: [], followed: [] }),
  ]);

  return (
    <div style={{ background: "#ffffff" }}>
      {/* Same 2-column track as /feed (.pulse-layout--feed: timeline +
          right rail) — Hubs are an extension of the feed, not their own
          distinct section with different chrome. */}
      <div className="pulse-layout pulse-layout--feed">

        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">
            <div style={{ padding: "0.85rem 1.25rem 0", display: "flex", alignItems: "center" }}>
              <Link href="/feed" style={{
                color: "#7a6f5c", fontSize: "0.75rem", textDecoration: "none",
                letterSpacing: "0.06em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
              }}>
                ← Feed
              </Link>
            </div>

            <div style={{ padding: "1rem 1.25rem 0.5rem" }}>
              <h1 style={{
                fontFamily: "var(--font-fraunces), serif", fontSize: "1.6rem", fontWeight: 700,
                color: "#14110d", margin: "0 0 0.3rem", lineHeight: 1.2,
              }}>
                Hubs
              </h1>
              <p style={{ color: "#7a6f5c", fontSize: "0.85rem", margin: 0 }}>
                Topic communities, built by Moveee members.
              </p>
            </div>

            <HubDiscoverClient
              initialHubs={initialHubs}
              myJoined={myHubs.joined}
              myFollowed={myHubs.followed}
              loggedIn={loggedIn}
            />
          </div>
        </main>

        {/* Right rail — same "About Moveee" + copyright pattern as every
            other page's right rail, plus the Start a Hub CTA. */}
        <aside className="pulse-sidebar-right">
          <div style={{ padding: "1.25rem 1rem" }}>
            <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "0.85rem", marginBottom: "1rem" }}>
              <p style={{
                color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
              }}>
                Start Something New
              </p>
              <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
                Got a niche the Sections don't cover? Start a Hub for it.
              </p>
              <Link
                href={loggedIn ? "/hub/create" : "/login?callbackUrl=/hub/create"}
                style={{
                  display: "block", background: "#c93c2a", color: "#fff",
                  textAlign: "center", padding: "0.45rem 0.75rem",
                  fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", textDecoration: "none",
                }}
              >
                Start a Hub →
              </Link>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "0.85rem" }}>
              <p style={{
                color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
              }}>
                About Moveee
              </p>
              <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
                Village square for culture loving creatives, entrepreneurs, professionals.
              </p>
              <Link href="/feed" style={{
                display: "block", background: "#14110d", color: "#fff",
                textAlign: "center", padding: "0.45rem 0.75rem",
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", textDecoration: "none",
              }}>
                Back to Feed →
              </Link>
            </div>

            {/* apps/connect has no site-wide footer — every page with a
                right rail carries this copyright block instead. */}
            <p style={{ margin: "1rem 0 0", fontSize: "0.68rem", color: "#7a6f5c", lineHeight: 1.7 }}>
              © {new Date().getFullYear()} The Moveee. All Rights Reserved.
              <br />
              <Link href="/terms" style={{ color: "#7a6f5c" }}>Terms</Link>
              {" · "}
              <Link href="/privacy" style={{ color: "#7a6f5c" }}>Privacy</Link>
              {" · "}
              <Link href="/contact" style={{ color: "#7a6f5c" }}>Contact</Link>
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
