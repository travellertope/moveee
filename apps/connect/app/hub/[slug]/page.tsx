import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import HubActions from "./HubActions";
import HubManage from "./HubManage";
import HubContent from "./HubContent";
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
  coverImageCredit?: string;
  creatorId: number;
  status: string;
  allowedTemplates: string[];
  memberCount: number;
  postCount: number;
  isOfficial?: boolean;
  category?: string | null;
  clusterId?: number | null;
}

interface RelatedEvent {
  id: number;
  title: string;
  slug: string;
  eventDate: string;
  imageUrl: string;
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

async function fetchRelatedEvents(hubId: number): Promise<RelatedEvent[]> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/hub/${hubId}/related-events`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return data?.events ?? [];
  } catch {
    return [];
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
      <div>
        <div className="pulse-layout pulse-layout--feed">
          <main className="pulse-timeline">
            <div className="pulse-timeline-inner" style={{ padding: "2rem 1.25rem" }}>
              <p style={{ fontSize: "0.95rem", color: "#3a342b", margin: "0 0 0.5rem" }}>
                This Hub doesn't exist or has been removed.
              </p>
              <Link href="/hub" style={{ color: "#7a241c", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
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
  const relatedEvents = await fetchRelatedEvents(hub.id);

  return (
    <div>
      {/* Same 2-column track as /feed and /community/[slug] (.pulse-layout--feed:
          timeline + right rail) — a Hub is an extension of the feed, not its
          own distinct section with different chrome. */}
      <div className="pulse-layout pulse-layout--feed">

        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">
            {/* Back link */}
            <div style={{ padding: "0.85rem 1.25rem 0.65rem", display: "flex", alignItems: "center" }}>
              <Link href="/hub" style={{
                color: "#7a6f5c", fontSize: "0.72rem", textDecoration: "none",
                letterSpacing: "0.08em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
              }}>
                ← Hubs
              </Link>
            </div>

            {/* Hub hero card */}
            <article style={{
              background: "#fff",
              borderRadius: "var(--radius-xl, 12px)",
              border: "1px solid var(--rule, #e8e2d8)",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(20,17,13,0.06)",
              margin: "0 1.25rem 1rem",
            }}>
              {/* Cover image with gradient overlay + badges */}
              {hub.coverImageUrl ? (
                <div style={{ position: "relative", height: "200px", background: "#1a1612", overflow: "hidden" }}>
                  <img
                    src={hub.coverImageUrl}
                    alt=""
                    title={hub.coverImageCredit || undefined}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9, display: "block" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(20,17,13,0.55) 0%, transparent 55%)",
                  }} />
                  <div style={{ position: "absolute", top: "0.85rem", left: "0.85rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {hub.isOfficial && (
                      <span style={{
                        background: "rgba(20,17,13,0.5)", backdropFilter: "blur(8px)",
                        color: "#fff", fontSize: "0.6rem", fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full, 9999px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}>
                        Official Hub
                      </span>
                    )}
                    {hub.status === "archived" && (
                      <span style={{
                        background: "rgba(20,17,13,0.5)", backdropFilter: "blur(8px)",
                        color: "#e0cbb8", fontSize: "0.6rem", fontWeight: 700,
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full, 9999px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}>
                        Archived
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* No cover: coloured header strip with hub name */
                <div style={{
                  height: "80px", background: "var(--ochre, #7a241c)",
                  display: "flex", alignItems: "flex-end", padding: "0.75rem 1.5rem",
                }}>
                  {hub.isOfficial && (
                    <span style={{
                      background: "rgba(0,0,0,0.25)", color: "#fff",
                      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em",
                      textTransform: "uppercase", padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-full, 9999px)",
                    }}>
                      Official Hub
                    </span>
                  )}
                </div>
              )}

              {/* Info section */}
              <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
                {/* Category badge (non-official hubs) */}
                {!hub.isOfficial && hub.category && !hub.coverImageUrl && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span style={{
                      background: "#f7f5f2", color: "#7a6f5c",
                      fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "0.15rem 0.5rem",
                      borderRadius: "var(--radius-full, 9999px)",
                    }}>
                      {hub.category}
                    </span>
                  </div>
                )}

                {/* Title + actions row */}
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
                  marginBottom: "1.25rem",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{
                      fontSize: "1.65rem", fontWeight: 700, color: "#14110d",
                      margin: "0 0 0.35rem", lineHeight: 1.2,
                    }}>
                      {hub.name}
                    </h1>
                    {hub.description && (
                      <p style={{ color: "#3a342b", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                        {hub.description}
                      </p>
                    )}
                  </div>
                  <HubActions
                    hubId={hub.id}
                    loggedIn={loggedIn}
                    initialIsMember={status.isMember}
                    initialIsFollowing={status.isFollowing}
                    initialNotifyPosts={status.notifyPosts}
                    isOwner={status.role === "owner"}
                  />
                </div>

                {/* Stats bar */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "1.5rem",
                  paddingTop: "1rem", borderTop: "1px solid var(--rule, #e8e2d8)",
                  fontSize: "0.8rem", color: "#7a6f5c",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM0 14s-1 0-1-1 1-4 9-4 9 3 9 4-1 1-1 1H0Z"/>
                    </svg>
                    <strong style={{ color: "#14110d" }}>{hub.memberCount.toLocaleString()}</strong>
                    {" "}member{hub.memberCount === 1 ? "" : "s"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12ZM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Z"/>
                    </svg>
                    <strong style={{ color: "#14110d" }}>{hub.postCount.toLocaleString()}</strong>
                    {" "}post{hub.postCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Moderator panel (inside the card, below stats) */}
              {isModerator && (
                <div style={{ borderTop: "1px solid var(--rule, #e8e2d8)", padding: "1rem 1.5rem" }}>
                  <HubManage
                    hubId={hub.id}
                    initialName={hub.name}
                    initialDescription={hub.description}
                    initialAllowedTemplates={hub.allowedTemplates}
                    initialCoverImageUrl={hub.coverImageUrl}
                    initialCategory={hub.category}
                    isArchived={hub.status === "archived"}
                    role={status.role === "owner" ? "owner" : "mod"}
                  />
                </div>
              )}
            </article>

            {/* Stoop link */}
            {hub.clusterId && (
              <Link
                href={`/cluster/${hub.clusterId}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#fff", borderBottom: "1px solid var(--rule, #e8e2d8)",
                  padding: "0.9rem 1.25rem", textDecoration: "none", color: "inherit",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 0.15rem", fontSize: "0.8rem", fontWeight: 700, color: "#14110d" }}>
                    Discussion for a Stoop
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#7a6f5c" }}>
                    This Hub is the discussion space for a weekly Stoop — view it →
                  </p>
                </div>
              </Link>
            )}

            {/* Related events */}
            {relatedEvents.length > 0 && (
              <div style={{ background: "#fff", borderBottom: "1px solid var(--rule, #e8e2d8)", padding: "1rem 1.25rem" }}>
                <p style={{
                  color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.6rem",
                }}>
                  Related events
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {relatedEvents.map((ev) => (
                    <a
                      key={ev.id}
                      href={`/events/${ev.slug}`}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", color: "inherit" }}
                    >
                      {ev.imageUrl ? (
                        <img src={ev.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "var(--radius-md, 4px)" }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md, 4px)", background: "#f2f2f2" }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 0.15rem", fontSize: "0.82rem", color: "#14110d", fontWeight: 600 }}>{ev.title}</p>
                        <p style={{ margin: 0, fontFamily: "var(--font-mono), monospace", fontSize: "0.68rem", color: "#7a6f5c" }}>{ev.eventDate}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tabbed feed (Discussions + Members) */}
            <HubContent
              hubId={hub.id}
              hubSlug={hub.slug}
              isMember={status.isMember}
              isModerator={isModerator}
            />
          </div>
        </main>

        {/* Right rail */}
        <aside className="pulse-sidebar-right">
          <div style={{ padding: "1.25rem 1rem" }}>
            <div style={{
              background: "var(--paper, #fff)",
              border: "1px solid var(--rule, #e8e2d8)",
              borderRadius: "var(--radius-xl, 12px)",
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
            }}>
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
                display: "block", background: "rgba(122,36,28,0.08)", color: "var(--ochre, #7a241c)",
                textAlign: "center", padding: "0.5rem 0.75rem",
                fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", textDecoration: "none",
                borderRadius: "var(--radius-lg, 6px)",
                border: "1px solid rgba(122,36,28,0.15)",
              }}>
                Browse All Hubs
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
