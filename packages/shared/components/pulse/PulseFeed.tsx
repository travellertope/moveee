"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import { interestsToTagSet } from "@/lib/interest-mappings";
import { rankFeed, getTrending, matchesInterests } from "@/lib/feed-recommendations";
import { getSpotlightEvents, isEventItem } from "@/lib/event-spotlight";
import FeedCard from "./FeedCard";
import EventSpotlightCarousel from "./EventSpotlightCarousel";
import StoopReminderCard from "./StoopReminderCard";
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
  return <p className="pulse-sidebar-heading">{children}</p>;
}

function SidebarLink({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <li style={{ listStyle: "none" }}>
      <button
        onClick={onClick}
        className={`pulse-sidebar-link${active ? " pulse-sidebar-link--active" : ""}`}
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
    const tag = searchParams.get("tag");
    if (tag) { setActiveType("community"); setActiveTag(tag); }
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
  const userCity   = (session?.user as any)?.city as string | undefined;
  const userCountry = (session?.user as any)?.countryOfResidence as string | undefined;
  const userRegion = useMemo(() => {
    if (!userCountry) return undefined;
    const map: Record<string, string> = {
      nigeria: "Africa", gh: "Africa", ghana: "Africa", kenya: "Africa", "south africa": "Africa",
      "united kingdom": "Diaspora UK", uk: "Diaspora UK", gb: "Diaspora UK",
      "united states": "Diaspora US", us: "Diaspora US", canada: "Diaspora US",
      france: "Diaspora Europe", germany: "Diaspora Europe",
    };
    return map[userCountry.toLowerCase().trim()] ?? undefined;
  }, [userCountry]);
  const hasInterests = (userInterests?.length ?? 0) > 0;

  const [followedUsernames, setFollowedUsernames] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/connect/follow/following")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.usernames) {
          setFollowedUsernames(new Set(data.usernames.map((u: string) => u.toLowerCase())));
        }
      })
      .catch(() => {});
  }, [session?.user]);

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
    // "For You": don't hard-filter — scoring in `sorted` reranks by relevance.
    // But if user has interests, boost matching items by keeping all; hide nothing.
    // Event-type items are surfaced exclusively through the Spotlight carousel below.
    return typeMatch && regionMatch && tagMatch && categoryMatch && !isEventItem(item);
  }), [items, activeType, activeRegion, activeTag, activeCategory, forYou, interestTagSet]);

  // When "For You" is active, rank by relevance score; otherwise newest-first.
  const sorted = useMemo(() => (
    forYou && hasInterests
      ? rankFeed(filtered, interestTagSet, userCity, userRegion, followedUsernames)
      : [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), [filtered, forYou, hasInterests, interestTagSet, userCity, userRegion, followedUsernames]);

  // Trending items (shown in sidebar and For You mode)
  const trending = useMemo(() => getTrending(items), [items]);

  // Spotlight events carousel — inserted after the 5th feed item.
  const spotlightEvents = useMemo(() => getSpotlightEvents(items), [items]);

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


  return (
    <div style={{ background: "var(--paper, #ffffff)" }}>
      <div className="pulse-layout">

        {/* ── Left Sidebar ── */}
        <aside className="pulse-sidebar-left">
          <nav>
            {hasInterests && (
              <div className="pulse-sidebar-group">
                <SidebarHeading>Personalised</SidebarHeading>
                <ul style={{ margin: 0, padding: 0 }}>
                  <SidebarLink label="For You" active={forYou} onClick={handleForYou} />
                </ul>
              </div>
            )}

            <div className="pulse-sidebar-group">
              <SidebarHeading>Sections</SidebarHeading>
              <ul style={{ margin: 0, padding: 0 }}>
                {[
                  { label: "People Near Me", href: "/connect/people" },
                  { label: "Membership",        href: "/connect/membership" },
                ].map(({ label, href }) => (
                  <li key={label} style={{ listStyle: "none" }}>
                    <Link href={href} className="pulse-sidebar-link" style={{ display: "block", textDecoration: "none" }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pulse-sidebar-group">
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

            <div className="pulse-sidebar-group">
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
                    background: forYou ? "var(--ink, #14110d)" : "transparent",
                    color: forYou ? "var(--paper, #fff)" : "var(--ink-soft, #3a342b)",
                    border: forYou ? "1px solid var(--ink, #14110d)" : "1px solid var(--rule, #d8d0c6)",
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
                    background: activeType === value ? "var(--ochre, #c5491f)" : "transparent",
                    color: activeType === value ? "var(--paper, #fff)" : "var(--ink-soft, #3a342b)",
                    border: activeType === value ? "1px solid var(--ochre, #c5491f)" : "1px solid var(--rule, #d8d0c6)",
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
                  background: showSectionsMenu ? "var(--ochre, #c5491f)" : "var(--ink, #14110d)",
                  color: "var(--paper, #fff)",
                  border: "none",
                  padding: "0.25rem 0.9rem",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "-8px 0 10px var(--paper-warm, #f7f5f2)",
                }}
              >
                ⊞ Sections
              </button>
            </div>
            </div>{/* end pulse-mobile-filters-scroll */}

            {/* Sections + Categories dropdown panel */}
            {showSectionsMenu && (
              <div style={{ borderTop: "1px solid var(--rule, #e8e2d8)", background: "var(--paper, #fff)" }}>
                {/* Connect sections row */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--rule, #e8e2d8)" }}>
                  {[
                    { label: "People Near Me", href: "/connect/people" },
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
                        color: "var(--ink-soft, #3a342b)",
                        textDecoration: "none",
                        borderRight: i < arr.length - 1 ? "1px solid var(--rule, #e8e2d8)" : "none",
                      }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interests nudge for logged-in users with no interests set */}
          {session && !hasInterests && (
            <div style={{ margin: "0.75rem 1.25rem", padding: "0.75rem 1rem", background: "var(--paper-warm)", border: "1px solid var(--rule-dark)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--mute)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ink)" }}>Personalise your feed</strong> — pick your interests for a For You view.
              </p>
              <Link href="/member/settings/interests" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Set interests →
              </Link>
            </div>
          )}

          {session?.user && <SubmitPost onPosted={handlePosted} />}

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
            <div style={{ color: "var(--mute, #aaa)", textAlign: "center", padding: "4rem 0", fontSize: "0.85rem" }}>
              Nothing here yet — check back soon.
            </div>
          ) : (
            <>
              {visible.slice(0, 5).map(item => (
                <FeedCard
                  key={item.id}
                  item={item}
                  onTagClick={handleTagClick}
                  interestMatch={forYou && hasInterests && matchesInterests(item, interestTagSet)}
                />
              ))}
              {visible.length > 5 && <EventSpotlightCarousel events={spotlightEvents} />}
              {visible.length > 5 && session?.user && <StoopReminderCard />}
              {visible.slice(5).map(item => (
                <FeedCard
                  key={item.id}
                  item={item}
                  onTagClick={handleTagClick}
                  interestMatch={forYou && hasInterests && matchesInterests(item, interestTagSet)}
                />
              ))}
            </>
          )}

          <div ref={sentinelRef} style={{ height: "1px" }} />
          {hasMore && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--mute, #bbb)", fontSize: "0.78rem" }}>Loading…</div>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="pulse-sidebar-right">
          {/* Most engaged posts this week */}
          {trending.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p className="pulse-trending-heading">Hot this week 🔥</p>
              <div>
                {trending.map(item => {
                  const totalEng = (item.reactions?.love ?? 0) + (item.reactions?.fire ?? 0)
                                 + (item.reactions?.clap ?? 0) + (item.commentCount ?? 0);
                  return (
                    <div key={item.id} className="pulse-trending-item">
                      <p className="pulse-trending-title">
                        {item.title.length > 60 ? item.title.slice(0, 57) + "…" : item.title}
                      </p>
                      {totalEng > 0 && (
                        <p className="pulse-trending-count">
                          {totalEng} reaction{totalEng !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* For You hint */}
          {hasInterests && !forYou && (
            <div className="pulse-foryou-hint">
              <p style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                Personalised feed ready
              </p>
              <p>Switch to For You to see content ranked by your interests.</p>
              <button
                type="button"
                onClick={handleForYou}
                style={{
                  background: "var(--ochre)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 10px",
                  width: "100%",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: ".06em",
                  marginTop: 8,
                }}
              >
                For You →
              </button>
            </div>
          )}

          <div className="pulse-about-card">
            <p className="pulse-trending-heading" style={{ marginBottom: 8 }}>About Moveee</p>
            <p className="pulse-about-desc">
              The community for Black and diaspora creatives, entrepreneurs, and culture lovers. Pulse is where members post, share, and stay in the conversation.
            </p>
          </div>
        </aside>
      </div>

    </div>
  );
}
