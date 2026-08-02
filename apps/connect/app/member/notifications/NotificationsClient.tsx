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
    <section className="acct-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="ntf-header">
        <span className="ntf-header-title">
          All Notifications {unread > 0 && <span>· {unread} unread</span>}
        </span>
        {unread > 0 && (
          <button type="button" onClick={() => markRead()} className="ntf-mark-all">
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="ntf-empty">No notifications yet.</p>
      ) : (
        <>
          {visibleItems.map(n => {
            const isUnread = !n.read_at;
            const rowClass = `ntf-row${isUnread ? " ntf-row--unread" : ""}`;
            const inner = (
              <>
                <div className="ntf-icon">{TYPE_EMOJI[n.type] ?? "📣"}</div>
                <div className="ntf-body">
                  <div className={`ntf-title${isUnread ? " ntf-title--unread" : ""}`}>{n.title}</div>
                  {n.body && <div className="ntf-desc">{n.body}</div>}
                  <div className="ntf-date">{formatDate(n.created_at)}</div>
                </div>
                {isUnread && <div className="ntf-dot" />}
              </>
            );
            return n.action_url ? (
              <Link key={n.id} href={n.action_url} className={rowClass} onClick={() => isUnread && markRead(n.id)}>
                {inner}
              </Link>
            ) : (
              <div key={n.id} className={rowClass} onClick={() => isUnread && markRead(n.id)}>
                {inner}
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
        </>
      )}
    </section>
  );
}
