"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TYPE_BADGE } from "@/components/DiscoverBrowser";
import type { TrendingCategory, TrendingDirectoryEntry } from "@/lib/fetchTrendingDirectory";
import "./DirectoryDiscovery.css";
import "@/app/pulse-layout.css";

const ComposerModal = dynamic(() => import("@/components/pulse/ComposerModal"), { ssr: false });
const QuickLogModal = dynamic(() => import("@/components/QuickLogModal"), { ssr: false });

const LOWERCASE_WORDS = new Set(["a","an","the","and","but","or","nor","for","so","yet","at","by","for","in","of","off","on","per","to","up","via"]);
function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      return (i === 0 || !LOWERCASE_WORDS.has(lower))
        ? lower.charAt(0).toUpperCase() + lower.slice(1)
        : lower;
    })
    .join(" ");
}

interface ReviewTarget {
  subtype: "place" | "food" | "book" | "film" | "music";
  entry?: TrendingDirectoryEntry;
}

interface LogTarget {
  id: number;
  title: string;
  thumbnail: string | null;
}

interface Props {
  categories: TrendingCategory[];
}

export default function DirectoryDiscovery({ categories }: Props) {
  const { data: session } = useSession();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [pendingTarget, setPendingTarget] = useState<ReviewTarget | null>(null);
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);

  const openReview = useCallback((target: ReviewTarget) => {
    if (!session) {
      setPendingTarget(target);
      window.dispatchEvent(new Event("open-auth-modal"));
      return;
    }
    setReviewTarget(target);
  }, [session]);

  const openLog = useCallback((entry: TrendingDirectoryEntry) => {
    setLogTarget({ id: entry.id, title: entry.title, thumbnail: entry.thumbnail ?? null });
  }, []);

  useEffect(() => {
    if (session && pendingTarget) {
      setReviewTarget(pendingTarget);
      setPendingTarget(null);
    }
  }, [session, pendingTarget]);

  if (categories.length === 0) return null;

  return (
    <section className="arc-section dd-section">
      <div className="wrap">
        <div className="arc-hdr dd-hdr">
          <div className="dd-hdr-copy">
            <h2>What the community is <em>discovering</em> right now</h2>
          </div>
          <Link href="/discover" className="arc-viewall">See the full directory →</Link>
        </div>

        {categories.map((cat) => {
          return (
            <div key={cat.key} className="dd-rail-group">
              <div className="dd-rail-hdr">
                <h3>Trending {cat.label}</h3>
                <Link href={`/discover?type=${cat.type}`} className="arc-viewall">See all {cat.label} ›</Link>
              </div>

              <div className={`dd-rail dd-rail--${cat.key}`}>
                {cat.entries.map((entry) => {
                  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7a6f5c" };
                  const showPlay = cat.key === "film" || cat.key === "music";
                  return (
                    <div key={entry.id} className="dd-card-wrap">
                      <Link href={`/directory/${entry.slug}`} className="arc-card dd-card">
                        <div className="arc-card-img dd-card-img">
                          {entry.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.thumbnail} alt="" loading="lazy" />
                          ) : (
                            <span className="dd-card-fallback" style={{ background: badge.color }}>{badge.emoji}</span>
                          )}
                          {showPlay && (
                            <div className="dd-play-overlay" aria-hidden>
                              <div className="dd-play-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5l9 5.5-9 5.5V2.5z"/></svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <h3>{toTitleCase(entry.title)}</h3>
                        {entry.city && <p className="dd-card-city">{entry.city}</p>}
                        {entry.averageRating ? (
                          <div className="dd-card-rating">
                            <span className="dd-card-star" aria-hidden>★</span>
                            <span className="dd-card-meta">{entry.averageRating.toFixed(1)}</span>
                          </div>
                        ) : null}
                      </Link>
                      <div className="dd-card-actions">
                        <button
                          type="button"
                          className="dd-card-btn dd-card-btn--review"
                          onClick={() => openReview({ subtype: cat.reviewSubtype, entry })}
                        >
                          + Review
                        </button>
                        <span className="dd-card-actions-sep" aria-hidden>·</span>
                        <button
                          type="button"
                          className="dd-card-btn dd-card-btn--log"
                          onClick={() => openLog(entry)}
                        >
                          + Log
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="dd-cta-banner">
          <div>
            <h3>Been somewhere? Read something? Heard something new?</h3>
            <p>Your take could be the next thing someone discovers.</p>
          </div>
          <button type="button" className="dd-cta-banner-btn" onClick={() => openReview({ subtype: "place" })}>
            Write a Review
          </button>
        </div>
      </div>

      {reviewTarget && (
        <ComposerModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewTarget(null)}
          initialTab="review"
          initialReview={
            reviewTarget.entry
              ? {
                  subtype: reviewTarget.subtype,
                  entry: {
                    id: reviewTarget.entry.id,
                    title: reviewTarget.entry.title,
                    slug: reviewTarget.entry.slug,
                    thumbnail: reviewTarget.entry.thumbnail,
                    city: reviewTarget.entry.city,
                  },
                }
              : undefined
          }
        />
      )}
      <QuickLogModal
        entry={logTarget}
        isLoggedIn={!!session}
        onClose={() => setLogTarget(null)}
      />
    </section>
  );
}
