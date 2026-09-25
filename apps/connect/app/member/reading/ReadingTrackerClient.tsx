"use client";

import { useEffect, useState, useCallback } from "react";
import DirectorySearch from "@/components/composer/DirectorySearch";

type ShelfStatus = "want_to_read" | "currently_reading" | "read";

const TABS: { key: ShelfStatus; label: string }[] = [
  { key: "want_to_read", label: "Want to Read" },
  { key: "currently_reading", label: "Currently Reading" },
  { key: "read", label: "Read" },
];

interface ShelfEntry {
  directoryId: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  author: string;
  averageRating: number | null;
  status: ShelfStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

interface DirectoryResult {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
  about?: string;
  city?: string;
}

interface Goal {
  year: number;
  targetBooks: number | null;
  booksRead: number;
}

export default function ReadingTrackerClient() {
  const [tab, setTab] = useState<ShelfStatus>("want_to_read");
  const [counts, setCounts] = useState<Record<ShelfStatus, number>>({
    want_to_read: 0,
    currently_reading: 0,
    read: 0,
  });
  const [entries, setEntries] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingBook, setAddingBook] = useState<DirectoryResult | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/reading/shelf/counts");
      if (res.ok) setCounts(await res.json());
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

  const loadShelf = useCallback(async (status: ShelfStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading/shelf?status=${status}`);
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
    loadShelf(tab);
  }, [tab, loadShelf]);

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
    if (status === tab) loadShelf(tab);
  }

  async function removeFromShelf(directoryId: number) {
    setEntries((prev) => prev.filter((e) => e.directoryId !== directoryId));
    try {
      await fetch(`/api/reading/shelf?directory_id=${directoryId}`, { method: "DELETE" });
    } catch {}
    loadCounts();
  }

  async function addBook(entry: DirectoryResult) {
    setAddingBook(entry);
    try {
      await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: entry.id, status: "want_to_read" }),
      });
      setShowAddModal(false);
      setAddingBook(null);
      loadCounts();
      if (tab === "want_to_read") loadShelf("want_to_read");
    } catch {
      setAddingBook(null);
    }
  }

  return (
    <>
      <button type="button" className="rt-add-btn" onClick={() => setShowAddModal(true)}>
        + Add a Book
      </button>

      {goal && (
        <div className="rt-goal-card">
          {editingGoal || goal.targetBooks === null ? (
            <div className="rt-goal-edit">
              <label className="rt-goal-label" htmlFor="rt-goal-input">
                Set your {goal.year} reading goal
              </label>
              <div className="rt-goal-edit-row">
                <input
                  id="rt-goal-input"
                  type="number"
                  min={1}
                  className="rt-goal-input"
                  placeholder="e.g. 24"
                  defaultValue={goal.targetBooks ?? ""}
                  onChange={(ev) => setGoalInput(ev.target.value)}
                  onKeyDown={(ev) => ev.key === "Enter" && saveGoal()}
                />
                <button type="button" className="rt-goal-save" onClick={saveGoal}>
                  Save
                </button>
                {goal.targetBooks !== null && (
                  <button type="button" className="rt-goal-cancel" onClick={() => setEditingGoal(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button type="button" className="rt-goal-summary" onClick={() => setEditingGoal(true)}>
              <span className="rt-goal-text">
                {goal.booksRead} of {goal.targetBooks} books this year
              </span>
              <span className="rt-goal-bar">
                <span
                  className="rt-goal-bar-fill"
                  style={{ width: `${Math.min(100, (goal.booksRead / goal.targetBooks) * 100)}%` }}
                />
              </span>
            </button>
          )}
        </div>
      )}

      <div className="wal-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`wal-tab${tab === t.key ? " wal-tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="rt-empty">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="rt-empty">
          {tab === "want_to_read" && "Nothing on your list yet — add a book to get started."}
          {tab === "currently_reading" && "You're not currently reading anything."}
          {tab === "read" && "No finished books yet."}
        </p>
      ) : (
        <div className="rt-grid">
          {entries.map((e) => (
            <div className="rt-card" key={e.directoryId}>
              {e.thumbnail ? (
                <img src={e.thumbnail} alt="" className="rt-card-cover" />
              ) : (
                <div className="rt-card-cover rt-card-cover--placeholder">📖</div>
              )}
              <div className="rt-card-body">
                <p className="rt-card-title">{e.title}</p>
                {e.author && <p className="rt-card-author">{e.author}</p>}
                {tab === "read" && e.finishedAt && (
                  <p className="rt-card-finished">
                    Finished {new Date(e.finishedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </p>
                )}
                <select
                  className="rt-card-select"
                  value={e.status}
                  onChange={(ev) => moveShelf(e.directoryId, ev.target.value as ShelfStatus)}
                >
                  {TABS.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
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
            <h3 className="rt-modal-title">Add a book</h3>
            <DirectorySearch
              value={addingBook}
              onChange={(entry) => {
                if (entry) addBook(entry);
              }}
              typeFilter="book"
              placeholder="Search for a book…"
              aboutFieldLabel="Author"
              externalSource="google_books"
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
