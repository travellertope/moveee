import {
  getWPData,
  GET_STORIES,
  GET_SERIES_STORIES_BATCH,
  GET_PRODUCTS,
  getLatestIssue,
  getPostsByIssue,
  getStoriesByCountrySlugs,
  type IssueTerm,
} from "@/lib/wp";
import { EDITIONS, type RegionalSlug } from "@/lib/editions";

/**
 * Fetch all data needed for a homepage edition (editorial only).
 * Events, directory, quotes, and pulse stories have moved to web.themoveee.com.
 */
export async function fetchHomepageData(edition?: RegionalSlug) {
  let stories: any[] = [];
  let coverStory: any = null;
  let products: any[] = [];
  let latestIssue: IssueTerm | null = null;
  let latestIssueStories: any[] = [];
  let interviewStories: any[] = [];
  let seriesTheRadar: any[] = [];
  let seriesPortraits: any[] = [];
  let seriesTheLane: any[] = [];
  let seriesThinkCreative: any[] = [];

  const OPT = { revalidate: 600 };

  // ── 1. Stories ────────────────────────────────────────────────────────────
  // Edition-scoped by the `country` taxonomy (not Tags) — see
  // getStoriesByCountrySlugs()/EDITIONS[...].countrySlugs in packages/utils/
  // editions.ts for why this is REST-backed rather than GraphQL.
  try {
    if (edition) {
      const countrySlugs = EDITIONS[edition]?.countrySlugs ?? [];
      const [editionPosts, latestData] = await Promise.all([
        getStoriesByCountrySlugs(countrySlugs as unknown as string[], 14, OPT),
        getWPData(GET_STORIES, { first: 20 }, OPT),
      ]);
      const latestPosts: any[] = latestData?.posts?.nodes || [];

      // A post only counts as "universal" filler if it isn't tagged to ANY
      // edition's countries — a Nigeria-tagged post should never appear as
      // generic filler on the UK homepage. countries.nodes is already
      // fetched on every story via STORY_FIELDS_FRAGMENT, so determining
      // this needs no extra request (replaces the old cross-tag-exclusion
      // fetches against the other two editions).
      const allEditionCountrySlugs = new Set(
        Object.values(EDITIONS).flatMap((e) => e.countrySlugs as unknown as string[])
      );
      const editionIds = new Set(editionPosts.map((p: any) => p.id));
      const universalPosts = latestPosts.filter((p: any) => {
        if (editionIds.has(p.id)) return false;
        const postCountrySlugs: string[] = (p.countries?.nodes ?? []).map((c: any) => c.slug);
        return !postCountrySlugs.some((s) => allEditionCountrySlugs.has(s));
      });

      const pool = [...editionPosts, ...universalPosts];
      coverStory = pool[0] || null;
      stories = pool.slice(1, 14);
    } else {
      const data = await getWPData(GET_STORIES, { first: 14 }, OPT);
      const pool: any[] = data?.posts?.nodes || [];
      coverStory = pool[0] || null;
      stories = pool.slice(1, 14);
    }
  } catch (err) { console.error("Stories fetch error:", err); }

  // ── 2. Products ───────────────────────────────────────────────────────────
  // Still Tags-based (unrelated to the country-taxonomy migration above —
  // shop products aren't magazine content and weren't in scope).
  try {
    const editionTag = edition ? EDITIONS[edition]?.tag : undefined;
    const globalData = await getWPData(GET_PRODUCTS, { first: 10 }, OPT);
    const globalProducts: any[] = globalData?.products?.nodes || [];
    if (editionTag) {
      const taggedData = await getWPData(GET_PRODUCTS, { first: 10, tag: editionTag }, OPT);
      const taggedProducts: any[] = taggedData?.products?.nodes || [];
      const existingIds = new Set(taggedProducts.map((p: any) => p.id));
      products = [...taggedProducts, ...globalProducts.filter((p: any) => !existingIds.has(p.id))].slice(0, 10);
    } else {
      products = globalProducts.slice(0, 10);
    }
  } catch (err) { console.error("Products fetch error:", err); }

  // ── 4. Latest issue ───────────────────────────────────────────────────────
  try {
    latestIssue = await getLatestIssue().catch(() => null);
    if (latestIssue) {
      latestIssueStories = await getPostsByIssue(latestIssue.id);
    }
  } catch (err) { console.error("Latest issue fetch error:", err); }

  // ── 5. Interviews ─────────────────────────────────────────────────────────
  try {
    const data = await getWPData(GET_STORIES, { first: 10, categoryName: "Interviews" }, OPT);
    interviewStories = data?.posts?.nodes || [];
  } catch (err) { console.error("Interviews fetch error:", err); }

  // ── 6. Series (single batched query) ─────────────────────────────────────
  try {
    const seriesData = await getWPData(GET_SERIES_STORIES_BATCH, {}, OPT);
    seriesTheRadar      = seriesData?.theRadar?.posts?.nodes      || [];
    seriesPortraits     = seriesData?.portraits?.posts?.nodes     || [];
    seriesTheLane       = seriesData?.theLane?.posts?.nodes       || [];
    seriesThinkCreative = seriesData?.thinkCreative?.posts?.nodes || [];
  } catch (err) { console.error("Series fetch error:", err); }

  // ── Deduplicate by slug ───────────────────────────────────────────────────
  const usedSlugs = new Set<string>();

  latestIssueStories = latestIssueStories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  if (coverStory?.slug) usedSlugs.add(coverStory.slug);

  stories = stories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  interviewStories = interviewStories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  const filterSeries = (posts: any[]) => posts.filter(s => s.slug && !usedSlugs.has(s.slug)).slice(0, 4);
  seriesTheRadar      = filterSeries(seriesTheRadar);
  seriesPortraits     = filterSeries(seriesPortraits);
  seriesTheLane       = filterSeries(seriesTheLane);
  seriesThinkCreative = filterSeries(seriesThinkCreative);

  return {
    coverStory, stories, products,
    latestIssue, latestIssueStories, interviewStories,
    seriesTheRadar, seriesPortraits, seriesTheLane, seriesThinkCreative,
  };
}
