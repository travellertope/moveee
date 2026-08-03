"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openSearchModal } from "@/lib/searchModalBus";
import { onStoopFilters } from "@/lib/stoopFiltersBus";

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
  capacity: number;
  memberCount: number;
  meetingDay: string;
  meetingTime: string;
  venueType: string;
  accessible: boolean;
  role?: string;
}

interface ClusterMember {
  id: number;
  name: string;
  avatarUrl: string;
  role: string;
}

// Purely decorative — mirrors MemberDirectory.tsx's avatarColor() exactly,
// same stable-hash-of-id approach, kept as a separate copy since there's no
// shared source of truth for these small per-component color helpers.
const AVATAR_COLORS = [
  "#c5491f", "#1976d2", "#2e7d32", "#b38238", "#6b48a8", "#8d6e63",
  "#7b1fa2", "#c2185b", "#00695c", "#37474f", "#283593", "#5d4037",
];
function avatarColor(id: number | string): string {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const VENUE_LABEL: Record<string, string> = {
  home: "🏠 Home", cafe: "☕ Café", coworking: "🏢 Coworking", other: "📍 Venue",
};

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function capacityBadge(memberCount: number, capacity: number): { label: string; tone: "open" | "filling" | "full" } {
  if (capacity <= 0) return { label: "Open", tone: "open" };
  const pct = memberCount / capacity;
  if (pct >= 1) return { label: "Full", tone: "full" };
  if (pct >= 0.8) {
    const left = capacity - memberCount;
    return { label: `${left} spot${left === 1 ? "" : "s"} left`, tone: "open" };
  }
  if (pct >= 0.6) return { label: "Filling up", tone: "filling" };
  return { label: "Open", tone: "open" };
}

const PER_PAGE = 12;
const RAIL_PER_PAGE = 6;

interface Props {
  viewerCity?: string;
  viewerCountry?: string;
}

export default function StoopBrowser({ viewerCity = "", viewerCountry = "" }: Props) {
  const router = useRouter();

  // City lives entirely inside SearchModal's Stoop context — this component
  // only ever reads it via stoopFiltersBus, never renders its own filter UI
  // (same convention as MemberDirectory.tsx's industry/region).
  const [city, setCity] = useState<string | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [myCluster, setMyCluster] = useState<Cluster | null>(null);
  const [myMembers, setMyMembers] = useState<ClusterMember[]>([]);
  const [myClusterCount, setMyClusterCount] = useState(0);

  const [nearYou, setNearYou] = useState<Cluster[]>([]);
  const [overflow, setOverflow] = useState<Cluster[]>([]);
  const [entries, setEntries] = useState<Cluster[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<"nearest_capacity" | "newest">("nearest_capacity");
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => onStoopFilters(({ city: c }) => setCity(c)), []);

  const primaryLocation = city || viewerCity || viewerCountry;

  // Resolve membership once on mount (and whenever the join flow updates it).
  const loadMyCluster = useCallback(async () => {
    try {
      const res = await fetch("/api/cluster/my-clusters", { cache: "no-store" });
      const data = res.ok ? await res.json() : { clusters: [] };
      const clusters: Cluster[] = data.clusters ?? [];
      const active = clusters.find((c) => c.status !== "archived") ?? null;
      setMyCluster(active);
      if (active) {
        const mRes = await fetch(`/api/cluster/${active.id}/members`, { cache: "no-store" });
        const mData = mRes.ok ? await mRes.json() : { members: [] };
        const members: ClusterMember[] = mData.members ?? [];
        setMyMembers(members.slice(0, 4));
        setMyClusterCount(members.length);
      } else {
        setMyMembers([]);
        setMyClusterCount(0);
      }
      return active;
    } catch {
      setMyCluster(null);
      setMyMembers([]);
      setMyClusterCount(0);
      return null;
    }
  }, []);

  useEffect(() => {
    setLoadingInitial(true);
    loadMyCluster().finally(() => setLoadingInitial(false));
  }, [loadMyCluster]);

  // Browse state — Near You rail, only meaningful when a member state hasn't
  // already been established.
  useEffect(() => {
    if (loadingInitial || myCluster) { setNearYou([]); return; }
    if (!primaryLocation) { setNearYou([]); return; }
    let cancelled = false;
    const params = new URLSearchParams({ per_page: String(RAIL_PER_PAGE) });
    if (city) params.set("city", city);
    else if (viewerCity) params.set("city", viewerCity);
    else if (viewerCountry) params.set("country", viewerCountry);
    fetch(`/api/cluster/discover?${params}`)
      .then((r) => (r.ok ? r.json() : { clusters: [] }))
      .then((d) => { if (!cancelled) setNearYou(d.clusters ?? []); })
      .catch(() => { if (!cancelled) setNearYou([]); });
    return () => { cancelled = true; };
  }, [loadingInitial, myCluster, city, viewerCity, viewerCountry, primaryLocation]);

  // Member state — overflow rail of other active Stoops in the same area
  // (joining a second Stoop is just a normal join() call server-side, see
  // CLAUDE.md — there's no separate "overflow" endpoint, only UI framing).
  useEffect(() => {
    if (loadingInitial || !myCluster) { setOverflow([]); return; }
    let cancelled = false;
    const params = new URLSearchParams({ per_page: String(RAIL_PER_PAGE) });
    const loc = city || myCluster.city || viewerCity;
    if (loc) params.set("city", loc);
    else if (viewerCountry) params.set("country", viewerCountry);
    fetch(`/api/cluster/discover?${params}`)
      .then((r) => (r.ok ? r.json() : { clusters: [] }))
      .then((d) => {
        if (cancelled) return;
        const list: Cluster[] = (d.clusters ?? []).filter((c: Cluster) => c.id !== myCluster.id);
        setOverflow(list);
      })
      .catch(() => { if (!cancelled) setOverflow([]); });
    return () => { cancelled = true; };
  }, [loadingInitial, myCluster, city, viewerCity, viewerCountry]);

  // Browse state — Explore More paginated grid.
  const fetchPage = useCallback(async (off: number, replace: boolean) => {
    const params = new URLSearchParams({ per_page: String(PER_PAGE), page: String(Math.floor(off / PER_PAGE) + 1), sort });
    if (city) params.set("city", city);
    else if (viewerCity) params.set("city", viewerCity);
    else if (viewerCountry) params.set("country", viewerCountry);
    const res = await fetch(`/api/cluster/discover?${params}`);
    const data = res.ok ? await res.json() : { clusters: [] };
    const clusters: Cluster[] = data.clusters ?? [];
    setEntries((prev) => (replace ? clusters : [...prev, ...clusters]));
    setHasMore(clusters.length >= PER_PAGE);
    setOffset(off + clusters.length);
  }, [city, viewerCity, viewerCountry, sort]);

  useEffect(() => {
    if (loadingInitial || myCluster) return;
    fetchPage(0, true);
  }, [loadingInitial, myCluster, fetchPage]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(offset, false);
    setLoadingMore(false);
  }

  async function join(clusterId: number) {
    setJoiningId(clusterId);
    setJoinError(null);
    try {
      const res = await fetch(`/api/cluster/${clusterId}/join`, { method: "POST" });
      if (res.ok) {
        router.push(`/cluster/${clusterId}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setJoinError({ id: clusterId, message: data?.message || "Could not join right now." });
    } catch {
      setJoinError({ id: clusterId, message: "Could not join right now." });
    }
    setJoiningId(null);
  }

  const locationLabel = city || viewerCity || viewerCountry;

  if (loadingInitial) {
    return <div className="stoop-loading">Loading Stoops…</div>;
  }

  return (
    <>
      <button type="button" className="stoop-search-btn" onClick={() => openSearchModal()}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        Search by city or country…
      </button>

      {city && (
        <div className="stoop-active-filters">
          <span className="stoop-chip">
            📍 {city}
            <button type="button" className="stoop-chip-clear" onClick={() => setCity(null)} aria-label="Clear city filter">✕</button>
          </span>
        </div>
      )}

      {myCluster ? (
        <>
          <div className="your-stoop">
            <p className="ys-eyebrow"><span className="ys-live-dot" />Your Stoop</p>
            <div className="ys-body">
              <Link href={`/cluster/${myCluster.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h2 className="ys-name">{myCluster.name}</h2>
                <p className="ys-meta">
                  📍 {[myCluster.street, myCluster.city].filter(Boolean).join(", ")}
                  {" "}<span className="ys-meta-note">(exact address shown to members only)</span>
                </p>
                {myCluster.meetingDay && myCluster.meetingTime && (
                  <p className="ys-meta">
                    🗓 Every <b>{capitalize(myCluster.meetingDay)}, {myCluster.meetingTime}</b>
                    {myCluster.venueType ? ` · ${VENUE_LABEL[myCluster.venueType] ?? myCluster.venueType}` : ""}
                  </p>
                )}
                {myCluster.hostName && (
                  <p className="ys-host">Hosted by {myCluster.hostName}</p>
                )}
                {myMembers.length > 0 && (
                  <div className="ys-members">
                    {myMembers.map((m) => (
                      <span key={m.id} className="ys-avatar" style={{ background: avatarColor(m.id) }} aria-hidden="true">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    ))}
                    {myClusterCount > myMembers.length && (
                      <span className="ys-members-count">+ {myClusterCount - myMembers.length} more members</span>
                    )}
                  </div>
                )}
              </Link>
              <div className="ys-actions">
                <Link href={`/cluster/${myCluster.id}`} className="ys-btn-ghost">View Members</Link>
                <Link href={`/cluster/${myCluster.id}#checkin`} className="ys-btn-primary">Open Check-in QR →</Link>
              </div>
            </div>
          </div>

          {overflow.length > 0 && (
            <>
              <p className="stoop-sec-heading">More{locationLabel ? ` in ${locationLabel}` : ""}</p>
              <p className="stoop-sec-sub">Overflow welcome — join a second Stoop if yours is full on a given week.</p>
              <div className="stoop-rail">
                {overflow.map((c) => (
                  <RailCard key={c.id} cluster={c} joining={joiningId === c.id} error={joinError?.id === c.id ? joinError.message : ""} onJoin={() => join(c.id)} overflow />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="stoop-how-band">
            <div className="stoop-how-step">
              <span className="stoop-how-num">1</span>
              <div className="stoop-how-copy"><h4>Find your area</h4><p>Stoops are grouped by neighbourhood, not the whole city — so it's always a short trip.</p></div>
            </div>
            <div className="stoop-how-step">
              <span className="stoop-how-num">2</span>
              <div className="stoop-how-copy"><h4>Join in one tap</h4><p>No approval wait. See who's hosting, when they meet, and join instantly.</p></div>
            </div>
            <div className="stoop-how-step">
              <span className="stoop-how-num">3</span>
              <div className="stoop-how-copy"><h4>Show up weekly</h4><p>Same day, same time, every week. Scan in when you arrive — that's it.</p></div>
            </div>
          </div>

          {nearYou.length > 0 && (
            <>
              <p className="stoop-sec-heading">Near You{locationLabel ? ` · ${locationLabel}` : ""}</p>
              <p className="stoop-sec-sub">{nearYou.length} Stoop{nearYou.length === 1 ? "" : "s"} meeting near you</p>
              <div className="stoop-rail">
                {nearYou.map((c) => (
                  <RailCard key={c.id} cluster={c} joining={joiningId === c.id} error={joinError?.id === c.id ? joinError.message : ""} onJoin={() => join(c.id)} />
                ))}
              </div>
            </>
          )}

          <div className="stoop-toolbar">
            <div>
              <p className="stoop-sec-heading" style={{ marginBottom: 2 }}>Explore More</p>
              <p className="stoop-sec-sub" style={{ marginBottom: 0 }}>All active Stoops{locationLabel ? ` near ${locationLabel}` : ""}</p>
            </div>
            <select
              className="stoop-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as "nearest_capacity" | "newest")}
            >
              <option value="nearest_capacity">Fewest members first</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {entries.length === 0 ? (
            <div className="stoop-empty">
              <span className="stoop-empty-icon" aria-hidden="true">🚪</span>
              <h4>No Stoop near you yet.</h4>
              <p>Be the first to start one in your area — it takes about 5 minutes and Moveee handles the rest.</p>
              <Link href="/cluster/create" className="stoop-start-btn">Start a Stoop →</Link>
            </div>
          ) : (
            <>
              <div className="stoop-grid">
                {entries.map((c) => (
                  <GridCard key={c.id} cluster={c} joining={joiningId === c.id} error={joinError?.id === c.id ? joinError.message : ""} onJoin={() => join(c.id)} />
                ))}
              </div>
              {hasMore ? (
                <button type="button" className="stoop-load-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              ) : (
                <div className="stoop-count">Showing {entries.length} Stoop{entries.length !== 1 ? "s" : ""}</div>
              )}
            </>
          )}

          <div className="stoop-start-band">
            <div>
              <h4>Don't see your area yet?</h4>
              <p>Start a Stoop — pick a day, a spot, and Moveee handles the rest. Reputation-gated, takes 5 minutes.</p>
            </div>
            <Link href="/cluster/create" className="stoop-start-btn">Start a Stoop →</Link>
          </div>
        </>
      )}
    </>
  );
}

function RailCard({ cluster, joining, error, onJoin, overflow }: { cluster: Cluster; joining: boolean; error?: string; onJoin: () => void; overflow?: boolean }) {
  const badge = capacityBadge(cluster.memberCount, cluster.capacity);
  return (
    <div className="stoop-rail-card">
      <span className={`stoop-rail-badge${badge.tone === "filling" ? " stoop-rail-badge--filling" : ""}`}>{badge.label}</span>
      {cluster.meetingDay && cluster.meetingTime && (
        <p className="stoop-rail-day">{capitalize(cluster.meetingDay)}s · {cluster.meetingTime}</p>
      )}
      <h3 className="stoop-rail-name">{cluster.name}</h3>
      {/* Street withheld until joined — addressVisible defaults to
          members_only at creation time; city-level is enough to browse by. */}
      <p className="stoop-rail-loc">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>
        {cluster.city || "Area not set"}
      </p>
      <div className="stoop-cap-wrap">
        <div className="stoop-cap-track">
          <div className="stoop-cap-fill" style={{ width: `${cluster.capacity > 0 ? Math.min(100, (cluster.memberCount / cluster.capacity) * 100) : 20}%` }} />
        </div>
        <span className="stoop-cap-label">{cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} members</span>
      </div>
      {error && <p className="stoop-detail-error" style={{ marginBottom: 8 }}>{error}</p>}
      <button type="button" className="stoop-rail-join" onClick={onJoin} disabled={joining || badge.tone === "full"}>
        {joining ? "Joining…" : badge.tone === "full" ? "Full" : overflow ? "Join as Overflow →" : "Join Stoop →"}
      </button>
    </div>
  );
}

function GridCard({ cluster, joining, error, onJoin }: { cluster: Cluster; joining: boolean; error?: string; onJoin: () => void }) {
  const badge = capacityBadge(cluster.memberCount, cluster.capacity);
  return (
    <div className="stoop-g-card">
      <div className="stoop-g-top">
        <h4 className="stoop-g-name">{cluster.name}</h4>
        {cluster.venueType && <span className="stoop-g-venue">{VENUE_LABEL[cluster.venueType]?.replace(/^\S+\s/, "") ?? cluster.venueType}</span>}
      </div>
      <div className="stoop-g-meta-row">
        {cluster.meetingDay && cluster.meetingTime && <span>🗓 {capitalize(cluster.meetingDay)}s, {cluster.meetingTime}</span>}
        <span>👥 {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""}</span>
      </div>
      {/* Street withheld until joined — see RailCard's note above. */}
      {cluster.city ? <p className="stoop-g-note">{cluster.city}</p> : null}
      {error && <p className="stoop-detail-error" style={{ margin: 0 }}>{error}</p>}
      <div className="stoop-g-bottom">
        <div className="stoop-g-host">
          {cluster.hostName && (
            <>
              <span className="stoop-g-host-av" style={{ background: avatarColor(cluster.hostId || cluster.id) }}>
                {cluster.hostName.charAt(0).toUpperCase()}
              </span>
              Hosted by {cluster.hostName.split(" ")[0]}
            </>
          )}
        </div>
        <button type="button" className="stoop-g-join" onClick={onJoin} disabled={joining || badge.tone === "full"}>
          {joining ? "Joining…" : badge.tone === "full" ? "Full" : "Join →"}
        </button>
      </div>
    </div>
  );
}
