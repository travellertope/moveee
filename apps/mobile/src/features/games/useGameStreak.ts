import { useState, useEffect } from "react";
import { storage } from "../../store/storage";

const KEY_STREAK       = "games_streak_count";
const KEY_STREAK_LAST  = "games_streak_last_date";

/**
 * Returns the current streak (consecutive days at least one game was played).
 * Call `recordPlayedToday()` after a game session completes to update it.
 */
export function useGameStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getCurrentStreak());
  }, []);

  return streak;
}

/** Read the live streak without a hook (usable inside game screens). */
export function getCurrentStreak(): number {
  return storage.getNumber(KEY_STREAK) ?? 0;
}

/**
 * Mark today as played and update the streak.
 * - If the last played date was yesterday → streak += 1.
 * - If the last played date was today → no change (idempotent).
 * - If the last played date was earlier or never → streak resets to 1.
 */
export function recordPlayedToday(): void {
  const todayStr    = new Date().toISOString().slice(0, 10);
  const lastPlayed  = storage.getString(KEY_STREAK_LAST) ?? "";
  const currentStr  = storage.getNumber(KEY_STREAK) ?? 0;

  if (lastPlayed === todayStr) return; // already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = lastPlayed === yesterdayStr ? currentStr + 1 : 1;

  storage.set(KEY_STREAK, newStreak);
  storage.set(KEY_STREAK_LAST, todayStr);
}
