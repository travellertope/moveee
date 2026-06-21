import type { MetadataRoute } from "next";
import { getWPData, GET_STORIES, GET_PRODUCTS, GET_NEWSLETTERS, GET_JOURNEYS } from "@/lib/wp";
import { FEATURE_PAGES } from "@/lib/features";

const BASE = "https://themoveee.com";

async function fetchSlugs<T extends { slug: string }>(
  query: string,
  vars: Record<string, unknown>,
  extract: (data: any) => T[]
): Promise<T[]> {
  try {
    const data = await getWPData(query, vars, { revalidate: 3600 });
    return extract(data) ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products, newsletters, journeys] = await Promise.all([
    fetchSlugs(GET_STORIES, { first: 500 }, (d) => d?.posts?.nodes ?? []),
    fetchSlugs(GET_PRODUCTS, { first: 500 }, (d) => d?.products?.nodes ?? []),
    fetchSlugs(GET_NEWSLETTERS, { first: 200 }, (d) => d?.cultureNewsletters?.nodes ?? []),
    fetchSlugs(GET_JOURNEYS, { first: 100 }, (d) => d?.cultureJourneys?.nodes ?? []),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                   changeFrequency: "daily"   as const, priority: 1.0, lastModified: new Date() },
    { url: `${BASE}/magazine`,     changeFrequency: "daily"   as const, priority: 0.9, lastModified: new Date() },
    { url: `${BASE}/newsletter`,   changeFrequency: "weekly"  as const, priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/shop`,         changeFrequency: "daily"   as const, priority: 0.8, lastModified: new Date() },
    { url: `${BASE}/journeys`,     changeFrequency: "weekly"  as const, priority: 0.7, lastModified: new Date() },
    { url: `${BASE}/makers`,       changeFrequency: "weekly"  as const, priority: 0.6, lastModified: new Date() },
    { url: `${BASE}/visuals`,      changeFrequency: "monthly" as const, priority: 0.5, lastModified: new Date() },
    { url: `${BASE}/features`,     changeFrequency: "monthly" as const, priority: 0.7, lastModified: new Date() },
  ];

  const featureUrls: MetadataRoute.Sitemap = FEATURE_PAGES.map((f) => ({
    url: `${BASE}/features/${f.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    lastModified: new Date(),
  }));

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/magazine/${a.slug}`,
    lastModified: new Date((a as any).modified || (a as any).date || new Date()),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/shop/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const newsletterUrls: MetadataRoute.Sitemap = newsletters.map((n) => ({
    url: `${BASE}/newsletter/${n.slug}`,
    lastModified: new Date((n as any).modified || (n as any).date || new Date()),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const journeyUrls: MetadataRoute.Sitemap = journeys.map((j) => ({
    url: `${BASE}/journeys/${j.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...featureUrls, ...articleUrls, ...productUrls, ...newsletterUrls, ...journeyUrls];
}
