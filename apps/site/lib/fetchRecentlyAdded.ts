const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export interface RecentlyAddedEntry {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  creator: string | null;
  averageRating: number | null;
  reviewCount: number;
  dateAdded: string;
  isNew: boolean;
}

export interface RecentlyAddedByType {
  film: RecentlyAddedEntry[];
  music: RecentlyAddedEntry[];
  book: RecentlyAddedEntry[];
}

// Directory type slugs that map to rail keys
const TYPE_SLUG: Record<string, string> = {
  film:  "film",
  music: "album",
  book:  "book",
};

async function fetchForType(railKey: string): Promise<RecentlyAddedEntry[]> {
  try {
    const typeSlug = TYPE_SLUG[railKey] ?? railKey;
    const url = `${WP_URL}/wp-json/culture/v1/directory/browse?sort=recent&type=${typeSlug}&per_page=8`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.entries ?? []).map((e: any) => ({
      id:            e.id,
      title:         e.title,
      slug:          e.slug,
      thumbnail:     e.thumbnail ?? null,
      creator:       e.creator ?? null,
      averageRating: e.averageRating ?? null,
      reviewCount:   e.reviewCount ?? 0,
      dateAdded:     e.dateAdded ?? "",
      isNew:         e.isNew ?? false,
    }));
  } catch {
    return [];
  }
}

export async function fetchRecentlyAdded(): Promise<RecentlyAddedByType> {
  const [film, music, book] = await Promise.all([
    fetchForType("film"),
    fetchForType("music"),
    fetchForType("book"),
  ]);
  return { film, music, book };
}
