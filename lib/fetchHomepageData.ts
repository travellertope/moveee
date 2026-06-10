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
 * Requests are serialised into small batches (max 2 concurrent) to prevent
 * PHP-FPM worker exhaustion on the 2 GB origin server during cache misses.
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

  // ── Batch 1: Stories (critical path — cover + hero grid) ─────────────────
  // For edition pages we need up to 4 queries; run them 2 at a time to cap
  // concurrent PHP-FPM workers.
  try {
    if (editionTag) {
      const otherEditions = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);

      // First pair: edition-tagged posts + all-latest posts
      const [editionData, latestData] = await Promise.all([
        getWPData(GET_STORIES, { first: 14, tag: editionTag }, { revalidate: 300 }),
        getWPData(GET_STORIES, { first: 20 }, { revalidate: 300 }),
      ]);

      // Second pair (and beyond): other-edition tag queries, 2 at a time
      const otherTagData: any[] = [];
      for (let i = 0; i < otherEditions.length; i += 2) {
        const chunk = otherEditions.slice(i, i + 2);
        const results = await Promise.all(
          chunk.map(tag => getWPData(GET_STORIES_TAGS, { first: 50, tag }, { revalidate: 300 }))
        );
        otherTagData.push(...results);
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
      const data = await getWPData(GET_STORIES, { first: 14 }, { revalidate: 300 });
      const pool: any[] = data?.posts?.nodes || [];
      coverStory = pool[0] || null;
      stories = pool.slice(1, 14);
    }
  } catch (err) { console.error("Stories fetch error:", err); }

  // ── Batch 2: Events + Origins ─────────────────────────────────────────────
  try {
    const [eventsData, originsData] = await Promise.all([
      getEventsWithFallback(editionTag ? 18 : 6, { revalidate: 300 }).catch(() => []),
      getWPData(GET_JOURNEYS, { first: 6 }, { revalidate: 300 }).catch(() => null),
    ]);

    events = eventsData as any[];
    if (editionTag && events.length > 0) {
      const otherEditions = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);
      events = events.filter((e: any) => {
        const eventTags: string[] = e.tags?.nodes?.map((t: any) => t.slug) ?? [];
        if (eventTags.length === 0 && !e.tags) return true;
        return !otherEditions.some(t => eventTags.includes(t));
      }).slice(0, 6);
    }

    origins = (originsData as any)?.cultureJourneys?.nodes || [];
  } catch (err) { console.error("Events/Origins fetch error:", err); }

  // ── Batch 3: Products (tagged + global) ───────────────────────────────────
  try {
    const [taggedData, globalData] = await Promise.all([
      editionTag ? getWPData(GET_PRODUCTS, { first: 10, tag: editionTag }) : Promise.resolve(null),
      getWPData(GET_PRODUCTS, { first: 10 }),
    ]);
    const taggedProducts: any[] = taggedData?.products?.nodes || [];
    const globalProducts: any[] = globalData?.products?.nodes || [];
    const existingIds = new Set(taggedProducts.map((p: any) => p.id));
    products = [...taggedProducts, ...globalProducts.filter((p: any) => !existingIds.has(p.id))].slice(0, 10);
  } catch (err) { console.error("Products fetch error:", err); }

  // ── Batch 4: Directory + Quotes ───────────────────────────────────────────
  try {
    const [dirData, quotesData] = await Promise.all([
      getWPData(GET_DIRECTORY_ENTRIES, { first: 24 }, { revalidate: 300 }).catch(() => null),
      getWPQuotes({ first: 15 }, { revalidate: 300 }).catch(() => null),
    ]);
    const allDir: any[] = (dirData as any)?.cultureDirectories?.nodes || [];
    directoryEntries = allDir.sort(() => Math.random() - 0.5).slice(0, 8);
    const allQuotes: any[] = (quotesData as any)?.cultureQuotes?.nodes || [];
    quotes = allQuotes.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (err) { console.error("Directory/Quotes fetch error:", err); }

  // ── Batch 5: Pulse stories (REST) ─────────────────────────────────────────
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com";
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/pulse-stories?per_page=4&orderby=date&order=desc&_embed=1`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) pulseStories = await res.json();
  } catch (err) { console.error("Pulse fetch error:", err); }

  // ── Batch 6: Latest issue → issue stories (sequential dependency) ─────────
  try {
    latestIssue = await getLatestIssue().catch(() => null);
    if (latestIssue) {
      latestIssueStories = await getPostsByIssue(latestIssue.id);
    }
  } catch (err) { console.error("Latest issue fetch error:", err); }

  // ── Batch 7: Interviews + Series (batched GraphQL) ────────────────────────
  try {
    const [interviewData, seriesData] = await Promise.all([
      getWPData(GET_STORIES, { first: 10, categoryName: "Interviews" }, { revalidate: 300 }).catch(() => null),
      getWPData(GET_SERIES_STORIES_BATCH, {}, { revalidate: 300 }).catch(() => null),
    ]);
    interviewStories = (interviewData as any)?.posts?.nodes || [];
    seriesTheRadar      = (seriesData as any)?.theRadar?.posts?.nodes      || [];
    seriesPortraits     = (seriesData as any)?.portraits?.posts?.nodes     || [];
    seriesTheLane       = (seriesData as any)?.theLane?.posts?.nodes       || [];
    seriesThinkCreative = (seriesData as any)?.thinkCreative?.posts?.nodes || [];
  } catch (err) { console.error("Interviews/Series fetch error:", err); }

  // ── Deduplicate by slug ───────────────────────────────────────────────────
  // Priority: latestIssue > coverStory > stories > interviews > series
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
