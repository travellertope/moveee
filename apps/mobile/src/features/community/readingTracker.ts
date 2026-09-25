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
