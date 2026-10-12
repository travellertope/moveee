"use client";

import { useState, useRef } from "react";

interface Props {
  initialCoverUrl: string | null;
  isOwnProfile: boolean;
}

const DEFAULT_COVER_SRC = "/default-cover.avif";
// Fallback if the static asset also fails to load
const DEFAULT_COVER_GRADIENT = "linear-gradient(135deg, #14110d 0%, #2a1a08 35%, #4a2610 65%, #1a1612 100%)";

export default function CoverPhotoClient({ initialCoverUrl, isOwnProfile }: Props) {
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl || DEFAULT_COVER_SRC);
  const [coverFailed, setCoverFailed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/member/upload-cover", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoverUrl(data.url);
      setCoverFailed(false);
      setShowModal(false);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
    setUploading(false);
  }

  return (
    <>
      {/* Cover area */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
        {!coverFailed ? (
          <img
            src={coverUrl ?? DEFAULT_COVER_SRC}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: DEFAULT_COVER_GRADIENT }} />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(20,17,13,0.5) 0%, transparent 55%)",
          pointerEvents: "none",
        }} />
        {isOwnProfile && (
          <button
            onClick={() => { setShowModal(true); setError(""); }}
            style={{
              position: "absolute", top: "1rem", right: "1rem",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "inline-flex", alignItems: "center", gap: "6px",
              cursor: "pointer", letterSpacing: "0.01em",
            }}
          >
            ✎ Edit Cover
          </button>
        )}
      </div>

      {/* Upload modal — bottom sheet */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.6)" }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "min(480px, 100%)", zIndex: 9001,
            background: "var(--paper, #f3ece0)",
            borderRadius: "20px 20px 0 0",
            padding: "0.75rem 1.5rem 2rem",
            boxShadow: "0 -8px 32px rgba(20,17,13,0.18)",
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.25rem" }} />
            <p style={{ margin: "0 0 0.35rem", fontSize: "1rem", fontWeight: 700, color: "var(--ink, #14110d)", textAlign: "center", fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
              Upload Cover Photo
            </p>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.75rem", color: "var(--mute, #7a6f5c)", textAlign: "center", fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
              Recommended 1200×400 px · JPEG, PNG or WebP · max 10 MB
            </p>
            {error && (
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#c62828", textAlign: "center" }}>{error}</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                width: "100%", padding: "0.85rem",
                background: "var(--ochre, #7a241c)", color: "#fff",
                border: "none", borderRadius: "var(--radius-lg, 6px)",
                cursor: uploading ? "default" : "pointer",
                fontSize: "0.9rem", fontWeight: 600, fontFamily: "inherit",
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "Uploading…" : "Choose Photo"}
            </button>
            <button
              onClick={() => setShowModal(false)}
              style={{
                width: "100%", marginTop: "0.5rem", padding: "0.75rem",
                background: "transparent", border: "none",
                fontSize: "0.85rem", color: "var(--mute, #7a6f5c)",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}
