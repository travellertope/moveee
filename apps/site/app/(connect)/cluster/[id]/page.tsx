import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClusterActions from "./ClusterActions";
import ClusterLeaveButton from "./ClusterLeaveButton";
import ClusterElection from "./ClusterElection";
import ClusterCheckin from "./ClusterCheckin";
import ClusterShareButton from "./ClusterShareButton";
import ClusterMembers from "./ClusterMembers";
import "../../../connect-stoop.css";
import "../../../connect-member.css";
import "../../../pulse-layout.css";

export const dynamic = "force-dynamic";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

interface Cluster {
  id: number;
  name: string;
  city: string;
  street: string;
  country: string;
  status: string;
  hostId: number;
  hostName: string;
  hostMechanism: string;
  memberCount: number;
  capacity: number;
  meetingDay: string;
  meetingTime: string;
  locationNote: string;
  venueType: string;
  accessible: boolean;
  hubId?: number | null;
  hubSlug?: string | null;
}

interface ClusterStatus {
  isMember: boolean;
  role: string | null;
  joinedAt: string | null;
}

interface ClusterElectionCandidate {
  id: number;
  name: string;
  voteCount: number;
}

interface ClusterElectionStatus {
  open: boolean;
  openUntil: string | null;
  candidates: ClusterElectionCandidate[];
  myVote: number | null;
  totalVotes: number;
}

interface ClusterMember {
  id: number;
  name: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

async function fetchCluster(id: string): Promise<Cluster | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/cluster/${id}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchStatus(id: string, userId: number): Promise<ClusterStatus> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/cluster/${id}/status?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return { isMember: false, role: null, joinedAt: null };
    return await res.json();
  } catch {
    return { isMember: false, role: null, joinedAt: null };
  }
}

async function fetchElection(id: string, userId: number): Promise<ClusterElectionStatus | null> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/cluster/${id}/election?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchMembers(id: string): Promise<ClusterMember[]> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/cluster/${id}/members`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.members ?? [];
  } catch {
    return [];
  }
}

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const VENUE_LABEL: Record<string, string> = {
  home: "🏠 Home", cafe: "☕ Café", coworking: "🏢 Coworking", other: "📍 Venue",
};

const HOST_MECHANISM_LABEL: Record<string, string> = {
  appointed: "Appointed",
  self_nominated: "Self-nominated",
  elected: "Elected",
};

function capacityInfo(memberCount: number, capacity: number) {
  if (capacity <= 0) return { pct: 0 };
  return { pct: Math.min(100, (memberCount / capacity) * 100) };
}

const COVER_GRADS = [
  "linear-gradient(135deg,#1a0a2e 0%,#3b1f5e 100%)",
  "linear-gradient(135deg,#0d2b1a 0%,#1b5e38 100%)",
  "linear-gradient(135deg,#2b0d0d 0%,#7a241c 100%)",
  "linear-gradient(135deg,#0d1f2b 0%,#1c4a6e 100%)",
  "linear-gradient(135deg,#2b1a00 0%,#7a5218 100%)",
  "linear-gradient(135deg,#1a1a2b 0%,#3d3d6e 100%)",
];

const AVATAR_COLORS = ["#7a241c","#1c4a6e","#0d5e38","#5e3d1c","#3d1c5e","#1c5e5e"];

function pickByName(arr: string[], name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return arr[Math.abs(hash) % arr.length];
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "checkin", label: "Check-in" },
  { key: "members", label: "Members" },
  { key: "election", label: "Election" },
];

export default async function ClusterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect(`/auth/sign-in?next=/cluster/${id}`);

  const cluster = await fetchCluster(id);
  if (!cluster) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: "var(--mute)", marginBottom: 16 }}>This Stoop doesn't exist or has been removed.</p>
          <Link href="/stoop" className="stoop-dp-btn stoop-dp-btn--ghost">← Back to Stoops</Link>
        </div>
      </div>
    );
  }

  const status = await fetchStatus(id, Number(session.user.id));
  const isHost = cluster.hostId === Number(session.user.id);

  // Non-hosts go to the public Stoop view
  if (!isHost) {
    redirect(`/stoop/${id}`);
  }

  const [election, members] = await Promise.all([
    cluster.status === "active" ? fetchElection(id, Number(session.user.id)) : Promise.resolve(null),
    fetchMembers(id),
  ]);

  const activeTab = TABS.find((t) => t.key === tabParam)?.key ?? "overview";
  const { pct } = capacityInfo(cluster.memberCount, cluster.capacity);
  const coverGrad = pickByName(COVER_GRADS, cluster.name);
  const avatarColor = pickByName(AVATAR_COLORS, cluster.name);
  const initials = cluster.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const spotsLeft = cluster.capacity > 0 ? Math.max(0, cluster.capacity - cluster.memberCount) : null;

  return (
    <div style={{ background: "var(--feed-bg, #f8fafc)" }}>
      <div className="pulse-layout pulse-layout--feed">

        {/* Center — management content */}
        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">

            {/* Cover */}
            <div className="stoop-dp-cover" style={{ background: coverGrad }}>
              <div className="stoop-dp-cover-badge">
                {cluster.status === "active" ? "Active" : cluster.status === "forming" ? "Forming" : cluster.status}
              </div>
            </div>

            {/* Action bar */}
            <div className="stoop-dp-action-bar">
              <div className="stoop-dp-stoop-avatar-wrap" style={{ marginTop: -28 }}>
                <div
                  className="stoop-dp-stoop-avatar-fallback"
                  style={{ background: avatarColor, color: "#fff", fontSize: "1rem", fontWeight: 800, width: 56, height: 56, borderRadius: "var(--radius-xl, 12px)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {initials}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className="stoop-dp-title" style={{ fontSize: "1.15rem", margin: 0 }}>{cluster.name}</h1>
                <div className="stoop-dp-cover-meta-row" style={{ marginTop: 2 }}>
                  {cluster.city && <span>{cluster.city}</span>}
                  {cluster.meetingDay && <span>Every {capitalize(cluster.meetingDay)}</span>}
                  {cluster.venueType && <span>{VENUE_LABEL[cluster.venueType] ?? cluster.venueType}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-full, 9999px)",
                    background: "rgba(122,36,28,0.1)",
                    color: "var(--ochre, #7a241c)",
                  }}
                >
                  Host
                </span>
                <ClusterShareButton clusterId={cluster.id} clusterName={cluster.name} />
              </div>
            </div>

            {/* Capacity bar */}
            {cluster.capacity > 0 && (
              <div className="stoop-dp-cap-row" style={{ padding: "0 0 16px" }}>
                <span className="stoop-dp-cap-label">
                  {cluster.memberCount} / {cluster.capacity} members
                </span>
                <div className="stoop-dp-cap-track">
                  <div className="stoop-dp-cap-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}

            {/* Tab nav */}
            <div className="stoop-dp-tabs">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  href={`/cluster/${id}?tab=${t.key}`}
                  className={`stoop-dp-tab${activeTab === t.key ? " stoop-dp-tab--active" : ""}`}
                  style={{ textDecoration: "none" }}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            {/* Tab content */}
            <div className="stoop-dp-section">

              {activeTab === "overview" && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <p className="stoop-dp-sec-title">Stoop Details</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "var(--paper, #f3ece0)", borderRadius: "var(--radius-lg, 6px)", padding: "12px 14px" }}>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--mute)", margin: "0 0 4px" }}>Meeting</p>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                          {cluster.meetingDay && cluster.meetingTime
                            ? `${capitalize(cluster.meetingDay)}s, ${cluster.meetingTime}`
                            : "Not set"}
                        </p>
                      </div>
                      <div style={{ background: "var(--paper, #f3ece0)", borderRadius: "var(--radius-lg, 6px)", padding: "12px 14px" }}>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--mute)", margin: "0 0 4px" }}>Location</p>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                          {[cluster.street, cluster.city].filter(Boolean).join(", ") || "Not set"}
                        </p>
                      </div>
                      <div style={{ background: "var(--paper, #f3ece0)", borderRadius: "var(--radius-lg, 6px)", padding: "12px 14px" }}>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--mute)", margin: "0 0 4px" }}>Host mechanism</p>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                          {HOST_MECHANISM_LABEL[cluster.hostMechanism] ?? cluster.hostMechanism ?? "—"}
                        </p>
                      </div>
                      <div style={{ background: "var(--paper, #f3ece0)", borderRadius: "var(--radius-lg, 6px)", padding: "12px 14px" }}>
                        <p style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--mute)", margin: "0 0 4px" }}>Accessibility</p>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                          {cluster.accessible ? "♿ Step-free access" : "Not specified"}
                        </p>
                      </div>
                    </div>
                    {cluster.locationNote && (
                      <div style={{ marginTop: 12, background: "rgba(122,36,28,0.06)", borderRadius: "var(--radius-lg, 6px)", padding: "12px 14px", borderLeft: "3px solid var(--ochre, #7a241c)" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--ochre, #7a241c)", margin: "0 0 4px" }}>Location Note</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--ink)", margin: 0 }}>{cluster.locationNote}</p>
                      </div>
                    )}
                  </div>

                  {cluster.status !== "active" && (
                    <div style={{ marginBottom: 24 }}>
                      <p className="stoop-dp-sec-title">Grow your Stoop</p>
                      <ClusterShareButton clusterId={cluster.id} clusterName={cluster.name} variant="banner" />
                    </div>
                  )}

                  {!status.isMember && (
                    <div style={{ marginBottom: 24 }}>
                      <ClusterActions clusterId={cluster.id} />
                    </div>
                  )}
                </>
              )}

              {activeTab === "checkin" && (
                <>
                  <p className="stoop-dp-sec-title">Check-in</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--mute)", marginBottom: 16, marginTop: 0 }}>
                    Share your QR code with members when they arrive at the Stoop.
                  </p>
                  {cluster.status === "active" ? (
                    <ClusterCheckin clusterId={cluster.id} isHost={true} />
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--mute)" }}>Check-in is only available for active Stoops.</p>
                  )}
                </>
              )}

              {activeTab === "members" && (
                <>
                  <p className="stoop-dp-sec-title">
                    Members <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--mute)", marginLeft: 6 }}>{members.length}</span>
                  </p>
                  <ClusterMembers members={members} totalCount={members.length} clusterId={cluster.id} />
                </>
              )}

              {activeTab === "election" && (
                <>
                  <p className="stoop-dp-sec-title">Host Election</p>
                  {cluster.status === "active" ? (
                    <ClusterElection
                      clusterId={cluster.id}
                      myUserId={Number(session.user.id)}
                      initialElection={election}
                      hostName={cluster.hostName}
                    />
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--mute)" }}>Elections are only available for active Stoops.</p>
                  )}
                </>
              )}

            </div>

            {/* Leave button — shown in overview only */}
            {activeTab === "overview" && (
              <div style={{ padding: "24px 0", borderTop: "1px solid var(--rule, #e8e2d8)", marginTop: 8 }}>
                <ClusterLeaveButton clusterId={cluster.id} />
              </div>
            )}

          </div>
        </main>

        {/* Right sidebar — Stoop stats */}
        <aside className="pulse-sidebar-right">
          <div style={{ background: "#fff", borderRadius: "var(--radius-xl, 12px)", padding: "16px 18px", border: "1px solid var(--rule, #e8e2d8)", marginBottom: 16 }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--mute)", margin: "0 0 12px" }}>
              Stoop Stats
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Members</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{cluster.memberCount}</span>
              </div>
              {cluster.capacity > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Capacity</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)" }}>{cluster.capacity}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>Spots left</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: spotsLeft === 0 ? "var(--ochre, #7a241c)" : "var(--ink)" }}>
                      {spotsLeft === 0 ? "Full" : spotsLeft}
                    </span>
                  </div>
                  <div className="stoop-dp-cap-track" style={{ marginTop: 4 }}>
                    <div className="stoop-dp-cap-fill" style={{ width: `${pct}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "var(--radius-xl, 12px)", padding: "16px 18px", border: "1px solid var(--rule, #e8e2d8)" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--mute)", margin: "0 0 12px" }}>
              Quick Links
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href={`/stoop/${id}`}
                style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                <span>👁</span> Public view
              </Link>
              <Link
                href={`/cluster/${id}?tab=checkin`}
                style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                <span>✅</span> Check-in QR
              </Link>
              <Link
                href={`/cluster/${id}?tab=members`}
                style={{ fontSize: "0.82rem", color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                <span>👥</span> Manage members
              </Link>
            </div>
          </div>

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
