"use client";

import { createContext, useContext } from "react";

interface QuoteShareContextType {
  shareQuote: (
    text: string,
    author: string | null | undefined,
    source: string | null | undefined,
    url: string,
  ) => Promise<void>;
}

export const QuoteShareContext = createContext<QuoteShareContextType>({
  shareQuote: async () => {},
});

export function useQuoteShare() {
  return useContext(QuoteShareContext);
}
