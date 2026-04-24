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
    if (!h || typeof h !== "object") return null;
    return {
      title: h.post_title || h.title || h.name || "",
      slug: h.post_name || h.slug || "",
      excerpt: h.post_excerpt || h.excerpt || "",
      featuredImage: toMediaItem(h.featured_image || h.thumbnail)
        ? { node: toMediaItem(h.featured_image || h.thumbnail) }
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
    eventDate: pick(acf.event_date, meta.event_date, meta._culture_event_date, item?.date),
    endDate: pick(acf.end_date, meta.end_date, meta._culture_end_date),
    location: pick(acf.location, meta.location, meta._culture_location),
    admission: pick(acf.admission, meta.admission, meta._culture_admission),
    isFeatured: Boolean(pick(acf.is_featured, meta.is_featured, meta._culture_is_featured)),
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
    galleryRunText: pick(acf.gallery_run_text, meta.gallery_run_text),
    rsvpCapacity: acf.rsvp_capacity ? parseInt(String(acf.rsvp_capacity), 10) : null,
    rsvpMembersNote: pick(acf.rsvp_members_note, meta.rsvp_members_note),
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
    onViewImage: (() => {
      const raw = acf.on_view_image || meta.on_view_image;
      const item = toMediaItem(raw);
      return item ? { node: item } : null;
    })(),
  };
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

export const GET_TAX_STORIES = `
  query GetTaxStories($category: String, $series: ID, $industry: ID, $country: ID) {
    seriesItem(id: $series, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
    industry(id: $industry, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
    country(id: $country, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
  }
  ${STORY_FIELDS_FRAGMENT}
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
    featuredImage {
      node {
        sourceUrl
        altText
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
      image {
        sourceUrl
      }
    }
    featuredHost {
      ...DirectoryFields
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
    venueAddress
    galleryRunText
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
    onViewImage {
      node {
        sourceUrl
        altText
      }
    }
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
    cultureNewsletters(first: $first, where: { status: PUBLISH }) {
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
  ${DIRECTORY_FIELDS_FRAGMENT}
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
  ${DIRECTORY_FIELDS_FRAGMENT}
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
    metaData { key value }
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
  query GetProducts($first: Int, $category: String, $tag: String, $brand: String) {
    products(first: $first, where: { category: $category, tag: $tag, brand: $brand }) {
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
  }
`;
