import Link from "next/link";

// Full-viewport opening statement — a single real lead/cover story (same
// `coverStory` already used by the old homepage/MagazineArchiveWrapper),
// not static copy. `.hero-full` is the class Header.tsx detects to decide
// whether to float transparent-over-dark. Pure server component — no
// interactivity needed beyond the CSS hover/scroll-cue.
export default function FullBleedHero({ story }: { story: any }) {
  if (!story) return null;

  const category = story.categories?.nodes?.[0]?.name || "Moveee Magazine";
  const image = story.featuredImage?.node?.sourceUrl || null;
  const alt = story.featuredImage?.node?.altText || story.title || "";
  // `story.excerpt` isn't reliably a string — WPGraphQL can hand back a
  // non-string truthy value for some posts, and `(x || "").replace` only
  // guards against falsy `x`, not "truthy but not a string" (which crashed
  // the whole homepage render — see CLAUDE.md's homepage-crash entry).
  const excerpt = (typeof story.excerpt === "string" ? story.excerpt : "").replace(/<[^>]*>/g, "").trim();

  return (
    <Link href={`/magazine/${story.slug}`} className="hero-full" aria-label="Read the featured story">
      <div className="hero-full-photo">
        {image && <img src={image} alt={alt} />}
      </div>
      <div className="hero-full-body">
        <p className="hero-full-kicker">{category}</p>
        <h1 dangerouslySetInnerHTML={{ __html: story.title || "" }} />
        {excerpt && <p className="hero-full-byline">{excerpt}</p>}
      </div>
      <div className="hero-full-scroll">
        <span aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
