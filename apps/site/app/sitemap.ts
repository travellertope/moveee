import type { MetadataRoute } from "next";
import { getAllPulseSlugs } from "@/lib/pulse-wordpress";
import { getAllCommunitySlugs } from "@/lib/community-wordpress";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let pulseSlugs: string[] = [];
  let communitySlugs: string[] = [];
  try {
    [pulseSlugs, communitySlugs] = await Promise.all([
      getAllPulseSlugs(),
      getAllCommunitySlugs(),
    ]);
  } catch {
    // Non-fatal — sitemap still generates without these entries.
  }

  const pulseStoryUrls: MetadataRoute.Sitemap = pulseSlugs.map((slug) => ({
    url: `${BASE_URL}/pulse/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const communityUrls: MetadataRoute.Sitemap = communitySlugs.map((slug) => ({
    url: `${BASE_URL}/community/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/pulse`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/magazine`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/journeys`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    ...pulseStoryUrls,
    ...communityUrls,
  ];
}
