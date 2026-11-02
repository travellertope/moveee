"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import FeedCard from "@/components/pulse/FeedCard";
import ComposerModal, { type ComposerTab } from "@/components/pulse/ComposerModal";
// Guarantee pulse-layout.css (every cm-* class ComposerModal uses) is
// loaded wherever this component renders, rather than relying on it
// coming along implicitly via (connect)/layout.tsx's TopBar/BottomNav —
// the same fragile-dependency bug fixed for those two entry points.
import "@/app/pulse-layout.css";
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
  hubId, hubSlug, isMember, isModerator, sort = "recent",
}: {
  hubId: number;
  hubSlug: string;
  isMember: boolean;
  isModerator: boolean;
  sort?: string;
}) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyWpId, setBusyWpId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTab, setComposerTab] = useState<ComposerTab>("update");

  // Auto-open the composer on ?compose=1[&tab=...] — same deep-link
  // contract PulseFeed.tsx honours, so the retired /hub/[slug]/post/new
  // page can redirect here instead of 404ing. Strips both params after.
  useEffect(() => {
    if (searchParams.get("compose") !== "1") return;
    const tab = searchParams.get("tab") as ComposerTab | null;
    const VALID_TABS: ComposerTab[] = ["update", "review", "art", "poll", "quote", "itinerary", "event"];
    setComposerTab(tab && VALID_TABS.includes(tab) ? tab : "update");
    setComposerOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compose");
    next.delete("tab");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: "20" });
      if (sort === "top") { qs.set("orderby", "reactions"); qs.set("days", "7"); }
      else if (sort === "hot") { qs.set("orderby", "hot"); }
      const res = await fetch(`/api/hub/${hubId}/feed?${qs}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setItems((data?.items ?? []).map(toFeedItem));
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [hubId, sort]);

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
          <div className="composer-box">
            <div className="composer-box-avatar">
              {(session?.user as any)?.avatarUrl ? (
                <img src={(session!.user as any).avatarUrl} alt="" />
              ) : (
                (session?.user?.name ?? (session?.user as any)?.displayName ?? "?")
                  .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
              )}
            </div>
            <button
              type="button"
              className="composer-box-placeholder"
              onClick={() => { setComposerTab("update"); setComposerOpen(true); }}
            >
              Share something with this Hub…
            </button>
          </div>
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
      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        hubId={hubId}
        initialTab={composerTab}
        onSuccess={load}
      />
    </div>
  );
}
