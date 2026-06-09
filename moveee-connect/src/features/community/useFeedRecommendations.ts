/**
 * Client-side feed scoring algorithm (Phase 8b).
 * Mirrors lib/feed-recommendations.ts in the web app exactly.
 *
 * Scores 0–100:
 *   50 pts — interest match
 *   30 pts — recency (3-day half-life)
 *   20 pts — engagement (reactions + comments, log scale)
 */

import type { FeedItem } from "../../types";

export function scoreItem(item: FeedItem, interestTagSet: Set<string>): number {
  let score = 0;

  // Interest match
  if (interestTagSet.size > 0) {
    const candidates = [item.category, item.communityTag, item.entryType, item.arm]
      .filter(Boolean)
      .map((s) => s!.toLowerCase());
    if (candidates.some((c) => interestTagSet.has(c))) score += 50;
  } else {
    score += 25; // neutral baseline when no interests set
  }

  // Recency — 3-day half-life
  const ageHours = (Date.now() - new Date(item.date).getTime()) / 3_600_000;
  score += Math.round(30 * Math.pow(0.5, ageHours / 72));

  // Engagement — log scale, capped at 20
  const totalReactions = (item.reactions?.love ?? 0) + (item.reactions?.fire ?? 0) + (item.reactions?.clap ?? 0);
  score += Math.round(Math.min(20, Math.log1p(totalReactions + (item.commentCount ?? 0)) * 4));

  return Math.min(100, Math.max(0, score));
}

export function rankFeed(items: FeedItem[], interestTagSet: Set<string>): FeedItem[] {
  return items
    .map((item) => ({ item, score: scoreItem(item, interestTagSet) }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : new Date(b.item.date).getTime() - new Date(a.item.date).getTime()
    )
    .map(({ item }) => item);
}

export function getTrending(items: FeedItem[], limit = 5): FeedItem[] {
  const cutoff = Date.now() - 7 * 86_400_000;
  return [...items]
    .filter((item) => new Date(item.date).getTime() > cutoff)
    .sort((a, b) => {
      const engA = (a.reactions?.love ?? 0) + (a.reactions?.fire ?? 0) + (a.reactions?.clap ?? 0) + (a.commentCount ?? 0);
      const engB = (b.reactions?.love ?? 0) + (b.reactions?.fire ?? 0) + (b.reactions?.clap ?? 0) + (b.commentCount ?? 0);
      return engB - engA;
    })
    .slice(0, limit);
}

export function matchesInterests(item: FeedItem, interestTagSet: Set<string>): boolean {
  if (interestTagSet.size === 0) return false;
  return [item.category, item.communityTag, item.entryType, item.arm]
    .filter(Boolean)
    .map((s) => s!.toLowerCase())
    .some((c) => interestTagSet.has(c));
}
