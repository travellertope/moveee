"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import ReactionBar from "./ReactionBar";
import type { FeedItem } from "@/lib/unified-feed";

interface Props {
  item: FeedItem;
  onClose: () => void;
}

export default function QuoteDetailModal({ item, onClose }: Props) {
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
          padding: "1.25rem",
          borderBottom: "1px solid #e0dbd1",
          position: "sticky", top: 0,
          background: "#faf8f5", zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "#f3eef8", color: "#7a4da0",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "999px",
            }}>Quote</span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href={item.href}
              style={{
                color: "#c5491f", fontSize: "0.8rem", fontWeight: 400,
                textDecoration: "underline", textUnderlineOffset: "2px",
              }}
            >
              Full page →
            </Link>
            <button onClick={close} aria-label="Close" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#14110d", lineHeight: 1, padding: "0.25rem", display: "flex",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: "2rem 1.5rem", flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          {/* Decorative quote mark */}
          <span style={{
            color: "#d8c9b0", fontFamily: "serif",
            fontSize: "4rem", lineHeight: 0.8, marginBottom: "0.5rem",
          }}>"</span>

          {/* Quote text */}
          <p style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.35rem",
            lineHeight: 1.55,
            fontStyle: "italic",
            color: "#14110d",
            marginBottom: "1.25rem",
          }}>
            {item.title}
          </p>

          {/* Attribution */}
          <div style={{
            display: "flex", flexDirection: "column", gap: "0.25rem",
            paddingTop: "1rem", borderTop: "1px solid #e8e2d8",
          }}>
            {item.quoteAuthor && (
              <span style={{
                color: "#c5491f", fontSize: "0.95rem", fontWeight: 600,
                fontFamily: "var(--font-fraunces), serif",
              }}>
                — {item.quoteAuthor}
              </span>
            )}
            {item.quoteSource && (
              <span style={{ color: "#7a6f5c", fontSize: "0.82rem", fontStyle: "italic" }}>
                {item.quoteSource}
              </span>
            )}
          </div>

          {/* Sharing reason */}
          {item.quoteSharingReason && (
            <div style={{
              marginTop: "1.25rem", padding: "1rem",
              background: "#ece5d6", borderRadius: "12px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              color: "#5a5142", fontSize: "0.85rem", lineHeight: 1.5,
            }}>
              💬 {item.quoteSharingReason}
            </div>
          )}

          {/* Date */}
          <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#bbb", marginTop: "1.5rem", textAlign: "center", display: "block", width: "100%" }}>
            {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          {/* Reactions */}
          {item.wpId && (
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #e8e2d8" }}>
              <ReactionBar
                noBorder
                itemId={item.wpId}
                itemType="quote"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/quotes/${item.wpId}-${item.slug}`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
