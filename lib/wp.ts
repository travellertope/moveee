const WP_GRAPHQL_URL = "https://cms.themoveee.com/graphql";

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
      console.error(`GraphQL errors for ${WP_GRAPHQL_URL}:`, json.errors);
      return null;
    }

    return json.data;
  } catch (error: any) {
    // Return null instead of throwing so the build doesn't crash
    // when the CMS is unreachable (e.g. DNS not configured yet)
    console.error(`Network or Parsing Error for ${WP_GRAPHQL_URL}:`, error.message);
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
  query GetStories($first: Int, $categoryName: String) {
    posts(first: $first, where: { categoryName: $categoryName }) {
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

const JOURNEY_FIELDS_FRAGMENT = `
  fragment JourneyFields on Post {
    id
    title
    slug
    date
    featuredImage {
      node {
        sourceUrl
      }
    }
    categories {
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

export const JOURNEY_FIELDS = JOURNEY_FIELDS_FRAGMENT;

export const GET_JOURNEYS = `
  query GetJourneys($first: Int) {
    posts(first: $first, where: { categoryName: "origins" }) {
      nodes {
        ...JourneyFields
      }
    }
  }
  ${JOURNEY_FIELDS_FRAGMENT}
`;
export const GET_AUTHOR_STORIES = `
  query GetAuthorStories($first: Int, $slug: String!) {
    users(where: { nicename: $slug }) {
      nodes {
        name
        description
        slug
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
    posts(first: $first, where: { categoryName: "events", status: PUBLISH }) {
      nodes {
        ...StoryFields
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_EVENT_BY_SLUG = `
  query GetEventBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...StoryFields
      content
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_JOURNEY_BY_SLUG = `
  query GetJourneyBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
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
    ... on SimpleProduct { price regularPrice salePrice }
    ... on VariableProduct { price }
  }
`;

export const PRODUCT_FIELDS = PRODUCT_FIELDS_FRAGMENT;

export const GET_PRODUCTS = `
  query GetProducts($first: Int) {
    products(first: $first) {
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

export const GET_QUOTE_BY_ID = `
  query GetQuoteByID($id: ID!) {
    cultureQuote(id: $id, idType: DATABASE_ID) {
      ...QuoteFields
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
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
  }
`;
