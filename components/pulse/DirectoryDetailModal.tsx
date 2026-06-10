"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";
import { decodeHtml } from "@/lib/decode-html";

interface Props {
  item: FeedItem;
  onClose: () => void;
}

export default function DirectoryDetailModal({ item, onClose }: Props) {
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
              background: "#e8f5ee", color: "#085041",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "2px",
            }}>Directory</span>
            {item.entryType && (
              <span style={{ fontSize: "0.62rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.entryType}
              </span>
            )}
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
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Featured image */}
          {item.image && (
            <div style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid #e8e2d8" }}>
              <img src={item.image} alt={item.title} style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "260px" }} loading="lazy" />
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.3,
            color: "#14110d", marginBottom: "0.5rem",
          }}>
            {decodeHtml(item.title)}
          </h2>

          {/* Type badge */}
          {item.entryType && (
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{
                background: "#e8f5ee", color: "#085041",
                fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "0.2rem 0.5rem", borderRadius: "2px",
              }}>
                {item.entryType}
              </span>
            </div>
          )}

          {/* Date */}
          <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "1rem" }}>
            Added {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          {/* Description */}
          {item.excerpt && (
            <div style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.95rem", lineHeight: 1.7, color: "#3a342b",
              marginBottom: "1.25rem",
            }}>
              {item.excerpt.split(/\n\n+/).map((p, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : "0.65em 0 0" }}>
                  {decodeHtml(p.trim())}
                </p>
              ))}
            </div>
          )}

          {/* CTA */}
          <Link
            href={item.href}
            style={{
              display: "inline-block",
              background: "#085041", color: "#fff",
              fontSize: "0.75rem", fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "0.55rem 1.25rem", borderRadius: "2px",
              textDecoration: "none",
            }}
          >
            View Full Entry →
          </Link>
        </div>
      </div>
    </div>
  );
}
