"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FeedCard from "@/components/pulse/FeedCard";
import type { FeedItem } from "@/lib/unified-feed";

interface SavedPost {
  id: number;
  type: "quote" | "article" | "community";
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  date: string;
  likes: number;
  quoteAuthor?: string;
  quoteSource?: string;
  featuredImage?: string;
  category?: string;
}

interface SavedData {
  liked: SavedPost[];
  bookmarked: SavedPost[];
  liked_ids: number[];
  bookmarked_ids: number[];
}

type Tab = "liked" | "bookmarked";

const TYPE_MAP = { article: "editorial", quote: "quote", community: "community" } as const;

function toFeedItem(item: SavedPost): FeedItem {
  const type = TYPE_MAP[item.type] ?? "community";
  return {
    id: String(item.id),
    wpId: String(item.id),
    type: type as FeedItem["type"],
    title: item.title,
    slug: item.slug,
    date: item.date,
    excerpt: item.excerpt,
    image: item.featuredImage,
    href: item.url || "/",
    category: item.category,
    quoteAuthor: item.quoteAuthor,
    quoteSource: item.quoteSource,
    reactions: { love: item.likes ?? 0, fire: 0, clap: 0 },
  };
}

export default function CollectionTabs() {
  const [tab, setTab] = useState<Tab>("bookmarked");
  const [data, setData] = useState<SavedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/user/saved", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const items = data?.[tab] ?? [];
  const likedCount = data?.liked?.length ?? 0;
  const bookmarkedCount = data?.bookmarked?.length ?? 0;

  return (
    <div className="coll-panel">
      {/* Heading */}
      <div className="coll-panel-header">
        <div>
          <h1 className="coll-panel-heading">
            {tab === "bookmarked" ? "Your Saved Cultural Gems" : "Posts You've Liked"}
          </h1>
          {!loading && (
            <p className="coll-panel-count">
              {tab === "bookmarked"
                ? `${bookmarkedCount} saved item${bookmarkedCount !== 1 ? "s" : ""}`
                : `${likedCount} liked item${likedCount !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {/* Tab switcher */}
        <div className="coll-tab-bar">
          <button
            className={`coll-tab${tab === "bookmarked" ? " coll-tab--active" : ""}`}
            onClick={() => setTab("bookmarked")}
          >
            <span>🔖</span> Saved
            {!loading && <span className="coll-tab-count">{bookmarkedCount}</span>}
          </button>
          <button
            className={`coll-tab${tab === "liked" ? " coll-tab--active" : ""}`}
            onClick={() => setTab("liked")}
          >
            <span>♥</span> Liked
            {!loading && <span className="coll-tab-count">{likedCount}</span>}
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="coll-loading">
          <div className="coll-loading-spinner" />
          Loading your collection…
        </div>
      )}

      {error && (
        <div className="coll-empty-state">
          <div className="coll-empty-icon">⚠️</div>
          <p className="coll-empty-label">Couldn't load your collection</p>
          <p className="coll-empty-sub">Please refresh the page to try again.</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="coll-empty-state">
          <div className="coll-empty-icon">{tab === "bookmarked" ? "🔖" : "♥"}</div>
          <p className="coll-empty-label">
            {tab === "bookmarked" ? "No saved bookmarks yet" : "Nothing liked yet"}
          </p>
          <p className="coll-empty-sub">
            {tab === "bookmarked"
              ? "Bookmark posts in the feed to read or revisit later."
              : "Hit the ♥ on quotes or articles to save them here."}
          </p>
          <div className="coll-empty-actions">
            <Link href="/feed" className="coll-empty-btn coll-empty-btn--primary">Browse Feed</Link>
            <Link href="/magazine" className="coll-empty-btn">Browse Magazine</Link>
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div>
          {items.map((item) => (
            <FeedCard key={`${item.type}-${item.id}`} item={toFeedItem(item)} />
          ))}
        </div>
      )}
    </div>
  );
}
