"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FollowingActivityItem } from "@/lib/reading-tracker";

// "From people you follow" activity feed — web mirror of the mobile Log
// Home screen's activity card (LogHomeScreen.tsx), including the star
// rating/review-excerpt enrichment. See get_following_activity() in
// class-culture-reading-tracker.php.

function timeAgo(iso: string): string {
  const then = new Date(iso.replace(" ", "T") + "Z").getTime();
  const diffMs = Date.now() - then;
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function FollowingActivity() {
  const [items, setItems] = useState<FollowingActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reading/following-activity?limit=10", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setItems(data.activity ?? []);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items === null || items.length === 0) return null;

  return (
    <div className="rt-activity">
      <h2 className="rt-activity-heading">From People You Follow</h2>
      <div className="rt-activity-list">
        {items.map((item, i) => (
          <Link
            key={`${item.userId}-${item.directoryId}-${i}`}
            href={`/directory/${item.slug}`}
            className="rt-activity-row"
          >
            {item.userAvatar ? (
              <img src={item.userAvatar} alt="" className="rt-activity-avatar" />
            ) : (
              <div className="rt-activity-avatar rt-activity-avatar--placeholder">
                {item.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="rt-activity-body">
              <p className="rt-activity-text">
                <strong>{item.userName}</strong> finished <strong>{item.title}</strong>
              </p>
              {item.rating !== null && (
                <p className="rt-activity-rating">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(Math.max(0, 5 - item.rating))} {item.rating} of 5
                </p>
              )}
              {item.reviewExcerpt && <p className="rt-activity-excerpt">{item.reviewExcerpt}</p>}
              <p className="rt-activity-time">{timeAgo(item.loggedAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
