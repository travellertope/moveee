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
  background: "var(--paper-deep, #f8f6f2)",
  border: "1px solid rgba(20,17,13,0.08)",
  borderRadius: "12px",
  color: "var(--ink, #14110d)",
  fontSize: "0.9rem",
  padding: "0.75rem 1rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  lineHeight: 1.6,
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
          {comments.map((c) => {
            const avatarUrl = c.author_avatar_urls?.["48"] ?? c.author_avatar_urls?.["24"] ?? null;
            const initials = c.author_name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
            return (
              <div key={c.id} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                {/* Commenter avatar */}
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: "var(--cat-community-bg, #e8e2d8)",
                  color: "var(--cat-community-fg, #5a4a3a)",
                  fontSize: "0.58rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", marginTop: "2px",
                }}>
                  {avatarUrl && !avatarUrl.includes("gravatar.com/avatar/00000000") ? (
                    <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initials
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", marginBottom: "0.2rem" }}>
                    <span style={{ color: "var(--gold, #b38238)", fontSize: "0.8rem", fontWeight: 600 }}>
                      {c.author_name}
                    </span>
                    <span style={{ color: "var(--mute, #bbb)", fontSize: "0.68rem" }}>
                      {formatCommentDate(c.date)}
                    </span>
                  </div>
                  <p style={{ color: "var(--ink-soft, #3a342b)", fontSize: "0.84rem", lineHeight: 1.6, margin: 0 }}>
                    {stripHtml(c.content?.rendered ?? "")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auth states */}
      {authStatus === "loading" && (
        <p style={{ color: "var(--mute, #bbb)", fontSize: "0.82rem" }}>Loading…</p>
      )}

      {authStatus === "unauthenticated" && (
        <button
          onClick={() => signIn()}
          style={{
            width: "100%",
            background: "var(--paper-deep, #f8f6f2)",
            border: "1px solid rgba(20,17,13,0.1)",
            borderRadius: "12px",
            padding: "1rem",
            color: "var(--mute, #7a6f5c)",
            fontSize: "0.9rem",
            textAlign: "center",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sign in to join the conversation…
        </button>
      )}

      {/* Comment form */}
      {authStatus === "authenticated" && (
        <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
          {/* Current user avatar */}
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
            background: "var(--cat-community-bg, #e8e2d8)",
            color: "var(--cat-community-fg, #5a4a3a)",
            fontSize: "0.58rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", marginTop: "2px",
          }}>
            {session?.user?.image ? (
              <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (session?.user?.name ?? session?.user?.email ?? "?").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?"
            )}
          </div>
        <form onSubmit={handleSubmit} style={{
          flex: 1,
          minWidth: 0,
          background: "var(--paper, #fff)",
          border: "1px solid rgba(20,17,13,0.1)",
          borderRadius: "12px",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.65rem",
        }}>
          <span style={{ color: "var(--mute, #7a6f5c)", fontSize: "0.75rem" }}>
            Commenting as{" "}
            <span style={{ color: "var(--ochre, #7a241c)", fontWeight: 600 }}>
              {session?.user?.name ?? session?.user?.email}
            </span>
          </span>

          <textarea
            id="pulse-comment"
            required
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            minLength={3}
            maxLength={1000}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Share your thoughts…"
          />

          {status === "success" && (
            <p style={{ color: "var(--success, #2e7d32)", fontSize: "0.82rem", margin: 0 }}>Comment posted. Thank you!</p>
          )}
          {status === "moderation" && (
            <p style={{ color: "var(--gold, #b38238)", fontSize: "0.82rem", margin: 0 }}>
              Your comment is awaiting moderation.
            </p>
          )}
          {status === "error" && (
            <p style={{ color: "var(--ochre, #7a241c)", fontSize: "0.78rem", margin: 0 }}>{errorMsg}</p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              style={{
                background: content.trim() && !submitting ? "var(--ochre, #7a241c)" : "#e8e2d8",
                color: content.trim() && !submitting ? "#fff" : "#aaa",
                border: "none",
                borderRadius: "8px",
                padding: "0.5rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: content.trim() && !submitting ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              {submitting ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </form>
        </div>
      )}
    </section>
  );
}
