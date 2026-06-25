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
              background: "var(--cat-directory-bg)", color: "var(--cat-directory-fg)",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "999px",
            }}>Directory</span>
            {item.entryType && (
              <span style={{ fontSize: "0.62rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.entryType}
              </span>
            )}
          </div>
          <button onClick={close} aria-label="Close" style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--ink)", lineHeight: 1, padding: "0.25rem", display: "flex",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Featured image */}
          {item.image && (
            <div style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--rule)" }}>
              <img src={item.image} alt={item.title} style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "260px" }} loading="lazy" />
            </div>
          )}

          {/* Title */}
          <h2 style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.3,
            color: "var(--ink)", marginBottom: "0.5rem",
          }}>
            {decodeHtml(item.title)}
          </h2>

          {/* Type badge */}
          {item.entryType && (
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={{
                background: "var(--cat-directory-bg)", color: "var(--cat-directory-fg)",
                fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "0.2rem 0.5rem", borderRadius: "999px",
              }}>
                {item.entryType}
              </span>
            </div>
          )}

          {/* Date */}
          <div style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "var(--mute)", marginBottom: "1rem" }}>
            Added {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>

          {/* Description */}
          {item.excerpt && (
            <div style={{
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.95rem", lineHeight: 1.7, color: "var(--ink-soft)",
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
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: "52px",
              background: "var(--cat-directory-fg)", color: "#fff",
              fontSize: "0.85rem", fontWeight: 700,
              borderRadius: "999px",
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
