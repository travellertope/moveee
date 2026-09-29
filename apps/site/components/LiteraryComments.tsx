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
  /** Whether the signed-in visitor's tier grants Literary comment access (Moveee Lit or Moveee Pro). */
  canComment: boolean;
}

function initial(name: string) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

// Literary-branded comment thread, gated to Moveee Lit / Moveee Pro — see
// hasLiteraryFullAccess on app/literary/[slug]/page.tsx, the same check
// every other Literary-only feature (full-piece access, the patron-only
// gate) already uses. This is a Literary-styled sibling of the shared
// ArticleComments.tsx (same /api/comments backend, same Comment shape),
// not a fork of its logic — kept separate because the gate/upsell states
// below (signed-out, wrong tier) don't exist on the Magazine version at
// all, and this section renders its own --lit-* design tokens, not
// editorial.css's `.ar-gate` family.
export default function LiteraryComments({ postId, canComment }: Props) {
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

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [newComment]);

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

  const displayName = session?.user?.name || "You";
  const composerActive = isFocused || newComment.length > 0;

  return (
    <section className="lit-comments" id="comments">
      <div className="lit-comments-head">
        <h3 className="lit-comments-title">
          Comments
          {comments.length > 0 && <span className="lit-comments-count">({comments.length})</span>}
        </h3>
      </div>

      {canComment ? (
        <form className="lit-composer" onSubmit={handleSubmit}>
          <div className="lit-composer-avatar" aria-hidden="true">
            {initial(displayName)}
          </div>
          <div className="lit-composer-body">
            <div className={`lit-composer-field${composerActive ? " is-active" : ""}`}>
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
            {error && <p className="lit-comments-error">{error}</p>}
            {success && <p className="lit-comments-success">Comment posted!</p>}
            <div className={`lit-composer-actions${composerActive ? " force-open" : ""}`}>
              <span className="lit-composer-hint">
                Commenting as <strong>{displayName}</strong>
              </span>
              <div className="lit-composer-btns">
                <button
                  type="button"
                  className="lit-comment-btn-ghost"
                  onClick={resetComposer}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lit-comment-btn-primary"
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : session ? (
        <div className="lit-comments-gate">
          <div className="lit-gate-eyebrow">★ Moveee Lit</div>
          <h4>Comments are for members.</h4>
          <p>
            Join the conversation on every piece in The Moveee Literary — Moveee Lit or Moveee Pro
            unlocks commenting, along with unmetered reading.
          </p>
          <a className="lit-btn-pill lit-btn-pill--fill" href="/register?upgrade=lit">
            Upgrade to Moveee Lit →
          </a>
        </div>
      ) : (
        <div className="lit-comments-gate">
          <div className="lit-gate-eyebrow">★ Moveee Lit</div>
          <h4>Sign in to comment.</h4>
          <p>
            Commenting on The Moveee Literary is a Moveee Lit (and Moveee Pro) benefit.{" "}
            <a href="/login">Sign in</a> if you already have an account.
          </p>
          <a className="lit-btn-pill lit-btn-pill--fill" href="/register?upgrade=lit">
            Upgrade to Moveee Lit →
          </a>
        </div>
      )}

      {comments.length > 0 ? (
        <div className="lit-comment-list">
          {comments.map((c) => (
            <div key={c.id} className="lit-comment-item">
              <div className="lit-c-avatar" aria-hidden="true">
                {initial(c.author)}
              </div>
              <div className="lit-c-body">
                <div className="lit-c-meta">
                  <span className="lit-c-author">{c.author}</span>
                  <span className="lit-c-dot" aria-hidden="true" />
                  <span className="lit-c-date">{timeAgo(c.date)}</span>
                </div>
                <div
                  className="lit-c-text"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(c.content) }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="lit-comments-empty">No comments yet — be the first to share your thoughts.</p>
      )}
    </section>
  );
}
