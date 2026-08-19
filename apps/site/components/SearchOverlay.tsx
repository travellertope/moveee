'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, Loader2, ArrowUpRight } from 'lucide-react';

interface SearchResult {
  id: string;
  title?: string;
  name?: string;
  slug: string;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  image?: { sourceUrl: string };
  categories?: { nodes: { name: string; slug: string }[] };
  countries?: { nodes: { name: string; slug: string }[] };
  price?: string;
  /** Pre-computed subtitle (author for quotes, entry type for directory entries) */
  meta?: string | null;
}

interface SearchResults {
  magazine:  SearchResult[];
  events:    SearchResult[];
  origins:   SearchResult[];
  products:  SearchResult[];
  quotes:    SearchResult[];
  directory: SearchResult[];
  pulse:     SearchResult[];
  community: SearchResult[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on open (mirrors the mockup's own 60ms-delayed focus, needed
  // since the overlay is still animating in); reset on close.
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    setQuery('');
    setResults(null);
    setLoading(false);
  }, [isOpen]);

  // ESC to close
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Debounced search — 300 ms
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data: SearchResults = await res.json();
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const total = results
    ? (results.magazine?.length ?? 0) +
      (results.events?.length ?? 0) +
      (results.origins?.length ?? 0) +
      (results.products?.length ?? 0) +
      (results.quotes?.length ?? 0) +
      (results.directory?.length ?? 0) +
      (results.pulse?.length ?? 0) +
      (results.community?.length ?? 0)
    : 0;

  const hasResults = !!results && total > 0;
  const noResults  = !!results && total === 0 && !loading;
  const showingContent = hasResults || noResults;

  // Shell matches the mockup's #searchOverlay exactly: it reuses the same
  // .menu-overlay-bar (close · centered logo · decorative search glyph) as
  // the main menu overlay, then a centered .search-overlay-body holding a
  // single large serif input with a bottom-border-only underline — no
  // backdrop-click-to-close panel, same as the menu overlay's own
  // close-via-X-or-Escape-only convention in Header.tsx. Live results are
  // additive (the mockup's input is decorative) and only affect the body's
  // layout mode, not the input/top-bar chrome.
  return (
    <div className="search-overlay">
      <div className="menu-overlay-bar">
        <button className="toolbar-icon" onClick={onClose} aria-label="Close search">
          <X size={16} strokeWidth={1.5} />
        </button>
        <Link href="/" className="toolbar-logo" onClick={onClose}>
          moveee<span>.</span>
        </Link>
        <span className="toolbar-icon" aria-hidden="true">
          <Search size={16} strokeWidth={1.5} />
        </span>
      </div>

      <div className={`search-overlay-body${showingContent ? " search-overlay-body--results" : ""}`}>
        <form onSubmit={e => e.preventDefault()} className="search-form">
          <div className="search-input-wrap">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="search-input"
              autoComplete="off"
            />
            {loading && <Loader2 size={18} strokeWidth={1.5} className="search-loader" />}
          </div>
        </form>

        {!showingContent && (
          <p className="search-hint">
            Search across magazine, events, origins, quotes, culture directory and shop.
          </p>
        )}

        {/* ── Results ── */}
        {hasResults && (
          <div className="search-results">
            <ResultSection label="Pulse"             items={results!.pulse}      basePath="/pulse"     onClose={onClose} />
            <ResultSection label="Community"         items={results!.community}  basePath="/community" onClose={onClose} />
            <ResultSection label="Editorials"        items={results!.magazine}   basePath="/magazine"  onClose={onClose} />
            <ResultSection label="Happenings"        items={results!.events}     basePath="/events"    onClose={onClose} />
            <ResultSection label="Origins"           items={results!.origins}    basePath="/journeys"  onClose={onClose} />
            <ResultSection label="Quotes"            items={results!.quotes}     basePath="/quotes"    onClose={onClose} />
            <ResultSection label="Culture Directory" items={results!.directory}  basePath="/directory" onClose={onClose} />
            <ResultSection label="Shop"              items={results!.products}   basePath="/shop"      isProduct onClose={onClose} />
          </div>
        )}

        {noResults && (
          <p className="search-empty">
            No results for <em>"{query}"</em> — try a different term.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Result section ─────────────────────────────────────── */

function ResultSection({
  label,
  items,
  basePath,
  isProduct = false,
  onClose,
}: {
  label: string;
  items: SearchResult[];
  basePath: string;
  isProduct?: boolean;
  onClose: () => void;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="search-section">
      <p className="search-section-label">{label}</p>
      {items.slice(0, 4).map(item => {
        const title  = isProduct ? item.name   : item.title;
        const imgSrc = isProduct ? item.image?.sourceUrl : item.featuredImage?.node?.sourceUrl;
        const cat     = !isProduct ? item.categories?.nodes?.[0]?.name : undefined;
        const country = !isProduct ? item.countries?.nodes?.[0]?.name : undefined;
        const catAndCountry = [cat, country].filter(Boolean).join(' · ') || undefined;
        const meta   = isProduct ? item.price : (item.meta ?? catAndCountry);
        return (
          <Link key={item.id} href={`${basePath}/${item.slug}`} className="search-result-item" onClick={onClose}>
            {imgSrc ? (
              <div className="search-result-thumb">
                <img src={imgSrc} alt={title ?? ''} />
              </div>
            ) : (
              <div className="search-result-thumb search-result-thumb--empty" />
            )}
            <div className="search-result-body">
              <p className="search-result-title">{title}</p>
              {meta && <p className="search-result-meta">{meta}</p>}
            </div>
            <ArrowUpRight size={14} strokeWidth={1.5} className="search-result-arrow" />
          </Link>
        );
      })}
    </div>
  );
}
