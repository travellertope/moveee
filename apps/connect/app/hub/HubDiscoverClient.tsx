"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Hub {
  id: number;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  memberCount: number;
  postCount: number;
}

function HubCard({ hub }: { hub: Hub }) {
  return (
    <Link
      href={`/hub/${hub.slug}`}
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        background: "var(--paper)", border: "1px solid var(--rule)",
        borderRadius: "var(--radius-xl, 12px)", padding: 16,
        textDecoration: "none", color: "inherit",
      }}
    >
      {hub.coverImageUrl && (
        <img
          src={hub.coverImageUrl}
          alt=""
          style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: "var(--radius-lg, 6px)" }}
        />
      )}
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>
        {hub.name}
      </span>
      <span style={{ fontSize: 13, color: "var(--mute)", lineHeight: 1.4 }}>
        {hub.description}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--mute)", marginTop: 6 }}>
        {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
      </span>
    </Link>
  );
}

function HubRow({ hubs, title }: { hubs: Hub[]; title: string }) {
  if (!hubs.length) return null;
  return (
    <section className="mem-card">
      <div className="mem-card-label">{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
        {hubs.map((h) => <HubCard key={h.id} hub={h} />)}
      </div>
    </section>
  );
}

export default function HubDiscoverClient({
  initialHubs, myJoined, myFollowed, loggedIn,
}: {
  initialHubs: Hub[];
  myJoined: Hub[];
  myFollowed: Hub[];
  loggedIn: boolean;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"popular" | "newest" | "trending">("popular");
  const [hubs, setHubs] = useState<Hub[]>(initialHubs);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string, sortBy: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: sortBy, per_page: "20" });
      if (query) params.set("q", query);
      const res = await fetch(`/api/hub/discover?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setHubs(data?.hubs ?? []);
    } catch {
      setHubs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q, sort), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  return (
    <>
      {loggedIn && (myJoined.length > 0 || myFollowed.length > 0) && (
        <>
          <HubRow hubs={myJoined} title="Hubs you've joined" />
          <HubRow hubs={myFollowed.filter((f) => !myJoined.some((j) => j.id === f.id))} title="Hubs you follow" />
        </>
      )}

      <section className="mem-card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            className="hfc-input"
            placeholder="Search Hubs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: "1 1 200px", margin: 0 }}
          />
          <select
            className="hfc-input hfc-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            style={{ width: "auto", margin: 0 }}
          >
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </section>

      <section className="mem-card">
        <div className="mem-card-label">
          {loading ? "Loading…" : `${hubs.length} Hub${hubs.length === 1 ? "" : "s"}`}
        </div>
        {hubs.length === 0 && !loading ? (
          <p className="mem-card-desc" style={{ margin: 0 }}>
            No Hubs found. Be the first to start one.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
            {hubs.map((h) => <HubCard key={h.id} hub={h} />)}
          </div>
        )}
      </section>
    </>
  );
}
