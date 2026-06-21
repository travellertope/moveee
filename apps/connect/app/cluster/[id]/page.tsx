import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClusterActions from "./ClusterActions";
import ClusterElection from "./ClusterElection";
import "../../member.css";

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

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default async function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect(`/login?callbackUrl=/cluster/${id}`);

  const cluster = await fetchCluster(id);
  if (!cluster) {
    return (
      <div className="mem-body">
        <section className="mem-card">
          <div className="mem-card-label">Not found</div>
          <p className="mem-card-desc">This House Fellowship doesn't exist or has been removed.</p>
          <Link href="/connect/people" className="mem-settings-back-link">← Back to People Near Me</Link>
        </section>
      </div>
    );
  }

  const status = await fetchStatus(id, Number(session.user.id));
  const election = cluster.status === "active" && status.isMember
    ? await fetchElection(id, Number(session.user.id))
    : null;

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-hero-body">
            <div className="mem-eyebrow">
              <Link href="/connect/people" style={{ color: "inherit", textDecoration: "none" }}>People Near Me</Link>
              {" "}&rsaquo;{" "}House Fellowship
            </div>
            <h1 className="mem-name">{cluster.name}</h1>
            <div className="mem-meta">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "rgba(243,236,224,.6)" }}>
                {[cluster.street, cluster.city, cluster.country].filter(Boolean).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/connect/people" className="mem-settings-back-link">← Back to People Near Me</Link>
        </div>

        {cluster.hostName && (
          <section className="mem-card" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mem-card-desc" style={{ margin: 0, fontWeight: 600 }}>Host: {cluster.hostName}</span>
            {cluster.hostMechanism && (
              <span
                style={{
                  background: "var(--ochre)", color: "var(--paper)", borderRadius: 999,
                  padding: "2px 8px", fontSize: "0.65rem", textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
                }}
              >
                {cluster.hostMechanism.replace("_", " ")}
              </span>
            )}
          </section>
        )}

        <section className="mem-card">
          <div className="mem-card-label">Meeting</div>
          <p className="mem-card-desc" style={{ margin: 0 }}>
            {cluster.meetingDay && cluster.meetingTime
              ? `${capitalize(cluster.meetingDay)}s, ${cluster.meetingTime}`
              : "Meeting time not set yet."}
          </p>
          {status.isMember && cluster.locationNote && (
            <p className="mem-card-desc" style={{ marginTop: 12 }}>
              <strong>Location note:</strong> {cluster.locationNote}
            </p>
          )}
          <p style={{ fontSize: "0.78rem", color: "var(--mute)", marginTop: 16 }}>
            {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} members
          </p>
        </section>

        <section className="mem-card">
          <ClusterActions clusterId={cluster.id} initialIsMember={status.isMember} />
        </section>

        {cluster.status === "active" && status.isMember && (
          <section className="mem-card">
            <ClusterElection
              clusterId={cluster.id}
              myUserId={Number(session.user.id)}
              initialElection={election}
            />
          </section>
        )}
      </div>
    </>
  );
}
