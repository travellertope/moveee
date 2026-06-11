"use client";

import { useState, useEffect } from 'react';
import { Heart, Flag, Share2, Bookmark } from 'lucide-react';
import { useSession } from 'next-auth/react';
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
    quoteSource?: string;
    quoteLikes?: number | string;
    quoteReports?: number | string;
  };
  /** Pre-populate liked/bookmarked state (e.g. on the collection page). */
  initialLiked?: boolean;
  initialBookmarked?: boolean;
}

export default function QuoteCard({ quote, initialLiked = false, initialBookmarked = false }: QuoteCardProps) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(Number(quote.quoteLikes) || 0);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isReported, setIsReported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';
  const authorSlug = quote.quoteAuthors?.nodes[0]?.slug;

  // Sync state with backend on mount
  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/interactions")
        .then(res => res.json())
        .then(data => {
          if (data.liked_quotes?.includes(quote.databaseId)) setIsLiked(true);
          if (data.bookmarked_quotes?.includes(quote.databaseId)) setIsBookmarked(true);
        })
        .catch(() => {});
    }
  }, [quote.databaseId, session]);

  const handleAction = async (type: 'like' | 'bookmark') => {
    if (!session) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    // Optimistic update
    if (type === 'like') {
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
    } else {
      setIsBookmarked(!isBookmarked);
    }

    try {
      const res = await fetch("/api/user/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: quote.databaseId, type, kind: 'quote' }),
      });

      if (!res.ok) {
        // Revert optimistic update
        if (type === 'like') {
          setIsLiked(isLiked);
          setLikes(prev => isLiked ? prev + 1 : prev - 1);
        } else {
          setIsBookmarked(isBookmarked);
        }
      } else if (type === 'like') {
        // Use the authoritative count from the server
        const data = await res.json();
        if (typeof data.count === 'number') setLikes(data.count);
      }
    } catch {
      if (type === 'like') {
        setIsLiked(isLiked);
        setLikes(prev => isLiked ? prev + 1 : prev - 1);
      } else {
        setIsBookmarked(isBookmarked);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (isReported || isSubmitting) return;
    if (!confirm('Are you sure you want to report this quote?')) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/quotes/report', {
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

  const handleShare = async () => {
    const url = `${window.location.origin}/quotes/${quote.databaseId}-${quote.slug}`;
    const title = `Quote via The Moveee`;
    const text = quote.content.replace(/<[^>]*>/g, '');

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <article className="quote-card">
      <Link href={`/quotes/${quote.databaseId}-${quote.slug}`} className="quote-content-link" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="quote-content" dangerouslySetInnerHTML={{ __html: quote.content }} />
      </Link>

      <div className="quote-footer">
        <div className="quote-author-info">
          <cite>
            {authorSlug ? (
              <Link href={`/quotes/author/${authorSlug}`} className="hover:underline">
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
            className={clsx('quote-action-btn', isLiked && 'active')}
            onClick={() => handleAction('like')}
            disabled={isSubmitting}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart className={clsx(isLiked && 'fill-gold stroke-gold')} size={18} />
            <span>{likes}</span>
          </button>

          <button
            className={clsx('quote-action-btn', isBookmarked && 'active')}
            onClick={() => handleAction('bookmark')}
            disabled={isSubmitting}
            title={isBookmarked ? "Remove bookmark" : "Save to collection"}
          >
            <Bookmark className={clsx(isBookmarked && 'fill-gold stroke-gold')} size={18} />
          </button>

          <button
            className={clsx('quote-action-btn', isReported && 'opacity-50')}
            onClick={handleReport}
            disabled={isReported || isSubmitting}
            title="Report this quote"
          >
            <Flag className={clsx(isReported && 'fill-current')} size={18} />
          </button>

          <button
            className={clsx('quote-action-btn', copied && 'active')}
            onClick={handleShare}
            title={copied ? "Link copied!" : "Share quote"}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
