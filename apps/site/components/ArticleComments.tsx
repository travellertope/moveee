"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { sanitizeHtml } from "@/lib/sanitize";

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
}

interface Props {
  postId: number;
  content: string;
}

export default function ArticleComments({ postId, content }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {}
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, content: newComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        setNewComment("");
        fetchComments();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Could not post comment. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <>
      <div
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />

      <section className="article-comments" id="comments">
        <h3 className="article-comments-heading">
          {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? "s" : ""}` : "Comments"}
        </h3>

        {session ? (
          <form className="article-comments-form" onSubmit={handleSubmit}>
            <textarea
              className="article-comments-textarea"
              placeholder="Share your thoughts…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={isSubmitting}
            />
            {error && <p className="article-comments-error">{error}</p>}
            {success && <p className="article-comments-success">Comment posted!</p>}
            <button
              type="submit"
              className="article-comments-submit"
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? "Posting…" : "Post comment"}
            </button>
          </form>
        ) : (
          <p className="article-comments-auth">
            <a href="/login">Sign in</a> to leave a comment.
          </p>
        )}

        {comments.length > 0 && (
          <ul className="article-comments-list">
            {comments.map((c) => (
              <li key={c.id} className="article-comment">
                <div className="article-comment-meta">
                  <span className="article-comment-author">{c.author}</span>
                  <span className="article-comment-date">{timeAgo(c.date)}</span>
                </div>
                <div
                  className="article-comment-body"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
                />
              </li>
            ))}
          </ul>
        )}

        {comments.length === 0 && (
          <p className="article-comments-empty">No comments yet. Be the first to share your thoughts.</p>
        )}
      </section>
    </>
  );
}
