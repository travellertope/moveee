"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import HashtagText from "@/components/pulse/HashtagText";
import ReactionBar from "@/components/pulse/ReactionBar";
import SourcePreviewCard from "@/components/pulse/SourcePreviewCard";
import type { WpComment } from "@/lib/community-wordpress";

function PollDisplay({ postId, options, expiresAt }: { postId: string; options: { text: string; votes: number }[]; expiresAt?: string }) {
  const [voted, setVoted] = useState<number | null>(null);
  const [pollOpts, setPollOpts] = useState(options);
  const [voting, setVoting] = useState(false);

  const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const showResults = voted !== null || expired;
  const totalVotes = pollOpts.reduce((s, o) => s + (o.votes ?? 0), 0);

  async function vote(i: number) {
    if (voting || voted !== null || expired) return;
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
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1rem" }}>
      {pollOpts.map((opt, i) => {
        const pct = showResults && totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        return (
          <button key={i} type="button" onClick={() => vote(i)} disabled={showResults || voting} style={{
            background: showResults ? `linear-gradient(to right, rgba(46,125,50,0.1) ${pct}%, transparent ${pct}%)` : "#fff",
            border: `1px solid ${voted === i ? "#2e7d32" : "#e0d8ce"}`, borderRadius: "4px",
            padding: "10px 14px", textAlign: "left", cursor: showResults ? "default" : "pointer",
            fontSize: "0.9rem", color: "#14110d", fontFamily: "var(--font-fraunces), serif",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>{opt.text}</span>
            {showResults && <span style={{ fontSize: "0.78rem", color: "#7a6f5c", fontWeight: 600 }}>{pct}%</span>}
          </button>
        );
      })}
      <div style={{ fontSize: "0.75rem", color: "#7a6f5c" }}>
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {expiresAt && !expired && ` · ends ${new Date(expiresAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`}
        {expired && " · ended"}
      </div>
    </div>
  );
}

interface Props {
  text: string;
  hashtags: string[];
  wpId: string;
  postId: number;
  initialReactions: { love: number; fire: number; clap: number };
  shareUrl: string;
  initialComments: WpComment[];
  // template fields
  templateType?: string;
  starRating?: number;
  locationName?: string;
  pollOptions?: { text: string; votes: number }[];
  pollExpiresAt?: string;
  galleryImages?: string[];
  videoUrl?: string;
  itineraryStops?: { name: string; lat: number; lng: number; note: string; image_url: string }[];
  foodDishName?: string;
  foodRatingTaste?: number;
  foodRatingValue?: number;
  foodRatingVibe?: number;
  // link preview
  sourceUrl?: string;
  source?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function Avatar({ name, size = 28, bg = "#edf7ed", border = "#c8e6c9", color = "#2e7d32" }: {
  name: string; size?: number; bg?: string; border?: string; color?: string;
}) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: `1px solid ${border}`, color,
      fontSize: size * 0.36 + "px", fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function CommentItem({
  comment, replies, onReply,
}: {
  comment: WpComment;
  replies: WpComment[];
  onReply: (parentId: number, authorName: string) => void;
}) {
  return (
    <div>
      <div style={{
        background: "#fff", border: "1px solid #e8e2d8", borderRadius: "6px", padding: "0.85rem 1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem" }}>
          <Avatar name={comment.author_name} size={28} />
          <span style={{ color: "#14110d", fontSize: "0.82rem", fontWeight: 600 }}>{comment.author_name}</span>
          <span style={{ color: "#bbb", fontSize: "0.7rem", marginLeft: "auto" }}>{formatDate(comment.date)}</span>
        </div>
        <p style={{ color: "#3a342b", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 0.5rem" }}>
          {stripHtml(comment.content.rendered)}
        </p>
        <button
          onClick={() => onReply(comment.id, comment.author_name)}
          style={{
            background: "transparent", border: "none", color: "#7a6f5c",
            fontSize: "0.72rem", cursor: "pointer", padding: 0, letterSpacing: "0.04em",
          }}
        >
          Reply
        </button>
      </div>

      {replies.length > 0 && (
        <div style={{
          marginLeft: "1.25rem", borderLeft: "2px solid #e8e2d8",
          paddingLeft: "0.75rem", marginTop: "0.5rem",
          display: "flex", flexDirection: "column", gap: "0.5rem",
        }}>
          {replies.map(reply => (
            <div key={reply.id} style={{
              background: "#fff", border: "1px solid #e8e2d8", borderRadius: "6px", padding: "0.75rem 1rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <Avatar name={reply.author_name} size={24} bg="#f0ece4" border="#e0d8ce" color="#7a6f5c" />
                <span style={{ color: "#14110d", fontSize: "0.78rem", fontWeight: 600 }}>{reply.author_name}</span>
                <span style={{ color: "#bbb", fontSize: "0.68rem", marginLeft: "auto" }}>{formatDate(reply.date)}</span>
              </div>
              <p style={{ color: "#3a342b", fontSize: "0.85rem", lineHeight: 1.55, margin: 0 }}>
                {stripHtml(reply.content.rendered)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommunityPostClient({
  text, wpId, postId, initialReactions, shareUrl, initialComments,
  templateType, starRating, locationName, pollOptions, pollExpiresAt,
  galleryImages, videoUrl, itineraryStops, foodDishName,
  foodRatingTaste, foodRatingValue, foodRatingVibe,
  sourceUrl, source, ogTitle, ogDescription, ogImage,
}: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<WpComment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loggedIn = status === "authenticated";
  const user = session?.user as any;

  const handleMentionClick = (username: string) => {
    router.push(`/${username}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/community/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: commentText.trim(), parentId: replyTo?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment.");

      setComments(prev => [...prev, {
        id: data.id,
        post: postId,
        parent: replyTo?.id ?? 0,
        author_name: user?.name ?? user?.displayName ?? "Community Member",
        date: data.date ?? new Date().toISOString(),
        content: { rendered: `<p>${commentText.trim()}</p>` },
      }]);
      setCommentText("");
      setReplyTo(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter(c => c.parent === 0);
  const replies = comments.filter(c => c.parent !== 0);
  const count = comments.length;

  return (
    <div>
      {/* Template badge */}
      {templateType && templateType !== "post" && (
        <div style={{ marginBottom: "0.65rem" }}>
          {templateType === "hidden-gem" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b38238", background: "rgba(179,130,56,0.1)", padding: "3px 8px", borderRadius: "2px" }}>
              Hidden Gem {starRating ? "★".repeat(starRating) : ""}
            </span>
          )}
          {templateType === "cultural-take" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b48a8", background: "rgba(107,72,168,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Take{locationName ? ` · ${locationName}` : ""}
            </span>
          )}
          {templateType === "food-review" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c5491f", background: "rgba(197,73,31,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Food Review{foodDishName ? ` · ${foodDishName}` : ""}
            </span>
          )}
          {templateType === "creative-showcase" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1976d2", background: "rgba(25,118,210,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Creative Showcase
            </span>
          )}
          {templateType === "itinerary" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2e7d32", background: "rgba(46,125,50,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Weekend Route
            </span>
          )}
        </div>
      )}

      {/* Location badge (not shown for cultural-take since it's in the badge) */}
      {locationName && templateType !== "cultural-take" && (
        <div style={{ fontSize: "0.82rem", color: "#7a6f5c", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "5px" }}>
          <span>📍</span> {locationName}
        </div>
      )}

      {/* Post text */}
      <p style={{
        color: "#14110d",
        fontFamily: "var(--font-fraunces), serif",
        fontSize: "1.1rem",
        lineHeight: 1.7,
        margin: "0 0 1.25rem",
        whiteSpace: "pre-wrap",
      }}>
        <HashtagText text={text} onMentionClick={handleMentionClick} />
      </p>

      {/* Food ratings */}
      {templateType === "food-review" && foodRatingTaste && (
        <div style={{ display: "flex", gap: "20px", marginBottom: "1rem", fontSize: "0.88rem", color: "#7a6f5c" }}>
          <span>Taste {"★".repeat(foodRatingTaste)}{"☆".repeat(5 - foodRatingTaste)}</span>
          {foodRatingValue && <span>Value {"★".repeat(foodRatingValue)}{"☆".repeat(5 - foodRatingValue)}</span>}
          {foodRatingVibe && <span>Vibe {"★".repeat(foodRatingVibe)}{"☆".repeat(5 - foodRatingVibe)}</span>}
        </div>
      )}

      {/* Poll */}
      {templateType === "poll" && pollOptions && (
        <PollDisplay postId={wpId} options={pollOptions} expiresAt={pollExpiresAt} />
      )}

      {/* Gallery */}
      {galleryImages && galleryImages.length >= 1 && (
        <div style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #e8e2d8" }}>
          {galleryImages.map((img, i) => (
            <img key={i} src={img} alt="" style={{ height: "240px", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
          ))}
        </div>
      )}

      {/* Video embed */}
      {videoUrl && (
        <div style={{ marginBottom: "1rem" }}>
          {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] ?? ""}`}
              style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "6px" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media"
              allowFullScreen
            />
          ) : (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#b38238", fontSize: "0.88rem" }}>Watch video →</a>
          )}
        </div>
      )}

      {/* Itinerary stops */}
      {templateType === "itinerary" && itineraryStops && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "1rem" }}>
          {itineraryStops.map((stop, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "var(--ochre, #b38238)", color: "#fff",
                fontSize: "0.78rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: "2px",
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#14110d" }}>{stop.name}</div>
                {stop.note && <div style={{ fontSize: "0.85rem", color: "#7a6f5c", lineHeight: 1.45, marginTop: "2px" }}>{stop.note}</div>}
                {stop.image_url && (
                  <img src={stop.image_url} alt={stop.name} style={{ marginTop: "8px", width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "6px" }} loading="lazy" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link preview (community_link_url) */}
      {sourceUrl && (
        <div style={{ marginBottom: "1rem" }}>
          <SourcePreviewCard
            goUrl={`/go/link?url=${encodeURIComponent(sourceUrl)}`}
            sourceName={source ?? ""}
            sourceUrl={sourceUrl}
            ogTitle={ogTitle}
            ogDescription={ogDescription}
            ogImage={ogImage}
          />
        </div>
      )}

      <ReactionBar itemId={wpId} itemType="community" initialCounts={initialReactions} shareUrl={shareUrl} />

      {/* Comments */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{
          fontFamily: "var(--font-fraunces), serif",
          fontSize: "1rem", fontWeight: 700, color: "#14110d",
          marginBottom: "1rem", paddingBottom: "0.65rem", borderBottom: "1px solid #e8e2d8",
        }}>
          {count === 0 ? "No comments yet" : `${count} comment${count === 1 ? "" : "s"}`}
        </h2>

        {topLevel.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {topLevel.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={replies.filter(r => r.parent === comment.id)}
                onReply={(id, name) => { setReplyTo({ id, name }); setCommentText(""); }}
              />
            ))}
          </div>
        )}

        {loggedIn ? (
          <form onSubmit={handleSubmit} style={{
            background: "#fff", border: "1px solid #e8e2d8", borderRadius: "6px", padding: "1rem",
          }}>
            {replyTo && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <span style={{ color: "#7a6f5c", fontSize: "0.75rem" }}>
                  Replying to <strong style={{ color: "#14110d" }}>{replyTo.name}</strong>
                </span>
                <button type="button" onClick={() => setReplyTo(null)} style={{
                  background: "transparent", border: "none", color: "#bbb",
                  cursor: "pointer", fontSize: "0.9rem", padding: 0, marginLeft: "auto",
                }}>×</button>
              </div>
            )}
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value.slice(0, 1000))}
              placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Add a comment…"}
              rows={3}
              style={{
                width: "100%", background: "#ffffff", border: "1px solid #e0d8ce",
                borderRadius: "4px", color: "#14110d",
                fontFamily: "var(--font-fraunces), serif",
                fontSize: "0.9rem", lineHeight: 1.55, resize: "vertical",
                outline: "none", padding: "0.65rem 0.85rem", boxSizing: "border-box",
              }}
            />
            {error && <p style={{ color: "#c5491f", fontSize: "0.78rem", margin: "0.4rem 0 0" }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.65rem" }}>
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                style={{
                  background: commentText.trim() && !submitting ? "#c93c2a" : "#e8e2d8",
                  color: commentText.trim() && !submitting ? "#fff" : "#aaa",
                  border: "none", borderRadius: "2px", padding: "0.38rem 1rem",
                  fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: commentText.trim() && !submitting ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
              >
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
            style={{
              width: "100%", background: "#fff", border: "1px solid #e8e2d8",
              borderRadius: "6px", padding: "0.85rem 1rem", color: "#7a6f5c",
              fontSize: "0.85rem", textAlign: "left", cursor: "pointer",
              fontFamily: "var(--font-fraunces), serif",
            }}
          >
            Sign in to join the conversation…
          </button>
        )}
      </div>
    </div>
  );
}
