"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ComposerModal from "@/components/pulse/ComposerModal";
import "@/app/pulse-layout.css";
import {
  SHELF_STATUSES,
  statusLabel,
  type MediumOrOther,
  type ShelfStatus,
  type DirectoryFollowStatus,
} from "@/lib/reading-tracker";

interface EntryState {
  directoryId: number;
  medium: MediumOrOther;
  status: ShelfStatus | null;
  rating: number;
}

// Types where it makes sense to log (consume/experience/visit)
const LOG_TYPES    = new Set(["film", "book", "album", "tv-series", "food", "place"]);
// Types where it makes sense to write a review
const REVIEW_TYPES = new Set(["film", "book", "album", "tv-series", "food", "place", "artwork"]);
// Types where the Follow action lives in the action bar (not in a standalone pill below the cover)
const FOLLOW_BAR_TYPES = new Set(["person", "movement", "artwork", "genre", "concept", "fashion"]);

export default function EntryActionBar({
  directoryId,
  isLoggedIn,
  slug,
  entryTitle,
  quoteLinkRole,
  quoteLinkType,
  typeSlug,
  prefilledAuthor,
}: {
  directoryId: number;
  isLoggedIn: boolean;
  slug: string;
  entryTitle: string;
  quoteLinkRole: "author" | "source";
  quoteLinkType?: string;
  typeSlug?: string;
  /** Primary artist/author name to pre-populate the "Who said it?" field when
   * opening the Save a Line composer from a source-type entry (album, book, film). */
  prefilledAuthor?: string;
}) {
  const [state, setState]       = useState<EntryState | null>(null);
  const [logOpen, setLogOpen]   = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [followStatus, setFollowStatus] = useState<DirectoryFollowStatus | null>(null);
  const [followBusy, setFollowBusy]     = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reading/entry?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {}
  }, [directoryId]);

  const loadFollow = useCallback(async () => {
    try {
      const res = await fetch(`/api/directory/${directoryId}/follow-status`, { cache: "no-store" });
      if (res.ok) setFollowStatus(await res.json());
    } catch {}
  }, [directoryId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isLoggedIn || !typeSlug || !FOLLOW_BAR_TYPES.has(typeSlug)) return;
    loadFollow();
  }, [isLoggedIn, typeSlug, loadFollow]);

  async function toggleFollow() {
    if (followBusy || !followStatus) return;
    const next = !followStatus.isFollowing;
    setFollowStatus({ isFollowing: next, followersCount: followStatus.followersCount + (next ? 1 : -1) });
    setFollowBusy(true);
    try {
      const res = await fetch(`/api/directory/${directoryId}/${next ? "follow" : "unfollow"}`, { method: "POST" });
      if (res.ok) setFollowStatus(await res.json());
      else loadFollow();
    } catch { loadFollow(); }
    setFollowBusy(false);
  }

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setLogOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function pick(status: ShelfStatus) {
    if (!isLoggedIn || busy) return;
    setLogOpen(false);
    setBusy(true);
    try {
      const res = await fetch("/api/reading/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, status }),
      });
      if (res.ok) setState((prev) => (prev ? { ...prev, status } : prev));
    } catch {}
    setBusy(false);
  }

  async function remove() {
    if (busy) return;
    setLogOpen(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/reading/shelf?directory_id=${directoryId}`, { method: "DELETE" });
      if (res.ok) setState((prev) => (prev ? { ...prev, status: null, rating: 0 } : prev));
    } catch {}
    setBusy(false);
  }

  const showLog    = !typeSlug || LOG_TYPES.has(typeSlug);
  const showReview = !typeSlug || REVIEW_TYPES.has(typeSlug);
  const hasLog = showLog && state && state.medium !== "other";

  // Follow button lives in the action bar for types that don't have Review or Log
  const isFollowBarType = !!typeSlug && FOLLOW_BAR_TYPES.has(typeSlug);
  // Show Follow in the Review slot when this type can't be reviewed
  const showFollowInReviewSlot = !showReview && isFollowBarType;
  // Show Follow in the Log slot when this type can be reviewed but not logged
  const showFollowInLogSlot    = showReview && !showLog && isFollowBarType;
  const isSet  = !!state?.status;
  const medium = state?.medium ?? "book";

  const authorEntry = quoteLinkRole === "author" ? { id: directoryId, title: entryTitle } : undefined;
  const sourceEntry = quoteLinkRole === "source" ? { id: directoryId, title: entryTitle } : undefined;
  const QUOTE_TYPE_MAP: Record<string, string> = { book: "Book", film: "Film", album: "Song" };
  const quoteType = quoteLinkRole === "author"
    ? "Person"
    : (quoteLinkType ? QUOTE_TYPE_MAP[quoteLinkType] : undefined);

  const REVIEW_SUBTYPE_MAP: Record<string, "place" | "food" | "music" | "book" | "film"> = {
    book: "book",
    film: "film",
    album: "music",
  };
  const reviewSubtype = quoteLinkType ? REVIEW_SUBTYPE_MAP[quoteLinkType] : undefined;
  const initialReview = reviewSubtype
    ? { subtype: reviewSubtype, entry: { id: directoryId, title: entryTitle, slug } }
    : undefined;

  return (
    <div className="dir-action-bar" ref={wrapRef}>
      <div className="dir-action-row">

        {/* Review slot — Review for reviewable types, Follow for follow-bar types that can't be reviewed */}
        {showReview ? (
          <button
            type="button"
            className="dir-action-btn"
            onClick={() => setReviewOpen(true)}
            aria-label="Write a review"
          >
            <svg className="dir-action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 11.5V14h2.5l7.5-7.5-2.5-2.5L2 11.5z"/>
              <path d="M11.5 3.5l1-1 1 1-1 1-1-1z"/>
            </svg>
            <span className="dir-action-label">Review</span>
          </button>
        ) : showFollowInReviewSlot && (
          <button
            type="button"
            className={`dir-action-btn${followStatus?.isFollowing ? " dir-action-btn--active" : ""}`}
            onClick={toggleFollow}
            disabled={followBusy || (!followStatus && isLoggedIn)}
            aria-label={followStatus?.isFollowing ? "Unfollow" : "Follow"}
          >
            <svg className="dir-action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {followStatus?.isFollowing
                ? <><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M11 7l1.5 1.5L15 6"/></>
                : <><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M12.5 6v4M10.5 8h4"/></>
              }
            </svg>
            <span className="dir-action-label">
              {followStatus?.isFollowing ? "Following" : "Follow"}
            </span>
          </button>
        )}

        {/* Save a Line */}
        <button
          type="button"
          className="dir-action-btn"
          onClick={() => setSaveOpen(true)}
          aria-label="Save a line"
        >
          <svg className="dir-action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2h10v12.5L8 11 3 14.5V2z"/>
          </svg>
          <span className="dir-action-label">Save Line</span>
        </button>

        {/* Log slot — Log for loggable types, Follow for follow-bar types that can be reviewed but not logged */}
        {showLog && hasLog ? (
          <button
            type="button"
            className={`dir-action-btn${isSet ? " dir-action-btn--active" : ""}`}
            onClick={() => isLoggedIn ? setLogOpen((v) => !v) : undefined}
            disabled={busy}
            aria-expanded={logOpen}
            aria-label="Reading log"
          >
            <svg className="dir-action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {isSet
                ? <><circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4"/></>
                : <><circle cx="8" cy="8" r="6"/><path d="M8 5v3h2.5"/></>
              }
            </svg>
            <span className="dir-action-label">
              {isSet ? statusLabel(state!.status!, medium as MediumOrOther) : "Add to Log"}
            </span>
          </button>
        ) : showFollowInLogSlot && (
          <button
            type="button"
            className={`dir-action-btn${followStatus?.isFollowing ? " dir-action-btn--active" : ""}`}
            onClick={toggleFollow}
            disabled={followBusy || (!followStatus && isLoggedIn)}
            aria-label={followStatus?.isFollowing ? "Unfollow" : "Follow"}
          >
            <svg className="dir-action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {followStatus?.isFollowing
                ? <><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M11 7l1.5 1.5L15 6"/></>
                : <><circle cx="6" cy="4.5" r="2.5"/><path d="M1 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M12.5 6v4M10.5 8h4"/></>
              }
            </svg>
            <span className="dir-action-label">
              {followStatus?.isFollowing ? "Following" : "Follow"}
            </span>
          </button>
        )}

        {/* Improve */}
        <a
          href={`/directory/submit?improve=${slug}`}
          className="dir-action-btn dir-action-btn--link"
          aria-label="Improve this entry"
        >
          <svg className="dir-action-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v12M2 8h12"/>
          </svg>
          <span className="dir-action-label">Improve</span>
        </a>

      </div>

      {/* Log dropdown */}
      {logOpen && hasLog && (
        <div className="dir-log-options dir-action-log-panel">
          {SHELF_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`dir-log-option${state?.status === s ? " dir-log-option--active" : ""}`}
              onClick={() => pick(s)}
              disabled={busy}
            >
              <span className="dir-log-option-check">{state?.status === s ? "✓" : ""}</span>
              {statusLabel(s, medium as MediumOrOther)}
            </button>
          ))}
          {isSet && (
            <button
              type="button"
              className="dir-log-option dir-log-option--remove"
              onClick={() => { setLogOpen(false); remove(); }}
              disabled={busy}
            >
              <span className="dir-log-option-check" />
              Remove from log
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <ComposerModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        initialTab="quote"
        initialQuote={{ authorEntry, sourceEntry, quoteType, authorName: prefilledAuthor }}
      />
      <ComposerModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        initialTab="review"
        initialReview={initialReview}
      />
    </div>
  );
}
