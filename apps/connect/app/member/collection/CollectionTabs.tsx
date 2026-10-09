"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
            <CollectionFeedCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionFeedCard({ item }: { item: SavedPost }) {
  const href = item.url || "/";

  // Quote card — mirrors FeedCard quote style
  if (item.type === "quote") {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        <article
          style={{
            position: "relative",
            background: "var(--paper-deep, #f2f2f2)",
            border: "1px solid var(--rule)",
            borderRadius: "12px",
            boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
            margin: "12px 16px",
            overflow: "hidden",
            minWidth: 0,
            padding: "20px 24px 20px 24px",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              color: "var(--mute)",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "34px",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            "
          </span>
          <div style={{ paddingLeft: "32px" }}>
            <p style={{
              color: "var(--ink)",
              fontFamily: "var(--font-fraunces), serif",
              fontSize: "18px",
              fontStyle: "italic",
              lineHeight: 1.4,
              margin: "0 0 12px",
            }}>
              {item.title}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", flexWrap: "wrap" }}>
              {item.quoteAuthor && (
                <span style={{ color: "var(--ink)", fontSize: "0.83rem", fontWeight: 700, fontFamily: "var(--font-sans), sans-serif" }}>
                  — {item.quoteAuthor}
                </span>
              )}
              {item.quoteSource && (
                <span style={{ color: "var(--mute)", fontSize: "0.83rem", fontFamily: "var(--font-sans), sans-serif" }}>
                  {item.quoteSource}
                </span>
              )}
              <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>
                {formatDate(item.date)}
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Article card — mirrors FeedCard editorial style
  if (item.type === "article") {
    const CLAMP_CHARS = 320;
    const text = item.excerpt ?? "";
    const isLong = text.length > CLAMP_CHARS;
    const displayText = isLong ? text.slice(0, CLAMP_CHARS) + "…" : text;

    return (
      <article style={{
        position: "relative",
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        borderRadius: "12px",
        boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
        margin: "12px 16px",
        padding: "1rem 1.25rem 1.5rem",
        overflow: "hidden",
        minWidth: 0,
      }}>
        {/* Eyebrow row */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ochre)" }}>
            The Culture Brief
          </span>
          {item.category && (
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              · {item.category}
            </span>
          )}
          <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>
            {formatDate(item.date)}
          </span>
        </div>

        {/* Body */}
        <Link href={href} style={{ textDecoration: "none", display: "block" }}>
          {item.featuredImage && (
            <div style={{ width: "100%", maxHeight: "220px", overflow: "hidden", borderRadius: "6px", marginBottom: "0.6rem", border: "1px solid var(--rule)" }}>
              <img src={item.featuredImage} alt={item.title} style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }} loading="lazy" />
            </div>
          )}
          <h3 style={{
            color: "var(--ink)",
            fontFamily: "var(--font-fraunces), serif",
            fontSize: "17px",
            fontWeight: 600,
            lineHeight: 1.2,
            marginBottom: "0.5rem",
          }}>
            {item.title}
          </h3>
          {displayText && (
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
              {displayText}
            </p>
          )}
          {isLong && (
            <span style={{ color: "var(--ochre)", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
              Read more →
            </span>
          )}
        </Link>
      </article>
    );
  }

  // Community post card — mirrors FeedCard community style
  const CLAMP_CHARS = 280;
  const text = item.excerpt ?? "";
  const isLong = text.length > CLAMP_CHARS;
  const displayText = isLong ? text.slice(0, CLAMP_CHARS) + "…" : text;

  return (
    <article
      style={{
        position: "relative",
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        borderRadius: "12px",
        boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
        margin: "12px 16px",
        padding: "1rem 1.25rem",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        <span style={{
          display: "inline-flex", alignItems: "center",
          background: "var(--cat-community-bg)", color: "var(--cat-community-fg)",
          fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "0.18rem 0.45rem", borderRadius: "2px",
        }}>
          Community
        </span>
        {item.category && (
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.6rem", color: "var(--mute)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            · {item.category}
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--mute)", fontSize: "0.68rem" }}>
          {formatDate(item.date)}
        </span>
      </div>

      {/* Body */}
      <Link href={href} style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          color: "var(--ink)",
          fontSize: "0.97rem",
          lineHeight: 1.6,
          marginBottom: "0.5rem",
        }}>
          {item.title}
        </div>
        {displayText && (
          <p style={{ color: "var(--ink-soft)", fontSize: "14px", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
            {displayText}
          </p>
        )}
        {isLong && (
          <span style={{ color: "var(--cat-community-fg)", fontSize: "0.78rem", fontWeight: 600, display: "inline-block", marginTop: "0.25rem" }}>
            Read more →
          </span>
        )}
      </Link>

      {/* Footer */}
      {item.likes > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          paddingTop: "0.5rem", borderTop: "1px solid var(--rule)", marginTop: "0.5rem",
          fontSize: "0.75rem", color: "var(--mute)",
        }}>
          <span>♥ {item.likes}</span>
        </div>
      )}
    </article>
  );
}
