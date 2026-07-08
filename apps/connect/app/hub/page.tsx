import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HubDiscoverClient from "./HubDiscoverClient";
import "../member.css";

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
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-hero-body">
            <div className="mem-eyebrow">
              <Link href="/feed" style={{ color: "inherit", textDecoration: "none" }}>Pulse Feed</Link>
              {" "}&rsaquo;{" "}Hubs
            </div>
            <h1 className="mem-name">Hubs</h1>
            <div className="mem-meta">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(243,236,224,.6)" }}>
                Topic communities, built by Moveee members.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/feed" className="mem-settings-back-link">← Back to Pulse Feed</Link>
          {loggedIn ? (
            <Link href="/hub/create" className="con-btn-primary">Start a Hub →</Link>
          ) : (
            <Link href="/login?callbackUrl=/hub/create" className="con-btn-primary">Start a Hub →</Link>
          )}
        </div>

        <HubDiscoverClient
          initialHubs={initialHubs}
          myJoined={myHubs.joined}
          myFollowed={myHubs.followed}
          loggedIn={loggedIn}
        />
      </div>
    </>
  );
}
