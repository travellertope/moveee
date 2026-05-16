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
      {tags.map(tag => (
        <span key={tag} style={{ color: "#b38238", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.04em" }}>
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
        body: JSON.stringify({ text: text.trim(), imageUrl: imageUrl.trim() || undefined, tag: tag || undefined }),
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
      setText(""); setImageUrl(""); setTag(""); setShowImageField(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  if (!loggedIn) {
    return (
      <div style={{
        borderBottom: "1px solid #e8e2d8",
        padding: "0.9rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "#fff",
      }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "50%",
          background: "#f0ece4", border: "1px solid #e0d8ce", flexShrink: 0,
        }} />
        <button
          onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
          style={{
            flex: 1,
            background: "#f7f5f2",
            border: "1px solid #e0d8ce",
            borderRadius: "20px",
            padding: "0.6rem 1rem",
            color: "#7a6f5c",
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
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderBottom: "1px solid #e8e2d8",
        padding: "0.9rem 1.25rem",
        display: "flex",
        gap: "0.75rem",
        background: "#fff",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: "34px", height: "34px", borderRadius: "50%",
        background: "#fff0eb", border: "1.5px solid #c5491f",
        color: "#c5491f", fontSize: "0.65rem", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, letterSpacing: "0.05em",
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          placeholder="What's happening in culture?"
          rows={3}
          style={{
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #e0d8ce",
            color: "#14110d",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "0.92rem",
            lineHeight: 1.55,
            resize: "none",
            width: "100%",
            outline: "none",
            paddingBottom: "0.4rem",
          }}
        />

        <HashtagPreview text={text} />

        {showImageField && (
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            style={{
              background: "#f7f5f2",
              border: "1px solid #e0d8ce",
              borderRadius: "2px",
              color: "#3a342b",
              fontSize: "0.8rem",
              padding: "0.4rem 0.7rem",
              outline: "none",
              width: "100%",
            }}
          />
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            value={tag}
            onChange={e => setTag(e.target.value as Tag | "")}
            style={{
              background: "#f7f5f2",
              border: "1px solid #e0d8ce",
              borderRadius: "2px",
              color: tag ? "#c5491f" : "#7a6f5c",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "0.28rem 0.55rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Tag</option>
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            type="button"
            onClick={() => setShowImageField(v => !v)}
            title="Add image URL"
            style={{
              background: showImageField ? "#fff0eb" : "transparent",
              border: `1px solid ${showImageField ? "#c5491f" : "#e0d8ce"}`,
              borderRadius: "2px",
              color: showImageField ? "#c5491f" : "#7a6f5c",
              fontSize: "0.72rem",
              padding: "0.28rem 0.55rem",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Image
          </button>

          <div style={{ flex: 1 }} />

          <span style={{
            fontSize: "0.7rem",
            color: remaining < 50 ? (remaining < 0 ? "#c5491f" : "#b38238") : "#bbb",
            fontVariantNumeric: "tabular-nums",
          }}>
            {remaining}
          </span>

          <button
            type="submit"
            disabled={!text.trim() || loading || remaining < 0}
            style={{
              background: text.trim() && !loading && remaining >= 0 ? "#c93c2a" : "#e8e2d8",
              color: text.trim() && !loading && remaining >= 0 ? "#fff" : "#aaa",
              border: "none",
              borderRadius: "2px",
              padding: "0.32rem 0.9rem",
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

        {error && <p style={{ color: "#c5491f", fontSize: "0.78rem", margin: 0 }}>{error}</p>}
      </div>
    </form>
  );
}
