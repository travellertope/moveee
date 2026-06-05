import {
  getWPData,
  GET_STORIES,
  GET_SERIES_STORIES,
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

// Returns true if the post/event belongs in the given edition view.
// A piece of content is "universal" (no edition tags) → shown in every edition.
// A piece tagged for another edition is excluded from the current one.
function isEditionRelevant(item: any, editionTag: string): boolean {
  const tags: string[] = item.tags?.nodes?.map((t: any) => t.slug) ?? [];
  const otherEditionTags = (REGIONAL_SLUGS as readonly string[]).filter(t => t !== editionTag);
  const taggedForOtherEdition = otherEditionTags.some(t => tags.includes(t));
  return !taggedForOtherEdition;
}

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

  // Stories — fetch a wider pool then filter by edition relevance.
  // Universal posts (no edition tag) appear in every edition.
  // Posts tagged for a different edition are excluded from the current one.
  // The first post in the filtered pool becomes the left-panel cover story.
  try {
    // Fetch more when edition-filtering so we always have enough after the filter.
    const data = await getWPData(GET_STORIES, { first: editionTag ? 50 : 14 }, { revalidate: 0 });
    const all: any[] = data?.posts?.nodes || [];

    const pool = editionTag
      ? all.filter(s => isEditionRelevant(s, editionTag))
      : all;

    coverStory = pool[0] || null;
    stories = pool.slice(1, 14);
  } catch (err) { console.error("Stories fetch error:", err); }

  // Events — fetch more then apply the same edition-relevance filter:
  // show events for the current edition + universal (untagged) events,
  // exclude events tagged only for other editions.
  try {
    events = await getEventsWithFallback(editionTag ? 18 : 6, { revalidate: 0 });
    if (editionTag && events.length > 0) {
      events = events.filter(e => isEditionRelevant(e, editionTag)).slice(0, 6);
    }
  } catch (err) { console.error("Events fetch error:", err); }

  // Origins
  try {
    const data = await getWPData(GET_JOURNEYS, { first: 6 }, { revalidate: 0 });
    origins = data?.cultureJourneys?.nodes || [];
  } catch (err) { console.error("Origins fetch error:", err); }

  // Products — edition-tagged first, fall back to global if fewer than 4
  try {
    if (editionTag) {
      const tagged = await getWPData(GET_PRODUCTS, { first: 10, tag: editionTag });
      products = tagged?.products?.nodes || [];
    }
    if (products.length < 4) {
      const global = await getWPData(GET_PRODUCTS, { first: 10 });
      const globalProducts: any[] = global?.products?.nodes || [];
      const existingIds = new Set(products.map((p: any) => p.id));
      products = [...products, ...globalProducts.filter((p: any) => !existingIds.has(p.id))].slice(0, 10);
    }
  } catch (err) { console.error("Products fetch error:", err); }

  // Directory — random 8 from a larger pool
  try {
    const data = await getWPData(GET_DIRECTORY_ENTRIES, { first: 24 }, { revalidate: 0 });
    const all: any[] = data?.cultureDirectories?.nodes || [];
    directoryEntries = all.sort(() => Math.random() - 0.5).slice(0, 8);
  } catch (err) { console.error("Directory fetch error:", err); }

  // Quotes — random 3 from a larger pool
  try {
    const data = await getWPQuotes({ first: 15 });
    const all: any[] = data?.cultureQuotes?.nodes || [];
    quotes = all.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (err) { console.error("Quotes fetch error:", err); }

  // Pulse stories
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com";
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/pulse-stories?per_page=4&orderby=date&order=desc&_embed=1`,
      { next: { revalidate: 0 } }
    );
    if (res.ok) pulseStories = await res.json();
  } catch (err) { console.error("Pulse fetch error:", err); }

  // Latest Issue
  try {
    latestIssue = await getLatestIssue();
    if (latestIssue) {
      latestIssueStories = await getPostsByIssue(latestIssue.id);
    }
  } catch (err) { console.error("Latest issue fetch error:", err); }

  // Interviews strip
  try {
    const data = await getWPData(GET_STORIES, { first: 10, categoryName: "Interviews" }, { revalidate: 0 });
    interviewStories = data?.posts?.nodes || [];
  } catch (err) { console.error("Interviews fetch error:", err); }

  // Series strips — fetch in parallel
  try {
    const [radar, portraits, lane, creative] = await Promise.all([
      getWPData(GET_SERIES_STORIES, { series: "the-radar" },           { revalidate: 300 }),
      getWPData(GET_SERIES_STORIES, { series: "portraits-of-the-city" }, { revalidate: 300 }),
      getWPData(GET_SERIES_STORIES, { series: "the-lane" },            { revalidate: 300 }),
      getWPData(GET_SERIES_STORIES, { series: "think-like-a-creative" }, { revalidate: 300 }),
    ]);
    seriesTheRadar      = radar?.seriesItem?.posts?.nodes     || [];
    seriesPortraits     = portraits?.seriesItem?.posts?.nodes || [];
    seriesTheLane       = lane?.seriesItem?.posts?.nodes      || [];
    seriesThinkCreative = creative?.seriesItem?.posts?.nodes  || [];
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
