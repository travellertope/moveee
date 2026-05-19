"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import FeedCard from "./FeedCard";
import SubmitPost from "./SubmitPost";
import "@/app/pulse-layout.css";

const TYPE_FILTERS: { label: string; value: FeedItemType | "all" }[] = [
  { label: "All",        value: "all"       },
  { label: "Pulse",      value: "community" },
  { label: "News",       value: "pulse"     },
  { label: "Editorial",  value: "editorial" },
  { label: "Event",      value: "happening" },
  { label: "Directory",  value: "directory" },
  { label: "Quote",      value: "quote"     },
];

const REGIONS = ["All", "Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"] as const;

interface PulseFeedProps {
  initialItems: FeedItem[];
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: "#7a6f5c",
      fontSize: "0.6rem",
      fontWeight: 700,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      marginBottom: "0.4rem",
      paddingLeft: "0.75rem",
    }}>
      {children}
    </p>
  );
}

function SidebarLink({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <li style={{ listStyle: "none" }}>
      <button
        onClick={onClick}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          borderLeft: active ? "2px solid #c5491f" : "2px solid transparent",
          padding: "0.28rem 0.75rem",
          color: active ? "#c5491f" : "#3a342b",
          fontSize: "0.83rem",
          fontWeight: active ? 600 : 400,
          cursor: "pointer",
          transition: "color 0.1s, border-color 0.1s",
          lineHeight: 1.4,
        }}
      >
        {label}
      </button>
    </li>
  );
}

export default function PulseFeed({ initialItems }: PulseFeedProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [activeType, setActiveType] = useState<FeedItemType | "all">("all");
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Apply edition cookie → pre-select matching region
  useEffect(() => {
    const edition = document.cookie.split("; ").find(r => r.startsWith("moveee_edition="))?.split("=")[1];
    const editionToRegion: Record<string, string> = {
      uk:     "Diaspora UK",
      us:     "Diaspora US",
      africa: "Africa",
    };
    if (edition && editionToRegion[edition]) {
      setActiveRegion(editionToRegion[edition]);
    }
  }, []);

  useEffect(() => {
    const hashtag = searchParams.get("hashtag");
    const tag = searchParams.get("tag");
    if (hashtag) { setActiveType("community"); setActiveTag(`#${hashtag}`); }
    else if (tag) { setActiveType("community"); setActiveTag(tag); }
  }, [searchParams]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      if (item.type === "community" && item.communityTag) tags.add(item.communityTag);
    });
    return Array.from(tags).sort();
  }, [items]);

  const filtered = useMemo(() => items.filter(item => {
    const typeMatch = activeType === "all" || item.type === activeType;
    const regionMatch = activeRegion === "All" || !item.region || item.region.toLowerCase() === activeRegion.toLowerCase();
    const tagMatch = !activeTag || (item.type === "community" && (
      activeTag.startsWith("#")
        ? item.title.toLowerCase().includes(activeTag.toLowerCase())
        : item.communityTag === activeTag
    ));
    return typeMatch && regionMatch && tagMatch;
  }), [items, activeType, activeRegion, activeTag]);

  const sorted = useMemo(() => {
    if (activeRegion === "All") return filtered;
    return [...filtered].sort((a, b) => {
      const aMatch = a.type === "community" && !!a.region && a.region.toLowerCase() === activeRegion.toLowerCase() ? 1 : 0;
      const bMatch = b.type === "community" && !!b.region && b.region.toLowerCase() === activeRegion.toLowerCase() ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filtered, activeRegion]);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setVisibleCount(n => n + 20);
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, filtered.length]);

  const handlePosted = useCallback((post: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null; region: string | null }) => {
    const sessionUser = session?.user as any;
    const newItem: FeedItem = {
      id: `community-${post.id}`,
      type: "community",
      title: post.text,
      slug: String(post.id),
      date: new Date().toISOString(),
      image: post.imageUrl ?? undefined,
      href: `/community/${post.id}`,
      communityAuthor: post.authorName,
      communityTag: post.tag ?? "",
      communityTier: sessionUser?.tier ?? undefined,
      region: post.region ?? undefined,
      reactions: { love: 0, fire: 0, clap: 0 },
      wpId: post.id,
    };
    setItems(prev => [newItem, ...prev]);
    setActiveType("community");
    setActiveTag(post.tag ?? "");
    setVisibleCount(20);
  }, [session]);

  const handleTagClick = useCallback((tag: string) => {
    setActiveType("community");
    setActiveTag(prev => prev === tag ? "" : tag);
    setVisibleCount(20);
  }, []);

  const handleHashtagClick = useCallback((hashtag: string) => {
    setActiveType("community");
    setActiveTag(prev => prev === hashtag ? "" : hashtag);
    setVisibleCount(20);
  }, []);

  const handleType = (type: FeedItemType | "all") => {
    setActiveType(type);
    setActiveTag("");
    setVisibleCount(20);
    if (type !== "pulse") setActiveRegion("All");
  };

  const showRegions = activeType === "all" || activeType === "pulse";
  const showTags = availableTags.length > 0 && (activeType === "all" || activeType === "community");

  const trendingHashtags = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      if (item.type !== "community") return;
      const matches = item.title.match(/#([a-zA-Z][a-zA-Z0-9_]{1,49})/g) ?? [];
      matches.forEach(tag => { counts[tag] = (counts[tag] ?? 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag]) => tag);
  }, [items]);

  return (
    <div style={{ background: "#f7f5f2" }}>
      <div className="pulse-layout">

        {/* ── Left Sidebar ── */}
        <aside className="pulse-sidebar-left">
          <nav style={{ padding: "1.25rem 0" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <SidebarHeading>Content</SidebarHeading>
              <ul style={{ margin: 0, padding: 0 }}>
                {TYPE_FILTERS.map(({ label, value }) => (
                  <SidebarLink
                    key={value}
                    label={label}
                    active={activeType === value}
                    onClick={() => handleType(value)}
                  />
                ))}
              </ul>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <SidebarHeading>Categories</SidebarHeading>
              <ul style={{ margin: 0, padding: 0 }}>
                {["Music","Film","Art","Fashion","Literature","Food","Tech","Sport","Travel","Design"].slice(0,6).map(cat => (
                  <li key={cat} style={{ listStyle: "none" }}>
                    <Link href={`/pulse/${cat.toLowerCase()}`} style={{ display: "block", padding: "0.3rem 0.85rem", fontSize: "0.78rem", color: "#3a342b", textDecoration: "none", borderLeft: "2px solid transparent" }}>
                      {cat}
                    </Link>
                  </li>
                ))}
                <li style={{ listStyle: "none" }}>
                  <Link href="/connect#feed" style={{ display: "block", padding: "0.3rem 0.85rem", fontSize: "0.72rem", color: "#c5491f", textDecoration: "none", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                    ⊞ Sections →
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* ── Center Timeline ── */}
        <main className="pulse-timeline">
          {/* Mobile filter strip */}
          <div className="pulse-mobile-filters">
            <div style={{ display: "flex", gap: "0.35rem", padding: "0.65rem 1rem" }}>
              {TYPE_FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleType(value)}
                  style={{
                    background: activeType === value ? "#c5491f" : "transparent",
                    color: activeType === value ? "#fff" : "#3a342b",
                    border: activeType === value ? "1px solid #c5491f" : "1px solid #d8d0c6",
                    borderRadius: "2px",
                    padding: "0.25rem 0.7rem",
                    fontSize: "0.72rem",
                    fontWeight: activeType === value ? 700 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  {label}
                </button>
              ))}
              <Link
                href="/connect#feed"
                style={{
                  position: "sticky",
                  right: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  background: "#14110d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0",
                  padding: "0.25rem 0.9rem",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  flexShrink: 0,
                  boxShadow: "-8px 0 10px #fff",
                }}
              >
                ⊞ Sections
              </Link>
            </div>
          </div>

          {/* Active hashtag chip */}
          {activeTag.startsWith("#") && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 1.25rem",
              borderBottom: "1px solid #e8e2d8",
              background: "#fff",
            }}>
              <span style={{ color: "#7a6f5c", fontSize: "0.7rem" }}>Filtering by</span>
              <span style={{ background: "#fdf5e6", color: "#b38238", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "2px" }}>{activeTag}</span>
              <button
                onClick={() => { setActiveTag(""); setVisibleCount(20); }}
                style={{ background: "transparent", border: "none", color: "#bbb", cursor: "pointer", fontSize: "0.85rem", lineHeight: 1, padding: "0 0.1rem" }}
                aria-label="Clear hashtag filter"
              >×</button>
            </div>
          )}

          <SubmitPost onPosted={handlePosted} />

          {visible.length === 0 ? (
            <div style={{ color: "#aaa", textAlign: "center", padding: "4rem 0", fontSize: "0.85rem" }}>
              Nothing here yet — check back soon.
            </div>
          ) : (
            visible.map(item => (
              <FeedCard
                key={item.id}
                item={item}
                onTagClick={handleTagClick}
                onHashtagClick={handleHashtagClick}
              />
            ))
          )}

          <div ref={sentinelRef} style={{ height: "1px" }} />
          {hasMore && (
            <div style={{ textAlign: "center", padding: "2rem", color: "#bbb", fontSize: "0.78rem" }}>Loading…</div>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="pulse-sidebar-right">
          <div style={{ padding: "1.25rem 1rem" }}>
            {trendingHashtags.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.65rem" }}>Trending</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {trendingHashtags.map(tag => (
                    <li key={tag} style={{ marginBottom: "0.35rem" }}>
                      <button
                        onClick={() => handleHashtagClick(tag)}
                        style={{ background: "transparent", border: "none", color: "#b38238", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
                      >
                        {tag}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ background: "#fff", border: "1px solid #e8e2d8", borderRadius: "4px", padding: "0.85rem" }}>
              <p style={{ color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem" }}>About Moveee Connect</p>
              <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: 0 }}>
                The community for Black and diaspora creatives, entrepreneurs, and culture lovers. Pulse is where members post, share, and stay in the conversation.
              </p>
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
}
