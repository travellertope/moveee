'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface VisualEntry {
  slug: string;
  title: string;
  featuredImage: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  cultureDirectoryTypes?: {
    nodes: { name: string; slug: string }[];
  };
}

interface Props {
  entries: VisualEntry[];
}

export default function VisualsGrid({ entries }: Props) {
  const [search, setSearch] = useState('');

  const filtered = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-center mb-12">
        <input 
          type="text" 
          placeholder="Search illustrations..." 
          className="bg-zinc-900/50 border border-white/10 rounded-full px-6 py-3 w-full max-w-md text-white focus:outline-none focus:border-zinc-500 transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="visuals-grid">
        {filtered.length > 0 ? (
          filtered.map((entry) => (
            <Link key={entry.slug} href={`/visuals/${entry.slug}`} className="visual-card">
              <div className="visual-card-img">
                <Image
                  src={entry.featuredImage.node.sourceUrl}
                  alt={entry.featuredImage.node.altText || entry.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="visual-card-overlay">
                <span className="visual-card-meta">
                  {entry.cultureDirectoryTypes?.nodes?.[0]?.name || 'Illustration'}
                </span>
                <h3 className="visual-card-title" dangerouslySetInnerHTML={{ __html: entry.title }} />
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
