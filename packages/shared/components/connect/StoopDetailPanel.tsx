"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const StoopChatterBox = dynamic(() => import("../pulse/StoopChatterBox"), { ssr: false });

// ── Gatherings ────────────────────────────────────────────────────────────────

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

interface Gathering {
  id: string;
  date: string;        // display label e.g. "Sat 18 Jan"
  isoDate: string;     // YYYY-MM-DD for API key
  title: string;
  rsvp: "attending" | "declined" | null;
}

function nextOccurrences(meetingDay: string, meetingTime: string, count = 3): Gathering[] {
  const dayIdx = DAY_INDEX[meetingDay.toLowerCase()];
  if (dayIdx === undefined) return [];
  const now = new Date();
  const out: Gathering[] = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  for (let tries = 0; tries < 60 && out.length < count; tries++) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === dayIdx) {
      const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      const iso = d.toISOString().split("T")[0];
      out.push({
        id: iso,
        date: label + (meetingTime ? ` · ${meetingTime}` : ""),
        isoDate: iso,
        title: "Weekly Gathering",
        rsvp: null,
      });
    }
  }
  return out;
}

function StoopGatheringsSection({ clusterId, meetingDay, meetingTime, isMember, isHost }: {
  clusterId: number;
  meetingDay: string;
  meetingTime: string;
  isMember: boolean;
  isHost: boolean;
}) {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [rsvpState, setRsvpState] = useState<Record<string, "attending" | "declined">>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

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
          }));
          setGatherings(mapped);
          const init: Record<string, "attending" | "declined"> = {};
          data.gatherings.forEach((g: any) => {
            if (g.rsvp) init[g.id ?? g.isoDate] = g.rsvp;
          });
          setRsvpState(init);
        } else if (meetingDay) {
          setGatherings(nextOccurrences(meetingDay, meetingTime));
        }
      })
      .catch(() => {
        if (meetingDay) setGatherings(nextOccurrences(meetingDay, meetingTime));
      });
  }

  useEffect(() => { loadAgenda(); }, [clusterId, meetingDay, meetingTime]);

  if (!meetingDay && gatherings.length === 0) return null;

  async function handleRsvp(gatheringId: string, status: "attending" | "declined") {
    const current = rsvpState[gatheringId];
    const next = current === status ? null : status;
    setRsvpState(prev => {
      const updated = { ...prev };
      if (next === null) delete updated[gatheringId];
      else updated[gatheringId] = next;
      return updated;
    });
    setLoading(prev => ({ ...prev, [gatheringId]: true }));
    try {
      await fetch(`/api/cluster/${clusterId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gathering_id: gatheringId, rsvp: next }),
      });
    } catch {}
    setLoading(prev => ({ ...prev, [gatheringId]: false }));
  }

  async function handleAddGathering(e: React.FormEvent) {
    e.preventDefault();
    if (!addDate || !addTitle.trim()) return;
    setAddSaving(true);
    setAddError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: addDate, title: addTitle.trim(), description: addDesc.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAddError(err.message ?? "Could not save gathering.");
      } else {
        setShowAddForm(false);
        setAddDate(""); setAddTitle(""); setAddDesc("");
        loadAgenda();
      }
    } catch {
      setAddError("Network error — please try again.");
    }
    setAddSaving(false);
  }

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div className="stoop-dp-section">
      <div className="stoop-gather-heading-row">
        <h3 className="stoop-dp-section-heading">Upcoming Gatherings</h3>
        {isHost && (
          <button
            type="button"
            className="stoop-gather-add-btn"
            onClick={() => setShowAddForm(v => !v)}
          >
            {showAddForm ? "Cancel" : "+ Add"}
          </button>
        )}
      </div>

      {showAddForm && (
        <form className="stoop-gather-add-form" onSubmit={handleAddGathering}>
          <input
            type="date"
            className="stoop-gather-add-input"
            value={addDate}
            min={todayIso}
            onChange={e => setAddDate(e.target.value)}
            required
          />
          <input
            type="text"
            className="stoop-gather-add-input"
            placeholder="Gathering title"
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            maxLength={120}
            required
          />
          <input
            type="text"
            className="stoop-gather-add-input"
            placeholder="Short description (optional)"
            value={addDesc}
            onChange={e => setAddDesc(e.target.value)}
            maxLength={280}
          />
          {addError && <p className="stoop-gather-add-error">{addError}</p>}
          <button type="submit" className="stoop-gather-save-btn" disabled={addSaving}>
            {addSaving ? "Saving…" : "Save Gathering"}
          </button>
        </form>
      )}

      <div className="stoop-gather-list">
        {gatherings.map(g => {
          const myRsvp = rsvpState[g.id] ?? null;
          const busy = loading[g.id];
          return (
            <div key={g.id} className="stoop-gather-row">
              <div className="stoop-gather-info">
                <span className="stoop-gather-date">{g.date}</span>
                <span className="stoop-gather-title">{g.title}</span>
              </div>
              {isMember ? (
                <div className="stoop-gather-rsvp-btns">
                  <button
                    type="button"
                    className={`stoop-gather-btn${myRsvp === "attending" ? " stoop-gather-btn--yes" : ""}`}
                    onClick={() => handleRsvp(g.id, "attending")}
                    disabled={busy}
                  >
                    {myRsvp === "attending" ? "Attending ✓" : "Attend"}
                  </button>
                  <button
                    type="button"
                    className={`stoop-gather-btn${myRsvp === "declined" ? " stoop-gather-btn--no" : ""}`}
                    onClick={() => handleRsvp(g.id, "declined")}
                    disabled={busy}
                  >
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
  hubId?: number;
  hubSlug?: string;
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

interface Props {
  clusterId: number;
  onBack: () => void;
}

export default function StoopDetailPanel({ clusterId, onBack }: Props) {
  const router = useRouter();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [status, setStatus] = useState<ClusterStatus | null>(null);
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

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
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [clusterId]);

  async function handleJoin() {
    if (actionLoading || !cluster) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/join`, { method: "POST" });
      if (res.ok) {
        router.push(`/cluster/${clusterId}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setActionError(data?.message || "Could not join right now.");
    } catch {
      setActionError("Could not join right now.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    if (actionLoading || !cluster) return;
    if (!confirm(`Leave ${cluster.name}?`)) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/cluster/${clusterId}/leave`, { method: "POST" });
      if (res.ok) {
        setStatus({ isMember: false, role: "" });
        setMembers([]);
        setCluster((prev) => prev ? { ...prev, memberCount: Math.max(0, prev.memberCount - 1) } : prev);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setActionError(data?.message || "Could not leave right now.");
    } catch {
      setActionError("Could not leave right now.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="stoop-dp-root">
        <button type="button" className="stoop-dp-back" onClick={onBack}>
          ← Back to Stoops
        </button>
        <div className="stoop-dp-loading">Loading stoop details…</div>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div className="stoop-dp-root">
        <button type="button" className="stoop-dp-back" onClick={onBack}>
          ← Back to Stoops
        </button>
        <div className="stoop-dp-error">
          <p>Could not load this Stoop.</p>
          <button type="button" className="stoop-dp-retry" onClick={onBack}>Go back</button>
        </div>
      </div>
    );
  }

  const isMember = status?.isMember ?? false;
  const isHost = status?.role === "host";
  const isFull = cluster.capacity > 0 && cluster.memberCount >= cluster.capacity;

  const scheduleLabel = cluster.meetingDay
    ? `Every ${capitalize(cluster.meetingDay)}${cluster.meetingTime ? ` · ${cluster.meetingTime}` : ""}`
    : null;

  const venueLabel = cluster.venueType ? (VENUE_LABEL[cluster.venueType] ?? cluster.venueType) : null;
  const locationDisplay = [cluster.street, cluster.city, cluster.country].filter(Boolean).join(", ");

  const displayedMembers = members.slice(0, 8);
  const extraCount = members.length > 8 ? members.length - 8 : 0;

  return (
    <div className="stoop-dp-root">
      {/* Back */}
      <button type="button" className="stoop-dp-back" onClick={onBack}>
        ← Back to Stoops
      </button>

      {/* Cover header */}
      <div className="stoop-dp-cover" style={{ background: coverGrad(cluster.id) }}>
        <div className="stoop-dp-cover-dots" aria-hidden="true" />
        <div className="stoop-dp-cover-content">
          {cluster.city && (
            <span className="stoop-dp-neighborhood">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {cluster.city}
            </span>
          )}
          <h2 className="stoop-dp-title">{cluster.name}</h2>
          {scheduleLabel && (
            <p className="stoop-dp-schedule">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {scheduleLabel}
              {venueLabel && ` · ${venueLabel}`}
            </p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="stoop-dp-action-bar">
        <div className="stoop-dp-host-row">
          {cluster.hostName && (
            <span
              className="stoop-dp-host-av"
              style={{ background: avatarColor(cluster.hostId || cluster.id) }}
              aria-hidden="true"
            >
              {cluster.hostName.charAt(0).toUpperCase()}
            </span>
          )}
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
            <button
              type="button"
              className="stoop-dp-btn stoop-dp-btn--leave"
              onClick={handleLeave}
              disabled={actionLoading}
            >
              {actionLoading ? "Leaving…" : "Leave Stoop"}
            </button>
          ) : (
            <button
              type="button"
              className={`stoop-dp-btn${isFull ? " stoop-dp-btn--disabled" : " stoop-dp-btn--primary"}`}
              onClick={handleJoin}
              disabled={actionLoading || isFull}
            >
              {actionLoading ? "Joining…" : isFull ? "Stoop Full" : "Join Stoop →"}
            </button>
          )}
        </div>
      </div>

      {/* Capacity bar */}
      {cluster.capacity > 0 && (
        <div className="stoop-dp-cap-row">
          <div className="stoop-dp-cap-track">
            <div
              className="stoop-dp-cap-fill"
              style={{ width: `${Math.min(100, (cluster.memberCount / cluster.capacity) * 100)}%` }}
            />
          </div>
          <span className="stoop-dp-cap-label">
            {cluster.capacity - cluster.memberCount > 0
              ? `${cluster.capacity - cluster.memberCount} spot${cluster.capacity - cluster.memberCount === 1 ? "" : "s"} left`
              : "Full"}
          </span>
        </div>
      )}

      {/* About */}
      {cluster.hostMechanism && (
        <div className="stoop-dp-section">
          <h3 className="stoop-dp-section-heading">About This Stoop</h3>
          <p className="stoop-dp-about">{cluster.hostMechanism}</p>
        </div>
      )}

      {/* Address — locked/unlocked */}
      <div className="stoop-dp-section">
        <h3 className="stoop-dp-section-heading">Meeting Spot</h3>
        {isMember ? (
          <div className="stoop-dp-address-unlocked">
            <svg className="stoop-dp-unlock-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
            <div>
              <p className="stoop-dp-address-line">{locationDisplay || cluster.city || "Location TBC"}</p>
              {cluster.locationNote && (
                <p className="stoop-dp-location-note">{cluster.locationNote}</p>
              )}
              {cluster.accessible && (
                <span className="stoop-dp-accessible-badge">♿ Accessible venue</span>
              )}
            </div>
          </div>
        ) : (
          <div className="stoop-dp-address-locked">
            <svg className="stoop-dp-lock-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Upcoming Weekly Gatherings */}
      <StoopGatheringsSection
        clusterId={clusterId}
        meetingDay={cluster.meetingDay ?? ""}
        meetingTime={cluster.meetingTime ?? ""}
        isMember={isMember}
        isHost={isHost}
      />

      {/* Members roster */}
      {isMember && members.length > 0 && (
        <div className="stoop-dp-section">
          <h3 className="stoop-dp-section-heading">Members</h3>
          <div className="stoop-dp-members-row">
            {displayedMembers.map((m) => (
              <span
                key={m.id}
                className="stoop-dp-member-chip"
                style={{ background: avatarColor(m.id) }}
                title={m.name}
              >
                {m.name.charAt(0).toUpperCase()}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="stoop-dp-member-extra">+{extraCount}</span>
            )}
          </div>
        </div>
      )}

      {/* Stoop Chatter */}
      <div className="stoop-dp-section">
        <StoopChatterBox clusterId={clusterId} isMember={isMember} />
      </div>

      {/* Hub link */}
      {cluster.hubSlug && (
        <div className="stoop-dp-section">
          <Link href={`/hubs/${cluster.hubSlug}`} className="stoop-dp-hub-link">
            View connected Hub →
          </Link>
        </div>
      )}

      {/* Full details link */}
      <div className="stoop-dp-footer">
        <Link href={`/stoop/${clusterId}`} className="stoop-dp-full-link">
          Open full Stoop page
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
