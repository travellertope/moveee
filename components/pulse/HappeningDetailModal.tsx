"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";
import { decodeHtml } from "@/lib/decode-html";

interface Props {
  item: FeedItem;
  onClose: () => void;
}

function formatLongDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function HappeningDetailModal({ item, onClose }: Props) {
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

  const eventDateStr = item.eventDate ? formatLongDate(item.eventDate) : null;
  const endDateStr = item.endDate ? formatLongDate(item.endDate) : null;

  const rawText = item.excerpt ?? "";
  const paragraphs = rawText.split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);

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
              background: "#eeedfe", color: "#3c3489",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "2px",
            }}>Happening</span>
            {item.eventCategory && (
              <span style={{ fontSize: "0.62rem", color: "#b38238", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.eventCategory}
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
            color: "#14110d", marginBottom: "0.75rem",
          }}>
            {decodeHtml(item.title)}
          </h2>

          {/* Event details strip */}
          <div style={{
            background: "#fff", border: "1px solid #e8e2d8", borderRadius: "6px",
            padding: "0.85rem 1rem", marginBottom: "1rem",
            display: "flex", flexDirection: "column", gap: "0.5rem",
          }}>
            {eventDateStr && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <span style={{ color: "#3c3489", fontSize: "0.88rem", flexShrink: 0 }}>📅</span>
                <div style={{ fontSize: "0.85rem", color: "#14110d", lineHeight: 1.45 }}>
                  {eventDateStr}
                  {endDateStr && endDateStr !== eventDateStr && (
                    <span style={{ color: "#7a6f5c" }}> — {endDateStr}</span>
                  )}
                </div>
              </div>
            )}
            {item.location && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: "#3c3489", fontSize: "0.88rem", flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: "0.85rem", color: "#14110d" }}>{item.location}</span>
              </div>
            )}
            {item.admission && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: "#3c3489", fontSize: "0.88rem", flexShrink: 0 }}>🎟</span>
                <span style={{ fontSize: "0.85rem", color: "#14110d", fontWeight: 600 }}>{item.admission}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {paragraphs.length > 0 && (
            <div style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.95rem", lineHeight: 1.7, color: "#3a342b",
              marginBottom: "1.25rem",
            }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ margin: i === 0 ? 0 : "0.65em 0 0" }}>{p}</p>
              ))}
            </div>
          )}

          {/* CTA */}
          <Link
            href={item.href}
            style={{
              display: "inline-block",
              background: "#3c3489", color: "#fff",
              fontSize: "0.75rem", fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "0.55rem 1.25rem", borderRadius: "2px",
              textDecoration: "none",
            }}
          >
            View Event Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
