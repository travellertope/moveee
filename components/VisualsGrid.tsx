'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface Visual {
  id: number;
  entrySlug: string;   // directory entry slug — used for /visuals/[slug] link
  entryTitle: string;  // directory entry title — shown on the card
  entryType: string;   // e.g. "person", "place" — shown as the card meta label
  imageTitle: string;  // descriptive visual title for alt/tooltip
  altText: string;
  sourceUrl: string;
  width: number;
  height: number;
}

interface Props {
  visuals: Visual[];
}

export default function VisualsGrid({ visuals }: Props) {
  const [search, setSearch] = useState('');

  const filtered = visuals.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.entryTitle.toLowerCase().includes(q) ||
      v.imageTitle.toLowerCase().includes(q) ||
      v.altText.toLowerCase().includes(q) ||
      v.entryType.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex justify-center mb-16">
        <input
          type="text"
          placeholder="Search illustrations..."
          className="bg-zinc-900 border border-white/10 rounded-full px-8 py-4 w-full max-w-lg text-white text-lg focus:outline-none focus:border-white/30 transition-all font-light"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="visuals-grid">
        {filtered.length > 0 ? (
          filtered.map((visual) => (
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
                  sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
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
    </>
  );
}
