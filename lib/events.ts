import { getWPData } from "@/lib/wp";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

const GET_EVENTS_SAFE = `
  query GetEventsSafe($first: Int) {
    cultureEvents(first: $first) {
      nodes {
        id
        databaseId
        title
        slug
        date
        excerpt
        eventDate
        endDate
        location
        admission
        isFeatured
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        cultureInterests {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

const GET_EVENT_BY_SLUG_SAFE = `
  query GetEventBySlugSafe($slug: ID!) {
    cultureEvent(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      date
      excerpt
      content
      eventDate
      endDate
      location
      admission
      isFeatured
      openingHours
      tagline
      attribution
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      cultureInterests {
        nodes {
          name
          slug
        }
      }
    }
  }
`;

function mapRestEventToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    content: item?.content?.rendered ?? "",
    eventDate: item?.meta?.event_date || item?.meta?._culture_event_date || item?.date || null,
    endDate: item?.meta?.end_date || item?.meta?._culture_end_date || null,
    location: item?.meta?.location || item?.meta?._culture_location || null,
    admission: item?.meta?.admission || item?.meta?._culture_admission || null,
    isFeatured: Boolean(item?.meta?.is_featured || item?.meta?._culture_is_featured),
    openingHours: item?.meta?.opening_hours || item?.meta?._culture_opening_hours || null,
    tagline: item?.meta?.tagline || item?.meta?._culture_tagline || null,
    attribution: item?.meta?.attribution || item?.meta?._culture_attribution || null,
    featuredImage: embeddedMedia?.source_url
      ? {
          node: {
            sourceUrl: embeddedMedia.source_url,
            altText: embeddedMedia.alt_text || "",
          },
        }
      : null,
    cultureInterests: { nodes: [] },
    metrics: [],
    schedule: [],
    showcase: [],
    featuredHost: null,
    associatedJourney: null,
    pressDetails: null,
  };
}

export async function getEventsWithFallback(first = 50, options: any = {}) {
  const gql = await getWPData(GET_EVENTS_SAFE, { first }, options);
  const gqlEvents = gql?.cultureEvents?.nodes ?? [];
  if (gqlEvents.length > 0) return gqlEvents;

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_event?per_page=${first}&status=publish&_embed=1&orderby=date&order=desc`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        revalidate: options.revalidate !== undefined ? options.revalidate : 3600,
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestEventToFrontendShape);
  } catch {
    return [];
  }
}

export async function getEventBySlugWithFallback(slug: string, options: any = {}) {
  const gql = await getWPData(GET_EVENT_BY_SLUG_SAFE, { slug }, options);
  if (gql?.cultureEvent) return gql.cultureEvent;

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_event?slug=${encodeURIComponent(slug)}&status=publish&_embed=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        revalidate: options.revalidate !== undefined ? options.revalidate : 3600,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return mapRestEventToFrontendShape(json[0]);
  } catch {
    return null;
  }
}
