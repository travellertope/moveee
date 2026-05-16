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
  itemType:     "community" | "pulse";
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

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    const stored = getStored();
    setMyReaction(stored[`${itemType}-${itemId}`] ?? null);
  }, [itemId, itemType]);

  async function handleReact(emoji: ReactionKey) {
    if (!loggedIn) {
      window.dispatchEvent(new Event("open-auth-modal"));
      return;
    }
    if (pending) return;

    const isRemoving = myReaction === emoji;
    const action     = isRemoving ? "remove" : "add";
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
      // If switching emoji, first remove old one on server.
      if (myReaction && myReaction !== emoji) {
        await fetch("/api/community/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, itemType, emoji: myReaction, action: "remove" }),
        });
      }
      const res = await fetch("/api/community/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, itemType, emoji, action }),
      });
      if (res.ok) {
        const fresh = await res.json();
        setCounts(fresh);
      } else {
        // Rollback on failure.
        setCounts(prevCounts);
        setMyReaction(prevReaction);
        const stored = getStored();
        stored[`${itemType}-${itemId}`] = prevReaction;
        setStored(stored);
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
