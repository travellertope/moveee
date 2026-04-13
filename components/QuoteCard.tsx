'use client';

import { useState } from 'react';
import { Heart, Flag, Share2, Quote as QuoteIcon } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface QuoteCardProps {
  quote: {
    id: string;
    databaseId: number;
    title: string;
    slug: string;
    content: string;
    quoteAuthors?: {
      nodes: Array<{ name: string; slug: string }>;
    };
    quoteSource: string;
    quoteLikes: number | string;
    quoteReports: number | string;
  };
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  const [likes, setLikes] = useState(Number(quote.quoteLikes) || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';
  const authorSlug = quote.quoteAuthors?.nodes[0]?.slug;

  const handleLike = async () => {
    if (isLiked || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/quote/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.databaseId }),
      });
      const data = await res.json();
      if (data.success) {
        setLikes(data.likes);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Failed to like quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (isReported || isSubmitting) return;
    if (!confirm('Are you sure you want to report this quote?')) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/quote/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.databaseId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsReported(true);
        alert('Thank you. Our community review team will look into this.');
      }
    } catch (err) {
      console.error('Failed to report quote:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="quote-card">
      <Link href={`/quote/${quote.id}-${quote.slug}`} className="quote-content-link" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="quote-content" dangerouslySetInnerHTML={{ __html: quote.content }} />
      </Link>

      <div className="quote-footer">
        <div className="quote-author-info">
          <cite>
            {authorSlug ? (
              <Link href={`/quote/author/${authorSlug}`} className="hover:underline">
                — {author}
              </Link>
            ) : (
              `— ${author}`
            )}
          </cite>
          {quote.quoteSource && <span className="source">{quote.quoteSource}</span>}
        </div>

        <div className="quote-actions">
          <button 
            className={clsx('quote-action-btn', isLiked && 'text-gold')} 
            onClick={handleLike}
            disabled={isLiked || isSubmitting}
          >
            <Heart className={clsx(isLiked && 'fill-gold stroke-gold')} />
            <span>{likes}</span>
          </button>
          
          <button 
            className={clsx('quote-action-btn', isReported && 'opacity-50')}
            onClick={handleReport}
            disabled={isReported || isSubmitting}
            title="Report this quote"
          >
            <Flag className={clsx(isReported && 'fill-current')} />
          </button>

          <button className="quote-action-btn" title="Share quote">
            <Share2 />
          </button>
        </div>
      </div>
    </article>
  );
}
