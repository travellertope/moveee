"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import type { WpComment } from "@/lib/pulse-wordpress";

function formatCommentDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

interface CommentThreadProps {
  postId: number;
  initialComments: WpComment[];
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--paper, #fff)",
  border: "1px solid var(--rule, #d8d0c6)",
  borderRadius: "4px",
  color: "var(--ink, #14110d)",
  fontSize: "0.85rem",
  padding: "0.6rem 0.75rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export default function CommentThread({ postId, initialComments }: CommentThreadProps) {
  const { data: session, status: authStatus } = useSession();
  const [comments, setComments] = useState<WpComment[]>(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "moderation" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

    setSubmitting(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/pulse/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: session.user.name ?? session.user.email,
          authorEmail: session.user.email,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      const newComment: WpComment = data.comment;

      if (newComment.status === "hold" || newComment.status === "unapproved") {
        setStatus("moderation");
      } else {
        setStatus("success");
        setComments((prev) => [...prev, newComment]);
      }

      setContent("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--rule, #e8e2d8)" }}>
      <h2 style={{
        color: "var(--ink, #14110d)",
        fontFamily: "var(--font-fraunces), serif",
        fontSize: "1rem",
        fontWeight: 600,
        marginBottom: "1.25rem",
      }}>
        {comments.length > 0
          ? `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`
          : "Start the conversation"}
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div style={{ marginBottom: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {comments.map((c) => (
            <div key={c.id} style={{ borderLeft: "2px solid var(--rule, #e8e2d8)", paddingLeft: "0.85rem" }}>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "baseline", marginBottom: "0.3rem" }}>
                <span style={{ color: "var(--gold, #b38238)", fontSize: "0.8rem", fontWeight: 600 }}>
                  {c.author_name}
                </span>
                <span style={{ color: "var(--mute, #bbb)", fontSize: "0.7rem" }}>
                  {formatCommentDate(c.date)}
                </span>
              </div>
              <p style={{ color: "var(--ink-soft, #3a342b)", fontSize: "0.84rem", lineHeight: 1.6, margin: 0 }}>
                {stripHtml(c.content?.rendered ?? "")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Auth states */}
      {authStatus === "loading" && (
        <p style={{ color: "var(--mute, #bbb)", fontSize: "0.82rem" }}>Loading…</p>
      )}

      {authStatus === "unauthenticated" && (
        <div style={{ background: "var(--paper-deep, #f2f2f2)", border: "1px solid var(--rule, #e8e2d8)", borderRadius: "6px", padding: "1.25rem", textAlign: "center" }}>
          <p style={{ color: "var(--mute, #7a6f5c)", fontSize: "0.84rem", marginBottom: "0.85rem" }}>
            Have something to say? Join the community — it's free.
          </p>
          <button
            onClick={() => signIn()}
            style={{
              background: "var(--ink, #14110d)",
              color: "var(--paper, #f3ece0)",
              border: "none",
              padding: "0.55rem 1.4rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: "3px",
            }}
          >
            Join free or sign in
          </button>
        </div>
      )}

      {/* Comment form */}
      {authStatus === "authenticated" && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <span style={{ color: "var(--mute, #7a6f5c)", fontSize: "0.72rem" }}>
            Commenting as{" "}
            <span style={{ color: "var(--gold, #b38238)", fontWeight: 600 }}>
              {session?.user?.name ?? session?.user?.email}
            </span>
          </span>

          <div>
            <label
              htmlFor="pulse-comment"
              style={{ display: "block", color: "var(--mute, #7a6f5c)", fontSize: "0.72rem", marginBottom: "0.3rem" }}
            >
              Comment <span style={{ color: "var(--gold, #b38238)" }}>*</span>
            </label>
            <textarea
              id="pulse-comment"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              minLength={3}
              maxLength={1000}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
              placeholder="Share your thoughts…"
            />
            <p style={{ color: "var(--mute, #bbb)", fontSize: "0.65rem", marginTop: "0.2rem", textAlign: "right" }}>
              {content.length}/1000
            </p>
          </div>

          {status === "success" && (
            <p style={{ color: "var(--success, #2e7d32)", fontSize: "0.82rem" }}>Comment posted. Thank you!</p>
          )}
          {status === "moderation" && (
            <p style={{ color: "var(--gold, #b38238)", fontSize: "0.82rem" }}>
              Your comment is awaiting moderation.
            </p>
          )}
          {status === "error" && (
            <p style={{ color: "var(--error, #c0392b)", fontSize: "0.82rem" }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: "flex-start",
              background: submitting ? "var(--rule, #e8e2d8)" : "var(--ink, #14110d)",
              color: submitting ? "var(--mute, #999)" : "var(--paper, #f3ece0)",
              border: "none",
              padding: "0.6rem 1.5rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
              borderRadius: "3px",
            }}
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}
    </section>
  );
}
