"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { WpComment } from "@/lib/pulse-wordpress";
import CommentThread from "./CommentThread";
import SourcePreviewCard from "./SourcePreviewCard";
import type { FeedItem } from "@/lib/unified-feed";
import { sanitizeHtml } from "@/lib/sanitize";

interface PulseDetailModalProps {
  item: FeedItem;
  onClose: () => void;
}

export default function PulseDetailModal({ item, onClose }: PulseDetailModalProps) {
  const [comments, setComments] = useState<WpComment[]>([]);
  const [loading, setLoading] = useState(true);

  const close = useCallback(() => onClose(), [onClose]);

  // Close on Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close]);

  // Fetch comments.
  useEffect(() => {
    if (!item.wpId) { setLoading(false); return; }
    fetch(`/api/pulse/comments?postId=${item.wpId}`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.wpId]);

  const goUrl = item.wpId ? `/go/${item.wpId}` : item.sourceUrl ?? "#";

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        background: "rgba(20,17,13,0.55)",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100vw)",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem",
          borderBottom: "1px solid var(--rule)",
          position: "sticky",
          top: 0,
          background: "var(--paper-header)",
          zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "var(--cat-happening-bg)",
              color: "var(--cat-happening-fg)",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.18rem 0.45rem",
              borderRadius: "999px",
            }}>Editorial</span>
            {item.region && (
              <span style={{ fontSize: "0.62rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.region}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {item.slug && (
              <Link
                href={`/pulse/${item.slug}`}
                style={{
                  color: "var(--ochre)",
                  fontSize: "0.8rem",
                  fontWeight: 400,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Full page →
              </Link>
            )}
            <button
              onClick={close}
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink)",
                lineHeight: 1,
                padding: "0.25rem",
                display: "flex",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Title */}
          <h2 style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            lineHeight: 1.3,
            color: "var(--ink)",
            marginBottom: "0.75rem",
          }}>
            {item.title}
          </h2>

          {/* Date + curated label */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
            <span style={{ color: "var(--mute)", fontSize: "0.75rem" }}>
              {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {item.source && (
              <span style={{ color: "var(--mute)", fontSize: "0.75rem" }}>
                Via <span style={{ color: "var(--gold)", fontWeight: 600 }}>{item.source}</span>
              </span>
            )}
            <span style={{
              color: "var(--gold)",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "rgba(179,130,56,.08)",
              padding: "0.12rem 0.35rem",
              borderRadius: "2px",
            }}>
              Curated with AI
            </span>
          </div>

          {/* Featured image */}
          {item.image && (
            <div style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--rule)" }}>
              <img src={item.image} alt={item.title} style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "220px" }} loading="lazy" />
            </div>
          )}

          {/* Full body */}
          {item.body && (
            <>
              <style>{`.modal-pulse-body p { margin: 0 0 0.75em; } .modal-pulse-body p:last-child { margin-bottom: 0; }`}</style>
              <div
                className="modal-pulse-body"
                style={{
                  fontFamily: "var(--font-fraunces), serif",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  color: "var(--ink-soft)",
                  marginBottom: "1rem",
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.body) }}
              />
            </>
          )}

          {/* Source preview card */}
          {item.sourceUrl && (
            <SourcePreviewCard
              goUrl={goUrl}
              sourceName={item.source ?? ""}
              sourceUrl={item.sourceUrl}
              ogTitle={item.ogTitle}
              ogDescription={item.ogDescription}
              ogImage={item.ogImage}
            />
          )}

          {/* Comment thread */}
          <div style={{ marginTop: "1.75rem" }}>
            {loading ? (
              <p style={{ color: "var(--mute)", fontSize: "0.8rem" }}>Loading comments…</p>
            ) : item.wpId ? (
              <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
