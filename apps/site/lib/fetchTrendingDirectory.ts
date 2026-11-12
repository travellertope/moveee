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

// Render order: Film, Music, Books.
const CATEGORY_DEFS: Omit<TrendingCategory, "entries">[] = [
  { key: "film",  label: "Film",   type: "film",  reviewSubtype: "film" },
  // Directory entries reviewed via the composer's Music subtype are linked
  // as type "album" (DirectorySearch.tsx's typeFilter map), not "genre" —
  // "genre" is a separate, broader topic entry (e.g. "Afrobeats").
  { key: "music", label: "Music",  type: "album", reviewSubtype: "music" },
  { key: "book",  label: "Books",  type: "book",  reviewSubtype: "book" },
];

const PER_CATEGORY = 6;
// Fetch more than needed so we have enough after filtering to thumbnail-only.
const FETCH_PER_CATEGORY = 18;

async function fetchRandomWithThumbnails(type: string, seed: number): Promise<TrendingDirectoryEntry[]> {
  try {
    const params = new URLSearchParams({
      type,
      sort: "random",
      seed: String(seed),
      per_page: String(FETCH_PER_CATEGORY),
    });
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/browse?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const entries: TrendingDirectoryEntry[] = data?.entries ?? [];
    // Keep only entries that have a cover/thumbnail image, then cap at PER_CATEGORY.
    return entries.filter((e) => e.thumbnail).slice(0, PER_CATEGORY);
  } catch {
    return [];
  }
}

/** Random directory entries (with thumbnails) grouped by type, reshuffled on
 * every homepage load. Categories with no entries are dropped. */
export async function fetchTrendingDirectory(): Promise<TrendingCategory[]> {
  // One seed per page load — same value across all category fetches so the
  // ordering is coherent, but fresh on every request.
  const seed = Math.floor(Math.random() * 2_147_483_647);
  const results = await Promise.all(CATEGORY_DEFS.map((c) => fetchRandomWithThumbnails(c.type, seed)));
  return CATEGORY_DEFS
    .map((c, i) => ({ ...c, entries: results[i] }))
    .filter((c) => c.entries.length > 0);
}
