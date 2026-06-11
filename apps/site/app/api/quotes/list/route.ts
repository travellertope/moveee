import { NextRequest, NextResponse } from "next/server";

const WP_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";

const QUERY = `
  query GetQuotesPaged($first: Int, $after: String) {
    cultureQuotes(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
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
    }
  }
`;

const QUERY_BASIC = `
  query GetQuotesPagedBasic($first: Int, $after: String) {
    cultureQuotes(first: $first, after: $after, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
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
    }
  }
`;

async function runQuery(query: string, variables: object) {
  const res = await fetch(WP_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.errors ? null : json.data ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after") ?? null;
  const perPage = Math.min(parseInt(searchParams.get("perPage") ?? "20"), 50);

  const variables = { first: perPage, after: after || null };

  let data = await runQuery(QUERY, variables);
  if (!data) data = await runQuery(QUERY_BASIC, variables);

  if (!data) {
    return NextResponse.json({ quotes: [], hasNextPage: false, endCursor: null });
  }

  const result = data.cultureQuotes;
  return NextResponse.json({
    quotes: result?.nodes ?? [],
    hasNextPage: result?.pageInfo?.hasNextPage ?? false,
    endCursor: result?.pageInfo?.endCursor ?? null,
  });
}
