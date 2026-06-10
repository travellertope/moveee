import {
  getWPData,
  GET_STORIES,
  GET_STORIES_TAGS,
  GET_SERIES_STORIES_BATCH,
  GET_JOURNEYS,
  GET_DIRECTORY_ENTRIES,
  GET_PRODUCTS,
  getEventsWithFallback,
  getWPQuotes,
  getLatestIssue,
  getPostsByIssue,
  type IssueTerm,
} from "@/lib/wp";
import { REGIONAL_SLUGS } from "@/lib/editions";

/**
 * Fetch all data needed for a homepage edition.
 * Pass `editionTag` ("uk" | "us" | "africa") to filter edition-specific content,
 * or leave undefined for the global edition.
 *
 * All requests are fully sequential (one at a time) to prevent PHP-FPM worker
 * exhaustion on the 2 GB origin server. Vercel's fetch cache means WordPress is
 * only hit once per revalidate window regardless of concurrent user traffic.
 */
export async function fetchHomepageData(editionTag?: string) {
  let stories: any[] = [];
  let coverStory: any = null;
  let events: any[] = [];
  let origins: any[] = [];
  let products: any[] = [];
  let quotes: any[] = [];
  let pulseStories: any[] = [];
  let directoryEntries: any[] = [];
  let latestIssue: IssueTerm | null = null;
  let latestIssueStories: any[] = [];
  let interviewStories: any[] = [];
  let seriesTheRadar: any[] = [];
  let seriesPortraits: any[] = [];
  let seriesTheLane: any[] = [];
  let seriesThinkCreative: any[] = [];

  const OPT = { revalidate: 600 }; // 10-minute cache — reduces cold-start frequency

  // ── 1. Stories ────────────────────────────────────────────────────────────
  try {
    if (editionTag) {
      const otherEditions = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);

      const editionData = await getWPData(GET_STORIES, { first: 14, tag: editionTag }, OPT);
      const latestData  = await getWPData(GET_STORIES, { first: 20 }, OPT);

      const otherTagData: any[] = [];
      for (const tag of otherEditions) {
        const d = await getWPData(GET_STORIES_TAGS, { first: 50, tag }, OPT);
        otherTagData.push(d);
      }

      const editionPosts: any[] = editionData?.posts?.nodes || [];
      const latestPosts: any[]  = latestData?.posts?.nodes  || [];
      const otherEditionIds = new Set<string>(
        otherTagData.flatMap((d: any) => d?.posts?.nodes?.map((p: any) => p.id) ?? [])
      );
      const editionIds = new Set(editionPosts.map((p: any) => p.id));
      const universalPosts = latestPosts.filter(
        (p: any) => !editionIds.has(p.id) && !otherEditionIds.has(p.id)
      );
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

  // ── 2. Events ─────────────────────────────────────────────────────────────
  try {
    events = await getEventsWithFallback(editionTag ? 18 : 6, OPT).catch(() => []) as any[];
    if (editionTag && events.length > 0) {
      const otherEditions = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);
      events = events.filter((e: any) => {
        const eventTags: string[] = e.tags?.nodes?.map((t: any) => t.slug) ?? [];
        if (eventTags.length === 0 && !e.tags) return true;
        return !otherEditions.some(t => eventTags.includes(t));
      }).slice(0, 6);
    }
  } catch (err) { console.error("Events fetch error:", err); }

  // ── 3. Origins ────────────────────────────────────────────────────────────
  try {
    const data = await getWPData(GET_JOURNEYS, { first: 6 }, OPT);
    origins = data?.cultureJourneys?.nodes || [];
  } catch (err) { console.error("Origins fetch error:", err); }

  // ── 4. Products ───────────────────────────────────────────────────────────
  try {
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

  // ── 5. Directory ──────────────────────────────────────────────────────────
  try {
    const data = await getWPData(GET_DIRECTORY_ENTRIES, { first: 24 }, OPT);
    const all: any[] = data?.cultureDirectories?.nodes || [];
    directoryEntries = all.sort(() => Math.random() - 0.5).slice(0, 8);
  } catch (err) { console.error("Directory fetch error:", err); }

  // ── 6. Quotes ─────────────────────────────────────────────────────────────
  try {
    const data = await getWPQuotes({ first: 15 }, OPT);
    const all: any[] = data?.cultureQuotes?.nodes || [];
    quotes = all.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (err) { console.error("Quotes fetch error:", err); }

  // ── 7. Pulse stories (REST) ───────────────────────────────────────────────
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com";
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/pulse-stories?per_page=4&orderby=date&order=desc&_embed=1`,
      { next: { revalidate: 600 } }
    );
    if (res.ok) pulseStories = await res.json();
  } catch (err) { console.error("Pulse fetch error:", err); }

  // ── 8. Latest issue ───────────────────────────────────────────────────────
  try {
    latestIssue = await getLatestIssue().catch(() => null);
    if (latestIssue) {
      latestIssueStories = await getPostsByIssue(latestIssue.id);
    }
  } catch (err) { console.error("Latest issue fetch error:", err); }

  // ── 9. Interviews ─────────────────────────────────────────────────────────
  try {
    const data = await getWPData(GET_STORIES, { first: 10, categoryName: "Interviews" }, OPT);
    interviewStories = data?.posts?.nodes || [];
  } catch (err) { console.error("Interviews fetch error:", err); }

  // ── 10. Series (single batched query) ────────────────────────────────────
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
    coverStory, stories, events, origins, products, quotes, pulseStories,
    directoryEntries, latestIssue, latestIssueStories, interviewStories,
    seriesTheRadar, seriesPortraits, seriesTheLane, seriesThinkCreative,
  };
}
