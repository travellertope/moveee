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
  hubId, isMember, allowedTemplates,
}: {
  hubId: number;
  isMember: boolean;
  allowedTemplates: string[];
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

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
          {items.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
