"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { FeedItem } from "@/lib/unified-feed";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";
import SourcePreviewCard from "./SourcePreviewCard";

function PollDisplay({ postId, options, expiresAt }: { postId?: string; options: { text: string; votes: number }[]; expiresAt?: string }) {
  const [voted, setVoted] = useState<number | null>(null);
  const [pollOpts, setPollOpts] = useState(options);
  const [voting, setVoting] = useState(false);

  const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const showResults = voted !== null || expired;
  const totalVotes = pollOpts.reduce((s, o) => s + (o.votes ?? 0), 0);

  async function vote(i: number) {
    if (voting || voted !== null || expired || !postId) return;
    setVoting(true);
    try {
      const res = await fetch("/api/community/poll-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: Number(postId), option_index: i }),
      });
      if (res.ok) {
        const data = await res.json();
        setPollOpts(data.options);
        setVoted(i);
      }
    } catch {}
    setVoting(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "0.6rem" }}>
      {pollOpts.map((opt, i) => {
        const pct = showResults && totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        return (
          <button
            key={i}
            type="button"
            onClick={() => vote(i)}
            disabled={showResults || voting}
            style={{
              position: "relative",
              background: showResults
                ? `linear-gradient(to right, rgba(46,125,50,0.1) ${pct}%, transparent ${pct}%)`
                : "#fff",
              border: `1px solid ${voted === i ? "#2e7d32" : "#e0d8ce"}`,
              borderRadius: "4px",
              padding: "8px 12px",
              textAlign: "left",
              cursor: showResults ? "default" : "pointer",
              fontSize: "0.82rem",
              color: "#14110d",
              fontFamily: "inherit",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{opt.text}</span>
            {showResults && <span style={{ fontSize: "0.72rem", color: "#7a6f5c", fontWeight: 600 }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: "0.68rem", color: "#7a6f5c" }}>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {expiresAt && !expired && ` · ends ${new Date(expiresAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`}
        {expired && " · ended"}
      </div>
    </div>
  );
}

function RsvpDisplay({
  postId,
  capacity,
  initialCount,
}: {
  postId?: string;
  capacity?: number;
  initialCount?: number;
}) {
  const [status, setStatus] = useState<{ rsvped: boolean; count: number } | null>(
    initialCount !== undefined ? { rsvped: false, count: initialCount } : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/community/event-rsvp-status?post_id=${postId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus({ rsvped: !!data.rsvped, count: Number(data.count ?? initialCount ?? 0) });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const count = status?.count ?? initialCount ?? 0;
  const isFull = !!capacity && capacity > 0 && count >= capacity;
  const rsvped = !!status?.rsvped;

  async function toggle() {
    if (loading || !postId) return;
    if (!rsvped && isFull) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/community/event-${rsvped ? "rsvp-cancel" : "rsvp"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: Number(postId) }),
      });
      if (res.ok) {
        setStatus((prev) => ({
          rsvped: !rsvped,
          count: Math.max(0, (prev?.count ?? count) + (rsvped ? -1 : 1)),
        }));
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.6rem" }}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading || (!rsvped && isFull)}
        style={{
          background: rsvped ? "#fff" : "var(--ochre, #b38238)",
          color: rsvped ? "#b38238" : "#fff",
          border: "1px solid #b38238",
          borderRadius: "4px",
          padding: "7px 14px",
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: !rsvped && isFull ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {rsvped ? "Going ✓" : isFull ? "Full" : "RSVP"}
      </button>
      <span style={{ fontSize: "0.72rem", color: "#7a6f5c" }}>
        {count} going{capacity ? ` · ${Math.max(0, capacity - count)} spots left` : ""}
      </span>
    </div>
  );
}
import InternalLinkCard from "./InternalLinkCard";

const PulseDetailModal = dynamic(() => import("./PulseDetailModal"), { ssr: false });
const CommunityDetailModal = dynamic(() => import("./CommunityDetailModal"), { ssr: false });
const HappeningDetailModal = dynamic(() => import("./HappeningDetailModal"), { ssr: false });
const DirectoryDetailModal = dynamic(() => import("./DirectoryDetailModal"), { ssr: false });
const QuoteDetailModal = dynamic(() => import("./QuoteDetailModal"), { ssr: false });

/** Remove the last URL from text when a link preview will be shown for it. */
function stripTrailingUrl(text: string, sourceUrl?: string): string {
  if (!sourceUrl) return text;
  // Escape special regex chars in the URL then strip it (with surrounding whitespace)
  const escaped = sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\s*${escaped}\\s*$`), "").trimEnd();
}

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

function GalleryCarousel({ images, onTap }: { images: string[]; onTap: (src: string) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const count = images.length;

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div style={{ marginBottom: "0.6rem", borderRadius: "8px", overflow: "hidden", border: "1px solid #e8e2d8" }}>
        <img
          src={images[0]}
          alt=""
          onClick={() => onTap(images[0])}
          style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block", cursor: "zoom-in" }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "0.6rem", border: "1px solid #e8e2d8", borderRadius: "8px", overflow: "hidden" }}>
      {/* Scrollable carousel row */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setActiveIdx(Math.min(Math.max(0, idx), count - 1));
        }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt=""
            onClick={() => onTap(img)}
            style={{
              flex: "0 0 100%",
              width: "100%",
              height: "260px",
              objectFit: "cover",
              display: "block",
              scrollSnapAlign: "start",
              cursor: "zoom-in",
            }}
            loading="lazy"
          />
        ))}
      </div>
      {/* Dots + counter */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "6px 12px", gap: "6px", position: "relative",
        borderTop: "1px solid #e8e2d8", backgroundColor: "var(--paper, #f3ece0)",
      }}>
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          {images.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIdx ? "16px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: i === activeIdx ? "var(--ochre, #b38238)" : "#c8bfaf",
                transition: "width 0.2s ease",
              }}
            />
          ))}
        </div>
        <span style={{
          position: "absolute", right: "12px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "10px", color: "#9e9e9e",
        }}>
          {activeIdx + 1} / {count}
        </span>
      </div>
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
  onMentionClick,
  interestMatch,
}: {
  item: FeedItem;
  onTagClick?: (tag: string) => void;
  onMentionClick?: (username: string) => void;
  interestMatch?: boolean;
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  const handleMentionClick = onMentionClick ?? ((username: string) => router.push(`/${username}`));
  const typeMeta = TYPE_BADGE[item.type] ?? TYPE_BADGE.pulse;

  // ── Quote card ──
  if (item.type === "quote") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);

    return (
      <>
        <article
          onClick={() => setModalOpen(true)}
          style={{
            background: "#fff",
            borderBottom: "1px solid #e8e2d8",
            overflow: "hidden",
            minWidth: 0,
            padding: "1.1rem 1.25rem",
            cursor: "pointer",
          }}
        >
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
                  onClick={(e) => e.stopPropagation()}
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
        {modalOpen && <QuoteDetailModal item={item} onClose={closeModal} />}
      </>
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);

    const isPro = item.communityTier === "patron";

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
      <>
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
          {item.communityAuthorUsername ? (
            <Link href={`/connect/${item.communityAuthorUsername}`} onClick={e => e.stopPropagation()} style={{ textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "#edf7ed", border: "1px solid #c8e6c9",
                color: "#2e7d32", fontSize: "0.62rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                ...(isPro ? { boxShadow: "0 0 0 2.5px #b38238, 0 0 16px 4px rgba(179,130,56,.6)" } : {}),
              }}>
                {item.communityAuthorAvatar ? (
                  <img src={item.communityAuthorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (item.communityAuthor ?? "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"
                )}
              </div>
            </Link>
          ) : (
            <div style={{
              width: "34px", height: "34px", borderRadius: "50%",
              background: "#edf7ed", border: "1px solid #c8e6c9",
              color: "#2e7d32", fontSize: "0.62rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              ...(isPro ? { boxShadow: "0 0 0 2.5px #b38238, 0 0 16px 4px rgba(179,130,56,.6)" } : {}),
            }}>
              {item.communityAuthorAvatar ? (
                <img src={item.communityAuthorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (item.communityAuthor ?? "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?"
              )}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
              {item.communityAuthorUsername ? (
                <Link href={`/connect/${item.communityAuthorUsername}`} style={{ color: "#14110d", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                  {item.communityAuthor || "Community Member"}
                </Link>
              ) : (
                <span style={{ color: "#14110d", fontSize: "0.82rem", fontWeight: 600 }}>
                  {item.communityAuthor || "Community Member"}
                </span>
              )}
              {isPro && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-label="Connect Pro" style={{ flexShrink: 0 }}>
                  <path d="M12 2l2.4 1.7 2.9-.4 1.2 2.6 2.6 1.2-.4 2.9L22 12l-1.7 2.4.4 2.9-2.6 1.2-1.2 2.6-2.9-.4L12 22l-2.4-1.7-2.9.4-1.2-2.6-2.6-1.2.4-2.9L2 12l1.7-2.4-.4-2.9 2.6-1.2 1.2-2.6 2.9.4L12 2z" fill="#B38238"/>
                  <path d="M8.5 12.2l2.4 2.4 4.8-5.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
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
              {interestMatch && (
                <span title="Matches your interests" style={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "var(--ochre, #b38238)",
                  border: "1px solid rgba(179,130,56,.4)",
                  borderRadius: 2,
                  padding: "0.1rem 0.35rem",
                  flexShrink: 0,
                }}>
                  ✦ For You
                </span>
              )}
            </div>

            {/* Text — clicking opens modal */}
            <div
              onClick={() => setModalOpen(true)}
              style={{ cursor: "pointer" }}
            >
              {/* Template-specific header badges */}
              {item.templateType && item.templateType !== "post" && (
                <div style={{ marginBottom: "0.4rem" }}>
                  {item.templateType === "hidden-gem" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b38238", background: "rgba(179,130,56,0.1)", padding: "2px 6px", borderRadius: "2px" }}>
                      Hidden Gem {item.starRating ? "★".repeat(item.starRating) : ""}
                    </span>
                  )}
                  {item.templateType === "cultural-take" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b48a8", background: "rgba(107,72,168,0.08)", padding: "2px 6px", borderRadius: "2px" }}>
                      Take{item.locationName ? ` · ${item.locationName}` : ""}
                    </span>
                  )}
                  {item.templateType === "food-review" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c5491f", background: "rgba(197,73,31,0.08)", padding: "2px 6px", borderRadius: "2px" }}>
                      Food Review {item.foodDishName ? `· ${item.foodDishName}` : ""}
                    </span>
                  )}
                  {item.templateType === "creative-showcase" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1976d2", background: "rgba(25,118,210,0.08)", padding: "2px 6px", borderRadius: "2px" }}>
                      Creative Showcase
                    </span>
                  )}
                  {item.templateType === "itinerary" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2e7d32", background: "rgba(46,125,50,0.08)", padding: "2px 6px", borderRadius: "2px" }}>
                      Weekend Route
                    </span>
                  )}
                  {item.templateType === "event" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a8351f", background: "rgba(168,53,31,0.08)", padding: "2px 6px", borderRadius: "2px" }}>
                      Event{item.eventCategory ? ` · ${item.eventCategory}` : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Location badge */}
              {item.locationName && (
                <div style={{ fontSize: "0.72rem", color: "#7a6f5c", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>📍</span> {item.locationName}
                </div>
              )}

              <div style={{
                color: "#14110d",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: item.image ? "0.65rem" : "0.5rem",
              }}>
                <HashtagText text={stripTrailingUrl(item.title, item.sourceUrl && !item.image ? item.sourceUrl : undefined)} onMentionClick={handleMentionClick} clamp={6} />
              </div>
            </div>

            {/* Food review ratings */}
            {item.templateType === "food-review" && item.foodRatingTaste && (
              <div style={{ display: "flex", gap: "16px", marginBottom: "0.5rem", fontSize: "0.72rem", color: "#7a6f5c" }}>
                <span>Taste {"★".repeat(item.foodRatingTaste)}{"☆".repeat(5 - item.foodRatingTaste)}</span>
                {item.foodRatingValue && <span>Value {"★".repeat(item.foodRatingValue)}{"☆".repeat(5 - item.foodRatingValue)}</span>}
                {item.foodRatingVibe && <span>Vibe {"★".repeat(item.foodRatingVibe)}{"☆".repeat(5 - item.foodRatingVibe)}</span>}
              </div>
            )}

            {/* Poll inline */}
            {item.templateType === "poll" && item.pollOptions && (
              <PollDisplay postId={item.wpId} options={item.pollOptions} expiresAt={item.pollExpiresAt} />
            )}

            {/* Event details + RSVP */}
            {item.templateType === "event" && (
              <div style={{ fontSize: "0.78rem", color: "#7a6f5c", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                {item.eventDate && (
                  <div>
                    📅 {new Date(item.eventDate).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" })}
                    {item.endDate && ` – ${new Date(item.endDate).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`}
                  </div>
                )}
                {(item.location || item.city) && (
                  <div>📍 {[item.location, item.city].filter(Boolean).join(", ")}</div>
                )}
                {item.admission && <div>🎟 {item.admission}</div>}
                {item.organiserName && item.organiserSlug && (
                  <div>
                    Organised by{" "}
                    <a href={`/directory/${item.organiserSlug}`} style={{ color: "#b38238" }}>
                      {item.organiserName}
                    </a>
                  </div>
                )}
                {item.ticketUrl && (
                  <a href={item.ticketUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#b38238", display: "inline-block", marginTop: "4px" }}>
                    Get tickets →
                  </a>
                )}
              </div>
            )}
            {item.templateType === "event" && item.rsvpEnabled && (
              <RsvpDisplay postId={item.wpId} capacity={item.rsvpCapacity} initialCount={item.rsvpCount} />
            )}

            {/* Gallery carousel — all image-capable templates */}
            {item.galleryImages && item.galleryImages.length >= 1 && (
              <GalleryCarousel images={item.galleryImages} onTap={setLightbox} />
            )}

            {/* Video embed */}
            {item.videoUrl && (
              <div style={{ marginBottom: "0.6rem" }}>
                {item.videoUrl.includes("youtube.com") || item.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${item.videoUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] ?? ""}`}
                    style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "6px" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#b38238", fontSize: "0.78rem" }}>
                    Watch video →
                  </a>
                )}
              </div>
            )}

            {/* Itinerary stops */}
            {item.templateType === "itinerary" && item.itineraryStops && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "0.6rem" }}>
                {item.itineraryStops.map((stop: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "var(--ochre, #b38238)", color: "#fff",
                      fontSize: "0.65rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#14110d" }}>{stop.name}</div>
                      {stop.note && <div style={{ fontSize: "0.75rem", color: "#7a6f5c", lineHeight: 1.4 }}>{stop.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single image — only when no gallery */}
            {item.image && !item.galleryImages?.length && (
              <div
                onClick={() => setLightbox(item.image!)}
                style={{ width: "100%", maxHeight: "280px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid #e8e2d8", cursor: "zoom-in" }}
              >
                <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.15s" }} loading="lazy" />
              </div>
            )}
            {lightbox && <ImageLightbox src={lightbox} alt={item.title} onClose={closeLightbox} />}

            {/* Link preview card (only if no image) */}
            {!item.image && item.sourceUrl && (
              <div style={{ marginBottom: "0.5rem" }}>
                <SourcePreviewCard
                  goUrl={`/go/link?url=${encodeURIComponent(item.sourceUrl)}`}
                  sourceName={item.source ?? ""}
                  sourceUrl={item.sourceUrl}
                  ogTitle={item.ogTitle}
                  ogDescription={item.ogDescription}
                  ogImage={item.ogImage}
                />
              </div>
            )}

            {/* Reactions + comment button */}
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
                    shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${item.slug}`}
                  />
                </div>
              )}
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.3rem",
                  color: "#7a6f5c", background: "none", border: "none",
                  cursor: "pointer", fontSize: "0.75rem", flexShrink: 0,
                  padding: 0, fontFamily: "inherit",
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

        {modalOpen && (
          <CommunityDetailModal item={item} onClose={closeModal} onMentionClick={handleMentionClick} />
        )}
      </>
    );
  }

  // ── Pulse card — inline content with source preview ──
  if (item.type === "pulse") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);

    // Use the raw HTML body for rendering (preserves <p> paragraphs).
    // Fall back to excerpt (already plain text) if no body.
    const hasHtmlBody = !!item.body;
    const CLAMP_LINES = 6; // CSS line-clamp applied when not expanded
    const [expanded, setExpanded] = useState(false);
    // For "is long" heuristic on plain-text fallback path
    const plainText = hasHtmlBody ? item.body!.replace(/<[^>]+>/g, "") : (item.excerpt ?? "");
    const isLong = plainText.length > 320;

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
              {decodeHtml(item.title)}
            </h3>

            {item.image && (
              <div style={{ width: "100%", maxHeight: "220px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid #e8e2d8" }}>
                <img src={item.image} alt={item.title} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
            )}

            {hasHtmlBody ? (
              <div
                className="pulse-body"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.body!) }}
                style={{
                  color: "#3a342b",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: expanded ? "unset" : CLAMP_LINES,
                }}
              />
            ) : plainText ? (
              <p style={{ color: "#3a342b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {decodeHtml(plainText)}
              </p>
            ) : null}
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
        <style>{`.pulse-body p { margin: 0 0 0.6em; } .pulse-body p:last-child { margin-bottom: 0; }`}</style>
      </>
    );
  }

  // ── Editorial card — inline excerpt + internal link card ──
  if (item.type === "editorial") {
    const CLAMP_CHARS = 320;
    const text = decodeHtml(item.excerpt ?? "");
    const isLong = text.length > CLAMP_CHARS;
    const displayText = isLong ? text.slice(0, CLAMP_CHARS) + "…" : text;
    const typeMeta = TYPE_BADGE.editorial;

    return (
      <article style={{ background: "#fff", borderBottom: "1px solid #e8e2d8", padding: "1rem 1.25rem", overflow: "hidden", minWidth: 0 }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
          <Badge {...typeMeta} />
          {item.category && (
            <span style={{ fontSize: "0.58rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
              {item.category}
            </span>
          )}
          <span style={{ marginLeft: "auto", color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
        </div>

        {/* Body — clicking navigates to the editorial page */}
        <Link href={item.href} style={{ textDecoration: "none", display: "block" }}>
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
          {displayText && (
            <p style={{ color: "#3a342b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
              {displayText}
            </p>
          )}
          {isLong && (
            <span style={{ color: "#c5491f", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
              Read more →
            </span>
          )}
        </Link>

        {/* Internal link card */}
        <InternalLinkCard
          href={item.href}
          label="Moveee Magazine"
          title={item.title}
          description={item.excerpt}
          image={item.image}
        />
      </article>
    );
  }

  // ── Directory card — inline excerpt + detail modal ──
  if (item.type === "directory") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);

    const CLAMP_CHARS = 280;
    const text = decodeHtml(item.excerpt ?? "");
    const isLong = text.length > CLAMP_CHARS;
    const displayText = isLong ? text.slice(0, CLAMP_CHARS) + "…" : text;
    const typeMeta = TYPE_BADGE.directory;

    return (
      <>
        <article style={{ background: "#fff", borderBottom: "1px solid #e8e2d8", padding: "1rem 1.25rem", overflow: "hidden", minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
            <Badge {...typeMeta} />
            {item.entryType && (
              <span style={{ fontSize: "0.58rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                {item.entryType}
              </span>
            )}
            <span style={{ marginLeft: "auto", color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>

          {/* Body — clicking opens modal */}
          <div onClick={() => setModalOpen(true)} style={{ cursor: "pointer" }}>
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
            {displayText && (
              <p style={{ color: "#3a342b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {displayText}
              </p>
            )}
            {isLong && (
              <span style={{ color: "#085041", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
                Read more →
              </span>
            )}
          </div>

          {/* Internal link card */}
          <InternalLinkCard
            href={item.href}
            label="Culture Directory"
            title={item.title}
            description={item.excerpt}
            image={item.image}
          />
        </article>
        {modalOpen && <DirectoryDetailModal item={item} onClose={closeModal} />}
      </>
    );
  }

  // ── Happening card — inline description + detail modal ──
  if (item.type === "happening") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);

    const CLAMP_LINES = 5;
    const hasHtmlBody = !!item.body;
    const plainText = hasHtmlBody ? item.body!.replace(/<[^>]+>/g, "") : (item.excerpt ?? "");
    const isLong = plainText.length > 280;
    const typeMeta = TYPE_BADGE.happening;

    const eventDateStr = item.eventDate
      ? new Date(item.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;
    const endDateStr = item.endDate
      ? new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;

    return (
      <>
        <article style={{ background: "#fff", borderBottom: "1px solid #e8e2d8", padding: "1rem 1.25rem", overflow: "hidden", minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
            <Badge {...typeMeta} />
            {item.eventCategory && (
              <span style={{ fontSize: "0.58rem", color: "#b38238", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.eventCategory}
              </span>
            )}
            {eventDateStr && (
              <span style={{ fontSize: "0.62rem", color: "#3c3489", fontWeight: 600, letterSpacing: "0.03em" }}>
                {eventDateStr}{endDateStr ? ` — ${endDateStr}` : ""}{item.openingHours ? ` · ${item.openingHours}` : ""}
              </span>
            )}
            {(item.location || item.city) && (
              <span style={{ fontSize: "0.58rem", color: "#7a6f5c", letterSpacing: "0.04em" }}>
                · {[item.location, item.city].filter(Boolean).join(", ")}
              </span>
            )}
            {item.organiserName && (
              item.organiserSlug ? (
                <Link href={`/directory/${item.organiserSlug}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.58rem", color: "#3c3489", fontWeight: 600, letterSpacing: "0.04em", textDecoration: "none" }}>
                  · {item.organiserName}
                </Link>
              ) : (
                <span style={{ fontSize: "0.58rem", color: "#3c3489", fontWeight: 600, letterSpacing: "0.04em" }}>
                  · {item.organiserName}
                </span>
              )
            )}
            <span style={{ marginLeft: "auto", color: "#bbb", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>

          {/* Body — clicking opens modal */}
          <div onClick={() => setModalOpen(true)} style={{ cursor: "pointer" }}>
            <h3 style={{
              color: "#14110d",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.97rem",
              fontWeight: 700,
              lineHeight: 1.35,
              marginBottom: "0.5rem",
            }}>
              {decodeHtml(item.title)}
            </h3>
            {hasHtmlBody ? (
              <div
                className="happening-body"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.body!) }}
                style={{
                  color: "#3a342b",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: CLAMP_LINES,
                }}
              />
            ) : plainText ? (
              <p style={{ color: "#3a342b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {decodeHtml(plainText)}
              </p>
            ) : null}
            {isLong && (
              <span style={{ color: "#3c3489", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
                Read more →
              </span>
            )}
            {item.admission && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#7a6f5c", fontWeight: 600 }}>
                {item.admission}
              </div>
            )}
          </div>

          {/* Internal link card with image thumbnail */}
          <InternalLinkCard
            href={item.href}
            label="Moveee Happenings"
            title={decodeHtml(item.title)}
            description={item.excerpt}
            image={item.image}
          />
        </article>
        {modalOpen && <HappeningDetailModal item={item} onClose={closeModal} />}
        <style>{`.happening-body p { margin: 0 0 0.6em; } .happening-body p:last-child { margin-bottom: 0; }`}</style>
      </>
    );
  }

  return null;
}
