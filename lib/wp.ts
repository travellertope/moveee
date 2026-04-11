const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://themoveee.com/graphql";

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
      throw new Error(`Failed to fetch API: ${res.statusText}`);
    }

    const json = await res.json();

    if (json.errors) {
      console.error(`GraphQL errors for ${WP_GRAPHQL_URL}:`, json.errors);
      throw new Error("Failed to fetch API due to GraphQL errors");
    }

    return json.data;
  } catch (error: any) {
    console.error(`Network or Parsing Error for ${WP_GRAPHQL_URL}:`, error.message);
    throw error;
  }
}

/**
 * Common Fragments for Editorial Components
 */
export const STORY_FIELDS = `
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
    categories {
      nodes {
        name
        slug
      }
    }
    # These taxonomies (industry, country, series) are bridged via the moveee-graphql-bridge plugin
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

export const GET_STORY_BY_SLUG = `
  query GetStoryBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...StoryFields
      content
      flexibleContent {
        contentBlocks {
          ... on Post_Flexiblecontent_ContentBlocks_DropCap {
            fieldGroupName
            text
          }
          ... on Post_Flexiblecontent_ContentBlocks_PullQuote {
            fieldGroupName
            quote
            author
          }
          ... on Post_Flexiblecontent_ContentBlocks_Gallery {
            fieldGroupName
            images {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
  \${STORY_FIELDS}
`;

export const GET_STORIES = `
  query GetStories($first: Int, $categoryName: String) {
    posts(first: $first, where: { categoryName: $categoryName }) {
      nodes {
        ...StoryFields
      }
    }
  }
  \${STORY_FIELDS}
`;

export const JOURNEY_FIELDS = `
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

export const GET_JOURNEYS = `
  query GetJourneys($first: Int) {
    posts(first: $first, where: { categoryName: "origins" }) {
      nodes {
        ...JourneyFields
      }
    }
  }
  \${JOURNEY_FIELDS}
`;
