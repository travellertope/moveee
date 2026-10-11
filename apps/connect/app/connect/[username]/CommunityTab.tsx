"use client";

import { useState, useEffect, useCallback } from "react";
import FeedCard from "@/components/pulse/FeedCard";
import type { FeedItem } from "@/lib/unified-feed";

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
}

const TEMPLATE_FILTERS = [
  { value: "",                 label: "All" },
  { value: "hidden-gem",       label: "Places" },
  { value: "cultural-take",    label: "Takes" },
  { value: "food-review",      label: "Food" },
  { value: "creative-showcase",label: "Showcases" },
  { value: "poll",             label: "Polls" },
];


interface Props {
  username: string;
  displayName: string;
  avatarUrl: string;
  tier: string;
}

function toFeedItem(post: Post, username: string, displayName: string, avatarUrl: string, tier: string): FeedItem {
  return {
    id: String(post.id),
    wpId: String(post.id),
    type: "community",
    title: post.text?.slice(0, 120) ?? "",
    slug: post.slug,
    date: post.date,
    excerpt: post.text,
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
  };
}

export default function CommunityTab({ username, displayName, avatarUrl, tier }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState("");
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

  function handleTemplateChange(t: string) {
    setTemplate(t);
  }

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
      <div className="prf-filter-bar">
        {TEMPLATE_FILTERS.map(f => (
          <button
            key={f.value}
            className={`prf-filter-pill${template === f.value ? " prf-filter-pill--active" : ""}`}
            onClick={() => handleTemplateChange(f.value)}
          >
            {f.label}
            {f.value && counts[f.value] ? (
              <span className="prf-filter-count">{counts[f.value]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading && posts.length === 0 ? (
        <div className="prf-loading">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="prf-skeleton" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="prf-empty">No posts yet.</p>
      ) : (
        <>
          <div>
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

