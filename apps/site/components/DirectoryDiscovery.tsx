"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TYPE_BADGE } from "@/components/DiscoverBrowser";
import type { TrendingCategory, TrendingDirectoryEntry } from "@/lib/fetchTrendingDirectory";
import "./DirectoryDiscovery.css";
import "@/app/pulse-layout.css";

const ComposerModal = dynamic(() => import("@/components/pulse/ComposerModal"), { ssr: false });

function starString(rating: number | null): string {
  const full = rating ? Math.round(rating) : 0;
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

interface ReviewTarget {
  subtype: "place" | "food" | "book" | "film" | "music";
  entry?: TrendingDirectoryEntry;
}

interface Props {
  categories: TrendingCategory[];
}

export default function DirectoryDiscovery({ categories }: Props) {
  const { data: session } = useSession();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const openReview = useCallback((target: ReviewTarget) => {
    if (!session) { window.location.href = "/login?redirect=/"; return; }
    setReviewTarget(target);
  }, [session]);

  if (categories.length === 0) return null;

  return (
    <section className="arc-section dd-section">
      <div className="wrap">
        <div className="arc-hdr dd-hdr">
          <div className="dd-hdr-copy">
            <span className="dd-eyebrow">The Directory</span>
            <h2>What the community is <em>discovering</em> right now</h2>
            <p className="dd-sub">Places, food, books, film and music people are talking about this week. Find something new — then tell everyone what you thought.</p>
          </div>
          <Link href="/discover" className="arc-viewall">See the full directory →</Link>
        </div>

        {categories.map((cat) => {
          const dotColor = TYPE_BADGE[cat.type]?.color ?? "#7a6f5c";
          return (
            <div key={cat.key} className="dd-rail-group">
              <div className="dd-rail-hdr">
                <div className="dd-rail-hdr-left">
                  <span className="dd-dot" style={{ background: dotColor }} aria-hidden="true" />
                  <h3>Trending {cat.label}</h3>
                  <span className="dd-rail-count">{cat.entries.length} this week</span>
                </div>
                <Link href={`/discover?type=${cat.type}`} className="arc-viewall">See all {cat.label} →</Link>
              </div>

              <div className="dd-rail">
                {cat.entries.map((entry) => {
                  const badge = TYPE_BADGE[entry.type] ?? { emoji: "✦", label: "ENTRY", color: "#7a6f5c" };
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
                          <span className="dd-card-trending">🔥 Trending</span>
                        </div>
                        <h3>{entry.title}</h3>
                        {entry.city && <p className="dd-card-city">{entry.city}</p>}
                        <div className="dd-card-rating">
                          <span className="dd-card-stars">{starString(entry.averageRating)}</span>
                          <span className="dd-card-meta">
                            {entry.averageRating ? entry.averageRating.toFixed(1) : "New"} · {entry.reviewCount} review{entry.reviewCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        className="arc-cta dd-card-cta"
                        onClick={() => openReview({ subtype: cat.reviewSubtype, entry })}
                      >
                        ✎ Write a review →
                      </button>
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
    </section>
  );
}
