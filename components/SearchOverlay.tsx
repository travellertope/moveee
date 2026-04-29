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
  price?: string;
  /** Pre-computed subtitle (author for quotes, entry type for directory entries) */
  meta?: string | null;
}

interface SearchResults {
  magazine: SearchResult[];
  events: SearchResult[];
  origins: SearchResult[];
  products: SearchResult[];
  quotes: SearchResult[];
  directory: SearchResult[];
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

  // Auto-focus on open; reset on close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
      setResults(null);
      setLoading(false);
    }
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
      (results.directory?.length ?? 0)
    : 0;

  const hasResults = !!results && total > 0;
  const noResults  = !!results && total === 0 && !loading;

  return (
    /* Backdrop — click outside panel to close */
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={e => e.stopPropagation()}>

        {/* ── Input row ── */}
        <div className="search-input-row">
          <Search size={20} strokeWidth={1.5} className="search-icon-lead" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search magazine, quotes, directory, events…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input"
          />
          {loading && <Loader2 size={18} strokeWidth={1.5} className="search-loader" />}
          <button onClick={onClose} className="search-close-btn" aria-label="Close search">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Results ── */}
        {hasResults && (
          <div className="search-results">
            <ResultSection label="Editorials"          items={results!.magazine}   basePath="/magazine"  onClose={onClose} />
            <ResultSection label="Events"            items={results!.events}     basePath="/events"    onClose={onClose} />
            <ResultSection label="Origins"           items={results!.origins}    basePath="/journeys"   onClose={onClose} />
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

        {!query.trim() && (
          <p className="search-hint">
            Search across magazine, events, origins, quotes, culture directory and shop.
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
        const cat    = !isProduct ? item.categories?.nodes?.[0]?.name : undefined;
        const meta   = isProduct ? item.price : (item.meta ?? cat);
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
