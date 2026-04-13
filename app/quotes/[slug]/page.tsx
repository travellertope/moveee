import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWPData, GET_QUOTE_BY_ID } from '@/lib/wp';
import QuoteCard from '@/components/QuoteCard';
import '@/app/quotes.css';

interface QuotePageProps {
  params: Promise<{ slug: string }>; // Format: [databaseId]-[real-slug]
}

/** Extract the numeric database ID from the URL segment. */
function parseId(segment: string): string {
  return segment.split('-')[0];
}

export async function generateMetadata({ params }: QuotePageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);
  const data = await getWPData(GET_QUOTE_BY_ID, { id });
  const quote = data?.cultureQuote;

  if (!quote) return { title: 'Quote Not Found' };

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';

  return {
    title: `Quote by ${author} — The Moveee`,
    description: quote.title,
    openGraph: {
      type: 'article',
      title: `Quote by ${author}`,
      description: quote.title,
    },
  };
}

export default async function IndividualQuotePage({ params }: QuotePageProps) {
  const { slug } = await params;
  const id = parseId(slug);
  const data = await getWPData(GET_QUOTE_BY_ID, { id });
  const quote = data?.cultureQuote;

  if (!quote) notFound();

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    'text': quote.content.replace(/<[^>]*>/g, ''),
    'author': {
      '@type': 'Person',
      'name': author,
    },
  };

  return (
    <div className="quote-hub pt-32 md:pt-48 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto">
        <Link
          href="/quotes"
          className="text-xs uppercase tracking-widest text-ink-soft mb-12 inline-block hover:text-ink"
        >
          ← Back to Archive
        </Link>

        <QuoteCard quote={quote} />

        <div className="mt-24 border-t border-rule pt-12">
          <h4 className="num mb-8">MORE FROM THE ARCHIVE</h4>
          <Link href="/quotes" className="btn-ghost">View All Quotes</Link>
        </div>
      </div>
    </div>
  );
}
