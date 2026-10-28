"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SidebarFollowBtn({ username }: { username: string }) {
  const { data: session, status } = useSession();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSelf = (session as any)?.user?.username === username;

  useEffect(() => {
    if (status !== "authenticated" || isSelf) return;
    fetch(`/api/connect/${encodeURIComponent(username)}/follow`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFollowing(!!d.isFollowing))
      .catch(() => {});
  }, [username, status, isSelf]);

  if (status === "unauthenticated" || isSelf) return null;

  async function toggle() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/connect/${encodeURIComponent(username)}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: following ? "unfollow" : "follow" }),
      });
      const d = await res.json();
      if (res.ok) setFollowing(!!d.isFollowing);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rsb-follow-btn${following ? " rsb-follow-btn--active" : ""}`}
      aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
