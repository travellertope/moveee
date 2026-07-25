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
        background: "#fff", border: "1px solid #e8e2d8",
        borderRadius: "var(--radius-lg, 6px)", padding: 14,
        textDecoration: "none", color: "inherit",
      }}
    >
      {hub.coverImageUrl ? (
        <img
          src={hub.coverImageUrl}
          alt=""
          style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: "var(--radius-md, 4px)" }}
        />
      ) : (
        <div style={{
          width: "100%", height: 100, borderRadius: "var(--radius-md, 4px)",
          background: "#f2f2f2", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem",
        }}>
          🏷
        </div>
      )}
      <span style={{ fontFamily: "var(--font-fraunces), serif", fontWeight: 700, fontSize: 16, color: "#14110d" }}>
        {hub.name}
      </span>
      <span style={{ fontSize: 13, color: "#3a342b", lineHeight: 1.4 }}>
        {hub.description}
      </span>
      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "#7a6f5c", marginTop: 4 }}>
        {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
      </span>
    </Link>
  );
}

function sectionLabel(text: string) {
  return (
    <p style={{
      color: "#7a6f5c", fontSize: "0.68rem", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 0.75rem",
    }}>
      {text}
    </p>
  );
}

function HubRow({ hubs, title }: { hubs: Hub[]; title: string }) {
  if (!hubs.length) return null;
  return (
    <div style={{ padding: "0.75rem 1.25rem 1.25rem", borderBottom: "1px solid #e8e2d8" }}>
      {sectionLabel(title)}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
        {hubs.map((h) => <HubCard key={h.id} hub={h} />)}
      </div>
    </div>
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

  const SORTS: { value: typeof sort; label: string }[] = [
    { value: "popular", label: "Popular" },
    { value: "newest", label: "Newest" },
    { value: "trending", label: "Trending" },
  ];

  return (
    <>
      {loggedIn && (myJoined.length > 0 || myFollowed.length > 0) && (
        <>
          <HubRow hubs={myJoined} title="Hubs you've joined" />
          <HubRow hubs={myFollowed.filter((f) => !myJoined.some((j) => j.id === f.id))} title="Hubs you follow" />
        </>
      )}

      {/* Search + sort — same pill-input pattern used across the composer's
          "Posting to" controls and the events/discover search bars. */}
      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #e8e2d8", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{
          flex: "1 1 200px", display: "flex", alignItems: "center", gap: 8,
          background: "#f5f5f5", border: "1px solid rgba(42,36,28,.15)", borderRadius: "999px",
          padding: "8px 14px",
        }}>
          <span style={{ fontSize: "0.85rem", color: "#7a6f5c" }}>🔍</span>
          <input
            type="text"
            placeholder="Search Hubs…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none", background: "none",
              fontSize: "0.85rem", color: "#14110d", fontFamily: "inherit",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSort(s.value)}
              style={{
                background: sort === s.value ? "#14110d" : "#fff",
                color: sort === s.value ? "#fff" : "#3a342b",
                border: "1px solid " + (sort === s.value ? "#14110d" : "#e8e2d8"),
                borderRadius: "999px", padding: "8px 14px",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {sectionLabel(loading ? "Loading…" : `${hubs.length} Hub${hubs.length === 1 ? "" : "s"}`)}
        {hubs.length === 0 && !loading ? (
          <p style={{ color: "#7a6f5c", fontSize: "0.85rem", margin: 0 }}>
            No Hubs found. Be the first to start one.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {hubs.map((h) => <HubCard key={h.id} hub={h} />)}
          </div>
        )}
      </div>
    </>
  );
}
