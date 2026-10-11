"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HubActions({
  hubId, loggedIn, initialIsMember, initialIsFollowing, initialNotifyPosts, isOwner,
}: {
  hubId: number;
  loggedIn: boolean;
  initialIsMember: boolean;
  initialIsFollowing: boolean;
  initialNotifyPosts: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [notifyPosts, setNotifyPosts] = useState(initialNotifyPosts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const primaryBtnStyle: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    background: "var(--ochre, #7a241c)", color: "#fff",
    padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600,
    borderRadius: "var(--radius-full, 9999px)", border: "none", cursor: "pointer",
  };
  const ghostBtnStyle: CSSProperties = {
    display: "inline-flex", alignItems: "center",
    background: "var(--paper, #fff)", color: "var(--ink-soft, #3a342b)",
    padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600,
    borderRadius: "var(--radius-full, 9999px)", border: "1px solid var(--rule, #e8e2d8)", cursor: "pointer",
  };

  if (!loggedIn) {
    return (
      <Link href={`/login?callbackUrl=/hub`} style={primaryBtnStyle}>
        Log in to join →
      </Link>
    );
  }

  const call = async (path: string, body?: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/hub/${hubId}/${path}`, {
        method: "POST",
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Something went wrong. Please try again.");
        setBusy(false);
        return null;
      }
      return data;
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
      return null;
    }
  };

  const join = async () => {
    const data = await call("join");
    // Trust the server's actual isMember, not just that the call succeeded —
    // a write that silently failed server-side (e.g. a DB error) can still
    // come back as a successful response with isMember still false.
    if (data?.isMember) {
      setIsMember(true);
      router.refresh();
    } else if (data) {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const leave = async () => {
    if (isOwner) return;
    if (!confirm("Leave this Hub?")) return;
    const data = await call("leave");
    if (data && !data.isMember) {
      setIsMember(false);
      router.refresh();
    } else if (data) {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const follow = async () => {
    const data = await call("follow", { notify_posts: notifyPosts });
    // Trust the server's actual isFollowing, not just that the call
    // succeeded — a write that silently failed server-side can still come
    // back as a successful response with isFollowing still false.
    if (data?.isFollowing) {
      setIsFollowing(true);
    } else if (data) {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const unfollow = async () => {
    const data = await call("unfollow");
    if (data && !data.isFollowing) {
      setIsFollowing(false);
      setNotifyPosts(false);
    } else if (data) {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const toggleNotify = async () => {
    const next = !notifyPosts;
    const data = await call("follow", { notify_posts: next });
    if (data?.notifyPosts === next) {
      setNotifyPosts(next);
    } else if (data) {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {isMember ? (
          isOwner ? (
            <span style={{ fontSize: "0.85rem", color: "#3a342b", fontWeight: 600 }}>You own this Hub</span>
          ) : (
            <button
              type="button"
              onClick={leave}
              disabled={busy}
              style={{
                display: "inline-flex", alignItems: "center",
                background: "none", border: "1px solid var(--rule, #e8e2d8)", cursor: "pointer",
                padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600,
                borderRadius: "var(--radius-full, 9999px)", color: "#c0392b",
              }}
            >
              {busy ? "Leaving…" : "Leave Hub"}
            </button>
          )
        ) : (
          <button type="button" onClick={join} disabled={busy} style={primaryBtnStyle}>
            {busy ? "Joining…" : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14 14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1ZM14 6h-1V5a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0V8h1a1 1 0 0 0 0-2Z"/>
                </svg>
                Join Hub
              </>
            )}
          </button>
        )}
        {isMember && (
          <button
            type="button"
            onClick={isFollowing ? unfollow : follow}
            disabled={busy}
            style={ghostBtnStyle}
          >
            {isFollowing ? "Following ✓" : "Follow"}
          </button>
        )}
      </div>

      {isMember && isFollowing && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#7a6f5c", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={notifyPosts}
            disabled={busy}
            onChange={toggleNotify}
          />
          Notify me when they post
        </label>
      )}
    </div>
  );
}
