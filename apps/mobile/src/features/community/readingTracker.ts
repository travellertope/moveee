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

// Phase 4 stats dashboard — see docs/reading-tracker-plan.md §2/§4. Shape
// mirrors Culture_Reading_Tracker::get_reading_stats()'s response verbatim
// and the web copy in packages/shared/lib/reading-tracker.ts.
export interface ReadingStats {
  year: number;
  books_read: number;
  pace_breakdown: Record<Pace, number>;
  mood_breakdown: Record<string, number>;
  rating_distribution: Record<string, number>;
  top_genres: { genre: string; count: number }[];
  books_per_month: { month: string; count: number }[];
}

// "Log-First" pass (September 2026) — generalizes the shelf mechanism from
// books-only into a cross-type personal log. The backend enum names are
// still book-shaped (want_to_read/currently_reading/read) — deliberately
// reused, not renamed, per CLAUDE.md's own "reuse over new" convention —
// only the *labels* vary per directory type on the client. Mirrors
// packages/shared/lib/reading-tracker.ts (web) and
// Culture_Reading_Tracker (PHP source of truth).

export const SHELF_STATUSES = ["want_to_read", "currently_reading", "read"] as const;
export type ShelfStatus = (typeof SHELF_STATUSES)[number];

// Entry types that support the shelf/log mechanism, and the label each
// status wears for that type. A type with no "currently_reading" entry
// (e.g. place — there's no "currently visiting" state) just never renders
// a button for it; the backend still accepts the status if ever sent, it's
// simply not offered in the UI for that type.
export const SHELF_LABELS: Record<string, Partial<Record<ShelfStatus, string>>> = {
  book: { want_to_read: "Want to Read", currently_reading: "Reading", read: "Read" },
  film: { want_to_read: "Want to Watch", currently_reading: "Watching", read: "Watched" },
  place: { want_to_read: "Want to Go", read: "Been" },
};

export function shelfLabelsFor(entryType: string): Partial<Record<ShelfStatus, string>> | null {
  return SHELF_LABELS[entryType] ?? null;
}

export interface SavedLine {
  id: number;
  lineText: string;
  sourceContext: string | null;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  isMine: boolean;
}

export interface SocialProofExample {
  userId: number;
  name: string;
  avatar: string | null;
  loggedAt: string;
}

export interface SocialProof {
  doneCount: number;
  wantCount: number;
  examples: SocialProofExample[];
}

// get_user_shelf()'s card shape — shared by ReadingTrackerScreen and the
// "In progress" rail on the Log home screen.
export interface ShelfEntry {
  directoryId: number;
  title: string;
  slug: string;
  type: string | null;
  thumbnail: string | null;
  author: string;
  averageRating: number | null;
  status: ShelfStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface AlsoLoggedEntry {
  directoryId: number;
  title: string;
  slug: string;
  type: string | null;
  thumbnail: string | null;
  author: string | null;
  peopleCount: number;
}

// "From people you follow" — the Log home screen's activity rail.
export interface FollowingActivityItem {
  userId: number;
  userName: string;
  userAvatar: string | null;
  directoryId: number;
  title: string;
  slug: string;
  type: string | null;
  thumbnail: string | null;
  author: string | null;
  loggedAt: string;
}
