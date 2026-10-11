"use client";

import { useState, useEffect, useCallback } from "react";

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

const TEMPLATE_EMOJI: Record<string, string> = {
  post: "📝", "hidden-gem": "💎", "cultural-take": "💬",
  "food-review": "🍽️", "creative-showcase": "🎨",
  poll: "📊", itinerary: "🗺️", event: "📅", quote: "✦",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Props { username: string }

export default function CommunityTab({ username }: Props) {
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {posts.map(post => <PostRow key={post.id} post={post} />)}
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

function PostRow({ post }: { post: Post }) {
  const thumb = post.gallery_images?.[0] ?? post.image_url;
  const emoji = TEMPLATE_EMOJI[post.template_type] ?? "📝";
  const totalReactions = (post.reactions?.love ?? 0) + (post.reactions?.fire ?? 0) + (post.reactions?.clap ?? 0);

  return (
    <a
      href={`/community/${post.slug}`}
      style={{
        display: "flex",
        gap: "14px",
        padding: "1rem 1.1rem",
        background: "var(--paper, #fff)",
        borderRadius: "var(--radius-lg, 6px)",
        border: "1px solid var(--rule, #e8e2d8)",
        textDecoration: "none",
        alignItems: "flex-start",
        transition: "border-color .15s, box-shadow .15s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(42,36,28,.2)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(20,17,13,0.06)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--rule, #e8e2d8)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {thumb ? (
        <img src={thumb} alt="" style={{
          width: "60px", height: "60px", objectFit: "cover", flexShrink: 0,
          borderRadius: "var(--radius-md, 4px)",
        }} />
      ) : (
        <div style={{
          width: "60px", height: "60px", flexShrink: 0,
          background: "rgba(42,36,28,.05)", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: "22px",
          borderRadius: "var(--radius-md, 4px)",
        }}>{emoji}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "5px", flexWrap: "wrap" }}>
          {post.tag && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
              letterSpacing: ".12em", textTransform: "uppercase",
              color: "var(--ochre)", background: "rgba(122,36,28,.07)",
              border: "1px solid rgba(122,36,28,.15)", padding: "2px 6px",
              borderRadius: "var(--radius-sm, 2px)",
            }}>{post.tag}</span>
          )}
          {post.location_name && (
            <span style={{ fontSize: "11px", color: "var(--mute)" }}>📍 {post.location_name}</span>
          )}
        </div>
        <p style={{
          margin: "0 0 6px", fontSize: "0.875rem", color: "var(--ink)",
          lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          fontWeight: 500,
        }}>{post.food_dish_name ? `${post.food_dish_name} — ` : ""}{post.text}</p>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
          letterSpacing: ".08em", color: "var(--mute)",
          display: "flex", gap: "12px", flexWrap: "wrap",
        }}>
          <span>{formatDate(post.date)}</span>
          {post.star_rating > 0 && <span>{"★".repeat(post.star_rating)}{"☆".repeat(5 - post.star_rating)}</span>}
          {totalReactions > 0 && <span>{totalReactions} reaction{totalReactions === 1 ? "" : "s"}</span>}
          {post.comment_count > 0 && <span>{post.comment_count} comment{post.comment_count === 1 ? "" : "s"}</span>}
        </div>
      </div>
    </a>
  );
}
