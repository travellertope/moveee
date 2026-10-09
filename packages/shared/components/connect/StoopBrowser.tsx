"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openSearchModal } from "@/lib/searchModalBus";
import { onStoopFilters } from "@/lib/stoopFiltersBus";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";
import StoopDetailPanel from "@/components/connect/StoopDetailPanel";

/* ─── Data types ─────────────────────────────────────────────── */
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

/* ─── Helpers ────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#7a241c", "#1976d2", "#2e7d32", "#b38238", "#6b48a8", "#8d6e63",
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

/* Category filter definitions */
type StCategory = "all" | "music" | "book" | "coffee" | "art";
const CAT_LABELS: Record<StCategory, string> = {
  all:    "All Active Stoops",
  music:  "Vinyl & Music",
  book:   "Book Circles",
  coffee: "Coffee & Architecture",
  art:    "Art & Creatives",
};
function clusterCategory(c: Cluster): StCategory {
  const n = (c.name + " " + (c.hostMechanism || "") + " " + (c.venueType || "")).toLowerCase();
  if (/vinyl|music|listen|jazz|record|sound/.test(n)) return "music";
  if (/book|lit|read|poem|poetry|write|zine|novel/.test(n)) return "book";
  if (/coffee|café|cafe|cowork|architect|design/.test(n)) return "coffee";
  if (/art|creative|paint|photo|gallery|film|cinema/.test(n)) return "art";
  return "all";
}

/* Deterministic cover gradients (no cover photo in DB yet) */
const COVER_GRADS = [
  "linear-gradient(160deg, #1a0a08 0%, #7a241c 100%)",
  "linear-gradient(160deg, #0e1420 0%, #1a3a6a 100%)",
  "linear-gradient(160deg, #1a1400 0%, #6b4f12 100%)",
  "linear-gradient(160deg, #0a1a0a 0%, #1b4d2e 100%)",
  "linear-gradient(160deg, #140a1a 0%, #4a2068 100%)",
  "linear-gradient(160deg, #0e0e14 0%, #2c3a4a 100%)",
];
function coverGrad(id: number): string {
  return COVER_GRADS[id % COVER_GRADS.length];
}

const PER_PAGE = 12;
const RAIL_PER_PAGE = 6;

interface Props {
  viewerCity?: string;
  viewerCountry?: string;
}

/* ─── Main component ─────────────────────────────────────────── */
export default function StoopBrowser({ viewerCity = "", viewerCountry = "" }: Props) {
  const router = useRouter();

  const [city, setCity] = useState<string | null>(null);

  /* Geolocation */
  const [geoCity, setGeoCity] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  /* Category filter */
  const [category, setCategory] = useState<StCategory>("all");

  /* "Start a Stoop" quick modal */
  const [showHostModal, setShowHostModal] = useState(false);
  const [hostStoopName, setHostStoopName] = useState("");
  const [hostCity, setHostCity] = useState(viewerCity || "");
  const [hostDay, setHostDay] = useState("saturday");
  const [hostTime, setHostTime] = useState("");
  const [hostVibe, setHostVibe] = useState("");
  const [hostSubmitting, setHostSubmitting] = useState(false);
  const [hostError, setHostError] = useState("");

  /* Inline detail panel */
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  /* Data */
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
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<{ id: number; message: string } | null>(null);

  /* Location prompt (when no city is known at all) */
  const [locCountry, setLocCountry] = useState("");
  const [locCity, setLocCity] = useState("");
  const [savingLoc, setSavingLoc] = useState(false);
  const [locError, setLocError] = useState("");
  const needsLocation = !viewerCity && !viewerCountry && !city && !geoCity;

  useEffect(() => onStoopFilters(({ city: c }) => setCity(c)), []);

  const primaryLocation = city || geoCity || viewerCity || viewerCountry;
  const locationLabel = city || geoCity || viewerCity || viewerCountry;

  /* ── Geolocation → reverse geocode via Nominatim ──────────── */
  function detectCity() {
    if (geoLoading) return;
    if (!navigator.geolocation) { openSearchModal(); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { Accept: "application/json" } }
          );
          const data = await res.json().catch(() => ({}));
          const detected =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.village ||
            data?.address?.county ||
            null;
          if (detected) setGeoCity(detected);
          else openSearchModal();
        } catch {
          openSearchModal();
        } finally {
          setGeoLoading(false);
        }
      },
      () => { setGeoLoading(false); openSearchModal(); },
      { timeout: 8000 }
    );
  }

  /* ── Save location to profile ─────────────────────────────── */
  async function saveLocation() {
    if (savingLoc) return;
    if (!locCountry.trim() && !locCity.trim()) {
      setLocError("Pick a country, or a city, so we know where to look.");
      return;
    }
    setLocError("");
    setSavingLoc(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_of_residence: locCountry.trim(), city: locCity.trim() }),
      });
      if (!res.ok) throw new Error();
      if (locCity.trim()) setCity(locCity.trim());
      else router.refresh();
    } catch {
      setLocError("Couldn't save that — try again.");
    } finally {
      setSavingLoc(false);
    }
  }

  /* ── Quick-create Stoop ──────────────────────────────────────*/
  async function submitHost() {
    if (hostSubmitting || !hostStoopName.trim() || !hostCity.trim()) return;
    setHostSubmitting(true);
    setHostError("");
    try {
      const res = await fetch("/api/cluster/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: hostStoopName.trim(),
          city: hostCity.trim(),
          street: "",
          country: viewerCountry || "",
          meeting_day: hostDay,
          meeting_time: hostTime.trim(),
          host_note: hostVibe.trim(),
          venue_type: "other",
          realistic_capacity: 10,
          accessible: 0,
          address_visible: "members_only",
          locality_confirmed: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHostError(data?.message || "Couldn't start that Stoop right now.");
        return;
      }
      setShowHostModal(false);
      if (data?.id) router.push(`/cluster/${data.id}`);
    } catch {
      setHostError("Couldn't start that Stoop right now.");
    } finally {
      setHostSubmitting(false);
    }
  }

  /* ── Membership ──────────────────────────────────────────── */
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

  /* ── Near You rail ─────────────────────────────────────────── */
  useEffect(() => {
    if (loadingInitial || myCluster) { setNearYou([]); return; }
    if (!primaryLocation) { setNearYou([]); return; }
    let cancelled = false;
    const params = new URLSearchParams({ per_page: String(RAIL_PER_PAGE) });
    if (city) params.set("city", city);
    else if (geoCity) params.set("city", geoCity);
    else if (viewerCity) params.set("city", viewerCity);
    else if (viewerCountry) params.set("country", viewerCountry);
    fetch(`/api/cluster/discover?${params}`)
      .then((r) => (r.ok ? r.json() : { clusters: [] }))
      .then((d) => { if (!cancelled) setNearYou(d.clusters ?? []); })
      .catch(() => { if (!cancelled) setNearYou([]); });
    return () => { cancelled = true; };
  }, [loadingInitial, myCluster, city, geoCity, viewerCity, viewerCountry, primaryLocation]);

  /* ── Overflow rail ─────────────────────────────────────────── */
  useEffect(() => {
    if (loadingInitial || !myCluster) { setOverflow([]); return; }
    let cancelled = false;
    const params = new URLSearchParams({ per_page: String(RAIL_PER_PAGE) });
    const loc = city || geoCity || myCluster.city || viewerCity;
    if (loc) params.set("city", loc);
    else if (viewerCountry) params.set("country", viewerCountry);
    fetch(`/api/cluster/discover?${params}`)
      .then((r) => (r.ok ? r.json() : { clusters: [] }))
      .then((d) => {
        if (cancelled) return;
        const list: Cluster[] = (d.clusters ?? []).filter((c: Cluster) => c.id !== myCluster!.id);
        setOverflow(list);
      })
      .catch(() => { if (!cancelled) setOverflow([]); });
    return () => { cancelled = true; };
  }, [loadingInitial, myCluster, city, geoCity, viewerCity, viewerCountry]);

  /* ── Explore grid ──────────────────────────────────────────── */
  const fetchPage = useCallback(async (off: number, replace: boolean) => {
    const params = new URLSearchParams({
      per_page: String(PER_PAGE),
      page: String(Math.floor(off / PER_PAGE) + 1),
    });
    if (city) params.set("city", city);
    else if (geoCity) params.set("city", geoCity);
    else if (viewerCity) params.set("city", viewerCity);
    else if (viewerCountry) params.set("country", viewerCountry);
    const res = await fetch(`/api/cluster/discover?${params}`);
    const data = res.ok ? await res.json() : { clusters: [] };
    const clusters: Cluster[] = data.clusters ?? [];
    setEntries((prev) => (replace ? clusters : [...prev, ...clusters]));
    setHasMore(clusters.length >= PER_PAGE);
    setOffset(off + clusters.length);
  }, [city, geoCity, viewerCity, viewerCountry]);

  useEffect(() => {
    if (loadingInitial) return;
    fetchPage(0, true);
  }, [loadingInitial, fetchPage]);

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

  /* Category-filtered grid entries */
  const filteredEntries = category === "all"
    ? entries
    : entries.filter((c) => clusterCategory(c) === category);

  const displayCount = category === "all" ? entries.length : filteredEntries.length;
  const cityDisplay = city || geoCity || viewerCity || (viewerCountry || null);

  if (loadingInitial) {
    return <div className="stoop-loading">Loading Stoops…</div>;
  }

  return (
    <>
      {/* ── Hero banner ───────────────────────────────────────── */}
      <div className="stoop-hero">
        <div className="stoop-hero-content">
          <span className="stoop-hero-badge">Stoop IRL Gatherings</span>
          <h2 className="stoop-hero-heading">Real-world cultural meetups, vinyl sessions &amp; neighbourhood stoops.</h2>
          <p className="stoop-hero-sub">
            Connect with creators, readers, and listeners in your city.
            Small groups, weekly rhythm, real culture.
          </p>
          <div className="stoop-hero-actions">
            <button
              type="button"
              className="stoop-hero-btn stoop-hero-btn--primary"
              onClick={() => setShowHostModal(true)}
            >
              + Start a Stoop
            </button>
            <button
              type="button"
              className="stoop-hero-btn stoop-hero-btn--ghost"
              onClick={detectCity}
              disabled={geoLoading}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
              {geoLoading ? "Detecting…" : cityDisplay ? `Change City: ${cityDisplay}` : "Detect Location"}
            </button>
          </div>
        </div>
        <div className="stoop-hero-art" aria-hidden="true" />
      </div>

      {/* ── Location prompt (no city on profile & geolocation declined) ── */}
      {needsLocation && !myCluster && (
        <div className="stoop-loc-prompt">
          <div className="stoop-loc-copy">
            <h3>Where are you?</h3>
            <p>
              Tell us your city and we&apos;ll show the Stoops forming near you.
              Only the area is ever shown to other members, never your address.
            </p>
          </div>
          <div className="stoop-loc-fields">
            <CountrySelect
              id="stoop-loc-country"
              value={locCountry}
              onChange={setLocCountry}
              inputClassName="stoop-loc-input"
              placeholder="Country"
            />
            <CitySelect
              id="stoop-loc-city"
              country={locCountry}
              value={locCity}
              onChange={setLocCity}
              inputClassName="stoop-loc-input"
            />
            <button type="button" className="stoop-loc-save" onClick={saveLocation} disabled={savingLoc}>
              {savingLoc ? "Saving…" : "Show me Stoops"}
            </button>
          </div>
          {locError && <p className="stoop-loc-error">{locError}</p>}
        </div>
      )}

      {/* ── Category filter chips ─────────────────────────────── */}
      <div className="stoop-cats-row">
        <div className="stoop-cats-chips">
          {(Object.keys(CAT_LABELS) as StCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`stoop-cat-chip${category === cat ? " stoop-cat-chip--active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {CAT_LABELS[cat]}
            </button>
          ))}
        </div>
        {displayCount > 0 && (
          <span className="stoop-cats-count">
            Showing {displayCount} stoop{displayCount !== 1 ? "s" : ""}
            {cityDisplay ? ` near ${cityDisplay}` : ""}
          </span>
        )}
      </div>

      {/* ── Member's own Stoop card ───────────────────────────── */}
      {myCluster && (
        <div className="stoop-my-card">
          <p className="stoop-my-eyebrow">
            <span className="stoop-my-live" aria-hidden="true" />
            Your Stoop
          </p>
          <div className="stoop-my-body">
            <div>
              <Link href={`/cluster/${myCluster.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <h2 className="stoop-my-name">{myCluster.name}</h2>
                <p className="stoop-my-meta">
                  📍 {[myCluster.street, myCluster.city].filter(Boolean).join(", ") || "Location TBC"}
                  {" "}<span className="ys-meta-note">(exact address for members only)</span>
                </p>
                {myCluster.meetingDay && myCluster.meetingTime && (
                  <p className="stoop-my-meta">
                    🗓 Every <b>{capitalize(myCluster.meetingDay)}</b>, {myCluster.meetingTime}
                    {myCluster.venueType ? ` · ${VENUE_LABEL[myCluster.venueType] ?? myCluster.venueType}` : ""}
                  </p>
                )}
              </Link>
              {myMembers.length > 0 && (
                <div className="ys-members">
                  {myMembers.map((m) => (
                    <span key={m.id} className="ys-avatar" style={{ background: avatarColor(m.id) }} aria-hidden="true">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  {myClusterCount > myMembers.length && (
                    <span className="ys-members-count">+ {myClusterCount - myMembers.length} more</span>
                  )}
                </div>
              )}
            </div>
            <div className="ys-actions">
              <Link href={`/cluster/${myCluster.id}`} className="ys-btn-ghost">View Members</Link>
              <Link href={`/cluster/${myCluster.id}#checkin`} className="ys-btn-primary">Open Check-in QR →</Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Overflow rail (member's area, other Stoops) ──────── */}
      {myCluster && overflow.length > 0 && (
        <>
          <p className="stoop-sec-heading">More{locationLabel ? ` in ${locationLabel}` : ""}</p>
          <p className="stoop-sec-sub">Overflow welcome — join a second Stoop if yours is full on a given week.</p>
          <div className="stoop-rail">
            {overflow.map((c) => (
              <RailCard
                key={c.id}
                cluster={c}
                joining={joiningId === c.id}
                error={joinError?.id === c.id ? joinError.message : ""}
                onJoin={() => join(c.id)}
                overflow
              />
            ))}
          </div>
        </>
      )}

      {/* ── Near You rail (non-members with a known location) ─── */}
      {!myCluster && nearYou.length > 0 && (
        <>
          <p className="stoop-sec-heading">Near You{locationLabel ? ` · ${locationLabel}` : ""}</p>
          <div className="stoop-rail" style={{ marginBottom: 28 }}>
            {nearYou.map((c) => (
              <RailCard
                key={c.id}
                cluster={c}
                joining={joiningId === c.id}
                error={joinError?.id === c.id ? joinError.message : ""}
                onJoin={() => join(c.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Inline detail panel ──────────────────────────────── */}
      {selectedClusterId !== null ? (
        <StoopDetailPanel
          clusterId={selectedClusterId}
          onBack={() => setSelectedClusterId(null)}
        />
      ) : (
        <>
          {/* ── Main stoop grid ──────────────────────────────────── */}
          {filteredEntries.length === 0 && !myCluster ? (
            <div className="stoop-empty">
              <span className="stoop-empty-icon" aria-hidden="true">🚪</span>
              <h4>No Stoop near you yet.</h4>
              <p>Be the first to start one in your area — it takes about 5 minutes and Moveee handles the rest.</p>
              <button
                type="button"
                className="stoop-hero-btn stoop-hero-btn--primary"
                style={{ margin: "0 auto" }}
                onClick={() => setShowHostModal(true)}
              >
                Start a Stoop →
              </button>
            </div>
          ) : filteredEntries.length > 0 ? (
            <>
              <div className="stoop-grid">
                {filteredEntries.map((c) => (
                  <StoopCard
                    key={c.id}
                    cluster={c}
                    joining={joiningId === c.id}
                    error={joinError?.id === c.id ? joinError.message : ""}
                    onJoin={() => join(c.id)}
                    onSelect={() => setSelectedClusterId(c.id)}
                  />
                ))}
              </div>
              {category === "all" && (hasMore ? (
                <button type="button" className="stoop-load-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              ) : (
                <div className="stoop-count">Showing all {entries.length} Stoop{entries.length !== 1 ? "s" : ""}</div>
              ))}
            </>
          ) : null}
        </>
      )}

      {/* ── "Start a Stoop" quick modal ──────────────────────── */}
      {showHostModal && (
        <div
          className="stoop-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowHostModal(false); }}
        >
          <div className="stoop-modal-card" role="dialog" aria-modal="true" aria-label="Start a Stoop">
            <div className="stoop-modal-header">
              <h3 className="stoop-modal-title">Start a Stoop</h3>
              <button
                type="button"
                className="stoop-modal-close"
                onClick={() => setShowHostModal(false)}
                aria-label="Close"
              >✕</button>
            </div>
            <div className="stoop-modal-body">
              <label className="stoop-modal-label" htmlFor="shost-name">Stoop name</label>
              <input
                id="shost-name"
                type="text"
                className="stoop-modal-input"
                placeholder="e.g. Allen Avenue Stoop"
                value={hostStoopName}
                onChange={(e) => setHostStoopName(e.target.value)}
              />

              <div className="stoop-modal-row">
                <div>
                  <label className="stoop-modal-label" htmlFor="shost-city">City / Neighbourhood</label>
                  <input
                    id="shost-city"
                    type="text"
                    className="stoop-modal-input"
                    placeholder="e.g. Peckham, London"
                    value={hostCity}
                    onChange={(e) => setHostCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="stoop-modal-label" htmlFor="shost-day">Meeting day</label>
                  <select
                    id="shost-day"
                    className="stoop-modal-input"
                    value={hostDay}
                    onChange={(e) => setHostDay(e.target.value)}
                  >
                    {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((d) => (
                      <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="stoop-modal-label" htmlFor="shost-time">Meeting time</label>
                  <input
                    id="shost-time"
                    type="text"
                    className="stoop-modal-input"
                    placeholder="e.g. 6:30pm"
                    value={hostTime}
                    onChange={(e) => setHostTime(e.target.value)}
                  />
                </div>
              </div>

              <label className="stoop-modal-label" htmlFor="shost-vibe">Vibe &amp; details (optional)</label>
              <textarea
                id="shost-vibe"
                className="stoop-modal-input stoop-modal-textarea"
                rows={3}
                placeholder="What's the vibe? Vinyl sessions, book circle, cooking together…"
                value={hostVibe}
                onChange={(e) => setHostVibe(e.target.value)}
              />

              {hostError && <p className="stoop-detail-error">{hostError}</p>}

              <p className="stoop-modal-note">
                You can add address, capacity, and privacy settings after creation. Needs at least 4 members to activate.
              </p>

              <button
                type="button"
                className="stoop-modal-submit"
                disabled={hostSubmitting || !hostStoopName.trim() || !hostCity.trim()}
                onClick={submitHost}
              >
                {hostSubmitting ? "Starting…" : "Publish Stoop →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── RailCard (compact horizontal card, unchanged logic) ─────── */
function RailCard({
  cluster, joining, error, onJoin, overflow,
}: {
  cluster: Cluster; joining: boolean; error?: string; onJoin: () => void; overflow?: boolean;
}) {
  const badge = capacityBadge(cluster.memberCount, cluster.capacity);
  return (
    <div className="stoop-rail-card">
      <span className={`stoop-rail-badge${badge.tone === "filling" ? " stoop-rail-badge--filling" : ""}`}>
        {badge.label}
      </span>
      {cluster.meetingDay && cluster.meetingTime && (
        <p className="stoop-rail-day">{capitalize(cluster.meetingDay)}s · {cluster.meetingTime}</p>
      )}
      <h3 className="stoop-rail-name">{cluster.name}</h3>
      <p className="stoop-rail-loc">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/><circle cx="12" cy="9" r="2.5"/>
        </svg>
        {cluster.city || "Area not set"}
      </p>
      <div className="stoop-cap-wrap">
        <div className="stoop-cap-track">
          <div
            className="stoop-cap-fill"
            style={{ width: `${cluster.capacity > 0 ? Math.min(100, (cluster.memberCount / cluster.capacity) * 100) : 20}%` }}
          />
        </div>
        <span className="stoop-cap-label">
          {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} members
        </span>
      </div>
      {error && <p className="stoop-detail-error" style={{ marginBottom: 8 }}>{error}</p>}
      <button
        type="button"
        className="stoop-rail-join"
        onClick={onJoin}
        disabled={joining || badge.tone === "full"}
      >
        {joining ? "Joining…" : badge.tone === "full" ? "Full" : overflow ? "Join as Overflow →" : "Join Stoop →"}
      </button>
    </div>
  );
}

/* ─── StoopCard — cover-photo card (replaces GridCard) ─────────── */
function StoopCard({
  cluster, joining, error, onJoin, onSelect,
}: {
  cluster: Cluster; joining: boolean; error?: string; onJoin: () => void; onSelect: () => void;
}) {
  const badge = capacityBadge(cluster.memberCount, cluster.capacity);
  const dateBadge = cluster.meetingDay
    ? `${capitalize(cluster.meetingDay)}s${cluster.meetingTime ? ` · ${cluster.meetingTime}` : ""}`
    : "";

  return (
    <div className="stoop-card" onClick={onSelect} style={{ cursor: "pointer" }}>
      {/* Cover photo — gradient until clusters have imageUrl */}
      <div className="stoop-card-cover" style={{ background: coverGrad(cluster.id) }}>
        {dateBadge && <span className="stoop-card-date-badge">{dateBadge}</span>}
        <div className="stoop-card-cover-dots" aria-hidden="true" />
      </div>

      {/* Card body */}
      <div className="stoop-card-body">
        {cluster.hostName && (
          <div className="stoop-card-host">
            <span
              className="stoop-card-host-av"
              style={{ background: avatarColor(cluster.hostId || cluster.id) }}
            >
              {cluster.hostName.charAt(0).toUpperCase()}
            </span>
            <span className="stoop-card-host-label">Host: {cluster.hostName.split(" ")[0]}</span>
          </div>
        )}

        <h4 className="stoop-card-name">{cluster.name}</h4>

        {cluster.venueType && (
          <p className="stoop-card-venue">{VENUE_LABEL[cluster.venueType] ?? cluster.venueType}</p>
        )}

        <div className="stoop-card-footer">
          <span className="stoop-card-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
            {cluster.city || "Location TBC"}
          </span>
          <div>
            {error && <p className="stoop-detail-error" style={{ marginBottom: 4 }}>{error}</p>}
            <button
              type="button"
              className={`stoop-card-rsvp${badge.tone === "full" ? " stoop-card-rsvp--full" : ""}`}
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              disabled={joining || badge.tone === "full"}
            >
              {joining
                ? "Joining…"
                : badge.tone === "full"
                ? "Full"
                : `RSVP (${cluster.memberCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
