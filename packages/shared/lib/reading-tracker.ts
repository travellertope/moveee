// Reading Tracker — shared constants for the mood/pace tagging system.
// See docs/reading-tracker-plan.md §1.3/§3.4. Fixed at 12 tags, StoryGraph's
// own published vocabulary — never let this grow ad hoc (see the plan doc's
// §7 rule); the PHP source of truth is Culture_Reading_Tracker::MOOD_TAGS in
// class-culture-reading-tracker.php. Mirrored again (no shared source of
// truth across the PHP/TS boundary, or between this file and the mobile app,
// which can't import packages/shared) in apps/mobile's own const of the same
// name — keep all three in sync if this list ever changes.

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
