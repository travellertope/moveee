import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWPQuoteById } from '@/lib/wp';
import { getPostComments } from '@/lib/community-wordpress';
import ReactionBar from '@/components/pulse/ReactionBar';
import QuoteComments from './QuoteComments';

// This is a bare permalink page, not a browsable product — there is no
// archive, author index, or bespoke like/report UI here anymore (see
// CLAUDE.md's "Quotes feed merge" section). It exists solely so a quote's
// `href` (used by mobile/web share+QR codes, search results, and the member
// Collection's saved-quote links) resolves to something real. Nothing in the
// app links here except a quote's own item.href — do not add a "browse all
// quotes" link back to this page.

interface QuotePageProps {
  params: Promise<{ slug: string }>; // Format: [databaseId]-[real-slug]
}

function parseId(segment: string): string {
  return segment.split('-')[0];
}

export async function generateMetadata({ params }: QuotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);
  const data = await getWPQuoteById({ id });
  const quote = data?.cultureQuote;

  if (!quote) {
    return { title: 'Quote Not Found' };
  }

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';

  return {
    title: { absolute: `Quote by ${author} — Moveee` },
    description: quote.title,
    openGraph: {
      type: 'article',
      title: `Quote by ${author}`,
      description: quote.title,
      images: ['/og-fallback.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Quote by ${author}`,
      description: quote.title,
      images: ['/og-fallback.png'],
    },
  };
}

export default async function IndividualQuotePage({ params }: QuotePageProps) {
  const { slug } = await params;
  const id = parseId(slug);
  const data = await getWPQuoteById({ id });
  const quote = data?.cultureQuote;

  if (!quote) notFound();

  const comments = await getPostComments(quote.databaseId);
  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';
  const plainText = quote.content.replace(/<[^>]*>/g, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    text: plainText,
    author: { '@type': 'Person', name: author },
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '8rem 1.5rem 4rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <span style={{ color: 'var(--rule)', fontFamily: 'serif', fontSize: '4rem', lineHeight: 0.8, display: 'block', marginBottom: '0.5rem' }}>
        &quot;
      </span>

      <p style={{
        fontFamily: 'var(--font-fraunces), serif', fontSize: '1.6rem', lineHeight: 1.5,
        fontStyle: 'italic', color: 'var(--ink)', marginBottom: '1.5rem',
      }}>
        {plainText}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule)' }}>
        <span style={{ color: 'var(--ochre)', fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-fraunces), serif' }}>
          — {author}
        </span>
        {quote.quoteSource && (
          <span style={{ color: 'var(--mute)', fontSize: '0.85rem', fontStyle: 'italic' }}>
            {quote.quoteSource}
          </span>
        )}
      </div>

      {quote.quoteSharingReason && (
        <div style={{
          marginTop: '1.5rem', padding: '1rem', background: 'var(--paper-deep)', borderRadius: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.5,
        }}>
          💬 {quote.quoteSharingReason}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--mute)', marginTop: '1.75rem' }}>
        {new Date(quote.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule)' }}>
        <ReactionBar
          noBorder
          itemId={String(quote.databaseId)}
          itemType="quote"
          initialCounts={{ love: 0, fire: 0, clap: 0 }}
          shareUrl={`https://web.themoveee.com/quotes/${quote.databaseId}-${quote.slug}`}
        />
      </div>

      <QuoteComments postId={quote.databaseId} initialComments={comments} />
    </div>
  );
}
