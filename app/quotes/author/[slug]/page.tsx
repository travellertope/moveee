import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWPData, GET_QUOTES_BY_AUTHOR } from '@/lib/wp';
import QuoteCard from '@/components/QuoteCard';
import '@/app/quotes.css';

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getWPData(GET_QUOTES_BY_AUTHOR, { slug: resolvedParams.slug });
  const author = data?.quoteAuthor;

  if (!author) return { title: 'Author Not Found — The Moveee' };

  return {
    title: `Quotes by ${author.name} — The Moveee`,
    description: author.description || `Browse the collection of quotes by ${author.name} archived on The Moveee.`,
  };
}

export default async function IndividualAuthorPage({ params }: AuthorPageProps) {
  const resolvedParams = await params;
  const data = await getWPData(GET_QUOTES_BY_AUTHOR, { slug: resolvedParams.slug });
  const author = data?.quoteAuthor;

  if (!author) notFound();

  const quotes = author.cultureQuotes?.nodes || [];

  return (
    <div className="quote-hub pt-32 md:pt-48 pb-20">
      <header className="quote-header max-w-4xl mx-auto px-4 mb-20">
        <Link href="/quotes" className="text-xs uppercase tracking-widest text-gold mb-8 inline-block hover:underline">
          ← Back to Archive
        </Link>
        <div className="text-xs uppercase tracking-[0.2em] text-mute mb-4">ARCHIVE BY AUTHOR</div>
        <h1 className="text-5xl md:text-7xl font-light mb-8">
          {author.name.includes(' ') ? (
            <>
              {author.name.split(' ').slice(0, -1).join(' ')} <em>{author.name.split(' ').slice(-1)}</em>
            </>
          ) : (
            author.name
          )}
        </h1>
        {author.description && (
          <p className="text-lg text-ink-soft max-w-2xl mx-auto italic font-serif">
            {author.description}
          </p>
        )}
      </header>

      <section className="quote-grid">
        {quotes.length > 0 ? (
          quotes.map((quote: any) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))
        ) : (
          <div className="col-span-full py-32 text-center text-ink-soft italic bg-paper">
            No quotes from this author have been shared yet.
          </div>
        )}
      </section>
      
      <div className="mt-20 text-center">
        <Link href="/quotes" className="btn-ghost">View All Authors</Link>
      </div>
    </div>
  );
}
