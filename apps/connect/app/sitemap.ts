import type { MetadataRoute } from "next";

const BASE = "https://web.themoveee.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${BASE}/connect`,   lastModified: now, changeFrequency: "hourly",  priority: 1.0 },
    { url: `${BASE}/events`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/directory`, lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/pulse`,     lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${BASE}/quotes`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/games`,     lastModified: now, changeFrequency: "daily",   priority: 0.7 },
  ];
}
