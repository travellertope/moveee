import { useState, useEffect } from "react";
import { cache, TTL } from "../../store/storage";

const WP_URL = "https://cms.themoveee.com";

export interface NewsletterIssue {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  nlList: "getmelit" | "culture-drop" | string;
  date: string;
  issueNumber?: number;
}

export interface NewsletterSummary {
  id: string;
  name: string;
  description: string;
  color: string;
  latestIssue: NewsletterIssue | null;
}

const NEWSLETTERS: Omit<NewsletterSummary, "latestIssue">[] = [
  { id: "getmelit",     name: "GetMeLit",     description: "Culture, lit and beyond.",                color: "#16a34a" },
  { id: "culture-drop", name: "Culture Drop",  description: "The flagship Moveee editorial newsletter.", color: "#4f46e5" },
];

const CACHE_KEY = "magazine_newsletters";

export function useNewsletters() {
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = cache.get<NewsletterSummary[]>(CACHE_KEY);
    if (cached) { setNewsletters(cached); setLoading(false); return; }

    async function load() {
      try {
        const results = await Promise.all(
          NEWSLETTERS.map(async (nl) => {
            const url = `${WP_URL}/wp-json/wp/v2/culture_newsletter?per_page=1&orderby=date&order=desc&_embed=1&meta_key=_culture_nl_list&meta_value=${nl.id}`;
            const res = await fetch(url);
            if (!res.ok) return { ...nl, latestIssue: null };
            const posts = await res.json();
            const p = posts[0];
            if (!p) return { ...nl, latestIssue: null };
            return {
              ...nl,
              latestIssue: {
                id: String(p.id),
                slug: p.slug,
                title: (p.title?.rendered ?? "").replace(/<[^>]+>/g, ""),
                excerpt: (p.excerpt?.rendered ?? "").replace(/<[^>]+>/g, "").trim(),
                featuredImage: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
                nlList: nl.id,
                date: p.date,
              } as NewsletterIssue,
            };
          })
        );
        cache.set(CACHE_KEY, results, TTL.MEDIUM);
        setNewsletters(results);
      } catch (e) {
        console.warn("useNewsletters error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { newsletters, loading };
}
