"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import HashtagText from "@/components/pulse/HashtagText";
import ReactionBar from "@/components/pulse/ReactionBar";
import type { WpComment } from "@/lib/community-wordpress";

interface Props {
  text: string;
  hashtags: string[];
  wpId: string;
  postId: number;
  initialReactions: { love: number; fire: number; clap: number };
  shareUrl: string;
  initialComments: WpComment[];
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

  const handleHashtagClick = (hashtag: string) => {
    router.push(`/pulse?hashtag=${encodeURIComponent(hashtag.replace(/^#/, ""))}`);
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
      {/* Post text */}
      <p style={{
        color: "#14110d",
        fontFamily: "var(--font-fraunces), serif",
        fontSize: "1.1rem",
        lineHeight: 1.7,
        margin: "0 0 1.25rem",
        whiteSpace: "pre-wrap",
      }}>
        <HashtagText text={text} onHashtagClick={handleHashtagClick} />
      </p>

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
                width: "100%", background: "#f7f5f2", border: "1px solid #e0d8ce",
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
