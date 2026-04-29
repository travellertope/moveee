"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import InteractiveParagraph from "./InteractiveParagraph";

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
}

interface CommentsByParagraph {
  [key: number]: Comment[];
}

interface ParagraphCommentSystemProps {
  postId: number;
  content: string;
}

export default function ParagraphCommentSystem({ postId, content }: ParagraphCommentSystemProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentsByParagraph>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeParagraph, setActiveParagraph] = useState<{ index: number; text: string } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all paragraph comments for this post
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/paragraph?post_id=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data || {});
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleOpenComments = (index: number, text: string) => {
    setActiveParagraph({ index, text });
    setIsSidebarOpen(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !activeParagraph || !newComment.trim() || isSubmitting) return;

    console.log("Submitting paragraph comment:", {
      postId,
      paragraphIdx: activeParagraph.index,
      content: newComment
    });

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments/paragraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          paragraph_idx: activeParagraph.index,
          content: newComment,
        }),
      });

      const data = await res.json();
      console.log("Paragraph comment response:", data);

      if (res.ok) {
        const savedComment = data.comment;
        
        // Update local state
        setComments(prev => ({
          ...prev,
          [activeParagraph.index]: [...(prev[activeParagraph.index] || []), savedComment]
        }));
        setNewComment("");
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
      alert("An error occurred while posting your comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Parse HTML content into paragraphs
  // This is a simple parser that looks for <p> tags and wraps them.
  // For more complex HTML, a library like html-react-parser would be better.
  const parseContent = (html: string) => {
    if (!html) return null;

    // Split by </p> case-insensitively and filter empty strings
    const parts = html.split(/<\/p>/i);
    let pCounter = 0;

    return parts.map((part, index) => {
      if (!part.trim()) return null;
      
      // Re-add the opening tag if it was missing or just use the text
      const cleanPart = part.replace(/^<p[^>]*>/, "").trim();
      if (!cleanPart) return null;

      const currentIdx = pCounter++;
      const commentCount = comments[currentIdx]?.length || 0;

      return (
        <InteractiveParagraph
          key={currentIdx}
          index={currentIdx}
          htmlContent={cleanPart}
          commentCount={commentCount}
          isFirst={currentIdx === 0}
          isActive={activeParagraph?.index === currentIdx && isSidebarOpen}
          onOpenComments={handleOpenComments}
        />
      );
    });
  };

  // Build a flat chronological list of all comments with their paragraph context.
  const allComments = Object.entries(comments)
    .flatMap(([idxStr, list]) =>
      list.map((c) => ({ ...c, paragraphIdx: Number(idxStr) }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Extract plain-text snippets per paragraph index for the thread labels.
  const paragraphSnippets: Record<number, string> = {};
  (() => {
    const parts = content.split(/<\/p>/i);
    let i = 0;
    for (const part of parts) {
      const text = part.replace(/<[^>]+>/g, "").trim();
      if (text) { paragraphSnippets[i] = text.slice(0, 80) + (text.length > 80 ? "…" : ""); i++; }
    }
  })();

  return (
    <div className="paragraph-comment-system">
      <div className="prose-content">
        {parseContent(content)}
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`comment-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`comment-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="comment-sidebar-header">
          <h3>Commentary</h3>
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="comment-sidebar-content">
          {activeParagraph && (
            <>
              <div className="p-context">
                "{activeParagraph.text.length > 120 ? activeParagraph.text.slice(0, 120) + "..." : activeParagraph.text}"
              </div>

              <div className="comments-list">
                {isLoading ? (
                  <div className="no-comments">Loading discussion...</div>
                ) : (comments[activeParagraph.index]?.length || 0) > 0 ? (
                  comments[activeParagraph.index].map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-meta">
                        <span className="comment-author">{c.author}</span>
                        <span className="comment-date">
                          {new Date(c.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="comment-body" dangerouslySetInnerHTML={{ __html: c.content }} />
                    </div>
                  ))
                ) : (
                  <div className="no-comments">
                    No comments yet. Be the first to start the conversation on this section.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="comment-sidebar-footer">
          {session ? (
            <form onSubmit={handleSubmitComment} className="comment-input-area">
              <textarea
                className="comment-textarea"
                placeholder="Share your thoughts on this section..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
              <button 
                type="submit" 
                className="submit-comment-btn"
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {isSubmitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          ) : (
            <div className="login-to-comment">
              Please <button onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))} style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--ochre)', cursor: 'pointer', fontWeight: 700 }}>sign in</button> to join the discussion.
            </div>
          )}
        </div>
      </aside>

      {/* Collated comment thread */}
      <section className="collated-comments">
        <h2 className="collated-comments-heading">
          {allComments.length > 0
            ? `${allComments.length} Comment${allComments.length !== 1 ? "s" : ""}`
            : "Start the conversation"}
        </h2>

        {allComments.length > 0 ? (
          <div className="collated-comments-list">
            {allComments.map((c) => (
              <div key={`${c.paragraphIdx}-${c.id}`} className="collated-comment-item">
                <div className="collated-comment-meta">
                  <span className="collated-comment-author">{c.author}</span>
                  <span className="collated-comment-date">
                    {new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {paragraphSnippets[c.paragraphIdx] && (
                  <button
                    className="collated-comment-ref"
                    onClick={() => handleOpenComments(c.paragraphIdx, paragraphSnippets[c.paragraphIdx])}
                  >
                    On: "{paragraphSnippets[c.paragraphIdx]}"
                  </button>
                )}
                <div className="collated-comment-body" dangerouslySetInnerHTML={{ __html: c.content }} />
              </div>
            ))}
          </div>
        ) : (
          <p className="collated-comments-empty">
            Click any paragraph above to leave a comment.
          </p>
        )}
      </section>
    </div>
  );
}
