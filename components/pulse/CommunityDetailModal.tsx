"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { WpComment } from "@/lib/pulse-wordpress";
import CommentThread from "./CommentThread";
import HashtagText from "./HashtagText";
import ReactionBar from "./ReactionBar";
import SourcePreviewCard from "./SourcePreviewCard";
import type { FeedItem } from "@/lib/unified-feed";

function stripTrailingUrl(text: string, sourceUrl?: string): string {
  if (!sourceUrl) return text;
  const escaped = sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\s*${escaped}\\s*$`), "").trimEnd();
}

interface CommunityDetailModalProps {
  item: FeedItem;
  onClose: () => void;
  onHashtagClick?: (hashtag: string) => void;
}

export default function CommunityDetailModal({ item, onClose, onHashtagClick }: CommunityDetailModalProps) {
  const [comments, setComments] = useState<WpComment[]>([]);
  const [loading, setLoading] = useState(true);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close]);

  useEffect(() => {
    if (!item.wpId) { setLoading(false); return; }
    fetch(`/api/pulse/comments?postId=${item.wpId}`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.wpId]);

  const initials = (item.communityAuthor ?? "?")
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(20,17,13,0.55)",
        display: "flex", justifyContent: "flex-end", alignItems: "stretch",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100vw)",
          background: "var(--paper, #f3ece0)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #e0dbd1",
          position: "sticky", top: 0,
          background: "var(--paper, #f3ece0)", zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "#edf7ed", color: "#2e7d32",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "2px",
            }}>Community</span>
            {item.communityTag && (
              <span style={{ fontSize: "0.62rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.communityTag}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {item.slug && (
              <Link
                href={`/community/${item.slug}`}
                style={{
                  color: "#7a6f5c", fontSize: "0.65rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  textDecoration: "none", padding: "0.2rem 0.5rem",
                  border: "1px solid #d8d0c6", borderRadius: "2px",
                }}
              >
                Open full page <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "2px" }}><path d="M3 9L9 3M4 3h5v5"/></svg>
              </Link>
            )}
            <button
              onClick={close}
              aria-label="Close"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#7a6f5c", fontSize: "1.1rem", lineHeight: 1, padding: "0.25rem",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Author row */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "#edf7ed", border: "1px solid #c8e6c9",
              color: "#2e7d32", fontSize: "0.65rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              overflow: "hidden",
            }}>
              {item.communityAuthorAvatar ? (
                <img src={item.communityAuthorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>
            <div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "#14110d", fontSize: "0.88rem", fontWeight: 600 }}>
                  {item.communityAuthor || "Community Member"}
                </span>
                {item.communityTier === "patron" && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.52rem", letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "#b38238", background: "rgba(179,130,56,.1)",
                    border: "1px solid rgba(179,130,56,.25)", padding: "1px 5px", lineHeight: 1.6,
                  }}>Pro</span>
                )}
              </div>
              <span style={{ color: "#999", fontSize: "0.72rem" }}>
                {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Post text */}
          <div style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "#3a342b",
            marginBottom: "1rem",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}>
            <HashtagText text={stripTrailingUrl(item.title, item.sourceUrl && !item.image ? item.sourceUrl : undefined)} onHashtagClick={onHashtagClick} />
          </div>

          {/* Image */}
          {item.image && (
            <div style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid #e8e2d8" }}>
              <img src={item.image} alt="" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "320px" }} loading="lazy" />
            </div>
          )}

          {/* Link preview (only if no image) */}
          {!item.image && item.sourceUrl && (
            <div style={{ marginBottom: "1rem" }}>
              <SourcePreviewCard
                goUrl={`/go/link?url=${encodeURIComponent(item.sourceUrl!)}`}
                sourceName={item.source ?? ""}
                sourceUrl={item.sourceUrl}
                ogTitle={item.ogTitle}
                ogDescription={item.ogDescription}
                ogImage={item.ogImage}
              />
            </div>
          )}

          {/* Reactions */}
          {item.wpId && (
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #e8e2d8" }}>
              <ReactionBar
                noBorder
                itemId={item.wpId}
                itemType="community"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${item.slug}`}
              />
            </div>
          )}

          {/* Comment thread */}
          <div>
            {loading ? (
              <p style={{ color: "#999", fontSize: "0.8rem" }}>Loading comments…</p>
            ) : item.wpId ? (
              <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
