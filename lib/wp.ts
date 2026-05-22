const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

export async function getWPData(query: string, variables = {}, options: any = {}) {
  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: options.revalidate !== undefined ? options.revalidate : 3600,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!res.ok) {
      console.error(`Fetch failed for ${WP_GRAPHQL_URL}: ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    if (json.errors) {
      console.warn(`GraphQL partial errors for ${WP_GRAPHQL_URL}:`, json.errors);
      // Return data anyway if it exists (standard GraphQL behavior)
      return json.data || null;
    }

    return json.data;
  } catch (error: any) {
    // Return null instead of throwing so the build doesn't crash
    // when the CMS is unreachable (e.g. DNS not configured yet)
    console.error(`Network or Parsing Error for ${WP_GRAPHQL_URL}:`, error.message);
    return null;
  }
}

function mapRestEventToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  const acf = item?.acf || {};
  const meta = item?.meta || {};
  const pick = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== "" && v !== false) ?? null;

  const toMediaItem = (img: any) => {
    if (!img) return null;
    if (typeof img === "string") return { sourceUrl: img };
    if (typeof img === "object") {
      const url = img.url || img.source_url || img.sizes?.full || img.sizes?.large;
      return url ? { sourceUrl: url, altText: img.alt || "" } : null;
    }
    return null;
  };

  const normalizeShowcase = (arr: any) =>
    Array.isArray(arr)
      ? arr.map((s: any) => ({
          title: s?.title || "",
          media: s?.media || "",
          dimensions: s?.dimensions || "",
          year: s?.year || "",
          price: s?.price || "",
          image: toMediaItem(s?.image),
        }))
      : [];

  const normalizeHost = (h: any) => {
    // ACF relationship field can return: null, a post object, or an array of post objects/IDs
    const raw = Array.isArray(h) ? h[0] : h;
    if (!raw || typeof raw !== "object") return null;
    return {
      title: raw.post_title || raw.title || raw.name || "",
      slug: raw.post_name || raw.slug || "",
      excerpt: raw.post_excerpt || raw.excerpt || "",
      featuredImage: toMediaItem(raw.featured_image || raw.thumbnail)
        ? { node: toMediaItem(raw.featured_image || raw.thumbnail) }
        : null,
    };
  };

  const normalizeJourney = (j: any) => {
    if (!j || typeof j !== "object") return null;
    return {
      title: j.post_title || j.title || "",
      slug: j.post_name || j.slug || "",
    };
  };

  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    content: item?.content?.rendered ?? "",
    eventDate: pick(acf.event_date, meta.event_date, meta._culture_event_date) ?? null,
    endDate: pick(acf.end_date, meta.end_date, meta._culture_end_date),
    location: pick(acf.location, meta.location, meta._culture_location),
    city: pick(acf.city, meta.city, meta._culture_event_city),
    admission: pick(acf.admission, meta.admission, meta._culture_admission),
    isFeatured: Boolean(pick(acf.is_featured, meta.is_featured, meta._culture_is_featured)),
    isAiGenerated: [true, 1, '1', 'true', 'yes'].includes(acf.ai_generated ?? meta.ai_generated ?? meta._culture_ai_generated),
    openingHours: pick(acf.opening_hours, meta.opening_hours, meta._culture_opening_hours),
    tagline: pick(acf.tagline, meta.tagline, meta._culture_tagline),
    attribution: pick(acf.attribution, meta.attribution, meta._culture_attribution),
    ticketingUrl: pick(acf.ticketing_url, meta.ticketing_url, meta._culture_ticketing_url),
    featuredImage: embeddedMedia?.source_url
      ? {
          node: {
            sourceUrl: embeddedMedia.source_url,
            altText: embeddedMedia.alt_text || "",
          },
        }
      : null,
    cultureInterests: {
      nodes: Array.isArray(item?.culture_interests)
        ? item.culture_interests.map((c: any) => ({ name: c.name, slug: c.slug }))
        : [],
    },
    metrics: Array.isArray(acf.metrics) ? acf.metrics : (Array.isArray(meta.metrics) ? meta.metrics : []),
    schedule: Array.isArray(acf.schedule) ? acf.schedule : (Array.isArray(meta.schedule) ? meta.schedule : []),
    showcase: normalizeShowcase(acf.showcase || meta.showcase),
    featuredHost: normalizeHost(acf.featured_host),
    associatedJourney: normalizeJourney(acf.associated_journey),
    pressDetails: acf.press_details || meta.press_details || null,
    eventSubtype: pick(acf.event_subtype, meta.event_subtype),
    aboutLabel: pick(acf.about_label, meta.about_label),
    venueAddress: pick(acf.venue_address, meta.venue_address),
    rsvpCapacity: acf.rsvp_capacity ? parseInt(String(acf.rsvp_capacity), 10) : null,
    rsvpMembersNote: pick(acf.rsvp_members_note, meta.rsvp_members_note),
    showcaseLabel: pick(acf.showcase_label, meta.showcase_label) || null,
    artistSectionLabel: pick(acf.artist_section_label, meta.artist_section_label) || null,
    artistLinkLabel: pick(acf.artist_link_label, meta.artist_link_label) || null,
    chapterId: acf.chapter_id ? parseInt(String(acf.chapter_id), 10)
      : meta._culture_chapter_id ? parseInt(String(meta._culture_chapter_id), 10)
      : null,
    rsvpTicketTypes: Array.isArray(acf.rsvp_ticket_types)
      ? acf.rsvp_ticket_types.map((t: any) => ({
          ticketName:     t.ticket_name     ?? '',
          ticketSlug:     t.ticket_slug     ?? '',
          ticketInfo:     t.ticket_info     ?? '',
          ticketPrice:    t.ticket_price    ?? null,
          ticketAmount:   t.ticket_amount   != null ? parseInt(String(t.ticket_amount), 10) : 0,
          ticketCurrency: t.ticket_currency ?? 'NGN',
        }))
      : [],
    associatedChapter: null as { title: string; slug: string; excerpt: string; featuredImage: { node: { sourceUrl: string } } | null } | null,
  };
}

function mapRestDirectoryToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  const embeddedTerms: any[][] = item?._embedded?.["wp:term"] ?? [];
  const dirTypes  = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_dir_type");
  const interests = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_interest");
  const acf = item?.acf || {};
  const pick = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== "") ?? null;
  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    featuredImage: embeddedMedia?.source_url
      ? { node: { sourceUrl: embeddedMedia.source_url, altText: embeddedMedia.alt_text || "" } }
      : null,
    cultureDirectoryTypes: { nodes: dirTypes.map((t: any) => ({ name: t.name, slug: t.slug })) },
    cultureInterests: { nodes: interests.map((t: any) => ({ name: t.name, slug: t.slug })) },
    cultureAccesses: { nodes: [] },
    websiteUrl: pick(acf.website_url, acf.websiteUrl, item?.website_url),
    instagramHandle: pick(acf.instagram_handle, acf.instagramHandle),
    twitterHandle: pick(acf.twitter_handle, acf.twitterHandle),
    selectedWorks: [],
    infobox: null,
  };
}

export async function getDirectoryEntriesWithFallback(first = 200, options: any = {}) {
  const gql = await getWPData(GET_DIRECTORY_ENTRIES, { first }, options);
  const gqlEntries = gql?.cultureDirectories?.nodes ?? [];
  if (gqlEntries.length > 0) return gqlEntries;

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_directory?per_page=${Math.min(first, 100)}&status=publish&_embed=1&orderby=date&order=desc`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestDirectoryToFrontendShape);
  } catch {
    return [];
  }
}

export async function getEventsWithFallback(first = 50, options: any = {}) {
  const gql = await getWPData(GET_EVENTS, { first }, options);
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
  const gql = await getWPData(GET_EVENT_BY_SLUG, { slug }, options);
  if (gql?.cultureEvent) {
    const ev = gql.cultureEvent;
    // WPGraphQL may not resolve some ACF fields — patch via REST for host, chapterId
    const needsHostPatch = !ev.featuredHost?.title;
    if (needsHostPatch || !ev.chapterId) {
      try {
        const metaRes = await fetch(
          `${WP_BASE_URL}/wp-json/wp/v2/culture_event?slug=${encodeURIComponent(slug)}&status=publish&_fields=acf,meta`,
          { next: { revalidate: 3600 } }
        );
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          const acf = metaJson[0]?.acf ?? {};
          const meta = metaJson[0]?.meta ?? {};

          if (!ev.chapterId) {
            const rawChapter = acf.chapter_id ?? meta._culture_chapter_id;
            if (rawChapter) ev.chapterId = parseInt(String(rawChapter), 10) || null;
          }

          if (needsHostPatch) {
            const rawHost = acf.featured_host;
            // ACF returns object, array-of-objects, or bare integer ID depending on return_format
            const hostId = typeof rawHost === "number" ? rawHost
              : Array.isArray(rawHost) ? (typeof rawHost[0] === "number" ? rawHost[0] : rawHost[0]?.ID ?? rawHost[0]?.id ?? null)
              : typeof rawHost === "object" && rawHost ? (rawHost.ID ?? rawHost.id ?? null)
              : null;
            if (hostId) {
              const hostRes = await fetch(
                `${WP_BASE_URL}/wp-json/wp/v2/culture_directory/${hostId}?_embed=1`,
                { next: { revalidate: 3600 } }
              );
              if (hostRes.ok) {
                const h = await hostRes.json();
                const img = h._embedded?.["wp:featuredmedia"]?.[0];
                ev.featuredHost = {
                  title: h.title?.rendered ?? "",
                  slug: h.slug ?? "",
                  excerpt: h.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "",
                  featuredImage: img?.source_url ? { node: { sourceUrl: img.source_url, altText: img.alt_text ?? "" } } : null,
                };
              }
            }
          }
        }
      } catch { /* non-fatal */ }
    }

    // Resolve missing showcase images via WP media API when GraphQL returns null
    if (Array.isArray(ev.showcase)) {
      const missing = ev.showcase
        .map((s: any, i: number) => {
          if (s.image?.sourceUrl) return null;
          // Try mediaItemUrl first, then fall back to databaseId fetch
          if (s.image?.mediaItemUrl) { ev.showcase[i].image = { sourceUrl: s.image.mediaItemUrl }; return null; }
          const id = s.image?.databaseId ?? null;
          return id ? { i, id } : null;
        })
        .filter(Boolean) as { i: number; id: number }[];
      if (missing.length > 0) {
        await Promise.allSettled(missing.map(async ({ i, id }) => {
          try {
            const mRes = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media/${id}`, { next: { revalidate: 3600 } });
            if (mRes.ok) {
              const m = await mRes.json();
              const url = m.source_url ?? m.guid?.rendered;
              if (url) ev.showcase[i] = { ...ev.showcase[i], image: { sourceUrl: url } };
            }
          } catch { /* non-fatal */ }
        }));
      }
    }

    // Resolve chapter if chapterId is set but chapter object not yet populated
    if (ev.chapterId && !ev.associatedChapter) {
      try {
        const chapterRes = await fetch(
          `${WP_BASE_URL}/wp-json/wp/v2/culture_chapter/${ev.chapterId}?_embed=1`,
          { next: { revalidate: 3600 } }
        );
        if (chapterRes.ok) {
          const ch = await chapterRes.json();
          const chImg = ch._embedded?.["wp:featuredmedia"]?.[0];
          ev.associatedChapter = {
            title: ch.title?.rendered ?? "",
            slug: ch.slug ?? "",
            excerpt: ch.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "",
            featuredImage: chImg?.source_url ? { node: { sourceUrl: chImg.source_url } } : null,
          };
        }
      } catch { /* non-fatal */ }
    }

    return ev;
  }

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
    const event = mapRestEventToFrontendShape(json[0]);

    // ACF post_object fields can return a bare integer ID, an object, or an array.
    // normalizeHost handles objects/arrays; if host is still missing, do a secondary fetch.
    if (!event.featuredHost?.title) {
      const rawHost = json[0]?.acf?.featured_host;
      const hostId = typeof rawHost === "number" ? rawHost
        : Array.isArray(rawHost) ? (typeof rawHost[0] === "number" ? rawHost[0] : rawHost[0]?.ID ?? rawHost[0]?.id ?? null)
        : typeof rawHost === "object" && rawHost ? (rawHost.ID ?? rawHost.id ?? null)
        : null;
      if (hostId) {
        try {
          const hostRes = await fetch(
            `${WP_BASE_URL}/wp-json/wp/v2/culture_directory/${hostId}?_embed=1`,
            { next: { revalidate: 3600 } }
          );
          if (hostRes.ok) {
            const h = await hostRes.json();
            const img = h._embedded?.["wp:featuredmedia"]?.[0];
            event.featuredHost = {
              title: h.title?.rendered ?? "",
              slug: h.slug ?? "",
              excerpt: h.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "",
              featuredImage: img?.source_url ? { node: { sourceUrl: img.source_url, altText: img.alt_text ?? "" } } : null,
            };
          }
        } catch { /* non-fatal */ }
      }
    }

    // Resolve showcase image IDs → actual URLs
    const showcaseImageIds: { i: number; id: number }[] = [];
    (event.showcase ?? []).forEach((s: any, i: number) => {
      const raw = json[0]?.acf?.showcase?.[i]?.image;
      if (!s.image?.sourceUrl && typeof raw === "number" && raw > 0) showcaseImageIds.push({ i, id: raw });
    });
    if (showcaseImageIds.length > 0) {
      await Promise.allSettled(showcaseImageIds.map(async ({ i, id }) => {
        try {
          const mRes = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media/${id}`, { next: { revalidate: 3600 } });
          if (mRes.ok) {
            const m = await mRes.json();
            const url = m.source_url ?? m.guid?.rendered;
            if (url) event.showcase[i].image = { sourceUrl: url };
          }
        } catch { /* non-fatal */ }
      }));
    }

    // Resolve chapter from meta
    const chapterId = event.chapterId
      ?? (json[0]?.meta?._culture_chapter_id ? parseInt(String(json[0].meta._culture_chapter_id), 10) : null);
    if (chapterId) {
      event.chapterId = chapterId;
      try {
        const chapterRes = await fetch(
          `${WP_BASE_URL}/wp-json/wp/v2/culture_chapter/${chapterId}?_embed=1`,
          { next: { revalidate: 3600 } }
        );
        if (chapterRes.ok) {
          const ch = await chapterRes.json();
          const chImg = ch._embedded?.["wp:featuredmedia"]?.[0];
          event.associatedChapter = {
            title: ch.title?.rendered ?? "",
            slug: ch.slug ?? "",
            excerpt: ch.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "",
            featuredImage: chImg?.source_url ? { node: { sourceUrl: chImg.source_url } } : null,
          };
        }
      } catch { /* non-fatal */ }
    }

    return event;
  } catch {
    return null;
  }
}

function mapRestNewsletterToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  const embeddedTerms: any[][] = item?._embedded?.["wp:term"] ?? [];
  const interestTerms = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_interest");
  const accessTerms   = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_access");

  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    content: item?.content?.rendered ?? "",
    featuredImage: embeddedMedia?.source_url
      ? { node: { sourceUrl: embeddedMedia.source_url, altText: embeddedMedia.alt_text || "" } }
      : null,
    cultureInterests: { nodes: interestTerms.map((t: any) => ({ name: t.name, slug: t.slug })) },
    cultureAccesses:  { nodes: accessTerms.map((t: any) => ({ slug: t.slug })) },
  };
}

export async function getNewslettersWithFallback(first = 50, options: any = {}) {
  try {
    const gql = await getWPData(GET_NEWSLETTERS, { first }, options);
    const nodes = gql?.cultureNewsletters?.nodes ?? [];
    if (nodes.length > 0) return nodes;
  } catch {}

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_newsletter?per_page=${first}&status=publish&_embed=1&orderby=date&order=desc`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestNewsletterToFrontendShape);
  } catch {
    return [];
  }
}

export async function getNewsletterBySlugWithFallback(slug: string, options: any = {}) {
  try {
    const gql = await getWPData(GET_NEWSLETTER_BY_SLUG, { slug }, options);
    if (gql?.cultureNewsletter) return gql.cultureNewsletter;
  } catch {}

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_newsletter?slug=${encodeURIComponent(slug)}&status=publish&_embed=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return mapRestNewsletterToFrontendShape(json[0]);
  } catch {
    return null;
  }
}

/**
 * Common Fragments for Editorial Components
 */
const STORY_FIELDS_FRAGMENT = `
  fragment StoryFields on Post {
    id
    databaseId
    title
    slug
    date
    excerpt
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    asToldTo
    seoTitle
    seoDescription
    author {
      node {
        name
        slug
        databaseId
        description
        avatar {
          url
        }
      }
    }
    categories {
      nodes {
        name
        slug
      }
    }
    industries {
      nodes {
        name
        slug
      }
    }
    series {
      nodes {
        name
        slug
      }
    }
    countries {
      nodes {
        name
        slug
      }
    }
    cultureAccesses {
      nodes {
        slug
      }
    }
    # Event specific fields (expected from ACF/JetEngine)
    location
    eventStatus: status
    isFeatured
    admission
  }
`;

export const STORY_FIELDS = STORY_FIELDS_FRAGMENT;

export const GET_STORY_BY_SLUG = `
  query GetStoryBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...StoryFields
      content
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_STORIES = `
  query GetStories($first: Int, $categoryName: String, $tag: String) {
    posts(first: $first, where: { categoryName: $categoryName, tag: $tag }) {
      nodes {
        ...StoryFields
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_FILTERS = `
  query GetFilters {
    categories(where: { hideEmpty: true, orderby: COUNT, order: DESC }, first: 100) { nodes { name, slug } }
    industries(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
    countries(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
    series(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
  }
`;

// Kept for reference but no longer used directly — see GET_SERIES_STORIES etc.
export const GET_TAX_STORIES = `
  query GetTaxStories($category: String, $series: ID, $industry: ID, $country: ID) {
    seriesItem(id: $series, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
    industry(id: $industry, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
    country(id: $country, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

// ── Magazine Issues ───────────────────────────────────────────────────────────

export const GET_ALL_ISSUES = `
  query GetAllIssues {
    issues(first: 50, where: { orderby: TERM_ORDER, order: DESC, hideEmpty: true }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        issueFields {
          issueNumber
          issueSubtitle
          issueEditorialNote
          issueCoverImageUrl
        }
        posts(first: 1) {
          nodes { date }
        }
      }
    }
  }
`;

export const GET_ISSUE_BY_SLUG = `
  query GetIssueBySlug($slug: ID!) {
    issue(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      issueFields {
        issueNumber
        issueSubtitle
        issueEditorialNote
        issueCoverImageUrl
      }
      posts(first: 100) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

// Separate per-taxonomy queries so we never pass null to a required ID! argument.
export const GET_SERIES_STORIES = `
  query GetSeriesStories($series: ID!) {
    seriesItem(id: $series, idType: SLUG) {
      name
      slug
      description
      posts(first: 48) { nodes { ...StoryFields } }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_INDUSTRY_STORIES = `
  query GetIndustryStories($industry: ID!) {
    industry(id: $industry, idType: SLUG) {
      name
      slug
      description
      posts(first: 48) { nodes { ...StoryFields } }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_COUNTRY_STORIES = `
  query GetCountryStories($country: ID!) {
    country(id: $country, idType: SLUG) {
      name
      slug
      description
      posts(first: 48) { nodes { ...StoryFields } }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_CATEGORY_INFO = `
  query GetCategoryInfo($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      name
      slug
      description
    }
  }
`;

export const GET_TAG_INFO = `
  query GetTagInfo($tag: ID!) {
    tag(id: $tag, idType: SLUG) {
      name
      slug
      description
    }
  }
`;

// ── COMMUNITY CHAPTERS & EVENTS FRAGMENTS ─────────────────────────────────

const DIRECTORY_FIELDS_FRAGMENT = `
  fragment DirectoryFields on CultureDirectory {
    id
    databaseId
    title
    slug
    date
    excerpt
    featuredImage {
      node {
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
    }
    cultureDirectoryTypes {
      nodes {
        name
        slug
      }
    }
    cultureInterests {
      nodes {
        name
        slug
      }
    }
    cultureAccesses {
      nodes {
        slug
      }
    }
    websiteUrl
    instagramHandle
    twitterHandle
    selectedWorks {
      title
      imageUrl
    }
    infobox {
      born died nationality occupation knownFor originCity activeYears awards labels education
      country region population officialLanguage currency founded area
      founders originCountry activePeriod ideology keyFigures relatedMovements
      originDecade instruments tempoBpm keyArtists relatedGenres subgenres
      keyThinkers period relatedConcepts
      director year starring cinematographer language distributor runtime productionCompany
      author yearPublished genre publisher pages isbn
      artist medium dimensions currentLocation artCollection style
      foodType mainIngredients alsoKnownAs culturalContext
      origin era keyDesigners materials culturalSignificance
      creator network seasons years
    }
  }
`;

const JOURNEY_FIELDS_FRAGMENT = `
  fragment JourneyFields on CultureJourney {
    id
    databaseId
    title
    slug
    date
    excerpt
    content
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    journeyEdition
    journeyDates
    journeyLocation
    journeyPrice
    journeySpots
    journeyStatus
    journeyInclusions
    journeyExclusions
    journeyItinerary {
      dayNumber
      dayTitle
      dayLocation
      dayDescription
      activities {
        activityTime
        activityTitle
        activityDescription
        activityType
      }
    }
    journeyHosts {
      hostName
      hostRole
      hostBio
      hostImage {
        sourceUrl
      }
    }
  }
`;

const EVENT_FIELDS_FRAGMENT = `
  fragment EventFields on CultureEvent {
    id
    databaseId
    title
    slug
    date
    eventDate
    endDate
    location
    eventLocation: location
    admission
    ticketingUrl
    isFeatured
    isAiGenerated
    tagline
    attribution
    openingHours
    excerpt
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
    metrics {
      label
      value
    }
    schedule {
      time
      title
      description
      access
    }
    showcase {
      title
      media
      dimensions
      year
      price
      imageUrl
    }
    featuredHost {
      title
      slug
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
    associatedJourney {
      ...JourneyFields
    }
    pressDetails {
      eyebrow
      title
      content
      link
    }
    eventSubtype
    aboutLabel
    showcaseLabel
    artistSectionLabel
    artistLinkLabel
    venueAddress
    rsvpCapacity
    rsvpMembersNote
    rsvpTicketTypes {
      ticketName
      ticketSlug
      ticketInfo
      ticketPrice
      ticketAmount
      ticketCurrency
    }
    chapterId
  }
`;

export const JOURNEY_FIELDS = JOURNEY_FIELDS_FRAGMENT;

export const GET_JOURNEYS = `
  query GetJourneys($first: Int) {
    cultureJourneys(first: $first) {
      nodes {
        ...JourneyFields
      }
    }
  }
  ${JOURNEY_FIELDS_FRAGMENT}
`;

export const GET_AUTHOR_STORIES = `
  query GetAuthorStories($first: Int, $id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      name
      description
      slug
      databaseId
      avatar {
        url
      }
      posts(first: $first) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_AUTHOR_STORIES_BY_SLUG = `
  query GetAuthorStoriesBySlug($first: Int, $slug: ID!) {
    user(id: $slug, idType: SLUG) {
      name
      description
      slug
      databaseId
      avatar {
        url
      }
      posts(first: $first) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_AUTHOR_STORIES_BY_LOGIN = `
  query GetAuthorStoriesByLogin($first: Int, $login: ID!) {
    user(id: $login, idType: USERNAME) {
      name
      description
      slug
      databaseId
      avatar {
        url
      }
      posts(first: $first) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

const NEWSLETTER_FIELDS_FRAGMENT = `
  fragment NewsletterFields on CultureNewsletter {
    id
    databaseId
    title
    slug
    date
    excerpt
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
    cultureAccesses {
      nodes {
        slug
      }
    }
  }
`;

export const NEWSLETTER_FIELDS = NEWSLETTER_FIELDS_FRAGMENT;

export const GET_NEWSLETTERS = `
  query GetNewsletters($first: Int) {
    cultureNewsletters(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        ...NewsletterFields
      }
    }
  }
  ${NEWSLETTER_FIELDS_FRAGMENT}
`;

export const GET_NEWSLETTER_BY_SLUG = `
  query GetNewsletterBySlug($slug: ID!) {
    cultureNewsletter(id: $slug, idType: SLUG) {
      ...NewsletterFields
      content
    }
  }
  ${NEWSLETTER_FIELDS_FRAGMENT}
`;

export const GET_ADJACENT_NEWSLETTERS = `
  query GetAdjacentNewsletters($notIn: [ID], $first: Int) {
    cultureNewsletters(first: $first, where: { status: PUBLISH, notIn: $notIn }) {
      nodes {
        title
        slug
        date
      }
    }
  }
`;

export const GET_EVENTS = `
  query GetEvents($first: Int) {
    cultureEvents(first: $first) {
      nodes {
        ...EventFields
      }
    }
  }
  ${EVENT_FIELDS_FRAGMENT}
  ${JOURNEY_FIELDS_FRAGMENT}
`;

export const GET_EVENT_BY_SLUG = `
  query GetEventBySlug($slug: ID!) {
    cultureEvent(id: $slug, idType: SLUG) {
      ...EventFields
      content
    }
  }
  ${EVENT_FIELDS_FRAGMENT}
  ${JOURNEY_FIELDS_FRAGMENT}
`;

const CHAPTER_FIELDS_FRAGMENT = `
  fragment ChapterFields on CultureChapter {
    id
    databaseId
    title
    slug
    date
    content
    excerpt
    latitude
    longitude
    lat
    lng
    leaderId
    leaderName
    memberCount
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
`;

export const GET_CHAPTERS = `
  query GetChapters($first: Int) {
    cultureChapters(first: $first) {
      nodes {
        ...ChapterFields
      }
    }
  }
  ${CHAPTER_FIELDS_FRAGMENT}
`;

export const GET_CHAPTER_BY_SLUG = `
  query GetChapterBySlug($slug: ID!) {
    cultureChapter(id: $slug, idType: SLUG) {
      ...ChapterFields
      relatedEvents {
        ...StoryFields
      }
    }
  }
  ${CHAPTER_FIELDS_FRAGMENT}
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_JOURNEY_BY_SLUG = `
  query GetJourneyBySlug($slug: ID!) {
    cultureJourney(id: $slug, idType: SLUG) {
      ...JourneyFields
      content
    }
  }
  ${JOURNEY_FIELDS_FRAGMENT}
`;

const PRODUCT_FIELDS_FRAGMENT = `
  fragment ProductFields on Product {
    id
    databaseId
    name
    slug
    description
    shortDescription
    image { sourceUrl altText }
    galleryImages { nodes { sourceUrl altText } }
    productCategories { nodes { name slug } }
    productTags { nodes { name slug } }
    ... on SimpleProduct {
      price
      regularPrice
      salePrice
      stockStatus
      stockQuantity
      onSale
    }
    ... on VariableProduct {
      price
      stockStatus
      onSale
      variations(first: 12) {
        nodes {
          price
          stockStatus
          attributes { nodes { name value } }
        }
      }
    }
  }
`;

export const PRODUCT_FIELDS = PRODUCT_FIELDS_FRAGMENT;

export const GET_PRODUCTS = `
  query GetProducts($first: Int, $category: String, $tag: String) {
    products(first: $first, where: { category: $category, tag: $tag }) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;


export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Fetched separately so the product page still renders if the
// moveee-graphql-bridge plugin is not yet active.
export const GET_PRODUCT_EXTRA = `
  query GetProductExtra($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      vendorProfile {
        slug
        storeName
        bio
        city
        country
        avatarUrl
        yearsActive
        rating
        productCount
      }
      moveeeMeta {
        makerStory
        careInstructions
        processSteps
        asSeenInPostId
        deliveryInfo
      }
    }
  }
`;

export const GET_PRODUCT_CATEGORIES = `
  query GetProductCategories {
    productCategories(first: 20, where: { hideEmpty: true }) {
      nodes {
        name
        slug
        count
        image { sourceUrl altText }
      }
    }
  }
`;

export const GET_POST_BY_ID = `
  query GetPostById($id: ID!) {
    post(id: $id, idType: DATABASE_ID) {
      title
      slug
      excerpt
      featuredImage { node { sourceUrl altText } }
      categories { nodes { name slug } }
    }
  }
`;

export const GET_PRODUCTS_BY_VENDOR = `
  query GetProductsByVendor($first: Int, $vendor: String) {
    products(first: $first, where: { authorName: $vendor }) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

const VENDOR_PROFILE_FIELDS = `
  slug storeName bio city country avatarUrl yearsActive rating productCount
`;

export const GET_ALL_MAKERS = `
  query GetAllMakers($first: Int) {
    moveeeVendors(first: $first) { ${VENDOR_PROFILE_FIELDS} }
  }
`;

export const GET_MAKER_BY_SLUG = `
  query GetMakerBySlug($slug: String!) {
    moveeeVendorBySlug(slug: $slug) { ${VENDOR_PROFILE_FIELDS} }
  }
`;

export const DIRECTORY_FIELDS = DIRECTORY_FIELDS_FRAGMENT;

export const GET_DIRECTORY_ENTRIES = `
  query GetDirectoryEntries($first: Int) {
    cultureDirectories(first: $first, where: { status: PUBLISH }) {
      nodes {
        ...DirectoryFields
      }
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

/**
 * Fetch all entry-type taxonomy terms (culture_dir_type).
 * Used to populate filter buttons on the listing page and the
 * type select in the submission form — any type added in WP Admin
 * automatically appears without code changes.
 */
export const GET_DIRECTORY_TYPES = `
  query GetDirectoryTypes {
    cultureDirectoryTypes(first: 50) {
      nodes {
        name
        slug
        count
      }
    }
  }
`;

export const GET_DIRECTORY_ENTRY_BY_SLUG = `
  query GetDirectoryEntryBySlug($slug: ID!) {
    cultureDirectory(id: $slug, idType: SLUG) {
      ...DirectoryFields
      content
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

export const GET_DIRECTORY_ENTRIES_BY_TYPE = `
  query GetDirectoryEntriesByType($first: Int, $typeSlug: String) {
    cultureDirectories(first: $first, where: { status: PUBLISH, taxQuery: { taxArray: [{ taxonomy: CULTURE_DIR_TYPE, field: SLUG, terms: [$typeSlug] }] } }) {
      nodes {
        ...DirectoryFields
      }
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

export const GET_DIRECTORY_ENTRIES_BY_INTEREST = `
  query GetDirectoryEntriesByInterest($first: Int, $interestSlug: String) {
    cultureDirectories(first: $first, where: { status: PUBLISH, taxQuery: { taxArray: [{ taxonomy: CULTURE_INTEREST, field: SLUG, terms: [$interestSlug] }] } }) {
      nodes {
        ...DirectoryFields
      }
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

const QUOTE_FIELDS_FRAGMENT = `
  fragment QuoteFields on CultureQuote {
    id
    databaseId
    title
    slug
    content
    date
    quoteSource
    quoteLikes
    quoteAuthors {
      nodes {
        name
        slug
      }
    }
  }
`;

// Basic fragment without plugin-registered fields (quoteSource, quoteLikes).
// Used as a fallback when the culture-community plugin is not active.
const QUOTE_FIELDS_BASIC_FRAGMENT = `
  fragment QuoteFieldsBasic on CultureQuote {
    id
    databaseId
    title
    slug
    content
    date
    quoteAuthors {
      nodes {
        name
        slug
      }
    }
  }
`;

export const QUOTE_FIELDS = QUOTE_FIELDS_FRAGMENT;

export const GET_QUOTES = `
  query GetQuotes($first: Int) {
    cultureQuotes(first: $first, where: { status: PUBLISH }) {
      nodes {
        ...QuoteFields
      }
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
`;

const GET_QUOTES_BASIC = `
  query GetQuotesBasic($first: Int) {
    cultureQuotes(first: $first, where: { status: PUBLISH }) {
      nodes {
        ...QuoteFieldsBasic
      }
    }
  }
  ${QUOTE_FIELDS_BASIC_FRAGMENT}
`;

export const GET_QUOTE_BY_ID = `
  query GetQuoteByID($id: ID!) {
    cultureQuote(id: $id, idType: DATABASE_ID) {
      ...QuoteFields
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
`;

const GET_QUOTE_BY_ID_BASIC = `
  query GetQuoteByIDBasic($id: ID!) {
    cultureQuote(id: $id, idType: DATABASE_ID) {
      ...QuoteFieldsBasic
    }
  }
  ${QUOTE_FIELDS_BASIC_FRAGMENT}
`;

export const GET_QUOTES_BY_AUTHOR = `
  query GetQuotesByAuthor($slug: ID!) {
    quoteAuthor(id: $slug, idType: SLUG) {
      name
      description
      cultureQuotes(first: 100) {
        nodes {
          ...QuoteFields
        }
      }
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
`;

/**
 * Try the primary query; if it returns null (e.g. schema validation error
 * because the culture-community plugin is not active and quoteSource /
 * quoteLikes are not registered), transparently fall back to the simpler query.
 */
export async function getWPQuotes(variables: { first?: number }) {
  const primary = await getWPData(GET_QUOTES, variables, { revalidate: 0 });
  if (primary !== null) return primary;
  return getWPData(GET_QUOTES_BASIC, variables, { revalidate: 0 });
}

export async function getWPQuoteById(variables: { id: string }) {
  const primary = await getWPData(GET_QUOTE_BY_ID, variables);
  if (primary !== null) return primary;
  return getWPData(GET_QUOTE_BY_ID_BASIC, variables);
}

export const GET_SITE_SETTINGS = `
  query GetSiteSettings {
    allSettings {
      generalSettingsTitle
      generalSettingsDescription
    }
    mastheadTicker {
      issueText
      issueUrl
      announcementText
      announcementUrl
      locations
    }
    membershipSettings {
      patronLabel
      citizenLabel
      monthlyNgn
      yearlyNgn
      monthlyUsd
      yearlyUsd
    }
    adSettings {
      adsEnabled
      publisherId
      customScript
      slotLeaderboardTop
      slotLeaderboardMid
      slotLeaderboardPreQuotes
      slotHeroSidebar
    }
  }
`;

// ── Issue helpers (REST-based — term meta not available via GraphQL without ACF) ──

export interface IssueTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
  meta: {
    issue_number?: string | number;
    issue_subtitle?: string;
    issue_editorial_note?: string;
    issue_cover_image_url?: string;
  };
}

// Sort issues by decimal version number (e.g. "1.0", "2.1", "2.1.2") descending
function sortIssuesByNumber(issues: IssueTerm[]): IssueTerm[] {
  return [...issues].sort((a, b) => {
    const parse = (n: string | number | undefined) =>
      String(n ?? "0").split(".").map((s) => parseInt(s, 10) || 0);
    const pa = parse(a.meta?.issue_number);
    const pb = parse(b.meta?.issue_number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const diff = (pb[i] ?? 0) - (pa[i] ?? 0); // descending: latest first
      if (diff !== 0) return diff;
    }
    return b.id - a.id; // fallback: higher id first
  });
}

export async function getLatestIssue(): Promise<IssueTerm | null> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?per_page=50&orderby=id&order=desc&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return sortIssuesByNumber(data ?? [])[0] ?? null;
  } catch { return null; }
}

export async function getAllIssues(): Promise<IssueTerm[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?per_page=50&orderby=id&order=desc&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return sortIssuesByNumber(await res.json());
  } catch { return []; }
}

export async function getIssueBySlug(slug: string): Promise<IssueTerm | null> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?slug=${encodeURIComponent(slug)}&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  } catch { return null; }
}

export async function getIssuesForPost(postId: number): Promise<IssueTerm[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?post=${postId}&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function getPostsByIssue(issueId: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/posts?issues=${issueId}&per_page=100&orderby=date&order=asc&_embed=1&status=publish`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}
