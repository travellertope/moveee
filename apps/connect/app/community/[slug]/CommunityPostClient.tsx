"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";
import HashtagText from "@/components/pulse/HashtagText";
import ReactionBar from "@/components/pulse/ReactionBar";
import SourcePreviewCard from "@/components/pulse/SourcePreviewCard";
import AudioPreviewButton from "@/components/pulse/AudioPreviewButton";
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
            fontSize: "0.9rem", color: "#14110d", fontFamily: "var(--font-inter), 'Inter', sans-serif",
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
  wpId: string;
  postId: number;
  authorId?: number;
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
  // book review
  bookTitle?: string;
  bookAuthor?: string;
  bookOverallRating?: number;
  bookRatingWriting?: number;
  bookRatingStory?: number;
  bookRatingCharacters?: number;
  bookRatingPacing?: number;
  bookFavQuote?: string;
  bookGenres?: string[];
  bookCoverUrl?: string;
  // music review
  musicTitle?: string;
  musicArtist?: string;
  musicOverallRating?: number;
  musicRatingProduction?: number;
  musicRatingLyrics?: number;
  musicRatingReplay?: number;
  musicRatingVibe?: number;
  musicFavLyric?: string;
  musicGenres?: string[];
  musicCoverUrl?: string;
  musicPreviewUrl?: string;
  // film review
  filmTitle?: string;
  filmDirector?: string;
  filmOverallRating?: number;
  filmRatingStory?: number;
  filmRatingActing?: number;
  filmRatingVisuals?: number;
  filmRatingPacing?: number;
  filmFavLine?: string;
  filmGenres?: string[];
  filmCoverUrl?: string;
  // link preview
  linkedDirectorySlug?: string;
  sourceUrl?: string;
  source?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

function stripTrailingUrl(text: string, url?: string): string {
  if (!url) return text;
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\s*${escaped}\\s*$`), "").trimEnd();
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
        background: "#f8f6f2", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "12px", padding: "0.9rem 1rem",
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
              background: "#f8f6f2", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "12px", padding: "0.75rem 1rem",
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
  bookTitle, bookAuthor, bookOverallRating, bookRatingWriting, bookRatingStory,
  bookRatingCharacters, bookRatingPacing, bookFavQuote, bookGenres, bookCoverUrl,
  musicTitle, musicArtist, musicOverallRating, musicRatingProduction, musicRatingLyrics,
  musicRatingReplay, musicRatingVibe, musicFavLyric, musicGenres, musicCoverUrl, musicPreviewUrl,
  filmTitle, filmDirector, filmOverallRating, filmRatingStory, filmRatingActing,
  filmRatingVisuals, filmRatingPacing, filmFavLine, filmGenres, filmCoverUrl,
  linkedDirectorySlug,
  sourceUrl, source, ogTitle, ogDescription, ogImage,
  authorId,
}: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<WpComment[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Owner actions
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(text);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Derive effective YouTube embed URL from videoUrl, sourceUrl, or inline text
  const ytUrl: string | null = (() => {
    if (videoUrl) return videoUrl;
    const src = sourceUrl ?? "";
    if (src.includes("youtu.be") || src.includes("youtube.com/watch")) return src;
    const m = text.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch[^\s]*|youtu\.be\/)[^\s]*/);
    return m ? m[0] : null;
  })();

  // Strip inline YouTube URL from displayed text when it's been embedded
  const ytFromInline = !videoUrl && !(sourceUrl?.includes("youtu.be") || sourceUrl?.includes("youtube.com/watch")) && ytUrl !== null;
  const displayText = ytFromInline && ytUrl ? stripTrailingUrl(text, ytUrl) : text;

  const [reportState, setReportState] = useState<"idle" | "confirm" | "sent" | "error">("idle");

  async function submitReport(reason: "spam" | "harassment" | "inappropriate") {
    try {
      const res = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: wpId, reason }),
      });
      setReportState(res.ok ? "sent" : "error");
    } catch {
      setReportState("error");
    }
  }

  const loggedIn = status === "authenticated";
  const user = session?.user as any;
  const sessionUserId = user?.id ? Number(user.id) : user?.databaseId ? Number(user.databaseId) : null;
  const isOwn = !!(sessionUserId && authorId && sessionUserId === authorId);
  const canEdit = isOwn && (user?.tier === "patron" || user?.tier === "lit" || user?.isAdmin === true);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/community/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: wpId }),
      });
      if (res.ok) {
        router.push("/feed");
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
        body: JSON.stringify({ postId: wpId, text: editText }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(d.error ?? "Edit failed.");
      } else {
        setEditOpen(false);
        router.refresh();
      }
    } catch {
      setEditError("Network error.");
    }
    setEditing(false);
  }

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
    <>
    <div>
      {/* Template badge */}
      {templateType && templateType !== "post" && (
        <div style={{ marginBottom: "0.65rem" }}>
          {templateType === "hidden-gem" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b38238", background: "rgba(179,130,56,0.1)", padding: "3px 8px", borderRadius: "2px" }}>
              Place {starRating ? "★".repeat(starRating) : ""}
            </span>
          )}
          {templateType === "cultural-take" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b48a8", background: "rgba(107,72,168,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Take{locationName ? ` · ${locationName}` : ""}
            </span>
          )}
          {templateType === "food-review" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a241c", background: "rgba(197,73,31,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Food Review{foodDishName ? ` · ${foodDishName}` : ""}
            </span>
          )}
          {templateType === "music-review" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a241c", background: "rgba(122,36,28,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Music Review{musicTitle ? ` · ${musicTitle}` : ""}
            </span>
          )}
          {templateType === "book-review" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a241c", background: "rgba(122,36,28,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Book Review{bookTitle ? ` · ${bookTitle}` : ""}
            </span>
          )}
          {templateType === "film-review" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7a241c", background: "rgba(122,36,28,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Film Review{filmTitle ? ` · ${filmTitle}` : ""}
            </span>
          )}
          {templateType === "project" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#1976d2", background: "rgba(25,118,210,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Project
            </span>
          )}
          {templateType === "itinerary" && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2e7d32", background: "rgba(46,125,50,0.08)", padding: "3px 8px", borderRadius: "2px" }}>
              Itinerary
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

      {/* Actions row: directory link + owner options */}
      {(linkedDirectorySlug || isOwn) && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
          {linkedDirectorySlug && (
            <a
              href={`/directory/${linkedDirectorySlug}`}
              title="View in Directory"
              aria-label="View in Directory"
              style={{ display: "flex", alignItems: "center", color: "#7a6f5c", padding: "0.25rem", borderRadius: "6px", textDecoration: "none" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="18" rx="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M15 7h4M15 11h4M5 17c0-2 1.3-3 4-3h2"/>
              </svg>
            </a>
          )}
          {isOwn && (
            <button
              onClick={() => setOwnerMenuOpen(v => !v)}
              title="Post options"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7a6f5c", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "1rem", lineHeight: 1 }}
            >
              ···
            </button>
          )}
        </div>
      )}

      {/* Post text — first paragraph (before \n\n) is the title, rest is body */}
      {(() => {
        const nlIdx = displayText.indexOf("\n\n");
        if (nlIdx === -1) return (
          <p style={{ color: "#14110d", fontFamily: "var(--font-inter), 'Inter', sans-serif", fontSize: "1rem", lineHeight: 1.75, margin: "0 0 1.25rem", whiteSpace: "pre-wrap" }}>
            <HashtagText text={displayText} onMentionClick={handleMentionClick} />
          </p>
        );
        const titlePart = displayText.slice(0, nlIdx).trim();
        const bodyPart = displayText.slice(nlIdx + 2).trim();
        return (
          <>
            <p style={{ color: "#14110d", fontFamily: "var(--font-inter), 'Inter', sans-serif", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.45, margin: "0 0 0.6rem" }}>
              <HashtagText text={titlePart} onMentionClick={handleMentionClick} />
            </p>
            {bodyPart && (
              <p style={{ color: "#14110d", fontFamily: "var(--font-inter), 'Inter', sans-serif", fontSize: "1rem", lineHeight: 1.75, margin: "0 0 1.25rem", whiteSpace: "pre-wrap" }}>
                <HashtagText text={bodyPart} onMentionClick={handleMentionClick} />
              </p>
            )}
          </>
        );
      })()}

      {/* Food ratings */}
      {templateType === "food-review" && foodRatingTaste && (
        <div style={{ display: "flex", gap: "20px", marginBottom: "1rem", fontSize: "0.88rem", color: "#7a6f5c" }}>
          <span>Taste {"★".repeat(foodRatingTaste)}{"☆".repeat(5 - foodRatingTaste)}</span>
          {foodRatingValue && <span>Value {"★".repeat(foodRatingValue)}{"☆".repeat(5 - foodRatingValue)}</span>}
          {foodRatingVibe && <span>Vibe {"★".repeat(foodRatingVibe)}{"☆".repeat(5 - foodRatingVibe)}</span>}
        </div>
      )}

      {/* Music review */}
      {templateType === "music-review" && musicTitle && (
        <div style={{ background: "#f8f6f2", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "var(--radius-xl,12px)", padding: "14px", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <AudioPreviewButton src={musicPreviewUrl} coverUrl={musicCoverUrl} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#14110d" }}>{musicTitle}</div>
              {musicArtist && <div style={{ fontSize: "0.82rem", color: "#7a6f5c" }}>{musicArtist}</div>}
              {musicOverallRating && (
                <div style={{ fontSize: "0.85rem", color: "#b38238", marginTop: "4px" }}>
                  {"★".repeat(musicOverallRating)}{"☆".repeat(5 - musicOverallRating)}
                </div>
              )}
            </div>
          </div>
          {musicOverallRating && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem", color: "#7a6f5c", marginBottom: musicFavLyric ? "10px" : 0 }}>
              {musicRatingProduction != null && <span>Production {"★".repeat(musicRatingProduction)}{"☆".repeat(5 - musicRatingProduction)}</span>}
              {musicRatingLyrics != null && <span>Lyrics {"★".repeat(musicRatingLyrics)}{"☆".repeat(5 - musicRatingLyrics)}</span>}
              {musicRatingReplay != null && <span>Replay {"★".repeat(musicRatingReplay)}{"☆".repeat(5 - musicRatingReplay)}</span>}
              {musicRatingVibe != null && <span>Vibe {"★".repeat(musicRatingVibe)}{"☆".repeat(5 - musicRatingVibe)}</span>}
            </div>
          )}
          {musicFavLyric && (
            <blockquote style={{ margin: "8px 0 0", padding: "0 0 0 10px", borderLeft: "2px solid var(--ochre,#7a241c)", fontSize: "0.85rem", color: "#5a4f3c", fontStyle: "italic", lineHeight: 1.5 }}>
              "{musicFavLyric}"
            </blockquote>
          )}
          {musicGenres && musicGenres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              {musicGenres.map(g => <span key={g} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#7a6f5c", background: "rgba(20,17,13,0.06)", padding: "2px 8px", borderRadius: "9999px" }}>{g}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Book review */}
      {templateType === "book-review" && bookTitle && (
        <div style={{ background: "#f8f6f2", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "var(--radius-xl,12px)", padding: "14px", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
            {bookCoverUrl && (
              <img src={bookCoverUrl} alt={bookTitle} style={{ width: 56, height: 80, borderRadius: "var(--radius-md,4px)", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#14110d" }}>{bookTitle}</div>
              {bookAuthor && <div style={{ fontSize: "0.82rem", color: "#7a6f5c" }}>{bookAuthor}</div>}
              {bookOverallRating && (
                <div style={{ fontSize: "0.85rem", color: "#b38238", marginTop: "4px" }}>
                  {"★".repeat(bookOverallRating)}{"☆".repeat(5 - bookOverallRating)}
                </div>
              )}
            </div>
          </div>
          {bookOverallRating && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem", color: "#7a6f5c", marginBottom: bookFavQuote ? "10px" : 0 }}>
              {bookRatingWriting != null && <span>Writing {"★".repeat(bookRatingWriting)}{"☆".repeat(5 - bookRatingWriting)}</span>}
              {bookRatingStory != null && <span>Story {"★".repeat(bookRatingStory)}{"☆".repeat(5 - bookRatingStory)}</span>}
              {bookRatingCharacters != null && <span>Characters {"★".repeat(bookRatingCharacters)}{"☆".repeat(5 - bookRatingCharacters)}</span>}
              {bookRatingPacing != null && <span>Pacing {"★".repeat(bookRatingPacing)}{"☆".repeat(5 - bookRatingPacing)}</span>}
            </div>
          )}
          {bookFavQuote && (
            <blockquote style={{ margin: "8px 0 0", padding: "0 0 0 10px", borderLeft: "2px solid var(--ochre,#7a241c)", fontSize: "0.85rem", color: "#5a4f3c", fontStyle: "italic", lineHeight: 1.5 }}>
              "{bookFavQuote}"
            </blockquote>
          )}
          {bookGenres && bookGenres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              {bookGenres.map(g => <span key={g} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#7a6f5c", background: "rgba(20,17,13,0.06)", padding: "2px 8px", borderRadius: "9999px" }}>{g}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Film review */}
      {templateType === "film-review" && filmTitle && (
        <div style={{ background: "#f8f6f2", border: "1px solid rgba(20,17,13,0.08)", borderRadius: "var(--radius-xl,12px)", padding: "14px", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
            {filmCoverUrl && (
              <img src={filmCoverUrl} alt={filmTitle} style={{ width: 54, height: 80, borderRadius: "var(--radius-md,4px)", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#14110d" }}>{filmTitle}</div>
              {filmDirector && <div style={{ fontSize: "0.82rem", color: "#7a6f5c" }}>Dir. {filmDirector}</div>}
              {filmOverallRating && (
                <div style={{ fontSize: "0.85rem", color: "#b38238", marginTop: "4px" }}>
                  {"★".repeat(filmOverallRating)}{"☆".repeat(5 - filmOverallRating)}
                </div>
              )}
            </div>
          </div>
          {filmOverallRating && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem", color: "#7a6f5c", marginBottom: filmFavLine ? "10px" : 0 }}>
              {filmRatingStory != null && <span>Story {"★".repeat(filmRatingStory)}{"☆".repeat(5 - filmRatingStory)}</span>}
              {filmRatingActing != null && <span>Acting {"★".repeat(filmRatingActing)}{"☆".repeat(5 - filmRatingActing)}</span>}
              {filmRatingVisuals != null && <span>Visuals {"★".repeat(filmRatingVisuals)}{"☆".repeat(5 - filmRatingVisuals)}</span>}
              {filmRatingPacing != null && <span>Pacing {"★".repeat(filmRatingPacing)}{"☆".repeat(5 - filmRatingPacing)}</span>}
            </div>
          )}
          {filmFavLine && (
            <blockquote style={{ margin: "8px 0 0", padding: "0 0 0 10px", borderLeft: "2px solid var(--ochre,#7a241c)", fontSize: "0.85rem", color: "#5a4f3c", fontStyle: "italic", lineHeight: 1.5 }}>
              "{filmFavLine}"
            </blockquote>
          )}
          {filmGenres && filmGenres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
              {filmGenres.map(g => <span key={g} style={{ fontSize: "0.68rem", fontWeight: 600, color: "#7a6f5c", background: "rgba(20,17,13,0.06)", padding: "2px 8px", borderRadius: "9999px" }}>{g}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Poll */}
      {templateType === "poll" && pollOptions && (
        <PollDisplay postId={wpId} options={pollOptions} expiresAt={pollExpiresAt} />
      )}

      {/* Gallery */}
      {galleryImages && galleryImages.length >= 1 && (
        <div style={{ borderRadius: "var(--radius-xl, 12px)", overflow: "hidden", border: "1px solid #e8e2d8", marginBottom: "1rem" }}>
          <div className="hide-scrollbar" style={{ display: "flex", gap: "2px", overflowX: "auto" }}>
            {galleryImages.map((img, i) => (
              <img key={i} src={img} alt="" style={{ height: "240px", objectFit: "cover", flexShrink: 0 }} loading="lazy" />
            ))}
          </div>
        </div>
      )}

      {/* Video embed */}
      {ytUrl && (
        <div style={{ marginBottom: "1rem" }}>
          {ytUrl.includes("youtube.com") || ytUrl.includes("youtu.be") ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]+)/)?.[1] ?? ""}`}
              style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "var(--radius-xl, 12px)" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media"
              allowFullScreen
            />
          ) : (
            <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#b38238", fontSize: "0.88rem" }}>Watch video →</a>
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

      {/* Link preview (community_link_url) — skip when we already have a YouTube embed */}
      {sourceUrl && !ytUrl && (
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

      {/* Reactions — noBorder: ReactionBar draws its own top border; no double line */}
      <div style={{ marginTop: "0.5rem" }}>
        <ReactionBar
          itemId={wpId}
          itemType="community"
          initialCounts={initialReactions}
          shareUrl={shareUrl}
          flagSlot={
            reportState === "idle" ? (
              <button
                onClick={(e) => { e.stopPropagation(); setReportState("confirm"); }}
                title="Report this post"
                style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--mute, #7a6f5c)", lineHeight: 1 }}
              >
                <Flag size={13} strokeWidth={1.8} />
              </button>
            ) : reportState === "sent" ? (
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--mute, #7a6f5c)", whiteSpace: "nowrap" }}>Reported ✓</span>
            ) : reportState === "error" ? (
              <span style={{ fontSize: "0.62rem", color: "#c62828", whiteSpace: "nowrap" }}>Couldn't send.</span>
            ) : null
          }
        />
      </div>

      {/* Comments */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
          fontSize: "0.88rem", fontWeight: 700, color: "#14110d",
          marginBottom: "1rem", paddingBottom: "0.65rem", borderBottom: "1px solid rgba(20,17,13,0.08)",
          display: "flex", alignItems: "center", gap: "0.4rem",
          letterSpacing: "0.01em",
        }}>
          <span style={{ fontSize: "1rem", lineHeight: 1 }}>💬</span>
          {count === 0 ? "Discussion Replies" : `Discussion Replies (${count})`}
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
            background: "#fff", border: "1px solid rgba(20,17,13,0.1)", borderRadius: "12px", padding: "1rem",
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
              placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Share your thoughts…"}
              rows={3}
              style={{
                width: "100%", background: "#f8f6f2", border: "1px solid rgba(20,17,13,0.08)",
                borderRadius: "12px", color: "#14110d",
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
                fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical",
                outline: "none", padding: "0.75rem 1rem", boxSizing: "border-box",
              }}
            />
            {error && <p style={{ color: "#7a241c", fontSize: "0.78rem", margin: "0.4rem 0 0" }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.65rem" }}>
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                style={{
                  background: commentText.trim() && !submitting ? "var(--ochre, #7a241c)" : "#e8e2d8",
                  color: commentText.trim() && !submitting ? "#fff" : "#aaa",
                  border: "none", borderRadius: "8px", padding: "0.5rem 1.1rem",
                  fontSize: "0.85rem", fontWeight: 600,
                  cursor: commentText.trim() && !submitting ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
              >
                {submitting ? "Posting…" : "Post Reply"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
            style={{
              width: "100%", background: "#f8f6f2",
              border: "1px solid rgba(20,17,13,0.1)",
              borderRadius: "12px", padding: "1rem", color: "#7a6f5c",
              fontSize: "0.9rem", textAlign: "center", cursor: "pointer",
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
            }}
          >
            Sign in to join the conversation…
          </button>
        )}
      </div>
    </div>

    {/* Report bottom sheet */}
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
          <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink, #14110d)", textAlign: "center", letterSpacing: "0.02em" }}>Report this post</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(["spam", "harassment", "inappropriate"] as const).map((r) => (
              <button
                key={r}
                onClick={() => submitReport(r)}
                style={{
                  width: "100%", padding: "0.75rem 1rem",
                  background: "#fff", border: "1px solid var(--rule, #e8e2d8)",
                  borderRadius: "var(--radius-lg, 6px)", cursor: "pointer",
                  textAlign: "left", fontSize: "0.88rem", color: "var(--ink, #14110d)",
                  fontFamily: "inherit", fontWeight: 500,
                  textTransform: "capitalize",
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
                fontSize: "0.85rem", color: "var(--mute, #7a6f5c)",
                fontFamily: "inherit", fontWeight: 600,
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
                onClick={() => { setOwnerMenuOpen(false); setEditText(text); setEditOpen(true); }}
                style={{ width: "100%", padding: "0.8rem 1rem", background: "#fff", border: "1px solid #e0d8ce", borderRadius: "6px", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "#14110d", fontFamily: "inherit", fontWeight: 500 }}
              >
                Edit post
              </button>
            )}
            <button
              onClick={() => { setOwnerMenuOpen(false); setDeleteConfirm(true); }}
              style={{ width: "100%", padding: "0.8rem 1rem", background: "#fff", border: "1px solid #e0d8ce", borderRadius: "6px", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "#c62828", fontFamily: "inherit", fontWeight: 500 }}
            >
              Delete post
            </button>
            <button
              onClick={() => setOwnerMenuOpen(false)}
              style={{ width: "100%", marginTop: "0.25rem", padding: "0.75rem 1rem", background: "transparent", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", color: "#7a6f5c", fontFamily: "inherit", fontWeight: 600 }}
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
          <p style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", fontWeight: 700, color: "#14110d", textAlign: "center" }}>Delete this post?</p>
          <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "#7a6f5c", textAlign: "center" }}>This cannot be undone.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button onClick={handleDelete} disabled={deleting} style={{ width: "100%", padding: "0.8rem 1rem", background: "#c62828", border: "none", borderRadius: "6px", cursor: deleting ? "default" : "pointer", fontSize: "0.88rem", color: "#fff", fontFamily: "inherit", fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button onClick={() => setDeleteConfirm(false)} disabled={deleting} style={{ width: "100%", padding: "0.75rem 1rem", background: "transparent", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", color: "#7a6f5c", fontFamily: "inherit", fontWeight: 600 }}>
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
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#14110d", textAlign: "center" }}>Edit post</p>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value.slice(0, 2000))}
            rows={6}
            style={{ width: "100%", background: "#f8f6f2", border: "1px solid #e0d8ce", borderRadius: "4px", color: "#14110d", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical", outline: "none", padding: "0.75rem 1rem", boxSizing: "border-box" }}
          />
          {editError && <p style={{ color: "#7a241c", fontSize: "0.78rem", margin: "0.4rem 0 0" }}>{editError}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button onClick={() => setEditOpen(false)} disabled={editing} style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid #e0d8ce", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", color: "#7a6f5c", fontFamily: "inherit", fontWeight: 600 }}>
              Cancel
            </button>
            <button onClick={handleEdit} disabled={editing || !editText.trim()} style={{ flex: 2, padding: "0.75rem", background: "#7a241c", border: "none", borderRadius: "6px", cursor: editing || !editText.trim() ? "default" : "pointer", fontSize: "0.88rem", color: "#fff", fontFamily: "inherit", fontWeight: 600, opacity: editing || !editText.trim() ? 0.6 : 1 }}>
              {editing ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
}
