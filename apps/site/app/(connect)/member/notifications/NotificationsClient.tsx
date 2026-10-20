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

/* Icon + color per notification type */
const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  credit_earned:            { icon: "💰", color: "var(--gold)" },
  badge_unlocked:           { icon: "🏅", color: "var(--gold)" },
  perk_expiring:            { icon: "⏰", color: "#f59e0b" },
  perk_redeemed:            { icon: "🎟", color: "#8b5cf6" },
  cashout_approved:         { icon: "✅", color: "#10b981" },
  cashout_rejected:         { icon: "↩️", color: "#ef4444" },
  escrow_released:          { icon: "🔓", color: "#10b981" },
  comment_received:         { icon: "💬", color: "#3b82f6" },
  post_validated:           { icon: "🚀", color: "var(--ochre)" },
  system:                   { icon: "📣", color: "var(--mute)" },
  referral_received:        { icon: "🎉", color: "var(--gold)" },
  mention:                  { icon: "📌", color: "#f59e0b" },
  new_follower:             { icon: "👤", color: "#3b82f6" },
  new_follower_post:        { icon: "📰", color: "#6b7280" },
  event_rsvp:               { icon: "🎫", color: "#8b5cf6" },
  cluster_activated:        { icon: "🏘️", color: "var(--ochre)" },
  cluster_forming_expired:  { icon: "⌛", color: "#9ca3af" },
  cluster_new_host:         { icon: "🗳️", color: "#3b82f6" },
  cluster_election_started: { icon: "🏛️", color: "#3b82f6" },
  cluster_checkin_reminder: { icon: "📅", color: "#f59e0b" },
  hub_mod_appointed:        { icon: "🛡️", color: "#3b82f6" },
  hub_post_removed:         { icon: "🗑️", color: "#ef4444" },
  hub_member_removed:       { icon: "🚪", color: "#ef4444" },
  hub_new_post:             { icon: "📰", color: "#6b7280" },
  directory_new_post:       { icon: "🔖", color: "var(--gold)" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
    <div className="ntf-panel">
      <div className="ntf-panel-header">
        <h1 className="ntf-panel-heading">
          Notifications
          {unread > 0 && <span className="ntf-unread-chip">{unread} new</span>}
        </h1>
        {unread > 0 && (
          <button type="button" onClick={() => markRead()} className="ntf-mark-all">
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="ntf-empty-state">
          <div className="ntf-empty-icon">📭</div>
          <p className="ntf-empty-label">No notifications yet</p>
          <p className="ntf-empty-sub">Activity on your posts, follows, and Stoop will show up here.</p>
        </div>
      ) : (
        <div className="ntf-list">
          {visibleItems.map(n => {
            const isUnread = !n.read_at;
            const meta = TYPE_ICON[n.type] ?? { icon: "📣", color: "var(--mute)" };
            const content = (
              <>
                <div className="ntf-icon-ring" style={{ "--ntf-icon-color": meta.color } as React.CSSProperties}>
                  <span className="ntf-icon-glyph">{meta.icon}</span>
                </div>
                <div className="ntf-text-body">
                  <span className={`ntf-text-title${isUnread ? " ntf-text-title--unread" : ""}`}>{n.title}</span>
                  {n.body && <span className="ntf-text-desc">{n.body}</span>}
                </div>
                <div className="ntf-right-col">
                  <span className="ntf-time">{relativeTime(n.created_at)}</span>
                  {isUnread && <span className="ntf-dot" />}
                </div>
              </>
            );
            return n.action_url ? (
              <Link
                key={n.id}
                href={n.action_url}
                className={`ntf-card${isUnread ? " ntf-card--unread" : ""}`}
                onClick={() => isUnread && markRead(n.id)}
              >
                {content}
              </Link>
            ) : (
              <div
                key={n.id}
                className={`ntf-card${isUnread ? " ntf-card--unread" : ""}`}
                onClick={() => isUnread && markRead(n.id)}
                role={isUnread ? "button" : undefined}
              >
                {content}
              </div>
            );
          })}

          {hasMore && (
            <div className="ntf-loadmore">
              <button type="button" onClick={() => setVisibleCount(c => c + PAGE_SIZE)} className="ntf-loadmore-btn">
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
