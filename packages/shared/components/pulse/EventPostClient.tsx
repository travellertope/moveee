"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { WpComment } from "@/lib/pulse-wordpress";

const CommentThread = dynamic(() => import("./CommentThread"), { ssr: false });

type Orientation = "landscape" | "portrait" | "square" | "unknown";

function useImageOrientation(src?: string | null): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(src ? "unknown" : "square");
  useEffect(() => {
    if (!src) { setOrientation("square"); return; }
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio > 1.2) setOrientation("landscape");
      else if (ratio < 0.85) setOrientation("portrait");
      else setOrientation("square");
    };
    img.onerror = () => setOrientation("landscape");
    img.src = src;
  }, [src]);
  return orientation;
}

function RsvpToggle({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [rsvped, setRsvped] = useState<boolean | null>(null);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/community/event-rsvp-status?post_id=${postId}`, { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) { setIsAuthed(false); return null; }
        setIsAuthed(true);
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data) {
          setRsvped(!!data.rsvped);
          if (typeof data.count === "number") setCount(data.count);
        }
      })
      .catch(() => {});
  }, [postId]);

  async function toggle() {
    if (loading || !isAuthed) return;
    setLoading(true);
    const endpoint = rsvped ? "/api/community/event-rsvp-cancel" : "/api/community/event-rsvp";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: Number(postId) }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const newRsvped = !rsvped;
        setRsvped(newRsvped);
        setCount((c: number) => typeof data.count === "number" ? data.count : c + (newRsvped ? 1 : -1));
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "0.82rem", color: "var(--mute)" }}>{count} attending</span>
      {isAuthed && rsvped !== null && (
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            padding: "8px 22px",
            borderRadius: "var(--radius-full)",
            fontWeight: 700,
            fontSize: "0.82rem",
            border: "none",
            cursor: loading ? "wait" : "pointer",
            transition: "background 0.15s, opacity 0.15s",
            opacity: loading ? 0.7 : 1,
            background: rsvped ? "var(--ochre)" : "var(--ink)",
            color: "#fff",
          }}
        >
          {rsvped ? "✓ Attending" : "RSVP"}
        </button>
      )}
    </div>
  );
}

interface Props {
  eventTitle: string;
  bodyText: string;
  image?: string | null;
  eventDate?: string;
  endDate?: string;
  location?: string;
  city?: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  wpId: string;
  initialComments: WpComment[];
  rsvpEnabled?: boolean;
  rsvpCount?: number;
}

export default function EventPostClient({
  eventTitle,
  bodyText,
  image,
  eventDate,
  endDate: _endDate,
  location,
  city,
  authorName,
  authorAvatar,
  authorUsername,
  wpId,
  initialComments,
  rsvpEnabled,
  rsvpCount,
}: Props) {
  const orientation = useImageOrientation(image);

  const dateFormatted = eventDate
    ? new Date(eventDate).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const locationDisplay = [location, city].filter(Boolean).join(", ") || null;

  const isLandscape = orientation === "landscape" || orientation === "unknown";
  const isPortraitOrSquare = orientation === "portrait" || orientation === "square";

  const infoBar = (dateFormatted || locationDisplay) ? (
    <div style={{
      display: "flex", flexDirection: "column", gap: "8px",
      background: "var(--paper-deep)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--rule)",
      padding: "0.85rem 1rem",
      marginBottom: "1.1rem",
    }}>
      {dateFormatted && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          {dateFormatted}
        </div>
      )}
      {locationDisplay && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          {locationDisplay}
        </div>
      )}
    </div>
  ) : null;

  const communityBadge = (
    <span style={{
      background: "rgba(122,36,28,0.85)", color: "#fff",
      fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.1em", textTransform: "uppercase",
      padding: "0.22rem 0.65rem", borderRadius: "999px",
      backdropFilter: "blur(4px)",
      display: "inline-block",
    }}>
      Community Event
    </span>
  );

  return (
    <article style={{
      background: "var(--paper)",
      border: "1px solid var(--rule)",
      borderRadius: "20px",
      boxShadow: "0 2px 12px rgba(20,17,13,0.08)",
      overflow: "hidden",
      margin: "0.85rem 1rem 1rem",
    }}>
      {/* ── LANDSCAPE header ── */}
      {image && isLandscape && (
        <div style={{ position: "relative", overflow: "hidden" }}>
          <img
            src={image}
            alt=""
            style={{ width: "100%", display: "block", maxHeight: "320px", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(20,17,13,0.70) 0%, rgba(20,17,13,0.12) 55%, transparent 100%)",
          }} />
          <div style={{ position: "absolute", bottom: "1rem", left: "1.25rem" }}>
            {communityBadge}
          </div>
        </div>
      )}

      {/* ── PORTRAIT / SQUARE header ── */}
      {image && isPortraitOrSquare && (
        <div style={{
          display: "flex", flexDirection: "row",
          borderBottom: "1px solid var(--rule)",
        }}>
          {/* Image column */}
          <div style={{
            width: "40%", flexShrink: 0, position: "relative", overflow: "hidden",
            maxHeight: "300px",
          }}>
            <img
              src={image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
          {/* Info column */}
          <div style={{
            flex: 1, padding: "1.25rem 1.25rem", display: "flex",
            flexDirection: "column", justifyContent: "center", gap: "0.85rem",
            minWidth: 0,
          }}>
            <div>{communityBadge}</div>
            <h1 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontWeight: 700, fontSize: "1.35rem", lineHeight: 1.2,
              color: "var(--ink)", margin: 0,
            }}>
              {eventTitle}
            </h1>
            {(dateFormatted || locationDisplay) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {dateFormatted && (
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dateFormatted}</span>
                  </div>
                )}
                {locationDisplay && (
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                      </svg>
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{locationDisplay}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NO IMAGE fallback ── */}
      {!image && (
        <div style={{
          height: "100px",
          background: "var(--ink)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <span style={{ fontSize: "2.5rem", opacity: 0.12 }}>🎉</span>
          <div style={{ position: "absolute", bottom: "0.75rem", left: "1.25rem" }}>
            {communityBadge}
          </div>
        </div>
      )}

      <div style={{ padding: "1.5rem 1.5rem 0" }}>

        {/* Title shown in body only for landscape and no-image cases */}
        {(isLandscape || !image) && (
          <h1 style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontWeight: 700,
            fontSize: "1.75rem",
            lineHeight: 1.2,
            color: "var(--ink)",
            margin: "0 0 1.1rem",
          }}>
            {eventTitle}
          </h1>
        )}

        {/* Full info bar shown in body for landscape and no-image; portrait gets compact inline version */}
        {(isLandscape || !image) && infoBar}
        {image && isPortraitOrSquare && infoBar}

        {/* Host + RSVP row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "12px",
          background: "var(--paper)", border: "1px solid var(--rule)",
          borderRadius: "var(--radius-xl)", padding: "1rem 1.1rem",
          marginBottom: "1.25rem",
          boxShadow: "0 1px 4px rgba(20,17,13,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt=""
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--rule)" }}
              />
            ) : (
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                background: "var(--ochre)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", fontWeight: 700, flexShrink: 0,
              }}>
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "2px" }}>
                Event Host
              </div>
              {authorUsername ? (
                <Link href={`/connect/${authorUsername}`} style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)", textDecoration: "none" }}>
                  {authorName}
                </Link>
              ) : (
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)" }}>{authorName}</div>
              )}
            </div>
          </div>
          {rsvpEnabled && (
            <RsvpToggle postId={wpId} initialCount={rsvpCount ?? 0} />
          )}
        </div>

        {/* Event description */}
        {bodyText && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "0.5rem" }}>
              Event Details
            </div>
            <p style={{ fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
              {bodyText}
            </p>
          </div>
        )}
      </div>

      {/* Discussion */}
      <div style={{ borderTop: "1px solid var(--rule)", padding: "1.25rem 1.5rem 2rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "0.85rem" }}>
          Event Discussion
        </div>
        <CommentThread postId={parseInt(wpId, 10)} initialComments={initialComments} />
      </div>
    </article>
  );
}
