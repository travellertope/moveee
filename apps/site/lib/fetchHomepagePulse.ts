import { getCommunityPosts } from "@/lib/unified-feed";
import type { FeedItem } from "@/lib/unified-feed";

const MIN_REACTIONS = 3;
const MAX_CARDS = 12;

export async function fetchHomepagePulse(): Promise<FeedItem[]> {
  try {
    const posts = await getCommunityPosts();
    return posts
      .filter((p) => {
        const r = p.reactions ?? { love: 0, fire: 0, clap: 0 };
        return (r.love + r.fire + r.clap) >= MIN_REACTIONS;
      })
      .slice(0, MAX_CARDS);
  } catch {
    return [];
  }
}
