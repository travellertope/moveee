"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { parseHashtags } from "@/lib/hashtags";

const TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"] as const;

function HashtagPreview({ text }: { text: string }) {
  const tags = useMemo(() => parseHashtags(text), [text]);
  if (!tags.length) return null;
  return (
    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            color: "#D4A847",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
type Tag = (typeof TAGS)[number];

interface SubmitPostProps {
  onPosted?: (item: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null }) => void;
}

export default function SubmitPost({ onPosted }: SubmitPostProps) {
  const { data: session, status } = useSession();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tag, setTag] = useState<Tag | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showImageField, setShowImageField] = useState(false);

  const user = session?.user as any;
  const loggedIn = status === "authenticated";
  const MAX = 500;
  const remaining = MAX - text.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/community/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          imageUrl: imageUrl.trim() || undefined,
          tag: tag || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      onPosted?.({
        id: data.id,
        text: text.trim(),
        authorName: user?.name ?? user?.displayName ?? "Community Member",
        tag: tag || null,
        imageUrl: imageUrl.trim() || null,
      });

      setText("");
      setImageUrl("");
      setTag("");
      setShowImageField(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  if (!loggedIn) {
    return (
      <div
        style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#2a2a2a",
            border: "1px solid #333",
            flexShrink: 0,
          }}
        />
        <button
          onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
          style={{
            flex: 1,
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "20px",
            padding: "0.65rem 1rem",
            color: "#555",
            fontSize: "0.85rem",
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "var(--font-fraunces), serif",
          }}
        >
          What&apos;s happening in culture? Sign in to share.
        </button>
      </div>
    );
  }

  const initials = (user?.name ?? user?.displayName ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderBottom: "1px solid #1e1e1e",
        padding: "1.25rem 1.5rem",
        display: "flex",
        gap: "0.85rem",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "#2a2000",
          border: "1px solid #D4A847",
          color: "#D4A847",
          fontSize: "0.7rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          letterSpacing: "0.05em",
        }}
      >
        {initials}
      </div>

      {/* Input area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          placeholder="What's happening in culture?"
          rows={3}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #2a2a2a",
            color: "#f0ece4",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "0.95rem",
            lineHeight: 1.55,
            resize: "none",
            width: "100%",
            outline: "none",
            paddingBottom: "0.5rem",
          }}
        />

        {/* Live hashtag preview */}
        <HashtagPreview text={text} />

        {/* Image URL field — optional */}
        {showImageField && (
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: "2px",
              color: "#ccc",
              fontSize: "0.8rem",
              padding: "0.4rem 0.7rem",
              outline: "none",
              width: "100%",
            }}
          />
        )}

        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Tag selector */}
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value as Tag | "")}
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: "2px",
              color: tag ? "#D4A847" : "#555",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "0.3rem 0.6rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Tag</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Image toggle */}
          <button
            type="button"
            onClick={() => setShowImageField((v) => !v)}
            title="Add image URL"
            style={{
              background: showImageField ? "#2a2000" : "transparent",
              border: `1px solid ${showImageField ? "#D4A847" : "#2a2a2a"}`,
              borderRadius: "2px",
              color: showImageField ? "#D4A847" : "#555",
              fontSize: "0.72rem",
              padding: "0.3rem 0.6rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Image
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Char counter */}
          <span
            style={{
              fontSize: "0.7rem",
              color: remaining < 50 ? (remaining < 0 ? "#e05d44" : "#D4A847") : "#444",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {remaining}
          </span>

          {/* Submit */}
          <button
            type="submit"
            disabled={!text.trim() || loading || remaining < 0}
            style={{
              background: text.trim() && !loading && remaining >= 0 ? "#c93c2a" : "#2a2a2a",
              color: text.trim() && !loading && remaining >= 0 ? "#fff" : "#555",
              border: "none",
              borderRadius: "2px",
              padding: "0.35rem 1rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: text.trim() && !loading ? "pointer" : "default",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Posting…" : "Post"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#e05d44", fontSize: "0.78rem", margin: 0 }}>{error}</p>
        )}
      </div>
    </form>
  );
}
