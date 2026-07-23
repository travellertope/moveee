"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./search-modal.css";

const CONTENT_TYPES = [
  { label: "All",       value: "all"       },
  { label: "Post",      value: "pulse"     },
  { label: "News",      value: "news"      },
  { label: "Editorial", value: "editorial" },
  { label: "Event",     value: "event"     },
  { label: "Directory", value: "directory" },
  { label: "Quote",     value: "quote"     },
];

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEvent = contentType === "event";

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

  const runSearch = useCallback((q: string, type: string, cat: string, evtCity: string, evtPrice: string, evtFormat: string) => {
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
    fetch(`/api/search?${params.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setResults(data?.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query, contentType, category, city, price, format), 300);
    return () => clearTimeout(t);
  }, [query, contentType, category, city, price, format, runSearch]);

  // Reset to a clean slate each time the modal opens — defaulting Content
  // Type to Event when opened while on /events, since that's almost always
  // what you want to search for from there (rail search bar, ⌘K, or the
  // page's own search bar all funnel through this same reset).
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setContentType(pathname?.startsWith("/events") ? "event" : "all");
      setCategory("All");
      setCity("All");
      setPrice("All");
      setFormat("All");
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
                  className={`sm-chip${contentType === t.value ? " active" : ""}`}
                  onClick={() => setContentType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isEvent && (
            <div className="sm-filter-group">
              <p className="sm-filter-label">City</p>
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
                <p className="sm-filter-label">Price</p>
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
                <p className="sm-filter-label">Format</p>
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

          <div className="sm-results">
            {!query.trim() ? (
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
