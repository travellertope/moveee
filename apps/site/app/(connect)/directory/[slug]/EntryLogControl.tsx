"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SHELF_STATUSES,
  statusLabel,
  type MediumOrOther,
  type ShelfStatus,
} from "@/lib/reading-tracker";

// The shelf control on a directory entry's own page — the shortcut the Culture
// Log shipped without. Until this, the only way to shelve something was the
// "+ Add a Book" modal on /member/reading, which means finding the thing again
// from a screen that isn't the thing. Here the entry is already in front of
// you.
//
// Rating is deliberately one tap and never asks for a review: POST
// reading/rating also moves the entry to `read` server-side, so a member who
// only ever rates never has to think about shelves at all.

interface EntryState {
  directoryId: number;
  medium: MediumOrOther;
  status: ShelfStatus | null;
  rating: number;
}

export default function EntryLogControl({
  directoryId,
  isLoggedIn,
}: {
  directoryId: number;
  isLoggedIn: boolean;
}) {
  const [state, setState] = useState<EntryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading/entry?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function pick(status: ShelfStatus) {
    if (!isLoggedIn || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, status }),
      });
      if (res.ok) {
        // Moving off `read` leaves the rating in place on purpose — a re-read
        // shouldn't erase what you thought of it the first time.
        setState((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch {}
    setBusy(false);
  }

  async function rate(rating: number) {
    if (!isLoggedIn || busy) return;
    const next = rating === state?.rating ? 0 : rating;
    setBusy(true);
    try {
      const res = await fetch("/api/reading/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, rating: next }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setState((prev) =>
          prev ? { ...prev, rating: next, status: (data?.status ?? prev.status) as ShelfStatus | null } : prev
        );
      }
    } catch {}
    setBusy(false);
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reading/shelf?directory_id=${directoryId}`, { method: "DELETE" });
      if (res.ok) setState((prev) => (prev ? { ...prev, status: null, rating: 0 } : prev));
    } catch {}
    setBusy(false);
  }

  // A person, a movement, a concept has no shelf — you don't finish someone,
  // and TYPE_MEDIA_MAP resolves all of them to 'other'. Those entries still
  // accrue saved lines and reviews; they just have nothing to log.
  if (loading || !state || state.medium === "other") return null;

  const medium = state.medium;
  const isRead = state.status === "read";

  return (
    <div className="dir-log">
      <div className="dir-log-label">Add to your log</div>

      <div className="dir-log-statuses">
        {SHELF_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`dir-log-status${state.status === s ? " dir-log-status--active" : ""}`}
            onClick={() => pick(s)}
            disabled={busy || !isLoggedIn}
            aria-pressed={state.status === s}
          >
            {statusLabel(s, medium)}
          </button>
        ))}
      </div>

      {isRead && isLoggedIn && (
        <div className="dir-log-rate">
          <div className="dir-log-rate-line">
            {state.rating > 0 ? "Saved. Tap again to change it." : "How was it? One tap, no review needed."}
          </div>
          <div className="dir-log-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`dir-log-star${n <= state.rating ? " dir-log-star--on" : ""}`}
                onClick={() => rate(n)}
                disabled={busy}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
              >
                {n <= state.rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <a className="dir-log-signin" href="/login">
          Sign in to log this →
        </a>
      )}

      {isLoggedIn && state.status && (
        <button type="button" className="dir-log-remove" onClick={remove} disabled={busy}>
          Remove from your log
        </button>
      )}
    </div>
  );
}
