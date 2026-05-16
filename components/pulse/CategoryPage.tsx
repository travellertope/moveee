import Link from "next/link";
import { getPulseStories } from "@/lib/pulse-wordpress";
import { getCommunityPostsByTag } from "@/lib/community-wordpress";
import type { WpCommunityPost } from "@/lib/community-wordpress";
import type { FeedItem } from "@/lib/unified-feed";
import { decodeHtml } from "@/lib/decode-html";
import FeedCard from "@/components/pulse/FeedCard";
import SubmitPost from "@/components/pulse/SubmitPost";

const ALL_CATEGORIES = [
  { slug: "music",      label: "Music",       desc: "Artists, releases, and the sounds shaping the diaspora." },
  { slug: "fashion",    label: "Fashion",     desc: "Designers, style movements, and cultural identity." },
  { slug: "art",        label: "Art",         desc: "Visual art, exhibitions, and creative voices." },
  { slug: "film",       label: "Film",        desc: "Cinema, directors, and storytelling on screen." },
  { slug: "food",       label: "Food",        desc: "Cuisine, chefs, and the culture on the plate." },
  { slug: "sport",      label: "Sport",       desc: "Athletes, competitions, and sport as culture." },
  { slug: "travel",     label: "Travel",      desc: "Destinations, journeys, and where the diaspora roams." },
  { slug: "literature", label: "Literature",  desc: "Books, writers, and the written word." },
  { slug: "design",     label: "Design",      desc: "Architecture, product, and creative direction." },
  { slug: "tech",       label: "Tech",        desc: "Innovation, startups, and technology from Africa and the diaspora." },
];

interface Props {
  slug: string;
  label: string;
  desc: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function communityPostToFeedItem(post: WpCommunityPost): FeedItem {
  const raw = post.content?.rendered ?? "";
  const textContent = decodeHtml(stripHtml(raw.replace(/<!--[\s\S]*?-->/g, "")));
  return {
    id: `community-${post.id}`,
    type: "community",
    title: textContent,
    slug: post.slug,
    date: post.date,
    image: post.meta?.community_image_url ?? undefined,
    href: `/community/${post.slug}`,
    communityAuthor: post.meta?.community_author_name ?? "",
    communityTag: post.meta?.community_tag ?? "",
    reactions: {
      love: Number(post.meta?.reaction_love ?? 0),
      fire: Number(post.meta?.reaction_fire ?? 0),
      clap: Number(post.meta?.reaction_clap ?? 0),
    },
    wpId: String(post.id),
  };
}

export default async function CategoryPage({ slug, label, desc }: Props) {
  const otherCategories = ALL_CATEGORIES.filter((c) => c.slug !== slug);

  const [communityPosts, pulseStories] = await Promise.all([
    getCommunityPostsByTag(label).catch(() => []),
    getPulseStories({ category: slug, perPage: 12 }).catch(() => []),
  ]);

  const communityItems: FeedItem[] = communityPosts.map(communityPostToFeedItem);

  const pulseItems: FeedItem[] = pulseStories.map((story) => ({
    id: `pulse-${story.id}`,
    type: "pulse" as const,
    title: decodeHtml(story.title?.rendered ?? ""),
    slug: story.slug,
    date: story.date,
    excerpt: stripHtml(story.excerpt?.rendered ?? ""),
    image: story._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
    href: `/pulse/${story.slug}`,
    arm: story.meta?.pulse_arm_label ?? "",
    region: story.meta?.pulse_region_label ?? "",
    source: story.meta?.pulse_source ?? "",
    sourceUrl: story.meta?.pulse_external_url ?? "",
    reactions: {
      love: Number((story.meta as any)?.reaction_love ?? 0),
      fire: Number((story.meta as any)?.reaction_fire ?? 0),
      clap: Number((story.meta as any)?.reaction_clap ?? 0),
    },
    wpId: String(story.id),
  }));

  return (
    <div style={{ background: "#f7f5f2", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e2d8",
        padding: "1.25rem 1.5rem",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.65rem",
            color: "#7a6f5c",
            margin: "0 0 0.6rem",
          }}>
            <Link href="/pulse" style={{ color: "#7a6f5c", textDecoration: "none" }}>← Pulse</Link>
            {" · "}
            <Link href="/pulse/categories" style={{ color: "#7a6f5c", textDecoration: "none" }}>Categories</Link>
          </p>

          {/* H1 */}
          <h1 style={{
            fontSize: "1.4rem",
            fontWeight: 400,
            color: "#14110d",
            margin: "0.2rem 0",
            fontFamily: "var(--font-fraunces), serif",
          }}>
            {label}
          </h1>

          {/* Desc */}
          <p style={{
            fontSize: "0.85rem",
            color: "#7a6f5c",
            fontFamily: "var(--font-fraunces), serif",
            fontStyle: "italic",
            margin: 0,
          }}>
            {desc}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: "0",
        }}
          className="category-layout"
        >
          {/* Main column */}
          <div style={{ borderRight: "1px solid #e8e2d8", minHeight: "80vh" }}>
            {/* Composer */}
            <SubmitPost />

            {/* Community posts */}
            {communityItems.length > 0 && (
              <>
                {communityItems.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
                {/* Divider between community and pulse */}
                {pulseItems.length > 0 && (
                  <div style={{
                    borderBottom: "1px solid #e8e2d8",
                    padding: "0.75rem 1.25rem",
                    background: "#f7f5f2",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "0.6rem",
                      color: "#7a6f5c",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      margin: 0,
                    }}>
                      Pulse Stories · {label}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Pulse stories */}
            {pulseItems.length > 0 && (
              <>
                {communityItems.length === 0 && (
                  <div style={{
                    borderBottom: "1px solid #e8e2d8",
                    padding: "0.75rem 1.25rem",
                    background: "#f7f5f2",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "0.6rem",
                      color: "#7a6f5c",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      margin: 0,
                    }}>
                      Pulse Stories · {label}
                    </p>
                  </div>
                )}
                {pulseItems.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
              </>
            )}

            {communityItems.length === 0 && pulseItems.length === 0 && (
              <div style={{ color: "#aaa", textAlign: "center", padding: "4rem 0", fontSize: "0.85rem" }}>
                No posts yet in {label}. Be the first to share something.
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside style={{
            position: "sticky",
            top: "1rem",
            alignSelf: "start",
            padding: "1.25rem 1rem",
          }}>
            {/* About box */}
            <div style={{
              background: "#fff",
              border: "1px solid #e8e2d8",
              padding: "1rem",
              marginBottom: "1.25rem",
            }}>
              <p style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.6rem",
                color: "#7a6f5c",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: "0 0 0.5rem",
                fontWeight: 700,
              }}>
                About {label}
              </p>
              <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: 0 }}>
                {desc}
              </p>
            </div>

            {/* Other categories */}
            <div>
              <p style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.6rem",
                color: "#7a6f5c",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: "0 0 0.5rem",
                fontWeight: 700,
              }}>
                Other Categories
              </p>
              <ul style={{ margin: 0, padding: 0 }}>
                {otherCategories.map((cat) => (
                  <li key={cat.slug} style={{ listStyle: "none" }}>
                    <Link
                      href={`/pulse/${cat.slug}`}
                      style={{
                        display: "block",
                        padding: "0.3rem 0",
                        fontSize: "0.78rem",
                        fontFamily: "var(--font-mono), monospace",
                        color: "#3a342b",
                        textDecoration: "none",
                        borderBottom: "1px solid #f0ebe3",
                      }}
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
                <li style={{ listStyle: "none", marginTop: "0.5rem" }}>
                  <Link
                    href="/pulse/categories"
                    style={{
                      display: "block",
                      padding: "0.3rem 0",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono), monospace",
                      color: "#c5491f",
                      textDecoration: "none",
                      letterSpacing: "0.06em",
                    }}
                  >
                    See all categories →
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .category-layout {
            grid-template-columns: 1fr !important;
          }
          .category-layout aside {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
