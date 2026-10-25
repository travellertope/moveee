import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getWPQuoteById } from '@/lib/wp';
import { getPostComments } from '@/lib/community-wordpress';
import QuoteComments from './QuoteComments';
import QuoteActions from './QuoteActions';
import '@/app/pulse-layout.css';

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
    title: { absolute: `Quote by ${author} | Moveee` },
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
  const [data, session] = await Promise.all([
    getWPQuoteById({ id }),
    getServerSession(authOptions),
  ]);
  const quote = data?.cultureQuote;

  if (!quote) notFound();

  const resolvedComments = await getPostComments(quote.databaseId);
  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';
  const plainText = quote.content.replace(/<[^>]*>/g, '');
  const loggedIn = !!session;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    text: plainText,
    author: { '@type': 'Person', name: author },
  };

  return (
    <div style={{ background: 'var(--paper)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pulse-layout pulse-layout--feed">

        {/* ── Main content ── */}
        <main className="pulse-timeline">
          <div className="pulse-timeline-inner">

            {/* Back link */}
            <div style={{ padding: '0.85rem 1.25rem 0', display: 'flex', alignItems: 'center' }}>
              <Link href="/feed" style={{
                color: '#7a6f5c', fontSize: '0.75rem', textDecoration: 'none',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              }}>
                ← Feed
              </Link>
            </div>

            {/* Quote card */}
            <article style={{
              background: 'var(--paper)',
              borderTop: '1px solid var(--rule)',
              borderRight: '1px solid var(--rule)',
              borderBottom: '1px solid var(--rule)',
              borderLeft: '4px solid var(--ochre)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 1px 4px rgba(20,17,13,0.06)',
              padding: '1.5rem 1.5rem 1.25rem',
              margin: '0.85rem 1rem 1rem',
            }}>
              {/* Quote block with tinted background */}
              <div style={{
                background: 'rgba(122,36,28,0.05)',
                borderRadius: '10px',
                padding: '1.25rem 1.25rem 1rem',
                marginBottom: '1.25rem',
              }}>
                {/* Decorative quote mark — 24px, ochre */}
                <div style={{
                  color: 'var(--ochre)', fontFamily: 'var(--font-fraunces), Georgia, serif',
                  fontSize: '24px', lineHeight: 1, marginBottom: '8px', userSelect: 'none',
                }}>
                  &ldquo;
                </div>

                <p style={{
                  fontFamily: 'var(--font-fraunces), serif', fontSize: '1.25rem',
                  fontWeight: 500, lineHeight: 1.6,
                  fontStyle: 'italic', color: 'var(--ink)', margin: '0 0 10px',
                }}>
                  &ldquo;{plainText}&rdquo;
                </p>

                {/* Attribution — author bold + source in parens, text-xs */}
                <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>— {author}</span>
                  {quote.quoteSource && (
                    <span style={{ color: 'var(--mute)', fontWeight: 400 }}> ({quote.quoteSource})</span>
                  )}
                </p>
              </div>

              {quote.quoteSharingReason && (
                <div style={{
                  marginTop: '1.5rem', padding: '1rem',
                  background: 'var(--paper-deep)', borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.5,
                }}>
                  💬 {quote.quoteSharingReason}
                </div>
              )}

              <div style={{
                fontFamily: 'monospace', fontSize: '0.72rem',
                color: 'var(--mute)', marginTop: '1.5rem',
              }}>
                {new Date(quote.date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--rule)' }}>
                <QuoteActions
                  quoteId={String(quote.databaseId)}
                  quoteText={plainText}
                  quoteAuthor={author}
                  quoteSource={quote.quoteSource || null}
                  quoteUrl={`https://themoveee.com/quotes/${quote.databaseId}-${quote.slug}`}
                />
              </div>
            </article>

            {/* Comments */}
            <div style={{ padding: '0 1rem 2rem' }}>
              <QuoteComments postId={quote.databaseId} initialComments={resolvedComments} />
            </div>

          </div>
        </main>

        {/* ── Right sidebar ── */}
        <aside className="pulse-sidebar-right">
          <div style={{ padding: '1.25rem 1rem' }}>
            <div style={{
              background: 'var(--paper-deep)', border: '1px solid rgba(20,17,13,0.09)',
              borderRadius: '12px', padding: '0.85rem',
              boxShadow: '0 1px 3px rgba(20,17,13,0.05)',
            }}>
              <p style={{
                color: '#7a6f5c', fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.45rem',
              }}>
                About Moveee
              </p>
              <p style={{ color: '#3a342b', fontSize: '0.78rem', lineHeight: 1.55, margin: '0 0 0.85rem' }}>
                Village square for culture loving creatives, entrepreneurs, professionals.
              </p>
              {loggedIn ? (
                <Link href="/member" style={{
                  display: 'block', background: 'var(--ochre, #7a241c)', color: '#fff',
                  textAlign: 'center', padding: '0.5rem 0.75rem',
                  fontSize: '0.78rem', fontWeight: 600,
                  borderRadius: '8px', textDecoration: 'none',
                }}>
                  Member Dashboard →
                </Link>
              ) : (
                <Link href="/register" style={{
                  display: 'block', background: 'var(--ochre, #7a241c)', color: '#fff',
                  textAlign: 'center', padding: '0.5rem 0.75rem',
                  fontSize: '0.78rem', fontWeight: 600,
                  borderRadius: '8px', textDecoration: 'none',
                }}>
                  Join Moveee →
                </Link>
              )}
            </div>

            <p style={{ margin: '1rem 0 0', fontSize: '0.68rem', color: '#7a6f5c', lineHeight: 1.7 }}>
              © {new Date().getFullYear()} The Moveee. All Rights Reserved.
              <br />
              <Link href="/terms" style={{ color: '#7a6f5c' }}>Terms</Link>
              {' · '}
              <Link href="/privacy" style={{ color: '#7a6f5c' }}>Privacy</Link>
              {' · '}
              <Link href="/contact" style={{ color: '#7a6f5c' }}>Contact</Link>
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
