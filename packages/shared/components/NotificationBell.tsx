"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  action_url: string;
  read_at: string | null;
  created_at: string;
  meta: Record<string, any>;
}

const TYPE_EMOJI: Record<string, string> = {
  credit_earned:    "💰",
  badge_unlocked:   "🏅",
  perk_expiring:    "⏰",
  perk_redeemed:    "🎟",
  cashout_approved: "✅",
  cashout_rejected: "↩️",
  escrow_released:  "🔓",
  comment_received: "💬",
  post_validated:   "🚀",
  system:           "📣",
  referral_received: "🎉",
  mention:           "📌",
  new_follower:      "👤",
  new_follower_post: "📰",
  event_rsvp:        "🎫",
  cluster_activated:        "🏘️",
  cluster_forming_expired:  "⌛",
  cluster_new_host:         "🗳️",
  cluster_election_started: "🏛️",
  cluster_checkin_reminder: "📅",
  hub_mod_appointed:  "🛡️",
  hub_post_removed:   "🗑️",
  hub_member_removed: "🚪",
  hub_new_post: "📰",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(m / 60);
  const d    = Math.floor(h / 24);
  if (d > 6)  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return "Just now";
}

interface NotificationBellProps {
  /** Renders a "Notifications" label (+ inline unread badge) alongside the
   * bell icon, filling the full row width — used by Header.tsx's rail
   * bottom block so this row matches its icon+label siblings (Discover
   * Culture, People Near Me, etc). Icon-only (the default) is used in the
   * mobile top bar, where there's no room for a label. */
  showLabel?: boolean;
}

export default function NotificationBell({ showLabel = false }: NotificationBellProps = {}) {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownRight, setDropdownRight] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  const loggedIn = !!(session?.user as any)?.id;

  const fetchCount = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const d = await res.json();
        setUnread(d.unread ?? 0);
      }
    } catch { /* ignore */ }
  }, [loggedIn]);

  const fetchItems = useCallback(async () => {
    if (!loggedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  // Poll for unread count every 120 s, but skip when the tab is hidden.
  useEffect(() => {
    if (!loggedIn) return;
    fetchCount();
    const id = setInterval(() => {
      if (!document.hidden) fetchCount();
    }, 120000);
    return () => clearInterval(id);
  }, [loggedIn, fetchCount]);

  // Close dropdown on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Clamp dropdown so it never overflows left viewport edge.
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dropdownW = Math.min(340, window.innerWidth - 32);
    // `right: 0` means dropdown left edge = rect.right - dropdownW
    const leftEdge = rect.right - dropdownW;
    const overflow = leftEdge < 8 ? 8 - leftEdge : 0;
    setDropdownRight(-overflow);
  }, [open]);

  async function handleOpen() {
    if (!open) {
      setOpen(true);
      await fetchItems();
    } else {
      setOpen(false);
    }
  }

  async function markRead(id?: number) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { notification_id: id } : {}),
    });
    if (id) {
      setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } else {
      setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnread(0);
    }
  }

  if (!loggedIn) return null;

  return (
    <div ref={ref} style={{ position: "relative", width: showLabel ? "100%" : undefined }}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: showLabel ? "9px 10px" : "6px",
          borderRadius: showLabel ? 4 : undefined,
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: showLabel ? 12 : 0,
          width: showLabel ? "100%" : undefined,
          color: "#14110d",
          lineHeight: 1,
          fontFamily: showLabel ? "var(--font-dm-sans), 'DM Sans', sans-serif" : undefined,
        }}
      >
        <span style={{ position: "relative", display: "flex", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {/* Icon-only context (mobile top bar) has no room for a legible
              numbered badge without it overwhelming the 18px bell — a plain
              dot indicator instead, matching the approved rail mockup's own
              icon-only treatment. The exact unread count is still visible
              once opened, or in the rail's showLabel row. */}
          {!showLabel && unread > 0 && (
            <span style={{
              position: "absolute",
              top: 1,
              right: 1,
              background: "#c5491f",
              borderRadius: "50%",
              width: 8,
              height: 8,
              border: "1.5px solid #fff",
            }} />
          )}
        </span>
        {showLabel && (
          <>
            <span style={{ fontSize: 14, fontWeight: 500, flex: 1, textAlign: "left" }}>Notifications</span>
            {unread > 0 && (
              <span style={{
                background: "#c5491f",
                color: "#fff",
                borderRadius: 9999,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
                flexShrink: 0,
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: dropdownRight,
          width: "min(340px, calc(100vw - 32px))",
          maxHeight: 440,
          overflowY: "auto",
          background: "#fff",
          border: "1px solid rgba(42,36,28,.12)",
          borderRadius: 6,
          boxShadow: "0 10px 25px -5px rgba(20,17,13,0.15), 0 8px 10px -6px rgba(20,17,13,0.1)",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(42,36,28,.08)",
            position: "sticky",
            top: 0,
            background: "#fff",
          }}>
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#14110d" }}>
              Notifications {unread > 0 && <span style={{ color: "#c5491f" }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead()}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#c5491f",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div style={{ padding: "20px 16px", textAlign: "center", fontSize: "0.8rem", color: "#7a6f5c" }}>
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: "0.8rem", color: "#7a6f5c" }}>
              No notifications yet.
            </div>
          ) : (
            items.map(n => {
              const isUnread = !n.read_at;
              const content = (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(42,36,28,.06)",
                    background: isUnread ? "rgba(197,73,31,.05)" : "#fff",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isUnread ? "rgba(197,73,31,.1)" : "#f9fafb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isUnread ? "rgba(197,73,31,.05)" : "#fff"; }}
                  onClick={() => isUnread && markRead(n.id)}
                >
                  <div style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.2, marginTop: 1 }}>
                    {TYPE_EMOJI[n.type] ?? "📣"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "0.78rem",
                      fontWeight: isUnread ? 700 : 500,
                      color: "#14110d",
                      marginBottom: 2,
                      lineHeight: 1.3,
                    }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div style={{
                        fontSize: "0.72rem",
                        color: "#7a6f5c",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      } as any}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: "0.66rem", color: "#c8bfb0", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {isUnread && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c5491f", flexShrink: 0, marginTop: 6 }} />
                  )}
                </div>
              );

              return n.action_url ? (
                <Link key={n.id} href={n.action_url} style={{ textDecoration: "none", display: "block" }} onClick={() => setOpen(false)}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })
          )}

          {!loading && (
            <Link
              href="/member/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "12px 16px",
                textAlign: "center",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#14110d",
                background: "#f5f5f5",
                borderTop: "1px solid rgba(42,36,28,.08)",
                position: "sticky",
                bottom: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e8e4db"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f5f5f5"; }}
            >
              View all notifications →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
