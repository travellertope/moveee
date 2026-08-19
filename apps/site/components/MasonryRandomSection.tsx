import Link from "next/link";

interface MasonrySectionProps {
  eyebrowTitle: React.ReactNode;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  stories: any[];
  tint?: boolean;
  max?: number;
}

// The mockup randomises each row's shape (3 squares, or a square+rectangle
// pair) client-side via Math.random() on every page load. A server-rendered
// page can't do that without a hydration mismatch, so shape is instead
// derived deterministically from each story's own id — same visual variety
// (never a flat uniform grid) without client/server disagreement or an
// extra client component just for this section.
type Shape = "sq" | "rect";

const LAYOUTS: readonly (readonly Shape[])[] = [
  ["sq", "sq", "sq"],
  ["sq", "rect"],
  ["rect", "sq"],
];

// `seed` comes straight from CMS data (`databaseId`, or an id string's
// length), so it must be treated as untrusted: a missing/non-numeric
// databaseId makes `seed % LAYOUTS.length` NaN, and a raw
// `LAYOUTS[NaN]` returns undefined — which then throws
// "not iterable" the moment it's spread at the call site, taking the
// whole homepage down with a Server Components render error. Normalise
// to a guaranteed-valid index so this function is total for ANY input.
function shapeForRow(seed: unknown): readonly Shape[] {
  const n = Number(seed);
  const index = Number.isFinite(n)
    ? Math.abs(Math.trunc(n)) % LAYOUTS.length
    : 0;
  return LAYOUTS[index];
}

export default function MasonryRandomSection({
  eyebrowTitle,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all stories",
  stories,
  tint = false,
  max = 6,
}: MasonrySectionProps) {
  // Drop null/undefined entries before anything reads off them — a single
  // bad node in a CMS response shouldn't be able to crash the section.
  const safeStories = Array.isArray(stories) ? stories.filter(Boolean) : [];
  if (safeStories.length === 0) return null;

  const row1Seed = safeStories[0]?.databaseId ?? safeStories[0]?.id?.length ?? 0;
  const row2Seed = Number(safeStories[1]?.databaseId ?? safeStories[1]?.id?.length ?? 1) + 1;
  const shapes = [...shapeForRow(row1Seed), ...shapeForRow(row2Seed)].slice(0, max);
  const items = safeStories.slice(0, shapes.length);

  return (
    <section className={`band${tint ? " band--tint" : ""}`}>
      <div className="wrap">
        <div className="band-head">
          <h2>{eyebrowTitle}</h2>
          {subtitle && <p className="subtitle">{subtitle}</p>}
          {viewAllHref && (
            <Link className="view-all" href={viewAllHref}>
              {viewAllLabel}
            </Link>
          )}
        </div>
        <div className="masonry-rand">
          {items.map((story, i) => {
            const shape = shapes[i];
            const image = story.featuredImage?.node?.sourceUrl || null;
            const alt = story.featuredImage?.node?.altText || story.title || "";
            // See FullBleedHero.tsx's identical guard — `excerpt` isn't
            // reliably a string, and `(x || "").replace` only catches
            // falsy, not non-string, which crashed the homepage render.
            const excerpt = (typeof story.excerpt === "string" ? story.excerpt : "").replace(/<[^>]*>/g, "").trim();
            return (
              <Link
                key={story.slug || story.id}
                href={`/magazine/${story.slug}`}
                className={`wcard wcard--${shape}`}
              >
                <div className="wcard-photo">{image && <img src={image} alt={alt} />}</div>
                <p
                  className="wcard-caption"
                  dangerouslySetInnerHTML={{
                    __html: `${story.title || ""}${excerpt ? ` — ${excerpt}` : ""}`,
                  }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
