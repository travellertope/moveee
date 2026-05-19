import {
  getWPData,
  getEventsWithFallback,
  getWPQuotes,
  GET_STORIES,
  GET_DIRECTORY_ENTRIES,
} from "./wp";
import { getPulseStories } from "./pulse-wordpress";
import { decodeHtml } from "./decode-html";

export type FeedItemType = "pulse" | "editorial" | "happening" | "directory" | "quote" | "community";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  image?: string;
  href: string;
  // pulse-specific
  arm?: string;
  region?: string;
  source?: string;
  sourceUrl?: string;
  // happening-specific
  eventDate?: string;
  location?: string;
  // directory-specific
  entryType?: string;
  // quote-specific
  quoteSource?: string;
  quoteAuthor?: string;
  // editorial-specific
  category?: string;
  // community-specific
  communityAuthor?: string;
  communityTag?: string;
  communityTier?: string;
  commentCount?: number;
  // reactions (community + pulse)
  reactions?: { love: number; fire: number; clap: number };
  wpId?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/** Parse community attribution from a WP post. Prefers proper meta fields;
 *  falls back to the legacy HTML-comment format for any old posts. */
function parseCommunityData(
  meta: Record<string, string> | null | undefined,
  content: string
): { authorName: string; imageUrl: string | null; tag: string | null; tier: string | null } {
  if (meta?.community_author_name) {
    return {
      authorName: meta.community_author_name,
      imageUrl:   meta.community_image_url || null,
      tag:        meta.community_tag || null,
      tier:       meta.community_author_tier || null,
    };
  }
  // Legacy fallback — HTML comment embedded in content.
  const match = content.match(/<!--community:(\{[\s\S]*?\})-->/);
  if (!match) return { authorName: "", imageUrl: null, tag: null, tier: null };
  try {
    const data = JSON.parse(match[1]);
    return {
      authorName: data.authorName ?? "",
      imageUrl:   data.imageUrl ?? null,
      tag:        data.tag ?? null,
      tier:       data.tier ?? null,
    };
  } catch {
    return { authorName: "", imageUrl: null, tag: null, tier: null };
  }
}

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_BASE = `${WP_URL}/wp-json/wp/v2`;

/** Fetch community category ID (slug "community"), or null if it doesn't exist yet. */
async function getCommunityCategory(): Promise<number | null> {
  const res = await fetch(`${WP_BASE}/categories?slug=community&_fields=id`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const cats: any[] = await res.json().catch(() => []);
  return cats[0]?.id ?? null;
}

/** Fetch the latest community posts from WordPress. */
async function getCommunityPosts(): Promise<FeedItem[]> {
  const catId = await getCommunityCategory();
  if (!catId) return [];

  const res = await fetch(
    `${WP_BASE}/posts?categories=${catId}&per_page=24&orderby=date&order=desc&_fields=id,slug,date,content,meta,comment_count`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const posts: any[] = await res.json().catch(() => []);

  return posts.map((post) => {
    const raw = post.content?.rendered ?? "";
    const { authorName, imageUrl, tag, tier } = parseCommunityData(post.meta, raw);
    const textContent = decodeHtml(stripHtml(raw.replace(/<!--[\s\S]*?-->/g, "")));

    return {
      id: `community-${post.id}`,
      type: "community" as const,
      title: textContent,
      slug: post.slug,
      date: post.date,
      image: imageUrl ?? undefined,
      href: `/community/${post.slug}`,
      communityAuthor: authorName || (post.excerpt?.rendered ? stripHtml(post.excerpt.rendered) : ""),
      communityTag: tag ?? "",
      communityTier: tier ?? undefined,
      commentCount: Number(post.comment_count ?? 0),
      reactions: {
        love: Number(post.meta?.reaction_love ?? 0),
        fire: Number(post.meta?.reaction_fire ?? 0),
        clap: Number(post.meta?.reaction_clap ?? 0),
      },
      wpId: String(post.id),
    };
  });
}

export async function getUnifiedFeed(): Promise<FeedItem[]> {
  const [
    pulseResult,
    storiesResult,
    eventsResult,
    directoryResult,
    quotesResult,
    communityResult,
  ] = await Promise.allSettled([
    getPulseStories({ perPage: 40 }),
    getWPData(GET_STORIES, { first: 30 }, { revalidate: 0 }),
    getEventsWithFallback(30, { revalidate: 0 }),
    getWPData(GET_DIRECTORY_ENTRIES, { first: 30 }, { revalidate: 0 }),
    getWPQuotes({ first: 50 }),
    getCommunityPosts(),
  ]);

  const items: FeedItem[] = [];

  // Pulse stories
  if (pulseResult.status === "fulfilled") {
    for (const story of pulseResult.value) {
      items.push({
        id: `pulse-${story.id}`,
        type: "pulse",
        title: decodeHtml(story.title?.rendered ?? ""),
        slug: story.slug,
        date: story.date,
        excerpt: stripHtml(story.excerpt?.rendered ?? ""),
        image: story._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
        href: `/pulse/${story.slug}`,
        arm: story.meta?.pulse_arm_label ?? "",
        region: story.meta?.pulse_region_label ?? "",
        source: story.meta?.pulse_source ?? "",
        sourceUrl: story.meta?.pulse_external_url ?? "",
        reactions: {
          love: Number((story.meta as any)?.reaction_love ?? 0),
          fire: Number((story.meta as any)?.reaction_fire ?? 0),
          clap: Number((story.meta as any)?.reaction_clap ?? 0),
        },
        wpId: String(story.id),
      });
    }
  }

  // Magazine editorials
  if (storiesResult.status === "fulfilled" && storiesResult.value?.posts?.nodes) {
    for (const post of storiesResult.value.posts.nodes) {
      items.push({
        id: `editorial-${post.slug}`,
        type: "editorial",
        title: decodeHtml(post.title ?? ""),
        slug: post.slug,
        date: post.date,
        excerpt: stripHtml(post.excerpt ?? ""),
        image: post.featuredImage?.node?.sourceUrl,
        href: `/magazine/${post.slug}`,
        category: post.categories?.nodes?.[0]?.name ?? "",
      });
    }
  }

  // Events / Happenings
  if (eventsResult.status === "fulfilled" && Array.isArray(eventsResult.value)) {
    for (const event of eventsResult.value) {
      items.push({
        id: `happening-${event.slug}`,
        type: "happening",
        title: decodeHtml(event.title ?? ""),
        slug: event.slug,
        date: event.date ?? event.eventDate ?? "",
        excerpt: stripHtml(event.excerpt ?? ""),
        image: event.featuredImage?.node?.sourceUrl,
        href: `/events/${event.slug}`,
        eventDate: event.eventDate ?? "",
        location: event.location ?? "",
      });
    }
  }

  // Culture Directory
  if (directoryResult.status === "fulfilled" && directoryResult.value?.cultureDirectories?.nodes) {
    for (const entry of directoryResult.value.cultureDirectories.nodes) {
      items.push({
        id: `directory-${entry.slug}`,
        type: "directory",
        title: decodeHtml(entry.title ?? ""),
        slug: entry.slug,
        date: entry.date,
        excerpt: stripHtml(entry.excerpt ?? ""),
        image: entry.featuredImage?.node?.sourceUrl,
        href: `/directory/${entry.slug}`,
        entryType: entry.cultureDirectoryTypes?.nodes?.[0]?.name ?? "",
      });
    }
  }

  // Culture Quotes
  if (quotesResult.status === "fulfilled" && quotesResult.value?.cultureQuotes?.nodes) {
    for (const quote of quotesResult.value.cultureQuotes.nodes) {
      items.push({
        id: `quote-${quote.slug}`,
        type: "quote",
        title: decodeHtml(stripHtml(quote.content ?? quote.title ?? "")),
        slug: quote.slug,
        date: quote.date,
        href: `/quotes/${quote.databaseId}-${quote.slug}`,
        wpId: String(quote.databaseId),
        quoteSource: quote.quoteSource ?? "",
        quoteAuthor: quote.quoteAuthors?.nodes?.[0]?.name ?? "",
      });
    }
  }

  // Community posts
  if (communityResult.status === "fulfilled") {
    items.push(...communityResult.value);
  }

  // Deduplicate: community posts are regular WP posts, so GET_STORIES also picks
  // them up as "editorial". Remove any editorial whose slug matches a community post.
  const communitySlugs = new Set(items.filter(i => i.type === "community").map(i => i.slug));
  const deduped = items.filter(i => !(i.type === "editorial" && communitySlugs.has(i.slug)));

  // Sort newest first
  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return deduped;
}
