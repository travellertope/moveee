import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWPData, GET_QUOTE_BY_SLUG } from '@/lib/wp';
import QuoteCard from '@/components/QuoteCard';
import '@/app/quote.css';

interface QuotePageProps {
  params: {
    slug: string; // Combined as [id]-[real-slug]
  };
}

export async function generateMetadata({ params }: QuotePageProps): Promise<Metadata> {
  const parts = params.slug.split('-');
  const id = parts[0];
  const slug = parts.slice(1).join('-');
  
  const data = await getWPData(GET_QUOTE_BY_SLUG, { slug: id });
  const quote = data?.cultureQuote;

  if (!quote) return { title: 'Quote Not Found' };

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';
  
  return {
    title: `Quote by ${author} — The Moveee`,
    description: quote.title, // Post title is the excerpt
    openGraph: {
      type: 'article',
      title: `Quote by ${author}`,
      description: quote.title,
    }
  };
}

export default async function IndividualQuotePage({ params }: QuotePageProps) {
  const parts = params.slug.split('-');
  const id = parts[0];
  
  const data = await getWPData(GET_QUOTE_BY_SLUG, { slug: id });
  const quote = data?.cultureQuote;

  if (!quote) notFound();

  const author = quote.quoteAuthors?.nodes[0]?.name || 'Unknown Author';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    'text': quote.content.replace(/<[^>]*>/g, ''),
    'author': {
      '@type': 'Person',
      'name': author
    },
    'citation': quote.quoteSource || ''
  };

  return (
    <div className="quote-hub pt-32 md:pt-48 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto">
        <Link href="/quote" className="text-xs uppercase tracking-widest text-ink-soft mb-12 inline-block hover:text-ink">
          ← Back to Archive
        </Link>
        
        <QuoteCard quote={quote} />
        
        <div className="mt-24 border-t border-rule pt-12">
          <h4 className="num mb-8">MORE FROM THE ARCHIVE</h4>
          {/* We could fetch related quotes here later */}
          <Link href="/quote" className="btn-ghost">View All Quotes</Link>
        </div>
      </div>
    </div>
  );
}
