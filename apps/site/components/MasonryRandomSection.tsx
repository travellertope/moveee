import Link from "next/link";

interface MasonrySectionProps {
  eyebrowTitle: React.ReactNode;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  stories: any[];
  // "Series" / "Category" / "Feed" — mirrors the small mono label on
  // /magazine/issues/[slug]'s own section header (Series vs Category),
  // so a visitor sees the exact same header language on the homepage.
  sectionType?: string;
  max?: number;
}

// A CMS excerpt field isn't reliably a string (see the homepage-crash
// lesson in CLAUDE.md) — guard with typeof, not just `x || ""`.
function plainExcerpt(html: unknown, max = 130): string {
  const text = typeof html === "string" ? html : "";
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped;
}

export default function MasonryRandomSection({
  eyebrowTitle,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all stories",
  stories,
  sectionType = "Feed",
  max = 6,
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
          <span className="arc-type">{sectionType}</span>
          <h2>{eyebrowTitle}</h2>
          <span className="arc-count">
            {items.length} {items.length === 1 ? "story" : "stories"}
            {viewAllHref && (
              <>
                {" "}
                · <Link href={viewAllHref}>{viewAllLabel}</Link>
              </>
            )}
          </span>
        </div>
        {subtitle && <p className="arc-sub">{subtitle}</p>}
        <div className="arc-grid">
          {items.map((story) => {
            const image = story.featuredImage?.node?.sourceUrl || null;
            const alt = story.featuredImage?.node?.altText || story.title || "";
            const excerpt = plainExcerpt(story.excerpt);
            return (
              <Link key={story.slug || story.id} href={`/magazine/${story.slug}`} className="arc-card">
                <div className="arc-card-img">{image && <img src={image} alt={alt} />}</div>
                <h3 dangerouslySetInnerHTML={{ __html: story.title || "" }} />
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
