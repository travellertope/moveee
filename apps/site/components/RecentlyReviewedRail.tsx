import Link from "next/link";
import type { TrendingCategory, TrendingDirectoryEntry } from "@/lib/fetchTrendingDirectory";
import "./RecentlyReviewedRail.css";

function titleCase(str: string): string {
  const SKIP = new Set(["a","an","the","and","but","or","for","in","of","on","to","at","by","via","nor","so","yet","off","up","per"]);
  return str
    .split(" ")
    .map((w, i) => {
      const lo = w.toLowerCase();
      return i === 0 || !SKIP.has(lo) ? lo.charAt(0).toUpperCase() + lo.slice(1) : lo;
    })
    .join(" ");
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="rrr-card-star" aria-label={`${rating.toFixed(1)} out of 5`}>
      {"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function ReviewCard({ entry, railKey }: { entry: TrendingDirectoryEntry; railKey: string }) {
  return (
    <div className="rrr-card-wrap">
      <Link href={`/directory/${entry.slug}`} className="rrr-card">
        <div className="rrr-card-img">
          {entry.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.thumbnail} alt={entry.title} loading="lazy" />
          ) : null}
        </div>
        <div className="rrr-card-info">
          <h3>{titleCase(entry.title)}</h3>
          {entry.averageRating != null && (
            <div className="rrr-card-rating">
              <StarRating rating={entry.averageRating} />
              {entry.reviewCount > 0 && (
                <span className="rrr-card-count">({entry.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

interface Props {
  category: TrendingCategory;
}

const SECTION_LABEL: Record<string, string> = {
  film: "Recently Reviewed",
  music: "Recently Reviewed",
  book: "Recently Reviewed",
};

const VIEW_ALL_LABEL: Record<string, string> = {
  film: "See all films",
  music: "See all music",
  book: "See all books",
};

export default function RecentlyReviewedRail({ category }: Props) {
  if (category.entries.length === 0) return null;

  const label = SECTION_LABEL[category.key] ?? "Recently Reviewed";
  const viewAllLabel = VIEW_ALL_LABEL[category.key] ?? `See all ${category.label.toLowerCase()}`;

  return (
    <section className="arc-section rrr-section">
      <div className="wrap">
        <div className="rrr-hdr">
          <div>
            <p className="rrr-hdr-label">{label}</p>
            <h2>{category.label}</h2>
          </div>
          <Link href={`/discover?type=${category.type}`} className="rrr-viewall">
            {viewAllLabel} ›
          </Link>
        </div>

        <div className={`rrr-rail rrr-rail--${category.key}`}>
          {category.entries.slice(0, 5).map((entry) => (
            <ReviewCard key={entry.id} entry={entry} railKey={category.key} />
          ))}
        </div>
      </div>
    </section>
  );
}
