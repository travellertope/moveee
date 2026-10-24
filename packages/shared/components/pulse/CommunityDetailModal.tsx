"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Flag } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { WpComment } from "@/lib/pulse-wordpress";
import CommentThread from "./CommentThread";
import HashtagText from "./HashtagText";
import ReactionBar from "./ReactionBar";
import SourcePreviewCard from "./SourcePreviewCard";
import type { FeedItem } from "@/lib/unified-feed";
import ProBadge from "@/components/ProBadge";
import ImageLightbox from "./ImageLightbox";
import AudioPreviewButton from "./AudioPreviewButton";

function AuthorFollowToggle({ username }: { username: string }) {
  const { data: session, status } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const isSelf = (session?.user as any)?.username === username;

  useEffect(() => {
    if (status !== "authenticated" || isSelf) return;
    fetch(`/api/connect/${encodeURIComponent(username)}/follow`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setIsFollowing(!!data.isFollowing); })
      .finally(() => setReady(true));
  }, [username, status, isSelf]);

  if (status !== "authenticated" || isSelf) return null;

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/connect/${encodeURIComponent(username)}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow" }),
      });
      const data = await res.json().catch(() => null);
      // Trust the server's actual isFollowing, not just the HTTP status — a
      // write that silently failed server-side can still come back as a
      // 200 with the toggle not having actually flipped.
      if (res.ok && data) setIsFollowing(!!data.isFollowing);
    } catch {}
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy || !ready}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase",
        padding: "2px 9px", borderRadius: "999px", cursor: "pointer",
        border: isFollowing ? "1px solid rgba(179,130,56,.4)" : "1px solid var(--rule)",
        background: isFollowing ? "rgba(179,130,56,.08)" : "transparent",
        color: isFollowing ? "var(--gold)" : "var(--ink)",
      }}
    >
      {isFollowing ? "✓ Following" : "Follow"}
    </button>
  );
}

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
      if (res.ok) { const data = await res.json(); setPollOpts(data.options); setVoted(i); }
    } catch {}
    setVoting(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "0.8rem" }}>
      {pollOpts.map((opt, i) => {
        const pct = showResults && totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        return (
          <button key={i} type="button" onClick={() => vote(i)} disabled={showResults || voting} style={{
            position: "relative", background: showResults ? `linear-gradient(to right, rgba(46,125,50,0.1) ${pct}%, transparent ${pct}%)` : "var(--paper)",
            border: `1px solid ${voted === i ? "var(--cat-community-fg)" : "var(--rule)"}`, borderRadius: "4px",
            padding: "8px 12px", textAlign: "left", cursor: showResults ? "default" : "pointer",
            fontSize: "0.85rem", color: "var(--ink)", fontFamily: "inherit",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>{opt.text}</span>
            {showResults && <span style={{ fontSize: "0.75rem", color: "var(--mute)", fontWeight: 600 }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: "0.72rem", color: "var(--mute)" }}>
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
        } else if (res.status === 403) {
          setPaidError("Moveee Pro membership required.");
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
    <div style={{ marginBottom: "0.8rem" }}>
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
            padding: "8px 16px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: !rsvped && isFull ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {buttonLabel}
        </button>
        <span style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
          {count} going{capacity ? ` · ${Math.max(0, capacity - count)} spots left` : ""}
        </span>
      </div>
      {paidError && (
        <p style={{ margin: "4px 0 0", fontSize: "0.73rem", color: "var(--ochre)" }}>{paidError}</p>
      )}
    </div>
  );
}


function CardLink({ slug, children }: { slug?: string; children: React.ReactNode }) {
  if (!slug) return <>{children}</>;
  return (
    <Link href={`/directory/${slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      {children}
    </Link>
  );
}

function stripTrailingUrl(text: string, sourceUrl?: string): string {
  if (!sourceUrl) return text;
  const escaped = sourceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\s*${escaped}\\s*$`), "").trimEnd();
}

interface CommunityDetailModalProps {
  item: FeedItem;
  onClose: () => void;
  onMentionClick?: (username: string) => void;
  onDelete?: (id: string) => void;
}

export default function CommunityDetailModal({ item, onClose, onMentionClick, onDelete }: CommunityDetailModalProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<WpComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const [reportState, setReportState] = useState<"idle" | "confirm" | "sent" | "error">("idle");

  // Owner actions
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [editing, setEditing] = useState(false);
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
        onClose();
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

  async function submitReport(reason: "spam" | "harassment" | "inappropriate") {
    if (!item.wpId) return;
    try {
      const res = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: item.wpId, reason }),
      });
      setReportState(res.ok ? "sent" : "error");
    } catch {
      setReportState("error");
    }
  }

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

  useEffect(() => {
    if (!item.wpId) { setLoading(false); return; }
    fetch(`/api/pulse/comments?postId=${item.wpId}`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.wpId]);

  // Derive effective YouTube embed URL from videoUrl, sourceUrl, or inline text
  const ytUrl: string | null = (() => {
    if (item.videoUrl) return item.videoUrl;
    const src = item.sourceUrl ?? "";
    if (src.includes("youtu.be") || src.includes("youtube.com/watch")) return src;
    const m = (item.title ?? "").match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch[^\s]*|youtu\.be\/)[^\s]*/);
    return m ? m[0] : null;
  })();

  const initials = (item.communityAuthor ?? "?")
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(20,17,13,0.60)",
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          maxHeight: "90vh",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.5rem 1.25rem",
          borderBottom: "1px solid var(--rule)",
          flexShrink: 0,
          background: "var(--paper-header)", zIndex: 1,
        }}>
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{
              background: "var(--cat-community-bg)", color: "var(--cat-community-fg)",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "999px",
            }}>Community</span>
            {item.communityTag && !item.hubId && (
              <span style={{ fontSize: "0.62rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.communityTag}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {isOwn && (
              <button
                onClick={() => setOwnerMenuOpen(v => !v)}
                title="Post options"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--mute)", padding: "0.25rem 0.4rem", borderRadius: "4px",
                  fontSize: "1rem", lineHeight: 1, display: "flex", alignItems: "center",
                }}
              >
                ···
              </button>
            )}
            {item.slug && (
              <Link
                href={`/community/${item.slug}`}
                aria-label="Open full page"
                title="Open full page"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--mute)", padding: "0.25rem",
                  borderRadius: "6px", transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ochre)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--mute)")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </Link>
            )}
            <button
              onClick={close}
              aria-label="Close"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--ink)", lineHeight: 1, padding: "0.25rem", display: "flex",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
          {/* Author row */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "var(--cat-community-bg)", border: "1px solid rgba(46,125,50,0.3)",
              color: "var(--cat-community-fg)", fontSize: "0.65rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              overflow: "hidden",
              ...(item.communityTier === "patron" ? { boxShadow: "var(--glow-gold)" } : {}),
            }}>
              {item.communityAuthorAvatar ? (
                <img src={item.communityAuthorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>
            <div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "var(--ink)", fontSize: "0.88rem", fontWeight: 600 }}>
                  {item.communityAuthor || "Community Member"}
                </span>
                {item.communityTier === "patron" && <ProBadge size={13} />}
                {(item.hubName || item.hubSlug || (item.communityTag && !item.hubId)) && (() => {
                  const tagLabel = item.hubName || item.communityTag;
                  const tagSlug  = item.hubSlug || item.communityTag?.toLowerCase();
                  return (
                    <Link
                      href={tagSlug ? `/hub/${tagSlug}` : "/hub/discover"}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginLeft: "auto",
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
              </div>
              {item.communityAuthorUsername && (
                <div style={{ color: "var(--mute)", fontSize: "0.7rem", marginBottom: "1px" }}>
                  @{item.communityAuthorUsername}
                </div>
              )}
              <span style={{ color: "var(--mute)", fontSize: "0.72rem" }}>
                {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            {item.communityAuthorUsername && (
              <div style={{ marginLeft: "auto" }}>
                <AuthorFollowToggle username={item.communityAuthorUsername} />
              </div>
            )}
          </div>

          {/* Template badge */}
          {item.templateType && item.templateType !== "post" && (
            <div style={{ marginBottom: "0.5rem" }}>
              {item.templateType === "hidden-gem" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", background: "rgba(179,130,56,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
                  Place {item.starRating ? "★".repeat(item.starRating) : ""}
                </span>
              )}
              {item.templateType === "cultural-take" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-purple-fg)", background: "var(--cat-purple-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  Take{item.locationName ? ` · ${item.locationName}` : ""}
                </span>
              )}
              {/* review types: info card already conveys the type and title — no separate eyebrow badge */}
              {item.templateType === "project" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-blue-fg)", background: "var(--cat-blue-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  Project
                </span>
              )}
              {item.templateType === "itinerary" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-community-fg)", background: "var(--cat-community-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  Itinerary
                </span>
              )}
              {item.templateType === "event" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-rust-fg)", background: "var(--cat-rust-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  Event{item.eventCategory ? ` · ${item.eventCategory}` : ""}
                </span>
              )}
            </div>
          )}

          {/* Location badge */}
          {item.locationName && item.templateType !== "cultural-take" && (
            <div style={{ fontSize: "0.78rem", color: "var(--mute)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📍</span> {item.locationName}
            </div>
          )}

          {/* Post text */}
          <div style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "var(--ink-soft)",
            marginBottom: "1rem",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}>
            {(() => {
              const ytFromInline = !item.videoUrl && !(item.sourceUrl?.includes("youtu.be") || item.sourceUrl?.includes("youtube.com/watch")) && ytUrl !== null;
              const urlToStrip = ytFromInline ? ytUrl! : (item.sourceUrl && !item.image ? item.sourceUrl : undefined);
              const fullText = stripTrailingUrl(item.title, urlToStrip);
              const isReviewType = ["music-review", "book-review", "film-review", "food-review"].includes(item.templateType ?? "");
              if (isReviewType) {
                // Strip any leading title the user typed (it duplicates the info card)
                const reviewTitle = item.musicTitle || item.bookTitle || item.filmTitle || item.foodDishName;
                let body = fullText;
                if (reviewTitle && body.toLowerCase().startsWith(reviewTitle.toLowerCase())) {
                  body = body.slice(reviewTitle.length).replace(/^[\n\r\s]+/, "");
                }
                return body ? <HashtagText text={body} onMentionClick={onMentionClick} /> : null;
              }
              const dblNl = fullText.indexOf("\n\n");
              const singleNl = fullText.indexOf("\n");
              const nlIdx = dblNl !== -1 ? dblNl : singleNl;
              const sepLen = dblNl !== -1 ? 2 : 1;
              if (nlIdx === -1) return <HashtagText text={fullText} onMentionClick={onMentionClick} />;
              const titlePart = fullText.slice(0, nlIdx).trim();
              const bodyPart = fullText.slice(nlIdx + sepLen).trim();
              return (
                <>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)", marginBottom: "0.45rem", lineHeight: 1.4 }}>
                    <HashtagText text={titlePart} onMentionClick={onMentionClick} />
                  </div>
                  {bodyPart && <HashtagText text={bodyPart} onMentionClick={onMentionClick} />}
                </>
              );
            })()}
          </div>

          {/* Food review ratings */}
          {item.templateType === "food-review" && item.foodRatingTaste && (
            <div style={{ display: "flex", gap: "20px", marginBottom: "0.75rem", fontSize: "0.82rem", color: "var(--mute)" }}>
              <span>Taste {"★".repeat(item.foodRatingTaste)}{"☆".repeat(5 - item.foodRatingTaste)}</span>
              {item.foodRatingValue && <span>Value {"★".repeat(item.foodRatingValue)}{"☆".repeat(5 - item.foodRatingValue)}</span>}
              {item.foodRatingVibe && <span>Vibe {"★".repeat(item.foodRatingVibe)}{"☆".repeat(5 - item.foodRatingVibe)}</span>}
            </div>
          )}

          {/* Book review rating/status/recommend/genres/favourite quote */}
          {item.templateType === "book-review" && item.bookOverallRating && (
            <CardLink slug={item.linkedDirectorySlug}>
            <div style={{ background: "var(--paper-deep)", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "var(--radius-xl)", padding: "14px", marginBottom: "0.75rem", cursor: item.linkedDirectorySlug ? "pointer" : undefined }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                {item.bookCoverUrl && (
                  <img src={item.bookCoverUrl} alt="" style={{ width: 78, height: 110, objectFit: "cover", borderRadius: "var(--radius-md)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {item.bookTitle && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "2px" }}>{item.bookTitle}</div>}
                  {item.bookAuthor && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "4px" }}>by {item.bookAuthor}</div>}
                  <div style={{ fontSize: "0.9rem", color: "var(--ochre)", marginBottom: "4px" }}>
                    {"★".repeat(item.bookOverallRating)}{"☆".repeat(5 - item.bookOverallRating)}
                  </div>
                  {item.bookRecommend != null && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "4px" }}>{item.bookRecommend ? "👍 Recommends" : "👎 Does not recommend"}</div>}
                  {item.bookStatus && <div style={{ fontSize: "0.8rem", color: "var(--mute)" }}>{item.bookStatus}</div>}
                  {(item.bookRatingWriting || item.bookRatingStory || item.bookRatingCharacters || item.bookRatingPacing) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "6px", fontSize: "0.75rem", color: "var(--mute)" }}>
                      {item.bookRatingWriting    && <span>Writing {"★".repeat(item.bookRatingWriting)}{"☆".repeat(5 - item.bookRatingWriting)}</span>}
                      {item.bookRatingStory      && <span>Story {"★".repeat(item.bookRatingStory)}{"☆".repeat(5 - item.bookRatingStory)}</span>}
                      {item.bookRatingCharacters && <span>Characters {"★".repeat(item.bookRatingCharacters)}{"☆".repeat(5 - item.bookRatingCharacters)}</span>}
                      {item.bookRatingPacing     && <span>Pacing {"★".repeat(item.bookRatingPacing)}{"☆".repeat(5 - item.bookRatingPacing)}</span>}
                    </div>
                  )}
                </div>
              </div>
              {item.bookFavQuote && (
                <blockquote style={{
                  margin: "0.5rem 0 0", padding: "0.5rem 0.75rem",
                  borderLeft: "2px solid #6B48A8", fontStyle: "italic",
                  fontSize: "0.82rem", color: "var(--ink-soft)",
                }}>
                  &ldquo;{item.bookFavQuote}&rdquo;
                </blockquote>
              )}
              {item.bookGenres && item.bookGenres.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {item.bookGenres.map((g) => (
                    <span key={g} style={{ fontSize: "0.68rem", color: "var(--mute)", background: "rgba(20,17,13,0.06)", padding: "2px 8px", borderRadius: "999px" }}>{g}</span>
                  ))}
                </div>
              )}
            </div>
            </CardLink>
          )}

          {/* Music review rating/artist/recommend/genres/favourite lyric/preview */}
          {item.templateType === "music-review" && item.musicOverallRating && (
            <div style={{ background: "var(--paper-deep)", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "var(--radius-xl)", padding: "14px", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                {/* AudioPreviewButton sits OUTSIDE any link so clicking play/cover never navigates */}
                <AudioPreviewButton src={item.musicPreviewUrl} coverUrl={item.musicCoverUrl} size={100} />
                <CardLink slug={item.linkedDirectorySlug}>
                <div style={{ flex: 1, minWidth: 0, cursor: item.linkedDirectorySlug ? "pointer" : undefined }}>
                  {item.musicTitle && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "2px" }}>{item.musicTitle}</div>}
                  {item.musicArtist && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "4px" }}>{item.musicArtist}</div>}
                  <div style={{ fontSize: "0.9rem", color: "var(--ochre)", marginBottom: "4px" }}>
                    {"★".repeat(item.musicOverallRating)}{"☆".repeat(5 - item.musicOverallRating)}
                  </div>
                  {item.musicRecommend != null && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "4px" }}>{item.musicRecommend ? "👍 Recommends" : "👎 Does not recommend"}</div>}
                  {(item.musicRatingProduction || item.musicRatingLyrics || item.musicRatingReplay || item.musicRatingVibe) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "6px", fontSize: "0.75rem", color: "var(--mute)" }}>
                      {item.musicRatingProduction && <span>Production {"★".repeat(item.musicRatingProduction)}{"☆".repeat(5 - item.musicRatingProduction)}</span>}
                      {item.musicRatingLyrics     && <span>Lyrics {"★".repeat(item.musicRatingLyrics)}{"☆".repeat(5 - item.musicRatingLyrics)}</span>}
                      {item.musicRatingReplay     && <span>Replay {"★".repeat(item.musicRatingReplay)}{"☆".repeat(5 - item.musicRatingReplay)}</span>}
                      {item.musicRatingVibe       && <span>Vibe {"★".repeat(item.musicRatingVibe)}{"☆".repeat(5 - item.musicRatingVibe)}</span>}
                    </div>
                  )}
                </div>
                </CardLink>
              </div>
              {item.musicFavLyric && (
                <blockquote style={{
                  margin: "0.5rem 0 0", padding: "0.5rem 0.75rem",
                  borderLeft: "2px solid #0D7377", fontStyle: "italic",
                  fontSize: "0.82rem", color: "var(--ink-soft)",
                }}>
                  &ldquo;{item.musicFavLyric}&rdquo;
                </blockquote>
              )}
              {item.musicGenres && item.musicGenres.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {item.musicGenres.map((g) => (
                    <span key={g} style={{ fontSize: "0.68rem", color: "var(--mute)", background: "rgba(20,17,13,0.06)", padding: "2px 8px", borderRadius: "999px" }}>{g}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Film review rating/director/recommend/genres/favourite line */}
          {item.templateType === "film-review" && item.filmOverallRating && (
            <CardLink slug={item.linkedDirectorySlug}>
            <div style={{ background: "var(--paper-deep)", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "var(--radius-xl)", padding: "14px", marginBottom: "0.75rem", cursor: item.linkedDirectorySlug ? "pointer" : undefined }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                {item.filmCoverUrl && (
                  <img src={item.filmCoverUrl} alt="" style={{ width: 78, height: 110, objectFit: "cover", borderRadius: "var(--radius-md)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {item.filmTitle && <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.3, marginBottom: "2px" }}>{item.filmTitle}</div>}
                  {item.filmDirector && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "4px" }}>Dir. {item.filmDirector}</div>}
                  <div style={{ fontSize: "0.9rem", color: "var(--ochre)", marginBottom: "4px" }}>
                    {"★".repeat(item.filmOverallRating)}{"☆".repeat(5 - item.filmOverallRating)}
                  </div>
                  {item.filmRecommend != null && <div style={{ fontSize: "0.8rem", color: "var(--mute)", marginBottom: "4px" }}>{item.filmRecommend ? "👍 Recommends" : "👎 Does not recommend"}</div>}
                  {(item.filmRatingStory || item.filmRatingActing || item.filmRatingVisuals || item.filmRatingPacing) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "6px", fontSize: "0.75rem", color: "var(--mute)" }}>
                      {item.filmRatingStory   && <span>Story {"★".repeat(item.filmRatingStory)}{"☆".repeat(5 - item.filmRatingStory)}</span>}
                      {item.filmRatingActing  && <span>Acting {"★".repeat(item.filmRatingActing)}{"☆".repeat(5 - item.filmRatingActing)}</span>}
                      {item.filmRatingVisuals && <span>Visuals {"★".repeat(item.filmRatingVisuals)}{"☆".repeat(5 - item.filmRatingVisuals)}</span>}
                      {item.filmRatingPacing  && <span>Pacing {"★".repeat(item.filmRatingPacing)}{"☆".repeat(5 - item.filmRatingPacing)}</span>}
                    </div>
                  )}
                </div>
              </div>
              {item.filmFavLine && (
                <blockquote style={{
                  margin: "0.5rem 0 0", padding: "0.5rem 0.75rem",
                  borderLeft: "2px solid #2B4C7E", fontStyle: "italic",
                  fontSize: "0.82rem", color: "var(--ink-soft)",
                }}>
                  &ldquo;{item.filmFavLine}&rdquo;
                </blockquote>
              )}
              {item.filmGenres && item.filmGenres.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {item.filmGenres.map((g) => (
                    <span key={g} style={{ fontSize: "0.68rem", color: "var(--mute)", background: "rgba(20,17,13,0.06)", padding: "2px 8px", borderRadius: "999px" }}>{g}</span>
                  ))}
                </div>
              )}
            </div>
            </CardLink>
          )}

          {/* Poll */}
          {item.templateType === "poll" && item.pollOptions && (
            <PollDisplay postId={item.wpId} options={item.pollOptions} expiresAt={item.pollExpiresAt} />
          )}

          {/* Event details + RSVP */}
          {item.templateType === "event" && (
            <div style={{
              background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "6px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              padding: "0.85rem 1rem", marginBottom: "0.75rem",
              fontSize: "0.82rem", color: "var(--mute)", lineHeight: 1.6,
            }}>
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
                  <Link href={`/directory/${item.organiserSlug}`} style={{ color: "var(--gold)" }}>
                    {item.organiserName}
                  </Link>
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

          {/* Gallery */}
          {item.galleryImages && item.galleryImages.length >= 1 && (
            <div style={{ borderRadius: "var(--radius-xl, 12px)", overflow: "hidden", border: "1px solid var(--rule)", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "2px" }}>
                {item.galleryImages.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setLightbox({ images: item.galleryImages!, index: i })}
                    style={{ flex: "1 1 0", minWidth: 0, maxWidth: "300px", aspectRatio: "1", height: "auto", objectFit: "cover", cursor: "zoom-in" }}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Video embed — uses ytUrl which covers videoUrl, sourceUrl-is-YouTube, and inline YouTube */}
          {ytUrl && (
            <div style={{ marginBottom: "0.75rem" }}>
              {ytUrl.includes("youtube.com") || ytUrl.includes("youtu.be") ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]+)/)?.[1] ?? ""}`}
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "var(--radius-xl, 12px)" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontSize: "0.82rem" }}>Watch video →</a>
              )}
            </div>
          )}

          {/* Itinerary stops */}
          {item.templateType === "itinerary" && item.itineraryStops && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "0.75rem" }}>
              {item.itineraryStops.map((stop: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "var(--gold)", color: "#fff",
                    fontSize: "0.72rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--ink)" }}>{stop.name}</div>
                    {stop.note && <div style={{ fontSize: "0.8rem", color: "var(--mute)", lineHeight: 1.4 }}>{stop.note}</div>}
                    {stop.image_url && (
                      <img src={stop.image_url} alt={stop.name} style={{ marginTop: "6px", width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "4px" }} loading="lazy" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Single image (only when no gallery) */}
          {item.image && !item.galleryImages?.length && (
            <div
              onClick={() => setLightbox({ images: [item.image!], index: 0 })}
              style={{ marginBottom: "1rem", borderRadius: "var(--radius-xl, 12px)", overflow: "hidden", border: "1px solid var(--rule)", cursor: "zoom-in" }}
            >
              <img src={item.image} alt="" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "320px" }} loading="lazy" />
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

          {/* Link preview — skip when YouTube (video embed handles it) */}
          {!item.image && item.sourceUrl && !ytUrl && (
            <div style={{ marginBottom: "1rem" }}>
              <SourcePreviewCard
                goUrl={`/go/link?url=${encodeURIComponent(item.sourceUrl!)}`}
                sourceName={item.source ?? ""}
                sourceUrl={item.sourceUrl}
                ogTitle={item.ogTitle}
                ogDescription={item.ogDescription}
                ogImage={item.ogImage}
              />
            </div>
          )}

          {/* Reactions */}
          {item.wpId && (
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--rule)" }}>
              <ReactionBar
                noBorder
                itemId={item.wpId}
                itemType="community"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${item.slug}`}
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

          {/* Report bottom sheet — rendered inside modal, above modal backdrop */}
          {reportState === "confirm" && (
            <>
              <div
                onClick={() => setReportState("idle")}
                style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }}
              />
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
                      onClick={() => submitReport(r)}
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
                    onClick={() => setReportState("idle")}
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

          {/* Owner menu */}
          {ownerMenuOpen && (
            <>
              <div onClick={() => setOwnerMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
              <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "min(480px, 100%)", zIndex: 9001, background: "var(--paper, #f3ece0)", borderRadius: "20px 20px 0 0", padding: "0.75rem 1.25rem 1.5rem", boxShadow: "0 -8px 32px rgba(20,17,13,0.18)" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {canEdit && (
                    <button
                      onClick={() => { setOwnerMenuOpen(false); setEditText(item.body ?? item.excerpt ?? item.title ?? ""); setEditOpen(true); }}
                      style={{ width: "100%", padding: "0.8rem 1rem", background: "#fff", border: "1px solid var(--rule, #e8e2d8)", borderRadius: "var(--radius-lg, 6px)", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "var(--ink)", fontFamily: "inherit", fontWeight: 500 }}
                    >
                      Edit post
                    </button>
                  )}
                  <button
                    onClick={() => { setOwnerMenuOpen(false); setDeleteConfirm(true); }}
                    style={{ width: "100%", padding: "0.8rem 1rem", background: "#fff", border: "1px solid var(--rule, #e8e2d8)", borderRadius: "var(--radius-lg, 6px)", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "#c62828", fontFamily: "inherit", fontWeight: 500 }}
                  >
                    Delete post
                  </button>
                  <button
                    onClick={() => setOwnerMenuOpen(false)}
                    style={{ width: "100%", marginTop: "0.25rem", padding: "0.75rem 1rem", background: "transparent", border: "none", borderRadius: "var(--radius-lg, 6px)", cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Delete confirm */}
          {deleteConfirm && (
            <>
              <div onClick={() => !deleting && setDeleteConfirm(false)} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
              <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "min(480px, 100%)", zIndex: 9001, background: "var(--paper, #f3ece0)", borderRadius: "20px 20px 0 0", padding: "0.75rem 1.25rem 1.5rem", boxShadow: "0 -8px 32px rgba(20,17,13,0.18)" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
                <p style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>Delete this post?</p>
                <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "var(--mute)", textAlign: "center" }}>This cannot be undone.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button onClick={handleDelete} disabled={deleting} style={{ width: "100%", padding: "0.8rem 1rem", background: "#c62828", border: "none", borderRadius: "var(--radius-lg, 6px)", cursor: deleting ? "default" : "pointer", fontSize: "0.88rem", color: "#fff", fontFamily: "inherit", fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} disabled={deleting} style={{ width: "100%", padding: "0.75rem 1rem", background: "transparent", border: "none", borderRadius: "var(--radius-lg, 6px)", cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600 }}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Edit post */}
          {editOpen && (
            <>
              <div onClick={() => !editing && setEditOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
              <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "min(480px, 100%)", zIndex: 9001, background: "var(--paper, #f3ece0)", borderRadius: "20px 20px 0 0", padding: "0.75rem 1.25rem 1.5rem", boxShadow: "0 -8px 32px rgba(20,17,13,0.18)" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 0.75rem" }} />
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>Edit post</p>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value.slice(0, 2000))}
                  rows={6}
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md, 4px)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical", outline: "none", padding: "0.75rem 1rem", boxSizing: "border-box" }}
                />
                {editError && <p style={{ color: "#c62828", fontSize: "0.78rem", margin: "0.4rem 0 0" }}>{editError}</p>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button onClick={() => setEditOpen(false)} disabled={editing} style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid var(--rule)", borderRadius: "var(--radius-lg, 6px)", cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={handleEdit} disabled={editing || !editText.trim()} style={{ flex: 2, padding: "0.75rem", background: "var(--ochre, #7a241c)", border: "none", borderRadius: "var(--radius-lg, 6px)", cursor: editing || !editText.trim() ? "default" : "pointer", fontSize: "0.88rem", color: "#fff", fontFamily: "inherit", fontWeight: 600, opacity: editing || !editText.trim() ? 0.6 : 1 }}>
                    {editing ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Comment thread */}
          <div>
            {loading ? (
              <p style={{ color: "var(--mute)", fontSize: "0.8rem" }}>Loading comments…</p>
            ) : item.wpId ? (
              <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
