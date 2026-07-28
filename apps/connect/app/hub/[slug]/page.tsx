import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import HubActions from "./HubActions";
import HubManage from "./HubManage";
import HubFeed from "./HubFeed";
import "@/app/pulse-layout.css";
// member.css is still needed for HubManage's form controls (hfc-*,
// mem-card-label, mem-settings-back-link) — this page's own chrome no
// longer uses mem-hero/mem-body (see the pulse-layout--feed switch below).
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
  isOfficial?: boolean;
}

interface HubStatus {
  isMember: boolean;
  role: string | null;
  isFollowing: boolean;
  notifyPosts: boolean;
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
    if (!res.ok) return { isMember: false, role: null, isFollowing: false, notifyPosts: false };
    return await res.json();
  } catch {
    return { isMember: false, role: null, isFollowing: false, notifyPosts: false };
  }
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = (await getServerSession(authOptions as any).catch(() => null)) as any;
  const loggedIn = !!session?.user;

  const hub = await fetchHub(slug);
  if (!hub) {
    return (
      <div style={{ background: "#ffffff" }}>
        <div className="pulse-layout pulse-layout--feed">
          <main className="pulse-timeline">
            <div className="pulse-timeline-inner" style={{ padding: "2rem 1.25rem" }}>
              <p style={{ fontSize: "0.95rem", color: "#3a342b", margin: "0 0 0.5rem" }}>
                This Hub doesn't exist or has been removed.
              </p>
              <Link href="/hub" style={{ color: "#c5491f", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
                ← Back to Hubs
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const status = loggedIn
    ? await fetchStatus(hub.id, Number(session.user.id))
    : { isMember: false, role: null, isFollowing: false, notifyPosts: false };
  const isModerator = status.role === "owner" || status.role === "mod";

  return (
    <div style={{ background: "#ffffff" }}>
      {/* Same 2-column track as /feed and /community/[slug] (.pulse-layout--feed:
          timeline + right rail) — a Hub is an extension of the feed, not its
          own distinct section with different chrome. */}
      <div className="pulse-layout pulse-layout--feed">

        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">
            {/* Back link — matches /community/[slug] and /pulse/[slug] exactly */}
            <div style={{ padding: "0.85rem 1.25rem 0", display: "flex", alignItems: "center" }}>
              <Link href="/hub" style={{
                color: "#7a6f5c", fontSize: "0.75rem", textDecoration: "none",
                letterSpacing: "0.06em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
              }}>
                ← Hubs
              </Link>
            </div>

            {/* Hub header — same card shape as a feed post: white bg, bottom
                rule, no rounded corners, matching every card in the timeline. */}
            <article style={{ background: "#fff", borderBottom: "1px solid #e8e2d8", padding: "1.25rem" }}>
              {hub.coverImageUrl && (
                <div style={{ margin: "-1.25rem -1.25rem 1rem", overflow: "hidden" }}>
                  <img
                    src={hub.coverImageUrl}
                    alt=""
                    style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                {hub.isOfficial && (
                  <span style={{
                    background: "var(--ochre, #c5491f)", color: "#fff",
                    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: "2px",
                  }}>
                    Official
                  </span>
                )}
                {hub.status === "archived" && (
                  <span style={{
                    background: "#f7f5f2", color: "#7a6f5c",
                    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: "2px",
                  }}>
                    Archived — read only
                  </span>
                )}
              </div>

              <h1 style={{
                fontFamily: "var(--font-fraunces), serif", fontSize: "1.6rem", fontWeight: 700,
                color: "#14110d", margin: "0 0 0.4rem", lineHeight: 1.2,
              }}>
                {hub.name}
              </h1>

              <p style={{ color: "#3a342b", fontSize: "0.9rem", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
                {hub.description}
              </p>

              <div style={{
                fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem", color: "#7a6f5c",
                marginBottom: "1rem",
              }}>
                {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
              </div>

              <HubActions
                hubId={hub.id}
                loggedIn={loggedIn}
                initialIsMember={status.isMember}
                initialIsFollowing={status.isFollowing}
                initialNotifyPosts={status.notifyPosts}
                isOwner={status.role === "owner"}
              />

              {isModerator && (
                <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid #e8e2d8" }}>
                  <HubManage
                    hubId={hub.id}
                    initialName={hub.name}
                    initialDescription={hub.description}
                    initialAllowedTemplates={hub.allowedTemplates}
                    initialCoverImageUrl={hub.coverImageUrl}
                    isArchived={hub.status === "archived"}
                    role={status.role === "owner" ? "owner" : "mod"}
                  />
                </div>
              )}
            </article>

            {/* Posts */}
            <div style={{ padding: "1rem 1.25rem" }}>
              <HubFeed
                hubId={hub.id}
                hubSlug={hub.slug}
                isMember={status.isMember}
                isModerator={isModerator}
              />
            </div>
          </div>
        </main>

        {/* Right rail — same "About Moveee" + copyright pattern as every
            other page's right rail (see /feed, /community/[slug], /events). */}
        <aside className="pulse-sidebar-right">
          <div style={{ padding: "1.25rem 1rem" }}>
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
              <Link href="/hub" style={{
                display: "block", background: "#c93c2a", color: "#fff",
                textAlign: "center", padding: "0.45rem 0.75rem",
                fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", textDecoration: "none",
              }}>
                Browse all Hubs →
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
