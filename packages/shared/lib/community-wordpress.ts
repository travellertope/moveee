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
    _linked_directory_slug?: string;
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
    // book review
    _book_title?:              string;
    _book_author?:             string;
    _book_status?:             string;
    _book_overall_rating?:     number | string;
    _book_rating_writing?:     number | string;
    _book_rating_story?:       number | string;
    _book_rating_characters?:  number | string;
    _book_rating_pacing?:      number | string;
    _book_fav_quote?:          string;
    _book_recommend?:          string;
    _book_genres?:             string | string[];
    _book_cover_url?:          string;
    // music review
    _music_title?:             string;
    _music_artist?:            string;
    _music_overall_rating?:    number | string;
    _music_rating_production?: number | string;
    _music_rating_lyrics?:     number | string;
    _music_rating_replay?:     number | string;
    _music_rating_vibe?:       number | string;
    _music_fav_lyric?:         string;
    _music_recommend?:         string;
    _music_genres?:            string | string[];
    _music_cover_url?:         string;
    _music_preview_url?:       string;
    // film review
    _film_title?:              string;
    _film_director?:           string;
    _film_overall_rating?:     number | string;
    _film_rating_story?:       number | string;
    _film_rating_acting?:      number | string;
    _film_rating_visuals?:     number | string;
    _film_rating_pacing?:      number | string;
    _film_fav_line?:           string;
    _film_recommend?:          string;
    _film_genres?:             string | string[];
    _film_cover_url?:          string;
    // event template
    _event_date?:              string;
    _event_end_date?:          string;
    _event_venue?:             string;
    _event_city?:              string;
    _event_address?:           string;
    _event_admission?:         string;
    _event_ticket_url?:        string;
    _event_category?:          string;
  };
  community_event_meta?: {
    organiser_id?:       number | null;
    organiser_name?:     string | null;
    organiser_slug?:     string | null;
    rsvp_enabled?:       boolean;
    rsvp_capacity?:      number;
    rsvp_count?:         number;
    rsvp_price?:         number;
    rsvp_price_currency?: string;
    is_featured?:        boolean;
  } | null;
}

export async function getAllCommunitySlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${BASE}/community-posts?per_page=100&_fields=slug&status=publish`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const posts: Array<{ slug: string }> = await res.json().catch(() => []);
    return posts.map((p) => p.slug);
  } catch {
    return [];
  }
}

const COMMUNITY_FIELDS = "_fields=id,slug,date,modified,title,content,meta,comment_count,community_event_meta";
const COMMUNITY_META_FIELDS = "meta_fields=community_author_name,community_author_id,community_author_username,community_author_tier,community_author_avatar,community_tag,community_region,community_image_url,community_link_url,community_og_title,community_og_description,community_og_image,reaction_love,reaction_fire,reaction_clap,_template_type,_linked_directory_id,_linked_directory_slug,_star_rating,_location_name,_poll_options,_poll_expires_at,_gallery_images,_video_url,_itinerary_stops,_food_dish_name,_food_rating_taste,_food_rating_value,_food_rating_vibe,_book_title,_book_author,_book_status,_book_overall_rating,_book_rating_writing,_book_rating_story,_book_rating_characters,_book_rating_pacing,_book_fav_quote,_book_recommend,_book_genres,_book_cover_url,_music_title,_music_artist,_music_overall_rating,_music_rating_production,_music_rating_lyrics,_music_rating_replay,_music_rating_vibe,_music_fav_lyric,_music_recommend,_music_genres,_music_cover_url,_music_preview_url,_film_title,_film_director,_film_overall_rating,_film_rating_story,_film_rating_acting,_film_rating_visuals,_film_rating_pacing,_film_fav_line,_film_recommend,_film_genres,_film_cover_url,_event_date,_event_end_date,_event_venue,_event_city,_event_address,_event_admission,_event_ticket_url,_event_category,_hub_id";

// A bare fetch() can reject outright (timeout, DNS failure, connection
// reset) rather than resolving with a non-ok response — that rejection was
// previously left unguarded here, so a transient WP backend blip crashed
// the whole community/[slug] page with Next's generic "server error" screen
// instead of the graceful notFound() the page already falls back to when
// this returns null. Wrapped in try/catch so both failure modes behave the
// same way, consistent with every other function in this file.
export async function getCommunityPostBySlug(slug: string): Promise<WpCommunityPost | null> {
  try {
    const res = await fetch(
      `${BASE}/community-posts?slug=${encodeURIComponent(slug)}&${COMMUNITY_FIELDS}&${COMMUNITY_META_FIELDS}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const posts: WpCommunityPost[] = await res.json().catch(() => []);
    return posts[0] ?? null;
  } catch {
    return null;
  }
}

export async function searchCommunityPosts(query: string): Promise<WpCommunityPost[]> {
  try {
    const res = await fetch(
      `${BASE}/community-posts?search=${encodeURIComponent(query)}&per_page=6&_fields=id,slug,date,title,content,meta`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return await res.json().catch(() => []);
  } catch {
    return [];
  }
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
  try {
    const res = await fetch(
      `${BASE}/comments?post=${postId}&per_page=100&order=asc&_fields=id,post,parent,author_name,date,content`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return await res.json().catch(() => []);
  } catch {
    return [];
  }
}

export async function getCommunityPostsByTag(tag: string): Promise<WpCommunityPost[]> {
  try {
    const res = await fetch(
      `${BASE}/community-posts?per_page=50&orderby=date&order=desc&_fields=id,slug,date,content,meta,comment_count`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const posts: WpCommunityPost[] = await res.json().catch(() => []);
    return posts.filter(
      (p) => p.meta?.community_tag?.toLowerCase() === tag.toLowerCase()
    );
  } catch {
    return [];
  }
}
