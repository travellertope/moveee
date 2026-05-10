'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface EntryType {
  name: string;
  slug: string;
  count?: number | null;
}

interface DirectoryEntry {
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: { node: { sourceUrl: string; altText: string } };
  cultureDirectoryTypes?: { nodes: { name: string; slug: string }[] };
  cultureInterests?: { nodes: { name: string; slug: string }[] };
}

interface Props {
  entries: DirectoryEntry[];
  types: EntryType[];
  initialType?: string | null;
}

export default function DirectoryGrid({ entries, types, initialType = null }: Props) {
  const [activeType, setActiveType] = useState<string | null>(initialType);

  // Only show types that have at least one published entry
  const usedTypes = useMemo(() => {
    const slugsInUse = new Set(
      entries.flatMap(e => e.cultureDirectoryTypes?.nodes.map(t => t.slug) ?? [])
    );
    return types.filter(t => slugsInUse.has(t.slug));
  }, [entries, types]);

  const filtered = useMemo(() =>
    activeType
      ? entries.filter(e =>
          e.cultureDirectoryTypes?.nodes.some(t => t.slug === activeType)
        )
      : entries,
    [entries, activeType]
  );

  return (
    <>
      {/* ── Filter bar ── */}
      {usedTypes.length > 0 && (
        <div className="dir-filters">
          <button
            className={`dir-filter-btn${!activeType ? ' dir-filter-btn--active' : ''}`}
            onClick={() => setActiveType(null)}
          >
            All
            <span className="dir-filter-count">{entries.length}</span>
          </button>
          {usedTypes.map(type => (
            <button
              key={type.slug}
              className={`dir-filter-btn${activeType === type.slug ? ' dir-filter-btn--active' : ''}`}
              onClick={() => setActiveType(activeType === type.slug ? null : type.slug)}
            >
              {type.name}
              <span className="dir-filter-count">
                {entries.filter(e =>
                  e.cultureDirectoryTypes?.nodes.some(t => t.slug === type.slug)
                ).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="dir-empty">
          <p>No entries found for this type yet.</p>
        </div>
      ) : (
        <div className="dir-grid">
          {filtered.map(entry => {
            const type = entry.cultureDirectoryTypes?.nodes?.[0];
            const img = entry.featuredImage?.node?.sourceUrl;
            const rawExcerpt = (entry.excerpt ?? '').replace(/<[^>]*>/g, '').trim();
            const excerpt = rawExcerpt.length > 120 ? rawExcerpt.slice(0, 120) + '…' : rawExcerpt;

            return (
              <Link key={entry.slug} href={`/directory/${entry.slug}`} className="dir-card">
                <div className={`dir-card-img${img ? '' : ' dir-card-img--placeholder'}`}>
                  {img && (
                    <Image
                      src={img}
                      alt={entry.featuredImage?.node?.altText || entry.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div className="dir-card-body">
                  {type && <span className="dir-card-type">{type.name}</span>}
                  <h3 className="dir-card-title" dangerouslySetInnerHTML={{ __html: entry.title }} />
                  {excerpt && <p className="dir-card-excerpt">{excerpt}</p>}
                  {entry.cultureInterests?.nodes?.length ? (
                    <div className="dir-card-tags">
                      {entry.cultureInterests.nodes.slice(0, 3).map(t => (
                        <span key={t.slug} className="dir-tag">{t.name}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {activeType && filtered.length > 0 && (
        <p className="dir-filter-summary">
          Showing {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} · <button className="dir-filter-clear" onClick={() => setActiveType(null)}>Clear filter</button>
        </p>
      )}
    </>
  );
}
