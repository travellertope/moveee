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
import TypePickerModal from "./TypePickerModal";
import type { TemplateType } from "./SubmitPost";
import "@/app/pulse-layout.css";

function draftKey(userId: string | number): string {
  return `moveee_post_draft_${userId}`;
}

const REGIONS = ["All", "Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"] as const;

// Mirrors Culture_Hubs::SECTION_HUB_SLUGS (docs/hubs-plan.md §10.2) — no
// shared source of truth across the PHP/TS boundary here, same caveat as
// every other duplicated map in this codebase (notification icons, etc.).
const SECTION_HUB_SLUGS: Record<string, string> = {
  Music: "music", Fashion: "fashion", Art: "art", Film: "film", Food: "food",
  Sport: "sport", Travel: "travel", Ideas: "ideas", Literature: "literature",
  Design: "design", Tech: "tech",
};

// Mirrors apps/mobile/src/components/community/DiscoverCard.tsx's TYPE_BADGE —
// kept as a small local map here since this is just a compact rail glyph,
// not the full Discover card treatment.
const DIR_TYPE_EMOJI: Record<string, string> = {
  person: "👤", place: "🏛", food: "🍽", book: "📚", film: "🎬",
  genre: "🎵", movement: "🌊", artwork: "🎨", concept: "💡",
  fashion: "👗", "tv-series": "📺",
};

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
  const [forYou, setForYou]         = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
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

  // For You Hub inclusion (docs/hubs-plan.md §4.5) — only fetched once For
  // You is actually toggled on, since it's otherwise unused.
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
  // Hub posts (docs/hubs-plan.md §4.5) only ever enter the ranking pool here,
  // via hubCandidateItems — never through the default `items`/`filtered`
  // fetch, which excludes them server-side.
  const sorted = useMemo(() => (
    forYou && hasInterests
      ? rankFeed(
          [...filtered, ...hubCandidateItems.filter(item => !isEventItem(item))],
          interestTagSet, userCity, userRegion, followedUsernames, followedOrJoinedHubIds
        )
      : [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ), [filtered, hubCandidateItems, forYou, hasInterests, interestTagSet, userCity, userRegion, followedUsernames, followedOrJoinedHubIds]);

  // Trending directory entries for the right rail — reuses the Discover
  // feature's existing sort=trending (ranked by _community_review_count,
  // i.e. how often community posts link to the entry), rather than a
  // separate "trending posts" concept. Falls back to sort=recent when
  // nothing has accumulated a review count yet (young directory), so the
  // rail isn't permanently empty while that data builds up organically.
  const [trendingDirectory, setTrendingDirectory] = useState<TrendingDirectoryEntry[]>([]);
  const [trendingDirectoryLabel, setTrendingDirectoryLabel] = useState("Trending in the Directory");
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

  // Composer pill opens a type-picker modal (composer redesign, July 2026);
  // picking a type navigates to the dedicated /post/new page instead of
  // expanding SubmitPost inline.
  const router = useRouter();
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const userId = (session?.user as any)?.id as string | number | undefined;
  useEffect(() => {
    if (!userId) return;
    setHasDraft(!!localStorage.getItem(draftKey(userId)));
  }, [userId]);
  const selectTemplate = useCallback((t: TemplateType) => {
    setTypeModalOpen(false);
    router.push(`/post/new?template=${t}`);
  }, [router]);
  const selectDraftTile = useCallback(() => {
    setTypeModalOpen(false);
    router.push("/post/new?draft=1");
  }, [router]);

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

  const handleTagClick = useCallback((tag: string) => {
    setActiveType("community");
    setActiveTag(prev => prev === tag ? "" : tag);
    setVisibleCount(20);
  }, []);

const handleForYou = () => {
    setForYou(prev => !prev);
    setActiveType("all");
    setActiveTag("");
    setActiveCategory("");
    setVisibleCount(20);
  };

  const showRegions = activeType === "all" || activeType === "pulse";
  const showTags = availableTags.length > 0 && (activeType === "all" || activeType === "community");


  return (
    <div style={{ background: "var(--paper, #ffffff)" }}>
      <div className="pulse-layout pulse-layout--feed">

        {/* ── Center Timeline ── */}
        <main className="pulse-timeline">
        <div className="pulse-timeline-inner">
          {/* Interests nudge for logged-in users with no interests set */}
          {session && !hasInterests && (
            <div style={{ margin: "0.75rem 1.25rem", padding: "0.75rem 1rem", background: "var(--paper-deep, #f2f2f2)", border: "1px solid var(--rule-dark)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--mute)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ink)" }}>Personalise your feed</strong> — pick your interests for a For You view.
              </p>
              <Link href="/member/settings/interests" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Set interests →
              </Link>
            </div>
          )}

          {session?.user && (
            <button type="button" className="composer-pill" onClick={() => setTypeModalOpen(true)}>
              <span className="composer-pill-avatar">
                {(session.user as any)?.avatarUrl ? (
                  <img src={(session.user as any).avatarUrl} alt="" />
                ) : (
                  (session.user?.name ?? (session.user as any)?.displayName ?? "?")
                    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
                )}
              </span>
              <span className="composer-pill-input">Share something with the community…</span>
              <span className="composer-pill-post">Post</span>
            </button>
          )}
          <TypePickerModal
            open={typeModalOpen}
            onClose={() => setTypeModalOpen(false)}
            onSelect={selectTemplate}
            hasDraft={hasDraft}
            onSelectDraft={selectDraftTile}
          />

          {/* For You / Latest — content-type and category filtering moved into
              the global search modal; this pair is the one remaining feed-level
              control, mirroring the Twitter/Instagram "For You / Following"
              pattern directly above the post list. */}
          <div className="feed-tabs">
            <button
              type="button"
              className={`feed-tab${!forYou ? " feed-tab--active" : ""}`}
              onClick={() => { if (forYou) handleForYou(); }}
            >
              Latest
            </button>
            <button
              type="button"
              className={`feed-tab${forYou ? " feed-tab--active" : ""}`}
              onClick={() => { if (!forYou) handleForYou(); }}
            >
              For You
            </button>
          </div>

          {/* Section-filter → Hub prompt (docs/hubs-plan.md §10.4) — the
              filter itself stays a lightweight, in-place list (no redirect);
              this is just a one-click way to the fuller Hub page for anyone
              who wants member count, Join, mod tools, etc. */}
          {activeTag && SECTION_HUB_SLUGS[activeTag] && (
            <Link
              href={`/hub/${SECTION_HUB_SLUGS[activeTag]}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                margin: "0 1.25rem 0.75rem",
                padding: "0.7rem 1rem",
                background: "var(--paper-deep, #f2f2f2)",
                border: "1px solid var(--rule-dark)",
                borderRadius: 6,
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
        </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="pulse-sidebar-right">
          <div className="pulse-about-card" style={{ marginTop: 0 }}>
            <p className="pulse-about-desc">
              The community for creatives, entrepreneurs, and culture lovers. Post, share, and stay in important culture conversations.
            </p>
          </div>

          {/* Trending directory entries — the ones community posts are
              referencing/linking to most, via the Discover feature's
              existing sort=trending (ranked by _community_review_count). */}
          {trendingDirectory.length > 0 && (
            <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
              <p className="pulse-trending-heading">{trendingDirectoryLabel}</p>
              <div>
                {trendingDirectory.map(entry => (
                  <Link key={entry.id} href={`/directory/${entry.slug}`} className="pulse-trending-item" style={{ display: "block", textDecoration: "none" }}>
                    <p className="pulse-trending-title">
                      {DIR_TYPE_EMOJI[entry.type] ?? "✦"} {entry.title}
                    </p>
                    {entry.reviewCount > 0 && (
                      <p className="pulse-trending-count">
                        {entry.reviewCount} community post{entry.reviewCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </Link>
                ))}
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

          {/* Minimal footer — the full site footer is skipped on /feed
              (see ConditionalFooter.tsx) since infinite scroll makes it
              effectively unreachable; this is the one piece that still
              needs to be somewhere. */}
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
