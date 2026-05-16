import { NextRequest, NextResponse } from 'next/server';
import { searchCommunityPosts } from '@/lib/community-wordpress';

const WP_GRAPHQL_URL = 'https://cms.themoveee.com/graphql';
const WP_REST_URL    = `${process.env.NEXT_PUBLIC_WP_URL ?? 'https://cms.themoveee.com'}/wp-json/wp/v2`;

async function gql(query: string, variables: object) {
  const res = await fetch(WP_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (json.errors) return null; // schema validation failure (e.g. field not registered)
  return json.data;
}

const SEARCH_POSTS = `
  query SearchPosts($search: String!) {
    posts(first: 16, where: { search: $search, status: PUBLISH }) {
      nodes {
        id
        title
        slug
        featuredImage { node { sourceUrl altText } }
        categories { nodes { name slug } }
      }
    }
  }
`;

const SEARCH_PRODUCTS = `
  query SearchProducts($search: String!) {
    products(first: 6, where: { search: $search }) {
      nodes {
        id
        name
        slug
        image { sourceUrl }
        ... on SimpleProduct { price }
        ... on VariableProduct { price }
      }
    }
  }
`;

const SEARCH_QUOTES = `
  query SearchQuotes($search: String!) {
    cultureQuotes(first: 8, where: { search: $search, status: PUBLISH }) {
      nodes {
        id
        databaseId
        title
        slug
        quoteAuthors { nodes { name } }
      }
    }
  }
`;

const SEARCH_DIRECTORY = `
  query SearchDirectory($search: String!) {
    cultureDirectories(first: 6, where: { search: $search, status: PUBLISH }) {
      nodes {
        id
        title
        slug
        featuredImage { node { sourceUrl altText } }
        cultureDirectoryTypes { nodes { name slug } }
      }
    }
  }
`;

async function searchPulseStories(q: string) {
  const res = await fetch(
    `${WP_REST_URL}/pulse-stories?search=${encodeURIComponent(q)}&per_page=6&_fields=id,slug,title,excerpt`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  return res.json().catch(() => []);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ magazine: [], events: [], origins: [], products: [], quotes: [], directory: [], pulse: [], community: [] });
  }

  const [postsResult, productsResult, quotesResult, directoryResult, pulseResult, communityResult] =
    await Promise.allSettled([
      gql(SEARCH_POSTS, { search: q }),
      gql(SEARCH_PRODUCTS, { search: q }),
      gql(SEARCH_QUOTES, { search: q }),
      gql(SEARCH_DIRECTORY, { search: q }),
      searchPulseStories(q),
      searchCommunityPosts(q),
    ]);

  const posts: any[] = postsResult.status === 'fulfilled' && postsResult.value ? postsResult.value.posts?.nodes ?? [] : [];
  const products: any[] = productsResult.status === 'fulfilled' && productsResult.value ? productsResult.value.products?.nodes ?? [] : [];

  // Quotes: pre-build the URL segment (databaseId-slug) and extract author as meta
  const quotes: any[] = (quotesResult.status === 'fulfilled' && quotesResult.value
    ? quotesResult.value.cultureQuotes?.nodes ?? []
    : []
  ).map((q: any) => ({
    id: q.id,
    title: q.title,
    slug: `${q.databaseId}-${q.slug}`,
    meta: q.quoteAuthors?.nodes?.[0]?.name ?? null,
  }));

  // Directory: entry type name as meta
  const directory: any[] = (directoryResult.status === 'fulfilled' && directoryResult.value
    ? directoryResult.value.cultureDirectories?.nodes ?? []
    : []
  ).map((d: any) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    featuredImage: d.featuredImage,
    meta: d.cultureDirectoryTypes?.nodes?.[0]?.name ?? 'Directory',
  }));

  // Bucket posts by category slug
  const magazine: any[] = [];
  const events: any[] = [];
  const origins: any[] = [];

  for (const post of posts) {
    const cats: string[] = (post.categories?.nodes ?? []).map((c: any) => c.slug);
    if (cats.includes('events')) events.push(post);
    else if (cats.includes('origins')) origins.push(post);
    else magazine.push(post);
  }

  const pulse: any[] = (pulseResult.status === 'fulfilled' ? pulseResult.value : [])
    .map((p: any) => ({
      id:    p.id,
      title: p.title?.rendered ?? p.title ?? '',
      slug:  p.slug,
      meta:  'Pulse',
    }));

  const community: any[] = (communityResult.status === 'fulfilled' ? communityResult.value : [])
    .map((p: any) => {
      const text = (p.content?.rendered ?? '').replace(/<[^>]+>/g, '').trim();
      return {
        id:    p.id,
        title: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
        slug:  p.slug,
        meta:  p.meta?.community_author_name ?? 'Community',
      };
    });

  return NextResponse.json({ magazine, events, origins, products, quotes, directory, pulse, community });
}

