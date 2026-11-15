"use client";

import Link from "next/link";
import type { RecentlyReviewedEntry } from "@/lib/fetchRecentlyReviewed";
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
    <span className="rrr-stars" aria-label={`${rating.toFixed(1)} out of 5`}>
      {"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function ReviewCard({ entry, railKey }: { entry: RecentlyReviewedEntry; railKey: string }) {
  const { recentReview: rev } = entry;
  return (
    <Link href={`/directory/${entry.slug}`} className={`rrr-card rrr-card--${railKey}`}>
      <div className="rrr-card-img">
        {entry.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.thumbnail} alt={entry.title} loading="lazy" />
        ) : null}
      </div>
      <div className="rrr-card-info">
        <h3>{titleCase(entry.title)}</h3>
        {entry.creator && (
          <p className="rrr-card-creator">{entry.creator}</p>
        )}
        {entry.averageRating != null && (
          <div className="rrr-card-rating">
            <StarRating rating={entry.averageRating} />
            <span className="rrr-stars-val">{entry.averageRating.toFixed(1)}</span>
            {entry.reviewCount > 0 && (
              <span className="rrr-card-count">({entry.reviewCount})</span>
            )}
          </div>
        )}
        {/* Review tease */}
        <div className="rrr-review-tease">
          <div className="rrr-review-meta">
            {rev.reviewerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rev.reviewerAvatar} alt={rev.reviewerName} className="rrr-review-avatar" loading="lazy" />
            ) : (
              <span className="rrr-review-avatar rrr-review-avatar--fallback">
                {rev.reviewerName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="rrr-review-name">{rev.reviewerName}</span>
            {rev.rating != null && (
              <span className="rrr-review-rating">
                {"★".repeat(Math.round(rev.rating))}
              </span>
            )}
          </div>
          {rev.excerpt && (
            <p className="rrr-review-excerpt">&ldquo;{rev.excerpt}&rdquo;</p>
          )}
        </div>
      </div>
    </Link>
  );
}

const LABEL: Record<string, string> = {
  film:  "Film",
  music: "Music",
  book:  "Books",
};

const VIEW_ALL_TYPE: Record<string, string> = {
  film:  "film",
  music: "album",
  book:  "book",
};

interface Props {
  type: "film" | "music" | "book";
  entries: RecentlyReviewedEntry[];
}

export default function RecentlyReviewedRail({ type, entries }: Props) {
  if (entries.length === 0) return null;

  const label    = LABEL[type] ?? type;
  const viewType = VIEW_ALL_TYPE[type] ?? type;

  return (
    <section className="arc-section rrr-section">
      <div className="wrap">
        <div className="rrr-hdr">
          <p className="rrr-hdr-title">
            Recently Reviewed <strong>{label}</strong>
          </p>
          <Link href={`/discover?type=${viewType}`} className="rrr-viewall">
            See all {label.toLowerCase()} ›
          </Link>
        </div>

        <div className={`rrr-rail rrr-rail--${type}`}>
          {entries.slice(0, 6).map((entry) => (
            <ReviewCard key={entry.id} entry={entry} railKey={type} />
          ))}
        </div>
      </div>
    </section>
  );
}
