"use client";

import { useEffect, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";
import type { WpComment } from "@/lib/pulse-wordpress";

const CommentThread = dynamic(() => import("./CommentThread"), { ssr: false });

// Re-use the existing RsvpDisplay from FeedCard by inlining a minimal version
// here that hits the same APIs. We only need the RSVP toggle — no guest form needed
// inside the modal since unauthenticated users can open the full page.
function RsvpToggle({ postId, initialCount }: { postId?: string; initialCount?: number }) {
  const [rsvped, setRsvped] = useState<boolean | null>(null);
  const [count, setCount] = useState(initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!postId) return;
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
    if (loading || !postId || !isAuthed) return;
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

  if (isAuthed === false) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--mute)" }}>{count} attending</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "0.78rem", color: "var(--mute)" }}>{count} attending</span>
      {isAuthed && rsvped !== null && (
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            padding: "6px 18px",
            borderRadius: "var(--radius-full)",
            fontWeight: 700,
            fontSize: "0.78rem",
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
  item: FeedItem;
  onClose: () => void;
}

export default function EventDetailModal({ item, onClose }: Props) {
  const close = useCallback(() => onClose(), [onClose]);
  const [comments, setComments] = useState<WpComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close]);

  useEffect(() => {
    if (!item.wpId) { setCommentsLoading(false); return; }
    fetch(`/api/pulse/comments?postId=${item.wpId}`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [item.wpId]);

  // For community-type events, title may carry event title + body separated by \n
  const nlIdx = item.title.indexOf("\n");
  const eventTitle = nlIdx === -1 ? item.title.trim() : item.title.slice(0, nlIdx).trim();
  const bodyText = nlIdx === -1 ? "" : item.title.slice(nlIdx + 1).trim();

  const dateFormatted = item.eventDate
    ? new Date(item.eventDate).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const location = [item.location, item.city].filter(Boolean).join(", ") || null;

  // Author info — community posts use communityAuthor*, happenings have no author display
  const authorName = item.communityAuthor || item.organiserName || null;
  const authorAvatar = item.communityAuthorAvatar || null;
  const authorUsername = item.communityAuthorUsername || null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "rgba(20,17,13,0.62)",
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          maxHeight: "90vh",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), 0 4px 20px rgba(0,0,0,0.12)",
          margin: "auto",
        }}
      >
        {/* Header bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.9rem 1.1rem",
          borderBottom: "1px solid var(--rule)",
          flexShrink: 0,
          background: "var(--paper)",
          zIndex: 1,
        }}>
          <span style={{
            background: "rgba(122,36,28,0.10)", color: "var(--ochre)",
            fontSize: "0.58rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "0.18rem 0.55rem", borderRadius: "999px",
          }}>
            Community Event
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Link
              href={item.href}
              aria-label="Open full event page"
              title="Open full event page"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--mute)", padding: "0.25rem",
                borderRadius: "6px", transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--ochre)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--mute)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </Link>
            <button onClick={close} aria-label="Close" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--ink)", lineHeight: 1, padding: "0.25rem", display: "flex",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>

          {/* Cover image */}
          {item.image ? (
            <div style={{ height: "200px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
              <img
                src={item.image}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(20,17,13,0.65) 0%, rgba(20,17,13,0.10) 60%, transparent 100%)",
              }} />
            </div>
          ) : (
            <div style={{
              height: "80px",
              background: "var(--ink)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: "2rem", opacity: 0.12 }}>🎉</span>
            </div>
          )}

          <div style={{ padding: "1.25rem 1.25rem 0.5rem" }}>

            {/* Event title */}
            <h2 style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontWeight: 700,
              fontSize: "1.45rem",
              lineHeight: 1.25,
              color: "var(--ink)",
              margin: "0 0 0.85rem",
            }}>
              {eventTitle}
            </h2>

            {/* Date + Location info bar */}
            {(dateFormatted || location) && (
              <div style={{
                display: "flex", flexDirection: "column", gap: "6px",
                background: "var(--paper-deep)", borderRadius: "var(--radius-lg)",
                border: "1px solid var(--rule)",
                padding: "0.75rem 0.9rem",
                marginBottom: "1rem",
              }}>
                {dateFormatted && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    {dateFormatted}
                  </div>
                )}
                {location && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                      </svg>
                    </div>
                    {location}
                  </div>
                )}
              </div>
            )}

            {/* Host + RSVP row */}
            {(authorName || item.rsvpEnabled) && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "12px",
                background: "var(--paper)", border: "1px solid var(--rule)",
                borderRadius: "var(--radius-xl)", padding: "0.85rem 1rem",
                marginBottom: "1rem",
                boxShadow: "0 1px 4px rgba(20,17,13,0.05)",
              }}>
                {authorName && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {authorAvatar ? (
                      <img src={authorAvatar} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--rule)" }} />
                    ) : (
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--ochre)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, flexShrink: 0 }}>
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "2px" }}>
                        Event Host
                      </div>
                      {authorUsername ? (
                        <Link href={`/connect/${authorUsername}`} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--ink)", textDecoration: "none" }}>
                          {authorName}
                        </Link>
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--ink)" }}>{authorName}</div>
                      )}
                    </div>
                  </div>
                )}
                {item.rsvpEnabled && (
                  <RsvpToggle postId={item.wpId} initialCount={item.rsvpCount} />
                )}
              </div>
            )}

            {/* Event description */}
            {bodyText && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "0.5rem" }}>
                  Event Details
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-line" }}>
                  {bodyText}
                </p>
              </div>
            )}

          </div>

          {/* Discussion / Comments */}
          {item.wpId && (
            <div style={{ borderTop: "1px solid var(--rule)", padding: "1rem 1.25rem 1.5rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "0.75rem" }}>
                Event Discussion
              </div>
              {commentsLoading ? (
                <p style={{ color: "var(--mute)", fontSize: "0.8rem" }}>Loading…</p>
              ) : (
                <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
