"use client";

import { useState } from "react";
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

  if (!loggedIn) {
    return (
      <Link href={`/login?callbackUrl=/hub`} className="con-btn-primary">
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
    if (data) {
      setIsMember(true);
      router.refresh();
    }
    setBusy(false);
  };

  const leave = async () => {
    if (isOwner) return;
    if (!confirm("Leave this Hub?")) return;
    const data = await call("leave");
    if (data) {
      setIsMember(false);
      router.refresh();
    }
    setBusy(false);
  };

  const follow = async () => {
    const data = await call("follow", { notify_posts: notifyPosts });
    if (data) setIsFollowing(true);
    setBusy(false);
  };

  const unfollow = async () => {
    const data = await call("unfollow");
    if (data) {
      setIsFollowing(false);
      setNotifyPosts(false);
    }
    setBusy(false);
  };

  const toggleNotify = async () => {
    const next = !notifyPosts;
    const data = await call("follow", { notify_posts: next });
    if (data) setNotifyPosts(next);
    setBusy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {isMember ? (
          isOwner ? (
            <span className="mem-card-desc" style={{ margin: 0, fontWeight: 600 }}>You own this Hub</span>
          ) : (
            <button
              type="button"
              onClick={leave}
              disabled={busy}
              className="mem-settings-back-link"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#c0392b" }}
            >
              {busy ? "Leaving…" : "Leave Hub"}
            </button>
          )
        ) : (
          <button type="button" onClick={join} disabled={busy} className="con-btn-primary" style={{ border: "none", cursor: "pointer" }}>
            {busy ? "Joining…" : "Join →"}
          </button>
        )}

        <button
          type="button"
          onClick={isFollowing ? unfollow : follow}
          disabled={busy}
          className="con-btn-ghost"
          style={{ border: "1px solid var(--rule)", cursor: "pointer" }}
        >
          {isFollowing ? "Following ✓" : "Follow"}
        </button>
      </div>

      {isFollowing && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--mute)", cursor: "pointer" }}>
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
