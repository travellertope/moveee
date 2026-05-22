import {
  getWPData,
  GET_STORIES,
  GET_JOURNEYS,
  GET_DIRECTORY_ENTRIES,
  GET_PRODUCTS,
  getEventsWithFallback,
  getWPQuotes,
  getLatestIssue,
  getPostsByIssue,
  type IssueTerm,
} from "@/lib/wp";

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

  // Cover story — try edition-specific tag first, fall back to global cover-story
  try {
    if (editionTag) {
      const edCover = await getWPData(GET_STORIES, { first: 1, tag: `cover-story-${editionTag}` }, { revalidate: 0 });
      coverStory = edCover?.posts?.nodes?.[0] || null;
    }
    if (!coverStory) {
      const globalCover = await getWPData(GET_STORIES, { first: 1, tag: "cover-story" }, { revalidate: 0 });
      coverStory = globalCover?.posts?.nodes?.[0] || null;
    }
  } catch (err) { console.error("Cover story fetch error:", err); }

  // Stories — edition-tagged first, fall back to latest
  try {
    const vars = editionTag
      ? { first: 14, tag: editionTag }
      : { first: 14 };
    const data = await getWPData(GET_STORIES, vars, { revalidate: 0 });
    const all: any[] = data?.posts?.nodes || [];

    // If edition tag returned fewer than 4 stories, supplement with latest
    let pool = all;
    if (editionTag && all.length < 4) {
      const fallback = await getWPData(GET_STORIES, { first: 14 }, { revalidate: 0 });
      const fallbackStories: any[] = fallback?.posts?.nodes || [];
      const existingIds = new Set(all.map((s: any) => s.id));
      pool = [...all, ...fallbackStories.filter((s: any) => !existingIds.has(s.id))].slice(0, 14);
    }

    if (!coverStory) {
      coverStory = pool[0];
      stories = pool.slice(1, 14);
    } else {
      stories = pool.filter((s: any) => s.id !== coverStory.id).slice(0, 13);
    }
  } catch (err) { console.error("Stories fetch error:", err); }

  // Events — filter by edition tag if provided
  try {
    events = await getEventsWithFallback(6, { revalidate: 0 });
    if (editionTag && events.length > 0) {
      // Filter events tagged for this edition; fall back to all if none match
      const tagged = events.filter((e: any) =>
        e.tags?.nodes?.some((t: any) => t.slug === editionTag)
      );
      if (tagged.length >= 2) events = tagged;
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
    const data = await getWPData(GET_STORIES, { first: 5, categoryName: "Interviews" }, { revalidate: 0 });
    interviewStories = data?.posts?.nodes || [];
  } catch (err) { console.error("Interviews fetch error:", err); }

  // Deduplicate by slug so the same post never appears in two sections
  const usedSlugs = new Set<string>();
  if (coverStory?.slug) usedSlugs.add(coverStory.slug);
  stories = stories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });
  latestIssueStories = latestIssueStories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });
  interviewStories = interviewStories.filter(s => {
    if (!s.slug || usedSlugs.has(s.slug)) return false;
    usedSlugs.add(s.slug);
    return true;
  });

  return { coverStory, stories, events, origins, products, quotes, pulseStories, directoryEntries, latestIssue, latestIssueStories, interviewStories };
}
