"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import { interestsToTagSet } from "@/lib/interest-mappings";
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

const CATEGORY_FILTERS = [
  "Music", "Film", "Art", "Fashion", "Literature",
  "Food", "Tech", "Sport", "Travel", "Design", "Ideas",
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
  const [forYou, setForYou]         = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [showSectionsMenu, setShowSectionsMenu] = useState(false);
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

  const userInterests = (session?.user as any)?.interests as string[] | undefined;
  const interestTagSet = useMemo(() => interestsToTagSet(userInterests ?? []), [userInterests]);
  const hasInterests = (userInterests?.length ?? 0) > 0;

  const filtered = useMemo(() => items.filter(item => {
    const typeMatch = activeType === "all" || item.type === activeType;
    const regionMatch = activeRegion === "All" || !item.region || item.region.toLowerCase() === activeRegion.toLowerCase();
    const tagMatch = !activeTag || (item.type === "community" && (
      activeTag.startsWith("#")
        ? item.title.toLowerCase().includes(activeTag.toLowerCase())
        : item.communityTag === activeTag
    ));
    const catLower = activeCategory.toLowerCase();
    const categoryMatch = !activeCategory || (
      (item.type === "pulse"      && (item.category ?? "").toLowerCase()  === catLower) ||
      (item.type === "editorial"  && (item.category ?? "").toLowerCase()  === catLower) ||
      (item.type === "directory"  && (item.entryType ?? "").toLowerCase() === catLower)
    );
    // "For You" filter — match items whose tag/category is in the user's interest set
    const forYouMatch = !forYou || (() => {
      const tag = (item.communityTag ?? item.category ?? item.entryType ?? "").toLowerCase();
      return interestTagSet.size === 0 || interestTagSet.has(tag);
    })();
    return typeMatch && regionMatch && tagMatch && categoryMatch && forYouMatch;
  }), [items, activeType, activeRegion, activeTag, activeCategory, forYou, interestTagSet]);

  const sorted = useMemo(() => (
    [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), [filtered]);

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

  const handlePosted = useCallback((post: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null; region: string | null; galleryImages?: string[]; templateType?: string }) => {
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
      galleryImages: post.galleryImages,
      templateType: post.templateType,
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
    setForYou(false);
    setActiveTag("");
    setActiveCategory("");
    setVisibleCount(20);
    if (type !== "pulse") setActiveRegion("All");
  };

  const handleForYou = () => {
    setForYou(prev => !prev);
    setActiveType("all");
    setActiveTag("");
    setActiveCategory("");
    setVisibleCount(20);
  };

  const handleCategory = (cat: string) => {
    setActiveCategory(prev => prev === cat ? "" : cat);
    setActiveType("all");
    setVisibleCount(20);
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
    <div style={{ background: "#ffffff" }}>
      <div className="pulse-layout">

        {/* ── Left Sidebar ── */}
        <aside className="pulse-sidebar-left">
          <nav style={{ padding: "1.25rem 0" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <SidebarHeading>Sections</SidebarHeading>
              <ul style={{ margin: 0, padding: 0 }}>
                {[
                  { label: "Members Directory", href: "/connect/people" },
                  { label: "Membership",        href: "/connect/membership" },
                ].map(({ label, href }) => (
                  <li key={label} style={{ listStyle: "none" }}>
                    <Link href={href} style={{
                      display: "block",
                      borderLeft: "2px solid transparent",
                      padding: "0.28rem 0.75rem",
                      color: "#3a342b",
                      fontSize: "0.83rem",
                      fontWeight: 400,
                      textDecoration: "none",
                    }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {hasInterests && (
              <div style={{ marginBottom: "1.25rem" }}>
                <SidebarHeading>Personalised</SidebarHeading>
                <ul style={{ margin: 0, padding: 0 }}>
                  <SidebarLink label="For You" active={forYou} onClick={handleForYou} />
                </ul>
              </div>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <SidebarHeading>Content Type</SidebarHeading>
              <ul style={{ margin: 0, padding: 0 }}>
                {TYPE_FILTERS.map(({ label, value }) => (
                  <SidebarLink
                    key={value}
                    label={label}
                    active={!forYou && activeType === value}
                    onClick={() => handleType(value)}
                  />
                ))}
              </ul>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <SidebarHeading>Category</SidebarHeading>
              <ul style={{ margin: 0, padding: 0 }}>
                {CATEGORY_FILTERS.map(cat => (
                  <SidebarLink
                    key={cat}
                    label={cat}
                    active={activeCategory === cat}
                    onClick={() => handleCategory(cat)}
                  />
                ))}
              </ul>
            </div>
          </nav>
        </aside>

        {/* ── Center Timeline ── */}
        <main className="pulse-timeline">
          {/* Mobile filter strip */}
          <div className="pulse-mobile-filters">
            <div className="pulse-mobile-filters-scroll">
            <div style={{ display: "flex", gap: "0.35rem", padding: "0.65rem 1rem" }}>
              {hasInterests && (
                <button
                  onClick={handleForYou}
                  style={{
                    background: forYou ? "#14110d" : "transparent",
                    color: forYou ? "#fff" : "#3a342b",
                    border: forYou ? "1px solid #14110d" : "1px solid #d8d0c6",
                    borderRadius: "2px",
                    padding: "0.25rem 0.7rem",
                    fontSize: "0.72rem",
                    fontWeight: forYou ? 700 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                  }}
                >
                  For You
                </button>
              )}
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
              <button
                onClick={() => setShowSectionsMenu(s => !s)}
                style={{
                  position: "sticky",
                  right: 0,
                  background: showSectionsMenu ? "#c5491f" : "#14110d",
                  color: "#fff",
                  border: "none",
                  padding: "0.25rem 0.9rem",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "-8px 0 10px #f7f5f2",
                }}
              >
                ⊞ Sections
              </button>
            </div>
            </div>{/* end pulse-mobile-filters-scroll */}

            {/* Sections + Categories dropdown panel */}
            {showSectionsMenu && (
              <div style={{ borderTop: "1px solid #e8e2d8", background: "#fff" }}>
                {/* Connect sections row */}
                <div style={{ display: "flex", borderBottom: "1px solid #e8e2d8" }}>
                  {[
                    { label: "Members Directory", href: "/connect/people" },
                    { label: "Membership",        href: "/connect/membership" },
                  ].map(({ label, href }, i, arr) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setShowSectionsMenu(false)}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.6rem 0.5rem",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#3a342b",
                        textDecoration: "none",
                        borderRight: i < arr.length - 1 ? "1px solid #e8e2d8" : "none",
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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

          {/* Interests nudge for logged-in users with no interests set */}
          {session && !hasInterests && (
            <div style={{ margin: "0.75rem 1.25rem", padding: "0.75rem 1rem", background: "#fdf5e6", border: "1px solid #e8d8b0", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#7a6f5c", lineHeight: 1.5 }}>
                <strong style={{ color: "#14110d" }}>Personalise your feed</strong> — pick your interests for a For You view.
              </p>
              <Link href="/member/settings/interests" style={{ fontSize: "0.72rem", fontWeight: 700, color: "#14110d", whiteSpace: "nowrap", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Set interests →
              </Link>
            </div>
          )}

          <SubmitPost onPosted={handlePosted} />

          {/* Category filter strip */}
          <div className="feed-category-strip">
            <div className="feed-category-scroll">
              <button
                className={`feed-category-pill${!activeCategory ? " feed-category-pill--active" : ""}`}
                onClick={() => { setActiveCategory(""); setVisibleCount(20); }}
              >
                All
              </button>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  className={`feed-category-pill${activeCategory === cat ? " feed-category-pill--active" : ""}`}
                  onClick={() => handleCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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
