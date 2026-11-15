const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export interface RecentReview {
  postId: number;
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string | null;
  rating: number | null;
  excerpt: string;
}

export interface RecentlyReviewedEntry {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  creator: string | null;
  averageRating: number | null;
  reviewCount: number;
  recentReview: RecentReview;
}

export interface RecentlyReviewedByType {
  film: RecentlyReviewedEntry[];
  music: RecentlyReviewedEntry[];
  book: RecentlyReviewedEntry[];
}

export async function fetchRecentlyReviewed(): Promise<RecentlyReviewedByType> {
  const empty: RecentlyReviewedByType = { film: [], music: [], book: [] };
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/directory/recently-reviewed`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return empty;
    const data = await res.json();
    return {
      film:  Array.isArray(data?.film)  ? data.film  : [],
      music: Array.isArray(data?.music) ? data.music : [],
      book:  Array.isArray(data?.book)  ? data.book  : [],
    };
  } catch {
    return empty;
  }
}
