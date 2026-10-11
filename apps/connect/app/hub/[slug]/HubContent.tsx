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

const TAB_STYLE_BASE: React.CSSProperties = {
  paddingBottom: "0.7rem",
  paddingTop: "0.4rem",
  fontSize: "0.8rem",
  background: "none",
  border: "none",
  cursor: "pointer",
  letterSpacing: "0.01em",
};

export default function HubContent({
  hubId, hubSlug, isMember, isModerator,
}: {
  hubId: number;
  hubSlug: string;
  isMember: boolean;
  isModerator: boolean;
}) {
  const [tab, setTab] = useState<"feed" | "members">("feed");
  const [members, setMembers] = useState<HubMember[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const switchTab = async (t: typeof tab) => {
    setTab(t);
    if (t === "members" && !membersLoaded) {
      setMembersLoading(true);
      try {
        const res = await fetch(`/api/hub/${hubId}/members?per_page=30`);
        const data = await res.json().catch(() => ({}));
        setMembers(data?.members ?? []);
        setMembersLoaded(true);
      } catch {
        setMembers([]);
      }
      setMembersLoading(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    ...TAB_STYLE_BASE,
    fontWeight: active ? 600 : 500,
    color: active ? "var(--ochre, #7a241c)" : "#7a6f5c",
    borderBottom: active ? "2px solid var(--ochre, #7a241c)" : "2px solid transparent",
  });

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: "1.5rem",
        borderBottom: "1px solid var(--rule, #e8e2d8)",
        paddingLeft: "1.25rem", paddingRight: "1.25rem",
      }}>
        <button style={tabStyle(tab === "feed")} onClick={() => switchTab("feed")}>
          Discussions &amp; Posts
        </button>
        <button style={tabStyle(tab === "members")} onClick={() => switchTab("members")}>
          Followers
        </button>
      </div>

      {/* Feed tab */}
      {tab === "feed" && (
        <div style={{ padding: "1rem 1.25rem" }}>
          <HubFeed
            hubId={hubId}
            hubSlug={hubSlug}
            isMember={isMember}
            isModerator={isModerator}
          />
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div style={{ padding: "1rem 1.25rem" }}>
          {membersLoading ? (
            <p style={{ color: "#7a6f5c", fontSize: "0.85rem", margin: 0 }}>Loading…</p>
          ) : members.length === 0 ? (
            <p style={{ color: "#7a6f5c", fontSize: "0.85rem", margin: 0 }}>No followers yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {members.map((m) => (
                <a
                  key={m.userId}
                  href={`/connect/${m.username}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.65rem 0.85rem",
                    background: "var(--paper, #fff)",
                    borderRadius: "var(--radius-lg, 6px)",
                    border: "1px solid var(--rule, #e8e2d8)",
                    textDecoration: "none", color: "inherit",
                  }}
                >
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
