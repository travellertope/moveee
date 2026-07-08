"use client";

import { useState, useEffect, useCallback } from "react";
import FeedCard from "@/components/pulse/FeedCard";
import SubmitPost from "@/components/pulse/SubmitPost";
import type { FeedItem } from "@/lib/unified-feed";

/**
 * Hub feed items come back from GET /api/hub/{id}/feed shaped by the PHP
 * mobile feed mapper (format_community_feed_item()) — field names already
 * line up with the web FeedItem shape (unified-feed.ts's getCommunityPosts())
 * for every field FeedCard actually reads, so this is a passthrough cast
 * rather than a real transform.
 */
function toFeedItem(raw: any): FeedItem {
  return raw as FeedItem;
}

export default function HubFeed({
  hubId, isMember, isModerator, allowedTemplates,
}: {
  hubId: number;
  isMember: boolean;
  isModerator: boolean;
  allowedTemplates: string[];
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [busyWpId, setBusyWpId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hub/${hubId}/feed?per_page=20`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setItems((data?.items ?? []).map(toFeedItem));
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [hubId]);

  useEffect(() => { load(); }, [load]);

  const togglePin = async (item: FeedItem & { isPinned?: boolean; wpId?: string }) => {
    if (!item.wpId) return;
    setBusyWpId(item.wpId);
    try {
      if (item.isPinned) {
        await fetch(`/api/hub/${hubId}/pin`, { method: "DELETE" });
      } else {
        await fetch(`/api/hub/${hubId}/pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: Number(item.wpId) }),
        });
      }
      await load();
    } catch {
      // no-op — leave the list as-is, user can retry
    }
    setBusyWpId(null);
  };

  const removePost = async (item: FeedItem & { wpId?: string }) => {
    if (!item.wpId) return;
    if (!confirm("Remove this post from the Hub? The author will be notified.")) return;
    setBusyWpId(item.wpId);
    try {
      await fetch(`/api/hub/${hubId}/remove-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: Number(item.wpId) }),
      });
      await load();
    } catch {
      // no-op
    }
    setBusyWpId(null);
  };

  return (
    <div>
      {isMember && (
        <div style={{ marginBottom: 16 }}>
          {showComposer ? (
            <SubmitPost
              hubId={hubId}
              hubAllowedTemplates={allowedTemplates}
              onPosted={() => {
                setShowComposer(false);
                load();
              }}
            />
          ) : (
            <button type="button" className="con-btn-primary" onClick={() => setShowComposer(true)}>
              + New post
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="mem-card-desc" style={{ margin: 0 }}>Loading…</p>
      ) : items.length === 0 ? (
        <p className="mem-card-desc" style={{ margin: 0 }}>
          No posts yet.{isMember ? " Be the first to post in this Hub." : ""}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item: any) => (
            <div key={item.id}>
              {item.isPinned && (
                <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--ochre)", textTransform: "uppercase", margin: "0 0 4px" }}>
                  📌 Pinned
                </p>
              )}
              <FeedCard item={item} />
              {isModerator && (
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => togglePin(item)}
                    disabled={busyWpId === item.wpId}
                    className="mem-settings-back-link"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12 }}
                  >
                    {item.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePost(item)}
                    disabled={busyWpId === item.wpId}
                    className="mem-settings-back-link"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, color: "#c0392b" }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
