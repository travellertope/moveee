import { NextRequest, NextResponse } from 'next/server';

const WP_GRAPHQL_URL = 'https://cms.themoveee.com/graphql';

async function gql(query: string, variables: object) {
  const res = await fetch(WP_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = await res.json();
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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ magazine: [], events: [], origins: [], products: [] });
  }

  const [postsResult, productsResult] = await Promise.allSettled([
    gql(SEARCH_POSTS, { search: q }),
    gql(SEARCH_PRODUCTS, { search: q }),
  ]);

  const posts: any[] = postsResult.status === 'fulfilled' ? postsResult.value?.posts?.nodes ?? [] : [];
  const products: any[] = productsResult.status === 'fulfilled' ? productsResult.value?.products?.nodes ?? [] : [];

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

  return NextResponse.json({ magazine, events, origins, products });
}
