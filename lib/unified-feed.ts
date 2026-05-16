import {
  getWPData,
  getEventsWithFallback,
  getWPQuotes,
  GET_STORIES,
  GET_DIRECTORY_ENTRIES,
} from "./wp";
import { getPulseStories } from "./pulse-wordpress";
import { decodeHtml } from "./decode-html";

export type FeedItemType = "pulse" | "editorial" | "happening" | "directory" | "quote";

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
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

export async function getUnifiedFeed(): Promise<FeedItem[]> {
  const [
    pulseResult,
    storiesResult,
    eventsResult,
    directoryResult,
    quotesResult,
  ] = await Promise.allSettled([
    getPulseStories({ perPage: 18 }),
    getWPData(GET_STORIES, { first: 12 }, { revalidate: 0 }),
    getEventsWithFallback(12, { revalidate: 0 }),
    getWPData(GET_DIRECTORY_ENTRIES, { first: 12 }, { revalidate: 0 }),
    getWPQuotes({ first: 12 }),
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
        href: `/connect/pulse#quote-${quote.databaseId}`,
        quoteSource: quote.quoteSource ?? "",
        quoteAuthor: quote.quoteAuthors?.nodes?.[0]?.name ?? "",
      });
    }
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}
