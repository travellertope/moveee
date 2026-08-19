import Link from "next/link";
import HeroScrollButton from "./HeroScrollButton";

// Full-viewport opening statement — a single real lead/cover story (same
// `coverStory` already used by the old homepage/MagazineArchiveWrapper),
// not static copy. `.hero-full` is the class Header.tsx detects to decide
// whether to float transparent-over-dark. Pure server component — no
// interactivity needed beyond the CSS hover cue; the scroll button's own
// click handling lives in the small client subcomponent below it.
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
    <div className="hero-full" data-header-zone="dark">
      {/* display:contents (see homepage-v2.css) makes this <Link> generate
          no box of its own — its children (photo + body) lay out exactly
          as if they were direct flex children of .hero-full, while
          HeroScrollButton below stays a true DOM sibling instead of being
          nested inside this anchor. A click anywhere on the photo/title
          still navigates to the article; a click on the scroll button
          (rendered after this link, not inside it) never does. */}
      <Link href={`/magazine/${story.slug}`} className="hero-full-linklayer" aria-label="Read the featured story">
        <div className="hero-full-photo">
          {image && <img src={image} alt={alt} />}
        </div>
        <div className="hero-full-body">
          <p className="hero-full-kicker">{category}</p>
          <h1 dangerouslySetInnerHTML={{ __html: story.title || "" }} />
          {/* dangerouslySetInnerHTML (not a plain text child) so the browser
              decodes any HTML entities left in the excerpt (WP content
              commonly has literal &#8217;/&hellip; etc. baked into the raw
              text) — a plain string child renders those entities as-is
              instead of the character they represent. Safe here since the
              regex above already stripped every real tag out of `excerpt`,
              same as how story.title is already handled just above. */}
          {excerpt && <p className="hero-full-byline" dangerouslySetInnerHTML={{ __html: excerpt }} />}
        </div>
      </Link>
      <HeroScrollButton />
    </div>
  );
}
