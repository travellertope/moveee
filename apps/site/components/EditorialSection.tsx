'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sanitizeHtml } from "@/lib/sanitize";

interface Story {
  id: string;
  slug: string;
  title: string;
  date: string;
  categories?: { nodes: { name: string }[] };
  featuredImage?: { node: { sourceUrl: string; altText?: string } };
}

export default function EditorialSection({ stories }: { stories: Story[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!stories.length) return null;

  return (
    <section className="editorial">
      <div className="editorial-inner">
        <div className="ed-left">
          <h3>The <em>Edit</em></h3>
          <p>Curated perspectives on the most important cultural moments happening right now.</p>
          <div className="ed-grid">
            {stories.map((story, i) => (
              <Link
                key={story.id}
                href={`/magazine/${story.slug}`}
                className={`ed-item${activeIdx === i ? ' ed-item--active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <div className="ek">{story.categories?.nodes?.[0]?.name || 'Opinion'}</div>
                <h4 dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }} />
                <div className="em">
                  {new Date(story.date).toLocaleDateString('en-GB')}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="ed-visual">
          {stories.map((story, i) => (
            story.featuredImage?.node?.sourceUrl ? (
              <Image
                key={story.id}
                src={story.featuredImage.node.sourceUrl}
                alt={story.featuredImage.node.altText || story.title}
                fill
                style={{
                  objectFit: 'cover',
                  opacity: activeIdx === i ? 1 : 0,
                  transition: 'opacity 0.45s ease',
                }}
              />
            ) : null
          ))}
          {/* Fallback tint shown when no story has an image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--ochre-deep)',
              zIndex: -1,
            }}
          />
        </div>
      </div>
    </section>
  );
}
