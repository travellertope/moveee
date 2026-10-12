"use client";

import { useState } from "react";
import HubFeed from "./HubFeed";

interface HubMember {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
}

const SORTS = [
  { value: "recent", label: "Most Recent" },
  { value: "top",    label: "Top This Week" },
  { value: "hot",    label: "Hot" },
];

type Tab = "feed" | "contributors";

function TabBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        paddingBottom: "0.75rem",
        paddingTop: "0.5rem",
        paddingLeft: "0.1rem",
        paddingRight: "0.1rem",
        marginRight: "1.5rem",
        fontSize: "0.82rem",
        fontWeight: active ? 700 : 500,
        color: active ? "var(--ochre, #7a241c)" : "#7a6f5c",
        borderBottom: active ? "2.5px solid var(--ochre, #7a241c)" : "2.5px solid transparent",
        background: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color 0.12s",
        lineHeight: 1.4,
      }}
    >
      {children}
    </button>
  );
}

export default function HubContent({
  hubId, hubSlug, isMember, isModerator,
}: {
  hubId: number;
  hubSlug: string;
  isMember: boolean;
  isModerator: boolean;
}) {
  const [tab, setTab]           = useState<Tab>("feed");
  const [sort, setSort]         = useState("recent");
  const [members, setMembers]   = useState<HubMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const switchToContributors = async () => {
    setTab("contributors");
    if (!membersLoaded) {
      setMembersLoading(true);
      try {
        const res  = await fetch(`/api/hub/${hubId}/members?per_page=30`);
        const data = await res.json().catch(() => ({}));
        setMembers(data?.members ?? []);
        setMembersLoaded(true);
      } catch {
        setMembers([]);
      }
      setMembersLoading(false);
    }
  };

  return (
    <div>
      {/* ── Tab bar + sort row ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--rule, #e8e2d8)",
        padding: "0 1.25rem",
        background: "#fff",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <TabBtn active={tab === "feed"} onClick={() => setTab("feed")}>
            Discussions &amp; Posts
          </TabBtn>
          <TabBtn active={tab === "contributors"} onClick={switchToContributors}>
            Top Contributors
          </TabBtn>
        </div>

        {/* Sort — only on feed tab */}
        {tab === "feed" && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#3a342b",
              background: "#fff",
              border: "1px solid var(--rule-dark, #d8d2c8)",
              borderRadius: "var(--radius-full, 9999px)",
              padding: "0.3rem 0.9rem 0.3rem 0.7rem",
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a6f5c' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              paddingRight: "1.6rem",
              flexShrink: 0,
            }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Feed tab ── */}
      {tab === "feed" && (
        <div style={{ padding: "1rem 1.25rem" }}>
          <HubFeed
            hubId={hubId}
            hubSlug={hubSlug}
            isMember={isMember}
            isModerator={isModerator}
            sort={sort}
          />
        </div>
      )}

      {/* ── Top Contributors tab ── */}
      {tab === "contributors" && (
        <div style={{ padding: "1rem 1.25rem" }}>
          {membersLoading ? (
            <p style={{ color: "#7a6f5c", fontSize: "0.85rem", margin: 0 }}>Loading…</p>
          ) : members.length === 0 ? (
            <p style={{ color: "#7a6f5c", fontSize: "0.85rem", margin: 0 }}>No members yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {members.map((m, i) => (
                <a
                  key={m.userId}
                  href={`/connect/${m.username}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.65rem 0.85rem",
                    background: "#fff",
                    borderRadius: "var(--radius-lg, 6px)",
                    border: "1px solid var(--rule, #e8e2d8)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {/* Rank */}
                  <span style={{
                    width: 22, textAlign: "center", flexShrink: 0,
                    fontSize: "0.7rem", fontWeight: 700,
                    color: i < 3 ? "var(--gold, #b38238)" : "#7a6f5c",
                    fontFamily: "var(--font-mono, monospace)",
                  }}>
                    #{i + 1}
                  </span>

                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt=""
                      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "var(--ochre, #7a241c)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                    }}>
                      {(m.displayName || m.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 0.08rem", fontSize: "0.85rem", fontWeight: 600, color: "#14110d" }}>
                      {m.displayName || m.username}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#7a6f5c" }}>
                      @{m.username}
                      {m.role === "owner" && " · Owner"}
                      {m.role === "mod" && " · Mod"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
