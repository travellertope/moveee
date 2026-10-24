"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MessageCircle, Flag } from "lucide-react";
import type { FeedItem } from "@/lib/unified-feed";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import { decodeHtml } from "@/lib/decode-html";
import { useQuoteShare } from "@/context/QuoteShareContext";
import { sanitizeHtml } from "@/lib/sanitize";
import SourcePreviewCard from "./SourcePreviewCard";
import ProBadge from "@/components/ProBadge";
import ImageLightbox from "./ImageLightbox";
import AudioPreviewButton from "./AudioPreviewButton";

const CommunityDetailModal = dynamic(() => import("./CommunityDetailModal"), { ssr: false });

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
  price,
  priceCurrency,
}: {
  postId?: string;
  capacity?: number;
  initialCount?: number;
  price?: number;
  priceCurrency?: string;
}) {
  const isPaid = !!price && price > 0;
  const [status, setStatus] = useState<{ rsvped: boolean; count: number; paymentStatus?: string } | null>(
    initialCount !== undefined ? { rsvped: false, count: initialCount } : null
  );
  const [loading, setLoading] = useState(false);
  const [paidError, setPaidError] = useState("");

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/community/event-rsvp-status?post_id=${postId}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus({ rsvped: !!data.rsvped, count: Number(data.count ?? initialCount ?? 0), paymentStatus: data.paymentStatus });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const count = status?.count ?? initialCount ?? 0;
  const isFull = !!capacity && capacity > 0 && count >= capacity;
  const rsvped = !!status?.rsvped;

  function formatPrice(amount: number, currency: string) {
    const sym: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };
    return `${sym[currency] ?? currency}${amount.toLocaleString()}`;
  }

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading || !postId) return;
    if (!rsvped && isFull) return;
    setLoading(true);
    setPaidError("");
    try {
      if (isPaid && !rsvped) {
        const res = await fetch("/api/community/event-rsvp-paid-initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: Number(postId) }),
        });
        const data = await res.json();
        if (res.ok && data?.url) {
          window.location.href = data.url;
        } else {
          setPaidError(data?.error ?? "Payment could not be started. Please try again.");
        }
      } else {
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
      }
    } catch {}
    setLoading(false);
  }

  const buttonLabel = isPaid
    ? rsvped
      ? "Going ✓"
      : isFull
      ? "Full"
      : `RSVP · ${formatPrice(price!, priceCurrency ?? "NGN")}`
    : rsvped
    ? "Going ✓"
    : isFull
    ? "Full"
    : "RSVP";

  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          {buttonLabel}
        </button>
        <span style={{ fontSize: "0.72rem", color: "var(--mute)" }}>
          {count} going{capacity ? ` · ${Math.max(0, capacity - count)} spots left` : ""}
        </span>
      </div>
      {paidError && (
        <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--ochre)" }}>{paidError}</p>
      )}
    </div>
  );
}
/**
 * Hub badge + inline Join button (docs/hubs-plan.md §10.4) — shown on any
 * feed card whose post carries a _hub_id (today that's always an official
 * Hub, since regular Hubs are still excluded from this feed). No bulk
 * join-status lookup exists yet, so this always starts on "Join" rather
 * than "Joined" even for an already-joined viewer — Culture_Hubs::join()
 * is idempotent, so clicking it again is a harmless no-op, just a
 * one-click-too-many for members who already joined. Revisit with a bulk
 * status endpoint if that turns out to matter in practice.
 */
function HubBadgeRow({ hubId, hubName, hubSlug, hubIsOfficial }: { hubId: number; hubName?: string; hubSlug?: string; hubIsOfficial?: boolean }) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function join(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading || joined) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hub/${hubId}/join`, { method: "POST" });
      const data = await res.json().catch(() => null);
      // Trust the server's actual isMember, not just the HTTP status — a
      // write that silently failed server-side (e.g. a DB error) can still
      // come back as a 200 with isMember still false.
      if (res.ok && data?.isMember) {
        setJoined(true);
      } else {
        // Surfaced so a failed join isn't a silent no-op — previously the
        // button just reverted with no indication anything went wrong.
        setError(data?.message || "Couldn't join — try again");
      }
    } catch {
      setError("Couldn't join — try again");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
      <Link
        href={hubSlug ? `/hub/${hubSlug}` : "/hub/discover"}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          background: hubIsOfficial ? "var(--ochre)" : "var(--gold)",
          color: "#fff", fontSize: "0.62rem", fontWeight: 700,
          letterSpacing: "0.04em", padding: "3px 10px", borderRadius: "9999px",
          textDecoration: "none", whiteSpace: "nowrap",
        }}
      >
        🏷 {hubName ?? "Hub"}
      </Link>
      <button
        type="button"
        onClick={join}
        disabled={loading || joined}
        title={error || undefined}
        style={{
          background: joined ? "transparent" : error ? "var(--error, #c62828)" : "var(--ink)",
          color: joined ? "var(--mute)" : "#fff",
          border: joined ? "1px solid var(--rule)" : "none",
          borderRadius: "9999px",
          padding: "3px 10px",
          fontSize: "0.62rem",
          fontWeight: 700,
          cursor: joined ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {joined ? "Joined ✓" : error ? "Retry" : "Join"}
      </button>
    </div>
  );
}

import InternalLinkCard from "./InternalLinkCard";

const StoopEmbedCard = dynamic(() => import("./StoopEmbedCard"), { ssr: false });
const PulseDetailModal = dynamic(() => import("./PulseDetailModal"), { ssr: false });
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

  // Multi-image strip — images fill the available card width evenly so 2 photos
  // take 50% each, 3 take 33%, 4 take 25%, rather than leaving empty space.
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
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
            flex: "1 1 0",
            minWidth: 0,
            maxWidth: "220px",
            aspectRatio: "1",
            height: "auto",
            objectFit: "cover",
            display: "block",
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
  onDelete,
}: {
  item: FeedItem;
  onTagClick?: (tag: string) => void;
  onMentionClick?: (username: string) => void;
  interestMatch?: boolean;
  onDelete?: (id: string) => void;
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: session } = useSession();
  const handleMentionClick = onMentionClick ?? ((username: string) => router.push(`/${username}`));
  const typeMeta = TYPE_BADGE[item.type] ?? TYPE_BADGE.pulse;

  // ── Quote card ──
  function decodeHtml(str: string): string {
    if (!str) return str;
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&hellip;/g, "…")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&rsquo;/g, "’")
      .replace(/&lsquo;/g, "‘")
      .replace(/&rdquo;/g, "”")
      .replace(/&ldquo;/g, "“")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  }

  if (item.type === "quote") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [modalOpen, setModalOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const closeModal = useCallback(() => setModalOpen(false), []);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { shareQuote } = useQuoteShare();

    return (
      <>
        <article
          onClick={() => setModalOpen(true)}
          style={{
            position: "relative",
            background: "var(--paper)",
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
              {decodeHtml(item.title)}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginBottom: "10px" }}>
              {item.quoteAuthor && (
                <span style={{ color: "var(--ink)", fontSize: "0.83rem", fontWeight: 700, fontFamily: "var(--font-sans), sans-serif" }}>
                  — {decodeHtml(item.quoteAuthor)}
                </span>
              )}
              {item.quoteSource && <span style={{ color: "var(--mute)", fontSize: "0.83rem", fontWeight: 400, fontFamily: "var(--font-sans), sans-serif" }}>{decodeHtml(item.quoteSource)}</span>}
              <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>{formatDate(item.date)}</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <ReactionBar
                itemId={item.wpId ?? item.id}
                itemType="quote"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={item.href}
                noBorder
                onShare={() => shareQuote(decodeHtml(item.title), item.quoteAuthor || null, item.quoteSource || null, item.href)}
              />
            </div>
          </div>
        </article>
        {modalOpen && (
          <>
            <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 7999, background: "rgba(20,17,13,0.55)" }} />
            <QuoteDetailModal item={item} onClose={closeModal} />
          </>
        )}
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
    // Community posts open a centered modal overlay on click.
    const openPost = useCallback(() => setModalOpen(true), []);

    const isPro = item.communityTier === "patron";

    // Ownership / owner menu state
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [deleting, setDeleting] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [editOpen, setEditOpen] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [editText, setEditText] = useState("");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [editing, setEditing] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [editError, setEditError] = useState("");

    const sessionUser = session?.user as any;
    const sessionUserId = sessionUser?.id ? Number(sessionUser.id) : sessionUser?.databaseId ? Number(sessionUser.databaseId) : null;
    const isOwn = !!(sessionUserId && item.communityAuthorId && sessionUserId === item.communityAuthorId);
    const canEdit = isOwn && (sessionUser?.tier === "patron" || sessionUser?.tier === "lit" || sessionUser?.isAdmin === true);

    async function handleDelete() {
      setDeleting(true);
      try {
        const res = await fetch("/api/community/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: item.wpId }),
        });
        if (res.ok) {
          onDelete?.(item.id);
        } else {
          const d = await res.json().catch(() => ({}));
          alert(d.error ?? "Could not delete post.");
          setDeleting(false);
          setDeleteConfirm(false);
        }
      } catch {
        alert("Could not delete post.");
        setDeleting(false);
        setDeleteConfirm(false);
      }
    }

    async function handleEdit() {
      if (!editText.trim()) return;
      setEditing(true);
      setEditError("");
      try {
        const res = await fetch("/api/community/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: item.wpId, text: editText }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEditError(d.error ?? "Edit failed.");
        } else {
          setEditOpen(false);
        }
      } catch {
        setEditError("Network error.");
      }
      setEditing(false);
    }

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

    // Derive an effective YouTube embed URL from videoUrl, sourceUrl, or inline text.
    const ytUrl: string | null = (() => {
      if (item.videoUrl) return item.videoUrl;
      const src = item.sourceUrl ?? "";
      if (src.includes("youtu.be") || src.includes("youtube.com/watch")) return src;
      const m = (item.title ?? "").match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch[^\s]*|youtu\.be\/)[^\s]*/);
      return m ? m[0] : null;
    })();

    // Pause YouTube iframe when it scrolls out of view
    const ytIframeRef = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
      const el = ytIframeRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) {
          el.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
        }
      }, { threshold: 0.1 });
      obs.observe(el);
      return () => obs.disconnect();
    }, [ytUrl]);

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
          {/* Author row — flex row for avatar + header only; all post content is full-width below */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
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
            {/* Header: author info LEFT, type + hub badges RIGHT */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
              {/* Left: name + pro + timestamp */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
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
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  {item.communityAuthorUsername && (
                    <span style={{ color: "var(--mute)", fontSize: "0.68rem" }}>@{item.communityAuthorUsername}</span>
                  )}
                  <span style={{ color: "var(--mute)", fontSize: "0.7rem", fontFamily: "var(--font-mono), monospace" }}>·</span>
                  <span style={{ color: "var(--mute)", fontSize: "0.7rem", fontFamily: "var(--font-mono), monospace" }}>{formatDate(item.date)}</span>
                </div>
              </div>
              {/* Right: type badge + hub/section badge */}
              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", flexShrink: 0 }}>
                {item.templateType && item.templateType !== "post" && (() => {
                  const typeMap: Record<string, { label: string; color: string; bg: string }> = {
                    "itinerary":         { label: "🗺 Itinerary",    color: "#4f46e5", bg: "rgba(79,70,229,0.10)" },
                    "hidden-gem":        { label: "💎 Place",        color: "#d97706", bg: "rgba(217,119,6,0.10)" },
                    // review types: info card already conveys the type — no separate badge

                    "poll":              { label: "📊 Poll",         color: "#059669", bg: "rgba(5,150,105,0.10)" },
                    "project":           { label: "🎨 Project",      color: "#2563eb", bg: "rgba(37,99,235,0.10)" },
                    "cultural-take":     { label: "💭 Take",         color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
                    "happening":         { label: "📅 Event",        color: "#e11d48", bg: "rgba(225,29,72,0.10)" },
                    "event":             { label: "📅 Event",        color: "#e11d48", bg: "rgba(225,29,72,0.10)" },
                  };
                  const t = typeMap[item.templateType];
                  if (!t) return null;
                  return (
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 600, padding: "2px 8px",
                      borderRadius: "999px", color: t.color, background: t.bg,
                      whiteSpace: "nowrap", fontFamily: "var(--font-sans), sans-serif",
                    }}>
                      {t.label}
                    </span>
                  );
                })()}
                {(item.hubName || item.hubSlug || (item.communityTag && !item.hubId)) && (() => {
                  const tagLabel = item.hubName || item.communityTag;
                  const tagSlug  = item.hubSlug || item.communityTag?.toLowerCase();
                  return (
                    <Link
                      href={tagSlug ? `/hub/${tagSlug}` : "/hub/discover"}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: "0.6rem", fontWeight: 500,
                        padding: "2px 7px", borderRadius: "4px",
                        background: "rgba(168,162,158,0.15)", color: "var(--mute)",
                        whiteSpace: "nowrap", fontFamily: "var(--font-sans), sans-serif",
                        textDecoration: "none",
                      }}
                    >
                      #{tagLabel}
                    </Link>
                  );
                })()}
                {isOwn && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(v => !v); }}
                    title="Post options"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--mute)", padding: "2px 4px", borderRadius: "4px",
                      fontSize: "1rem", lineHeight: 1, display: "flex", alignItems: "center",
                    }}
                  >
                    ···
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>

            {/* Text body — clicking opens the detail modal */}
            <div
              onClick={openPost}
              style={{ cursor: "pointer" }}
            >

              {/* Location badge */}
              {item.locationName && (
                <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>📍</span> {item.locationName}
                </div>
              )}

              {/* Post text — review types strip the title paragraph (shown in info card below) */}
              <div style={{
                color: "var(--ink)",
                fontSize: "0.97rem",
                lineHeight: 1.6,
                marginBottom: item.image ? "0.65rem" : "0.5rem",
              }}>
                {(() => {
                  const inlineYt = ytUrl && !item.videoUrl && !(item.sourceUrl?.includes("youtu")) ? ytUrl : undefined;
                  const stripBy = item.sourceUrl && !item.image ? item.sourceUrl : (inlineYt ?? undefined);
                  const fullText = stripTrailingUrl(item.title, stripBy);
                  const isInfoCardType = ["music-review", "book-review", "film-review", "food-review"].includes(item.templateType ?? "");
                  if (isInfoCardType) {
                    // Strip any leading title the user typed (it duplicates the info card)
                    const reviewTitle = item.musicTitle || item.bookTitle || item.filmTitle || item.foodDishName;
                    let body = fullText;
                    if (reviewTitle && body.toLowerCase().startsWith(reviewTitle.toLowerCase())) {
                      body = body.slice(reviewTitle.length).replace(/^[\n\r\s]+/, "");
                    }
                    return body ? <HashtagText text={body} onMentionClick={handleMentionClick} clamp={6} /> : null;
                  }
                  const dblNl = fullText.indexOf("\n\n");
                  const singleNl = fullText.indexOf("\n");
                  const nlIdx = dblNl !== -1 ? dblNl : singleNl;
                  const sepLen = dblNl !== -1 ? 2 : 1;
                  if (nlIdx === -1) return <HashtagText text={fullText} onMentionClick={handleMentionClick} clamp={6} />;
                  const titlePart = fullText.slice(0, nlIdx).trim();
                  const bodyPart = fullText.slice(nlIdx + sepLen).trim();
                  return (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                        <HashtagText text={titlePart} onMentionClick={handleMentionClick} />
                      </div>
                      {bodyPart && <HashtagText text={bodyPart} onMentionClick={handleMentionClick} clamp={4} />}
                    </>
                  );
                })()}
              </div>

              {/* Info card — music review */}
              {item.templateType === "music-review" && (item.musicTitle || item.musicCoverUrl) && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "0.75rem", backgroundColor: "var(--paper-deep)", borderRadius: "var(--radius-lg)", padding: "10px", alignItems: "flex-start" }}>
                  <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                    <AudioPreviewButton src={item.musicPreviewUrl} coverUrl={item.musicCoverUrl} size={100} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.musicTitle && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "2px" }}>{item.musicTitle}</div>}
                    {item.musicArtist && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "6px" }}>{item.musicArtist}</div>}
                    {item.musicOverallRating != null && (
                      <div style={{ fontSize: "0.88rem", color: "var(--gold)", letterSpacing: "1px" }}>
                        {"★".repeat(item.musicOverallRating)}{"☆".repeat(5 - item.musicOverallRating)}
                        <span style={{ fontSize: "0.72rem", color: "var(--mute)", marginLeft: "6px" }}>{item.musicOverallRating}/5</span>
                      </div>
                    )}
                    {item.musicRecommend != null && (
                      <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginTop: "4px" }}>
                        {item.musicRecommend ? "👍 Recommends" : "👎 Not for everyone"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info card — book review */}
              {item.templateType === "book-review" && (item.bookTitle || item.bookCoverUrl) && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "0.75rem", backgroundColor: "var(--paper-deep)", borderRadius: "var(--radius-lg)", padding: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: 78, height: 110, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0, background: "rgba(20,17,13,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.bookCoverUrl
                      ? <img src={item.bookCoverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <span style={{ fontSize: "28px" }}>📚</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.bookTitle && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "2px" }}>{item.bookTitle}</div>}
                    {item.bookAuthor && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "6px" }}>{item.bookAuthor}</div>}
                    {item.bookOverallRating != null && (
                      <div style={{ fontSize: "0.88rem", color: "var(--gold)", letterSpacing: "1px" }}>
                        {"★".repeat(item.bookOverallRating)}{"☆".repeat(5 - item.bookOverallRating)}
                        <span style={{ fontSize: "0.72rem", color: "var(--mute)", marginLeft: "6px" }}>{item.bookOverallRating}/5</span>
                      </div>
                    )}
                    {item.bookStatus && <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginTop: "4px" }}>{item.bookStatus}</div>}
                    {item.bookRecommend != null && (
                      <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginTop: "2px" }}>
                        {item.bookRecommend ? "👍 Recommends" : "👎 Not for everyone"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info card — film review */}
              {item.templateType === "film-review" && (item.filmTitle || item.filmCoverUrl) && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "0.75rem", backgroundColor: "var(--paper-deep)", borderRadius: "var(--radius-lg)", padding: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: 78, height: 110, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0, background: "rgba(20,17,13,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.filmCoverUrl
                      ? <img src={item.filmCoverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <span style={{ fontSize: "28px" }}>🎬</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.filmTitle && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "2px" }}>{item.filmTitle}</div>}
                    {item.filmDirector && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "6px" }}>{item.filmDirector}</div>}
                    {item.filmOverallRating != null && (
                      <div style={{ fontSize: "0.88rem", color: "var(--gold)", letterSpacing: "1px" }}>
                        {"★".repeat(item.filmOverallRating)}{"☆".repeat(5 - item.filmOverallRating)}
                        <span style={{ fontSize: "0.72rem", color: "var(--mute)", marginLeft: "6px" }}>{item.filmOverallRating}/5</span>
                      </div>
                    )}
                    {item.filmRecommend != null && (
                      <div style={{ fontSize: "0.72rem", color: "var(--mute)", marginTop: "4px" }}>
                        {item.filmRecommend ? "👍 Recommends" : "👎 Not for everyone"}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info card — food review (only when a photo is attached) */}
              {item.templateType === "food-review" && item.image && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "0.75rem", backgroundColor: "var(--paper-deep)", borderRadius: "var(--radius-lg)", padding: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: 100, height: 100, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}>
                    <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.foodDishName && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "6px" }}>{item.foodDishName}</div>}
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {item.foodRatingTaste != null && (
                        <div style={{ fontSize: "0.78rem", color: "var(--mute)" }}>
                          Taste <span style={{ color: "var(--gold)" }}>{"★".repeat(item.foodRatingTaste)}{"☆".repeat(5 - item.foodRatingTaste)}</span>
                        </div>
                      )}
                      {item.foodRatingValue != null && (
                        <div style={{ fontSize: "0.78rem", color: "var(--mute)" }}>
                          Value <span style={{ color: "var(--gold)" }}>{"★".repeat(item.foodRatingValue)}{"☆".repeat(5 - item.foodRatingValue)}</span>
                        </div>
                      )}
                      {item.foodRatingVibe != null && (
                        <div style={{ fontSize: "0.78rem", color: "var(--mute)" }}>
                          Vibe <span style={{ color: "var(--gold)" }}>{"★".repeat(item.foodRatingVibe)}{"☆".repeat(5 - item.foodRatingVibe)}</span>
                        </div>
                      )}
                    </div>
                  </div>
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
              <RsvpDisplay postId={item.wpId} capacity={item.rsvpCapacity} initialCount={item.rsvpCount} price={item.rsvpPrice} priceCurrency={item.rsvpPriceCurrency} />
            )}

            {/* Gallery carousel — all image-capable templates */}
            {item.galleryImages && item.galleryImages.length >= 1 && (
              <GalleryCarousel images={item.galleryImages} onTap={(index) => setLightbox({ images: item.galleryImages!, index })} />
            )}

            {/* Video embed — uses ytUrl which covers videoUrl, sourceUrl-is-YouTube, and inline YouTube */}
            {ytUrl && (
              <div style={{ marginBottom: "0.6rem" }}>
                {ytUrl.includes("youtube.com") || ytUrl.includes("youtu.be") ? (
                  <iframe
                    ref={ytIframeRef}
                    src={`https://www.youtube.com/embed/${ytUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]+)/)?.[1] ?? ""}?enablejsapi=1`}
                    style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "6px" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontSize: "0.78rem" }}>
                    Watch video →
                  </a>
                )}
              </div>
            )}

            {/* Itinerary stops — grid with images when available */}
            {item.templateType === "itinerary" && item.itineraryStops && item.itineraryStops.length > 0 && (() => {
              const hasImages = item.itineraryStops.some((s: any) => s.image_url);
              if (hasImages) {
                return (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "8px",
                    marginBottom: "0.6rem",
                  }}>
                    {item.itineraryStops.slice(0, 6).map((stop: any, i: number) => (
                      <div key={i} style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--paper-deep)", border: "1px solid var(--rule)" }}>
                        {stop.image_url ? (
                          <img src={stop.image_url} alt={stop.name} style={{ width: "100%", height: "96px", objectFit: "cover", display: "block" }} loading="lazy" />
                        ) : (
                          <div style={{ width: "100%", height: "96px", background: "var(--paper-deep)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "1.4rem" }}>📍</span>
                          </div>
                        )}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,17,13,0.75) 0%, transparent 100%)", padding: "6px 6px 5px" }}>
                          <span style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {i + 1}. {stop.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              return (
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
              );
            })()}

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

            {/* Stoop embed card */}
            {item.stoopClusterId && (
              <div style={{ marginBottom: "0.5rem" }}>
                <StoopEmbedCard clusterId={item.stoopClusterId} />
              </div>
            )}

            {/* Link preview card — skip if source URL is a YouTube link (video embeds instead) */}
            {!item.image && item.sourceUrl && !ytUrl && (
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

            </div>

            {/* Reactions + comment + flag — all inside the action pill */}
            {item.wpId && (
              <div style={{
                minWidth: 0, paddingTop: "0.5rem",
                borderTop: "1px solid var(--rule)", marginTop: "0.25rem",
                opacity: reportState === "idle" ? 1 : 0.6, transition: "opacity 0.15s",
              }}>
                <ReactionBar
                  noBorder
                  itemId={item.wpId}
                  itemType="community"
                  initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                  shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${item.slug}`}
                  onComment={openPost}
                  commentCount={item.commentCount ?? 0}
                  flagSlot={
                    reportState === "idle" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReportState("confirm"); }}
                        title="Report this post"
                        style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--mute)", lineHeight: 1 }}
                      >
                        <Flag size={13} strokeWidth={1.8} />
                      </button>
                    ) : reportState === "confirm" ? null
                    : reportState === "sent" ? (
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--mute)", whiteSpace: "nowrap" }}>Reported ✓</span>
                    ) : (
                      <span style={{ fontSize: "0.62rem", color: "var(--error)", whiteSpace: "nowrap" }}>Couldn't send.</span>
                    )
                  }
                />
              </div>
            )}
        </article>
        {modalOpen && (
          <>
            <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 7999, background: "rgba(20,17,13,0.55)" }} />
            <CommunityDetailModal item={item} onClose={closeModal} />
          </>
        )}
        {reportState === "confirm" && (
          <>
            <div onClick={() => setReportState("idle")} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
            <div style={{
              position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
              width: "min(480px, 100%)", zIndex: 9001,
              background: "var(--paper, #f3ece0)",
              borderRadius: "20px 20px 0 0",
              padding: "0.75rem 1.25rem 1.5rem",
              boxShadow: "0 -8px 32px rgba(20,17,13,0.18)",
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)", textAlign: "center", letterSpacing: "0.02em" }}>Report this post</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(["spam", "harassment", "inappropriate"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={(e) => { e.stopPropagation(); submitReport(r); }}
                    style={{
                      width: "100%", padding: "0.75rem 1rem",
                      background: "#fff", border: "1px solid var(--rule, #e8e2d8)",
                      borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                      textAlign: "left", fontSize: "0.88rem", color: "var(--ink)",
                      fontFamily: "inherit", fontWeight: 500, textTransform: "capitalize",
                    }}
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={(e) => { e.stopPropagation(); setReportState("idle"); }}
                  style={{
                    width: "100%", marginTop: "0.25rem", padding: "0.75rem 1rem",
                    background: "transparent", border: "none",
                    borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                    fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Owner menu dropdown */}
        {ownerMenuOpen && (
          <>
            <div onClick={(e) => { e.stopPropagation(); setOwnerMenuOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 9000 }} />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "min(480px, 100%)", zIndex: 9001,
                background: "var(--paper, #f3ece0)",
                borderRadius: "20px 20px 0 0",
                padding: "0.75rem 1.25rem 1.5rem",
                boxShadow: "0 -8px 32px rgba(20,17,13,0.18)",
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
              <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)", textAlign: "center", letterSpacing: "0.02em" }}>Post options</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {canEdit && (
                  <button
                    onClick={() => { setOwnerMenuOpen(false); setEditText(item.body ?? item.excerpt ?? ""); setEditOpen(true); }}
                    style={{
                      width: "100%", padding: "0.75rem 1rem",
                      background: "#fff", border: "1px solid var(--rule, #e8e2d8)",
                      borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                      textAlign: "left", fontSize: "0.88rem", color: "var(--ink)",
                      fontFamily: "inherit", fontWeight: 500,
                    }}
                  >
                    ✏️ Edit post
                  </button>
                )}
                <button
                  onClick={() => { setOwnerMenuOpen(false); setDeleteConfirm(true); }}
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    background: "#fff", border: "1px solid var(--rule, #e8e2d8)",
                    borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                    textAlign: "left", fontSize: "0.88rem", color: "#c0392b",
                    fontFamily: "inherit", fontWeight: 500,
                  }}
                >
                  🗑 Delete post
                </button>
                <button
                  onClick={() => setOwnerMenuOpen(false)}
                  style={{
                    width: "100%", marginTop: "0.25rem", padding: "0.75rem 1rem",
                    background: "transparent", border: "none",
                    borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                    fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Delete confirm sheet */}
        {deleteConfirm && (
          <>
            <div onClick={(e) => { e.stopPropagation(); if (!deleting) setDeleteConfirm(false); }} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "min(480px, 100%)", zIndex: 9001,
                background: "var(--paper, #f3ece0)",
                borderRadius: "20px 20px 0 0",
                padding: "0.75rem 1.25rem 1.5rem",
                boxShadow: "0 -8px 32px rgba(20,17,13,0.18)",
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>Delete this post?</p>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.8rem", color: "var(--mute)", textAlign: "center", lineHeight: 1.5 }}>This can't be undone.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    width: "100%", padding: "0.85rem 1rem",
                    background: "#c0392b", border: "none",
                    borderRadius: "var(--radius-lg, 6px)", cursor: deleting ? "not-allowed" : "pointer",
                    fontSize: "0.9rem", color: "#fff", fontFamily: "inherit", fontWeight: 700,
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    background: "transparent", border: "none",
                    borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                    fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edit modal (Pro only) */}
        {editOpen && (
          <>
            <div onClick={(e) => { e.stopPropagation(); if (!editing) setEditOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.55)" }} />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "min(540px, 100%)", zIndex: 9001,
                background: "var(--paper, #f3ece0)",
                borderRadius: "20px 20px 0 0",
                padding: "0.75rem 1.25rem 1.5rem",
                boxShadow: "0 -8px 32px rgba(20,17,13,0.18)",
                maxHeight: "80vh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem", flexShrink: 0 }} />
              <p style={{ margin: "0 0 0.85rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}>Edit post</p>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={6}
                style={{
                  width: "100%", padding: "0.75rem", fontSize: "0.9rem", lineHeight: 1.55,
                  border: "1px solid var(--rule, #e8e2d8)", borderRadius: "var(--radius-lg, 6px)",
                  background: "#fff", color: "var(--ink)", fontFamily: "inherit",
                  resize: "vertical", flex: "1 1 auto", minHeight: "100px", boxSizing: "border-box",
                }}
              />
              {editError && <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#c0392b" }}>{editError}</p>}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.85rem", flexShrink: 0 }}>
                <button
                  onClick={() => { if (!editing) setEditOpen(false); }}
                  disabled={editing}
                  style={{
                    flex: 1, padding: "0.75rem", background: "transparent",
                    border: "1px solid var(--rule, #e8e2d8)", borderRadius: "var(--radius-lg, 6px)",
                    cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={editing || !editText.trim()}
                  style={{
                    flex: 2, padding: "0.75rem",
                    background: "var(--ochre, #7a241c)", border: "none",
                    borderRadius: "var(--radius-lg, 6px)", cursor: editing ? "not-allowed" : "pointer",
                    fontSize: "0.85rem", color: "#fff", fontFamily: "inherit", fontWeight: 700,
                    opacity: (editing || !editText.trim()) ? 0.7 : 1,
                  }}
                >
                  {editing ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </>
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

        {modalOpen && (
          <>
            <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 7999, background: "rgba(20,17,13,0.55)" }} />
            <PulseDetailModal item={item} onClose={closeModal} />
          </>
        )}
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
        {modalOpen && (
          <>
            <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 7999, background: "rgba(20,17,13,0.55)" }} />
            <DirectoryDetailModal item={item} onClose={closeModal} />
          </>
        )}
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
        {modalOpen && (
          <>
            <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 7999, background: "rgba(20,17,13,0.55)" }} />
            <HappeningDetailModal item={item} onClose={closeModal} />
          </>
        )}
        <style>{`.happening-body p { margin: 0 0 0.6em; } .happening-body p:last-child { margin-bottom: 0; }`}</style>
      </>
    );
  }

  return null;
}
