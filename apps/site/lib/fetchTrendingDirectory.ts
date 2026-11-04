const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export interface TrendingDirectoryEntry {
  id: number;
  title: string;
  slug: string;
  type: string;
  thumbnail: string | null;
  city: string;
  averageRating: number | null;
  reviewCount: number;
}

export interface TrendingCategory {
  key: string;
  label: string;
  /** Directory entry_type — used both to query /directory/browse and to
   * look up TYPE_BADGE's color/emoji. */
  type: string;
  /** ComposerModal's ReviewSubtype — what "Write a review" should open to. */
  reviewSubtype: "place" | "food" | "book" | "film" | "music";
  entries: TrendingDirectoryEntry[];
}

const CATEGORY_DEFS: Omit<TrendingCategory, "entries">[] = [
  { key: "place", label: "Places", type: "place", reviewSubtype: "place" },
  { key: "food",  label: "Food",   type: "food",  reviewSubtype: "food" },
  { key: "book",  label: "Books",  type: "book",  reviewSubtype: "book" },
  { key: "film",  label: "Film",   type: "film",  reviewSubtype: "film" },
  // Directory entries reviewed via the composer's Music subtype are linked
  // as type "album" (DirectorySearch.tsx's typeFilter map), not "genre" —
  // "genre" is a separate, broader topic entry (e.g. "Afrobeats").
  { key: "music", label: "Music",  type: "album", reviewSubtype: "music" },
];

const PER_CATEGORY = 6;

async function fetchEntries(type: string, sort: "trending" | "recent"): Promise<TrendingDirectoryEntry[]> {
  try {
    const params = new URLSearchParams({ type, sort, per_page: String(PER_CATEGORY) });
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/browse?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.entries ?? [];
  } catch {
    return [];
  }
}

async function fetchCategoryEntries(type: string): Promise<TrendingDirectoryEntry[]> {
  const trending = await fetchEntries(type, "trending");
  if (trending.length > 0) return trending;
  // Same fallback PulseFeed.tsx's own "Trending Now" sidebar widget uses —
  // a freshly-launched directory type may have nothing trending yet.
  return fetchEntries(type, "recent");
}

/** Trending/recent directory entries grouped by type, for the homepage's
 * "Discovery" rails. Categories with no entries at all are dropped. */
export async function fetchTrendingDirectory(): Promise<TrendingCategory[]> {
  const results = await Promise.all(CATEGORY_DEFS.map((c) => fetchCategoryEntries(c.type)));
  return CATEGORY_DEFS
    .map((c, i) => ({ ...c, entries: results[i] }))
    .filter((c) => c.entries.length > 0);
}
