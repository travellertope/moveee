"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Props {
  username: string;
  initialFollowersCount: number;
}

export default function FollowButton({ username, initialFollowersCount }: Props) {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [notifyPosts, setNotifyPosts] = useState(false);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const isSelf = session?.user?.username === username;

  useEffect(() => {
    if (status !== "authenticated" || isSelf) {
      setReady(true);
      return;
    }
    fetch(`/api/connect/${encodeURIComponent(username)}/follow`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setIsFollowing(!!data.isFollowing);
          if (typeof data.followersCount === "number") setFollowersCount(data.followersCount);
        }
      })
      .finally(() => setReady(true));
  }, [username, status, isSelf]);

  if (status === "unauthenticated" || isSelf) {
    return (
      <span className="prf-followers-count">
        <strong>{followersCount.toLocaleString()}</strong> followers
      </span>
    );
  }

  async function toggleFollow() {
    if (loading || !ready) return;
    setLoading(true);
    const action = isFollowing ? "unfollow" : "follow";
    try {
      const res = await fetch(`/api/connect/${encodeURIComponent(username)}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notify_posts: notifyPosts }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(!!data.isFollowing);
        if (typeof data.followersCount === "number") setFollowersCount(data.followersCount);
        if (!data.isFollowing) setNotifyPosts(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleNotify() {
    const next = !notifyPosts;
    setNotifyPosts(next);
    await fetch(`/api/connect/${encodeURIComponent(username)}/follow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify_posts: next }),
    }).catch(() => {});
  }

  return (
    <div className="prf-follow-wrap">
      <button
        onClick={toggleFollow}
        disabled={loading || !ready}
        className={`prf-share-btn${isFollowing ? " prf-follow-btn--active" : ""}`}
      >
        {isFollowing ? "✓ Following" : "Follow"}
      </button>
      <span className="prf-followers-count">
        <strong>{followersCount.toLocaleString()}</strong> followers
      </span>
      {isFollowing && (
        <label className="prf-notify-toggle">
          <input type="checkbox" checked={notifyPosts} onChange={toggleNotify} />
          Notify me when they post
        </label>
      )}
    </div>
  );
}
