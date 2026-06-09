const WP_URL  = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE    = `${WP_URL}/wp-json/wp/v2`;

export interface WpCommunityPost {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title:   { rendered: string };
  content: { rendered: string };
  comment_count?: number;
  meta: {
    community_author_name?:     string;
    community_author_id?:       string;
    community_author_username?: string;
    community_author_tier?:     string;
    community_author_avatar?:   string;
    community_image_url?:       string;
    community_tag?:             string;
    community_region?:          string;
    community_link_url?:        string;
    community_og_title?:        string;
    community_og_description?:  string;
    community_og_image?:        string;
    reaction_love?:  number;
    reaction_fire?:  number;
    reaction_clap?:  number;
    // template fields
    _template_type?:        string;
    _linked_directory_id?:  number | string;
    _star_rating?:          number | string;
    _location_name?:        string;
    _poll_options?:         string | { text: string; votes: number }[];
    _poll_expires_at?:      string;
    _gallery_images?:       string | string[];
    _video_url?:            string;
    _itinerary_stops?:      string | { name: string; lat: number; lng: number; note: string; image_url: string }[];
    _food_dish_name?:       string;
    _food_rating_taste?:    number | string;
    _food_rating_value?:    number | string;
    _food_rating_vibe?:     number | string;
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

const COMMUNITY_FIELDS = "_fields=id,slug,date,modified,title,content,meta,comment_count";
const COMMUNITY_META_FIELDS = "meta_fields=community_author_name,community_author_id,community_author_username,community_author_tier,community_author_avatar,community_tag,community_region,community_image_url,community_link_url,community_og_title,community_og_description,community_og_image,reaction_love,reaction_fire,reaction_clap,_template_type,_linked_directory_id,_star_rating,_location_name,_poll_options,_poll_expires_at,_gallery_images,_video_url,_itinerary_stops,_food_dish_name,_food_rating_taste,_food_rating_value,_food_rating_vibe";

export async function getCommunityPostBySlug(slug: string): Promise<WpCommunityPost | null> {
  const res = await fetch(
    `${BASE}/community-posts?slug=${encodeURIComponent(slug)}&${COMMUNITY_FIELDS}&${COMMUNITY_META_FIELDS}`,
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
