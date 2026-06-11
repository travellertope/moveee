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
      setItems((prev) => {
        const next = replace ? data.items : [...prev, ...data.items];
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
