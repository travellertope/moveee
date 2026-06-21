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
          padding: "1rem 1.25rem",
          borderBottom: "1px solid #e0dbd1",
          position: "sticky", top: 0,
          background: "var(--paper, #f3ece0)", zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "#f3eef8", color: "#7a4da0",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "2px",
            }}>Quote</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link
              href={item.href}
              style={{
                color: "#7a6f5c", fontSize: "0.65rem", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                textDecoration: "none", padding: "0.2rem 0.5rem",
                border: "1px solid #d8d0c6", borderRadius: "2px",
              }}
            >
              Full page <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "2px" }}><path d="M3 9L9 3M4 3h5v5"/></svg>
            </Link>
            <button onClick={close} aria-label="Close" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#7a6f5c", fontSize: "1.1rem", lineHeight: 1, padding: "0.25rem",
            }}>✕</button>
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
              marginTop: "1.25rem", padding: "0.75rem 1rem",
              background: "#ece5d6", borderRadius: "4px",
              color: "#5a5142", fontSize: "0.85rem", lineHeight: 1.5,
            }}>
              💬 {item.quoteSharingReason}
            </div>
          )}

          {/* Date */}
          <div style={{ fontSize: "0.72rem", color: "#bbb", marginTop: "1.5rem" }}>
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
