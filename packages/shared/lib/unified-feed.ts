import {
  getWPData,
  getEventsForFeed,
  getWPQuotes,
  GET_STORIES,
  GET_DIRECTORY_ENTRIES,
} from "./wp";
import { getPulseStories } from "./pulse-wordpress";
import { decodeHtml } from "@/lib/decode-html";

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
  endDate?: string;
  openingHours?: string;
  location?: string;
  city?: string;
  venueAddress?: string;
  admission?: string;
  eventCategory?: string;
  organiserName?: string;
  organiserSlug?: string;
  isFeatured?: boolean;
  isLiterati?: boolean;
  organiserDirectoryId?: number;
  // directory-specific
  entryType?: string;
  // quote-specific
  quoteSource?: string;
  quoteAuthor?: string;
  quoteSharingReason?: string;
  quoteType?: string;
  // editorial-specific
  category?: string;
  // community-specific
  communityAuthor?: string;
  communityAuthorUsername?: string;
  communityAuthorAvatar?: string;
  communityTag?: string;
  communityTier?: string;
  commentCount?: number;
  /** Hub linkage (docs/hubs-plan.md §4.5) — set only for posts fetched as
   * For You Hub candidates via getHubCandidatePosts(), never present on the
   * default getCommunityPosts() feed (Hub posts are excluded from that query
   * server-side). */
  hubId?: number;
  // template fields (community posts)
  templateType?: string;
  linkedDirectoryId?: number;
  starRating?: number;
  locationName?: string;
  pollOptions?: { text: string; votes: number }[];
  pollExpiresAt?: string;
  galleryImages?: string[];
  videoUrl?: string;
  itineraryStops?: { name: string; lat: number; lng: number; note: string; image_url: string }[];
  foodDishName?: string;
  foodRatingTaste?: number;
  foodRatingValue?: number;
  foodRatingVibe?: number;
  // event template + RSVP (community posts)
  ticketUrl?: string;
  rsvpEnabled?: boolean;
  rsvpCapacity?: number;
  rsvpCount?: number;
  // reactions (community + pulse)
  reactions?: { love: number; fire: number; clap: number };
  wpId?: string;
}

function stripHtml(html: string): string {
  // Preserve paragraph breaks before stripping tags — otherwise multi-paragraph
  // excerpts collapse into one continuous line on feed cards.
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
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
// Magazine/editorial content only lives on Site A (apps/site) — this feed mapper is shared
// with apps/connect (Site B, web.themoveee.com), which has no local /magazine route, so
// editorial hrefs must always be absolute rather than resolving against the current app's origin.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

/** Fetch the latest community posts from the culture_post CPT. */
export async function getCommunityPosts(): Promise<FeedItem[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(
      `${WP_BASE}/community-posts?per_page=24&orderby=date&order=desc&_fields=id,slug,date,title,content,meta,comment_count,community_event_meta&meta_fields=community_author_name,community_author_id,community_author_username,community_tag,community_region,community_author_tier,community_image_url,community_link_url,community_og_title,community_og_description,community_og_image,reaction_love,reaction_fire,reaction_clap,_template_type,_linked_directory_id,_star_rating,_location_name,_poll_options,_poll_expires_at,_gallery_images,_video_url,_itinerary_stops,_food_dish_name,_food_rating_taste,_food_rating_value,_food_rating_vibe,_event_date,_event_end_date,_event_venue,_event_city,_event_address,_event_admission,_event_ticket_url,_event_category`,
      { next: { revalidate: 300 }, signal: ctrl.signal }
    );
  } catch { clearTimeout(timer); return []; }
  clearTimeout(timer);
  if (!res.ok) return [];
  const posts: any[] = await res.json().catch(() => []);

  return posts.map((post) => {
    const raw = post.content?.rendered ?? "";
    const m = (post.meta ?? {}) as Record<string, any>;
    const { authorName, imageUrl, tag, tier } = parseCommunityData(m, raw);
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
      communityAuthorUsername: (m.community_author_username as string) || undefined,
      communityAuthorAvatar: (m.community_author_avatar as string) || undefined,
      communityTag: tag ?? "",
      communityTier: tier ?? undefined,
      region: (m.community_region as string) || undefined,
      sourceUrl: (m.community_link_url as string) || undefined,
      source: m.community_link_url
        ? (() => { try { return new URL(m.community_link_url as string).hostname.replace(/^www\./, ""); } catch { return ""; } })()
        : undefined,
      ogTitle: (m.community_og_title as string) || undefined,
      ogDescription: (m.community_og_description as string) || undefined,
      ogImage: (m.community_og_image as string) || undefined,
      commentCount: Number(post.comment_count ?? 0),
      reactions: {
        love: Number(m.reaction_love ?? 0),
        fire: Number(m.reaction_fire ?? 0),
        clap: Number(m.reaction_clap ?? 0),
      },
      wpId: String(post.id),
      // Template fields
      templateType: m._template_type || "post",
      linkedDirectoryId: m._linked_directory_id ? Number(m._linked_directory_id) : undefined,
      starRating: m._star_rating ? Number(m._star_rating) : undefined,
      locationName: m._location_name || undefined,
      pollOptions: m._poll_options ? (typeof m._poll_options === "string" ? (() => { try { return JSON.parse(m._poll_options); } catch { return undefined; } })() : m._poll_options) : undefined,
      pollExpiresAt: m._poll_expires_at || undefined,
      galleryImages: m._gallery_images ? (typeof m._gallery_images === "string" ? (() => { try { return JSON.parse(m._gallery_images); } catch { return undefined; } })() : m._gallery_images) : undefined,
      videoUrl: m._video_url || undefined,
      itineraryStops: m._itinerary_stops ? (typeof m._itinerary_stops === "string" ? (() => { try { return JSON.parse(m._itinerary_stops); } catch { return undefined; } })() : m._itinerary_stops) : undefined,
      foodDishName: m._food_dish_name || undefined,
      foodRatingTaste: m._food_rating_taste ? Number(m._food_rating_taste) : undefined,
      foodRatingValue: m._food_rating_value ? Number(m._food_rating_value) : undefined,
      foodRatingVibe: m._food_rating_vibe ? Number(m._food_rating_vibe) : undefined,
      // Event template (community-organiser events)
      eventDate: m._event_date || undefined,
      endDate: m._event_end_date || undefined,
      location: m._event_venue || undefined,
      venueAddress: m._event_address || undefined,
      city: m._event_city || undefined,
      admission: m._event_admission || undefined,
      eventCategory: m._event_category || undefined,
      ticketUrl: m._event_ticket_url || undefined,
      organiserName: post.community_event_meta?.organiser_name || undefined,
      organiserSlug: post.community_event_meta?.organiser_slug || undefined,
      rsvpEnabled: post.community_event_meta?.rsvp_enabled ?? undefined,
      rsvpCapacity: post.community_event_meta?.rsvp_capacity ?? undefined,
      rsvpCount: post.community_event_meta?.rsvp_count ?? undefined,
      isFeatured: Boolean(post.community_event_meta?.is_featured),
      organiserDirectoryId: post.community_event_meta?.organiser_id ? Number(post.community_event_meta.organiser_id) : undefined,
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
    getWPData(GET_STORIES, { first: 30 }, { revalidate: 300 }),
    getEventsForFeed(30, { revalidate: 300 }),
    getWPData(GET_DIRECTORY_ENTRIES, { first: 30 }, { revalidate: 300 }),
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
        category: story._embedded?.["wp:term"]?.flat()
          ?.find((t) => t.taxonomy === "pulse-categories")?.name ?? "",
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
        href: `${SITE_URL}/magazine/${post.slug}`,
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
        excerpt: decodeHtml(
          stripHtml(
            (event.excerpt ?? "")
              .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
              .replace(/<br\s*\/?>/gi, "\n")
          )
        ),
        body: event.content ?? event.excerpt ?? "",
        image: event.featuredImage?.node?.sourceUrl || event.eventImageUrl,
        href: `/events/${event.slug}`,
        eventDate: event.eventDate ?? "",
        endDate: event.endDate ?? "",
        openingHours: event.openingHours ?? "",
        location: event.location ?? "",
        city: event.city ?? "",
        venueAddress: event.venueAddress ?? "",
        admission: event.admission ?? "",
        eventCategory: event.cultureInterests?.nodes?.[0]?.name ?? "",
        organiserName: event.organiserName || undefined,
        organiserSlug: event.organiserSlug || undefined,
        organiserDirectoryId: event.organiserDirectoryId ?? undefined,
        isFeatured: Boolean(event.isFeatured),
        isLiterati: Boolean(event.isLiterati),
        rsvpCount: Number(event.rsvpCount) || 0,
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
        quoteSharingReason: quote.quoteSharingReason ?? "",
        quoteType: quote.quoteType ?? "",
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
