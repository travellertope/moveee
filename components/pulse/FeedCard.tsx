"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { FeedItem } from "@/lib/unified-feed";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import SourcePreviewCard from "./SourcePreviewCard";

const PulseDetailModal = dynamic(() => import("./PulseDetailModal"), { ssr: false });

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        cursor: "zoom-out",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: "rgba(255,255,255,0.12)", border: "none",
          borderRadius: "50%", width: "36px", height: "36px",
          color: "#fff", fontSize: "1rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ✕
      </button>

      {/* Image — stop click propagating so clicking image itself doesn't close */}
      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: "100%",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "4px",
          cursor: "default",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}

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
            }}>
              {item.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Badge {...typeMeta} />
              {item.quoteAuthor && <span style={{ color: "#c5491f", fontSize: "0.75rem", fontWeight: 600 }}>{item.quoteAuthor}</span>}
              {item.quoteSource && <span style={{ color: "#7a6f5c", fontSize: "0.72rem" }}>· {item.quoteSource}</span>}
              <span style={{ marginLeft: "auto", color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
              <Link
                href={item.href}
                style={{ display: "flex", alignItems: "center", color: "#7a6f5c", textDecoration: "none", flexShrink: 0 }}
                aria-label="View quote"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ── Community card (tweet-style) ──
  if (item.type === "community") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [lightbox, setLightbox] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeLightbox = useCallback(() => setLightbox(null), []);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [reportState, setReportState] = useState<"idle" | "confirm" | "sent" | "error">("idle");

    async function submitReport(reason: string) {
      setReportState("sent");
      try {
        await fetch("/api/community/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: item.wpId, reason }),
        });
      } catch {
        setReportState("error");
      }
    }

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
            {item.communityTier === "patron" && (
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.52rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#b38238",
                background: "rgba(179,130,56,.1)",
                border: "1px solid rgba(179,130,56,.25)",
                padding: "1px 5px",
                lineHeight: 1.6,
                flexShrink: 0,
              }}>Pro</span>
            )}
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
            <>
              <div
                onClick={() => setLightbox(item.image!)}
                style={{ width: "100%", maxHeight: "280px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid #e8e2d8", cursor: "zoom-in" }}
              >
                <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.15s" }} loading="lazy" />
              </div>
              {lightbox && <ImageLightbox src={lightbox} alt={item.title} onClose={closeLightbox} />}
            </>
          )}

          {/* Reactions + comment link — share the same border-top row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            minWidth: 0, paddingTop: "0.5rem",
            borderTop: "1px solid #e8e2d8", marginTop: "0.25rem",
          }}>
            {item.wpId && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <ReactionBar
                  noBorder
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

            {/* Report */}
            {reportState === "idle" && (
              <button
                onClick={() => setReportState("confirm")}
                title="Report this post"
                style={{ background: "none", border: "none", padding: "0 0 0 4px", cursor: "pointer", color: "#c8bfb0", fontSize: "0.68rem", flexShrink: 0, lineHeight: 1 }}
              >
                ⚑
              </button>
            )}
            {reportState === "confirm" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                <span style={{ fontSize: "0.68rem", color: "#7a6f5c" }}>Report as:</span>
                {(["spam", "harassment", "inappropriate"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => submitReport(r)}
                    style={{ background: "#fef2f2", border: "1px solid rgba(192,57,43,.2)", color: "#c0392b", borderRadius: 3, padding: "1px 6px", fontSize: "0.62rem", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {r}
                  </button>
                ))}
                <button onClick={() => setReportState("idle")} style={{ background: "none", border: "none", color: "#bbb", fontSize: "0.68rem", cursor: "pointer" }}>✕</button>
              </div>
            )}
            {reportState === "sent" && (
              <span style={{ fontSize: "0.68rem", color: "#7a6f5c", flexShrink: 0 }}>Reported — thank you.</span>
            )}
            {reportState === "error" && (
              <span style={{ fontSize: "0.68rem", color: "#c0392b", flexShrink: 0 }}>Couldn't send report.</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // ── Pulse card — inline content with source preview ──
  if (item.type === "pulse") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);

    const bodyText = item.body ? item.body.replace(/<[^>]+>/g, "").trim() : (item.excerpt ?? "");
    const CLAMP_CHARS = 380;
    const isLong = bodyText.length > CLAMP_CHARS;
    const [expanded, setExpanded] = useState(false);
    const displayText = isLong && !expanded ? bodyText.slice(0, CLAMP_CHARS) + "…" : bodyText;

    const goUrl = item.wpId ? `/go/${item.wpId}` : item.sourceUrl ?? "#";

    return (
      <>
        <article
          style={{
            background: "#fff",
            borderBottom: "1px solid #e8e2d8",
            padding: "1rem 1.25rem",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Badges row */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <span style={{ display: "inline-block", background: "#fef3e2", color: "#b38238", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.18rem 0.45rem", borderRadius: "2px" }}>
              Pulse
            </span>
            {item.region && (
              <span style={{ fontSize: "0.58rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, alignSelf: "center" }}>
                {item.region}
              </span>
            )}
            {item.arm && (
              <span style={{ fontSize: "0.58rem", color: "#c5491f", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, alignSelf: "center" }}>
                {item.arm}
              </span>
            )}
            <span style={{ marginLeft: "auto", color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>

          {/* Clickable body opens modal */}
          <div
            onClick={() => setModalOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <h3 style={{
              color: "#14110d",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.97rem",
              fontWeight: 700,
              lineHeight: 1.35,
              marginBottom: "0.5rem",
            }}>
              {item.title}
            </h3>

            {item.image && (
              <div style={{ width: "100%", maxHeight: "220px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid #e8e2d8" }}>
                <img src={item.image} alt={item.title} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
            )}

            {displayText && (
              <p style={{ color: "#3a342b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                {displayText}
              </p>
            )}
          </div>

          {isLong && !expanded && (
            <button
              onClick={() => setModalOpen(true)}
              style={{ background: "none", border: "none", color: "#b38238", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: "0.25rem 0", marginTop: "0.25rem" }}
            >
              Read more
            </button>
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

          {/* Reactions + comment link */}
          {item.wpId && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.6rem", marginTop: "0.5rem", borderTop: "1px solid #e8e2d8" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ReactionBar
                  noBorder
                  itemId={item.wpId}
                  itemType="pulse"
                  initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                  shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/connect`}
                />
              </div>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "#7a6f5c",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  flexShrink: 0,
                  padding: 0,
                  fontFamily: "inherit",
                }}
                aria-label="View comments"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {(item.commentCount ?? 0) > 0 && (
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{item.commentCount}</span>
                )}
              </button>
            </div>
          )}
        </article>

        {modalOpen && <PulseDetailModal item={item} onClose={closeModal} />}
      </>
    );
  }

  // ── Standard cards (editorial, happening, directory) — horizontal timeline style ──
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

    </article>
  );
}
