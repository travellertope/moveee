"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { WpComment } from "@/lib/pulse-wordpress";
import CommentThread from "./CommentThread";
import HashtagText from "./HashtagText";
import ReactionBar from "./ReactionBar";
import SourcePreviewCard from "./SourcePreviewCard";
import type { FeedItem } from "@/lib/unified-feed";
import ProBadge from "@/components/ProBadge";

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
      if (res.ok) setIsFollowing(!isFollowing);
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
        border: isFollowing ? "1px solid rgba(179,130,56,.4)" : "1px solid #d8d2c4",
        background: isFollowing ? "rgba(179,130,56,.08)" : "transparent",
        color: isFollowing ? "#b38238" : "#14110d",
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
            position: "relative", background: showResults ? `linear-gradient(to right, rgba(46,125,50,0.1) ${pct}%, transparent ${pct}%)` : "#fff",
            border: `1px solid ${voted === i ? "#2e7d32" : "#e0d8ce"}`, borderRadius: "4px",
            padding: "8px 12px", textAlign: "left", cursor: showResults ? "default" : "pointer",
            fontSize: "0.85rem", color: "#14110d", fontFamily: "inherit",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>{opt.text}</span>
            {showResults && <span style={{ fontSize: "0.75rem", color: "#7a6f5c", fontWeight: 600 }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: "0.72rem", color: "#7a6f5c" }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.8rem" }}>
      <button
        type="button"
        onClick={toggle}
        disabled={loading || (!rsvped && isFull)}
        style={{
          background: rsvped ? "#fff" : "var(--ochre, #b38238)",
          color: rsvped ? "#b38238" : "#fff",
          border: "1px solid #b38238",
          borderRadius: "4px",
          padding: "8px 16px",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: !rsvped && isFull ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {rsvped ? "Going ✓" : isFull ? "Full" : "RSVP"}
      </button>
      <span style={{ fontSize: "0.75rem", color: "#7a6f5c" }}>
        {count} going{capacity ? ` · ${Math.max(0, capacity - count)} spots left` : ""}
      </span>
    </div>
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
}

export default function CommunityDetailModal({ item, onClose, onMentionClick }: CommunityDetailModalProps) {
  const [comments, setComments] = useState<WpComment[]>([]);
  const [loading, setLoading] = useState(true);

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

  const initials = (item.communityAuthor ?? "?")
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";

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
              background: "#edf7ed", color: "#2e7d32",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "2px",
            }}>Community</span>
            {item.communityTag && (
              <span style={{ fontSize: "0.62rem", color: "#7a6f5c", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.communityTag}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {item.slug && (
              <Link
                href={`/community/${item.slug}`}
                style={{
                  color: "#7a6f5c", fontSize: "0.65rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  textDecoration: "none", padding: "0.2rem 0.5rem",
                  border: "1px solid #d8d0c6", borderRadius: "2px",
                }}
              >
                Open full page <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "2px" }}><path d="M3 9L9 3M4 3h5v5"/></svg>
              </Link>
            )}
            <button
              onClick={close}
              aria-label="Close"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#7a6f5c", fontSize: "1.1rem", lineHeight: 1, padding: "0.25rem",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem", flex: 1 }}>
          {/* Author row */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "#edf7ed", border: "1px solid #c8e6c9",
              color: "#2e7d32", fontSize: "0.65rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              overflow: "hidden",
              ...(item.communityTier === "patron" ? { boxShadow: "0 0 0 2.5px #b38238, 0 0 16px 4px rgba(179,130,56,.6)" } : {}),
            }}>
              {item.communityAuthorAvatar ? (
                <img src={item.communityAuthorAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>
            <div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "#14110d", fontSize: "0.88rem", fontWeight: 600 }}>
                  {item.communityAuthor || "Community Member"}
                </span>
                {item.communityTier === "patron" && <ProBadge size={13} />}
              </div>
              <span style={{ color: "#999", fontSize: "0.72rem" }}>
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
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b38238", background: "rgba(179,130,56,0.1)", padding: "2px 8px", borderRadius: "2px" }}>
                  Hidden Gem {item.starRating ? "★".repeat(item.starRating) : ""}
                </span>
              )}
              {item.templateType === "cultural-take" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b48a8", background: "rgba(107,72,168,0.08)", padding: "2px 8px", borderRadius: "2px" }}>
                  Take{item.locationName ? ` · ${item.locationName}` : ""}
                </span>
              )}
              {item.templateType === "food-review" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c5491f", background: "rgba(197,73,31,0.08)", padding: "2px 8px", borderRadius: "2px" }}>
                  Food Review{item.foodDishName ? ` · ${item.foodDishName}` : ""}
                </span>
              )}
              {item.templateType === "creative-showcase" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1976d2", background: "rgba(25,118,210,0.08)", padding: "2px 8px", borderRadius: "2px" }}>
                  Creative Showcase
                </span>
              )}
              {item.templateType === "itinerary" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2e7d32", background: "rgba(46,125,50,0.08)", padding: "2px 8px", borderRadius: "2px" }}>
                  Weekend Route
                </span>
              )}
              {item.templateType === "event" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a8351f", background: "rgba(168,53,31,0.08)", padding: "2px 8px", borderRadius: "2px" }}>
                  Event{item.eventCategory ? ` · ${item.eventCategory}` : ""}
                </span>
              )}
            </div>
          )}

          {/* Location badge */}
          {item.locationName && item.templateType !== "cultural-take" && (
            <div style={{ fontSize: "0.78rem", color: "#7a6f5c", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📍</span> {item.locationName}
            </div>
          )}

          {/* Post text */}
          <div style={{
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "#3a342b",
            marginBottom: "1rem",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}>
            <HashtagText text={stripTrailingUrl(item.title, item.sourceUrl && !item.image ? item.sourceUrl : undefined)} onMentionClick={onMentionClick} />
          </div>

          {/* Food review ratings */}
          {item.templateType === "food-review" && item.foodRatingTaste && (
            <div style={{ display: "flex", gap: "20px", marginBottom: "0.75rem", fontSize: "0.82rem", color: "#7a6f5c" }}>
              <span>Taste {"★".repeat(item.foodRatingTaste)}{"☆".repeat(5 - item.foodRatingTaste)}</span>
              {item.foodRatingValue && <span>Value {"★".repeat(item.foodRatingValue)}{"☆".repeat(5 - item.foodRatingValue)}</span>}
              {item.foodRatingVibe && <span>Vibe {"★".repeat(item.foodRatingVibe)}{"☆".repeat(5 - item.foodRatingVibe)}</span>}
            </div>
          )}

          {/* Poll */}
          {item.templateType === "poll" && item.pollOptions && (
            <PollDisplay postId={item.wpId} options={item.pollOptions} expiresAt={item.pollExpiresAt} />
          )}

          {/* Event details + RSVP */}
          {item.templateType === "event" && (
            <div style={{ fontSize: "0.82rem", color: "#7a6f5c", marginBottom: "0.6rem", lineHeight: 1.6 }}>
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
                  <Link href={`/directory/${item.organiserSlug}`} style={{ color: "#b38238" }}>
                    {item.organiserName}
                  </Link>
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

          {/* Gallery */}
          {item.galleryImages && item.galleryImages.length >= 1 && (
            <div className="hide-scrollbar" style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "0.75rem", borderRadius: "6px", border: "1px solid #e8e2d8" }}>
              {item.galleryImages.map((img: string, i: number) => (
                <img key={i} src={img} alt="" style={{ height: "220px", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
              ))}
            </div>
          )}

          {/* Video embed */}
          {item.videoUrl && (
            <div style={{ marginBottom: "0.75rem" }}>
              {item.videoUrl.includes("youtube.com") || item.videoUrl.includes("youtu.be") ? (
                <iframe
                  src={`https://www.youtube.com/embed/${item.videoUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] ?? ""}`}
                  style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "6px" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#b38238", fontSize: "0.82rem" }}>Watch video →</a>
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
                    background: "var(--ochre, #b38238)", color: "#fff",
                    fontSize: "0.72rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#14110d" }}>{stop.name}</div>
                    {stop.note && <div style={{ fontSize: "0.8rem", color: "#7a6f5c", lineHeight: 1.4 }}>{stop.note}</div>}
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
            <div style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid #e8e2d8" }}>
              <img src={item.image} alt="" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: "320px" }} loading="lazy" />
            </div>
          )}

          {/* Link preview (only if no image) */}
          {!item.image && item.sourceUrl && (
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
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #e8e2d8" }}>
              <ReactionBar
                noBorder
                itemId={item.wpId}
                itemType="community"
                initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${item.slug}`}
              />
            </div>
          )}

          {/* Comment thread */}
          <div>
            {loading ? (
              <p style={{ color: "#999", fontSize: "0.8rem" }}>Loading comments…</p>
            ) : item.wpId ? (
              <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
