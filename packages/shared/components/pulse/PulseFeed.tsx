"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import { interestsToTagSet } from "@/lib/interest-mappings";
import { rankFeed, matchesInterests } from "@/lib/feed-recommendations";
import { getSpotlightEvents, isEventItem } from "@/lib/event-spotlight";
import FeedCard from "./FeedCard";
import EventSpotlightCarousel from "./EventSpotlightCarousel";
import StoopReminderCard from "./StoopReminderCard";
import ComposerModal, { type ComposerTab } from "./ComposerModal";
import "@/app/pulse-layout.css";


const SECTION_HUB_SLUGS: Record<string, string> = {
  Music: "music", Fashion: "fashion", Art: "art", Film: "film", Food: "food",
  Sport: "sport", Travel: "travel", Ideas: "ideas", Literature: "literature",
  Design: "design", Tech: "tech",
};

const DIR_TYPE_EMOJI: Record<string, string> = {
  person: "👤", place: "🏛", food: "🍽", book: "📚", film: "🎬",
  genre: "🎵", movement: "🌊", artwork: "🎨", concept: "💡",
  fashion: "👗", "tv-series": "📺",
};

const TEMPLATE_TABS = [
  { key: "reviews",  label: "Reviews & Gems",  emoji: "⭐", templates: ["hidden-gem", "food-review"] },
  { key: "travel",   label: "Travel Routes",    emoji: "🗺️",  templates: ["itinerary"] },
  { key: "showcase", label: "Art & Showcase",   emoji: "🎨", templates: ["creative-showcase"] },
  { key: "polls",    label: "Polls",            emoji: "📊", templates: ["poll"] },
] as const;

interface TrendingDirectoryEntry {
  id: number;
  title: string;
  slug: string;
  type: string;
  reviewCount: number;
}

interface PulseFeedProps {
  initialItems: FeedItem[];
}

export default function PulseFeed({ initialItems }: PulseFeedProps) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [activeType, setActiveType] = useState<FeedItemType | "all">("all");
  const [forYou, setForYou]           = useState(false);
  const [followingFilter, setFollowingFilter] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeTemplate, setActiveTemplate] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [sortBy, setSortBy] = useState<"recent" | "top">("recent");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const edition = document.cookie.split("; ").find(r => r.startsWith("moveee_edition="))?.split("=")[1];
    const editionToRegion: Record<string, string> = { uk: "UK", us: "US", africa: "Africa" };
    if (edition && editionToRegion[edition]) setActiveRegion(editionToRegion[edition]);
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
      "united kingdom": "UK", uk: "UK", gb: "UK",
      "united states": "US", us: "US", canada: "US",
      france: "Europe", germany: "Europe",
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

  const [followedOrJoinedHubIds, setFollowedOrJoinedHubIds] = useState<Set<number>>(new Set());
  const [hubCandidateItems, setHubCandidateItems] = useState<FeedItem[]>([]);
  useEffect(() => {
    if (!session?.user || !forYou) return;
    (async () => {
      try {
        const res = await fetch("/api/hub/my-hubs");
        if (!res.ok) return;
        const data = await res.json();
        const ids = new Set<number>([
          ...(data?.joined ?? []).map((h: any) => h.id),
          ...(data?.followed ?? []).map((h: any) => h.id),
        ]);
        setFollowedOrJoinedHubIds(ids);
        if (ids.size === 0) { setHubCandidateItems([]); return; }
        const candRes = await fetch(`/api/hub/for-you-candidates?hub_ids=${[...ids].join(",")}`);
        const candData = candRes.ok ? await candRes.json() : null;
        setHubCandidateItems(candData?.items ?? []);
      } catch {
        setFollowedOrJoinedHubIds(new Set());
        setHubCandidateItems([]);
      }
    })();
  }, [session?.user, forYou]);

  const activeTemplateTemplates = useMemo(() => (
    activeTemplate ? TEMPLATE_TABS.find(t => t.key === activeTemplate)?.templates ?? [] : []
  ), [activeTemplate]);

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
    const templateMatch = !activeTemplate || (
      item.type === "community" && activeTemplateTemplates.includes((item.templateType ?? "post") as never)
    );
    return typeMatch && regionMatch && tagMatch && categoryMatch && templateMatch && !isEventItem(item);
  }), [items, activeType, activeRegion, activeTag, activeCategory, activeTemplate, activeTemplateTemplates, interestTagSet]);

  // Posts from people you follow — community posts only
  const followingItems = useMemo(() => (
    filtered
      .filter(item => item.communityAuthorUsername && followedUsernames.has(item.communityAuthorUsername.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), [filtered, followedUsernames]);

  // Sort order: Following tab → followingItems; For You → ranked by interests;
  // otherwise → newest-first or top-by-engagement based on sortBy control.
  const sorted = useMemo(() => {
    if (followingFilter) return followingItems;
    if (forYou && hasInterests) {
      return rankFeed(
        [...filtered, ...hubCandidateItems.filter(item => !isEventItem(item))],
        interestTagSet, userCity, userRegion, followedUsernames, followedOrJoinedHubIds
      );
    }
    const pool = [...filtered];
    if (sortBy === "top") {
      return pool.sort((a, b) => {
        const engA = (a.reactions ? a.reactions.love + a.reactions.fire + a.reactions.clap : 0) + (a.commentCount ?? 0);
        const engB = (b.reactions ? b.reactions.love + b.reactions.fire + b.reactions.clap : 0) + (b.commentCount ?? 0);
        return engB - engA || new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }
    return pool.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filtered, hubCandidateItems, forYou, hasInterests, interestTagSet, userCity, userRegion, followedUsernames, followedOrJoinedHubIds, followingFilter, followingItems, sortBy]);

  const [trendingDirectory, setTrendingDirectory] = useState<TrendingDirectoryEntry[]>([]);
  const [trendingDirectoryLabel, setTrendingDirectoryLabel] = useState("Trending Now");
  useEffect(() => {
    fetch("/api/directory/browse?sort=trending&per_page=3")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const entries = data?.entries ?? [];
        if (entries.length > 0) {
          setTrendingDirectory(entries);
          return;
        }
        return fetch("/api/directory/browse?sort=recent&per_page=3")
          .then(res => res.ok ? res.json() : null)
          .then(recentData => {
            setTrendingDirectory(recentData?.entries ?? []);
            setTrendingDirectoryLabel("New in the Directory");
          });
      })
      .catch(() => {});
  }, []);

  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTab, setComposerTab] = useState<ComposerTab>("update");

  const spotlightEvents = useMemo(() => getSpotlightEvents(items), [items]);

  // Writers to follow — derive from feed items already in memory; no new API call needed.
  const writersToFollow = useMemo(() => {
    if (!session?.user) return [];
    const seen = new Set<string>();
    const writers: Array<{ username: string; displayName: string }> = [];
    for (const item of items) {
      if (!item.communityAuthorUsername) continue;
      const uname = item.communityAuthorUsername.toLowerCase();
      if (followedUsernames.has(uname) || seen.has(uname)) continue;
      seen.add(uname);
      writers.push({
        username: item.communityAuthorUsername,
        displayName: (item as any).communityAuthor ?? item.communityAuthorUsername,
      });
      if (writers.length >= 3) break;
    }
    return writers;
  }, [items, followedUsernames, session?.user]);

  const followUser = useCallback(async (username: string) => {
    setFollowedUsernames(prev => new Set([...prev, username.toLowerCase()]));
    try {
      await fetch("/api/connect/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
    } catch {}
  }, []);

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setVisibleCount(n => n + 20);
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, filtered.length]);

  const handleTagClick = useCallback((tag: string) => {
    setActiveType("community");
    setActiveTag(prev => prev === tag ? "" : tag);
    setVisibleCount(20);
  }, []);

  // Tab handlers — each tab is exclusive; clicking the active one is a no-op
  const handleAllPosts = () => {
    if (!forYou && !followingFilter && !activeTemplate) return;
    setForYou(false);
    setFollowingFilter(false);
    setActiveTemplate("");
    setActiveType("all");
    setActiveTag("");
    setActiveCategory("");
    setVisibleCount(20);
  };
  const handleFollowing = () => {
    if (followingFilter) return;
    setFollowingFilter(true);
    setForYou(false);
    setActiveTemplate("");
    setActiveType("all");
    setActiveTag("");
    setActiveCategory("");
    setVisibleCount(20);
  };
  const handleForYou = () => {
    if (forYou) return;
    setForYou(true);
    setFollowingFilter(false);
    setActiveTemplate("");
    setActiveType("all");
    setActiveTag("");
    setActiveCategory("");
    setVisibleCount(20);
  };
  const handleTemplate = (key: string) => {
    if (activeTemplate === key) {
      setActiveTemplate("");
      setActiveType("all");
    } else {
      setActiveTemplate(key);
      setActiveType("community");
      setForYou(false);
      setFollowingFilter(false);
      setActiveTag("");
      setActiveCategory("");
    }
    setVisibleCount(20);
  };

  // Suggested users for "Users to Follow" sidebar section
  const [suggestedUsers, setSuggestedUsers] = useState<{ id: string; displayName: string; username: string; occupation?: string }[]>([]);
  useEffect(() => {
    fetch("/api/connect/members?per_page=4&sort=recent")
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.members) setSuggestedUsers(data.members.slice(0, 4)); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: "var(--feed-bg, #f8fafc)" }}>
      <div className="pulse-layout pulse-layout--feed">

        {/* ── Center Timeline ── */}
        <main className="pulse-timeline">
        <div className="pulse-timeline-inner">
          {/* Interests nudge */}
          {session && !hasInterests && (
            <div style={{ margin: "0.75rem 1.25rem", padding: "0.75rem 1rem", background: "var(--paper-deep, #f2f2f2)", border: "1px solid var(--rule-dark)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--mute)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ink)" }}>Personalise your feed</strong> — pick your interests for a Trending view.
              </p>
              <Link href="/member/settings/interests" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Set interests →
              </Link>
            </div>
          )}

          {/* Composer box */}
          {session?.user && (
            <div className="composer-box">
              <div className="composer-box-avatar">
                {(session.user as any)?.avatarUrl ? (
                  <img src={(session.user as any).avatarUrl} alt="" />
                ) : (
                  (session.user?.name ?? (session.user as any)?.displayName ?? "?")
                    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
                )}
              </div>
              <button type="button" className="composer-box-placeholder" onClick={() => { setComposerTab("update"); setComposerOpen(true); }}>
                Share a place review, music recommendation, film take, or itinerary…
              </button>
              <button type="button" className="composer-box-review-btn" onClick={() => { setComposerTab("review"); setComposerOpen(true); }} aria-label="Write a review">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </button>
            </div>
          )}
          <ComposerModal
            open={composerOpen}
            onClose={() => setComposerOpen(false)}
            initialTab={composerTab}
          />

          {/* Feed tabs — All / content-type categories + Sort by */}
          <div className="feed-tabs">
            <div className="feed-tabs-pills">
              <button
                type="button"
                className={`feed-tab${!forYou && !followingFilter && !activeTemplate ? " feed-tab--active" : ""}`}
                onClick={handleAllPosts}
              >
                All
              </button>
              {TEMPLATE_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={`feed-tab feed-tab--category${activeTemplate === tab.key ? " feed-tab--active" : ""}`}
                  onClick={() => handleTemplate(tab.key)}
                >
                  <span className="feed-tab-emoji" aria-hidden="true">{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="feed-sort">
              <label htmlFor="feed-sort-select" className="feed-sort-label" aria-label="Sort by">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </label>
              <select
                id="feed-sort-select"
                className="feed-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as "recent" | "top")}
                aria-label="Sort by"
              >
                <option value="recent">Most Recent</option>
                <option value="top">Top Discussions</option>
              </select>
            </div>
          </div>

          {activeTag && SECTION_HUB_SLUGS[activeTag] && (
            <Link
              href={`/hub/${SECTION_HUB_SLUGS[activeTag]}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                margin: "0 1.25rem 0.75rem",
                padding: "0.7rem 1rem",
                background: "var(--paper-deep, #f2f2f2)",
                border: "1px solid var(--rule-dark)",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--ink)", fontWeight: 600 }}>
                Join the {activeTag} Hub →
              </span>
              <span style={{ fontSize: "0.68rem", color: "var(--mute)" }}>
                Every {activeTag} post lands here too
              </span>
            </Link>
          )}

          {/* Following tab empty state */}
          {followingFilter && visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px" }}>
                Nobody to follow yet
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--mute)", margin: "0 0 16px" }}>
                Follow people to see their posts here.
              </p>
              <Link href="/discover" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ochre)", textDecoration: "none" }}>
                Find people to follow →
              </Link>
            </div>
          )}

          {/* Feed items */}
          {(!followingFilter || visible.length > 0) && visible.length === 0 ? (
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
        </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="pulse-sidebar-right">

          {/* Trending Now */}
          {trendingDirectory.length > 0 && (
            <div className="pf-sidebar-section">
              <div className="pf-section-header">
                <div className="pf-section-title-row">
                  <span className="pf-section-icon">🔥</span>
                  <h3 className="pf-section-title">Trending Now</h3>
                </div>
              </div>
              {trendingDirectory.map(entry => (
                <Link key={entry.id} href={`/directory/${entry.slug}`} className="pf-trending-card">
                  <div className="pf-trending-emoji">{DIR_TYPE_EMOJI[entry.type] ?? "✦"}</div>
                  <div style={{ minWidth: 0 }}>
                    <p className="pf-trending-name">{entry.title}</p>
                    {entry.reviewCount > 0 && (
                      <p className="pf-trending-meta">{entry.reviewCount} post{entry.reviewCount !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Hubs — # hashtag-style navigation to topic communities */}
          <div className="pf-sidebar-section">
            <div className="pf-section-header">
              <div className="pf-section-title-row">
                <h3 className="pf-section-title">Explore Hubs</h3>
              </div>
              <Link href="/hub" className="pf-section-see-all">See all</Link>
            </div>
            <div className="pf-hub-chips">
              {Object.entries(SECTION_HUB_SLUGS).map(([name, slug]) => (
                <Link key={slug} href={`/hub/${slug}`} className="pf-hub-chip">
                  #{name}
                </Link>
              ))}
            </div>
          </div>

          {/* Users to Follow */}
          {suggestedUsers.length > 0 && (
            <div className="pf-sidebar-section">
              <div className="pf-section-header">
                <div className="pf-section-title-row">
                  <h3 className="pf-section-title">Writers to Follow</h3>
                </div>
                <Link href="/discover" className="pf-section-see-all">See all</Link>
              </div>
              {suggestedUsers.map(user => (
                <div key={user.id} className="pf-follow-row">
                  <div className="pf-follow-avatar">
                    {(user.displayName || user.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="pf-follow-info">
                    <p className="pf-follow-name">{user.displayName || user.username}</p>
                    {user.occupation && <p className="pf-follow-sub">{user.occupation}</p>}
                  </div>
                  <Link href={`/connect/${user.username}`} className="pf-follow-btn">Follow</Link>
                </div>
              ))}
            </div>
          )}

          {/* Trending hint for users with interests who are on All Posts */}
          {hasInterests && !forYou && !followingFilter && (
            <div className="pulse-foryou-hint">
              <p style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                Personalised feed ready
              </p>
              <p>Switch to Trending to see content ranked by your interests.</p>
              <button
                type="button"
                onClick={handleForYou}
                style={{
                  background: "var(--ochre)", color: "#fff", border: "none",
                  borderRadius: 999, padding: "8px 10px", width: "100%",
                  fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", letterSpacing: ".06em", marginTop: 8,
                }}
              >
                Trending →
              </button>
            </div>
          )}

          <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--rule, #e8e2d8)" }}>
            <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--mute)", lineHeight: 1.7 }}>
              © {new Date().getFullYear()} The Moveee. All Rights Reserved.
              <br />
              <Link href="/terms" style={{ color: "var(--mute)" }}>Terms</Link>
              {" · "}
              <Link href="/privacy" style={{ color: "var(--mute)" }}>Privacy</Link>
              {" · "}
              <Link href="/contact" style={{ color: "var(--mute)" }}>Contact</Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
