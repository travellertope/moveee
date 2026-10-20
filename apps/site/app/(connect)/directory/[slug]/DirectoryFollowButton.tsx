"use client";

import { useEffect, useState, useCallback } from "react";
import type { DirectoryFollowStatus } from "@/lib/reading-tracker";

// Follow a directory-entry catalog item (Person or Place) — web mirror of
// apps/mobile/src/components/community/DirectoryFollowButton.tsx. A
// different relationship from member-to-member follows, since the followed
// side isn't necessarily a Moveee account. See Culture_Directory_Follows
// (PHP) — a follower is notified whenever a new community post links to
// this entry.

const SUPPORTED_TYPES = new Set(["person", "place"]);

export default function DirectoryFollowButton({
  directoryId,
  entryType,
  isLoggedIn,
}: {
  directoryId: number;
  entryType: string;
  isLoggedIn: boolean;
}) {
  const [status, setStatus] = useState<DirectoryFollowStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/directory/${directoryId}/follow-status`, { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {}
  }, [directoryId]);

  useEffect(() => {
    if (!isLoggedIn || !SUPPORTED_TYPES.has(entryType)) return;
    load();
  }, [isLoggedIn, entryType, load]);

  async function toggle() {
    if (saving || !status) return;
    const next = !status.isFollowing;
    setStatus({ isFollowing: next, followersCount: status.followersCount + (next ? 1 : -1) });
    setSaving(true);
    try {
      const res = await fetch(`/api/directory/${directoryId}/${next ? "follow" : "unfollow"}`, {
        method: "POST",
      });
      if (res.ok) setStatus(await res.json());
      else load();
    } catch {
      load();
    }
    setSaving(false);
  }

  if (!isLoggedIn || !SUPPORTED_TYPES.has(entryType) || !status) return null;

  return (
    <div className="dir-follow-row">
      <button
        type="button"
        className={`dir-follow-btn${status.isFollowing ? " dir-follow-btn--active" : ""}`}
        onClick={toggle}
        disabled={saving}
      >
        {status.isFollowing ? "Following" : "Follow"}
      </button>
      {status.followersCount > 0 && (
        <span className="dir-follow-count">
          {status.followersCount} {status.followersCount === 1 ? "follower" : "followers"}
        </span>
      )}
    </div>
  );
}
