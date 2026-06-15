/**
 * Feed recommendation scoring.
 * Scores each feed item 0–100 based on:
 *  - Interest match    (0–50)
 *  - Recency           (0–30, half-life ~3 days)
 *  - Engagement        (0–20, reactions + comments)
 *  - Location          (0–25, same city or same region)
 *
 * Location boost is a soft nudge: local content floats up but
 * non-local content is never hidden. All content visible to all members.
 */

import type { FeedItem } from "@/lib/unified-feed";

const COUNTRY_TO_REGION: Record<string, string> = {
  nigeria: "Africa", ng: "Africa", ghana: "Africa", gh: "Africa",
  kenya: "Africa", ke: "Africa", "south africa": "Africa", za: "Africa",
  ethiopia: "Africa", senegal: "Africa", cameroon: "Africa",
  "united kingdom": "Diaspora UK", uk: "Diaspora UK", gb: "Diaspora UK",
  "united states": "Diaspora US", us: "Diaspora US",
  canada: "Diaspora US", ca: "Diaspora US",
  france: "Diaspora Europe", germany: "Diaspora Europe",
  netherlands: "Diaspora Europe", spain: "Diaspora Europe",
};

export function detectRegion(countryOfResidence?: string): string | null {
  if (typeof document !== "undefined") {
    const edition = document.cookie.split("; ")
      .find(r => r.startsWith("moveee_edition="))?.split("=")[1];
    const editionMap: Record<string, string> = { uk: "Diaspora UK", us: "Diaspora US", africa: "Africa" };
    if (edition && editionMap[edition]) return editionMap[edition];
  }
  if (!countryOfResidence) return null;
  return COUNTRY_TO_REGION[countryOfResidence.toLowerCase().trim()] ?? null;
}

/** Return a 0–100 relevance score for a single item. */
export function scoreItem(
  item: FeedItem,
  interestTagSet: Set<string>,
  userCity?: string,
  userRegion?: string,
): number {
  let score = 0;

  // ── Interest match (0–50) ───────────────────────────────────────────────
  if (interestTagSet.size > 0) {
    const candidates = [item.category, item.communityTag, item.entryType, item.arm]
      .filter(Boolean).map(s => s!.toLowerCase());
    if (candidates.some(c => interestTagSet.has(c))) score += 50;
  } else {
    score += 25;
  }

  // ── Recency (0–30, 3-day half-life) ────────────────────────────────────
  const ageHours = (Date.now() - new Date(item.date).getTime()) / 3_600_000;
  score += Math.round(30 * Math.pow(0.5, ageHours / 72));

  // ── Engagement (0–20) ───────────────────────────────────────────────────
  const totalReactions = (item.reactions?.love ?? 0) + (item.reactions?.fire ?? 0) + (item.reactions?.clap ?? 0);
  score += Math.round(Math.min(20, Math.log1p(totalReactions + (item.commentCount ?? 0)) * 4));

  // ── Location (0–25) ─────────────────────────────────────────────────────
  // Same city = strong boost; same region = gentle nudge.
  // Non-local content still visible — this only re-orders, never hides.
  if (userCity && item.city && item.city.toLowerCase() === userCity.toLowerCase()) {
    score += 25;
  } else if (userRegion && item.region && item.region === userRegion) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

export function rankFeed(
  items: FeedItem[],
  interestTagSet: Set<string>,
  userCity?: string,
  userRegion?: string,
): FeedItem[] {
  const scored = items.map(item => ({ item, score: scoreItem(item, interestTagSet, userCity, userRegion) }));
  return scored
    .sort((a, b) => b.score !== a.score ? b.score - a.score : new Date(b.item.date).getTime() - new Date(a.item.date).getTime())
    .map(({ item }) => item);
}

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

export function matchesInterests(item: FeedItem, interestTagSet: Set<string>): boolean {
  if (interestTagSet.size === 0) return false;
  const candidates = [item.category, item.communityTag, item.entryType, item.arm]
    .filter(Boolean).map(s => s!.toLowerCase());
  return candidates.some(c => interestTagSet.has(c));
}
