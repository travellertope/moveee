"use client";

import { useState } from "react";
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

export default function CommentThread({ postId, initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<WpComment[]>(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [honeypot, setHoneypot] = useState(""); // never shown to users
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "moderation" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/pulse/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: name,
          authorEmail: email,
          content,
          website: honeypot, // honeypot field
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

      setName("");
      setEmail("");
      setContent("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="comments"
      style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #1e1e1e" }}
    >
      <h2
        style={{
          color: "#f0ece4",
          fontFamily: "var(--font-fraunces), serif",
          fontSize: "1.15rem",
          fontWeight: 600,
          marginBottom: "1.75rem",
        }}
      >
        {comments.length > 0
          ? `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`
          : "Start the conversation"}
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div style={{ marginBottom: "2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                borderLeft: "2px solid #2a2a2a",
                paddingLeft: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "baseline",
                  marginBottom: "0.4rem",
                }}
              >
                <span style={{ color: "#D4A847", fontSize: "0.82rem", fontWeight: 600 }}>
                  {c.author_name}
                </span>
                <span style={{ color: "#555", fontSize: "0.72rem" }}>
                  {formatCommentDate(c.date)}
                </span>
              </div>
              <p style={{ color: "#aaa", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                {stripHtml(c.content?.rendered ?? "")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Submit form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3
          style={{
            color: "#888",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Leave a comment
        </h3>

        {/* Honeypot — visually hidden */}
        <div style={{ display: "none" }} aria-hidden>
          <label htmlFor="pulse-website">Website</label>
          <input
            id="pulse-website"
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label
              htmlFor="pulse-name"
              style={{ display: "block", color: "#666", fontSize: "0.72rem", marginBottom: "0.3rem" }}
            >
              Name <span style={{ color: "#D4A847" }}>*</span>
            </label>
            <input
              id="pulse-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              style={inputStyle}
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              htmlFor="pulse-email"
              style={{ display: "block", color: "#666", fontSize: "0.72rem", marginBottom: "0.3rem" }}
            >
              Email <span style={{ color: "#D4A847" }}>*</span>
            </label>
            <input
              id="pulse-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="your@email.com"
            />
            <p style={{ color: "#444", fontSize: "0.65rem", marginTop: "0.25rem" }}>
              Not displayed publicly
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="pulse-comment"
            style={{ display: "block", color: "#666", fontSize: "0.72rem", marginBottom: "0.3rem" }}
          >
            Comment <span style={{ color: "#D4A847" }}>*</span>
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
          <p style={{ color: "#444", fontSize: "0.65rem", marginTop: "0.25rem", textAlign: "right" }}>
            {content.length}/1000
          </p>
        </div>

        {/* Status messages */}
        {status === "success" && (
          <p style={{ color: "#4caf77", fontSize: "0.82rem" }}>Comment posted. Thank you!</p>
        )}
        {status === "moderation" && (
          <p style={{ color: "#D4A847", fontSize: "0.82rem" }}>
            Your comment is awaiting moderation. It will appear once approved.
          </p>
        )}
        {status === "error" && (
          <p style={{ color: "#e05a4e", fontSize: "0.82rem" }}>{errorMsg}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? "#2a2a2a" : "#D4A847",
              color: submitting ? "#666" : "#0d0d0d",
              border: "none",
              padding: "0.65rem 1.75rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
              borderRadius: "2px",
              transition: "all 0.15s",
            }}
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#141414",
  border: "1px solid #2a2a2a",
  borderRadius: "2px",
  color: "#e0dcd4",
  fontSize: "0.85rem",
  padding: "0.55rem 0.75rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
