import { useState, useCallback, useEffect } from "react";
import { api, MOBILE_API } from "../../api/client";
import { cache, TTL } from "../../store/storage";
import type { FeedItem } from "../../types";

const CACHE_KEY = "unified_feed";
const PAGE_SIZE = 20;

interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
}

// Decode common HTML entities that WordPress includes in API text fields.
function decodeHtml(str: string | undefined | null): string {
  if (!str) return str as string;
  return str
    .replace(/&#8217;/g, "’")  // right single quote / apostrophe
    .replace(/&#8216;/g, "‘")  // left single quote
    .replace(/&#8220;/g, "“")  // left double quote
    .replace(/&#8221;/g, "”")  // right double quote
    .replace(/&#8211;/g, "–")  // en dash
    .replace(/&#8212;/g, "—")  // em dash
    .replace(/&#8230;/g, "…")  // ellipsis
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g,  "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function decodeItem(item: FeedItem): FeedItem {
  return {
    ...item,
    title:         decodeHtml(item.title),
    excerpt:       decodeHtml(item.excerpt),
    body:          decodeHtml(item.body),
    source:        decodeHtml(item.source),
    ogTitle:       decodeHtml(item.ogTitle),
    ogDescription: decodeHtml(item.ogDescription),
  };
}

export function useUnifiedFeed() {
  const [items, setItems] = useState<FeedItem[]>(() => {
    return cache.get<FeedItem[]>(CACHE_KEY) ?? [];
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (pageNum: number, replace = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<FeedResponse>(
        `${MOBILE_API}/feed?page=${pageNum}&per_page=${PAGE_SIZE}`
      );
      const decoded = data.items.map(decodeItem);
      setItems((prev) => {
        const next = replace ? decoded : [...prev, ...decoded];
        if (replace) cache.set(CACHE_KEY, next, TTL.SHORT);
        return next;
      });
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, true);
    setRefreshing(false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(page + 1);
  }, [loading, hasMore, page, fetchPage]);

  const react = useCallback(async (item: FeedItem, type: "love" | "fire" | "clap") => {
    if (!item.wpId) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== item.id || !i.reactions) return i;
        return { ...i, reactions: { ...i.reactions, [type]: i.reactions[type] + 1 } };
      })
    );
    try {
      await api.post(`${MOBILE_API}/community/react`, { post_id: Number(item.wpId), type });
    } catch {
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== item.id || !i.reactions) return i;
          return { ...i, reactions: { ...i.reactions, [type]: Math.max(0, i.reactions[type] - 1) } };
        })
      );
    }
  }, []);

  return { items, refreshing, loading, hasMore, error, refresh, loadMore, react };
}
