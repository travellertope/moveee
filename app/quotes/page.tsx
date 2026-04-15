import { Metadata } from 'next';
import Link from 'next/link';
import { getWPQuotes } from '@/lib/wp';
import QuoteCard from '@/components/QuoteCard';
import SubmitQuoteTrigger from '@/components/SubmitQuoteTrigger';
import '@/app/quotes.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quotes',
  description: 'A directory of user-submitted quotes relevant to the culture, themes, and vibe of The Moveee community.',
};

export default async function QuoteHub() {
  const data = await getWPQuotes({ first: 50 });
  const quotes = data?.cultureQuotes?.nodes || [];

  return (
    <div className="quote-hub">
      <header className="quote-header">
        <div className="num">N°0X</div>
        <h1>Moveee <em>Quotes</em></h1>
        <p>
          A collective archive of words that move us. From African literature to global cinema, captured by the community.
        </p>
        
        <div className="search-wrap max-w-xl mx-auto mb-12">
          <input 
            type="search" 
            placeholder="Search quotes, authors or sources..." 
            className="w-full px-6 py-4 border-b border-rule bg-transparent font-light focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </header>

      <section className="quote-grid">
        {quotes.length > 0 ? (
          quotes.map((quote: any) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))
        ) : (
          <div className="col-span-full py-32 text-center text-ink-soft italic bg-paper">
            No quotes have been shared yet. Be the first to move the community.
          </div>
        )}
      </section>

      <SubmitQuoteTrigger />
    </div>
  );
}
