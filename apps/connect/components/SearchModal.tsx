"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { emitDiscoverFilters, type DiscoverFilters } from "@/lib/discoverFiltersBus";
import { emitPeopleFilters } from "@/lib/peopleFiltersBus";
import { emitStoopFilters } from "@/lib/stoopFiltersBus";
import "./search-modal.css";

const CONTENT_TYPES = [
  { label: "All",       value: "all"       },
  { label: "Post",      value: "pulse"     },
  { label: "News",      value: "news"      },
  { label: "Editorial", value: "editorial" },
  { label: "Event",     value: "event"     },
  { label: "Directory", value: "directory" },
  { label: "Quote",     value: "quote"     },
  // Not a WP post subtype like the others — routes to a dedicated member
  // search (/api/connect/members) instead of /api/search. See isPeople below.
  { label: "Person",    value: "member"    },
  // Also not a WP post subtype — routes to /api/cluster/discover's own `q`
  // param instead of /api/search. See isStoop below.
  { label: "Stoop",     value: "stoop"     },
];

// Stoop-only facet — City. Clusters have no fixed/enumerable city list (any
// free-text city works at creation time), so this mirrors the same
// fixed-shortlist-of-common-cities compromise EVENT_CITIES already uses
// below, rather than trying to build a real dynamic list. Immediate-apply on
// click via stoopFiltersBus, same pattern as Discover's Region/People's
// Location — no typing required.
const STOOP_CITIES: { value: string; label: string }[] = [
  { value: "Lagos", label: "Lagos" },
  { value: "London", label: "London" },
  { value: "Accra", label: "Accra" },
  { value: "Nairobi", label: "Nairobi" },
  { value: "New York", label: "New York" },
  { value: "Paris", label: "Paris" },
];

interface StoopResult {
  id: number;
  name: string;
  city: string;
  street: string;
  meetingDay: string;
  meetingTime: string;
}

// People-only facets — shown only when contentType === "member". Mirrors
// DISCIPLINES in MemberDirectory.tsx (values are literal words matched via
// LIKE against _culture_directory_disciplines, not slugs) — no shared
// source of truth, same caveat as the other facet lists in this file.
// Colors match the approved People Near Me mockup's colored-dot chips.
const PEOPLE_INDUSTRIES: { value: string; color: string }[] = [
  { value: "Creative", color: "#7b1fa2" },
  { value: "Entrepreneur", color: "#b38238" },
  { value: "Artist", color: "#c2185b" },
  { value: "Filmmaker", color: "#1976d2" },
  { value: "Writer", color: "#78350f" },
  { value: "Designer", color: "#00695c" },
  { value: "Musician", color: "#6b48a8" },
  { value: "Photographer", color: "#2e7d32" },
  { value: "Tech", color: "#37474f" },
  { value: "Legal", color: "#283593" },
  { value: "Finance", color: "#8d6e63" },
  { value: "Academic", color: "#5d4037" },
];

// Same 5 region slugs as DISCOVER_REGIONS (kept as separate consts since
// they gate different pages/params, even though the values happen to
// match) — "Near Me" (null) and "All Locations" ("all") are People-specific
// states with no Discover equivalent.
const PEOPLE_REGIONS: { slug: string; label: string }[] = [
  { slug: "nigeria", label: "Nigeria" },
  { slug: "ghana", label: "Ghana" },
  { slug: "uk", label: "UK" },
  { slug: "usa", label: "USA" },
  { slug: "pan-african", label: "Pan-African" },
];

interface MemberResult {
  id: string;
  username: string;
  displayName: string;
  occupation: string;
  tier: string;
}

// Mirrors PulseFeed.tsx's CATEGORY_FILTERS — kept in sync manually, same
// caveat as the notification-icon maps elsewhere in this codebase (no
// shared source of truth across these two files).
const CATEGORIES = [
  "All", "Music", "Film", "Art", "Fashion", "Literature",
  "Food", "Tech", "Sport", "Travel", "Design", "Ideas",
];

// Event-only facets — shown only when contentType === "event". Mirrors the
// city list used across the /events page/archives (FEATURED_CITIES in
// events/page.tsx) — no shared source of truth, same caveat as above.
const EVENT_CITIES = ["All", "Lagos", "London", "Accra", "Nairobi", "New York", "Paris"];
const EVENT_PRICES = ["All", "Free", "Paid", "🪶 Members-only"];
const EVENT_FORMATS = ["All", "In-person", "Virtual"];

// Directory-only facets — shown only when contentType === "directory".
// Mirrors TYPE_BADGE/REGIONS/SORTS in DiscoverBrowser.tsx — no shared
// source of truth, same caveat as above. Unlike the event facets, these
// don't just refine this modal's own search text — they also remote-control
// the /discover page's own grid via discoverFiltersBus, since
// Type/Region/Sort are real structured filters there (not folded-into-text
// approximations).
const DISCOVER_TYPES: { slug: string; label: string; color: string }[] = [
  { slug: "person", label: "Person", color: "#B38238" },
  { slug: "place", label: "Place", color: "#2E7D32" },
  { slug: "food", label: "Food", color: "#C5491F" },
  { slug: "book", label: "Book", color: "#78350F" },
  { slug: "film", label: "Film", color: "#1976D2" },
  { slug: "genre", label: "Genre", color: "#6B48A8" },
  { slug: "movement", label: "Movement", color: "#6B48A8" },
  { slug: "artwork", label: "Artwork", color: "#1976D2" },
  { slug: "concept", label: "Concept", color: "#3A342B" },
  { slug: "fashion", label: "Fashion", color: "#7B1FA2" },
  { slug: "tv-series", label: "TV Series", color: "#00695C" },
];
const DISCOVER_REGIONS: { slug: string; label: string }[] = [
  { slug: "nigeria", label: "Nigeria" },
  { slug: "ghana", label: "Ghana" },
  { slug: "uk", label: "UK" },
  { slug: "usa", label: "USA" },
  { slug: "pan-african", label: "Pan-African" },
];
const DISCOVER_SORTS: { value: DiscoverFilters["sort"]; label: string }[] = [
  { value: "relevant", label: "Most Relevant" },
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
];

const SUBTYPE_META: Record<string, { emoji: string; label: string }> = {
  culture_post:     { emoji: "💬", label: "Post"       },
  pulse_story:      { emoji: "📰", label: "News"       },
  post:             { emoji: "📖", label: "Editorial"  },
  culture_event:    { emoji: "📅", label: "Event"      },
  culture_directory:{ emoji: "✦",  label: "Directory"  },
  culture_quote:    { emoji: "❝",  label: "Quote"      },
};

interface SearchResult {
  id: number;
  title: string;
  subtype: string;
  href: string;
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState("all");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [price, setPrice] = useState("All");
  const [format, setFormat] = useState("All");
  const [discoverType, setDiscoverType] = useState<string | null>(null);
  const [discoverRegion, setDiscoverRegion] = useState<string | null>(null);
  const [discoverSort, setDiscoverSort] = useState<DiscoverFilters["sort"]>("relevant");
  const [peopleIndustry, setPeopleIndustry] = useState<string | null>(null);
  const [peopleRegion, setPeopleRegion] = useState<string | null>(null);
  const [stoopCity, setStoopCity] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [stoopResults, setStoopResults] = useState<StoopResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEvent = contentType === "event";
  const isDirectory = contentType === "directory";
  const isPeople = contentType === "member";
  const isStoop = contentType === "stoop";

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => { clearTimeout(t); document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const runSearch = useCallback((q: string, type: string, cat: string, evtCity: string, evtPrice: string, evtFormat: string, discType: string | null, discRegion: string | null) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ q: q.trim(), type });
    if (cat !== "All") params.set("category", cat);
    if (type === "event") {
      if (evtCity !== "All") params.set("city", evtCity);
      if (evtPrice !== "All") params.set("price", evtPrice);
      if (evtFormat !== "All") params.set("format", evtFormat);
    }
    // Type/Region are real structured filters for the /discover page itself
    // (see the discoverType/discoverRegion click handlers below) — here,
    // against this modal's own generic text search, they're just folded in
    // as approximate keywords, same treatment as City for events.
    if (type === "directory" && (discType || discRegion)) {
      const typeLabel = DISCOVER_TYPES.find((t) => t.slug === discType)?.label;
      const regionLabel = DISCOVER_REGIONS.find((r) => r.slug === discRegion)?.label;
      const combined = [cat !== "All" ? cat : "", typeLabel, regionLabel].filter(Boolean).join(" ");
      if (combined) params.set("category", combined);
    }
    fetch(`/api/search?${params.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setResults(data?.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  // Member search is a different endpoint/shape entirely (/api/connect/members,
  // not /api/search) — WP's native search has no concept of Users, so the
  // generic runSearch above can never find a member. Industry/Region are real
  // structured params here (not folded-into-text approximations like
  // Directory's Region), since /api/connect/members already supports them
  // natively.
  const runPeopleSearch = useCallback((q: string, industry: string | null, region: string | null) => {
    if (!q.trim()) {
      setMemberResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ search: q.trim(), directory: "1", per_page: "20" });
    if (industry) params.set("discipline", industry);
    if (region) params.set("region", region);
    fetch(`/api/connect/members?${params.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setMemberResults(data?.members ?? []))
      .catch(() => setMemberResults([]))
      .finally(() => setLoading(false));
  }, []);

  // Stoop search is a third different endpoint/shape — /api/cluster/discover's
  // own `q` param (native WP_Query title/content search on culture_cluster),
  // not /api/search. City is a real structured param here too (not a
  // folded-into-text approximation), same treatment as People's Region.
  const runStoopSearch = useCallback((q: string, cityFilter: string | null) => {
    if (!q.trim()) {
      setStoopResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ q: q.trim(), per_page: "20" });
    if (cityFilter) params.set("city", cityFilter);
    fetch(`/api/cluster/discover?${params.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setStoopResults(data?.clusters ?? []))
      .catch(() => setStoopResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (isPeople) runPeopleSearch(query, peopleIndustry, peopleRegion);
      else if (isStoop) runStoopSearch(query, stoopCity);
      else runSearch(query, contentType, category, city, price, format, discoverType, discoverRegion);
    }, 300);
    return () => clearTimeout(t);
  }, [query, contentType, category, city, price, format, discoverType, discoverRegion, isPeople, peopleIndustry, peopleRegion, isStoop, stoopCity, runSearch, runPeopleSearch, runStoopSearch]);

  // Directory-only — Type/Region/Sort remote-control the /discover page's
  // own grid via discoverFiltersBus (see the file for why: SearchModal is a
  // single global instance, unrelated to whatever page opened it). Type
  // moved off the on-page underline tabs and into here (July 2026).
  function selectDiscoverType(slug: string) {
    const next = discoverType === slug ? null : slug;
    setDiscoverType(next);
    emitDiscoverFilters({ type: next, region: discoverRegion, sort: discoverSort });
  }
  function selectDiscoverRegion(slug: string) {
    const next = discoverRegion === slug ? null : slug;
    setDiscoverRegion(next);
    emitDiscoverFilters({ type: discoverType, region: next, sort: discoverSort });
  }
  function selectDiscoverSort(value: DiscoverFilters["sort"]) {
    setDiscoverSort(value);
    emitDiscoverFilters({ type: discoverType, region: discoverRegion, sort: value });
  }

  // People-only — same immediate-apply pattern as Discover's Region/Sort:
  // clicking a chip remote-controls the /connect/people page's own
  // rails/grid via peopleFiltersBus, completely independent of whatever
  // (if anything) is typed in the search box above.
  function selectPeopleIndustry(value: string | null) {
    const next = peopleIndustry === value ? null : value;
    setPeopleIndustry(next);
    emitPeopleFilters({ industry: next, region: peopleRegion });
  }
  function selectPeopleRegion(value: string | null) {
    setPeopleRegion(value);
    emitPeopleFilters({ industry: peopleIndustry, region: value });
  }

  // Stoop-only — same immediate-apply pattern as People's Region: clicking a
  // city chip remote-controls the /connect/stoop page's own rails/grid via
  // stoopFiltersBus, completely independent of whatever (if anything) is
  // typed in the search box above.
  function selectStoopCity(value: string) {
    const next = stoopCity === value ? null : value;
    setStoopCity(next);
    emitStoopFilters({ city: next });
  }

  // Reset to a clean slate each time the modal opens — defaulting Content
  // Type to Event/Directory/Person when opened while on /events, /discover,
  // or /connect/people, since that's almost always what you want to search
  // for from there (rail search bar, ⌘K, or the page's own search bar all
  // funnel through this same reset).
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setMemberResults([]);
      setStoopResults([]);
      setContentType(
        pathname?.startsWith("/events") ? "event" :
        pathname?.startsWith("/discover") ? "directory" :
        pathname?.startsWith("/connect/people") ? "member" :
        (pathname?.startsWith("/connect/stoop") || pathname?.startsWith("/cluster")) ? "stoop" :
        "all"
      );
      setCategory("All");
      setCity("All");
      setPrice("All");
      setFormat("All");
      setDiscoverType(null);
      setDiscoverRegion(null);
      setDiscoverSort("relevant");
      setPeopleIndustry(null);
      setPeopleRegion(null);
      setStoopCity(null);
    }
  }, [open, pathname]);

  if (!open) return null;

  return (
    <div
      className="sm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sm-modal" role="dialog" aria-modal="true" aria-label="Search Moveee">
        <div className="sm-input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            ref={inputRef}
            type="text"
            className="sm-input"
            placeholder="Search Moveee…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="sm-close" onClick={onClose} aria-label="Close search">✕</button>
        </div>

        <div className="sm-body">
          <div className="sm-filter-group">
            <p className="sm-filter-label">Content Type</p>
            <div className="sm-filter-chips">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`sm-chip${contentType === t.value ? " active" : ""}${t.value === "event" && contentType === "event" ? " locked" : ""}`}
                  onClick={() => setContentType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isEvent && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">City <span className="sm-new-badge">New</span></p>
              <div className="sm-filter-chips">
                {EVENT_CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`sm-chip${city === c ? " active" : ""}`}
                    onClick={() => setCity(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isEvent && (
            <div className="sm-filter-row">
              <div className="sm-filter-group">
                <p className="sm-filter-label">Price <span className="sm-new-badge">New</span></p>
                <div className="sm-filter-chips sm-filter-chips--nowrap">
                  {EVENT_PRICES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`sm-chip${price === p ? " active" : ""}`}
                      onClick={() => setPrice(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm-filter-group">
                <p className="sm-filter-label">Format <span className="sm-new-badge">New</span></p>
                <div className="sm-filter-chips sm-filter-chips--nowrap">
                  {EVENT_FORMATS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`sm-chip${format === f ? " active" : ""}`}
                      onClick={() => setFormat(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isDirectory && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">Type</p>
              <div className="sm-filter-chips">
                <button
                  type="button"
                  className={`sm-chip${!discoverType ? " active" : ""}`}
                  onClick={() => {
                    setDiscoverType(null);
                    emitDiscoverFilters({ type: null, region: discoverRegion, sort: discoverSort });
                  }}
                >
                  ✦ All
                </button>
                {DISCOVER_TYPES.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    className={`sm-chip${discoverType === t.slug ? " active" : ""}`}
                    onClick={() => selectDiscoverType(t.slug)}
                  >
                    <span className="sm-chip-dot" style={{ background: t.color }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isDirectory && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">Region</p>
              <div className="sm-filter-chips">
                {DISCOVER_REGIONS.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    className={`sm-chip${discoverRegion === r.slug ? " active" : ""}`}
                    onClick={() => selectDiscoverRegion(r.slug)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isDirectory && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">Sort</p>
              <div className="sm-filter-chips">
                {DISCOVER_SORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`sm-chip${discoverSort === s.value ? " active" : ""}`}
                    onClick={() => selectDiscoverSort(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPeople && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">Industry</p>
              <div className="sm-filter-chips">
                <button
                  type="button"
                  className={`sm-chip${!peopleIndustry ? " active" : ""}`}
                  onClick={() => selectPeopleIndustry(null)}
                >
                  ✦ All
                </button>
                {PEOPLE_INDUSTRIES.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    className={`sm-chip${peopleIndustry === i.value ? " active" : ""}`}
                    onClick={() => selectPeopleIndustry(i.value)}
                  >
                    <span className="sm-chip-dot" style={{ background: i.color }} />
                    {i.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPeople && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">Location</p>
              <div className="sm-filter-chips">
                <button
                  type="button"
                  className={`sm-chip${!peopleRegion ? " active" : ""}`}
                  onClick={() => selectPeopleRegion(null)}
                >
                  📍 Near Me
                </button>
                {PEOPLE_REGIONS.map((r) => (
                  <button
                    key={r.slug}
                    type="button"
                    className={`sm-chip${peopleRegion === r.slug ? " active" : ""}`}
                    onClick={() => selectPeopleRegion(r.slug)}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`sm-chip${peopleRegion === "all" ? " active" : ""}`}
                  onClick={() => selectPeopleRegion("all")}
                >
                  All Locations
                </button>
              </div>
            </div>
          )}

          {isStoop && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">City</p>
              <div className="sm-filter-chips">
                <button
                  type="button"
                  className={`sm-chip${!stoopCity ? " active" : ""}`}
                  onClick={() => { setStoopCity(null); emitStoopFilters({ city: null }); }}
                >
                  📍 Near Me
                </button>
                {STOOP_CITIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`sm-chip${stoopCity === c.value ? " active" : ""}`}
                    onClick={() => selectStoopCity(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hidden in Directory/People/Stoop context — this chip row only
              ever folds into the modal's own text search (needs a typed
              query to run at all), and each of those contexts already has
              its own structural filter covering the same role (Directory's
              on-page Type tabs; People's Industry group; Stoop's City group
              above). Showing it here would be a dead control: clicking a
              chip with no query typed does nothing, which is exactly the
              confusion this whole change is meant to fix. */}
          {!isDirectory && !isPeople && !isStoop && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">Category</p>
              <div className="sm-filter-chips">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`sm-chip${category === c ? " active" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sm-results">
            {isPeople ? (
              !query.trim() ? (
                <p className="sm-hint">Start typing to search members by name or role. Industry and Location above filter the People Near Me page directly — no typing needed for those.</p>
              ) : loading ? (
                <p className="sm-hint">Searching…</p>
              ) : memberResults.length === 0 ? (
                <p className="sm-hint">No members found for “{query}.”</p>
              ) : (
                memberResults.map((m) => (
                  <Link key={m.id} href={`/connect/${m.username}`} className="sm-result-row" onClick={onClose}>
                    <div className="sm-result-avatar" style={{ background: m.tier === "patron" ? "var(--gold, #b38238)" : "var(--ink, #14110d)" }}>
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="sm-result-title">{m.displayName}</p>
                      <p className="sm-result-meta">{(m.occupation || "MEMBER").toUpperCase()}</p>
                    </div>
                  </Link>
                ))
              )
            ) : isStoop ? (
              !query.trim() ? (
                <p className="sm-hint">Start typing to search Stoops by name. City above filters the Stoop page directly — no typing needed for that.</p>
              ) : loading ? (
                <p className="sm-hint">Searching…</p>
              ) : stoopResults.length === 0 ? (
                <p className="sm-hint">No Stoops found for “{query}.”</p>
              ) : (
                stoopResults.map((s) => (
                  <Link key={s.id} href={`/cluster/${s.id}`} className="sm-result-row" onClick={onClose}>
                    <div className="sm-result-icon">🚪</div>
                    <div>
                      <p className="sm-result-title">{s.name}</p>
                      <p className="sm-result-meta">
                        {[s.street, s.city].filter(Boolean).join(", ").toUpperCase() || "STOOP"}
                        {s.meetingDay && s.meetingTime ? ` · ${s.meetingDay.toUpperCase()}S ${s.meetingTime}` : ""}
                      </p>
                    </div>
                  </Link>
                ))
              )
            ) : !query.trim() ? (
              <p className="sm-hint">Start typing to search posts, articles, events, directory entries, and quotes.</p>
            ) : loading ? (
              <p className="sm-hint">Searching…</p>
            ) : results.length === 0 ? (
              <p className="sm-hint">No results for “{query}.”</p>
            ) : (
              results.map((r) => {
                const meta = SUBTYPE_META[r.subtype] ?? { emoji: "✦", label: r.subtype };
                return (
                  <Link key={`${r.subtype}-${r.id}`} href={r.href} className="sm-result-row" onClick={onClose}>
                    <div className="sm-result-icon">{meta.emoji}</div>
                    <div>
                      <p className="sm-result-title">{r.title}</p>
                      <p className="sm-result-meta">{meta.label.toUpperCase()}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
