import Link from "next/link";
import { decodeHtml } from "@/lib/decode-html";

interface ArchiveStory {
  id?: string | number;
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: { node?: { sourceUrl?: string; altText?: string } };
}

// A CMS excerpt field isn't reliably a string (see the homepage-crash
// lesson in CLAUDE.md) — guard with typeof, not just `x || ""`.
function plainExcerpt(html: unknown, max = 130): string {
  const text = typeof html === "string" ? html : "";
  const stripped = decodeHtml(text);
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped;
}

// Shared flush, colourless card grid — same .arc-* language
// MasonryRandomSection.tsx uses on the homepage (mirrors
// /magazine/issues/[slug]'s own card treatment). Reused by every
// open-ended story listing on the site (the /magazine filtered view,
// series landing pages, author archives) so none of them drift back onto
// the retired colorForCard()/tileMasonryShapes() pastel-card system.
export default function ArchiveCardGrid({ stories }: { stories: ArchiveStory[] }) {
  const safeStories = Array.isArray(stories) ? stories.filter(Boolean) : [];
  if (safeStories.length === 0) return null;

  return (
    <div className="arc-grid">
      {safeStories.map((story) => {
        const image = story.featuredImage?.node?.sourceUrl || null;
        const alt = story.featuredImage?.node?.altText || story.title || "";
        const title = decodeHtml(typeof story.title === "string" ? story.title : "");
        const excerpt = plainExcerpt(story.excerpt);
        return (
          <Link key={story.slug || story.id} href={`/magazine/${story.slug}`} className="arc-card">
            <div className="arc-card-img">{image && <img src={image} alt={alt} />}</div>
            <h3>{title}</h3>
            {excerpt && <p>{excerpt}</p>}
            <span className="arc-cta">Read →</span>
          </Link>
        );
      })}
    </div>
  );
}
