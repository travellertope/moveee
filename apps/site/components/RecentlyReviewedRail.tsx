"use client";

import Link from "next/link";
import type { RecentlyReviewedEntry } from "@/lib/fetchRecentlyReviewed";
import type { RecentlyAddedEntry } from "@/lib/fetchRecentlyAdded";
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

type AnyEntry = RecentlyReviewedEntry | RecentlyAddedEntry;

function EntryCard({ entry, railKey }: { entry: AnyEntry; railKey: string }) {
  const reviewedEntry = "recentReview" in entry ? entry : null;
  const href = "href" in entry && entry.href ? entry.href : `/directory/${entry.slug}`;
  return (
    <Link href={href} className={`rrr-card rrr-card--${railKey}`}>
      <div className="rrr-card-img">
        {entry.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.thumbnail} alt={entry.title} loading="lazy" />
        ) : null}
      </div>
      <div className="rrr-card-info">
        {entry.isNew && <span className="rrr-new-badge">New</span>}
        <h3>{titleCase(entry.title)}</h3>
        {entry.creator && (
          <p className="rrr-card-creator">{entry.creator}</p>
        )}
        {/* Review tease only when showing recently-reviewed mode */}
        {reviewedEntry && reviewedEntry.recentReview.reviewerUsername && (
          <p className="rrr-card-reviewed-by">
            Reviewed by{" "}
            <span className="rrr-card-username">@{reviewedEntry.recentReview.reviewerUsername}</span>
          </p>
        )}
        {reviewedEntry?.recentReview.excerpt && (
          <div className="rrr-review-tease">
            <p className="rrr-review-excerpt">&ldquo;{reviewedEntry.recentReview.excerpt}&rdquo;</p>
          </div>
        )}
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
  entries: AnyEntry[];
  mode?: "reviewed" | "added";
}

export default function RecentlyReviewedRail({ type, entries, mode = "added" }: Props) {
  if (entries.length === 0) return null;

  const label    = LABEL[type] ?? type;
  const viewType = VIEW_ALL_TYPE[type] ?? type;
  const heading  = mode === "reviewed" ? "Recently Reviewed" : "Recently Added";

  return (
    <section className="arc-section rrr-section">
      <div className="wrap">
        <div className="rrr-hdr">
          <p className="rrr-hdr-title">
            {heading} <strong>{label}</strong>
          </p>
          <Link href={`/discover?type=${viewType}`} className="rrr-viewall">
            See all {label.toLowerCase()} ›
          </Link>
        </div>

        <div className={`rrr-rail rrr-rail--${type}`}>
          {entries.slice(0, 6).map((entry) => (
            <EntryCard key={entry.id} entry={entry} railKey={type} />
          ))}
        </div>
      </div>
    </section>
  );
}
