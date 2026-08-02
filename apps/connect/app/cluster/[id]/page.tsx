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
import "../../stoop.css";
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
  venueType: string;
  accessible: boolean;
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
  appointed: "Appointed host",
  self_nominated: "Self-nominated host",
  elected: "Elected host",
};

function capacityInfo(memberCount: number, capacity: number) {
  if (capacity <= 0) return { pct: 0 };
  return { pct: Math.min(100, (memberCount / capacity) * 100) };
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
function meetsToday(meetingDay: string): boolean {
  if (!meetingDay) return false;
  return DAY_NAMES[new Date().getDay()] === meetingDay.toLowerCase();
}

export default async function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) redirect(`/login?callbackUrl=/cluster/${id}`);

  const cluster = await fetchCluster(id);
  if (!cluster) {
    return (
      <div className="stoop-page-bg">
        <div className="stoop-detail-wrap">
          <p className="stoop-detail-note" style={{ marginTop: 32 }}>This Stoop doesn't exist or has been removed.</p>
          <Link href="/connect/stoop" className="stoop-detail-back">← Back to Stoop</Link>
        </div>
      </div>
    );
  }

  const status = await fetchStatus(id, Number(session.user.id));
  const isHost = cluster.hostId === Number(session.user.id);
  const [election, members] = await Promise.all([
    cluster.status === "active" && status.isMember ? fetchElection(id, Number(session.user.id)) : Promise.resolve(null),
    status.isMember ? fetchMembers(id) : Promise.resolve([]),
  ]);

  const { pct } = capacityInfo(cluster.memberCount, cluster.capacity);
  const visibleMembers = members.slice(0, 6);

  return (
    <div className="stoop-page-bg">
      <div className="stoop-detail-wrap">
        <Link href="/connect/stoop" className="stoop-detail-back">← Back to Stoop</Link>

        {cluster.status === "active" && meetsToday(cluster.meetingDay) && (
          <div className="stoop-detail-status-row">
            <span className="stoop-detail-live"><span className="stoop-detail-live-dot" />Meets today</span>
          </div>
        )}

        <h1 className="stoop-detail-name">{cluster.name}</h1>
        <div className="stoop-detail-badges">
          {cluster.hostMechanism && (
            <span className="stoop-d-badge stoop-d-badge--host">
              {HOST_MECHANISM_LABEL[cluster.hostMechanism] ?? cluster.hostMechanism.replace(/_/g, " ")}
            </span>
          )}
          {cluster.venueType && (
            <span className="stoop-d-badge stoop-d-badge--venue">{VENUE_LABEL[cluster.venueType] ?? cluster.venueType}</span>
          )}
          {cluster.accessible && (
            <span className="stoop-d-badge stoop-d-badge--access">♿ Step-free access</span>
          )}
        </div>

        <div className="stoop-detail-cap-card">
          <div className="stoop-detail-cap-left">
            <p className="stoop-detail-cap-when">
              {cluster.meetingDay && cluster.meetingTime
                ? `Every ${capitalize(cluster.meetingDay)}, ${cluster.meetingTime}`
                : "Meeting time not set yet."}
            </p>
            <p className="stoop-detail-cap-where">
              {status.isMember
                ? [cluster.street, cluster.city].filter(Boolean).join(", ") || "Location not set yet."
                : `${cluster.city || "Location"} — exact address shown after joining`}
            </p>
          </div>
          <div className="stoop-detail-cap-count">
            <span className="stoop-detail-cap-num">{cluster.memberCount}</span>
            {cluster.capacity > 0 && <span style={{ color: "var(--mute)", fontSize: 13 }}> / {cluster.capacity}</span>}
            <div className="stoop-detail-cap-label">members</div>
            {cluster.capacity > 0 && (
              <div className="stoop-detail-cap-track"><div className="stoop-detail-cap-fill" style={{ width: `${pct}%` }} /></div>
            )}
          </div>
        </div>

        {status.isMember && cluster.locationNote && (
          <p className="stoop-detail-note"><strong>Location note:</strong> {cluster.locationNote}</p>
        )}

        {cluster.status !== "active" && isHost && (
          <div style={{ marginBottom: 24 }}>
            <ClusterShareButton clusterId={cluster.id} clusterName={cluster.name} variant="banner" />
          </div>
        )}

        {!status.isMember && <ClusterActions clusterId={cluster.id} />}

        {status.isMember && (
          <div style={{ margin: "0 0 24px", textAlign: "right" }}>
            <ClusterShareButton clusterId={cluster.id} clusterName={cluster.name} />
          </div>
        )}

        {cluster.status === "active" && status.isMember && (
          <div className="stoop-detail-section">
            <p className="stoop-detail-sec-title">Check-in</p>
            <p className="stoop-detail-sec-sub">Scan your host's code with the Moveee app when you arrive.</p>
            <ClusterCheckin clusterId={cluster.id} isHost={isHost} />
          </div>
        )}

        {status.isMember && (
          <div className="stoop-detail-section">
            <p className="stoop-detail-sec-title">
              Members <span className="stoop-detail-sec-count">{members.length}</span>
            </p>
            <ClusterMembers members={visibleMembers} totalCount={members.length} clusterId={cluster.id} />
          </div>
        )}

        {cluster.status === "active" && status.isMember && (
          <div className="stoop-detail-section">
            <p className="stoop-detail-sec-title">Host Election</p>
            <ClusterElection clusterId={cluster.id} myUserId={Number(session.user.id)} initialElection={election} />
          </div>
        )}

        {status.isMember && (
          <div className="stoop-detail-leave">
            <ClusterLeaveButton clusterId={cluster.id} />
          </div>
        )}
      </div>
    </div>
  );
}
