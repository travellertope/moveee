import { useState, useCallback, useEffect } from "react";
import { api, WP_URL } from "../../api/client";
import { cache, TTL } from "../../store/storage";
import type { Article } from "../../types";

const WP_POSTS = `${WP_URL}/wp-json/wp/v2/posts`;
const WP_CATEGORIES = `${WP_URL}/wp-json/wp/v2/categories`;

const FEATURED_CACHE_KEY = "magazine_featured";
const SECTIONS_CACHE_KEY = "magazine_sections";
const PAGE_SIZE = 6;

export interface MagazineSection {
  id: number;
  name: string;
  articles: Article[];
}

interface WPEmbedded {
  "wp:featuredmedia"?: Array<{ source_url?: string }>;
  "wp:term"?: Array<Array<{ id: number; name: string; taxonomy: string }>>;
  author?: Array<{ name: string; avatar_urls?: Record<string, string>; slug: string }>;
}

interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: WPEmbedded;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "").trim());
}

function readingTimeFromHtml(html: string): number {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function mapPost(post: WPPost): Article {
  const embedded = post._embedded;
  const media = embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";
  const terms = embedded?.["wp:term"] ?? [];
  const category = terms.flat().find((t) => t.taxonomy === "category")?.name ?? "";
  const author = embedded?.author?.[0];

  return {
    id: String(post.id),
    slug: post.slug,
    title: decodeEntities(post.title.rendered),
    excerpt: stripTags(post.excerpt.rendered),
    content: post.content.rendered,
    featuredImage: media,
    author: {
      name: author?.name ?? "Moveee",
      avatarUrl: author?.avatar_urls?.["96"] ?? "",
      slug: author?.slug ?? "",
    },
    category,
    publishedAt: post.date,
    readingTime: readingTimeFromHtml(post.content.rendered),
    liked: false,
    bookmarked: false,
    likeCount: 0,
  };
}

async function fetchPosts(params: string): Promise<Article[]> {
  const data = await api.get<WPPost[]>(`${WP_POSTS}?_embed=wp:featuredmedia,wp:term,author&${params}`, false);
  return data.map(mapPost);
}

export function useMagazine() {
  const [featured, setFeatured] = useState<Article | null>(() => cache.get<Article>(FEATURED_CACHE_KEY));
  const [sections, setSections] = useState<MagazineSection[]>(() => cache.get<MagazineSection[]>(SECTIONS_CACHE_KEY) ?? []);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const [latest, categories] = await Promise.all([
        fetchPosts(`per_page=7&orderby=date`),
        api.get<Array<{ id: number; name: string; count: number }>>(`${WP_CATEGORIES}?per_page=6&orderby=count&order=desc&hide_empty=true`, false),
      ]);

      const hero = latest[0] ?? null;
      if (hero) {
        setFeatured(hero);
        cache.set(FEATURED_CACHE_KEY, hero, TTL.MEDIUM);
      }

      const sectionResults = await Promise.all(
        categories.map(async (cat) => {
          const articles = await fetchPosts(`per_page=${PAGE_SIZE}&categories=${cat.id}&orderby=date`);
          return { id: cat.id, name: cat.name, articles };
        })
      );
      const populated = sectionResults.filter((s) => s.articles.length > 0);
      setSections(populated);
      cache.set(SECTIONS_CACHE_KEY, populated, TTL.MEDIUM);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load magazine");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { featured, sections, loading, refreshing, error, refresh };
}

export function useArticle(slug: string) {
  const cacheKey = `magazine_article_${slug}`;
  const [article, setArticle] = useState<Article | null>(() => cache.get<Article>(cacheKey));
  const [loading, setLoading] = useState(!article);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<WPPost[]>(`${WP_POSTS}?slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia,wp:term,author`, false);
        if (cancelled) return;
        const post = data[0];
        if (!post) {
          setError("Article not found");
          return;
        }
        const mapped = mapPost(post);
        setArticle(mapped);
        cache.set(cacheKey, mapped, TTL.MEDIUM);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load article");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, cacheKey]);

  return { article, loading, error };
}

// ── Issues ────────────────────────────────────────────────────────────────────

export interface MagazineIssue {
  id: string;
  number: number;
  title: string;
  description?: string;
  coverImage?: string;
  articleCount: number;
  date: string;
}

const ISSUES_CACHE_KEY = "magazine_issues";

// WordPress REST: custom endpoint at /wp-json/culture/v1/mobile/magazine/issues
// Falls back to placeholder data if the endpoint isn't available yet.
const ISSUES_URL = `${WP_URL}/wp-json/culture/v1/mobile/magazine/issues`;

const PLACEHOLDER_ISSUES: MagazineIssue[] = [
  { id: "7", number: 7, title: "The Maker Edition", description: "9 articles exploring African makers, craft culture, and the economics of creation.", articleCount: 9, date: "June 2026" },
  { id: "6", number: 6, title: "The Sound Issue", articleCount: 12, date: "May 2026" },
  { id: "5", number: 5, title: "Cities & Culture", articleCount: 8, date: "Apr 2026" },
  { id: "4", number: 4, title: "Fashion Forward", articleCount: 10, date: "Mar 2026" },
  { id: "3", number: 3, title: "The Film Edit", articleCount: 7, date: "Feb 2026" },
  { id: "2", number: 2, title: "Food & Identity", articleCount: 9, date: "Jan 2026" },
  { id: "1", number: 1, title: "Origins", articleCount: 11, date: "Dec 2025" },
];

export function useIssues() {
  const [issues, setIssues] = useState<MagazineIssue[]>(() => cache.get<MagazineIssue[]>(ISSUES_CACHE_KEY) ?? PLACEHOLDER_ISSUES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<MagazineIssue[]>(ISSUES_URL, false);
      setIssues(data);
      cache.set(ISSUES_CACHE_KEY, data, TTL.MEDIUM);
    } catch {
      // Endpoint may not exist yet — silently fall back to placeholder data
      if (issues.length === 0) {
        setIssues(PLACEHOLDER_ISSUES);
      }
    } finally {
      setLoading(false);
    }
  }, [issues.length]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return { issues, loading, error, refresh };
}

export { stripTags, decodeEntities };
