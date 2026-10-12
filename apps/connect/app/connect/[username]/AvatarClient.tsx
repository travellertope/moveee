"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

interface Props {
  initialAvatarUrl: string | null;
  displayName: string;
  initial: string;
  isOwnProfile: boolean;
}

export default function AvatarClient({ initialAvatarUrl, displayName, initial, isOwnProfile }: Props) {
  const { update: updateSession } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
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
      const res = await fetch("/api/member/upload-avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.url);
      await updateSession({ avatarUrl: data.url });
      setShowModal(false);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
    setUploading(false);
  }

  return (
    <>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: "128px", height: "128px",
          borderRadius: "50%",
          border: "4px solid var(--paper, #f3ece0)",
          boxShadow: "0 2px 12px rgba(20,17,13,0.15)",
          overflow: "hidden",
          background: "var(--ink, #14110d)",
          flexShrink: 0,
        }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={() => setAvatarUrl(null)}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "48px", fontWeight: 300,
              color: "var(--paper, #f3ece0)",
            }}>
              {initial}
            </div>
          )}
        </div>

        {/* Online indicator */}
        <span style={{
          position: "absolute", bottom: "7px", right: "7px",
          width: "18px", height: "18px",
          background: "#22c55e",
          borderRadius: "50%",
          border: "3px solid var(--paper, #f3ece0)",
          display: "block",
        }} />

        {/* Pencil button — own profile only */}
        {isOwnProfile && (
          <button
            onClick={() => { setShowModal(true); setError(""); }}
            title="Change profile photo"
            style={{
              position: "absolute",
              bottom: "26px", right: "-6px",
              width: "28px", height: "28px",
              background: "var(--ochre, #7a241c)",
              color: "#fff",
              border: "2.5px solid var(--paper, #f3ece0)",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px",
              lineHeight: 1,
              boxShadow: "0 1px 4px rgba(20,17,13,0.25)",
            }}
          >
            ✎
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
              Change Profile Photo
            </p>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.75rem", color: "var(--mute, #7a6f5c)", textAlign: "center", fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
              Cropped to square · max 8 MB · JPEG, PNG or WebP
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
