"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MessageCircle, Flag } from "lucide-react";
import type { FeedItem } from "@/lib/unified-feed";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";
import SourcePreviewCard from "./SourcePreviewCard";
import ProBadge from "@/components/ProBadge";
import ImageLightbox from "./ImageLightbox";

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

  const leadingIndex = showResults && totalVotes > 0
    ? pollOpts.reduce((best, o, i, arr) => (o.votes > arr[best].votes ? i : best), 0)
    : -1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "0.6rem" }}>
      {pollOpts.map((opt, i) => {
        const pct = showResults && totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const isLeading = i === leadingIndex;
        return (
          <button
            key={i}
            type="button"
            onClick={() => vote(i)}
            disabled={showResults || voting}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "var(--paper)",
              border: isLeading ? "1.5px solid var(--ochre)" : "1px solid var(--rule)",
              borderRadius: "8px",
              padding: "9px 12px",
              textAlign: "left",
              cursor: showResults ? "default" : "pointer",
              fontSize: "0.82rem",
              color: "var(--ink)",
              fontFamily: "var(--font-sans), sans-serif",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {showResults && (
              <span style={{
                position: "absolute",
                inset: 0,
                width: `${pct}%`,
                background: "rgba(197,73,31,0.15)",
                zIndex: 0,
              }} />
            )}
            <span style={{ position: "relative", zIndex: 1, fontWeight: isLeading ? 700 : 400 }}>
              {isLeading && "👑 "}{opt.text}
            </span>
            {showResults && (
              <span style={{
                position: "relative", zIndex: 1,
                fontSize: "0.74rem",
                color: "var(--gold, #b38238)",
                fontWeight: 700,
                flexShrink: 0,
                marginLeft: "8px",
              }}>
                {pct}%
              </span>
            )}
          </button>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.68rem", color: "var(--mute)", fontFamily: "var(--font-mono), monospace" }}>
        <span>
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          {expiresAt && !expired && ` · ends ${new Date(expiresAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`}
          {expired && " · ended"}
        </span>
        {voted !== null && (
          <span style={{ color: "var(--gold, #b38238)", fontFamily: "var(--font-sans), sans-serif", fontWeight: 600 }}>
            · You voted: {pollOpts[voted]?.text} ✓
          </span>
        )}
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
          background: rsvped ? "var(--paper)" : "var(--gold)",
          color: rsvped ? "var(--gold)" : "#fff",
          border: "1px solid var(--gold)",
          borderRadius: "999px",
          padding: "7px 14px",
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: !rsvped && isFull ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {rsvped ? "Going ✓" : isFull ? "Full" : "RSVP"}
      </button>
      <span style={{ fontSize: "0.72rem", color: "var(--mute)" }}>
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

function GalleryCarousel({ images, onTap }: { images: string[]; onTap: (index: number) => void }) {
  const count = images.length;

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div style={{ marginBottom: "0.6rem", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--rule)" }}>
        <img
          src={images[0]}
          alt=""
          onClick={() => onTap(0)}
          style={{ width: "100%", maxHeight: "320px", objectFit: "cover", display: "block", cursor: "zoom-in" }}
          loading="lazy"
        />
      </div>
    );
  }

  // Multi-image strip — fixed-size square thumbnails, several visible at once
  // (mirrors apps/mobile's GalleryStrip rather than a one-slide-per-view carousel).
  // Tapping any thumbnail opens the shared ImageLightbox, which then supports
  // swipe/arrow-key/button navigation across the full `images` array.
  return (
    <div
      className="hide-scrollbar"
      style={{
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        marginBottom: "0.6rem",
      }}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt=""
          onClick={() => onTap(i)}
          style={{
            height: "200px",
            width: "200px",
            objectFit: "cover",
            display: "block",
            flexShrink: 0,
            borderRadius: "8px",
            border: "1px solid var(--rule)",
            cursor: "zoom-in",
          }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

const TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pulse:     { label: "Pulse",      bg: "var(--cat-pulse-bg)",     color: "var(--cat-pulse-fg)" },
  editorial: { label: "Editorial",  bg: "var(--cat-editorial-bg)", color: "var(--cat-editorial-fg)" },
  happening: { label: "Happening",  bg: "var(--cat-happening-bg)", color: "var(--cat-happening-fg)" },
  directory: { label: "Directory",  bg: "var(--cat-directory-bg)", color: "var(--cat-directory-fg)" },
  quote:     { label: "Quote",      bg: "var(--cat-quote-bg)",     color: "var(--cat-quote-fg)" },
  community: { label: "Community",  bg: "var(--cat-community-bg)", color: "var(--cat-community-fg)" },
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
            position: "relative",
            background: "var(--paper-deep, #f2f2f2)",
            border: "1px solid var(--rule)",
            borderRadius: "12px",
            boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
            margin: "12px 16px",
            overflow: "hidden",
            minWidth: 0,
            padding: "20px 24px 20px 24px",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              color: "var(--mute)",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "34px",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            "
          </span>
          <div style={{ paddingLeft: "32px" }}>
            <p style={{
              color: "var(--ink)",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "18px",
              fontStyle: "italic",
              lineHeight: 1.4,
              margin: "0 0 12px",
            }}>
              {item.title}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "10px" }}>
              {item.quoteAuthor && (
                <span style={{ color: "var(--ink)", fontSize: "0.83rem", fontWeight: 700, fontFamily: "var(--font-sans), sans-serif" }}>
                  — {item.quoteAuthor}
                </span>
              )}
              {item.quoteSource && <span style={{ color: "var(--mute)", fontSize: "0.83rem", fontWeight: 400, fontFamily: "var(--font-sans), sans-serif" }}>{item.quoteSource}</span>}
              <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <ReactionBar
                itemId={item.wpId ?? item.id}
                itemType="quote"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={item.href}
                noBorder
              />
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
    const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
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
            position: "relative",
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            borderRadius: "12px",
            boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
            margin: "12px 16px",
            padding: "1rem 1.25rem",
            display: "flex",
            gap: "0.75rem",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {interestMatch && (
            <span style={{
              position: "absolute",
              top: "-10px",
              right: "20px",
              background: "var(--ochre)",
              color: "#fff",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "9999px",
              zIndex: 10,
              boxShadow: "0px 1px 2px rgba(20,17,13,0.1)",
            }}>
              ✦ For You
            </span>
          )}
          {/* Avatar */}
          {item.communityAuthorUsername ? (
            <Link href={`/connect/${item.communityAuthorUsername}`} onClick={e => e.stopPropagation()} style={{ textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "var(--cat-community-bg)", border: "1px solid var(--cat-community-bg)",
                color: "var(--cat-community-fg)", fontSize: "0.62rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                ...(isPro ? { boxShadow: "var(--glow-gold)" } : {}),
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
              background: "var(--cat-community-bg)", border: "1px solid var(--cat-community-bg)",
              color: "var(--cat-community-fg)", fontSize: "0.62rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              ...(isPro ? { boxShadow: "var(--glow-gold)" } : {}),
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
                <Link href={`/connect/${item.communityAuthorUsername}`} style={{ color: "var(--ink)", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }} onClick={e => e.stopPropagation()}>
                  {item.communityAuthor || "Community Member"}
                </Link>
              ) : (
                <span style={{ color: "var(--ink)", fontSize: "0.9rem", fontWeight: 700 }}>
                  {item.communityAuthor || "Community Member"}
                </span>
              )}
              {isPro && <ProBadge size={13} />}
              <span style={{ color: "var(--mute)", fontSize: "0.7rem", fontFamily: "var(--font-mono), monospace", letterSpacing: "0.02em" }}>·</span>
              <span style={{ color: "var(--mute)", fontSize: "0.7rem", fontFamily: "var(--font-mono), monospace", letterSpacing: "0.02em" }}>{formatDate(item.date)}</span>
              {item.communityTag && (
                <button
                  onClick={() => onTagClick?.(item.communityTag!)}
                  style={{
                    marginLeft: "auto",
                    background: "var(--cat-community-bg)",
                    color: "var(--cat-community-fg)",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "2px",
                    border: "none",
                    cursor: onTagClick ? "pointer" : "default",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.communityTag}
                </button>
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
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gold)", background: "var(--cat-pulse-bg)", padding: "3px 10px", borderRadius: "9999px", fontFamily: "var(--font-sans), sans-serif" }}>
                      💎 Hidden Gem {item.starRating ? "★".repeat(item.starRating) : ""}
                    </span>
                  )}
                  {item.templateType === "poll" && (
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cat-purple-fg)", background: "var(--cat-purple-bg)", padding: "3px 10px", borderRadius: "9999px", fontFamily: "var(--font-sans), sans-serif" }}>
                      📊 Poll
                    </span>
                  )}
                  {item.templateType === "cultural-take" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-purple-fg)", background: "var(--cat-purple-bg)", padding: "2px 6px", borderRadius: "2px" }}>
                      Take{item.locationName ? ` · ${item.locationName}` : ""}
                    </span>
                  )}
                  {item.templateType === "food-review" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ochre)", background: "var(--cat-editorial-bg)", padding: "2px 6px", borderRadius: "2px" }}>
                      Food Review {item.foodDishName ? `· ${item.foodDishName}` : ""}
                    </span>
                  )}
                  {item.templateType === "book-review" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B48A8", background: "rgba(107,72,168,0.12)", padding: "2px 6px", borderRadius: "2px" }}>
                      📚 Book Review {item.bookTitle ? `· ${item.bookTitle}` : ""}
                    </span>
                  )}
                  {item.templateType === "creative-showcase" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-blue-fg)", background: "var(--cat-blue-bg)", padding: "2px 6px", borderRadius: "2px" }}>
                      Creative Showcase
                    </span>
                  )}
                  {item.templateType === "itinerary" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-community-fg)", background: "var(--cat-community-bg)", padding: "2px 6px", borderRadius: "2px" }}>
                      Weekend Route
                    </span>
                  )}
                  {item.templateType === "event" && (
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-rust-fg)", background: "var(--cat-rust-bg)", padding: "2px 6px", borderRadius: "2px" }}>
                      Event{item.eventCategory ? ` · ${item.eventCategory}` : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Location badge */}
              {item.locationName && (
                <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>📍</span> {item.locationName}
                </div>
              )}

              <div style={{
                color: "var(--ink)",
                fontSize: "0.97rem",
                lineHeight: 1.6,
                marginBottom: item.image ? "0.65rem" : "0.5rem",
              }}>
                <HashtagText text={stripTrailingUrl(item.title, item.sourceUrl && !item.image ? item.sourceUrl : undefined)} onMentionClick={handleMentionClick} clamp={6} />
              </div>
            </div>

            {/* Food review ratings */}
            {item.templateType === "food-review" && item.foodRatingTaste && (
              <div style={{ display: "flex", gap: "16px", marginBottom: "0.5rem", fontSize: "0.72rem", color: "var(--mute)" }}>
                <span>Taste {"★".repeat(item.foodRatingTaste)}{"☆".repeat(5 - item.foodRatingTaste)}</span>
                {item.foodRatingValue && <span>Value {"★".repeat(item.foodRatingValue)}{"☆".repeat(5 - item.foodRatingValue)}</span>}
                {item.foodRatingVibe && <span>Vibe {"★".repeat(item.foodRatingVibe)}{"☆".repeat(5 - item.foodRatingVibe)}</span>}
              </div>
            )}

            {/* Book review rating/status/recommend */}
            {item.templateType === "book-review" && item.bookOverallRating && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.5rem", fontSize: "0.72rem", color: "var(--mute)", flexWrap: "wrap" }}>
                <span>{"★".repeat(item.bookOverallRating)}{"☆".repeat(5 - item.bookOverallRating)}</span>
                {item.bookStatus && <span>{item.bookStatus}</span>}
                {item.bookRecommend != null && <span>{item.bookRecommend ? "👍 Recommends" : "👎 Doesn't recommend"}</span>}
              </div>
            )}

            {/* Poll inline */}
            {item.templateType === "poll" && item.pollOptions && (
              <PollDisplay postId={item.wpId} options={item.pollOptions} expiresAt={item.pollExpiresAt} />
            )}

            {/* Event details + RSVP */}
            {item.templateType === "event" && (
              <div style={{ fontSize: "0.78rem", color: "var(--mute)", marginBottom: "0.5rem", lineHeight: 1.5 }}>
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
                    <a href={`/directory/${item.organiserSlug}`} style={{ color: "var(--gold)" }}>
                      {item.organiserName}
                    </a>
                  </div>
                )}
                {item.ticketUrl && (
                  <a href={item.ticketUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", display: "inline-block", marginTop: "4px" }}>
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
              <GalleryCarousel images={item.galleryImages} onTap={(index) => setLightbox({ images: item.galleryImages!, index })} />
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
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontSize: "0.78rem" }}>
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
                      background: "var(--gold)", color: "#fff",
                      fontSize: "0.65rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--ink)" }}>{stop.name}</div>
                      {stop.note && <div style={{ fontSize: "0.75rem", color: "var(--mute)", lineHeight: 1.4 }}>{stop.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Single image — only when no gallery */}
            {item.image && !item.galleryImages?.length && (
              <div
                onClick={() => setLightbox({ images: [item.image!], index: 0 })}
                style={{ width: "100%", maxHeight: "280px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid var(--rule)", cursor: "zoom-in" }}
              >
                <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.15s" }} loading="lazy" />
              </div>
            )}
            {lightbox && (
              <ImageLightbox
                images={lightbox.images}
                initialIndex={lightbox.index}
                alt={item.title}
                onClose={closeLightbox}
              />
            )}

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
              borderTop: "1px solid var(--rule)", marginTop: "0.25rem",
            }}>
              {item.wpId && (
                <div style={{ flex: 1, minWidth: 0, opacity: reportState === "idle" ? 1 : 0.5, transition: "opacity 0.15s" }}>
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
                  color: "var(--mute)", background: "none", border: "none",
                  cursor: "pointer", fontSize: "0.75rem", flexShrink: 0,
                  padding: 0, fontFamily: "inherit",
                  opacity: reportState === "idle" ? 1 : 0.5, transition: "opacity 0.15s",
                }}
                aria-label="View comments"
              >
                <MessageCircle size={15} strokeWidth={1.8} />
                {(item.commentCount ?? 0) > 0 && (
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{item.commentCount}</span>
                )}
              </button>

              {/* Report */}
              {reportState === "idle" && (
                <button
                  onClick={() => setReportState("confirm")}
                  title="Report this post"
                  style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: "0 0 0 4px", cursor: "pointer", color: "var(--mute)", flexShrink: 0, lineHeight: 1 }}
                >
                  <Flag size={13} strokeWidth={1.8} />
                </button>
              )}
              {reportState === "confirm" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--mute)" }}>Report as:</span>
                  {(["spam", "harassment", "inappropriate"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => submitReport(r)}
                      style={{ background: "rgba(198,40,40,0.08)", border: "1px solid rgba(198,40,40,.2)", color: "var(--error)", borderRadius: 3, padding: "1px 6px", fontSize: "0.62rem", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {r}
                    </button>
                  ))}
                  <button onClick={() => setReportState("idle")} style={{ background: "none", border: "none", color: "var(--mute)", fontSize: "0.68rem", cursor: "pointer" }}>✕</button>
                </div>
              )}
              {reportState === "sent" && (
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--mute)", flexShrink: 0 }}>Reported — thank you.</span>
              )}
              {reportState === "error" && (
                <span style={{ fontSize: "0.68rem", color: "var(--error)", flexShrink: 0 }}>Couldn't send report.</span>
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
            position: "relative",
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            borderRadius: "12px",
            boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
            margin: "12px 16px",
            padding: "1rem 1.25rem",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Eyebrow row — plain mono text, no colored pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ochre)" }}>
              Pulse Wire
            </span>
            {item.region && (
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                · {item.region}
              </span>
            )}
            {item.arm && (
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                · {item.arm}
              </span>
            )}
            <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>

          {/* Clickable body opens modal */}
          <div
            onClick={() => setModalOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <h3 style={{
              color: "var(--ink)",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.97rem",
              fontWeight: 700,
              lineHeight: 1.35,
              marginBottom: "0.5rem",
            }}>
              {decodeHtml(item.title)}
            </h3>

            {item.image && (
              <div style={{ width: "100%", maxHeight: "220px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid var(--rule)" }}>
                <img src={item.image} alt={item.title} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
            )}

            {hasHtmlBody ? (
              <div
                className="pulse-body"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.body!) }}
                style={{
                  color: "var(--ink-soft)",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: expanded ? "unset" : CLAMP_LINES,
                }}
              />
            ) : plainText ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {decodeHtml(plainText)}
              </p>
            ) : null}
          </div>

          {isLong && !expanded && (
            <button
              onClick={() => setModalOpen(true)}
              style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: "0.25rem 0", marginTop: "0.25rem" }}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.6rem", marginTop: "0.5rem", borderTop: "1px solid var(--rule)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ReactionBar
                  noBorder
                  itemId={item.wpId}
                  itemType="pulse"
                  initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                  shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/feed`}
                />
              </div>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "var(--mute)",
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
                <MessageCircle size={15} strokeWidth={1.8} />
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

    return (
      <article style={{
        position: "relative",
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        borderRadius: "12px",
        boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
        margin: "12px 16px",
        padding: "1rem 1.25rem 1.5rem",
        overflow: "hidden",
        minWidth: 0,
      }}>
        {interestMatch && (
          <span style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "var(--ochre)",
            color: "#fff",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "9px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "9999px",
            zIndex: 10,
            boxShadow: "0px 1px 2px rgba(20,17,13,0.1)",
          }}>
            ✦ For You
          </span>
        )}
        {/* Eyebrow row — plain mono text */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ochre)" }}>
            The Culture Brief
          </span>
          {item.category && (
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              · {item.category}
            </span>
          )}
          <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
        </div>

        {/* Body — clicking navigates to the editorial page */}
        <Link href={item.href} style={{ textDecoration: "none", display: "block" }}>
          <h3 style={{
            color: "var(--ink)",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "17px",
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: "0.5rem",
          }}>
            {item.title}
          </h3>
          {displayText && (
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
              {displayText}
            </p>
          )}
          {isLong && (
            <span style={{ color: "var(--ochre)", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
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

    return (
      <>
        <article style={{
          position: "relative",
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          borderRadius: "12px",
          boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
          margin: "12px 16px",
          padding: "1rem 1.25rem",
          overflow: "hidden",
          minWidth: 0,
        }}>
          {/* Eyebrow row — plain mono text */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-directory-fg)" }}>
              Directory
            </span>
            {item.entryType && (
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                · {item.entryType}
              </span>
            )}
            <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>

          {/* Body — clicking opens modal */}
          <div onClick={() => setModalOpen(true)} style={{ cursor: "pointer" }}>
            <h3 style={{
              color: "var(--ink)",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "0.97rem",
              fontWeight: 700,
              lineHeight: 1.35,
              marginBottom: "0.5rem",
            }}>
              {item.title}
            </h3>
            {displayText && (
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {displayText}
              </p>
            )}
            {isLong && (
              <span style={{ color: "var(--cat-directory-fg)", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
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
        <article style={{ background: "var(--paper)", borderBottom: "1px solid var(--rule)", padding: "1rem 1.25rem", overflow: "hidden", minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
            <Badge {...typeMeta} />
            {item.isLiterati && (
              <span style={{
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.04em",
                textTransform: "uppercase", color: "var(--gold)", background: "var(--paper)",
                border: "1px solid var(--gold)", borderRadius: 4, padding: "0.1rem 0.4rem",
              }}>
                🪶 Literati Connect
              </span>
            )}
            {item.eventCategory && (
              <span style={{ fontSize: "0.58rem", color: "var(--gold)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.eventCategory}
              </span>
            )}
            {eventDateStr && (
              <span style={{ fontSize: "0.62rem", color: "var(--cat-happening-fg)", fontWeight: 600, letterSpacing: "0.03em" }}>
                {eventDateStr}{endDateStr ? ` — ${endDateStr}` : ""}{item.openingHours ? ` · ${item.openingHours}` : ""}
              </span>
            )}
            {(item.location || item.city) && (
              <span style={{ fontSize: "0.58rem", color: "var(--mute)", letterSpacing: "0.04em" }}>
                · {[item.location, item.city].filter(Boolean).join(", ")}
              </span>
            )}
            {item.organiserName && (
              item.organiserSlug ? (
                <Link href={`/directory/${item.organiserSlug}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.58rem", color: "var(--cat-happening-fg)", fontWeight: 600, letterSpacing: "0.04em", textDecoration: "none" }}>
                  · {item.organiserName}
                </Link>
              ) : (
                <span style={{ fontSize: "0.58rem", color: "var(--cat-happening-fg)", fontWeight: 600, letterSpacing: "0.04em" }}>
                  · {item.organiserName}
                </span>
              )
            )}
            <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
          </div>

          {/* Body — clicking opens modal */}
          <div onClick={() => setModalOpen(true)} style={{ cursor: "pointer" }}>
            <h3 style={{
              color: "var(--ink)",
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
                  color: "var(--ink-soft)",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: CLAMP_LINES,
                }}
              />
            ) : plainText ? (
              <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                {decodeHtml(plainText)}
              </p>
            ) : null}
            {isLong && (
              <span style={{ color: "var(--cat-happening-fg)", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
                Read more →
              </span>
            )}
            {item.admission && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--mute)", fontWeight: 600 }}>
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
