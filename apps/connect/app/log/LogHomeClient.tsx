"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import DirectorySearch from "@/components/composer/DirectorySearch";
import type { ShelfEntry, ReadingGoal, FollowingActivityItem } from "@/lib/reading-tracker";
import type { FeedItem } from "@/lib/unified-feed";
import NotificationBell from "@/components/NotificationBell";

const QUICK_LOG_TYPES = [
  { key: "book",  label: "Book",  emoji: "📖", typeFilter: "book",  placeholder: "Search for a book…",    aboutFieldLabel: "Author",   externalSource: "google_books" as const },
  { key: "film",  label: "Film",  emoji: "🎬", typeFilter: "film",  placeholder: "Search for a film…",    aboutFieldLabel: "Director", externalSource: "tmdb" as const },
  { key: "music", label: "Music", emoji: "🎵", typeFilter: "album", placeholder: "Search for an album…",  aboutFieldLabel: "Artist",   externalSource: "spotify" as const },
  { key: "food",  label: "Food",  emoji: "🍽️", typeFilter: "food",  placeholder: "Search for a dish…" },
  { key: "place", label: "Place", emoji: "📍", typeFilter: "place", placeholder: "Search for a place…" },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  book:  { label: "BOOK",  color: "#3A342B" },
  film:  { label: "FILM",  color: "#1976D2" },
  album: { label: "MUSIC", color: "#6D4C41" },
  music: { label: "MUSIC", color: "#6D4C41" },
  food:  { label: "FOOD",  color: "#2D7A4F" },
  place: { label: "PLACE", color: "#5B5EA6" },
};

interface DirectoryResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
  city?: string;
  about?: string;
}

interface Props {
  displayName: string;
  initial: string;
  avatarUrl: string | null;
  feedPreview: FeedItem[];
}

function decodeHtml(s?: string): string {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8230;/g, "…")
    .replace(/&nbsp;/g, " ");
}

export default function LogHomeClient({ displayName, initial, avatarUrl, feedPreview }: Props) {
  const [inProgress, setInProgress] = useState<ShelfEntry[]>([]);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [activity, setActivity] = useState<FollowingActivityItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [logModalType, setLogModalType] = useState<(typeof QUICK_LOG_TYPES)[number] | null>(null);
  const [searchValue, setSearchValue] = useState<DirectoryResult | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [progressRes, goalRes, activityRes] = await Promise.allSettled([
      fetch("/api/reading/shelf?status=currently_reading").then((r) => r.ok ? r.json() : null),
      fetch("/api/reading/goal").then((r) => r.ok ? r.json() : null),
      fetch("/api/reading/following-activity?limit=8").then((r) => r.ok ? r.json() : null),
    ]);
    if (progressRes.status === "fulfilled" && progressRes.value) {
      setInProgress(progressRes.value.entries ?? []);
    }
    if (goalRes.status === "fulfilled" && goalRes.value) {
      setGoal(goalRes.value);
    }
    if (activityRes.status === "fulfilled" && activityRes.value) {
      setActivity(activityRes.value.activity ?? []);
    } else {
      setActivity([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!logModalType) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLogModalType(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [logModalType]);

  async function finishFromProgress(entry: ShelfEntry, ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    setInProgress((prev) => prev.filter((e) => e.directoryId !== entry.directoryId));
    try {
      await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: entry.directoryId, status: "read" }),
      });
    } catch {}
    load();
  }

  async function handlePick(entry: DirectoryResult) {
    setLogModalType(null);
    setSearchValue(null);
    try {
      await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: entry.id, status: "want_to_read" }),
      });
      load();
    } catch {}
  }

  const goalTarget = goal?.target ?? goal?.targetBooks ?? null;
  const goalLogged = goal?.logged ?? goal?.booksRead ?? 0;
  const goalRemaining = goalTarget != null ? Math.max(0, goalTarget - goalLogged) : null;

  return (
    <>
      {/* ── Header ── */}
      <header className="rl-header">
        <div className="rl-avatar" aria-hidden="true">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : initial}
        </div>
        <h1 className="rl-header-title">Your log</h1>
        <div className="rl-header-actions">
          <Link href="/events" className="rl-icon-btn" aria-label="Events">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </Link>
          <NotificationBell />
        </div>
      </header>

      {/* ── Log something ── */}
      <section className="rl-section">
        <p className="rl-section-label">Log something</p>
        <div className="rl-chips">
          {QUICK_LOG_TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="rl-chip"
              onClick={() => { setSearchValue(null); setLogModalType(item); }}
            >
              <span aria-hidden="true">{item.emoji}</span>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── In progress ── */}
      {(loading || inProgress.length > 0) && (
        <section className="rl-section">
          <div className="rl-section-row">
            <p className="rl-section-label">In progress</p>
            {inProgress.length > 0 && (
              <span className="rl-section-count">{inProgress.length} open</span>
            )}
          </div>
          {loading ? (
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{ width: 158, height: 100, borderRadius: 6, flexShrink: 0 }}
                  className="rl-skeleton"
                />
              ))}
            </div>
          ) : (
            <div className="rl-progress-scroll">
              {inProgress.map((entry) => {
                const badge = TYPE_BADGE[entry.medium] ?? TYPE_BADGE.book;
                return (
                  <Link
                    key={entry.directoryId}
                    href={`/directory/${entry.slug}`}
                    className="rl-progress-card"
                  >
                    <span
                      className="rl-progress-badge"
                      style={{ background: `${badge.color}1a`, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    <p className="rl-progress-title">{entry.title}</p>
                    {entry.author && <p className="rl-progress-author">{entry.author}</p>}
                    <button
                      type="button"
                      className="rl-progress-finish"
                      onClick={(e) => finishFromProgress(entry, e)}
                    >
                      Finish · rate →
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Your year in culture ── */}
      {!loading && goal && (
        <section className="rl-section">
          <p className="rl-section-label">Your year in culture</p>
          <Link href="/member/reading/stats" className="rl-goal-card">
            <p className="rl-goal-year">{goal.year}</p>
            {goalTarget != null ? (
              <>
                <div className="rl-goal-bar-track">
                  <div
                    className="rl-goal-bar-fill"
                    style={{ width: `${Math.min(100, (goalLogged / goalTarget) * 100)}%` }}
                  />
                </div>
                <p className="rl-goal-meta">
                  {goalLogged} logged · {goalRemaining} to go
                </p>
              </>
            ) : (
              <p className="rl-goal-meta">
                {goalLogged} logged this year — set a goal to track progress →
              </p>
            )}
          </Link>
        </section>
      )}

      {/* ── From people you follow ── */}
      <section className="rl-section">
        <p className="rl-section-label">From people you follow</p>
        {activity === null || loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: 6 }} className="rl-skeleton" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="rl-empty">Follow people to see what they&apos;re logging here.</p>
        ) : (
          activity.map((item, i) => (
            <Link
              key={`${item.userId}-${item.directoryId}-${i}`}
              href={`/directory/${item.slug}`}
              className="rl-activity-card"
            >
              <div className="rl-activity-header">
                <div className="rl-activity-avatar">
                  {item.userAvatar
                    ? <img src={item.userAvatar} alt="" />
                    : item.userName.charAt(0).toUpperCase()}
                </div>
                <p className="rl-activity-meta">
                  <strong>{item.userName}</strong> logged this
                </p>
              </div>
              <p className="rl-activity-title">{item.title}</p>
              {item.author && <p className="rl-activity-author">{item.author}</p>}
              {item.rating != null && item.rating > 0 && (
                <p className="rl-activity-rating">
                  {"★".repeat(item.rating)}{"☆".repeat(Math.max(0, 5 - item.rating))} {item.rating} of 5
                </p>
              )}
              {item.reviewExcerpt && (
                <p className="rl-activity-excerpt">{item.reviewExcerpt}</p>
              )}
            </Link>
          ))
        )}
      </section>

      {/* ── Community feed preview ── */}
      <section className="rl-section">
        <div className="rl-section-row">
          <p className="rl-section-label">Community feed</p>
          <Link href="/feed" className="rl-see-all-link">See all →</Link>
        </div>
        {feedPreview.length === 0 ? (
          <p className="rl-empty">Nothing new in the feed right now.</p>
        ) : (
          feedPreview.map((item) => (
            <Link key={item.id} href={item.href ?? "/feed"} className="rl-feed-card">
              {(item.communityAuthorUsername || item.type) && (
                <p className="rl-feed-kicker">
                  {item.communityAuthorUsername
                    ? `@${item.communityAuthorUsername}`
                    : item.type}
                </p>
              )}
              <p className="rl-feed-title">
                {decodeHtml(item.title) || decodeHtml(item.excerpt)}
              </p>
              {item.excerpt && item.title && (
                <p className="rl-feed-excerpt">{decodeHtml(item.excerpt)}</p>
              )}
            </Link>
          ))
        )}
        <Link href="/feed" className="rl-see-all-btn">See all in Feed →</Link>
      </section>

      {/* ── Quick-log modal ── */}
      {logModalType && (
        <div
          className="rl-modal-overlay"
          onClick={() => setLogModalType(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Add a ${logModalType.label.toLowerCase()} to your log`}
        >
          <div
            ref={modalRef}
            className="rl-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="rl-modal-title">
              Add a {logModalType.label.toLowerCase()} to your log
            </h2>
            <DirectorySearch
              key={logModalType.key}
              value={searchValue}
              onChange={(entry) => {
                if (entry) handlePick(entry);
                else setSearchValue(null);
              }}
              typeFilter={logModalType.typeFilter}
              placeholder={logModalType.placeholder}
              aboutFieldLabel={logModalType.aboutFieldLabel}
              externalSource={logModalType.externalSource}
            />
            <button
              type="button"
              className="rl-modal-close"
              onClick={() => setLogModalType(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
