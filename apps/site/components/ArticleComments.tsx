"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  /**
   * Optional — the magazine article page (app/magazine/[slug]/page.tsx)
   * now renders `.prose-content` itself, ahead of this component, so the
   * width-tier rail (editorial.css's `.ar-wrap`) can place inline Shop the
   * Edit / Culture Drop / Issue bands between the body and the comment
   * thread. The newsletter reader (app/newsletter/[slug]/page.tsx) still
   * passes `content` and relies on this component rendering it — keep that
   * path working rather than forcing every caller through the split.
   */
  content?: string;
}

function initial(name: string) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

export default function ArticleComments({ postId, content }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {}
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  useEffect(() => { autoGrow(); }, [newComment]);

  const resetComposer = () => {
    setNewComment("");
    setIsFocused(false);
    textareaRef.current?.blur();
  };

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
        resetComposer();
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

  const displayName = session?.user?.displayName || session?.user?.name || "You";
  const composerActive = isFocused || newComment.length > 0;

  return (
    <>
      {content && (
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      )}

      <section className="comments" id="comments">
        <div className="comments-head">
          <h3 className="comments-title">
            Comments
            {comments.length > 0 && <span className="comments-count">({comments.length})</span>}
          </h3>
        </div>

        {session ? (
          <form className="composer" onSubmit={handleSubmit}>
            <div className="composer-avatar" aria-hidden="true">{initial(displayName)}</div>
            <div className="composer-body">
              <div className={`composer-field${composerActive ? " is-active" : ""}`}>
                <textarea
                  ref={textareaRef}
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  rows={1}
                  maxLength={2000}
                  disabled={isSubmitting}
                />
              </div>
              {error && <p className="comments-error">{error}</p>}
              {success && <p className="comments-success">Comment posted!</p>}
              <div className={`composer-actions${composerActive ? " force-open" : ""}`}>
                <span className="composer-hint">
                  Commenting as <strong>{displayName}</strong>
                </span>
                <div className="composer-btns">
                  <button type="button" className="comment-btn-ghost" onClick={resetComposer} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="comment-btn-primary" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="signin-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0116 0v1" />
            </svg>
            <span><a href="/login">Sign in</a> to join the conversation.</span>
          </div>
        )}

        {comments.length > 0 ? (
          <div className="comment-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="c-avatar" aria-hidden="true">{initial(c.author)}</div>
                <div className="c-body">
                  <div className="c-meta">
                    <span className="c-author">{c.author}</span>
                    <span className="c-dot" aria-hidden="true" />
                    <span className="c-date">{timeAgo(c.date)}</span>
                  </div>
                  <div
                    className="c-text"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="comments-empty">No comments yet — be the first to share your thoughts.</p>
        )}
      </section>
    </>
  );
}
