/**
 * Centralised WordPress data layer using Next.js unstable_cache.
 *
 * unstable_cache deduplicates identical calls within the same render pass AND
 * caches results across requests. Combined with revalidateTag on post publish,
 * this means WordPress receives at most one request per content type per TTL
 * window — not one per user.
 *
 * Usage (server components only — do NOT call from client components):
 *   import { getStories, getEvents } from '@/lib/data-layer';
 *   const stories = await getStories({ first: 20 });
 */

import { unstable_cache } from "next/cache";
import {
  getWPData,
  getEventsWithFallback,
  getWPQuotes,
  GET_STORIES,
  GET_DIRECTORY_ENTRIES,
  GET_NEWSLETTERS,
  type IssueTerm,
  getLatestIssue,
  getPostsByIssue,
} from "./wp";
import { getPulseStories } from "./pulse-wordpress";
import { getCommunityPosts as _getCommunityPosts } from "./unified-feed";

// ── Editorial ────────────────────────────────────────────────────────────────

export const getStories = unstable_cache(
  async (params: { first?: number; tag?: string; categoryName?: string } = {}) =>
    getWPData(GET_STORIES, params, { revalidate: 300 }),
  ["stories"],
  { revalidate: 300, tags: ["stories", "wp-content"] }
);

// ── Events ───────────────────────────────────────────────────────────────────

export const getEvents = unstable_cache(
  async (first = 30) => getEventsWithFallback(first, { revalidate: 180 }),
  ["events"],
  { revalidate: 180, tags: ["events", "wp-content"] }
);

// ── Directory ────────────────────────────────────────────────────────────────

export const getDirectoryEntries = unstable_cache(
  async (params: { first?: number } = {}) =>
    getWPData(GET_DIRECTORY_ENTRIES, params, { revalidate: 300 }),
  ["directory"],
  { revalidate: 300, tags: ["directory", "wp-content"] }
);

// ── Quotes ───────────────────────────────────────────────────────────────────

export const getQuotes = unstable_cache(
  async (first = 50) => getWPQuotes({ first }),
  ["quotes"],
  { revalidate: 300, tags: ["quotes", "wp-content"] }
);

// ── Pulse (community feed posts) ─────────────────────────────────────────────

export const getPulse = unstable_cache(
  async (perPage = 40) => getPulseStories({ perPage }),
  ["pulse"],
  { revalidate: 120, tags: ["pulse", "wp-content"] }
);

// ── Community posts ───────────────────────────────────────────────────────────

export const getCommunityPosts = unstable_cache(
  async () => _getCommunityPosts(),
  ["community-posts"],
  { revalidate: 120, tags: ["community", "wp-content"] }
);

// ── Newsletters ───────────────────────────────────────────────────────────────

export const getNewsletters = unstable_cache(
  async (params: { first?: number } = {}) =>
    getWPData(GET_NEWSLETTERS, params, { revalidate: 600 }),
  ["newsletters"],
  { revalidate: 600, tags: ["newsletters", "wp-content"] }
);

// ── Magazine issues ───────────────────────────────────────────────────────────

export const getLatestIssueWithStories = unstable_cache(
  async (): Promise<{ issue: IssueTerm | null; stories: any[] }> => {
    const issue = await getLatestIssue().catch(() => null);
    if (!issue) return { issue: null, stories: [] };
    const stories = await getPostsByIssue(issue.id);
    return { issue, stories };
  },
  ["latest-issue"],
  { revalidate: 600, tags: ["newsletters", "wp-content"] }
);
