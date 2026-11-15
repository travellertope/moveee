"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import type { TrendingCategory, TrendingDirectoryEntry } from "@/lib/fetchTrendingDirectory";
import "./RecentlyReviewedRail.css";

const ComposerModal = dynamic(() => import("@/components/pulse/ComposerModal"), { ssr: false });
const QuickLogModal = dynamic(() => import("@/components/QuickLogModal"), { ssr: false });

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
      <span className="rrr-stars-val">{rating.toFixed(1)}</span>
    </span>
  );
}

type ReviewSubtype = "place" | "food" | "book" | "film" | "music";

interface CardProps {
  entry: TrendingDirectoryEntry;
  reviewSubtype: ReviewSubtype;
  onReview: (entry: TrendingDirectoryEntry) => void;
  onLog: (entry: TrendingDirectoryEntry) => void;
}

function ReviewCard({ entry, reviewSubtype, onReview, onLog }: CardProps) {
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
          {entry.creator && (
            <p className="rrr-card-creator">{entry.creator}</p>
          )}
          {entry.averageRating != null && (
            <div className="rrr-card-rating">
              <StarRating rating={entry.averageRating} />
              {entry.reviewCount > 0 && (
                <span className="rrr-card-count">({entry.reviewCount})</span>
              )}
            </div>
          )}
          {entry.excerpt && (
            <p className="rrr-card-excerpt">{entry.excerpt}</p>
          )}
        </div>
      </Link>
      <div className="rrr-card-actions">
        <button
          type="button"
          className="rrr-card-btn"
          onClick={() => onReview(entry)}
        >
          + Review
        </button>
        <span className="rrr-card-sep" aria-hidden>·</span>
        <button
          type="button"
          className="rrr-card-btn"
          onClick={() => onLog(entry)}
        >
          + Log
        </button>
      </div>
    </div>
  );
}

interface Props {
  category: TrendingCategory;
}

export default function RecentlyReviewedRail({ category }: Props) {
  const { data: session } = useSession();
  const [reviewEntry, setReviewEntry] = useState<TrendingDirectoryEntry | null>(null);
  const [logEntry, setLogEntry] = useState<{ id: number; title: string; thumbnail: string | null } | null>(null);
  const [pendingEntry, setPendingEntry] = useState<TrendingDirectoryEntry | null>(null);

  const openReview = useCallback((entry: TrendingDirectoryEntry) => {
    if (!session) {
      setPendingEntry(entry);
      window.dispatchEvent(new Event("open-auth-modal"));
      return;
    }
    setReviewEntry(entry);
  }, [session]);

  const openLog = useCallback((entry: TrendingDirectoryEntry) => {
    setLogEntry({ id: entry.id, title: entry.title, thumbnail: entry.thumbnail ?? null });
  }, []);

  if (category.entries.length === 0) return null;

  return (
    <section className="arc-section rrr-section">
      <div className="wrap">
        <div className="rrr-hdr">
          <p className="rrr-hdr-title">
            Recently Reviewed <strong>{category.label}</strong>
          </p>
          <Link href={`/discover?type=${category.type}`} className="rrr-viewall">
            See all {category.label.toLowerCase()} ›
          </Link>
        </div>

        <div className={`rrr-rail rrr-rail--${category.key}`}>
          {category.entries.slice(0, 5).map((entry) => (
            <ReviewCard
              key={entry.id}
              entry={entry}
              reviewSubtype={category.reviewSubtype}
              onReview={openReview}
              onLog={openLog}
            />
          ))}
        </div>
      </div>

      {reviewEntry && (
        <ComposerModal
          open
          onClose={() => setReviewEntry(null)}
          onSuccess={() => setReviewEntry(null)}
          initialTab="review"
          initialReview={{
            subtype: category.reviewSubtype,
            entry: {
              id: reviewEntry.id,
              title: reviewEntry.title,
              slug: reviewEntry.slug,
              thumbnail: reviewEntry.thumbnail,
              city: reviewEntry.city,
            },
          }}
        />
      )}

      <QuickLogModal
        entry={logEntry}
        isLoggedIn={!!session}
        onClose={() => setLogEntry(null)}
      />
    </section>
  );
}
