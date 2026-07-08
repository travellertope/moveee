"use client";

import { useState } from "react";
import Link from "next/link";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  action_url: string;
  read_at: string | null;
  created_at: string;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

const PAGE_SIZE = 20;

export default function NotificationsClient({ initialItems }: { initialItems: Notification[] }) {
  const [items, setItems] = useState(initialItems);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function markRead(id?: number) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { notification_id: id } : {}),
    });
    if (id) {
      setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } else {
      setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }
  }

  const unread = items.filter(n => !n.read_at).length;

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <section className="mem-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 64,
        padding: "0 24px",
        borderBottom: "1px solid rgba(42,36,28,.08)",
        background: "rgba(245,239,229,.3)",
      }}>
        <div className="mem-card-label" style={{ margin: 0 }}>
          All Notifications {unread > 0 && <span style={{ color: "#c5491f" }}>· {unread} unread</span>}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markRead()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--ochre)",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--mute)", fontStyle: "italic", padding: 20 }}>No notifications yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "rgba(42,36,28,.06)" }}>
            {visibleItems.map(n => {
              const isUnread = !n.read_at;
              const inner = (
                <div
                  onClick={() => isUnread && markRead(n.id)}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: 20,
                    background: isUnread ? "rgba(197,73,31,.05)" : "var(--paper)",
                    cursor: isUnread ? "pointer" : "default",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ fontSize: 24, lineHeight: 1.2, flexShrink: 0 }}>
                    {TYPE_EMOJI[n.type] ?? "📣"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: 15, color: "var(--ink)", marginBottom: 2 }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div style={{ fontSize: "0.78rem", color: isUnread ? "var(--ink-soft)" : "var(--mute)", lineHeight: 1.5, marginBottom: 4 }}>
                        {n.body}
                      </div>
                    )}
                    <div style={{ fontSize: "0.7rem", color: isUnread ? "var(--mute)" : "#c8bfb0", fontFamily: "'JetBrains Mono', monospace", letterSpacing: ".04em" }}>
                      {formatDate(n.created_at)}
                    </div>
                  </div>
                  {isUnread && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c5491f", flexShrink: 0, marginTop: 5 }} />
                  )}
                </div>
              );
              return n.action_url ? (
                <Link key={n.id} href={n.action_url} style={{ textDecoration: "none", display: "block" }}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>

          {hasMore && (
            <div style={{
              padding: 16,
              display: "flex",
              justifyContent: "center",
              background: "rgba(245,239,229,.3)",
            }}>
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: "var(--mute)",
                  padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--mute)"; }}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
