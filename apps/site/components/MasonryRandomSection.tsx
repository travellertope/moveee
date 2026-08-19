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
function shapeForRow(seed: number): ("sq" | "sq" | "sq") | ("sq" | "rect") | ("rect" | "sq") {
  const layouts = [
    ["sq", "sq", "sq"],
    ["sq", "rect"],
    ["rect", "sq"],
  ] as const;
  return layouts[seed % layouts.length] as any;
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
  if (!stories || stories.length === 0) return null;

  const row1Seed = stories[0]?.databaseId ?? stories[0]?.id?.length ?? 0;
  const row2Seed = (stories[1]?.databaseId ?? stories[1]?.id?.length ?? 1) + 1;
  const shapes = [...shapeForRow(row1Seed), ...shapeForRow(row2Seed)].slice(0, max);
  const items = stories.slice(0, shapes.length);

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
            const excerpt = (story.excerpt || "").replace(/<[^>]*>/g, "").trim();
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
