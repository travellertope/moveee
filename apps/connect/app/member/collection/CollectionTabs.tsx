"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Bookmark, ExternalLink } from "lucide-react";

interface SavedPost {
  id: number;
  type: "quote" | "article";
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  date: string;
  likes: number;
}

interface SavedData {
  liked: SavedPost[];
  bookmarked: SavedPost[];
  liked_ids: number[];
  bookmarked_ids: number[];
}

type Tab = "liked" | "bookmarked";

export default function CollectionTabs() {
  const [tab, setTab] = useState<Tab>("liked");
  const [data, setData] = useState<SavedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/user/saved", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const items = data?.[tab] ?? [];
  const likedCount = data?.liked?.length ?? 0;
  const bookmarkedCount = data?.bookmarked?.length ?? 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Tab bar */}
      <div className="collection-tab-bar">
        <button
          className={`collection-tab ${tab === "liked" ? "active" : ""}`}
          onClick={() => setTab("liked")}
        >
          <Heart size={14} strokeWidth={1.5} />
          Liked
          {!loading && <span className="collection-tab-count">{likedCount}</span>}
        </button>
        <button
          className={`collection-tab ${tab === "bookmarked" ? "active" : ""}`}
          onClick={() => setTab("bookmarked")}
        >
          <Bookmark size={14} strokeWidth={1.5} />
          Saved
          {!loading && <span className="collection-tab-count">{bookmarkedCount}</span>}
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="collection-empty">Loading your collection…</div>
      )}

      {error && (
        <div className="collection-empty">
          Could not load your collection. Please try again.
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="collection-empty">
          {tab === "liked" ? (
            <>
              <p>You haven&apos;t liked anything yet.</p>
              <p style={{ marginTop: 8 }}>
                Hit the ♥ on quotes or magazine articles to save them here.
              </p>
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                <Link href="/quotes" className="mem-upgrade-btn" style={{ display: "inline-block" }}>Browse Quotes</Link>
                <Link href="/magazine" className="mem-field-btn" style={{ display: "inline-block" }}>Browse Magazine</Link>
              </div>
            </>
          ) : (
            <>
              <p>Nothing saved yet.</p>
              <p style={{ marginTop: 8 }}>
                Tap the 🔖 on any quote or article to add it to your reading list.
              </p>
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                <Link href="/quotes" className="mem-upgrade-btn" style={{ display: "inline-block" }}>Browse Quotes</Link>
                <Link href="/magazine" className="mem-field-btn" style={{ display: "inline-block" }}>Browse Magazine</Link>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="collection-grid">
          {items.map((item) => (
            <CollectionCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ item }: { item: SavedPost }) {
  const typeLabel = item.type === "quote" ? "Quote" : "Article";
  const dateStr = new Date(item.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={item.url} className="collection-card">
      <div className="collection-card-type">{typeLabel}</div>
      <div className="collection-card-title">{item.title}</div>
      {item.excerpt && (
        <div className="collection-card-excerpt">{item.excerpt}</div>
      )}
      <div className="collection-card-meta">
        <span>{dateStr}</span>
        {item.likes > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Heart size={11} strokeWidth={1.5} />
            {item.likes}
          </span>
        )}
        <ExternalLink size={11} strokeWidth={1.5} style={{ marginLeft: "auto" }} />
      </div>
    </Link>
  );
}
