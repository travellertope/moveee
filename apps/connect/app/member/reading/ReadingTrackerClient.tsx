"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import DirectorySearch from "@/components/composer/DirectorySearch";
import {
  MEDIA,
  MEDIUM_LABELS,
  MEDIUM_EMOJI,
  SHELF_STATUSES,
  statusLabel,
  type Medium,
  type MediumOrOther,
  type ShelfStatus,
  type ShelfEntry,
  type ShelfCounts,
  type ReadingGoal,
} from "@/lib/reading-tracker";

interface DirectoryResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
  about?: string;
  city?: string;
}

/**
 * How to search for / create an entry of each medium. `typeFilter` is a single
 * slug on purpose: DirectorySearch reuses the same value as the `entry_type`
 * it creates with, so a comma list would widen search at the cost of creating
 * entries with a nonsense type. Place therefore searches `place` only and
 * won't surface `restaurant`-typed entries here — a narrower search is the
 * better half of that trade.
 */
const MEDIA_SEARCH: Record<
  Medium,
  {
    typeFilter: string;
    placeholder: string;
    aboutFieldLabel?: string;
    externalSource?: "google_books" | "spotify" | "tmdb";
  }
> = {
  book: {
    typeFilter: "book",
    placeholder: "Search for a book…",
    aboutFieldLabel: "Author",
    externalSource: "google_books",
  },
  film: {
    typeFilter: "film",
    placeholder: "Search for a film or series…",
    aboutFieldLabel: "Director",
    externalSource: "tmdb",
  },
  music: {
    typeFilter: "album",
    placeholder: "Search for an album…",
    aboutFieldLabel: "Artist",
    externalSource: "spotify",
  },
  food: { typeFilter: "food", placeholder: "Search for a dish…" },
  place: { typeFilter: "place", placeholder: "Search for a place…" },
};

const EMPTY_COUNTS: ShelfCounts = {
  want_to_read: 0,
  currently_reading: 0,
  read: 0,
  total: 0,
  byMedium: {} as ShelfCounts["byMedium"],
};

export default function ReadingTrackerClient() {
  const [tab, setTab] = useState<ShelfStatus>("want_to_read");
  const [medium, setMedium] = useState<MediumOrOther | "all">("all");
  const [counts, setCounts] = useState<ShelfCounts>(EMPTY_COUNTS);
  const [entries, setEntries] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMedium, setAddMedium] = useState<Medium>("book");
  const [adding, setAdding] = useState<DirectoryResult | null>(null);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/reading/shelf/counts");
      if (res.ok) setCounts({ ...EMPTY_COUNTS, ...(await res.json()) });
    } catch {}
  }, []);

  const loadGoal = useCallback(async () => {
    try {
      const res = await fetch("/api/reading/goal");
      if (res.ok) setGoal(await res.json());
    } catch {}
  }, []);

  async function saveGoal() {
    const target = parseInt(goalInput, 10);
    if (!target || target < 1) return;
    try {
      const res = await fetch("/api/reading/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_books: target }),
      });
      if (res.ok) setGoal(await res.json());
    } catch {}
    setEditingGoal(false);
  }

  const loadShelf = useCallback(async (status: ShelfStatus, med: MediumOrOther | "all") => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status });
      if (med !== "all") qs.set("medium", med);
      const res = await fetch(`/api/reading/shelf?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCounts();
    loadGoal();
  }, [loadCounts, loadGoal]);

  useEffect(() => {
    loadShelf(tab, medium);
  }, [tab, medium, loadShelf]);

  // Only offer a medium chip once something is actually on that shelf —
  // an empty "Music (0)" chip is noise, not a feature.
  const mediumChips = useMemo(() => {
    const present = ([...MEDIA, "other"] as MediumOrOther[]).filter(
      (m) => (counts.byMedium?.[m]?.total ?? 0) > 0,
    );
    return present.length > 1 ? present : [];
  }, [counts]);

  const tabCount = (status: ShelfStatus) =>
    medium === "all" ? counts[status] : counts.byMedium?.[medium]?.[status] ?? 0;

  async function moveShelf(directoryId: number, status: ShelfStatus) {
    // Optimistic: drop the card from the currently-viewed tab immediately if
    // it's moving away from it, since a full refetch of the counts is cheap
    // but re-rendering the moved card is not worth the flicker.
    setEntries((prev) => (status === tab ? prev : prev.filter((e) => e.directoryId !== directoryId)));
    try {
      await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, status }),
      });
    } catch {}
    loadCounts();
    if (status === "read") loadGoal();
    if (status === tab) loadShelf(tab, medium);
  }

  /**
   * One tap, no review. Optimistic because a star row that waits on a round
   * trip feels broken; the refetches below reconcile it.
   *
   * Tapping the star you're already on clears the rating (0) rather than
   * re-setting it — the only way back out of a misfire.
   */
  async function rate(directoryId: number, current: number, next: number) {
    const value = current === next ? 0 : next;
    setEntries((prev) =>
      prev.map((e) => (e.directoryId === directoryId ? { ...e, rating: value } : e)),
    );
    try {
      await fetch("/api/reading/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, rating: value }),
      });
    } catch {}
    // A rating > 0 also marks the entry read server-side, so a card rated
    // from the want-to/in-progress tab leaves that tab — refetch both.
    if (value > 0 && tab !== "read") {
      loadShelf(tab, medium);
      loadGoal();
    }
    loadCounts();
  }

  async function removeFromShelf(directoryId: number) {
    setEntries((prev) => prev.filter((e) => e.directoryId !== directoryId));
    try {
      await fetch(`/api/reading/shelf?directory_id=${directoryId}`, { method: "DELETE" });
    } catch {}
    loadCounts();
  }

  async function addEntry(entry: DirectoryResult) {
    setAdding(entry);
    try {
      await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: entry.id, status: "want_to_read" }),
      });
      setShowAddModal(false);
      setAdding(null);
      loadCounts();
      if (tab === "want_to_read") loadShelf("want_to_read", medium);
    } catch {
      setAdding(null);
    }
  }

  const search = MEDIA_SEARCH[addMedium];
  const target = goal?.target ?? goal?.targetBooks ?? null;
  const logged = goal?.logged ?? goal?.booksRead ?? 0;

  return (
    <>
      <div className="rt-toolbar">
        <button type="button" className="rt-add-btn" onClick={() => setShowAddModal(true)}>
          + Add to your log
        </button>
        <Link href="/member/reading/stats" className="rt-stats-link">
          Your Year in Culture →
        </Link>
      </div>

      {goal && (
        <div className="rt-goal-card">
          {editingGoal || target === null ? (
            <div className="rt-goal-edit">
              <label className="rt-goal-label" htmlFor="rt-goal-input">
                Set your {goal.year} goal
              </label>
              <div className="rt-goal-edit-row">
                <input
                  id="rt-goal-input"
                  type="number"
                  min={1}
                  className="rt-goal-input"
                  placeholder="e.g. 24"
                  defaultValue={target ?? ""}
                  onChange={(ev) => setGoalInput(ev.target.value)}
                  onKeyDown={(ev) => ev.key === "Enter" && saveGoal()}
                />
                <button type="button" className="rt-goal-save" onClick={saveGoal}>
                  Save
                </button>
                {target !== null && (
                  <button type="button" className="rt-goal-cancel" onClick={() => setEditingGoal(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button type="button" className="rt-goal-summary" onClick={() => setEditingGoal(true)}>
              <span className="rt-goal-text">
                {logged} of {target} logged this year
              </span>
              <span className="rt-goal-bar">
                <span
                  className="rt-goal-bar-fill"
                  style={{ width: `${Math.min(100, (logged / target) * 100)}%` }}
                />
              </span>
            </button>
          )}
        </div>
      )}

      {mediumChips.length > 0 && (
        <div className="rt-media">
          <button
            type="button"
            className={`rt-media-chip${medium === "all" ? " rt-media-chip--active" : ""}`}
            onClick={() => setMedium("all")}
          >
            All ({counts.total})
          </button>
          {mediumChips.map((m) => (
            <button
              key={m}
              type="button"
              className={`rt-media-chip${medium === m ? " rt-media-chip--active" : ""}`}
              onClick={() => setMedium(m)}
            >
              <span aria-hidden="true">{MEDIUM_EMOJI[m]}</span> {MEDIUM_LABELS[m]} (
              {counts.byMedium?.[m]?.total ?? 0})
            </button>
          ))}
        </div>
      )}

      <div className="wal-tabs">
        {SHELF_STATUSES.map((key) => (
          <button
            key={key}
            type="button"
            className={`wal-tab${tab === key ? " wal-tab--active" : ""}`}
            onClick={() => setTab(key)}
          >
            {statusLabel(key, medium)} ({tabCount(key)})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="rt-empty">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="rt-empty">
          {tab === "want_to_read" && "Nothing on your list yet — add something to get started."}
          {tab === "currently_reading" && "Nothing in progress right now."}
          {tab === "read" && "Nothing logged yet."}
        </p>
      ) : (
        <div className="rt-grid">
          {entries.map((e) => (
            <div className="rt-card" key={e.directoryId}>
              {e.thumbnail ? (
                <img src={e.thumbnail} alt="" className="rt-card-cover" />
              ) : (
                <div className="rt-card-cover rt-card-cover--placeholder">
                  {MEDIUM_EMOJI[e.medium] ?? "✦"}
                </div>
              )}
              <div className="rt-card-body">
                <p className="rt-card-title">{e.title}</p>
                {e.author && <p className="rt-card-author">{e.author}</p>}
                {tab === "read" && e.finishedAt && (
                  <p className="rt-card-finished">
                    Finished {new Date(e.finishedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </p>
                )}
                <div
                  className="rt-card-stars"
                  role="group"
                  aria-label={`Your rating for ${e.title}`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={
                        n <= e.rating ? "rt-star rt-star--on" : "rt-star"
                      }
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      aria-pressed={n <= e.rating}
                      onClick={() => rate(e.directoryId, e.rating, n)}
                    >
                      {n <= e.rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                <select
                  className="rt-card-select"
                  value={e.status}
                  onChange={(ev) => moveShelf(e.directoryId, ev.target.value as ShelfStatus)}
                >
                  {SHELF_STATUSES.map((key) => (
                    <option key={key} value={key}>
                      {/* the card's own medium, not the active filter — a card
                          always describes itself in its own verbs */}
                      {statusLabel(key, e.medium)}
                    </option>
                  ))}
                </select>
                <button type="button" className="rt-card-remove" onClick={() => removeFromShelf(e.directoryId)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="rt-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="rt-modal" onClick={(ev) => ev.stopPropagation()}>
            <h3 className="rt-modal-title">Add to your log</h3>
            <div className="rt-media rt-media--modal">
              {MEDIA.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`rt-media-chip${addMedium === m ? " rt-media-chip--active" : ""}`}
                  onClick={() => {
                    setAddMedium(m);
                    setAdding(null);
                  }}
                >
                  <span aria-hidden="true">{MEDIUM_EMOJI[m]}</span> {MEDIUM_LABELS[m]}
                </button>
              ))}
            </div>
            <DirectorySearch
              // Remount on medium change so the query/results don't carry over
              // from the previous type's search.
              key={addMedium}
              value={adding}
              onChange={(entry) => {
                if (entry) addEntry(entry);
              }}
              typeFilter={search.typeFilter}
              placeholder={search.placeholder}
              aboutFieldLabel={search.aboutFieldLabel}
              externalSource={search.externalSource}
            />
            <button type="button" className="rt-modal-close" onClick={() => setShowAddModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
