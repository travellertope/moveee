"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState("all");
  const [category, setCategory] = useState("All");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const runSearch = useCallback((q: string, type: string, cat: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ q: q.trim(), type });
    if (cat !== "All") params.set("category", cat);
    fetch(`/api/search?${params.toString()}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setResults(data?.results ?? []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query, contentType, category), 300);
    return () => clearTimeout(t);
  }, [query, contentType, category, runSearch]);

  // Reset to a clean slate each time the modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setContentType("all");
      setCategory("All");
    }
  }, [open]);

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
