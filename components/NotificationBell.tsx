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

export default function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Poll for unread count every 30 seconds.
  useEffect(() => {
    if (!loggedIn) return;
    fetchCount();
    const id = setInterval(fetchCount, 30000);
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          color: "#14110d",
          lineHeight: 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: 2,
            right: 2,
            background: "#c5491f",
            color: "#fff",
            borderRadius: "50%",
            width: 14,
            height: 14,
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: "min(340px, calc(100vw - 32px))",
          maxHeight: 440,
          overflowY: "auto",
          background: "#fff",
          border: "1px solid rgba(42,36,28,.12)",
          borderRadius: 6,
          boxShadow: "0 8px 32px rgba(20,17,13,.12)",
          zIndex: 200,
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
                  color: "#b38238",
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
                    background: isUnread ? "rgba(179,130,56,.04)" : "transparent",
                    cursor: "pointer",
                    transition: "background .15s",
                  }}
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
                    <div style={{ fontSize: "0.66rem", color: "#9c8e7a", marginTop: 4 }}>
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

          {items.length >= 20 && (
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <Link
                href="/member/notifications"
                style={{ fontSize: "0.75rem", color: "#b38238", textDecoration: "none" }}
                onClick={() => setOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
