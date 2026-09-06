import Link from "next/link";
import { colorForCard } from "@/lib/cardColors";

interface MasonrySectionProps {
  eyebrowTitle: React.ReactNode;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  stories: any[];
  tint?: boolean;
  max?: number;
}

// The mockup randomises each row's shape (squares, or a square+rectangle
// mix) client-side via Math.random() on every page load. A server-rendered
// page can't do that without a hydration mismatch, so shape is instead
// derived deterministically from each story's own id — same visual variety
// (never a flat uniform grid) without client/server disagreement or an
// extra client component just for this section.
//
// The grid is 4 columns wide (.masonry-rand) — sq spans 1 column, rect
// spans 2, so every layout below sums to 4 columns per row.
type Shape = "sq" | "rect";

const LAYOUTS: readonly (readonly Shape[])[] = [
  ["sq", "sq", "sq", "sq"],
  ["sq", "rect", "sq"],
  ["rect", "sq", "sq"],
  ["sq", "sq", "rect"],
  ["rect", "rect"],
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
  max = 8,
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
            const cardSeed = story.databaseId ?? story.id?.length ?? i;
            return (
              <Link
                key={story.slug || story.id}
                href={`/magazine/${story.slug}`}
                className={`wcard wcard--${shape}`}
                style={{ background: colorForCard(cardSeed) }}
              >
                <div className="wcard-photo">{image && <img src={image} alt={alt} />}</div>
                {/* Title only — no excerpt appended. Cards previously showed
                    "{title} — {excerpt}" in one run-on caption with no visual
                    distinction between the two. */}
                <p className="wcard-caption" dangerouslySetInnerHTML={{ __html: story.title || "" }} />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
