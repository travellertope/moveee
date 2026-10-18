"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const StoopChatterBox = dynamic(() => import("../pulse/StoopChatterBox"), { ssr: false });

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#7a241c","#1976d2","#2e7d32","#b38238","#6b48a8","#8d6e63",
  "#7b1fa2","#c2185b","#00695c","#37474f","#283593","#5d4037",
];
function avatarColor(id: number | string): string {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

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

const VENUE_LABEL: Record<string, string> = {
  home: "Home", cafe: "Café", coworking: "Coworking", other: "Venue",
};

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ── Gatherings ────────────────────────────────────────────────────────────────

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

interface Gathering {
  id: string;
  date: string;
  isoDate: string;
  title: string;
  rsvp: "attending" | "declined" | null;
  attendingCount?: number;
}

function nextOccurrences(meetingDay: string, meetingTime: string, count = 3): Gathering[] {
  const dayIdx = DAY_INDEX[meetingDay.toLowerCase()];
  if (dayIdx === undefined) return [];
  const out: Gathering[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let tries = 0; tries < 60 && out.length < count; tries++) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === dayIdx) {
      const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      const iso = d.toISOString().split("T")[0];
      out.push({ id: iso, date: label + (meetingTime ? ` · ${meetingTime}` : ""), isoDate: iso, title: "Weekly Gathering", rsvp: null });
    }
  }
  return out;
}

function StoopGatheringsSection({ clusterId, meetingDay, meetingTime, isMember, isHost }: {
  clusterId: number; meetingDay: string; meetingTime: string; isMember: boolean; isHost: boolean;
}) {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [rsvpState, setRsvpState] = useState<Record<string, "attending" | "declined">>({});
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const todayIso = new Date().toISOString().split("T")[0];

  function loadAgenda() {
    fetch(`/api/cluster/${clusterId}/agenda`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : { gatherings: [] })
      .then(data => {
        if (data.gatherings?.length > 0) {
          const mapped = data.gatherings.map((g: any) => ({
            id: g.id ?? g.isoDate ?? String(g.date),
            date: g.date_label ?? g.date,
            isoDate: g.iso_date ?? g.isoDate ?? "",
            title: g.title ?? "Weekly Gathering",
            rsvp: g.rsvp ?? null,
            attendingCount: g.attending_count ?? 0,
          }));
          setGatherings(mapped);
          const init: Record<string, "attending" | "declined"> = {};
          data.gatherings.forEach((g: any) => { if (g.rsvp) init[g.id ?? g.isoDate] = g.rsvp; });
          setRsvpState(init);
        } else if (meetingDay) {
          setGatherings(nextOccurrences(meetingDay, meetingTime));
        }
      })
      .catch(() => { if (meetingDay) setGatherings(nextOccurrences(meetingDay, meetingTime)); });
  }

  useEffect(() => { loadAgenda(); }, [clusterId, meetingDay, meetingTime]);

  async function handleRsvp(gatheringId: string, status: "attending" | "declined") {
    const current = rsvpState[gatheringId];
    const next = current === status ? null : status;
    setRsvpState(prev => {
      const u = { ...prev };
      if (next === null) delete u[gatheringId]; else u[gatheringId] = next;
      return u;
    });
    setRsvpLoading(prev => ({ ...prev, [gatheringId]: true }));
    try {
      await fetch(`/api/cluster/${clusterId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gathering_id: gatheringId, rsvp: next }),
      });
    } catch {}
    setRsvpLoading(prev => ({ ...prev, [gatheringId]: false }));
  }

  async function handleAddGathering(e: React.FormEvent) {
    e.preventDefault();
    if (!addDate || !addTitle.trim()) return;
    setAddSaving(true); setAddError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: addDate, title: addTitle.trim(), description: addDesc.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAddError(err.message ?? "Could not save meetup.");
      } else {
        setShowAddForm(false); setAddDate(""); setAddTitle(""); setAddDesc("");
        loadAgenda();
      }
    } catch { setAddError("Network error — please try again."); }
    setAddSaving(false);
  }

  if (!meetingDay && gatherings.length === 0) {
    return (
      <div className="stoop-dp-section">
        <h3 className="stoop-dp-section-heading">Upcoming Meetups</h3>
        <p className="stoop-dp-empty-tab">No meetups scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="stoop-dp-section">
      <div className="stoop-gather-heading-row">
        <h3 className="stoop-dp-section-heading">Upcoming Meetups</h3>
        {isHost && (
          <button type="button" className="stoop-gather-add-btn" onClick={() => setShowAddForm(v => !v)}>
            {showAddForm ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {showAddForm && (
        <form className="stoop-gather-add-form" onSubmit={handleAddGathering}>
          <input type="date" className="stoop-gather-add-input" value={addDate} min={todayIso}
            onChange={e => setAddDate(e.target.value)} required />
          <input type="text" className="stoop-gather-add-input" placeholder="Meetup title"
            value={addTitle} onChange={e => setAddTitle(e.target.value)} maxLength={120} required />
          <input type="text" className="stoop-gather-add-input" placeholder="Short description (optional)"
            value={addDesc} onChange={e => setAddDesc(e.target.value)} maxLength={280} />
          {addError && <p className="stoop-gather-add-error">{addError}</p>}
          <button type="submit" className="stoop-gather-save-btn" disabled={addSaving}>
            {addSaving ? "Saving…" : "Save Meetup"}
          </button>
        </form>
      )}

      <div className="stoop-gather-list">
        {gatherings.map(g => {
          const myRsvp = rsvpState[g.id] ?? null;
          const busy = rsvpLoading[g.id];
          return (
            <div key={g.id} className="stoop-gather-row">
              <div className="stoop-gather-info">
                <span className="stoop-gather-date">{g.date}</span>
                <span className="stoop-gather-title">{g.title}</span>
                {(g.attendingCount ?? 0) > 0 && (
                  <span className="stoop-gather-attending">{g.attendingCount} going</span>
                )}
              </div>
              {isMember ? (
                <div className="stoop-gather-rsvp-btns">
                  <button type="button"
                    className={`stoop-gather-btn${myRsvp === "attending" ? " stoop-gather-btn--yes" : ""}`}
                    onClick={() => handleRsvp(g.id, "attending")} disabled={busy}>
                    {myRsvp === "attending" ? "Going ✓" : "Going"}
                  </button>
                  <button type="button"
                    className={`stoop-gather-btn${myRsvp === "declined" ? " stoop-gather-btn--no" : ""}`}
                    onClick={() => handleRsvp(g.id, "declined")} disabled={busy}>
                    {myRsvp === "declined" ? "Can't Make It" : "Can't Go"}
                  </button>
                </div>
              ) : (
                <span className="stoop-gather-locked">Join to RSVP</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

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
  locationNote?: string;
  coverImageUrl?: string;
  avatarUrl?: string;
  tags?: string[];
}

interface ClusterStatus {
  isMember: boolean;
  role: string;
  joinedAt?: string;
}

interface ClusterMember {
  id: number;
  name: string;
  avatarUrl: string;
  role: string;
}

type TabId = "about" | "meetups" | "chat" | "members";

interface Props {
  clusterId: number;
  onBack: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StoopDetailPanel({ clusterId, onBack }: Props) {
  const router = useRouter();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [status, setStatus] = useState<ClusterStatus | null>(null);
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    async function load() {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch(`/api/cluster/${clusterId}`, { cache: "no-store" }),
          fetch(`/api/cluster/${clusterId}/status`, { cache: "no-store" }),
        ]);
        if (!cRes.ok) { if (!cancelled) setError(true); return; }
        const clusterData = await cRes.json();
        const statusData = sRes.ok ? await sRes.json() : { isMember: false, role: "" };
        if (cancelled) return;
        setCluster(clusterData);
        setStatus(statusData);
        if (statusData.isMember) {
          const mRes = await fetch(`/api/cluster/${clusterId}/members`, { cache: "no-store" });
          if (!cancelled) {
            const mData = mRes.ok ? await mRes.json() : { members: [] };
            setMembers(mData.members ?? []);
          }
        }
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [clusterId]);

  async function handleJoin() {
    if (actionLoading || !cluster) return;
    setActionLoading(true); setActionError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/join`, { method: "POST" });
      if (res.ok) { router.push(`/cluster/${clusterId}`); return; }
      const data = await res.json().catch(() => ({}));
      setActionError(data?.message || "Could not join right now.");
    } catch { setActionError("Could not join right now."); }
    finally { setActionLoading(false); }
  }

  async function handleLeave() {
    if (actionLoading || !cluster) return;
    if (!confirm(`Leave ${cluster.name}?`)) return;
    setActionLoading(true); setActionError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/leave`, { method: "POST" });
      if (res.ok) {
        setStatus({ isMember: false, role: "" }); setMembers([]);
        setCluster(prev => prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : prev);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setActionError(data?.message || "Could not leave right now.");
    } catch { setActionError("Could not leave right now."); }
    finally { setActionLoading(false); }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "cover");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/photo`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setCluster(prev => prev ? { ...prev, coverImageUrl: data.url } : prev);
      }
    } catch {}
    setCoverUploading(false);
    e.target.value = "";
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "avatar");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/photo`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setCluster(prev => prev ? { ...prev, avatarUrl: data.url } : prev);
      }
    } catch {}
    setAvatarUploading(false);
    e.target.value = "";
  }

  if (loading) return (
    <div className="stoop-dp-root">
      <button type="button" className="stoop-dp-back" onClick={onBack}>← Back to Stoop IRL</button>
      <div className="stoop-dp-loading">Loading stoop details…</div>
    </div>
  );

  if (error || !cluster) return (
    <div className="stoop-dp-root">
      <button type="button" className="stoop-dp-back" onClick={onBack}>← Back to Stoop IRL</button>
      <div className="stoop-dp-error">
        <p>Could not load this Stoop.</p>
        <button type="button" className="stoop-dp-retry" onClick={onBack}>Go back</button>
      </div>
    </div>
  );

  const isMember = status?.isMember ?? false;
  const isHost = status?.role === "host";
  const isFull = cluster.capacity > 0 && cluster.memberCount >= cluster.capacity;
  const scheduleLabel = cluster.meetingDay
    ? `Every ${capitalize(cluster.meetingDay)}${cluster.meetingTime ? ` · ${cluster.meetingTime}` : ""}`
    : null;
  const venueLabel = cluster.venueType ? (VENUE_LABEL[cluster.venueType] ?? cluster.venueType) : null;
  const locationDisplay = [cluster.street, cluster.city, cluster.country].filter(Boolean).join(", ");
  const displayedMembers = members.slice(0, 24);
  const extraCount = members.length > 24 ? members.length - 24 : 0;

  const TABS: { id: TabId; label: string }[] = [
    { id: "chat",    label: "Chat" },
    { id: "about",   label: "About" },
    { id: "meetups", label: "Meetups" },
    { id: "members", label: `Members${isMember && members.length > 0 ? ` (${members.length})` : ""}` },
  ];

  return (
    <div className="stoop-dp-root">

      {/* Back */}
      <button type="button" className="stoop-dp-back" onClick={onBack}>← Back to Stoop IRL</button>

      {/* Cover */}
      <div
        className="stoop-dp-cover"
        style={cluster.coverImageUrl
          ? { backgroundImage: `url(${cluster.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: coverGrad(cluster.id) }
        }
      >
        <div className="stoop-dp-cover-dots" aria-hidden="true" />

        {isHost && (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={handleCoverUpload} />
            <button type="button" className="stoop-dp-cover-edit-btn"
              onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
              title="Change cover photo">
              {coverUploading
                ? <span className="stoop-dp-cover-edit-spinner" />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
              }
              Edit cover
            </button>
          </>
        )}

        <div className="stoop-dp-cover-content">
          {cluster.city && (
            <span className="stoop-dp-cover-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {cluster.city}
            </span>
          )}
          <h2 className="stoop-dp-title">{cluster.name}</h2>
          <div className="stoop-dp-cover-meta-row">
            {scheduleLabel && (
              <span className="stoop-dp-schedule">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {scheduleLabel}{venueLabel && ` · ${venueLabel}`}
              </span>
            )}
            <span className="stoop-dp-schedule">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} member{cluster.memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Avatar + action bar */}
      <div className="stoop-dp-action-bar">
        <div className="stoop-dp-host-row">
          <div className="stoop-dp-stoop-avatar-wrap">
            {cluster.avatarUrl
              ? <img src={cluster.avatarUrl} alt={cluster.name} className="stoop-dp-stoop-avatar-img" />
              : <span className="stoop-dp-stoop-avatar-fallback" style={{ background: avatarColor(cluster.id) }} aria-hidden="true">
                  {cluster.name.charAt(0).toUpperCase()}
                </span>
            }
            {isHost && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={handleAvatarUpload} />
                <button type="button" className="stoop-dp-avatar-edit-btn"
                  onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}
                  title="Change display photo" aria-label="Change display photo">
                  {avatarUploading
                    ? <span className="stoop-dp-cover-edit-spinner" style={{ width: 10, height: 10 }} />
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                  }
                </button>
              </>
            )}
          </div>
          <div className="stoop-dp-host-info">
            {cluster.hostName && (
              <span className="stoop-dp-host-name">Hosted by {cluster.hostName.split(" ")[0]}</span>
            )}
            <span className="stoop-dp-member-count">
              {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} member{cluster.memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="stoop-dp-join-col">
          {actionError && <p className="stoop-dp-action-error">{actionError}</p>}
          {isHost ? (
            <Link href={`/cluster/${clusterId}`} className="stoop-dp-btn stoop-dp-btn--primary">
              Manage Stoop →
            </Link>
          ) : isMember ? (
            <button type="button" className="stoop-dp-btn stoop-dp-btn--leave"
              onClick={handleLeave} disabled={actionLoading}>
              {actionLoading ? "Leaving…" : "Leave Stoop"}
            </button>
          ) : (
            <button type="button"
              className={`stoop-dp-btn${isFull ? " stoop-dp-btn--disabled" : " stoop-dp-btn--primary"}`}
              onClick={handleJoin} disabled={actionLoading || isFull}>
              {actionLoading ? "Joining…" : isFull ? "Stoop Full" : "Join Stoop →"}
            </button>
          )}
        </div>
      </div>

      {/* Capacity bar */}
      {cluster.capacity > 0 && (
        <div className="stoop-dp-cap-row">
          <div className="stoop-dp-cap-track">
            <div className="stoop-dp-cap-fill"
              style={{ width: `${Math.min(100, (cluster.memberCount / cluster.capacity) * 100)}%` }} />
          </div>
          <span className="stoop-dp-cap-label">
            {cluster.capacity - cluster.memberCount > 0
              ? `${cluster.capacity - cluster.memberCount} spot${cluster.capacity - cluster.memberCount === 1 ? "" : "s"} left`
              : "Full"}
          </span>
        </div>
      )}

      {/* Tab nav */}
      <div className="stoop-dp-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={activeTab === t.id}
            className={`stoop-dp-tab${activeTab === t.id ? " stoop-dp-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── About ─────────────────────────────────────────── */}
      {activeTab === "about" && (
        <>
          {(cluster.hostMechanism || (cluster.tags && cluster.tags.length > 0)) && (
            <div className="stoop-dp-section">
              <h3 className="stoop-dp-section-heading">About This Stoop</h3>
              {cluster.tags && cluster.tags.length > 0 && (
                <div className="stoop-dp-vibe-tags">
                  {cluster.tags.map(tag => (
                    <span key={tag} className="stoop-dp-vibe-tag">{tag}</span>
                  ))}
                </div>
              )}
              {cluster.hostMechanism && <p className="stoop-dp-about">{cluster.hostMechanism}</p>}
            </div>
          )}

          <div className="stoop-dp-section">
            <h3 className="stoop-dp-section-heading">Meeting Spot</h3>
            {isMember ? (
              <div className="stoop-dp-address-unlocked">
                <svg className="stoop-dp-unlock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
                <div>
                  <p className="stoop-dp-address-line">{locationDisplay || cluster.city || "Location TBC"}</p>
                  {cluster.locationNote && <p className="stoop-dp-location-note">{cluster.locationNote}</p>}
                  {cluster.accessible && <span className="stoop-dp-accessible-badge">♿ Accessible venue</span>}
                </div>
              </div>
            ) : (
              <div className="stoop-dp-address-locked">
                <svg className="stoop-dp-lock-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <div>
                  <p className="stoop-dp-locked-label">Exact address is members-only</p>
                  <p className="stoop-dp-locked-sub">Join the Stoop to unlock the full meeting spot and host contact.</p>
                </div>
              </div>
            )}
          </div>

          {scheduleLabel && (
            <div className="stoop-dp-section">
              <h3 className="stoop-dp-section-heading">Schedule</h3>
              <div className="stoop-dp-schedule-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <div>
                  <p className="stoop-dp-schedule-label">{scheduleLabel}</p>
                  {venueLabel && <p className="stoop-dp-schedule-venue">{venueLabel}</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Meetups ───────────────────────────────────────── */}
      {activeTab === "meetups" && (
        <StoopGatheringsSection
          clusterId={clusterId}
          meetingDay={cluster.meetingDay ?? ""}
          meetingTime={cluster.meetingTime ?? ""}
          isMember={isMember}
          isHost={isHost}
        />
      )}

      {/* ── Stoop Chat ────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div className="stoop-dp-section stoop-dp-section--chat">
          <StoopChatterBox clusterId={clusterId} isMember={isMember} />
        </div>
      )}

      {/* ── Members ───────────────────────────────────────── */}
      {activeTab === "members" && (
        <div className="stoop-dp-section">
          <h3 className="stoop-dp-section-heading">Members</h3>
          {isMember && members.length > 0 ? (
            <div className="stoop-dp-member-pills">
              {displayedMembers.map(m => (
                <span key={m.id} className="stoop-dp-member-pill">
                  <span className="stoop-dp-member-pill-av" style={{ background: avatarColor(m.id) }} aria-hidden="true">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  {m.name.split(" ")[0]}
                  {m.role === "host" && <span className="stoop-dp-member-role">(Host)</span>}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="stoop-dp-member-pill stoop-dp-member-pill--more">+{extraCount} more</span>
              )}
            </div>
          ) : !isMember ? (
            <div className="stoop-dp-lock-section">
              <svg className="stoop-dp-lock-section-icon" width="28" height="28" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p className="stoop-dp-lock-section-title">Members only</p>
              <p className="stoop-dp-lock-section-desc">Join this Stoop to see who else is in the crew.</p>
            </div>
          ) : (
            <p className="stoop-dp-empty-tab">No members yet — you're the first!</p>
          )}
        </div>
      )}

    </div>
  );
}
