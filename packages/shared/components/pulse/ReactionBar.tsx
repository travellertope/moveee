"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart, Bookmark, Share2 } from "lucide-react";

const BOOKMARK_STORAGE = "moveee_bookmarks";
const REACTION_STORAGE = "moveee_reactions";
type ReactionKey = "love";

function getStoredReactions(): Record<string, ReactionKey | null> {
  try { return JSON.parse(localStorage.getItem(REACTION_STORAGE) ?? "{}"); } catch { return {}; }
}
function setStoredReactions(data: Record<string, ReactionKey | null>) {
  localStorage.setItem(REACTION_STORAGE, JSON.stringify(data));
}
function getStoredBookmarks(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_STORAGE) ?? "{}"); } catch { return {}; }
}
function setStoredBookmarks(data: Record<string, boolean>) {
  localStorage.setItem(BOOKMARK_STORAGE, JSON.stringify(data));
}

interface ReactionBarProps {
  itemId:        string;
  itemType:      "community" | "pulse" | "quote";
  initialCounts: { love: number; fire?: number; clap?: number };
  shareUrl?:     string;
  noBorder?:     boolean;
}

export default function ReactionBar({
  itemId,
  itemType,
  initialCounts,
  shareUrl,
  noBorder,
}: ReactionBarProps) {
  const { status } = useSession();
  const loggedIn = status === "authenticated";

  const [loveCount, setLoveCount] = useState(initialCounts.love);
  const [myReaction, setMyReaction] = useState<ReactionKey | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reactPending, setReactPending] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  const storageKey = `${itemType}-${itemId}`;

  // Hydrate reaction from localStorage, then reconcile with server.
  useEffect(() => {
    const stored = getStoredReactions();
    setMyReaction(stored[storageKey] ?? null);

    const bk = getStoredBookmarks();
    setBookmarked(!!bk[storageKey]);

    if (!loggedIn) return;
    let cancelled = false;
    fetch(`/api/community/react?postId=${encodeURIComponent(itemId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const serverReaction = (data.userReaction ?? null) as ReactionKey | null;
        setMyReaction(serverReaction);
        const next = getStoredReactions();
        next[storageKey] = serverReaction;
        setStoredReactions(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, itemType, loggedIn]);

  async function handleLove() {
    if (!loggedIn) { window.dispatchEvent(new Event("open-auth-modal")); return; }
    if (reactPending) return;

    const isRemoving = myReaction === "love";
    const prevCount = loveCount;
    const prevReaction = myReaction;

    setLoveCount(isRemoving ? Math.max(0, loveCount - 1) : loveCount + 1);
    setMyReaction(isRemoving ? null : "love");
    const stored = getStoredReactions();
    stored[storageKey] = isRemoving ? null : "love";
    setStoredReactions(stored);

    setReactPending(true);
    try {
      const res = await fetch("/api/community/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: itemId, type: "love" }),
      });
      if (res.ok) {
        const fresh = await res.json();
        setLoveCount(fresh.reactions?.love ?? loveCount);
        const serverReaction = (fresh.reactionType ?? null) as ReactionKey | null;
        setMyReaction(serverReaction);
        const updated = getStoredReactions();
        updated[storageKey] = serverReaction;
        setStoredReactions(updated);
      } else {
        setLoveCount(prevCount);
        setMyReaction(prevReaction);
      }
    } catch {
      setLoveCount(prevCount);
      setMyReaction(prevReaction);
    } finally {
      setReactPending(false);
    }
  }

  async function handleBookmark() {
    if (!loggedIn) { window.dispatchEvent(new Event("open-auth-modal")); return; }
    if (bookmarkPending) return;

    const prevBookmarked = bookmarked;
    const next = !bookmarked;
    setBookmarked(next);
    const bk = getStoredBookmarks();
    bk[storageKey] = next;
    setStoredBookmarks(bk);

    const contentTypeMap: Record<string, string> = {
      quote: "quote",
      pulse: "article",
      community: "community",
    };

    setBookmarkPending(true);
    try {
      const res = await fetch("/api/community/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: itemId, contentType: contentTypeMap[itemType] }),
      });
      if (res.ok) {
        const data = await res.json();
        const confirmed = !!data.bookmarked;
        setBookmarked(confirmed);
        const bkUpdated = getStoredBookmarks();
        bkUpdated[storageKey] = confirmed;
        setStoredBookmarks(bkUpdated);
      } else {
        setBookmarked(prevBookmarked);
        const bkReverted = getStoredBookmarks();
        bkReverted[storageKey] = prevBookmarked;
        setStoredBookmarks(bkReverted);
      }
    } catch {
      setBookmarked(prevBookmarked);
    } finally {
      setBookmarkPending(false);
    }
  }

  async function handleShare() {
    const url = shareUrl ?? window.location.href;
    if (navigator.share) {
      try { await navigator.share({ url }); } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const loveActive = myReaction === "love";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      ...(noBorder ? {} : { paddingTop: "0.75rem", borderTop: "1px solid var(--rule, #e8e2d8)", marginTop: "0.25rem" }),
    }}>
      {/* Floating pill */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--paper, #f3ece0)",
        border: "1.5px solid var(--rule, #e0d8ce)",
        borderRadius: "999px",
        boxShadow: "0 2px 14px rgba(20,17,13,0.10), 0 1px 4px rgba(20,17,13,0.06)",
        overflow: "hidden",
      }}>

        {/* Love / Heart */}
        <button
          onClick={handleLove}
          title={loveActive ? "Unlike" : "Love this"}
          aria-label={`Love: ${loveCount}`}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px",
            background: "transparent", border: "none", cursor: "pointer",
            color: loveActive ? "#E53E3E" : "var(--ink-soft, #5a5248)",
            transition: "all 0.15s",
            lineHeight: 1,
          }}
          onMouseEnter={e => { if (!loveActive) (e.currentTarget as HTMLElement).style.color = "#E53E3E"; }}
          onMouseLeave={e => { if (!loveActive) (e.currentTarget as HTMLElement).style.color = "var(--ink-soft, #5a5248)"; }}
        >
          <Heart
            size={18}
            strokeWidth={2.5}
            fill={loveActive ? "#E53E3E" : "none"}
            color={loveActive ? "#E53E3E" : "currentColor"}
            style={{ transition: "all 0.15s", transform: loveActive ? "scale(1.15)" : "scale(1)" }}
          />
          {loveCount > 0 && (
            <span style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color: loveActive ? "#E53E3E" : "var(--ink-soft, #5a5248)",
            }}>
              {loveCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "var(--rule, #e0d8ce)", flexShrink: 0 }} />

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          title={bookmarked ? "Remove bookmark" : "Save for later"}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "8px 14px",
            background: "transparent", border: "none", cursor: "pointer",
            color: bookmarked ? "var(--gold, #b38238)" : "var(--ink-soft, #5a5248)",
            transition: "all 0.15s",
            lineHeight: 1,
          }}
          onMouseEnter={e => { if (!bookmarked) (e.currentTarget as HTMLElement).style.color = "var(--gold, #b38238)"; }}
          onMouseLeave={e => { if (!bookmarked) (e.currentTarget as HTMLElement).style.color = "var(--ink-soft, #5a5248)"; }}
        >
          <Bookmark
            size={18}
            strokeWidth={2.5}
            fill={bookmarked ? "var(--gold, #b38238)" : "none"}
            color={bookmarked ? "var(--gold, #b38238)" : "currentColor"}
            style={{ transition: "all 0.15s" }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "var(--rule, #e0d8ce)", flexShrink: 0 }} />

        {/* Share */}
        <button
          onClick={handleShare}
          title={copied ? "Copied!" : "Share"}
          aria-label="Share"
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "8px 14px",
            background: "transparent", border: "none", cursor: "pointer",
            color: copied ? "#2e7d32" : "var(--ink-soft, #5a5248)",
            transition: "all 0.15s",
            fontSize: "0.72rem",
            fontWeight: 600,
            lineHeight: 1,
          }}
          onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = "var(--ochre, #7a241c)"; }}
          onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = "var(--ink-soft, #5a5248)"; }}
        >
          {copied ? (
            <span style={{ fontSize: "0.72rem" }}>Copied ✓</span>
          ) : (
            <Share2 size={16} strokeWidth={2.5} color="currentColor" />
          )}
        </button>

      </div>
    </div>
  );
}
