"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactionBar from "./ReactionBar";
import type { FeedItem } from "@/lib/unified-feed";
import { useQuoteShare } from "@/context/QuoteShareContext";
import type { WpComment } from "@/lib/pulse-wordpress";

const CommentThread = dynamic(() => import("./CommentThread"), { ssr: false });

function decodeHtml(str: string): string {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&rdquo;/g, "”")
    .replace(/&ldquo;/g, "“")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

interface Props {
  item: FeedItem;
  onClose: () => void;
}

export default function QuoteDetailModal({ item, onClose }: Props) {
  const close = useCallback(() => onClose(), [onClose]);
  const [comments, setComments] = useState<WpComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { shareQuote } = useQuoteShare();

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
    if (!item.wpId) return;
    setCommentsLoading(true);
    fetch(`/api/pulse/comments?postId=${item.wpId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [item.wpId]);

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(20,17,13,0.60)",
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          maxHeight: "90vh",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem",
          borderBottom: "1px solid var(--rule)",
          flexShrink: 0,
          background: "var(--paper-header)", zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "var(--cat-quote-bg)", color: "var(--cat-quote-fg)",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "999px",
            }}>Quote</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button onClick={close} aria-label="Close" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ink)", lineHeight: 1, padding: "0.25rem", display: "flex",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: "1.5rem", flex: "1 1 auto", minHeight: 0, overflowY: "auto",
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          {/* Quote block — styled to match the feed card and mockup */}
          <div style={{
            borderLeft: "4px solid var(--ochre)",
            borderRadius: "var(--radius-xl)",
            background: "rgba(122,36,28,0.05)",
            padding: "1.25rem 1.25rem 1rem",
            marginBottom: "1.25rem",
          }}>
            {/* Decorative quote mark — 24px, ochre */}
            <div style={{
              color: "var(--ochre)", fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "24px", lineHeight: 1, marginBottom: "8px", userSelect: "none",
            }}>"</div>

            {/* Quote text */}
            <p style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "1.15rem",
              fontWeight: 500,
              lineHeight: 1.6,
              fontStyle: "italic",
              color: "var(--ink)",
              margin: "0 0 10px",
            }}>
              "{decodeHtml(item.title)}"
            </p>

            {/* Attribution — author bold + source in parens, text-xs */}
            {(item.quoteAuthor || item.quoteSource) && (
              <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.4 }}>
                {item.quoteAuthor && (
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>
                    — {decodeHtml(item.quoteAuthor)}
                  </span>
                )}
                {item.quoteSource && (
                  <span style={{ color: "var(--mute)", fontWeight: 400 }}>
                    {item.quoteAuthor ? " " : ""}({decodeHtml(item.quoteSource)})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Sharing reason */}
          {item.quoteSharingReason && (
            <div style={{
              marginTop: "1.25rem", padding: "1rem",
              background: "var(--paper-deep)", borderRadius: "12px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              color: "var(--ink-soft)", fontSize: "0.85rem", lineHeight: 1.5,
            }}>
              💬 {item.quoteSharingReason}
            </div>
          )}

          {/* Date */}
          <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "var(--mute)", marginTop: "1.5rem", textAlign: "center", display: "block", width: "100%" }}>
            {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          {/* Reactions */}
          {item.wpId && (
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--rule)" }}>
              <ReactionBar
                noBorder
                itemId={item.wpId}
                itemType="quote"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quotes/${item.wpId}-${item.slug}`}
                onShare={() => {
                  const quoteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://themoveee.com"}/quotes/${item.wpId}-${item.slug}`;
                  return shareQuote(decodeHtml(item.title), item.quoteAuthor || null, item.quoteSource || null, quoteUrl);
                }}
              />
            </div>
          )}

          {/* Comments */}
          {item.wpId && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--rule)" }}>
              {commentsLoading ? (
                <p style={{ color: "var(--mute)", fontSize: "0.8rem" }}>Loading comments…</p>
              ) : (
                <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
