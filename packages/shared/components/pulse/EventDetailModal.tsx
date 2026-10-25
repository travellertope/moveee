"use client";

import { useEffect, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Flag } from "lucide-react";
import type { FeedItem } from "@/lib/unified-feed";
import type { WpComment } from "@/lib/pulse-wordpress";

const CommentThread = dynamic(() => import("./CommentThread"), { ssr: false });
const ReactionBar = dynamic(() => import("./ReactionBar"), { ssr: false });

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

function formatEventDateTime(dateStr?: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const dateText = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const h = d.getHours(), m = d.getMinutes();
  if (h !== 0 || m !== 0) {
    const timeText = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${dateText}, ${timeText}`;
  }
  return dateText;
}

function toDatetimeLocal(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

const EVENT_CATEGORIES = ["Art","Music","Fashion","Food","Film","Literature","Sport","Design","Tech","Talk","Workshop","Community"];

interface Props {
  item: FeedItem;
  onClose: () => void;
}

const communityBadge = (
  <span style={{
    background: "rgba(122,36,28,0.85)", color: "#fff",
    fontSize: "0.58rem", fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "0.2rem 0.6rem", borderRadius: "999px",
    backdropFilter: "blur(4px)",
    display: "inline-block",
  }}>
    Community Event
  </span>
);

export default function EventDetailModal({ item, onClose }: Props) {
  const close = useCallback(() => onClose(), [onClose]);
  const [comments, setComments] = useState<WpComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const orientation = useImageOrientation(item.image);

  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const sessionUserId = sessionUser?.id ? Number(sessionUser.id) : sessionUser?.databaseId ? Number(sessionUser.databaseId) : null;
  const isOwn = !!(sessionUserId && item.communityAuthorId && sessionUserId === item.communityAuthorId);
  const isPro = sessionUser?.tier === "patron" || sessionUser?.tier === "lit" || sessionUser?.isAdmin === true;
  const canEdit = isOwn && isPro;

  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [reportState, setReportState] = useState<"idle" | "confirm" | "sent" | "error">("idle");

  // Derive event title and body text
  const displayTitle = item.eventPostTitle
    ? item.eventPostTitle
    : (item.title.indexOf("\n") !== -1 ? item.title.slice(0, item.title.indexOf("\n")).trim() : item.title.trim());
  const bodyText = item.eventPostTitle
    ? item.title.trim()
    : (item.title.indexOf("\n") !== -1 ? item.title.slice(item.title.indexOf("\n") + 1).trim() : "");

  const [editTitle, setEditTitle] = useState(displayTitle);
  const [editDesc, setEditDesc] = useState(bodyText);
  const [editDate, setEditDate] = useState(toDatetimeLocal(item.eventDate));
  const [editEndDate, setEditEndDate] = useState(toDatetimeLocal(item.endDate));
  const [editVenue, setEditVenue] = useState(item.location ?? "");
  const [editCity, setEditCity] = useState(item.city ?? "");
  const [editAddress, setEditAddress] = useState(item.venueAddress ?? "");
  const [editAdmission, setEditAdmission] = useState(item.admission ?? "");
  const [editCategory, setEditCategory] = useState(item.eventCategory ?? "");
  const [editTicketUrl, setEditTicketUrl] = useState(item.ticketUrl ?? "");
  const [editRsvpEnabled, setEditRsvpEnabled] = useState(!!item.rsvpEnabled);
  const [editRsvpCapacity, setEditRsvpCapacity] = useState(item.rsvpCapacity ?? 0);

  async function handleEventEdit() {
    if (!editTitle.trim()) { setEditError("Event title is required."); return; }
    setEditing(true);
    setEditError("");
    try {
      const res = await fetch("/api/community/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: Number(item.wpId),
          template_type: "event",
          event_title: editTitle,
          text: editDesc,
          event_date: editDate,
          event_end_date: editEndDate,
          event_venue: editVenue,
          event_city: editCity,
          event_address: editAddress,
          event_admission: editAdmission,
          event_category: editCategory,
          ticket_url: editTicketUrl,
          rsvp_enabled: editRsvpEnabled,
          rsvp_capacity: editRsvpCapacity,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError((d as any).error ?? "Edit failed.");
      } else {
        setEditOpen(false);
      }
    } catch {
      setEditError("Network error.");
    }
    setEditing(false);
  }

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

  const dateFormatted = formatEventDateTime(item.eventDate);
  const location = [item.location, item.city].filter(Boolean).join(", ") || null;

  const authorName = item.communityAuthor || item.organiserName || null;
  const authorAvatar = item.communityAuthorAvatar || null;
  const authorUsername = item.communityAuthorUsername || null;

  const isLandscape = orientation === "landscape" || orientation === "unknown";
  const isPortraitOrSquare = orientation === "portrait" || orientation === "square";

  const infoBar = (dateFormatted || location) ? (
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
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
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
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
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
  ) : null;

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
          padding: "0.7rem 1rem",
          borderBottom: isPortraitOrSquare && item.image ? "none" : "1px solid var(--rule)",
          flexShrink: 0,
          background: "var(--paper)",
          zIndex: 1,
        }}>
          {isPortraitOrSquare && item.image ? communityBadge : !item.image ? communityBadge : <div />}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {canEdit && (
              <button
                onClick={() => setOwnerMenuOpen(true)}
                title="Edit event"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mute)", padding: "0.25rem", display: "flex" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
                </svg>
              </button>
            )}
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

          {/* LANDSCAPE */}
          {item.image && isLandscape && (
            <>
              <div style={{ position: "relative", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src={item.image}
                  alt=""
                  style={{ width: "100%", display: "block", maxHeight: "280px", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(20,17,13,0.70) 0%, rgba(20,17,13,0.10) 55%, transparent 100%)",
                }} />
                <div style={{ position: "absolute", bottom: "0.85rem", left: "1rem" }}>
                  {communityBadge}
                </div>
              </div>
              <div style={{ padding: "1.1rem 1.25rem 0.5rem" }}>
                <h2 style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontWeight: 700, fontSize: "1.45rem", lineHeight: 1.25,
                  color: "var(--ink)", margin: "0 0 0.85rem",
                }}>
                  {displayTitle}
                </h2>
                {infoBar}
              </div>
            </>
          )}

          {/* PORTRAIT / SQUARE */}
          {item.image && isPortraitOrSquare && (
            <div style={{ display: "flex", flexDirection: "row", borderBottom: "1px solid var(--rule)" }}>
              <div style={{ width: "40%", flexShrink: 0, position: "relative", overflow: "hidden", maxHeight: "260px" }}>
                <img
                  src={item.image}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{
                flex: 1, padding: "1rem 1.1rem", display: "flex",
                flexDirection: "column", justifyContent: "center", gap: "0.75rem",
                minWidth: 0,
              }}>
                <h2 style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontWeight: 700, fontSize: "1.15rem", lineHeight: 1.25,
                  color: "var(--ink)", margin: 0,
                }}>
                  {displayTitle}
                </h2>
                {(dateFormatted || location) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {dateFormatted && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(122,36,28,0.08)", color: "var(--ochre)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dateFormatted}</span>
                      </div>
                    )}
                    {location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(122,36,28,0.08)", color: "var(--ochre)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                          </svg>
                        </div>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NO IMAGE */}
          {!item.image && (
            <div style={{ height: "80px", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "2rem", opacity: 0.12 }}>🎉</span>
            </div>
          )}

          <div style={{ padding: "1.25rem 1.25rem 0.5rem" }}>

            {/* Title + info bar for no-image case */}
            {!item.image && (
              <>
                <h2 style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontWeight: 700, fontSize: "1.45rem", lineHeight: 1.25,
                  color: "var(--ink)", margin: "0 0 0.85rem",
                }}>
                  {displayTitle}
                </h2>
                {infoBar}
              </>
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
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)", marginBottom: "2px" }}>Event Host</div>
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

            {/* For portrait/square, show full infoBar below host row */}
            {item.image && isPortraitOrSquare && infoBar}

            {/* Event description — shown right after host/RSVP */}
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

            {/* Reactions */}
            {item.wpId && (
              <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--rule)", marginBottom: "0.5rem" }}>
                <ReactionBar
                  noBorder
                  itemId={item.wpId}
                  itemType="community"
                  initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
                  shareUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/community/${item.slug}`}
                  flagSlot={
                    reportState === "idle" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReportState("confirm"); }}
                        title="Report this post"
                        style={{ display: "flex", alignItems: "center", background: "none", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--mute)", lineHeight: 1 }}
                      >
                        <Flag size={13} strokeWidth={1.8} />
                      </button>
                    ) : reportState === "sent" ? (
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--mute)", whiteSpace: "nowrap" }}>Reported ✓</span>
                    ) : reportState === "error" ? (
                      <span style={{ fontSize: "0.62rem", color: "var(--error)", whiteSpace: "nowrap" }}>Couldn't send.</span>
                    ) : null
                  }
                />
              </div>
            )}

          </div>

          {/* Comments */}
          {item.wpId && (
            <div style={{ padding: "0 1.25rem 1.5rem" }}>
              {commentsLoading ? (
                <p style={{ color: "var(--mute)", fontSize: "0.8rem" }}>Loading…</p>
              ) : (
                <CommentThread postId={parseInt(item.wpId, 10)} initialComments={comments} />
              )}
            </div>
          )}

        </div>
      </div>

      {/* Owner menu bottom sheet */}
      {ownerMenuOpen && (
        <>
          <div onClick={() => setOwnerMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "min(480px, 100%)", zIndex: 9001, background: "var(--paper)", borderRadius: "20px 20px 0 0", padding: "0.75rem 1.25rem 1.5rem", boxShadow: "0 -8px 32px rgba(20,17,13,0.18)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                onClick={() => { setOwnerMenuOpen(false); setEditOpen(true); }}
                style={{ width: "100%", padding: "0.8rem 1rem", background: "#fff", border: "1px solid var(--rule)", borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "var(--ink)", fontFamily: "inherit", fontWeight: 500 }}
              >
                Edit event
              </button>
              <button
                onClick={() => setOwnerMenuOpen(false)}
                style={{ width: "100%", marginTop: "0.25rem", padding: "0.75rem 1rem", background: "transparent", border: "none", borderRadius: "var(--radius-lg)", cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Report confirm */}
      {reportState === "confirm" && (
        <>
          <div onClick={() => setReportState("idle")} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "min(480px, 100%)", zIndex: 9001, background: "var(--paper)", borderRadius: "20px 20px 0 0", padding: "0.75rem 1.25rem 1.5rem", boxShadow: "0 -8px 32px rgba(20,17,13,0.18)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1.1rem" }} />
            <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>Report this post</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(["spam", "harassment", "inappropriate"] as const).map((r) => (
                <button key={r} onClick={async () => {
                  if (!item.wpId) return;
                  try {
                    const res = await fetch("/api/community/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: item.wpId, reason: r }) });
                    setReportState(res.ok ? "sent" : "error");
                  } catch { setReportState("error"); }
                }} style={{ width: "100%", padding: "0.75rem 1rem", background: "#fff", border: "1px solid var(--rule)", borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "left", fontSize: "0.88rem", color: "var(--ink)", fontFamily: "inherit", fontWeight: 500, textTransform: "capitalize" }}>
                  {r}
                </button>
              ))}
              <button onClick={() => setReportState("idle")} style={{ width: "100%", marginTop: "0.25rem", padding: "0.75rem 1rem", background: "transparent", border: "none", borderRadius: "var(--radius-lg)", cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600 }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Event edit form */}
      {editOpen && (
        <>
          <div onClick={() => !editing && setEditOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(20,17,13,0.45)" }} />
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "min(520px, 100%)", zIndex: 9001, background: "var(--paper)", borderRadius: "20px 20px 0 0", padding: "0.75rem 1.25rem 2rem", boxShadow: "0 -8px 32px rgba(20,17,13,0.18)", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(20,17,13,0.2)", margin: "0 auto 1rem" }} />
            <p style={{ margin: "0 0 1.1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>Edit event</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Event title *</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value.slice(0, 150))}
                  placeholder="Event name"
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value.slice(0, 2000))}
                  rows={4}
                  placeholder="Tell people about your event…"
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, resize: "vertical", outline: "none", padding: "0.65rem 0.9rem", boxSizing: "border-box" }}
                />
              </div>
              {/* Date + End date */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Start date & time</label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.85rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>End date & time</label>
                  <input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.85rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              </div>
              {/* Venue + City */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Venue</label>
                  <input
                    value={editVenue}
                    onChange={e => setEditVenue(e.target.value)}
                    placeholder="Venue name"
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>City</label>
                  <input
                    value={editCity}
                    onChange={e => setEditCity(e.target.value)}
                    placeholder="City"
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              </div>
              {/* Address */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Address</label>
                <input
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  placeholder="Street address"
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              {/* Admission + Category */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Admission</label>
                  <input
                    value={editAdmission}
                    onChange={e => setEditAdmission(e.target.value)}
                    placeholder="e.g. Free, ₦2,000"
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                  >
                    <option value="">Select…</option>
                    {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* Ticket URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)", marginBottom: "4px" }}>Ticket / info URL</label>
                <input
                  type="url"
                  value={editTicketUrl}
                  onChange={e => setEditTicketUrl(e.target.value)}
                  placeholder="https://…"
                  style={{ width: "100%", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              {/* RSVP */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--paper-deep)", borderRadius: "var(--radius-lg)", border: "1px solid var(--rule)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={editRsvpEnabled}
                    onChange={e => setEditRsvpEnabled(e.target.checked)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--ink)", fontWeight: 500 }}>Enable RSVP</span>
                </label>
                {editRsvpEnabled && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.78rem", color: "var(--mute)", whiteSpace: "nowrap" }}>Capacity</label>
                    <input
                      type="number"
                      min="0"
                      value={editRsvpCapacity || ""}
                      onChange={e => setEditRsvpCapacity(Math.max(0, Number(e.target.value)))}
                      placeholder="∞"
                      style={{ width: "70px", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.88rem", padding: "0.4rem 0.6rem", outline: "none" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {editError && <p style={{ color: "#c62828", fontSize: "0.78rem", margin: "0.75rem 0 0" }}>{editError}</p>}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button onClick={() => setEditOpen(false)} disabled={editing} style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid var(--rule)", borderRadius: "var(--radius-lg)", cursor: "pointer", fontSize: "0.85rem", color: "var(--mute)", fontFamily: "inherit", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleEventEdit} disabled={editing || !editTitle.trim()} style={{ flex: 2, padding: "0.75rem", background: "var(--ochre)", border: "none", borderRadius: "var(--radius-lg)", cursor: editing || !editTitle.trim() ? "default" : "pointer", fontSize: "0.88rem", color: "#fff", fontFamily: "inherit", fontWeight: 600, opacity: editing || !editTitle.trim() ? 0.6 : 1 }}>
                {editing ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
