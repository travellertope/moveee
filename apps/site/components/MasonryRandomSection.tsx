import Link from "next/link";
import { decodeHtml } from "@/lib/decode-html";

interface MasonrySectionProps {
  eyebrowTitle: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  stories: any[];
  max?: number;
}

// A CMS excerpt field isn't reliably a string (see the homepage-crash
// lesson in CLAUDE.md) — guard with typeof, not just `x || ""`.
function plainExcerpt(html: unknown, max = 130): string {
  const text = typeof html === "string" ? html : "";
  const stripped = decodeHtml(text);
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped;
}

export default function MasonryRandomSection({
  eyebrowTitle,
  viewAllHref,
  viewAllLabel = "More →",
  stories,
  max = 8,
}: MasonrySectionProps) {
  // Drop null/undefined entries before anything reads off them — a single
  // bad node in a CMS response shouldn't be able to crash the section.
  const safeStories = Array.isArray(stories) ? stories.filter(Boolean) : [];
  if (safeStories.length === 0) return null;

  const items = safeStories.slice(0, max);

  return (
    <section className="arc-section">
      <div className="wrap">
        <div className="arc-hdr">
          <h2>{eyebrowTitle}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="arc-viewall">
              {viewAllLabel}
            </Link>
          )}
        </div>
        <div className="arc-grid">
          {items.map((story) => {
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
      </div>
    </section>
  );
}
