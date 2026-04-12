const WP_GRAPHQL_URL = "https://cms.themoveee.com/graphql";

export async function getWPData(query: string, variables = {}) {
  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 3600, // ISR: Revalidate every hour
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
  query GetAuthorStories($first: Int, $authorName: String!) {
    posts(first: $first, where: { authorName: $authorName }) {
      nodes {
        ...StoryFields
      }
    }
    users(where: { search: $authorName }) {
      nodes {
        name
        description
        slug
        avatar {
          url
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;
