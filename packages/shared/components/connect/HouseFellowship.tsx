"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Cluster {
  id: number;
  name: string;
  city: string;
  street: string;
  country: string;
  status: string;
  memberCount: number;
  capacity: number;
  meetingDay: string;
  meetingTime: string;
}

interface Props {
  viewerCity?: string;
  viewerCountry?: string;
}

const DAYS = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

export default function HouseFellowship({ viewerCity = "", viewerCountry = "" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myCluster, setMyCluster] = useState<Cluster | null>(null);
  const [nearby, setNearby] = useState<Cluster[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cluster/my-clusters", { cache: "no-store" });
        const data = res.ok ? await res.json() : { clusters: [] };
        const clusters: Cluster[] = data.clusters ?? [];
        const active = clusters.find((c) => c.status !== "archived") ?? null;
        setMyCluster(active);

        if (!active) {
          const params = new URLSearchParams();
          if (viewerCity) params.set("city", viewerCity);
          else if (viewerCountry) params.set("country", viewerCountry);
          const dRes = await fetch(`/api/cluster/discover?${params}`, { cache: "no-store" });
          const dData = dRes.ok ? await dRes.json() : { clusters: [] };
          setNearby((dData.clusters ?? []).slice(0, 3));
        }
      } catch {
        setMyCluster(null);
        setNearby([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [viewerCity, viewerCountry]);

  if (loading) return null;

  return (
    <div className="mco-fellowship">
      <div className="mco-fellowship-header">
        <h2 className="mco-fellowship-title">House Fellowship</h2>
        <p className="mco-fellowship-sub">
          Weekly, street-level gatherings of Moveee members near you.
        </p>
      </div>

      {myCluster ? (
        <Link href={`/cluster/${myCluster.id}`} className="mco-fellowship-card mco-fellowship-card--active">
          <div>
            <p className="mco-fellowship-card-label">Your House Fellowship</p>
            <h3 className="mco-fellowship-card-name">{myCluster.name}</h3>
            <p className="mco-fellowship-card-meta">
              {[myCluster.street, myCluster.city].filter(Boolean).join(", ")}
              {myCluster.meetingDay && myCluster.meetingTime
                ? ` · ${capitalize(myCluster.meetingDay)}s, ${myCluster.meetingTime}`
                : ""}
            </p>
          </div>
          <span className="mco-fellowship-card-arrow">→</span>
        </Link>
      ) : nearby.length > 0 ? (
        <>
          <div className="mco-fellowship-grid">
            {nearby.map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} onJoined={() => router.push(`/cluster/${cluster.id}`)} />
            ))}
          </div>
          <button type="button" className="con-btn-ghost mco-fellowship-start-btn" onClick={() => setShowForm(true)}>
            Start a House Fellowship →
          </button>
        </>
      ) : (
        <div className="mco-fellowship-empty">
          <p>No House Fellowship near you yet. Be the first to start one on your street.</p>
          <button type="button" className="con-btn-primary" onClick={() => setShowForm(true)}>
            Start a House Fellowship →
          </button>
        </div>
      )}

      {showForm && (
        <StartClusterModal
          defaultCity={viewerCity}
          defaultCountry={viewerCountry}
          onClose={() => setShowForm(false)}
          onCreated={(id) => router.push(`/cluster/${id}`)}
        />
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function ClusterCard({ cluster, onJoined }: { cluster: Cluster; onJoined: () => void }) {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const join = async () => {
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/cluster/${cluster.id}/join`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Could not join right now.");
        setJoining(false);
        return;
      }
      onJoined();
    } catch {
      setError("Could not join right now.");
      setJoining(false);
    }
  };

  return (
    <div className="mco-fellowship-card">
      <div>
        <h3 className="mco-fellowship-card-name">{cluster.name}</h3>
        <p className="mco-fellowship-card-meta">
          {[cluster.street, cluster.city].filter(Boolean).join(", ")}
          {cluster.meetingDay && cluster.meetingTime
            ? ` · ${capitalize(cluster.meetingDay)}s, ${cluster.meetingTime}`
            : ""}
        </p>
        <p className="mco-fellowship-card-count">
          {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} members
        </p>
        {error && <p className="mco-fellowship-card-error">{error}</p>}
      </div>
      <button type="button" className="con-btn-primary mco-fellowship-join-btn" onClick={join} disabled={joining}>
        {joining ? "Joining…" : "Join →"}
      </button>
    </div>
  );
}

function StartClusterModal({
  defaultCity, defaultCountry, onClose, onCreated,
}: {
  defaultCity: string; defaultCountry: string;
  onClose: () => void; onCreated: (id: number) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [street, setStreet] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [meetingDay, setMeetingDay] = useState("sun");
  const [meetingTime, setMeetingTime] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/cluster/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          street: street.trim(),
          country: country.trim(),
          meeting_day: meetingDay,
          meeting_time: meetingTime.trim(),
          location_note: locationNote.trim(),
          ...(capacity ? { capacity: Number(capacity) } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not start a House Fellowship right now.");
        setSubmitting(false);
        return;
      }
      onCreated(data.id);
    } catch {
      setError("Could not start a House Fellowship right now.");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={s.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={s.modal} role="dialog" aria-modal="true">
        <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>

        <p style={s.eyebrow}>Start a House Fellowship</p>
        <p style={s.body}>
          A weekly gathering of Moveee members on your street. You'll be the founding host.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={s.field}>
            <label style={s.label} htmlFor="hf-name">Fellowship name</label>
            <input id="hf-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} style={s.input} disabled={submitting} />
          </div>
          <div style={s.field}>
            <label style={s.label} htmlFor="hf-street">Street</label>
            <input id="hf-street" type="text" required value={street} onChange={(e) => setStreet(e.target.value)} style={s.input} disabled={submitting} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label} htmlFor="hf-city">City</label>
              <input id="hf-city" type="text" required value={city} onChange={(e) => setCity(e.target.value)} style={s.input} disabled={submitting} />
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label} htmlFor="hf-country">Country</label>
              <input id="hf-country" type="text" required value={country} onChange={(e) => setCountry(e.target.value)} style={s.input} disabled={submitting} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label} htmlFor="hf-day">Meeting day</label>
              <select id="hf-day" value={meetingDay} onChange={(e) => setMeetingDay(e.target.value)} style={s.input} disabled={submitting}>
                {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div style={{ ...s.field, flex: 1 }}>
              <label style={s.label} htmlFor="hf-time">Meeting time</label>
              <input id="hf-time" type="text" placeholder="e.g. 6:30pm" required value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} style={s.input} disabled={submitting} />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label} htmlFor="hf-note">Location note (optional)</label>
            <input id="hf-note" type="text" placeholder="e.g. Meet at the blue gate" value={locationNote} onChange={(e) => setLocationNote(e.target.value)} style={s.input} disabled={submitting} />
          </div>
          <div style={s.field}>
            <label style={s.label} htmlFor="hf-capacity">Capacity override (optional)</label>
            <input id="hf-capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} style={s.input} disabled={submitting} />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" style={{ ...s.btn, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
            {submitting ? "Starting…" : "Start House Fellowship →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(20,17,13,0.6)",
    backdropFilter: "blur(3px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 1000, padding: "24px", overflowY: "auto",
  },
  modal: {
    position: "relative", background: "var(--paper)", border: "1px solid var(--rule)",
    borderRadius: 4, padding: "40px 40px 32px", width: "100%", maxWidth: 460,
    color: "var(--ink)", fontFamily: "inherit", margin: "auto",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 18, background: "none", border: "none",
    fontSize: 16, color: "var(--mute)", cursor: "pointer", padding: "4px 6px", lineHeight: 1,
  },
  eyebrow: {
    fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
    color: "var(--mute)", margin: "0 0 8px",
  },
  body: { fontSize: 14, color: "var(--mute)", lineHeight: 1.6, margin: "0 0 22px" },
  field: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 },
  input: {
    display: "block", width: "100%", padding: "10px 14px", border: "1px solid var(--rule)",
    borderRadius: 3, fontSize: 15, color: "var(--ink)", background: "var(--paper-deep)",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  error: {
    fontSize: 13, color: "#c0392b", background: "#fef2f2", border: "1px solid rgba(192,57,43,.15)",
    borderRadius: 3, padding: "8px 12px", margin: "0 0 14px",
  },
  btn: {
    display: "block", width: "100%", padding: "11px 24px", background: "var(--ink)",
    color: "#fff", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 600,
    letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
    fontFamily: "inherit", marginTop: 4,
  },
};
