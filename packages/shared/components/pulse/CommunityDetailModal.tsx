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
        {rsvped ? "Going ✓" : isFull ? "Full" : "RSVP"}
      </button>
      <span style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
        {count} going{capacity ? ` · ${Math.max(0, capacity - count)} spots left` : ""}
      </span>
    </div>
  );
}

/** Duplicated from FeedCard.tsx — see the note there (docs/hubs-plan.md
 * §10.4) on why this always starts on "Join" rather than checking status. */
function HubBadgeRow({ hubId, hubName, hubSlug, hubIsOfficial }: { hubId: number; hubName?: string; hubSlug?: string; hubIsOfficial?: boolean }) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  async function join(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading || joined) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hub/${hubId}/join`, { method: "POST" });
      if (res.ok) setJoined(true);
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
      <Link
        href={hubSlug ? `/hub/${hubSlug}` : "/hub/discover"}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          background: hubIsOfficial ? "var(--ochre)" : "var(--gold)",
          color: "#fff", fontSize: "0.64rem", fontWeight: 700,
          letterSpacing: "0.04em", padding: "4px 11px", borderRadius: "9999px",
          textDecoration: "none", whiteSpace: "nowrap",
        }}
      >
        🏷 {hubName ?? "Hub"}
      </Link>
      <button
        type="button"
        onClick={join}
        disabled={loading || joined}
        style={{
          background: joined ? "transparent" : "var(--ink)",
          color: joined ? "var(--mute)" : "#fff",
          border: joined ? "1px solid var(--rule)" : "none",
          borderRadius: "9999px",
          padding: "4px 11px",
          fontSize: "0.64rem",
          fontWeight: 700,
          cursor: joined ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {joined ? "Joined ✓" : "Join"}
      </button>
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
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

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
              background: "var(--cat-community-bg)", color: "var(--cat-community-fg)",
              fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.18rem 0.45rem", borderRadius: "999px",
            }}>Community</span>
            {item.communityTag && (
              <span style={{ fontSize: "0.62rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {item.communityTag}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {item.slug && (
              <Link
                href={`/community/${item.slug}`}
                style={{
                  color: "var(--ochre)", fontSize: "0.8rem", fontWeight: 400,
                  textDecoration: "underline", textUnderlineOffset: "2px",
                }}
              >
                Open full page →
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
        <div style={{ padding: "1.25rem", flex: 1 }}>
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
              </div>
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

          {item.hubId && (
            <HubBadgeRow
              hubId={item.hubId}
              hubName={item.hubName}
              hubSlug={item.hubSlug}
              hubIsOfficial={item.hubIsOfficial}
            />
          )}

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
              {item.templateType === "food-review" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ochre)", background: "rgba(197,73,31,0.08)", padding: "2px 8px", borderRadius: "999px" }}>
                  Food Review{item.foodDishName ? ` · ${item.foodDishName}` : ""}
                </span>
              )}
              {item.templateType === "book-review" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6B48A8", background: "rgba(107,72,168,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
                  📚 Book Review{item.bookTitle ? ` · ${item.bookTitle}` : ""}
                </span>
              )}
              {item.templateType === "music-review" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0D7377", background: "rgba(13,115,119,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
                  🎵 Music Review{item.musicTitle ? ` · ${item.musicTitle}` : ""}
                </span>
              )}
              {item.templateType === "film-review" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2B4C7E", background: "rgba(43,76,126,0.1)", padding: "2px 8px", borderRadius: "999px" }}>
                  🎬 Film Review{item.filmTitle ? ` · ${item.filmTitle}` : ""}
                </span>
              )}
              {item.templateType === "creative-showcase" && (
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cat-blue-fg)", background: "var(--cat-blue-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  Creative Showcase
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
            <HashtagText text={stripTrailingUrl(item.title, item.sourceUrl && !item.image ? item.sourceUrl : undefined)} onMentionClick={onMentionClick} />
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
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.82rem", color: "var(--mute)", flexWrap: "wrap" }}>
                <span>{"★".repeat(item.bookOverallRating)}{"☆".repeat(5 - item.bookOverallRating)}</span>
                {item.bookAuthor && <span>by {item.bookAuthor}</span>}
                {item.bookStatus && <span>{item.bookStatus}</span>}
                {item.bookRecommend != null && <span>{item.bookRecommend ? "👍 Recommends" : "👎 Doesn't recommend"}</span>}
              </div>
              {item.bookFavQuote && (
                <blockquote style={{
                  marginTop: "0.5rem", padding: "0.5rem 0.75rem",
                  borderLeft: "2px solid #6B48A8", fontStyle: "italic",
                  fontSize: "0.85rem", color: "var(--ink-soft)",
                }}>
                  “{item.bookFavQuote}”
                </blockquote>
              )}
              {item.bookGenres && item.bookGenres.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {item.bookGenres.map((g) => (
                    <span key={g} style={{ fontSize: "0.68rem", color: "var(--mute)", background: "var(--paper-deep)", padding: "2px 8px", borderRadius: "999px" }}>{g}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Music review rating/artist/recommend/genres/favourite lyric/preview */}
          {item.templateType === "music-review" && item.musicOverallRating && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.82rem", color: "var(--mute)", flexWrap: "wrap" }}>
                <span>{"★".repeat(item.musicOverallRating)}{"☆".repeat(5 - item.musicOverallRating)}</span>
                {item.musicArtist && <span>by {item.musicArtist}</span>}
                {item.musicRecommend != null && <span>{item.musicRecommend ? "👍 Recommends" : "👎 Doesn't recommend"}</span>}
                {item.musicPreviewUrl && <AudioPreviewButton src={item.musicPreviewUrl} />}
              </div>
              {item.musicFavLyric && (
                <blockquote style={{
                  marginTop: "0.5rem", padding: "0.5rem 0.75rem",
                  borderLeft: "2px solid #0D7377", fontStyle: "italic",
                  fontSize: "0.85rem", color: "var(--ink-soft)",
                }}>
                  “{item.musicFavLyric}”
                </blockquote>
              )}
              {item.musicGenres && item.musicGenres.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {item.musicGenres.map((g) => (
                    <span key={g} style={{ fontSize: "0.68rem", color: "var(--mute)", background: "var(--paper-deep)", padding: "2px 8px", borderRadius: "999px" }}>{g}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Film review rating/director/recommend/genres/favourite line */}
          {item.templateType === "film-review" && item.filmOverallRating && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.82rem", color: "var(--mute)", flexWrap: "wrap" }}>
                <span>{"★".repeat(item.filmOverallRating)}{"☆".repeat(5 - item.filmOverallRating)}</span>
                {item.filmDirector && <span>dir. {item.filmDirector}</span>}
                {item.filmRecommend != null && <span>{item.filmRecommend ? "👍 Recommends" : "👎 Doesn't recommend"}</span>}
              </div>
              {item.filmFavLine && (
                <blockquote style={{
                  marginTop: "0.5rem", padding: "0.5rem 0.75rem",
                  borderLeft: "2px solid #2B4C7E", fontStyle: "italic",
                  fontSize: "0.85rem", color: "var(--ink-soft)",
                }}>
                  “{item.filmFavLine}”
                </blockquote>
              )}
              {item.filmGenres && item.filmGenres.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {item.filmGenres.map((g) => (
                    <span key={g} style={{ fontSize: "0.68rem", color: "var(--mute)", background: "var(--paper-deep)", padding: "2px 8px", borderRadius: "999px" }}>{g}</span>
                  ))}
                </div>
              )}
            </div>
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
            <RsvpDisplay postId={item.wpId} capacity={item.rsvpCapacity} initialCount={item.rsvpCount} />
          )}

          {/* Gallery */}
          {item.galleryImages && item.galleryImages.length >= 1 && (
            <div className="hide-scrollbar" style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "0.75rem", borderRadius: "6px", border: "1px solid var(--rule)" }}>
              {item.galleryImages.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setLightbox({ images: item.galleryImages!, index: i })}
                  style={{ height: "220px", objectFit: "cover", flexShrink: 0, cursor: "zoom-in" }}
                  loading="lazy"
                />
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
                <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)", fontSize: "0.82rem" }}>Watch video →</a>
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
              style={{ marginBottom: "1rem", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--rule)", cursor: "zoom-in" }}
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
            <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--rule)" }}>
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
