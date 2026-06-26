"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/app/discover.css";
import { interestsToTagSet } from "@/lib/interest-mappings";

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

function DiscoverCard({ entry, rail }: { entry: DiscoverEntry; rail?: boolean }) {
  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7A6F5C" };
  return (
    <Link href={`/directory/${entry.slug}`} className={`disc-card${rail ? " disc-card--rail" : ""}`}>
      <div>
        <div className="disc-card-type" style={{ color: badge.color }}>
          {badge.emoji} {badge.label}
        </div>
        <div className="disc-card-title">{entry.title}</div>
        {!rail && entry.excerpt && <div className="disc-card-excerpt">{entry.excerpt}</div>}
      </div>
      <div>
        {entry.city && <div className="disc-card-city">📍 {entry.city}</div>}
        {rail ? (
          <div className={`disc-card-age${entry.isNew ? " disc-card-age--new" : ""}`}>
            {entry.isNew ? "🆕 Added today" : `Added ${daysAgo(entry.dateAdded)}d ago`}
          </div>
        ) : (
          (entry.averageRating || entry.subtype) && (
            <div className="disc-card-footer">
              {entry.averageRating ? (
                <span className="disc-card-rating" style={{ color: "#B38238" }}>
                  {"★".repeat(Math.round(entry.averageRating))} {entry.averageRating.toFixed(1)}
                </span>
              ) : <span />}
              {entry.subtype && <span className="disc-card-subtype">{entry.subtype}</span>}
            </div>
          )
        )}
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(initialType);
  const [region, setRegion] = useState<string | null>(initialRegion);
  const [sort, setSort] = useState<SortOption>("relevant");
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

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
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (region) params.set("region", region);
    // Default browsing (no search, no explicit sort choice) shows a fresh
    // random mix every visit rather than the same "most relevant" order.
    const effectiveSort = sort === "relevant" && !query ? "random" : sort;
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
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, region, sort]);

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
      if (query) params.set("q", query);
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
  }, [filterOpen, query, type, draftRegion, draftSort]);

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

  const hasActiveRefinement = !!region || sort !== "relevant";

  return (
    <div>
      <div className="disc-header">
        <h1 className="disc-title">Discover</h1>
        <button
          type="button"
          className="disc-search-toggle"
          aria-label={searchOpen ? "Close search" : "Search"}
          onClick={() => setSearchOpen((v) => !v)}
        >
          {searchOpen ? "✕" : "🔍"}
        </button>
      </div>

      {searchOpen && (
        <div className="disc-search-bar">
          <span>🔍</span>
          <input
            className="disc-search-input"
            placeholder="Search people, places, books…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="disc-chip-row">
        <div className="disc-type-dd">
          <button
            type="button"
            className={`disc-type-trigger${type ? " disc-type-trigger--active" : ""}${typeMenuOpen ? " disc-type-trigger--open" : ""}`}
            onClick={() => setTypeMenuOpen((v) => !v)}
          >
            {type ? `${TYPE_BADGE[type]?.emoji ?? "✦"} ${TYPE_BADGE[type]?.label ?? type}` : "All Types"}
            <span className="disc-type-trigger-caret">▾</span>
          </button>
          {typeMenuOpen && (
            <>
              <div className="disc-type-menu-backdrop" onClick={() => setTypeMenuOpen(false)} />
              <div className="disc-type-menu">
                <button
                  type="button"
                  className={`disc-type-menu-item${!type ? " disc-type-menu-item--active" : ""}`}
                  onClick={() => { setType(null); setTypeMenuOpen(false); }}
                >
                  ✦ All Types
                </button>
                {Object.entries(TYPE_BADGE).map(([slug, badge]) => {
                  const active = type === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      className={`disc-type-menu-item${active ? " disc-type-menu-item--active" : ""}`}
                      onClick={() => { setType(active ? null : slug); setTypeMenuOpen(false); }}
                    >
                      {badge.emoji} {badge.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          className={`disc-filter-btn${hasActiveRefinement ? " disc-filter-btn--active" : ""}`}
          onClick={openFilter}
        >
          ⚙ Filters
        </button>
      </div>

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
        <div className="disc-empty">No entries match these filters.</div>
      ) : (
        <>
          <div className="disc-grid">
            {entries.map((e) => (
              <DiscoverCard key={e.id} entry={e} />
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
            <button type="button" className="disc-filter-close" aria-label="Close" onClick={() => setFilterOpen(false)}>
              ✕
            </button>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Filter Discover</h2>

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
