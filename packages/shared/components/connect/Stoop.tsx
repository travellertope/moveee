"use client";

import { useState, useEffect } from "react";
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

export default function Stoop({ viewerCity = "", viewerCountry = "" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myCluster, setMyCluster] = useState<Cluster | null>(null);
  const [nearby, setNearby] = useState<Cluster[]>([]);

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
        <h2 className="mco-fellowship-title">Stoop</h2>
        <p className="mco-fellowship-sub">
          Weekly, area-level gatherings of Moveee members near you.
        </p>
      </div>

      {myCluster ? (
        <Link href={`/cluster/${myCluster.id}`} className="mco-fellowship-card mco-fellowship-card--active">
          <div>
            <p className="mco-fellowship-card-label">Your Stoop</p>
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
          <Link href="/cluster/create" className="con-btn-ghost mco-fellowship-start-btn">
            Start a Stoop →
          </Link>
        </>
      ) : (
        <div className="mco-fellowship-empty">
          <p>No Stoop near you yet. Be the first to start one in your area.</p>
          <Link href="/cluster/create" className="con-btn-primary">
            Start a Stoop →
          </Link>
        </div>
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
