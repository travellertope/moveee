"use client";

import { useState, useEffect, useCallback } from "react";
import FeedCard from "@/components/pulse/FeedCard";
import type { FeedItem } from "@/lib/unified-feed";
import { decodeHtml } from "@/lib/decode-html";

interface Post {
  id: number;
  slug: string;
  date: string;
  text: string;
  image_url: string;
  tag: string;
  template_type: string;
  star_rating: number;
  location_name: string;
  gallery_images: string[];
  video_url: string;
  food_dish_name: string;
  reactions: { love: number; fire: number; clap: number };
  comment_count: number;
  // Music review
  music_title?: string;
  music_artist?: string;
  music_overall_rating?: number;
  music_cover_url?: string;
  music_preview_url?: string;
  music_genres?: string[];
  music_fav_lyric?: string;
  music_recommend?: boolean;
  music_rating_production?: number;
  music_rating_lyrics?: number;
  music_rating_replay?: number;
  music_rating_vibe?: number;
  // Book review
  book_title?: string;
  book_author?: string;
  book_status?: string;
  book_overall_rating?: number;
  book_cover_url?: string;
  book_genres?: string[];
  book_fav_quote?: string;
  book_recommend?: boolean;
  book_rating_writing?: number;
  book_rating_story?: number;
  book_rating_characters?: number;
  book_rating_pacing?: number;
  // Film review
  film_title?: string;
  film_director?: string;
  film_overall_rating?: number;
  film_cover_url?: string;
  film_genres?: string[];
  film_fav_line?: string;
  film_recommend?: boolean;
  film_rating_story?: number;
  film_rating_acting?: number;
  film_rating_visuals?: number;
  film_rating_pacing?: number;
}

const TEMPLATE_FILTERS = [
  { value: "",                 label: "All" },
  { value: "hidden-gem",       label: "Places" },
  { value: "cultural-take",    label: "Takes" },
  { value: "food-review",      label: "Food" },
  { value: "project",          label: "Projects" },
  { value: "poll",             label: "Polls" },
];


interface Props {
  username: string;
  displayName: string;
  avatarUrl: string;
  tier: string;
  template: string;
}

function toFeedItem(post: Post, username: string, displayName: string, avatarUrl: string, tier: string): FeedItem {
  return {
    id: String(post.id),
    wpId: String(post.id),
    type: "community",
    title: decodeHtml(post.text ?? ""),
    slug: post.slug,
    date: post.date,
    excerpt: decodeHtml(post.text ?? ""),
    image: post.gallery_images?.[0] ?? post.image_url,
    href: `/community/${post.slug}`,
    communityAuthor: displayName,
    communityAuthorUsername: username,
    communityAuthorAvatar: avatarUrl,
    communityTag: post.tag,
    communityTier: tier,
    templateType: post.template_type,
    starRating: post.star_rating,
    locationName: post.location_name,
    galleryImages: post.gallery_images,
    videoUrl: post.video_url,
    foodDishName: post.food_dish_name,
    reactions: post.reactions,
    commentCount: post.comment_count,
    // Music review
    musicTitle: post.music_title || undefined,
    musicArtist: post.music_artist || undefined,
    musicOverallRating: post.music_overall_rating || undefined,
    musicCoverUrl: post.music_cover_url || undefined,
    musicPreviewUrl: post.music_preview_url || undefined,
    musicGenres: post.music_genres || undefined,
    musicFavLyric: post.music_fav_lyric || undefined,
    musicRecommend: post.music_recommend,
    musicRatingProduction: post.music_rating_production || undefined,
    musicRatingLyrics: post.music_rating_lyrics || undefined,
    musicRatingReplay: post.music_rating_replay || undefined,
    musicRatingVibe: post.music_rating_vibe || undefined,
    // Book review
    bookTitle: post.book_title || undefined,
    bookAuthor: post.book_author || undefined,
    bookStatus: post.book_status || undefined,
    bookOverallRating: post.book_overall_rating || undefined,
    bookCoverUrl: post.book_cover_url || undefined,
    bookGenres: post.book_genres || undefined,
    bookFavQuote: post.book_fav_quote || undefined,
    bookRecommend: post.book_recommend,
    bookRatingWriting: post.book_rating_writing || undefined,
    bookRatingStory: post.book_rating_story || undefined,
    bookRatingCharacters: post.book_rating_characters || undefined,
    bookRatingPacing: post.book_rating_pacing || undefined,
    // Film review
    filmTitle: post.film_title || undefined,
    filmDirector: post.film_director || undefined,
    filmOverallRating: post.film_overall_rating || undefined,
    filmCoverUrl: post.film_cover_url || undefined,
    filmGenres: post.film_genres || undefined,
    filmFavLine: post.film_fav_line || undefined,
    filmRecommend: post.film_recommend,
    filmRatingStory: post.film_rating_story || undefined,
    filmRatingActing: post.film_rating_acting || undefined,
    filmRatingVisuals: post.film_rating_visuals || undefined,
    filmRatingPacing: post.film_rating_pacing || undefined,
  };
}

export default function CommunityTab({ username, displayName, avatarUrl, tier, template }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchPosts = useCallback(async (tmpl: string, pg: number, append = false) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ per_page: "15", page: String(pg) });
      if (tmpl) qs.set("template", tmpl);
      const res = await fetch(`/api/connect/${username}/posts?${qs}`);
      if (res.ok) {
        const data = await res.json();
        const incoming: Post[] = data.posts ?? [];
        setPosts(prev => append ? [...prev, ...incoming] : incoming);
        setHasMore(incoming.length === 15);
      }
    } catch {
      if (!append) setPosts([]);
    }
    setLoading(false);
  }, [username]);

  useEffect(() => {
    setPage(1);
    fetchPosts(template, 1);
  }, [template, fetchPosts]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(template, next, true);
  }

  // Count by template
  const counts: Record<string, number> = {};
  posts.forEach(p => { counts[p.template_type] = (counts[p.template_type] ?? 0) + 1; });

  return (
    <div>
      {loading && posts.length === 0 ? (
        <div className="prf-loading">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="prf-skeleton" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="prf-empty">No posts yet.</p>
      ) : (
        <>
          <div style={{ margin: "0 -16px" }}>
            {posts.map(post => (
              <FeedCard key={post.id} item={toFeedItem(post, username, displayName, avatarUrl, tier)} />
            ))}
          </div>
          {hasMore && (
            <button onClick={loadMore} disabled={loading} className="prf-load-more">
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

