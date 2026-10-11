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
  // Treat member OR following as "following" in the merged model —
  // both states were set by the same "Follow Hub" action.
  const [isFollowing, setIsFollowing] = useState(initialIsMember || initialIsFollowing);
  const [notifyPosts, setNotifyPosts] = useState(initialNotifyPosts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const followBtnStyle: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    background: "var(--ochre, #7a241c)", color: "#fff",
    padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600,
    borderRadius: "var(--radius-full, 9999px)", border: "none", cursor: "pointer",
  };
  const followingBtnStyle: CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    background: "var(--paper, #fff)", color: "var(--ink-soft, #3a342b)",
    padding: "0.5rem 1.25rem", fontSize: "0.8rem", fontWeight: 600,
    borderRadius: "var(--radius-full, 9999px)", border: "1px solid var(--rule, #e8e2d8)", cursor: "pointer",
  };

  if (!loggedIn) {
    return (
      <Link href="/login?callbackUrl=/hub" style={followBtnStyle}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14 14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1ZM14 6h-1V5a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0V8h1a1 1 0 0 0 0-2Z"/>
        </svg>
        Log in to follow
      </Link>
    );
  }

  if (isOwner) {
    return (
      <span style={{ fontSize: "0.8rem", color: "var(--mute, #7a6f5c)", fontWeight: 600 }}>
        You own this Hub
      </span>
    );
  }

  const call = async (path: string, method = "POST", body?: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/hub/${hubId}/${path}`, {
        method,
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

  const follow = async () => {
    // Follow Hub = join (membership + newsletter auto-subscribe) + follow (feed)
    await call("join");
    const data = await call("follow", "POST", { notify_posts: notifyPosts });
    if (data?.isFollowing) {
      setIsFollowing(true);
      router.refresh();
    } else if (data) {
      // join succeeded; follow may have partially failed — still mark followed
      setIsFollowing(true);
      router.refresh();
    }
    setBusy(false);
  };

  const unfollow = async () => {
    // Unfollow = remove from feed + leave hub (clean break)
    await call("unfollow", "POST");
    await call("leave", "POST");
    setIsFollowing(false);
    router.refresh();
    setBusy(false);
  };

  const toggleNotify = async () => {
    const next = !notifyPosts;
    const data = await call("follow", "POST", { notify_posts: next });
    if (data?.notifyPosts === next) setNotifyPosts(next);
    setBusy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {error && <p style={{ fontSize: "0.75rem", color: "#c0392b", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {isFollowing ? (
          <button type="button" onClick={unfollow} disabled={busy} style={followingBtnStyle}>
            {busy ? "Updating…" : "Following ✓"}
          </button>
        ) : (
          <button type="button" onClick={follow} disabled={busy} style={followBtnStyle}>
            {busy ? "Following…" : (
              <>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14 14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1ZM14 6h-1V5a1 1 0 0 0-2 0v1h-1a1 1 0 0 0 0 2h1v1a1 1 0 0 0 2 0V8h1a1 1 0 0 0 0-2Z"/>
                </svg>
                Follow Hub
              </>
            )}
          </button>
        )}
      </div>

      {isFollowing && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--mute, #7a6f5c)", cursor: "pointer" }}>
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
