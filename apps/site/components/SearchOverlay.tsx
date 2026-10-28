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
  meta?: string | null;
  /** Injected client-side to label each result in the unified list */
  _type?: string;
  _basePath?: string;
  _isProduct?: boolean;
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
  hubs:      SearchResult[];
}

type Tab = 'all' | 'hubs' | 'articles' | 'community' | 'quotes' | 'directory' | 'shop';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TAB_LABELS: Record<Tab, string> = {
  all:       'All',
  hubs:      'Hubs',
  articles:  'Articles',
  community: 'Community',
  quotes:    'Quotes',
  directory: 'Directory',
  shop:      'Shop',
};

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SearchResults | null>(null);
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    setQuery('');
    setResults(null);
    setLoading(false);
    setActiveTab('all');
  }, [isOpen]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setActiveTab('all');
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

  // Build a flat unified list by interleaving results across categories.
  // Order: hubs → magazine → events → pulse → community → origins → quotes → directory → products
  const allFlat: SearchResult[] = results ? [
    ...(results.hubs      ?? []).map(r => ({ ...r, _type: 'Hub',       _basePath: '/hub'       })),
    ...(results.magazine  ?? []).map(r => ({ ...r, _type: 'Article',   _basePath: '/magazine'  })),
    ...(results.events    ?? []).map(r => ({ ...r, _type: 'Event',     _basePath: '/events'    })),
    ...(results.pulse     ?? []).map(r => ({ ...r, _type: 'Pulse',     _basePath: '/pulse'     })),
    ...(results.community ?? []).map(r => ({ ...r, _type: 'Community', _basePath: '/community' })),
    ...(results.origins   ?? []).map(r => ({ ...r, _type: 'Origins',   _basePath: '/journeys'  })),
    ...(results.quotes    ?? []).map(r => ({ ...r, _type: 'Quote',     _basePath: '/quotes'    })),
    ...(results.directory ?? []).map(r => ({ ...r, _type: 'Directory', _basePath: '/directory' })),
    ...(results.products  ?? []).map(r => ({ ...r, _type: 'Shop',      _basePath: '/lifestyle', _isProduct: true })),
  ] : [];

  // Per-tab filtered lists
  const tabItems: SearchResult[] = (() => {
    if (!results) return [];
    switch (activeTab) {
      case 'hubs':      return (results.hubs ?? []).map(r => ({ ...r, _type: 'Hub',       _basePath: '/hub'       }));
      case 'articles':  return [
        ...(results.magazine ?? []).map(r => ({ ...r, _type: 'Article', _basePath: '/magazine' })),
        ...(results.events   ?? []).map(r => ({ ...r, _type: 'Event',   _basePath: '/events'   })),
        ...(results.origins  ?? []).map(r => ({ ...r, _type: 'Origins', _basePath: '/journeys' })),
      ];
      case 'community': return [
        ...(results.pulse     ?? []).map(r => ({ ...r, _type: 'Pulse',     _basePath: '/pulse'     })),
        ...(results.community ?? []).map(r => ({ ...r, _type: 'Community', _basePath: '/community' })),
      ];
      case 'quotes':    return (results.quotes    ?? []).map(r => ({ ...r, _type: 'Quote',     _basePath: '/quotes'    }));
      case 'directory': return (results.directory ?? []).map(r => ({ ...r, _type: 'Directory', _basePath: '/directory' }));
      case 'shop':      return (results.products  ?? []).map(r => ({ ...r, _type: 'Shop',      _basePath: '/lifestyle', _isProduct: true }));
      default:          return allFlat;
    }
  })();

  const displayItems = activeTab === 'all' ? allFlat : tabItems;

  // Which tabs have any results?
  const activeTabs: Tab[] = ['all'];
  if (results) {
    if ((results.hubs ?? []).length > 0) activeTabs.push('hubs');
    const articleCount = (results.magazine?.length ?? 0) + (results.events?.length ?? 0) + (results.origins?.length ?? 0);
    if (articleCount > 0) activeTabs.push('articles');
    const commCount = (results.pulse?.length ?? 0) + (results.community?.length ?? 0);
    if (commCount > 0) activeTabs.push('community');
    if ((results.quotes ?? []).length > 0)    activeTabs.push('quotes');
    if ((results.directory ?? []).length > 0) activeTabs.push('directory');
    if ((results.products ?? []).length > 0)  activeTabs.push('shop');
  }

  const total = allFlat.length;
  const hasResults    = !!results && total > 0;
  const noResults     = !!results && total === 0 && !loading;
  const showingContent = hasResults || noResults;

  return (
    <div className="search-overlay">
      <div className="menu-overlay-bar">
        <button className="toolbar-icon" onClick={onClose} aria-label="Close search">
          <X size={16} strokeWidth={1.5} />
        </button>
        <Link href="/" className="toolbar-logo" onClick={onClose}>
          <img src="/logo-black.png" alt="Moveee" className="toolbar-logo-img" />
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
            Search across hubs, articles, events, community posts, quotes, the culture directory and shop.
          </p>
        )}

        {/* Filter tabs — only shown when results exist */}
        {hasResults && activeTabs.length > 1 && (
          <div className="search-tabs" role="tablist">
            {activeTabs.map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`search-tab${activeTab === tab ? ' search-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        )}

        {hasResults && (
          <div className="search-results search-results--flat">
            {displayItems.slice(0, activeTab === 'all' ? 14 : 10).map(item => (
              <FlatResultItem key={`${item._type}-${item.id}`} item={item} onClose={onClose} />
            ))}
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

/* ─── Flat result item ───────────────────────────────────── */

function FlatResultItem({ item, onClose }: { item: SearchResult; onClose: () => void }) {
  const isProduct = item._isProduct;
  const title  = isProduct ? item.name : item.title;
  const imgSrc = isProduct ? item.image?.sourceUrl : item.featuredImage?.node?.sourceUrl;
  const meta   = isProduct ? item.price : item.meta;
  const href   = `${item._basePath}/${item.slug}`;

  return (
    <Link href={href} className="search-result-item" onClick={onClose}>
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
      <span className="search-result-type">{item._type}</span>
      <ArrowUpRight size={14} strokeWidth={1.5} className="search-result-arrow" />
    </Link>
  );
}
