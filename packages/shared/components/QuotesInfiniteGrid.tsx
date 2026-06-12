"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QuoteCard from "./QuoteCard";

interface Quote {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  date: string;
  quoteSource?: string;
  quoteLikes?: number | string;
  quoteAuthors?: {
    nodes: Array<{ name: string; slug: string }>;
  };
}

interface QuotesInfiniteGridProps {
  initialQuotes: Quote[];
  initialEndCursor: string | null;
  initialHasNextPage: boolean;
}

export default function QuotesInfiniteGrid({
  initialQuotes,
  initialEndCursor,
  initialHasNextPage,
}: QuotesInfiniteGridProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [endCursor, setEndCursor] = useState<string | null>(initialEndCursor);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasNextPage) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "20" });
      if (endCursor) params.set("after", endCursor);
      const res = await fetch(`/api/quotes/list?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setQuotes((prev) => [...prev, ...(data.quotes ?? [])]);
      setEndCursor(data.endCursor ?? null);
      setHasNextPage(data.hasNextPage ?? false);
    } catch {
      // Keep current state on failure.
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage, endCursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <section className="quote-grid">
        {quotes.length > 0 ? (
          quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))
        ) : (
          <div className="col-span-full py-32 text-center text-ink-soft italic bg-paper">
            No quotes have been shared yet. Be the first to move the community.
          </div>
        )}
      </section>

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} style={{ height: "1px" }} />

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888", fontSize: "0.85rem" }}>
          Loading more quotes…
        </div>
      )}

      {!hasNextPage && quotes.length > 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#aaa", fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          All quotes loaded
        </div>
      )}
    </>
  );
}
