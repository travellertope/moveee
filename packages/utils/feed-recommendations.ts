/**
 * Feed recommendation scoring.
 * Scores each feed item 0–100 based on:
 *  - Interest match    (0–50)
 *  - Recency           (0–30, half-life ~3 days)
 *  - Engagement        (0–20, reactions + comments)
 */

import type { FeedItem } from "@/lib/unified-feed";

/** Return a 0–100 relevance score for a single item. */
export function scoreItem(item: FeedItem, interestTagSet: Set<string>): number {
  let score = 0;

  // ── Interest match ──────────────────────────────────────────────────────
  if (interestTagSet.size > 0) {
    const candidates = [
      item.category,
      item.communityTag,
      item.entryType,
      item.arm,
    ].filter(Boolean).map(s => s!.toLowerCase());

    const matched = candidates.some(c => interestTagSet.has(c));
    if (matched) score += 50;
  } else {
    // No interests set — treat all items as neutral (score from recency+eng only)
    score += 25;
  }

  // ── Recency ─────────────────────────────────────────────────────────────
  const ageMs      = Date.now() - new Date(item.date).getTime();
  const ageHours   = ageMs / 3_600_000;
  const halfLifeH  = 72; // 3 days
  const recency    = 30 * Math.pow(0.5, ageHours / halfLifeH);
  score += Math.round(recency);

  // ── Engagement ──────────────────────────────────────────────────────────
  const totalReactions = (item.reactions?.love ?? 0)
                       + (item.reactions?.fire ?? 0)
                       + (item.reactions?.clap ?? 0);
  const engagement     = Math.min(20, Math.log1p(totalReactions + (item.commentCount ?? 0)) * 4);
  score += Math.round(engagement);

  return Math.min(100, Math.max(0, score));
}

/** Sort feed items by relevance score (descending). Items within the same
 *  interest-match bucket are sorted by recency to keep the feed feeling fresh. */
export function rankFeed(items: FeedItem[], interestTagSet: Set<string>): FeedItem[] {
  const scored = items.map(item => ({
    item,
    score: scoreItem(item, interestTagSet),
  }));

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak: most recent first
      return new Date(b.item.date).getTime() - new Date(a.item.date).getTime();
    })
    .map(({ item }) => item);
}

/** Return a "trending" slice: highest combined reaction+comment count, last 7 days. */
export function getTrending(items: FeedItem[], limit = 5): FeedItem[] {
  const cutoff = Date.now() - 7 * 86_400_000;
  return [...items]
    .filter(item => new Date(item.date).getTime() > cutoff)
    .sort((a, b) => {
      const engA = (a.reactions?.love ?? 0) + (a.reactions?.fire ?? 0) + (a.reactions?.clap ?? 0) + (a.commentCount ?? 0);
      const engB = (b.reactions?.love ?? 0) + (b.reactions?.fire ?? 0) + (b.reactions?.clap ?? 0) + (b.commentCount ?? 0);
      return engB - engA;
    })
    .slice(0, limit);
}

/** Return true if an item matches the user's interests. */
export function matchesInterests(item: FeedItem, interestTagSet: Set<string>): boolean {
  if (interestTagSet.size === 0) return false;
  const candidates = [item.category, item.communityTag, item.entryType, item.arm]
    .filter(Boolean).map(s => s!.toLowerCase());
  return candidates.some(c => interestTagSet.has(c));
}
