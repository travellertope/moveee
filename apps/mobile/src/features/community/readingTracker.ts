// Reading Tracker — mood/pace constants. Mirrors
// packages/shared/lib/reading-tracker.ts (web) and
// Culture_Reading_Tracker::MOOD_TAGS (PHP source of truth) — kept in sync by
// hand, no shared source of truth across the PHP/TS boundary or between this
// file and the web copy, since apps/mobile can't import packages/shared
// (RN vs DOM). See docs/reading-tracker-plan.md §1.3/§7 — this list is fixed
// at 12 tags, never admin-configurable.

export const MOOD_TAGS = [
  "dark",
  "emotional",
  "funny",
  "reflective",
  "adventurous",
  "mysterious",
  "hopeful",
  "tense",
  "sad",
  "informative",
  "lighthearted",
  "inspiring",
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

export const MOOD_LABELS: Record<MoodTag, string> = {
  dark: "Dark",
  emotional: "Emotional",
  funny: "Funny",
  reflective: "Reflective",
  adventurous: "Adventurous",
  mysterious: "Mysterious",
  hopeful: "Hopeful",
  tense: "Tense",
  sad: "Sad",
  informative: "Informative",
  lighthearted: "Lighthearted",
  inspiring: "Inspiring",
};

export const PACES = ["slow", "medium", "fast"] as const;
export type Pace = (typeof PACES)[number];

export const PACE_LABELS: Record<Pace, string> = {
  slow: "Slow",
  medium: "Medium",
  fast: "Fast",
};

export interface BookMoodPace {
  directoryId: number;
  moods: string[];
  pace: Pace | null;
  myVote: { moods: string[]; pace: Pace } | null;
}

// ─────────────────────────────────────────────────────────────────────────
//  Media (September 2026) — the log covers all five review types, not just
//  books. PHP source of truth: Culture_Reading_Tracker::MEDIA /
//  ::TYPE_MEDIA_MAP. Mirrored again in apps/mobile's own copy of this file —
//  keep all three in sync.
//
//  The three shelf *statuses* are unchanged and medium-neutral in the DB; only
//  their labels vary by medium, which is what STATUS_LABELS below is for.
// ─────────────────────────────────────────────────────────────────────────

export const MEDIA = ["book", "film", "music", "food", "place"] as const;
export type Medium = (typeof MEDIA)[number];
// "other" never appears in MEDIA — it's the computed fallback for a shelved
// entry whose culture_dir_type maps to none of the five.
export type MediumOrOther = Medium | "other";

export const MEDIUM_LABELS: Record<MediumOrOther, string> = {
  book: "Books",
  film: "Film & TV",
  music: "Music",
  food: "Food",
  place: "Places",
  other: "Other",
};

export const MEDIUM_EMOJI: Record<MediumOrOther, string> = {
  book: "📚",
  film: "🎬",
  music: "🎧",
  food: "🍽",
  place: "📍",
  other: "✦",
};

export const SHELF_STATUSES = [
  "want_to_read",
  "currently_reading",
  "read",
] as const;
export type ShelfStatus = (typeof SHELF_STATUSES)[number];

// Per-medium verbs for the same three underlying statuses. `all` is what the
// tabs read when no medium filter is active — deliberately neutral, since one
// label has to cover a book, a restaurant and an album at once.
export const STATUS_LABELS: Record<
  MediumOrOther | "all",
  Record<ShelfStatus, string>
> = {
  all: { want_to_read: "Planned", currently_reading: "In progress", read: "Done" },
  book: { want_to_read: "Want to Read", currently_reading: "Reading", read: "Read" },
  film: { want_to_read: "Want to Watch", currently_reading: "Watching", read: "Watched" },
  music: { want_to_read: "Want to Hear", currently_reading: "Listening", read: "Heard" },
  food: { want_to_read: "Want to Try", currently_reading: "Trying", read: "Tried" },
  place: { want_to_read: "Want to Go", currently_reading: "Going", read: "Been" },
  other: { want_to_read: "Planned", currently_reading: "In progress", read: "Done" },
};

export function statusLabel(
  status: ShelfStatus,
  medium?: MediumOrOther | "all" | null,
): string {
  const key = medium && medium in STATUS_LABELS ? medium : "all";
  return STATUS_LABELS[key as MediumOrOther | "all"][status];
}

export interface ShelfEntry {
  directoryId: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  author: string | null;
  averageRating: number | null;
  medium: MediumOrOther;
  status: ShelfStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ShelfCounts extends Record<ShelfStatus, number> {
  total: number;
  byMedium: Record<
    MediumOrOther,
    Record<ShelfStatus, number> & { total: number }
  >;
}

// Phase 4 stats dashboard — see docs/reading-tracker-plan.md §2/§4. Shape
// mirrors Culture_Reading_Tracker::get_reading_stats()'s response verbatim.
//
// `pace_breakdown`/`mood_breakdown` remain book-only on purpose (StoryGraph's
// vocabulary doesn't transfer to a restaurant) — everything else spans all
// five media. `books_read`/`books_per_month` are deprecated aliases the PHP
// still returns for already-installed mobile builds; read the new names.
export interface ReadingStats {
  year: number;
  entries_logged: number;
  medium_breakdown: Record<MediumOrOther, number>;
  per_month: { month: string; count: number }[];
  pace_breakdown: Record<Pace, number>;
  mood_breakdown: Record<string, number>;
  rating_distribution: Record<string, number>;
  top_genres: { genre: string; count: number; medium: MediumOrOther }[];
  /** @deprecated use `entries_logged` */
  books_read?: number;
  /** @deprecated use `per_month` */
  books_per_month?: { month: string; count: number }[];
}

export interface ReadingGoal {
  year: number;
  target: number | null;
  logged: number;
  /** @deprecated use `target` */
  targetBooks?: number | null;
  /** @deprecated use `logged` */
  booksRead?: number;
}

