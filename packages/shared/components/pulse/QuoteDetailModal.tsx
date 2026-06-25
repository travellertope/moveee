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
          background: "var(--paper)",
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
          borderBottom: "1px solid var(--rule)",
          position: "sticky", top: 0,
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
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href={item.href}
              style={{
                color: "var(--ochre)", fontSize: "0.8rem", fontWeight: 400,
                textDecoration: "underline", textUnderlineOffset: "2px",
              }}
            >
              Full page →
            </Link>
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
          padding: "2rem 1.5rem", flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          {/* Decorative quote mark */}
          <span style={{
            color: "var(--rule)", fontFamily: "serif",
            fontSize: "4rem", lineHeight: 0.8, marginBottom: "0.5rem",
          }}>"</span>

          {/* Quote text */}
          <p style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.35rem",
            lineHeight: 1.55,
            fontStyle: "italic",
            color: "var(--ink)",
            marginBottom: "1.25rem",
          }}>
            {item.title}
          </p>

          {/* Attribution */}
          <div style={{
            display: "flex", flexDirection: "column", gap: "0.25rem",
            paddingTop: "1rem", borderTop: "1px solid var(--rule)",
          }}>
            {item.quoteAuthor && (
              <span style={{
                color: "var(--ochre)", fontSize: "0.95rem", fontWeight: 600,
                fontFamily: "var(--font-fraunces), serif",
              }}>
                — {item.quoteAuthor}
              </span>
            )}
            {item.quoteSource && (
              <span style={{ color: "var(--mute)", fontSize: "0.82rem", fontStyle: "italic" }}>
                {item.quoteSource}
              </span>
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
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
