"use client";

import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";

const TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pulse:     { label: "Pulse",      bg: "#fef3e2", color: "#b38238" },
  editorial: { label: "Editorial",  bg: "#fff0eb", color: "#c5491f" },
  happening: { label: "Happening",  bg: "#eeedfe", color: "#3c3489" },
  directory: { label: "Directory",  bg: "#e8f5ee", color: "#085041" },
  quote:     { label: "Quote",      bg: "#f3eef8", color: "#7a4da0" },
  community: { label: "Community",  bg: "#edf7ed", color: "#2e7d32" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: "inline-block",
      background: bg,
      color,
      fontSize: "0.58rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "0.18rem 0.45rem",
      borderRadius: "2px",
    }}>
      {label}
    </span>
  );
}

export default function FeedCard({
  item,
  onTagClick,
  onHashtagClick,
}: {
  item: FeedItem;
  onTagClick?: (tag: string) => void;
  onHashtagClick?: (hashtag: string) => void;
}) {
  const typeMeta = TYPE_BADGE[item.type] ?? TYPE_BADGE.pulse;

  // ── Quote card ──
  if (item.type === "quote") {
    const paragraphs = item.title.split("\n").filter((l) => l.trim()).length;
    const isLong = paragraphs >= 6 || item.title.length > 500;
    return (
      <article style={{
        background: "#fff",
        borderBottom: "1px solid #e8e2d8",
        overflow: "hidden",
        minWidth: 0,
        padding: "1.1rem 1.25rem",
      }}>
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
          <span style={{ color: "#d8c9b0", fontFamily: "serif", fontSize: "2rem", lineHeight: 0.9, flexShrink: 0, marginTop: "0.2rem" }}>"</span>
          <div style={{ flex: 1 }}>
            <p style={{
              color: "#14110d",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.95rem",
              lineHeight: 1.55,
              fontStyle: "italic",
              marginBottom: "0.6rem",
              ...(isLong ? {
                display: "-webkit-box",
                WebkitLineClamp: 8,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } : {}),
            }}>
              {item.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Badge {...typeMeta} />
              {item.quoteAuthor && <span style={{ color: "#c5491f", fontSize: "0.75rem", fontWeight: 600 }}>{item.quoteAuthor}</span>}
              {item.quoteSource && <span style={{ color: "#7a6f5c", fontSize: "0.72rem" }}>· {item.quoteSource}</span>}
              <span style={{ marginLeft: "auto", color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ── Community card (tweet-style) ──
  if (item.type === "community") {
    return (
      <article
        id={`community-${item.id.replace("community-", "")}`}
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8e2d8",
          borderLeft: "3px solid #81c784",
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "0.75rem",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "#edf7ed",
          border: "1px solid #c8e6c9",
          color: "#2e7d32",
          fontSize: "0.62rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {(item.communityAuthor ?? "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ color: "#14110d", fontSize: "0.82rem", fontWeight: 600 }}>
              {item.communityAuthor || "Community Member"}
            </span>
            <span style={{ color: "#c8bfb0", fontSize: "0.7rem" }}>·</span>
            <span style={{ color: "#7a6f5c", fontSize: "0.7rem" }}>{formatDate(item.date)}</span>
            {item.communityTag && (
              <button
                onClick={() => onTagClick?.(item.communityTag!)}
                style={{
                  marginLeft: "auto",
                  background: "#edf7ed",
                  color: "#2e7d32",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.15rem 0.4rem",
                  borderRadius: "2px",
                  border: "none",
                  cursor: onTagClick ? "pointer" : "default",
                  flexShrink: 0,
                }}
              >
                {item.communityTag}
              </button>
            )}
          </div>

          {/* Text */}
          <div style={{
            color: "#14110d",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            marginBottom: item.image ? "0.65rem" : "0.5rem",
          }}>
            <HashtagText text={item.title} onHashtagClick={onHashtagClick} clamp={6} />
          </div>

          {/* Image */}
          {item.image && (
            <div style={{ width: "100%", maxHeight: "200px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid #e8e2d8" }}>
              <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
            </div>
          )}

          {/* Reactions + comment link */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
            {item.wpId && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <ReactionBar
                  itemId={item.wpId}
                  itemType="community"
                  initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                  shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/pulse#community-${item.wpId}`}
                />
              </div>
            )}
            <Link
              href={`/community/${item.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                color: "#7a6f5c",
                textDecoration: "none",
                fontSize: "0.75rem",
                flexShrink: 0,
              }}
              aria-label="View comments"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {(item.commentCount ?? 0) > 0 && (
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{item.commentCount}</span>
              )}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // ── Standard cards (pulse, editorial, happening, directory) — horizontal timeline style ──
  const hasImage = !!item.image;
  const subLabel = item.source || item.location || item.category || item.entryType || item.arm || "";

  return (
    <article style={{
      background: "#fff",
      borderBottom: "1px solid #e8e2d8",
      padding: "0.9rem 1.25rem",
      overflow: "hidden",
      minWidth: 0,
    }}>
      <Link href={item.href} style={{ display: "flex", gap: "0.9rem", textDecoration: "none" }} aria-label={item.title}>
        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {/* Badges */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            <Badge {...typeMeta} />
            {item.region && (
              <span style={{ fontSize: "0.58rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                {item.region}
              </span>
            )}
            {item.entryType && (
              <span style={{ fontSize: "0.58rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                {item.entryType}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={{
            color: "#14110d",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "0.92rem",
            fontWeight: 600,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: hasImage ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}>
            {item.title}
          </h3>

          {/* Excerpt */}
          {(item.type === "directory" || !hasImage) && item.excerpt && (
            <p style={{
              color: "#7a6f5c",
              fontSize: "0.78rem",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: hasImage ? 2 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}>
              {item.excerpt}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
            {subLabel && <span style={{ color: "#c5491f", fontSize: "0.68rem", fontWeight: 500 }}>{subLabel}</span>}
            {subLabel && <span style={{ color: "#d8d0c6", fontSize: "0.65rem" }}>·</span>}
            <span style={{ color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>
        </div>

        {/* Image thumbnail */}
        {hasImage && (
          <div style={{
            width: "90px",
            height: "90px",
            flexShrink: 0,
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #e8e2d8",
            alignSelf: "center",
          }}>
            <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
          </div>
        )}
      </Link>

      {/* Reactions for pulse stories */}
      {item.type === "pulse" && item.wpId && (
        <div style={{ paddingTop: "0.5rem" }}>
          <ReactionBar
            itemId={item.wpId}
            itemType="pulse"
            initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
            shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/pulse/${item.slug}`}
          />
        </div>
      )}
    </article>
  );
}
