"use client";

import { useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { parseHashtags } from "@/lib/hashtags";

const TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"] as const;
type Tag = (typeof TAGS)[number];

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

interface SubmitPostProps {
  onPosted?: (item: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null }) => void;
}

export default function SubmitPost({ onPosted }: SubmitPostProps) {
  const { data: session, status } = useSession();
  const [text, setText] = useState("");
  const [tag, setTag] = useState<Tag | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user as any;
  const loggedIn = status === "authenticated";
  const MAX = 500;
  const remaining = MAX - text.length;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      // Upload image first if one was selected
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/community/upload-image", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Image upload failed");
        imageUrl = uploadData.url;
        setUploading(false);
      }

      const res = await fetch("/api/community/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), imageUrl, tag: tag || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      onPosted?.({
        id: data.id,
        text: text.trim(),
        authorName: user?.name ?? user?.displayName ?? "Community Member",
        tag: tag || null,
        imageUrl: imageUrl ?? null,
      });
      setText(""); setTag(""); removeImage();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setUploading(false);
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

        {/* Image preview */}
        {imagePreview && (
          <div style={{ position: "relative", display: "inline-block", maxWidth: "200px" }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: "100%", borderRadius: "4px", border: "1px solid #e0d8ce", display: "block" }}
            />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              style={{
                position: "absolute", top: "4px", right: "4px",
                background: "rgba(20,17,13,0.65)", border: "none",
                borderRadius: "50%", width: "20px", height: "20px",
                color: "#fff", fontSize: "0.7rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

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

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            style={{
              background: imageFile ? "#fff0eb" : "transparent",
              border: `1px solid ${imageFile ? "#c5491f" : "#e0d8ce"}`,
              borderRadius: "2px",
              color: imageFile ? "#c5491f" : "#7a6f5c",
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
            {imageFile ? "Change" : "Image"}
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
            {uploading ? "Uploading…" : loading ? "Posting…" : "Post"}
          </button>
        </div>

        {error && <p style={{ color: "#c5491f", fontSize: "0.78rem", margin: 0 }}>{error}</p>}
      </div>
    </form>
  );
}
