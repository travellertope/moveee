import type { FeedItem } from "../../types";

// Country → region mapping (mirrors SubmitPost.tsx on web)
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
  if (!countryOfResidence) return null;
  return COUNTRY_TO_REGION[countryOfResidence.toLowerCase().trim()] ?? null;
}

export function scoreItem(
  item: FeedItem,
  interestTagSet: Set<string>,
  userCity?: string,
  userRegion?: string,
  followedUsernames?: Set<string>,
): number {
  let score = 0;

  // Interest match: 0–50 pts
  if (interestTagSet.size > 0) {
    const candidates = [item.category, item.communityTag, item.entryType, item.arm]
      .filter(Boolean).map((s) => s!.toLowerCase());
    if (candidates.some((c) => interestTagSet.has(c))) score += 50;
  } else {
    score += 25;
  }

  // Recency: 0–30 pts (72-hour half-life)
  const ageMs = Date.now() - new Date(item.date).getTime();
  const ageHours = ageMs / 3_600_000;
  score += Math.round(30 * Math.pow(0.5, ageHours / 72));

  // Engagement: 0–20 pts
  const totalReactions =
    (item.reactions?.love ?? 0) + (item.reactions?.fire ?? 0) + (item.reactions?.clap ?? 0);
  score += Math.round(Math.min(20, Math.log1p(totalReactions + (item.commentCount ?? 0)) * 4));

  // Location boost: 0–25 pts — soft nudge, not a wall
  if (userCity && item.city) {
    if (item.city.toLowerCase() === userCity.toLowerCase()) score += 25;
  } else if (userRegion && item.region) {
    if (item.region === userRegion) score += 15;
  }

  // Reputation boost: high-rep authors signal proven quality (+10)
  const HIGH_REP = new Set(['taste-maker', 'culture-authority', 'culture-icon']);
  if (item.authorRepTier && HIGH_REP.has(item.authorRepTier)) score += 10;

  // Followed author boost (+15)
  if (followedUsernames?.size && item.communityAuthorUsername &&
      followedUsernames.has(item.communityAuthorUsername.toLowerCase())) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

export function rankFeed(
  items: FeedItem[],
  interestTagSet: Set<string>,
  userCity?: string,
  userRegion?: string,
  followedUsernames?: Set<string>,
  followedOrJoinedHubIds?: Set<number>,
): FeedItem[] {
  // Hub posts are opt-in visibility in For You, not a lower score — a post
  // whose hubId isn't in the viewer's followed/joined set is dropped from
  // the candidate pool entirely before scoring (docs/hubs-plan.md §4.5).
  // Keep this in sync with packages/utils/feed-recommendations.ts (web).
  const candidates = items.filter((item) =>
    item.hubId == null || (followedOrJoinedHubIds?.has(item.hubId) ?? false)
  );
  const scored = candidates.map((item) => ({
    item,
    score: scoreItem(item, interestTagSet, userCity, userRegion, followedUsernames),
  }));
  return scored
    .sort((a, b) => b.score !== a.score
      ? b.score - a.score
      : new Date(b.item.date).getTime() - new Date(a.item.date).getTime())
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
  const candidates = [item.category, item.communityTag, item.entryType, item.arm]
    .filter(Boolean).map((s) => s!.toLowerCase());
  return candidates.some((c) => interestTagSet.has(c));
}
