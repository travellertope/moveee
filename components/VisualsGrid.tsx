'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface Visual {
  id: number;
  entrySlug: string;
  entryTitle: string;
  entryType: string;
  imageTitle: string;
  altText: string;
  sourceUrl: string;
  width: number;
  height: number;
}

interface Props {
  visuals: Visual[];
}

const PER_PAGE = 12;

export default function VisualsGrid({ visuals }: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = visuals.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.entryTitle.toLowerCase().includes(q) ||
      v.imageTitle.toLowerCase().includes(q) ||
      v.altText.toLowerCase().includes(q) ||
      v.entryType.toLowerCase().includes(q)
    );
  });

  const visible = filtered.slice(0, page * PER_PAGE);
  const hasMore = visible.length < filtered.length;

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <>
      <div className="flex justify-center mb-16">
        <input
          type="text"
          placeholder="Search illustrations..."
          className="bg-zinc-900 border border-white/10 rounded-full px-8 py-4 w-full max-w-lg text-white text-lg focus:outline-none focus:border-white/30 transition-all font-light"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="visuals-grid">
        {visible.length > 0 ? (
          visible.map((visual) => (
            <Link
              key={visual.id}
              href={`/visuals/${visual.entrySlug}`}
              className="visual-card"
            >
              <div className="visual-card-img">
                <Image
                  src={visual.sourceUrl}
                  alt={visual.altText || visual.entryTitle}
                  width={visual.width || 800}
                  height={visual.height || 1000}
                  className="w-full h-auto"
                  sizes="(max-width: 640px) 50vw, (max-width: 1100px) 50vw, 33vw"
                />
              </div>
              <div className="visual-card-overlay">
                <span className="visual-card-meta">
                  {visual.entryType || 'Illustration'}
                </span>
                <h3
                  className="visual-card-title"
                  dangerouslySetInnerHTML={{ __html: visual.entryTitle }}
                />
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-zinc-500 italic">
            No matching illustrations found.
          </div>
        )}
      </div>

      {hasMore && (
        <div className="visuals-pagination">
          <button
            className="visuals-load-more"
            onClick={() => setPage((p) => p + 1)}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
}
