"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const REACTIONS = [
  { key: "love", emoji: "❤️", label: "Love"    },
  { key: "fire", emoji: "🔥", label: "Fire"    },
  { key: "clap", emoji: "👏", label: "Respect" },
] as const;
type ReactionKey = (typeof REACTIONS)[number]["key"];

const STORAGE_KEY = "moveee_reactions";

function getStored(): Record<string, ReactionKey | null> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setStored(data: Record<string, ReactionKey | null>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface ReactionBarProps {
  itemId:       string;
  itemType:     "community" | "pulse" | "quote";
  initialCounts: { love: number; fire: number; clap: number };
  shareUrl?:    string;
  noBorder?:    boolean;
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

  const [counts, setCounts]   = useState(initialCounts);
  const [myReaction, setMyReaction] = useState<ReactionKey | null>(null);
  const [copied, setCopied]   = useState(false);
  const [pending, setPending] = useState(false);

  // Hydrate from the server record on mount — this is the real per-user
  // source of truth (shared with mobile via `_culture_post_reactions`
  // usermeta). Fall back to the localStorage cache immediately so there's
  // no flash of "unreacted" while the request is in flight, then reconcile
  // once the server responds.
  useEffect(() => {
    const stored = getStored();
    setMyReaction(stored[`${itemType}-${itemId}`] ?? null);

    if (!loggedIn) return;
    let cancelled = false;
    fetch(`/api/community/react?postId=${encodeURIComponent(itemId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const serverReaction = (data.userReaction ?? null) as ReactionKey | null;
        setMyReaction(serverReaction);
        const next = getStored();
        next[`${itemType}-${itemId}`] = serverReaction;
        setStored(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, itemType, loggedIn]);

  async function handleReact(emoji: ReactionKey) {
    if (!loggedIn) {
      window.dispatchEvent(new Event("open-auth-modal"));
      return;
    }
    if (pending) return;

    const isRemoving = myReaction === emoji;
    const prevCounts = counts;
    const prevReaction = myReaction;

    // Optimistic update.
    const next = { ...counts };
    if (myReaction && myReaction !== emoji) {
      next[myReaction] = Math.max(0, next[myReaction] - 1);
    }
    if (isRemoving) {
      next[emoji] = Math.max(0, next[emoji] - 1);
    } else {
      next[emoji] = next[emoji] + 1;
    }
    setCounts(next);
    setMyReaction(isRemoving ? null : emoji);

    const stored = getStored();
    stored[`${itemType}-${itemId}`] = isRemoving ? null : emoji;
    setStored(stored);

    setPending(true);
    try {
      // Server toggles/switches atomically — tapping the same emoji again
      // un-reacts, tapping a different one switches in one call.
      const res = await fetch("/api/community/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: itemId, type: emoji }),
      });
      if (res.ok) {
        const fresh = await res.json();
        setCounts(fresh.reactions ?? next);
        const serverReaction = (fresh.reactionType ?? null) as ReactionKey | null;
        setMyReaction(serverReaction);
        const updated = getStored();
        updated[`${itemType}-${itemId}`] = serverReaction;
        setStored(updated);
      } else {
        // Rollback on failure.
        setCounts(prevCounts);
        setMyReaction(prevReaction);
        const reverted = getStored();
        reverted[`${itemType}-${itemId}`] = prevReaction;
        setStored(reverted);
      }
    } catch {
      setCounts(prevCounts);
      setMyReaction(prevReaction);
    } finally {
      setPending(false);
    }
  }

  async function handleShare() {
    const url = shareUrl ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // User cancelled or share failed — silently ignore.
      }
      return;
    }
    // Fallback: copy to clipboard.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Nothing we can do.
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        ...(noBorder ? {} : { paddingTop: "0.5rem", borderTop: "1px solid #e8e2d8", marginTop: "0.25rem" }),
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {REACTIONS.map(({ key, emoji, label }) => {
        const active = myReaction === key;
        const count  = counts[key];
        return (
          <button
            key={key}
            onClick={() => handleReact(key)}
            title={label}
            aria-label={`${label}: ${count}`}
            style={{
              background: active ? "#f0ece4" : "transparent",
              border: "1px solid",
              borderColor: active ? "#d8cfc4" : "transparent",
              borderRadius: "20px",
              padding: "0.2rem 0.55rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.8rem",
              color: active ? "#3a342b" : "#7a6f5c",
              transition: "all 0.15s",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>{emoji}</span>
            {count > 0 && (
              <span style={{ fontSize: "0.7rem", fontVariantNumeric: "tabular-nums" }}>
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Share button */}
      <button
        onClick={handleShare}
        title={copied ? "Copied!" : "Copy link"}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: copied ? "#2e7d32" : "#7a6f5c",
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.7rem",
          padding: "0.2rem 0.4rem",
          transition: "color 0.15s",
        }}
      >
        {copied ? (
          <span>Copied ✓</span>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>
    </div>
  );
}
