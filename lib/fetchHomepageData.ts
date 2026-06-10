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

  // Kick off latest-issue fetch immediately — it has a sequential dependency
  // (getPostsByIssue needs the ID) so starting it early reduces total wall time.
  const latestIssuePromise = getLatestIssue().catch(() => null);

  // Stories — two parallel fetches for edition views:
  //   1. Posts tagged for this edition (guaranteed to appear)
  //   2. All latest posts (the universal/untagged ones live here)
  // Posts tagged for a DIFFERENT edition are excluded from pool 2.
  // First post in the merged pool becomes the left-panel cover story.
  try {
    if (editionTag) {
      const otherEditions = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);

      // Run three queries in parallel: edition posts, all-latest, and tag-only
      // data for each other edition (lightweight — just id + tags).
      const [editionData, latestData, ...otherTagData] = await Promise.all([
        getWPData(GET_STORIES, { first: 14, tag: editionTag }, { revalidate: 300 }),
        getWPData(GET_STORIES, { first: 20 }, { revalidate: 300 }),
        ...otherEditions.map(tag =>
          getWPData(GET_STORIES_TAGS, { first: 50, tag }, { revalidate: 300 })
        ),
      ]);

      const editionPosts: any[] = editionData?.posts?.nodes || [];
      const latestPosts: any[]  = latestData?.posts?.nodes  || [];

      // Build a set of IDs that belong to other editions (to exclude from latest pool).
      const otherEditionIds = new Set<string>(
        otherTagData.flatMap((d: any) => d?.posts?.nodes?.map((p: any) => p.id) ?? [])
      );

      const editionIds = new Set(editionPosts.map((p: any) => p.id));

      // From the all-latest pool take posts not already in editionPosts and not
      // belonging to another edition.
      const universalPosts = latestPosts.filter(
        (p: any) => !editionIds.has(p.id) && !otherEditionIds.has(p.id)
      );

      // Edition-specific posts first, then universal posts (both already date-ordered by WP).
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

  // Events — for edition views: show events tagged for this edition + universal events.
  // Universal = not explicitly tagged for any other edition.
  // Events use the same tag structure as posts so we can check .tags?.nodes.
  try {
    events = await getEventsWithFallback(editionTag ? 18 : 6, { revalidate: 300 });
    if (editionTag && events.length > 0) {
      const otherEditions = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);
      events = events.filter((e: any) => {
        const eventTags: string[] = e.tags?.nodes?.map((t: any) => t.slug) ?? [];
        // If we have no tag data, include the event (fail open rather than fail closed).
        if (eventTags.length === 0 && !e.tags) return true;
        return !otherEditions.some(t => eventTags.includes(t));
      }).slice(0, 6);
    }
  } catch (err) { console.error("Events fetch error:", err); }

  // Origins
  try {
    const data = await getWPData(GET_JOURNEYS, { first: 6 }, { revalidate: 300 });
    origins = data?.cultureJourneys?.nodes || [];
  } catch (err) { console.error("Origins fetch error:", err); }

  // Products — fetch edition-tagged and global in parallel, then merge.
  // Edition-tagged posts take priority; global fills gaps if fewer than 4 tagged.
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

  // Directory — random 8 from a larger pool
  try {
    const data = await getWPData(GET_DIRECTORY_ENTRIES, { first: 24 }, { revalidate: 300 });
    const all: any[] = data?.cultureDirectories?.nodes || [];
    directoryEntries = all.sort(() => Math.random() - 0.5).slice(0, 8);
  } catch (err) { console.error("Directory fetch error:", err); }

  // Quotes — random 3 from a larger pool
  try {
    const data = await getWPQuotes({ first: 15 }, { revalidate: 300 });
    const all: any[] = data?.cultureQuotes?.nodes || [];
    quotes = all.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (err) { console.error("Quotes fetch error:", err); }

  // Pulse stories
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com";
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/pulse-stories?per_page=4&orderby=date&order=desc&_embed=1`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) pulseStories = await res.json();
  } catch (err) { console.error("Pulse fetch error:", err); }

  // Latest Issue — awaits the promise started at the top of this function
  try {
    latestIssue = await latestIssuePromise;
    if (latestIssue) {
      latestIssueStories = await getPostsByIssue(latestIssue.id);
    }
  } catch (err) { console.error("Latest issue fetch error:", err); }

  // Interviews strip
  try {
    const data = await getWPData(GET_STORIES, { first: 10, categoryName: "Interviews" }, { revalidate: 300 });
    interviewStories = data?.posts?.nodes || [];
  } catch (err) { console.error("Interviews fetch error:", err); }

  // Series strips — single batched GraphQL query (4→1 request)
  try {
    const seriesData = await getWPData(GET_SERIES_STORIES_BATCH, {}, { revalidate: 300 });
    seriesTheRadar      = seriesData?.theRadar?.posts?.nodes      || [];
    seriesPortraits     = seriesData?.portraits?.posts?.nodes     || [];
    seriesTheLane       = seriesData?.theLane?.posts?.nodes       || [];
    seriesThinkCreative = seriesData?.thinkCreative?.posts?.nodes || [];
  } catch (err) { console.error("Series fetch error:", err); }

  // Deduplicate by slug. Priority: latestIssue > coverStory > stories > interviews > series
  const usedSlugs = new Set<string>();

  // 1. Latest issue — highest priority, register its slugs first
  latestIssueStories = latestIssueStories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  // 2. Cover story is always kept (explicitly chosen), just register its slug
  if (coverStory?.slug) usedSlugs.add(coverStory.slug);

  // 3. Hero stories — skip anything already in issue or cover
  stories = stories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  // 4. Interviews — skip anything seen above
  interviewStories = interviewStories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  // 5. Series strips — each independently filtered, don't add to usedSlugs
  //    (series posts may legitimately repeat across different series)
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
