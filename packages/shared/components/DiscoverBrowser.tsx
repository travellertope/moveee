"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/app/discover.css";
import { interestsToTagSet } from "@/lib/interest-mappings";
import { openSearchModal } from "@/lib/searchModalBus";

export interface DiscoverEntry {
  id: number;
  title: string;
  slug: string;
  type: string;
  subtype?: string;
  excerpt?: string;
  thumbnail: string | null;
  city: string;
  averageRating: number | null;
  reviewCount: number;
  dateAdded: string;
  isNew: boolean;
}

interface BrowseResponse {
  entries: DiscoverEntry[];
  total: number;
  page: number;
  perPage: number;
}

type SortOption = "relevant" | "recent" | "rating";

export const TYPE_BADGE: Record<string, { emoji: string; label: string; color: string }> = {
  person:      { emoji: "👤", label: "PERSON",    color: "#B38238" },
  place:       { emoji: "🏛",  label: "PLACE",     color: "#2E7D32" },
  food:        { emoji: "🍽",  label: "FOOD",      color: "#C5491F" },
  book:        { emoji: "📚", label: "BOOK",      color: "#78350F" },
  film:        { emoji: "🎬", label: "FILM",      color: "#1976D2" },
  genre:       { emoji: "🎵", label: "GENRE",     color: "#6B48A8" },
  movement:    { emoji: "🌊", label: "MOVEMENT",  color: "#6B48A8" },
  artwork:     { emoji: "🎨", label: "ARTWORK",   color: "#1976D2" },
  concept:     { emoji: "💡", label: "CONCEPT",   color: "#3A342B" },
  fashion:     { emoji: "👗", label: "FASHION",   color: "#7B1FA2" },
  "tv-series": { emoji: "📺", label: "TV SERIES", color: "#00695C" },
};

const REGIONS: { slug: string; label: string }[] = [
  { slug: "nigeria", label: "Nigeria" },
  { slug: "ghana", label: "Ghana" },
  { slug: "uk", label: "UK" },
  { slug: "usa", label: "USA" },
  { slug: "pan-african", label: "Pan-African" },
];

const SORTS: { value: SortOption; label: string }[] = [
  { value: "relevant", label: "Most Relevant" },
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
];

const PER_PAGE = 20;

// Purely decorative height cycle for the Explore More masonry — same
// technique the approved mockup used (manually varied heights, not derived
// from real image aspect ratios, since the API doesn't expose those).
const MASONRY_HEIGHTS = [280, 190, 230, 340, 210, 260, 220, 300];

function daysAgo(dateStr: string): number {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// Loose substring match against an entry's type/subtype — same approach as
// the feed's matchesInterests(), since Discover entries have no canonical
// interest-slug field, only a freeform subtype name.
function matchesInterestTags(entry: DiscoverEntry, tagSet: Set<string>): boolean {
  if (tagSet.size === 0) return false;
  const haystack = `${entry.type} ${entry.subtype ?? ""}`.toLowerCase();
  for (const tag of tagSet) {
    if (haystack.includes(tag)) return true;
  }
  return false;
}

function DiscoverCard({ entry, rail, height }: { entry: DiscoverEntry; rail?: boolean; height?: number }) {
  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7A6F5C" };
  return (
    <Link
      href={`/directory/${entry.slug}`}
      className={`disc-card${rail ? " disc-card--rail" : ""}`}
      style={height ? { height } : undefined}
    >
      <div className="disc-card-art">
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt="" className="disc-card-img" loading="lazy" />
        ) : (
          <div className="disc-card-art-fallback" style={{ background: badge.color }}>{badge.emoji}</div>
        )}
        <div className="disc-card-scrim" />
      </div>
      <div className="disc-card-content">
        <span className="disc-card-badge" style={{ color: badge.color }}>{badge.emoji} {badge.label}</span>
        <div>
          {rail && entry.isNew && <span className="disc-card-new">🆕 Added today</span>}
          <div className="disc-card-title">{entry.title}</div>
          <div className="disc-card-meta">
            {entry.city && <span>📍 {entry.city}</span>}
            {entry.city && (rail ? true : entry.averageRating || entry.subtype) && <span>·</span>}
            {rail ? (
              !entry.isNew && <span>Added {daysAgo(entry.dateAdded)}d ago</span>
            ) : entry.averageRating ? (
              <span className="disc-card-rating">
                {"★".repeat(Math.round(entry.averageRating))}
                <span style={{ opacity: 0.4 }}>{"☆".repeat(5 - Math.round(entry.averageRating))}</span>{" "}
                {entry.averageRating.toFixed(1)}
              </span>
            ) : entry.subtype ? (
              <span className="disc-card-subtype-pill">{entry.subtype}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DiscoverBrowser({
  initialType = null,
  initialRegion = null,
  viewerInterests = [],
}: {
  initialType?: string | null;
  initialRegion?: string | null;
  viewerInterests?: string[];
}) {
  const interestTags = interestsToTagSet(viewerInterests);
  const [type, setType] = useState<string | null>(initialType);
  const [region, setRegion] = useState<string | null>(initialRegion);
  const [sort, setSort] = useState<SortOption>("relevant");
  const [filterOpen, setFilterOpen] = useState(false);

  const [draftRegion, setDraftRegion] = useState<string | null>(region);
  const [draftSort, setDraftSort] = useState<SortOption>(sort);
  const [draftCount, setDraftCount] = useState<number | null>(null);

  const [recent, setRecent] = useState<DiscoverEntry[]>([]);
  const [trending, setTrending] = useState<DiscoverEntry[]>([]);
  const [recommended, setRecommended] = useState<DiscoverEntry[]>([]);
  const [entries, setEntries] = useState<DiscoverEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Stable per-visit random seed so "Load more" pagination doesn't reshuffle
  // already-seen entries — regenerated only on a fresh page load.
  const seedRef = useRef(Math.floor(Math.random() * 1_000_000_000) + 1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const countDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Recently Added rail
  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    params.set("sort", "recent");
    params.set("per_page", "10");
    fetch(`/api/directory/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((d: BrowseResponse) => setRecent(d?.entries ?? []))
      .catch(() => setRecent([]));
  }, [type, region]);

  // Trending in Community rail — entries most referenced by community posts
  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    params.set("sort", "trending");
    params.set("per_page", "10");
    fetch(`/api/directory/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((d: BrowseResponse) => setTrending(d?.entries ?? []))
      .catch(() => setTrending([]));
  }, [type, region]);

  // Picked for You rail — no filter UI, just a quiet personalization layer:
  // sample a larger recent batch and keep only entries matching the
  // viewer's interest tags. Hidden entirely when there's no real match.
  useEffect(() => {
    if (interestTags.size === 0) { setRecommended([]); return; }
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    params.set("sort", "recent");
    params.set("per_page", "30");
    fetch(`/api/directory/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((d: BrowseResponse) => {
        const matches = (d?.entries ?? []).filter((e) => matchesInterestTags(e, interestTags));
        setRecommended(matches.slice(0, 10));
      })
      .catch(() => setRecommended([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, region]);

  async function fetchPage(pageNum: number, replace: boolean) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    // Default browsing (no explicit sort choice) shows a fresh random mix
    // every visit rather than the same "most relevant" order.
    const effectiveSort = sort === "relevant" ? "random" : sort;
    params.set("sort", effectiveSort);
    if (effectiveSort === "random") params.set("seed", String(seedRef.current));
    params.set("page", String(pageNum));
    params.set("per_page", String(PER_PAGE));
    const res = await fetch(`/api/directory/browse?${params.toString()}`);
    const data: BrowseResponse = await res.json();
    setEntries((prev) => (replace ? data?.entries ?? [] : [...prev, ...(data?.entries ?? [])]));
    setTotal(data?.total ?? 0);
    setPage(pageNum);
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      await fetchPage(1, true);
      setLoading(false);
    }, 200);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, region, sort]);

  async function loadMore() {
    if (loadingMore || entries.length >= total) return;
    setLoadingMore(true);
    await fetchPage(page + 1, false);
    setLoadingMore(false);
  }

  // Live debounced count for the filter panel footer
  useEffect(() => {
    if (!filterOpen) return;
    clearTimeout(countDebounceRef.current);
    countDebounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (draftRegion) params.set("region", draftRegion);
      params.set("sort", draftSort);
      params.set("per_page", "1");
      try {
        const res = await fetch(`/api/directory/browse?${params.toString()}`);
        const data: BrowseResponse = await res.json();
        setDraftCount(data?.total ?? 0);
      } catch {
        setDraftCount(null);
      }
    }, 350);
    return () => clearTimeout(countDebounceRef.current);
  }, [filterOpen, type, draftRegion, draftSort]);

  function openFilter() {
    setDraftRegion(region);
    setDraftSort(sort);
    setFilterOpen(true);
  }

  function applyFilter() {
    setRegion(draftRegion);
    setSort(draftSort);
    setFilterOpen(false);
  }

  const activeFilterCount = (region ? 1 : 0) + (sort !== "relevant" ? 1 : 0);
  const hasActiveRefinement = activeFilterCount > 0;

  return (
    <div>
      <div className="disc-header">
        <h1 className="disc-title">Discover</h1>
      </div>

      {/* Same "opens the shared SearchModal" pattern as /events — this
          finds a specific entry by typing; it doesn't filter the browse
          grid below, which is why type/region/sort stay as separate,
          always-visible controls instead of living inside the modal. */}
      <button type="button" className="disc-search-btn" onClick={() => openSearchModal()}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        Search people, places, books, films…
      </button>

      {/* Quiet underline tabs, not filled pills — the type facet filters
          the grid directly (no typing required), so it stays visually
          subordinate to the search entry point above. */}
      <div className="disc-type-tabs">
        <button
          type="button"
          className={`disc-type-tab${!type ? " active" : ""}`}
          style={{ ["--tab-color" as any]: "var(--ochre)" }}
          onClick={() => setType(null)}
        >
          ✦ All
        </button>
        {Object.entries(TYPE_BADGE).map(([slug, badge]) => (
          <button
            key={slug}
            type="button"
            className={`disc-type-tab${type === slug ? " active" : ""}`}
            style={{ ["--tab-color" as any]: badge.color }}
            onClick={() => setType(type === slug ? null : slug)}
          >
            <span className="disc-type-tab-dot" style={{ background: badge.color }} />
            {badge.emoji} {badge.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`disc-filter-btn${hasActiveRefinement ? " disc-filter-btn--active" : ""}`}
        onClick={openFilter}
      >
        ⚙ Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
      </button>

      {recommended.length > 0 && (
        <>
          <div className="disc-rail-heading">Picked for You</div>
          <div className="disc-rail">
            {recommended.map((e) => (
              <DiscoverCard key={`recommended-${e.id}`} entry={e} rail />
            ))}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <div className="disc-rail-heading">Recently Added</div>
          <div className="disc-rail">
            {recent.map((e) => (
              <DiscoverCard key={`recent-${e.id}`} entry={e} rail />
            ))}
          </div>
        </>
      )}

      {trending.length > 0 && (
        <>
          <div className="disc-rail-heading">Trending in Community</div>
          <div className="disc-rail">
            {trending.map((e) => (
              <DiscoverCard key={`trending-${e.id}`} entry={e} rail />
            ))}
          </div>
        </>
      )}

      <div className="disc-grid-heading">Explore More</div>

      {loading ? (
        <div className="disc-loading">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="disc-empty">
          <div className="disc-empty-icon">🔍</div>
          No entries match these filters.
        </div>
      ) : (
        <>
          <div className="disc-masonry">
            {entries.map((e, i) => (
              <DiscoverCard key={e.id} entry={e} height={MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]} />
            ))}
          </div>
          {entries.length < total ? (
            <button type="button" className="disc-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : (
            <div className="disc-count">
              Showing {entries.length} of {total} {total === 1 ? "entry" : "entries"}
            </div>
          )}
        </>
      )}

      {filterOpen && (
        <div className="disc-filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="disc-filter-panel" onClick={(e) => e.stopPropagation()}>
            <div className="disc-filter-header">
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Filter Discover</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {(draftRegion || draftSort !== "relevant") && (
                  <button
                    type="button"
                    className="disc-filter-reset"
                    onClick={() => {
                      setDraftRegion(null);
                      setDraftSort("relevant");
                    }}
                  >
                    Reset
                  </button>
                )}
                <button type="button" className="disc-filter-close" aria-label="Close" onClick={() => setFilterOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="disc-filter-section-label">Region</div>
            <div className="disc-chip-row" style={{ paddingTop: 0 }}>
              <button
                type="button"
                className={`disc-chip${!draftRegion ? " disc-chip--active" : ""}`}
                onClick={() => setDraftRegion(null)}
              >
                All
              </button>
              {REGIONS.map((r) => {
                const active = draftRegion === r.slug;
                return (
                  <button
                    key={r.slug}
                    type="button"
                    className={`disc-chip${active ? " disc-chip--active" : ""}`}
                    onClick={() => setDraftRegion(active ? null : r.slug)}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <div className="disc-filter-section-label">Sort by</div>
            {SORTS.map((s) => {
              const active = draftSort === s.value;
              return (
                <div key={s.value} className="disc-sort-row" onClick={() => setDraftSort(s.value)}>
                  <span className={`disc-radio${active ? " disc-radio--active" : ""}`}>
                    {active && <span className="disc-radio-dot" />}
                  </span>
                  <span>{s.label}</span>
                </div>
              );
            })}

            <button type="button" className="disc-filter-apply" onClick={applyFilter}>
              {draftCount === null ? "Show entries" : `Show ${draftCount} ${draftCount === 1 ? "entry" : "entries"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
