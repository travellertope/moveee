"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { parseHashtags } from "@/lib/hashtags";

const EDITION_TO_REGION: Record<string, string> = {
  uk:     "Diaspora UK",
  us:     "Diaspora US",
  africa: "Africa",
};

const COUNTRY_TO_REGION: Record<string, string> = {
  ng: "Africa", ghana: "Africa", ke: "Africa", za: "Africa",
  nigeria: "Africa", kenya: "Africa", "south africa": "Africa",
  ethiopia: "Africa", senegal: "Africa", cameroon: "Africa",
  gb: "Diaspora UK", uk: "Diaspora UK", "united kingdom": "Diaspora UK",
  us: "Diaspora US", "united states": "Diaspora US",
  fr: "Diaspora Europe", de: "Diaspora Europe", nl: "Diaspora Europe",
  france: "Diaspora Europe", germany: "Diaspora Europe", netherlands: "Diaspora Europe",
  belgium: "Diaspora Europe", italy: "Diaspora Europe", spain: "Diaspora Europe",
  jamaica: "Caribbean", trinidad: "Caribbean", barbados: "Caribbean",
  guyana: "Caribbean", haiti: "Caribbean",
};

function detectRegion(countryOfResidence?: string): string | null {
  if (typeof document !== "undefined") {
    const edition = document.cookie.split("; ")
      .find(r => r.startsWith("moveee_edition="))?.split("=")[1];
    if (edition && EDITION_TO_REGION[edition]) return EDITION_TO_REGION[edition];
  }
  if (countryOfResidence) {
    const key = countryOfResidence.toLowerCase().trim();
    return COUNTRY_TO_REGION[key] ?? null;
  }
  return null;
}

const TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"] as const;
type Tag = (typeof TAGS)[number];
type Mode = "post" | "quote";

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

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  background: "transparent",
  border: "none",
  borderBottom: active ? "2px solid #14110d" : "2px solid transparent",
  color: active ? "#14110d" : "#7a6f5c",
  fontSize: "0.72rem",
  fontWeight: active ? 700 : 400,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "0.3rem 0.1rem",
  cursor: "pointer",
  transition: "color 0.15s, border-color 0.15s",
});

interface SubmitPostProps {
  onPosted?: (item: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null; region: string | null }) => void;
  lockedTag?: string;
}

// ── Post mode ────────────────────────────────────────────────────────────────
function PostForm({ user, onPosted, lockedTag }: { user: any; onPosted?: SubmitPostProps["onPosted"]; lockedTag?: string }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState<Tag | "">(lockedTag as Tag ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        body: JSON.stringify({
          text: text.trim(),
          imageUrl,
          tag: tag || undefined,
          region: detectRegion(user?.countryOfResidence) ?? undefined,
          authorTier: user?.tier ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      const region = detectRegion(user?.countryOfResidence);
      onPosted?.({
        id: data.id,
        text: text.trim(),
        authorName: user?.name ?? user?.displayName ?? "Community Member",
        tag: tag || null,
        imageUrl: imageUrl ?? null,
        region,
      });
      setText(""); setTag(""); removeImage();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX))}
        placeholder="What's happening in culture?"
        rows={3}
        style={{
          background: "transparent", border: "none", borderBottom: "1px solid #e0d8ce",
          color: "#14110d", fontFamily: "var(--font-fraunces), serif",
          fontSize: "0.92rem", lineHeight: 1.55, resize: "none", width: "100%",
          outline: "none", paddingBottom: "0.4rem",
        }}
      />
      <HashtagPreview text={text} />
      {imagePreview && (
        <div style={{ position: "relative", display: "inline-block", maxWidth: "200px" }}>
          <img src={imagePreview} alt="Preview" style={{ width: "100%", borderRadius: "4px", border: "1px solid #e0d8ce", display: "block" }} />
          <button type="button" onClick={removeImage} aria-label="Remove image" style={{
            position: "absolute", top: "4px", right: "4px",
            background: "rgba(20,17,13,0.65)", border: "none", borderRadius: "50%",
            width: "20px", height: "20px", color: "#fff", fontSize: "0.7rem",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} style={{ display: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {lockedTag ? (
          <span style={{
            background: "#fff0eb", color: "#c5491f", fontSize: "0.65rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.28rem 0.55rem",
            borderRadius: "2px", border: "1px solid #f5d0c0",
          }}>
            {lockedTag}
          </span>
        ) : (
          <select value={tag} onChange={e => setTag(e.target.value as Tag | "")} style={{
            background: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "2px",
            color: tag ? "#c5491f" : "#7a6f5c", fontSize: "0.72rem", fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.28rem 0.55rem",
            cursor: "pointer", outline: "none",
          }}>
            <option value="">Section</option>
            {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <button type="button" onClick={() => fileInputRef.current?.click()} title="Attach image" style={{
          background: imageFile ? "#fff0eb" : "transparent",
          border: `1px solid ${imageFile ? "#c5491f" : "#e0d8ce"}`,
          borderRadius: "2px", color: imageFile ? "#c5491f" : "#7a6f5c",
          fontSize: "0.72rem", padding: "0.28rem 0.55rem", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "0.3rem",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {imageFile ? "Change" : "Image"}
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "0.7rem", color: remaining < 50 ? (remaining < 0 ? "#c5491f" : "#b38238") : "#bbb", fontVariantNumeric: "tabular-nums" }}>
          {remaining}
        </span>
        <button type="submit" disabled={!text.trim() || loading || remaining < 0} style={{
          background: text.trim() && !loading && remaining >= 0 ? "#c93c2a" : "#e8e2d8",
          color: text.trim() && !loading && remaining >= 0 ? "#fff" : "#aaa",
          border: "none", borderRadius: "2px", padding: "0.32rem 0.9rem",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", cursor: text.trim() && !loading ? "pointer" : "default",
          transition: "all 0.15s",
        }}>
          {uploading ? "Uploading…" : loading ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p style={{ color: "#c5491f", fontSize: "0.78rem", margin: 0 }}>{error}</p>}
    </form>
  );
}

// ── Quote mode ────────────────────────────────────────────────────────────────
function QuoteForm({ user }: { user: any }) {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !author.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), author: author.trim(), source: source.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit quote.");
      setSuccess(true);
      setText(""); setAuthor(""); setSource("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ background: "#f3eef8", border: "1px solid #e0d4f0", borderRadius: "4px", padding: "0.85rem 1rem", color: "#7a4da0", fontSize: "0.85rem", fontFamily: "var(--font-fraunces), serif", fontStyle: "italic" }}>
        Quote submitted — thank you. It will appear in the archive after review.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 600))}
        placeholder="The quote…"
        rows={3}
        style={{
          background: "transparent", border: "none", borderBottom: "1px solid #e0d8ce",
          color: "#14110d", fontFamily: "var(--font-fraunces), serif",
          fontSize: "0.92rem", lineHeight: 1.55, fontStyle: "italic",
          resize: "none", width: "100%", outline: "none", paddingBottom: "0.4rem",
        }}
      />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={author}
          onChange={e => setAuthor(e.target.value.slice(0, 100))}
          placeholder="Author *"
          required
          style={{
            flex: 1, minWidth: "120px", background: "#ffffff",
            border: "1px solid #e0d8ce", borderRadius: "2px",
            color: "#14110d", fontSize: "0.78rem", padding: "0.3rem 0.6rem", outline: "none",
          }}
        />
        <input
          type="text"
          value={source}
          onChange={e => setSource(e.target.value.slice(0, 150))}
          placeholder="Source (optional)"
          style={{
            flex: 1, minWidth: "120px", background: "#ffffff",
            border: "1px solid #e0d8ce", borderRadius: "2px",
            color: "#14110d", fontSize: "0.78rem", padding: "0.3rem 0.6rem", outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", color: "#bbb" }}>{600 - text.length}</span>
        <button type="submit" disabled={!text.trim() || !author.trim() || loading} style={{
          background: text.trim() && author.trim() && !loading ? "#7a4da0" : "#e8e2d8",
          color: text.trim() && author.trim() && !loading ? "#fff" : "#aaa",
          border: "none", borderRadius: "2px", padding: "0.32rem 0.9rem",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", cursor: text.trim() && author.trim() && !loading ? "pointer" : "default",
          transition: "all 0.15s",
        }}>
          {loading ? "Submitting…" : "Submit"}
        </button>
      </div>
      {error && <p style={{ color: "#c5491f", fontSize: "0.78rem", margin: 0 }}>{error}</p>}
    </form>
  );
}

// ── Submit dropdown ───────────────────────────────────────────────────────────
function SubmitDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          background: "transparent", border: "1px solid #e0d8ce", borderRadius: "2px",
          color: "#7a6f5c", fontSize: "0.68rem", fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "0.28rem 0.55rem", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "0.25rem",
        }}
      >
        + Submit
        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden style={{ marginTop: "1px" }}>
          <path d="M5 7L1 3h8z" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "#fff", border: "1px solid #e0d8ce", borderRadius: "4px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100, minWidth: "180px",
          overflow: "hidden",
        }}>
          <Link
            href="/events/submit"
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.7rem 1rem", textDecoration: "none",
              color: "#14110d", fontSize: "0.82rem", borderBottom: "1px solid #f0ece4",
            }}
          >
            <span style={{ fontSize: "1rem" }}>📅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.78rem" }}>List an Event</div>
              <div style={{ color: "#7a6f5c", fontSize: "0.68rem" }}>Happenings &amp; exhibitions</div>
            </div>
          </Link>
          <Link
            href="/directory/submit"
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.7rem 1rem", textDecoration: "none",
              color: "#14110d", fontSize: "0.82rem",
            }}
          >
            <span style={{ fontSize: "1rem" }}>✦</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.78rem" }}>Add to Directory</div>
              <div style={{ color: "#7a6f5c", fontSize: "0.68rem" }}>People, places &amp; movements</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SubmitPost({ onPosted, lockedTag }: SubmitPostProps) {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<Mode>("post");

  const user = session?.user as any;
  const loggedIn = status === "authenticated";

  if (status === "loading") return null;

  if (!loggedIn) {
    return (
      <div style={{
        borderBottom: "1px solid #e8e2d8", padding: "0.9rem 1.25rem",
        display: "flex", alignItems: "center", gap: "0.75rem", background: "#fff",
      }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f0ece4", border: "1px solid #e0d8ce", flexShrink: 0 }} />
        <button
          onClick={() => window.dispatchEvent(new Event("open-auth-modal"))}
          style={{
            flex: 1, background: "#ffffff", border: "1px solid #e0d8ce", borderRadius: "20px",
            padding: "0.6rem 1rem", color: "#7a6f5c", fontSize: "0.85rem",
            textAlign: "left", cursor: "pointer", fontFamily: "var(--font-fraunces), serif",
          }}
        >
          What&apos;s happening in culture? Join the community to share.
        </button>
        <SubmitDropdown />
      </div>
    );
  }

  const initials = (user?.name ?? user?.displayName ?? "?")
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div style={{ borderBottom: "1px solid #e8e2d8", background: "#fff" }}>
      {/* Mode tabs + Submit dropdown */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "0 1.25rem", borderBottom: "1px solid #f0ece4",
      }}>
        <button style={TAB_STYLE(mode === "post")} onClick={() => setMode("post")}>Post</button>
        <button style={TAB_STYLE(mode === "quote")} onClick={() => setMode("quote")}>Quote</button>
        <div style={{ flex: 1 }} />
        <SubmitDropdown />
      </div>

      {/* Form area */}
      <div style={{ padding: "0.9rem 1.25rem", display: "flex", gap: "0.75rem" }}>
        {/* Avatar */}
        <div style={{
          width: "34px", height: "34px", borderRadius: "50%",
          background: mode === "quote" ? "#f3eef8" : "#fff0eb",
          border: `1.5px solid ${mode === "quote" ? "#7a4da0" : "#c5491f"}`,
          color: mode === "quote" ? "#7a4da0" : "#c5491f",
          fontSize: "0.65rem", fontWeight: 700, flexShrink: 0, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === "post"
            ? <PostForm user={user} onPosted={onPosted} lockedTag={lockedTag} />
            : <QuoteForm user={user} />
          }
        </div>
      </div>
    </div>
  );
}
