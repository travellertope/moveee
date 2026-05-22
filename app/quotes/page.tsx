import { Metadata } from 'next';
import SubmitQuoteTrigger from '@/components/SubmitQuoteTrigger';
import QuotesInfiniteGrid from '@/components/QuotesInfiniteGrid';
import '@/app/quotes.css';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'Quotes | The Moveee' },
  description: 'Words that define the culture. A growing archive of quotes from African and diaspora thinkers, artists, writers, and leaders — submitted and verified by the community.',
};

const WP_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://cms.themoveee.com/graphql';

const INITIAL_QUERY = `
  query GetQuotesPaged($first: Int) {
    cultureQuotes(first: $first, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        content
        date
        quoteSource
        quoteLikes
        quoteAuthors {
          nodes { name slug }
        }
      }
    }
  }
`;

const INITIAL_QUERY_BASIC = `
  query GetQuotesPagedBasic($first: Int) {
    cultureQuotes(first: $first, where: { status: PUBLISH }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        databaseId
        title
        slug
        content
        date
        quoteAuthors {
          nodes { name slug }
        }
      }
    }
  }
`;

async function fetchInitialQuotes() {
  const vars = { first: 20 };
  for (const query of [INITIAL_QUERY, INITIAL_QUERY_BASIC]) {
    try {
      const res = await fetch(WP_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: vars }),
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const json = await res.json();
      const result = json.data?.cultureQuotes;
      if (result) {
        return {
          quotes: result.nodes ?? [],
          endCursor: result.pageInfo?.endCursor ?? null,
          hasNextPage: result.pageInfo?.hasNextPage ?? false,
        };
      }
    } catch {
      // try next query
    }
  }
  return { quotes: [], endCursor: null, hasNextPage: false };
}

export default async function QuoteHub() {
  const { quotes, endCursor, hasNextPage } = await fetchInitialQuotes();

  return (
    <div className="quote-hub">
      <header className="quote-header">
        <h1>Moveee <em>Quotes</em></h1>
        <p>
          A collective archive of words that move us. From African literature to global cinema, captured by the community.
        </p>

        <div className="search-wrap max-w-xl mx-auto">
          <input
            type="search"
            placeholder="Search quotes, authors or sources..."
            className="w-full px-6 py-4 border-b border-rule bg-transparent font-light focus:outline-none focus:border-gold transition-colors text-white"
          />
        </div>
      </header>

      <main className="quote-body-wrap">
        <QuotesInfiniteGrid
          initialQuotes={quotes}
          initialEndCursor={endCursor}
          initialHasNextPage={hasNextPage}
        />
      </main>

      <SubmitQuoteTrigger />
    </div>
  );
}
