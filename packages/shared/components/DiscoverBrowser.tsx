"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "@/app/discover.css";
import { interestsToTagSet } from "@/lib/interest-mappings";
import { openSearchModal } from "@/lib/searchModalBus";
import { emitDiscoverFilters, onDiscoverFilters } from "@/lib/discoverFiltersBus";

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
  addedBy?: { username: string; displayName: string } | null;
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
  food:        { emoji: "🍽",  label: "FOOD",      color: "#7a241c" },
  book:        { emoji: "📚", label: "BOOK",      color: "#78350F" },
  film:        { emoji: "🎬", label: "FILM",      color: "#1976D2" },
  genre:       { emoji: "🎵", label: "GENRE",     color: "#6B48A8" },
  movement:    { emoji: "🌊", label: "MOVEMENT",  color: "#6B48A8" },
  artwork:     { emoji: "🎨", label: "ARTWORK",   color: "#1976D2" },
  concept:     { emoji: "💡", label: "CONCEPT",   color: "#3A342B" },
  fashion:     { emoji: "👗", label: "FASHION",   color: "#7B1FA2" },
  "tv-series": { emoji: "📺", label: "TV SERIES", color: "#00695C" },
};

const REGION_LABELS: Record<string, string> = {
  nigeria: "Nigeria", ghana: "Ghana", uk: "UK", usa: "USA", "pan-african": "Pan-African",
};

const PER_PAGE = 20;

const MASONRY_RATIOS = ["4/3", "1/1", "4/5", "16/9", "3/4", "4/3", "1/1", "16/9"];

const AZ_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["0–9"]);

function daysAgo(dateStr: string): number {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function matchesInterestTags(entry: DiscoverEntry, tagSet: Set<string>): boolean {
  if (tagSet.size === 0) return false;
  const haystack = `${entry.type} ${entry.subtype ?? ""}`.toLowerCase();
  for (const tag of tagSet) {
    if (haystack.includes(tag)) return true;
  }
  return false;
}

function DiscoverCard({
  entry,
  rail,
  aspectRatio = "4/3",
}: {
  entry: DiscoverEntry;
  rail?: boolean;
  aspectRatio?: string;
}) {
  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7A6F5C" };
  return (
    <Link
      href={`/directory/${entry.slug}`}
      className={`disc-card${rail ? " disc-card--rail" : ""}`}
    >
      <div
        className={`disc-card-img-wrap${rail ? " disc-card-img-wrap--rail" : ""}`}
        style={!rail ? { aspectRatio } : undefined}
      >
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt="" className="disc-card-img" loading="lazy" />
        ) : (
          <div className="disc-card-img-fallback" style={{ background: badge.color }}>{badge.emoji}</div>
        )}
        <div className="disc-pill">
          <span className="disc-pill-dot" style={{ background: badge.color }} />
          <span className="disc-pill-label">{badge.label}</span>
        </div>
        {entry.isNew && <span className="disc-new-badge">New</span>}
      </div>
      <div className="disc-card-body">
        <h2 className="disc-card-title">{entry.title}</h2>
        {entry.excerpt && <p className="disc-card-excerpt">{entry.excerpt}</p>}
        <div className="disc-card-footer">
          <span className="disc-card-attribution">
            {entry.addedBy ? (
              <>Added by{" "}
                <Link
                  href={`/connect/${entry.addedBy.username}`}
                  className="disc-card-attribution-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{entry.addedBy.username}
                </Link>
              </>
            ) : (
              <>Added {daysAgo(entry.dateAdded)}d ago</>
            )}
          </span>
          <button
            type="button"
            className="disc-bookmark-btn"
            aria-label="Bookmark"
            onClick={(e) => e.preventDefault()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ entry }: { entry: DiscoverEntry }) {
  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7A6F5C" };
  return (
    <Link href={`/directory/${entry.slug}`} className="disc-featured">
      <div className="disc-featured-img">
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="disc-featured-fallback" style={{ background: badge.color }}>{badge.emoji}</div>
        )}
        <div className="disc-featured-scrim" />
        <div className="disc-featured-arrow">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </div>
        <div className="disc-featured-content">
          <span className="disc-featured-pick">Editor's Pick</span>
          <div className="disc-featured-title">{entry.title}</div>
          {entry.excerpt && <p className="disc-featured-excerpt">{entry.excerpt}</p>}
        </div>
      </div>
    </Link>
  );
}

function TrendingThumb({ entry }: { entry: DiscoverEntry }) {
  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7A6F5C" };
  return (
    <Link href={`/directory/${entry.slug}`} className="disc-trending-thumb">
      <div className="disc-trending-thumb-img">
        {entry.thumbnail ? (
          <img src={entry.thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="disc-trending-thumb-fallback" style={{ background: badge.color }}>{badge.emoji}</div>
        )}
      </div>
      <div className="disc-trending-thumb-info">
        <div className="disc-trending-thumb-title">{entry.title}</div>
        <div className="disc-trending-thumb-meta">
          <span className="disc-trending-thumb-dot" style={{ background: badge.color }} />
          <span>{badge.label}</span>
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
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  const [recent, setRecent] = useState<DiscoverEntry[]>([]);
  const [trending, setTrending] = useState<DiscoverEntry[]>([]);
  const [recommended, setRecommended] = useState<DiscoverEntry[]>([]);
  const [entries, setEntries] = useState<DiscoverEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const seedRef = useRef(Math.floor(Math.random() * 1_000_000_000) + 1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return onDiscoverFilters(({ type: t, region: r, sort: s }) => {
      setType(t);
      setRegion(r);
      setSort(s);
    });
  }, []);

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

  const filteredEntries = !letterFilter
    ? entries
    : letterFilter === "0–9"
    ? entries.filter((e) => /^\d/.test(e.title))
    : entries.filter((e) => e.title.toUpperCase().startsWith(letterFilter));

  const availableLetters = new Set(
    entries
      .map((e) => (/^\d/.test(e.title) ? "0–9" : e.title[0]?.toUpperCase()))
      .filter(Boolean)
  );

  const featured = trending[0] ?? null;
  const trendingList = trending.slice(1, 6);

  return (
    <div>
      {/* Hero — warm gradient section */}
      <section className="disc-hero">
        <div className="disc-hero-blob disc-hero-blob--1" />
        <div className="disc-hero-blob disc-hero-blob--2" />
        <div className="disc-hero-inner">
          <h1 className="disc-hero-title">
            Every corner of the culture,{" "}
            <span className="disc-hero-accent">in one place.</span>
          </h1>
          <p className="disc-hero-sub">
            Search the growing encyclopedia of people, places, films, books, and sounds
            curated by the Moveee community.
          </p>
          <div className="disc-search-wrap" role="button" tabIndex={0} onClick={() => openSearchModal()} onKeyDown={(e) => e.key === "Enter" && openSearchModal()}>
            <svg className="disc-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="disc-search-placeholder">Search the archive…</span>
            <kbd className="disc-search-kbd">⌘K</kbd>
          </div>
        </div>
      </section>

      {(type || region) && (
        <div className="disc-active-filters">
          {type && (
            <span className="disc-active-filter">
              <span className="disc-active-filter-dot" style={{ background: (TYPE_BADGE[type] ?? { color: "#7a6f5c" }).color }} />
              {(TYPE_BADGE[type] ?? { label: type }).label}
              <button
                type="button"
                className="disc-active-filter-clear"
                onClick={() => { setType(null); emitDiscoverFilters({ type: null, region, sort }); }}
                aria-label="Clear type filter"
              >✕</button>
            </span>
          )}
          {region && (
            <span className="disc-active-filter">
              📍 {REGION_LABELS[region] ?? region}
              <button
                type="button"
                className="disc-active-filter-clear"
                onClick={() => { setRegion(null); emitDiscoverFilters({ type, region: null, sort }); }}
                aria-label="Clear region filter"
              >✕</button>
            </span>
          )}
        </div>
      )}

      {recommended.length > 0 && (
        <>
          <div className="disc-section-heading"><span className="disc-spark">✦</span> Picked for You</div>
          <div className="disc-rail">
            {recommended.map((e) => <DiscoverCard key={`rec-${e.id}`} entry={e} rail />)}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <div className="disc-section-heading"><span className="disc-spark">✦</span> Recently Added</div>
          <div className="disc-rail">
            {recent.map((e) => <DiscoverCard key={`recent-${e.id}`} entry={e} rail />)}
          </div>
        </>
      )}

      {/* Two-column layout: main masonry + right sidebar */}
      <div className="disc-body">
        <div className="disc-main">
          <div className="disc-section-heading"><span className="disc-spark">✦</span> Explore More</div>

          {loading ? (
            <div className="disc-loading">Loading…</div>
          ) : filteredEntries.length === 0 ? (
            <div className="disc-empty">
              <div className="disc-empty-icon">🔍</div>
              No entries match these filters.
            </div>
          ) : (
            <>
              <div className="disc-masonry">
                {filteredEntries.map((e, i) => (
                  <DiscoverCard
                    key={e.id}
                    entry={e}
                    aspectRatio={MASONRY_RATIOS[i % MASONRY_RATIOS.length]}
                  />
                ))}
              </div>
              {filteredEntries.length < total && !letterFilter ? (
                <button type="button" className="disc-load-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more entries"}
                </button>
              ) : (
                <div className="disc-count">
                  Showing {filteredEntries.length} of {total} {total === 1 ? "entry" : "entries"}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="disc-sidebar">
          {featured && (
            <div className="disc-sidebar-section">
              <div className="disc-sidebar-heading">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#B38238">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Featured
              </div>
              <FeaturedCard entry={featured} />
            </div>
          )}

          {trendingList.length > 0 && (
            <div className="disc-sidebar-section">
              <div className="disc-sidebar-heading">Trending Now</div>
              <div className="disc-trending-thumbs">
                {trendingList.map((e) => <TrendingThumb key={e.id} entry={e} />)}
              </div>
            </div>
          )}

          <div className="disc-sidebar-section">
            <div className="disc-sidebar-heading">A–Z Index</div>
            <div className="disc-az-grid">
              {AZ_LETTERS.map((letter) => {
                const available = entries.length === 0 || availableLetters.has(letter);
                const active = letterFilter === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    className={`disc-az-btn${active ? " disc-az-btn--active" : ""}${!available && entries.length > 0 ? " disc-az-btn--dim" : ""}`}
                    onClick={() => setLetterFilter(active ? null : letter)}
                    disabled={!available && entries.length > 0}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="disc-sidebar-section">
            <div className="disc-sidebar-heading">Browse by Type</div>
            <div className="disc-type-pills">
              {Object.entries(TYPE_BADGE).map(([slug, info]) => (
                <button
                  key={slug}
                  type="button"
                  className={`disc-type-pill${type === slug ? " disc-type-pill--active" : ""}`}
                  style={type === slug ? { background: info.color, borderColor: info.color } : {}}
                  onClick={() => {
                    const next = type === slug ? null : slug;
                    setType(next);
                    emitDiscoverFilters({ type: next, region, sort });
                  }}
                >
                  {info.emoji} {info.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
