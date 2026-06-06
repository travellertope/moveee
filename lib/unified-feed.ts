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
  body?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
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

/** Fetch the latest community posts from the culture_post CPT. */
async function getCommunityPosts(): Promise<FeedItem[]> {
  const res = await fetch(
    `${WP_BASE}/community-posts?per_page=24&orderby=date&order=desc&_fields=id,slug,date,title,content,meta,comment_count&meta_fields=community_author_name,community_author_id,community_tag,community_region,community_author_tier,community_image_url,community_link_url,community_og_title,community_og_description,community_og_image,reaction_love,reaction_fire,reaction_clap`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const posts: any[] = await res.json().catch(() => []);

  return posts.map((post) => {
    const raw = post.content?.rendered ?? "";
    const { authorName, imageUrl, tag, tier } = parseCommunityData(post.meta, raw);
    // Preserve paragraph breaks before stripping HTML tags
    const withBreaks = raw
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n");
    const bodyText = decodeHtml(stripHtml(withBreaks));
    const textContent = bodyText || decodeHtml(stripHtml(post.title?.rendered ?? ""));

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
      region: (post.meta?.community_region as string) || undefined,
      sourceUrl: (post.meta?.community_link_url as string) || undefined,
      source: post.meta?.community_link_url
        ? (() => { try { return new URL(post.meta.community_link_url as string).hostname.replace(/^www\./, ""); } catch { return ""; } })()
        : undefined,
      ogTitle: (post.meta?.community_og_title as string) || undefined,
      ogDescription: (post.meta?.community_og_description as string) || undefined,
      ogImage: (post.meta?.community_og_image as string) || undefined,
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
        body: story.content?.rendered ?? "",
        image: story._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
        href: `/pulse/${story.slug}`,
        arm: story.meta?.pulse_arm_label ?? "",
        region: story.meta?.pulse_region_label ?? "",
        source: story.meta?.pulse_source ?? "",
        sourceUrl: story.meta?.pulse_external_url ?? "",
        ogTitle: story.meta?.pulse_og_title ?? "",
        ogDescription: story.meta?.pulse_og_description ?? "",
        ogImage: story.meta?.pulse_og_image ?? "",
        commentCount: story.comment_count ?? 0,
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

  // Sort newest first
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}
