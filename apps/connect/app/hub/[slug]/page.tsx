import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import HubActions from "./HubActions";
import HubManage from "./HubManage";
import HubFeed from "./HubFeed";
import "../../member.css";

export const dynamic = "force-dynamic";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

interface Hub {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  creatorId: number;
  status: string;
  allowedTemplates: string[];
  memberCount: number;
  postCount: number;
}

interface HubStatus {
  isMember: boolean;
  role: string | null;
  isFollowing: boolean;
}

async function fetchHub(slug: string): Promise<Hub | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/hub/slug/${slug}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchStatus(hubId: number, userId: number): Promise<HubStatus> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/hub/${hubId}/status?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return { isMember: false, role: null, isFollowing: false };
    return await res.json();
  } catch {
    return { isMember: false, role: null, isFollowing: false };
  }
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = (await getServerSession(authOptions as any)) as any;
  const loggedIn = !!session?.user;

  const hub = await fetchHub(slug);
  if (!hub) {
    return (
      <div className="mem-body">
        <section className="mem-card">
          <div className="mem-card-label">Not found</div>
          <p className="mem-card-desc">This Hub doesn't exist or has been removed.</p>
          <Link href="/hub" className="mem-settings-back-link">← Back to Hubs</Link>
        </section>
      </div>
    );
  }

  const status = loggedIn
    ? await fetchStatus(hub.id, Number(session.user.id))
    : { isMember: false, role: null, isFollowing: false };

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-hero-body">
            <div className="mem-eyebrow">
              <Link href="/hub" style={{ color: "inherit", textDecoration: "none" }}>Hubs</Link>
              {" "}&rsaquo;{" "}{hub.name}
            </div>
            <h1 className="mem-name">{hub.name}</h1>
            <div className="mem-meta">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(243,236,224,.6)" }}>
                {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/hub" className="mem-settings-back-link">← Back to Hubs</Link>
        </div>

        {hub.status === "archived" && (
          <section className="mem-card" style={{ background: "var(--paper-warm, #f7f5f2)" }}>
            <p className="mem-card-desc" style={{ margin: 0, fontWeight: 600 }}>
              This Hub is archived — read-only, no new posts or members.
            </p>
          </section>
        )}

        {hub.coverImageUrl && (
          <img
            src={hub.coverImageUrl}
            alt=""
            style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: "var(--radius-xl, 12px)" }}
          />
        )}

        <section className="mem-card">
          <div className="mem-card-label">About</div>
          <p className="mem-card-desc" style={{ margin: 0 }}>{hub.description}</p>
        </section>

        <section className="mem-card">
          <HubActions
            hubId={hub.id}
            loggedIn={loggedIn}
            initialIsMember={status.isMember}
            initialIsFollowing={status.isFollowing}
            isOwner={status.role === "owner"}
          />
        </section>

        {status.role === "owner" && (
          <section className="mem-card">
            <HubManage
              hubId={hub.id}
              initialName={hub.name}
              initialDescription={hub.description}
              initialAllowedTemplates={hub.allowedTemplates}
              initialCoverImageUrl={hub.coverImageUrl}
              isArchived={hub.status === "archived"}
            />
          </section>
        )}

        <section className="mem-card">
          <div className="mem-card-label">Posts</div>
          <HubFeed hubId={hub.id} isMember={status.isMember} allowedTemplates={hub.allowedTemplates} />
        </section>
      </div>
    </>
  );
}
