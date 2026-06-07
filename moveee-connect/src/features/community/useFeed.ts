import { useState, useCallback, useEffect } from "react";
import { api, CULTURE_API } from "../../api/client";
import { cache, TTL } from "../../store/storage";
import type { CommunityPost } from "../../types";

const CACHE_KEY = "community_feed";
const PAGE_SIZE = 20;

export function useFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    return cache.get<CommunityPost[]>(CACHE_KEY) ?? [];
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
      const data = await api.get<CommunityPost[]>(
        `${CULTURE_API}/community/posts?page=${pageNum}&per_page=${PAGE_SIZE}`
      );
      setPosts((prev) => {
        const next = replace ? data : [...prev, ...data];
        if (replace) cache.set(CACHE_KEY, next, TTL.SHORT);
        return next;
      });
      setHasMore(data.length === PAGE_SIZE);
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

  const likePost = useCallback(async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );
    try {
      await api.post(`${CULTURE_API}/community/react`, { post_id: postId, type: "like" });
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
            : p
        )
      );
    }
  }, []);

  const submitPost = useCallback(async (content: string, imageUri?: string, tag?: string) => {
    const body: Record<string, unknown> = { content };
    if (imageUri) body.image_url = imageUri;
    if (tag) body.tag = tag;
    const newPost = await api.post<CommunityPost>(`${CULTURE_API}/community/submit`, body);
    setPosts((prev) => [newPost, ...prev]);
    cache.invalidate(CACHE_KEY);
    return newPost;
  }, []);

  return { posts, refreshing, loading, hasMore, error, refresh, loadMore, likePost, submitPost };
}
