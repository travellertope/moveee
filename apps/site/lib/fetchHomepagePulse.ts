import { getCommunityPosts } from "@/lib/unified-feed";
import type { FeedItem } from "@/lib/unified-feed";

const MIN_REACTIONS = 1;
const MAX_CARDS = 12;

// Exact _template_type values ComposerModal's REVIEW_TEMPLATE map writes
// for each review subtype (place/food/music/book/film).
const REVIEW_TEMPLATE_TYPES = new Set([
  "hidden-gem", "food-review", "music-review", "book-review", "film-review",
]);

export async function fetchHomepagePulse(): Promise<FeedItem[]> {
  try {
    const posts = await getCommunityPosts();
    return posts
      .filter((p) => REVIEW_TEMPLATE_TYPES.has(p.templateType ?? ""))
      .filter((p) => {
        const r = p.reactions ?? { love: 0, fire: 0, clap: 0 };
        return (r.love + r.fire + r.clap) >= MIN_REACTIONS;
      })
      .slice(0, MAX_CARDS);
  } catch {
    return [];
  }
}
