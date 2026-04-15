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
      mediaDetails?: {
        width: number;
        height: number;
      };
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
          filtered.map((entry) => {
            const node = entry.featuredImage.node;
            // Use provided dimensions or fallback
            const width = node.mediaDetails?.width || 800;
            const height = node.mediaDetails?.height || 1000;
            
            return (
              <Link key={entry.slug} href={`/visuals/${entry.slug}`} className="visual-card">
                <div className="visual-card-img">
                  <Image
                    src={node.sourceUrl}
                    alt={node.altText || entry.title}
                    width={width}
                    height={height}
                    className="w-full h-auto"
                    sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  />
                </div>
                <div className="visual-card-overlay">
                  <span className="visual-card-meta">
                    {entry.cultureDirectoryTypes?.nodes?.[0]?.name || 'Illustration'}
                  </span>
                  <h3 className="visual-card-title" dangerouslySetInnerHTML={{ __html: entry.title }} />
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center text-zinc-500 italic">
            No matching illustrations found.
          </div>
        )}
      </div>
    </>
  );
}
