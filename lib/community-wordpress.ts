const WP_URL  = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE    = `${WP_URL}/wp-json/wp/v2`;

export interface WpCommunityPost {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title:   { rendered: string };
  content: { rendered: string };
  meta: {
    community_author_name?: string;
    community_author_id?:   string;
    community_image_url?:   string;
    community_tag?:         string;
    reaction_love?:  number;
    reaction_fire?:  number;
    reaction_clap?:  number;
  };
}

export async function getAllCommunitySlugs(): Promise<string[]> {
  const res = await fetch(
    `${BASE}/community-posts?per_page=100&_fields=slug&status=publish`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const posts: Array<{ slug: string }> = await res.json().catch(() => []);
  return posts.map((p) => p.slug);
}

export async function getCommunityPostBySlug(slug: string): Promise<WpCommunityPost | null> {
  const res = await fetch(
    `${BASE}/community-posts?slug=${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const posts: WpCommunityPost[] = await res.json().catch(() => []);
  return posts[0] ?? null;
}

export async function searchCommunityPosts(query: string): Promise<WpCommunityPost[]> {
  const res = await fetch(
    `${BASE}/community-posts?search=${encodeURIComponent(query)}&per_page=6&_fields=id,slug,date,title,content,meta`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json().catch(() => []);
}

export interface WpComment {
  id: number;
  post: number;
  parent: number;
  author_name: string;
  date: string;
  content: { rendered: string };
}

export async function getPostComments(postId: number): Promise<WpComment[]> {
  const res = await fetch(
    `${BASE}/comments?post=${postId}&per_page=100&order=asc&_fields=id,post,parent,author_name,date,content`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json().catch(() => []);
}

export async function getCommunityPostsByTag(tag: string): Promise<WpCommunityPost[]> {
  const res = await fetch(
    `${BASE}/community-posts?per_page=50&orderby=date&order=desc&_fields=id,slug,date,content,meta,comment_count`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const posts: WpCommunityPost[] = await res.json().catch(() => []);
  return posts.filter(
    (p) => p.meta?.community_tag?.toLowerCase() === tag.toLowerCase()
  );
}
