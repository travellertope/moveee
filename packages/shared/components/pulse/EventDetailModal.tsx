"use client";

import { useEffect, useCallback, useState } from "react";
import { useSession, signIn } from "next-auth/react";
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

function RsvpToggle({ postId, initialCount, capacity, isOwn }: { postId?: string; initialCount?: number; capacity?: number; isOwn?: boolean }) {
  const [rsvped, setRsvped] = useState<boolean | null>(null);
  const [count, setCount] = useState(initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  // Inline magic-OTP state for unauthenticated RSVP
  const [otpStep, setOtpStep] = useState<"idle" | "email" | "otp" | "verifying">("idle");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);

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

  async function sendOtp() {
    if (!otpEmail.trim() || otpSending) return;
    setOtpSending(true); setOtpError("");
    try {
      const res = await fetch("/api/auth/magic-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setOtpStep("otp"); }
      else { setOtpError(d.error ?? "Couldn't send a code — try again."); }
    } catch { setOtpError("Network error — try again."); }
    setOtpSending(false);
  }

  async function verifyOtp() {
    if (!otpCode.trim() || otpStep === "verifying") return;
    setOtpStep("verifying"); setOtpError("");
    const result = await signIn("credentials", {
      redirect: false,
      otpEmail: otpEmail.trim(),
      otpCode: otpCode.trim(),
    }).catch(() => null);
    if (result?.ok) {
      try {
        const res = await fetch(`/api/community/event-rsvp-status?post_id=${postId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setIsAuthed(true);
          setRsvped(!!data.rsvped);
          if (typeof data.count === "number") setCount(data.count);
          if (!data.rsvped) {
            const rsvpRes = await fetch("/api/community/event-rsvp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ post_id: Number(postId) }),
            });
            if (rsvpRes.ok) {
              const rsvpData = await rsvpRes.json().catch(() => ({}));
              setRsvped(true);
              setCount((c: number) => typeof rsvpData.count === "number" ? rsvpData.count : c + 1);
            }
          }
          setOtpStep("idle");
        } else {
          setOtpError("Sign-in failed — try again.");
          setOtpStep("otp");
        }
      } catch { setOtpError("Sign-in failed."); setOtpStep("otp"); }
    } else {
      setOtpError(result?.error === "CredentialsSignin" ? "Incorrect code." : "Sign-in failed.");
      setOtpStep("otp");
    }
  }

  const openSlots = capacity != null ? Math.max(0, capacity - count) : null;
  const attendingCount = openSlots != null ? (
    <div style={{ fontSize: "0.78rem", color: "var(--ink-soft)", fontWeight: 600, marginBottom: "5px" }}>
      {openSlots} Open Slots
    </div>
  ) : null;
  const pillBtn = (label: string, onClick: () => void, disabled = false): React.ReactNode => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "5px 12px", borderRadius: "var(--radius-full)",
      fontWeight: 700, fontSize: "0.72rem", border: "none", flexShrink: 0,
      cursor: disabled ? "default" : "pointer", letterSpacing: "0.04em",
      background: disabled ? "var(--paper-deep)" : "var(--ink)",
      color: disabled ? "var(--mute)" : "#fff", opacity: disabled ? 0.6 : 1,
    }}>{label}</button>
  );
  const inputStyle: React.CSSProperties = {
    fontSize: "0.75rem", padding: "5px 8px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--rule)",
    background: "var(--paper)", color: "var(--ink)", outline: "none", fontFamily: "inherit",
  };
  const ghostBtn = (label: string, onClick: () => void): React.ReactNode => (
    <button onClick={onClick} style={{
      fontSize: "0.62rem", color: "var(--mute)", background: "none",
      border: "none", cursor: "pointer", padding: 0,
    }}>{label}</button>
  );

  if (isOwn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
        {attendingCount}
        <button disabled style={{
          padding: "5px 14px", borderRadius: "var(--radius-full)",
          fontWeight: 700, fontSize: "0.72rem", border: "none",
          background: "var(--paper-deep)", color: "var(--mute)",
          cursor: "default", opacity: 0.7, letterSpacing: "0.04em",
        }}>Your event</button>
      </div>
    );
  }

  if (isAuthed === false) {
    if (otpStep === "idle") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          {attendingCount}
          {pillBtn("RSVP Now", () => setOtpStep("email"))}
        </div>
      );
    }
    if (otpStep === "email") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
          {otpError && <div style={{ fontSize: "0.65rem", color: "#c62828", textAlign: "right" }}>{otpError}</div>}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="email"
              value={otpEmail}
              onChange={e => setOtpEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendOtp()}
              placeholder="your@email.com"
              style={{ ...inputStyle, width: "148px" }}
            />
            {pillBtn(otpSending ? "…" : "Send code", sendOtp, otpSending || !otpEmail.trim())}
          </div>
          {ghostBtn("Cancel", () => { setOtpStep("idle"); setOtpError(""); })}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
        <div style={{ fontSize: "0.65rem", color: "var(--mute)", textAlign: "right" }}>Code sent to {otpEmail}</div>
        {otpError && <div style={{ fontSize: "0.65rem", color: "#c62828", textAlign: "right" }}>{otpError}</div>}
        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            type="text"
            inputMode="numeric"
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && verifyOtp()}
            placeholder="000000"
            maxLength={6}
            style={{ ...inputStyle, width: "72px", textAlign: "center", letterSpacing: "0.12em" }}
          />
          {pillBtn(otpStep === "verifying" ? "…" : "Verify", verifyOtp, otpStep === "verifying" || !otpCode.trim())}
        </div>
        {ghostBtn("← Change email", () => { setOtpStep("email"); setOtpCode(""); setOtpError(""); })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
      {attendingCount}
      {isAuthed && rsvped !== null && (
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            padding: "5px 14px", borderRadius: "var(--radius-full)",
            fontWeight: 700, fontSize: "0.72rem", border: "none",
            cursor: loading ? "wait" : "pointer",
            transition: "background 0.15s, opacity 0.15s",
            opacity: loading ? 0.7 : 1, letterSpacing: "0.04em",
            background: rsvped ? "#2e7d32" : "var(--ink)", color: "#fff",
          }}
        >
          {rsvped ? "✓ Attending" : "RSVP Now"}
        </button>
      )}
    </div>
  );
}

const EVENT_CATEGORIES = ["Art","Music","Fashion","Food","Film","Literature","Sport","Design","Tech","Talk","Workshop","Community"];
const CURRENCIES = ["₦", "£", "$", "€", "GH₵", "R", "KES"];
function parseCurrency(val: string) {
  for (const c of CURRENCIES) {
    if (val.startsWith(c)) return { currency: c, amount: val.slice(c.length).trim() };
  }
  return { currency: "", amount: val };
}

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 540);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 540);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Derive event title and body text
  const displayTitle = item.eventPostTitle
    ? item.eventPostTitle
    : (item.title.indexOf("\n") !== -1 ? item.title.slice(0, item.title.indexOf("\n")).trim() : item.title.trim());
  const rawBodyText = item.eventPostTitle
    ? item.title.trim()
    : (item.title.indexOf("\n") !== -1 ? item.title.slice(item.title.indexOf("\n") + 1).trim() : "");
  // Suppress body when it duplicates the title (fallback when post has no description)
  const bodyText = rawBodyText === displayTitle ? "" : rawBodyText;

  const [editTitle, setEditTitle] = useState(displayTitle);
  const [editDesc, setEditDesc] = useState(bodyText);
  const [editDate, setEditDate] = useState(toDatetimeLocal(item.eventDate));
  const [editEndDate, setEditEndDate] = useState(toDatetimeLocal(item.endDate));
  const [editVenue, setEditVenue] = useState(item.location ?? "");
  const [editCity, setEditCity] = useState(item.city ?? "");
  const [editAddress, setEditAddress] = useState(item.venueAddress ?? "");
  const { currency: _initCur, amount: _initAmt } = parseCurrency(item.admission ?? "");
  const [editCurrency, setEditCurrency] = useState(_initCur);
  const [editAmount, setEditAmount] = useState(_initAmt);
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
          event_admission: editCurrency + editAmount,
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

  // Clock icon SVG
  const clockIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  // Pin icon SVG
  const pinIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  );
  // Ticket icon SVG
  const ticketIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    </svg>
  );

  const iconPill = (icon: React.ReactNode) => (
    <div style={{
      width: "24px", height: "24px", borderRadius: "50%",
      background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {icon}
    </div>
  );

  // Compact date/location rows (used in portrait/square right column)
  const metaRowsSmall = (dateFormatted || location) && (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {dateFormatted && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          {iconPill(clockIcon)}
          <span style={{ marginTop: "4px" }}>{dateFormatted}</span>
        </div>
      )}
      {location && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.75rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          {iconPill(pinIcon)}
          <span style={{ marginTop: "4px" }}>{location}</span>
        </div>
      )}
    </div>
  );

  // Boxed date/location block (used below portrait/square image section and for landscape + no-image)
  const infoBar = (dateFormatted || location || item.admission) ? (
    <div style={{
      display: "flex", flexDirection: "column", gap: "6px",
      background: "var(--paper-deep)", borderRadius: "var(--radius-lg)",
      border: "1px solid var(--rule)",
      padding: "0.75rem 0.9rem",
    }}>
      {dateFormatted && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {clockIcon}
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
            {pinIcon}
          </div>
          {location}
        </div>
      )}
      {item.admission && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--ink-soft)", fontWeight: 500 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: "rgba(122,36,28,0.08)", color: "var(--ochre)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {ticketIcon}
          </div>
          {item.admission}
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
        {/* Header bar — actions only */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "0.7rem 1rem",
          borderBottom: "none",
          flexShrink: 0,
          background: "var(--paper)",
          zIndex: 1,
        }}>
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

          {/* LANDSCAPE — image full-width, no overlay; badge + title + infoBar below */}
          {item.image && isLandscape && (
            <>
              <div style={{ padding: "1rem 1rem 0", flexShrink: 0 }}>
                <img
                  src={item.image}
                  alt=""
                  onClick={() => setLightboxOpen(true)}
                  style={{ width: "100%", display: "block", maxHeight: "280px", objectFit: "cover", borderRadius: "var(--radius-xl)", cursor: "zoom-in" }}
                />
              </div>
              <div style={{ padding: "1rem 1.25rem 0.25rem" }}>
                <div style={{ marginBottom: "0.6rem" }}>{communityBadge}</div>
                <h2 style={{
                  fontWeight: 700, fontSize: "1.45rem", lineHeight: 1.25,
                  color: "var(--ink)", margin: "0 0 0.85rem",
                }}>
                  {displayTitle}
                </h2>
                {infoBar && <div style={{ marginBottom: "1rem" }}>{infoBar}</div>}
              </div>
            </>
          )}

          {/* PORTRAIT / SQUARE — mobile: stacked (image top, content below); desktop: side-by-side */}
          {item.image && isPortraitOrSquare && (
            isMobile ? (
              <>
                <div style={{ padding: "0.75rem 0.75rem 0" }}>
                  <img
                    src={item.image}
                    alt=""
                    onClick={() => setLightboxOpen(true)}
                    style={{ width: "100%", display: "block", height: "220px", objectFit: "cover", borderRadius: "var(--radius-xl)", cursor: "zoom-in" }}
                  />
                </div>
                <div style={{ padding: "0.85rem 1rem 0.25rem" }}>
                  <div style={{ marginBottom: "0.5rem" }}>{communityBadge}</div>
                  <h2 style={{ fontWeight: 700, fontSize: "1.45rem", lineHeight: 1.25, color: "var(--ink)", margin: "0 0 0.75rem" }}>
                    {displayTitle}
                  </h2>
                  {infoBar && <div style={{ marginBottom: "0.75rem" }}>{infoBar}</div>}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "row", borderBottom: "1px solid var(--rule)", padding: "1rem 0 1rem 1rem", gap: "0.75rem" }}>
                <div style={{ width: "40%", flexShrink: 0, overflow: "hidden", maxHeight: "280px", borderRadius: "var(--radius-xl)" }}>
                  <img
                    src={item.image}
                    alt=""
                    onClick={() => setLightboxOpen(true)}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in" }}
                  />
                </div>
                <div style={{
                  flex: 1, padding: "1.1rem 1.1rem", display: "flex",
                  flexDirection: "column", justifyContent: "flex-start", gap: "0.65rem",
                  minWidth: 0, overflowY: "auto",
                }}>
                  <div>{communityBadge}</div>
                  <h2 style={{ fontWeight: 700, fontSize: "2.1rem", lineHeight: 1.2, color: "var(--ink)", margin: 0 }}>
                    {displayTitle}
                  </h2>
                  {infoBar}
                </div>
              </div>
            )
          )}

          {/* NO IMAGE — dark accent bar as placeholder */}
          {!item.image && (
            <div style={{ height: "64px", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "2rem", opacity: 0.1 }}>🎉</span>
            </div>
          )}

          <div style={{ padding: "1.25rem 1.25rem 0.5rem" }}>

            {/* Title + infoBar for no-image case */}
            {!item.image && (
              <>
                <div style={{ marginBottom: "0.6rem" }}>{communityBadge}</div>
                <h2 style={{
                  fontWeight: 700, fontSize: "1.45rem", lineHeight: 1.25,
                  color: "var(--ink)", margin: "0 0 0.85rem",
                }}>
                  {displayTitle}
                </h2>
                {infoBar && <div style={{ marginBottom: "1rem" }}>{infoBar}</div>}
              </>
            )}

            {/* Host + RSVP / tickets row */}
            {(authorName || item.rsvpEnabled || item.ticketUrl) && (
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: isMobile ? "10px" : "12px",
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
                  <RsvpToggle postId={item.wpId} initialCount={item.rsvpCount} capacity={item.rsvpCapacity} isOwn={isOwn} />
                )}
                {item.ticketUrl && !item.rsvpEnabled && (
                  <a
                    href={item.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "6px 18px", borderRadius: "var(--radius-full)",
                      background: "var(--ochre)", color: "#fff",
                      fontSize: "0.78rem", fontWeight: 700, textDecoration: "none",
                      letterSpacing: "0.03em", flexShrink: 0,
                    }}
                  >
                    Get tickets →
                  </a>
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

            {/* Reactions */}
            {item.wpId && (
              <div style={{ paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
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
                  <div style={{ display: "flex", gap: "4px" }}>
                    <select
                      value={editCurrency}
                      onChange={e => setEditCurrency(e.target.value)}
                      style={{ background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.4rem", flexShrink: 0, outline: "none" }}
                    >
                      <option value="">—</option>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      placeholder={editCurrency ? "e.g. 2,000" : "e.g. Free, 2,000"}
                      style={{ flex: 1, background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "var(--radius-md)", color: "var(--ink)", fontFamily: "inherit", fontSize: "0.9rem", padding: "0.65rem 0.9rem", boxSizing: "border-box", outline: "none" }}
                    />
                  </div>
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

      {/* Lightbox */}
      {lightboxOpen && item.image && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9500,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={item.image}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "var(--radius-xl)", display: "block" }}
          />
          <button
            onClick={() => setLightboxOpen(false)}
            style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", width: "40px", height: "40px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

    </div>
  );
}
