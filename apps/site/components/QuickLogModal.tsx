"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SHELF_STATUSES,
  statusLabel,
  type MediumOrOther,
  type ShelfStatus,
} from "@/lib/reading-tracker";
import "./QuickLogModal.css";

interface EntryState {
  directoryId: number;
  medium: MediumOrOther;
  status: ShelfStatus | null;
  rating: number;
}

interface Props {
  entry: { id: number; title: string; thumbnail: string | null } | null;
  isLoggedIn: boolean;
  onClose: () => void;
}

export default function QuickLogModal({ entry, isLoggedIn, onClose }: Props) {
  const [state, setState] = useState<EntryState | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading/entry?directory_id=${id}`, { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (entry) {
      setState(null);
      load(entry.id);
    }
  }, [entry, load]);

  useEffect(() => {
    if (!entry) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [entry, onClose]);

  async function pick(status: ShelfStatus) {
    if (!entry || !isLoggedIn || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: entry.id, status }),
      });
      if (res.ok) setState((prev) => prev ? { ...prev, status } : prev);
    } catch {}
    setBusy(false);
  }

  async function rate(n: number) {
    if (!entry || !isLoggedIn || busy || !state) return;
    const next = n === state.rating ? 0 : n;
    setBusy(true);
    try {
      const res = await fetch("/api/reading/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: entry.id, rating: next }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setState((prev) => prev
          ? { ...prev, rating: next, status: (data?.status ?? prev.status) as ShelfStatus | null }
          : prev
        );
      }
    } catch {}
    setBusy(false);
  }

  async function remove() {
    if (!entry || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reading/shelf?directory_id=${entry.id}`, { method: "DELETE" });
      if (res.ok) setState((prev) => prev ? { ...prev, status: null, rating: 0 } : prev);
    } catch {}
    setBusy(false);
  }

  if (!entry) return null;

  const medium = state?.medium ?? "film";
  const isLoggable = !state || state.medium !== "other";
  const isWatched  = state?.status === "read";

  return (
    <div className="qlm-backdrop" onClick={onClose} role="dialog" aria-modal>
      <div className="qlm-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="qlm-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="qlm-entry">
          {entry.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.thumbnail} alt="" className="qlm-thumb" />
          )}
          <div className="qlm-entry-title">{entry.title}</div>
        </div>

        {loading ? (
          <div className="qlm-loading">Loading…</div>
        ) : !isLoggable ? (
          <p className="qlm-note">This entry type can&rsquo;t be logged.</p>
        ) : !isLoggedIn ? (
          <p className="qlm-note"><a href="/login">Sign in</a> to add this to your log.</p>
        ) : (
          <>
            <div className="qlm-statuses">
              {SHELF_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`qlm-status${state?.status === s ? " qlm-status--active" : ""}`}
                  onClick={() => state?.status === s ? remove() : pick(s)}
                  disabled={busy}
                >
                  {state?.status === s && <span className="qlm-check" aria-hidden>✓</span>}
                  {statusLabel(s, medium)}
                </button>
              ))}
            </div>

            {isWatched && (
              <div className="qlm-rate">
                <div className="qlm-rate-hint">
                  {state!.rating > 0 ? "Tap to change your rating" : "How was it? (optional)"}
                </div>
                <div className="qlm-stars" role="group" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`qlm-star${n <= state!.rating ? " qlm-star--on" : ""}`}
                      onClick={() => rate(n)}
                      disabled={busy}
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    >
                      {n <= state!.rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
