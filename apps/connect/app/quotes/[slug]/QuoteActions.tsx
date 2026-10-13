"use client";

import ReactionBar from "@/components/pulse/ReactionBar";
import { useQuoteShare } from "@/context/QuoteShareContext";

interface Props {
  quoteId: string;
  quoteText: string;
  quoteAuthor: string;
  quoteSource: string | null;
  quoteUrl: string;
}

export default function QuoteActions({ quoteId, quoteText, quoteAuthor, quoteSource, quoteUrl }: Props) {
  const { shareQuote } = useQuoteShare();
  return (
    <ReactionBar
      noBorder
      itemId={quoteId}
      itemType="quote"
      initialCounts={{ love: 0, fire: 0, clap: 0 }}
      shareUrl={quoteUrl}
      onShare={() => shareQuote(quoteText, quoteAuthor, quoteSource, quoteUrl)}
    />
  );
}
