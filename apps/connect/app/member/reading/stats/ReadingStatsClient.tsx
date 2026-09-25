"use client";

import { useEffect, useState } from "react";
import { MOOD_LABELS, PACE_LABELS, type Pace, type ReadingStats } from "@/lib/reading-tracker";

// Reading Tracker stats dashboard — Phase 4, see
// docs/reading-tracker-plan.md §2/§4. Reuses this codebase's existing bar-
// row visual pattern (label / track+fill / count — the same shape
// apps/site/app/lifestyle/[slug]/ProductReviews.tsx's star-distribution
// chart already uses) rather than pulling in AnalyticsClient.tsx's SVG
// BarChart/LineChart components directly, since every section here is a
// small, fixed-size breakdown (12 moods, 3 paces, 5 star ratings, up to 12
// months) that a plain CSS bar row renders just as well as an SVG chart
// would, with far less code to keep in sync between the two files.

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReadingStatsClient() {
  const [data, setData] = useState<ReadingStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/reading/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="rt-empty">Could not load your reading stats. Please try again later.</p>;
  }

  if (!data) {
    return <p className="rt-empty">Loading…</p>;
  }

  const maxMonth = Math.max(1, ...data.books_per_month.map((m) => m.count));
  const paceTotal = Math.max(
    1,
    (Object.values(data.pace_breakdown) as number[]).reduce((s, v) => s + v, 0)
  );
  const moodEntries = Object.entries(data.mood_breakdown);
  const maxMood = Math.max(1, ...moodEntries.map(([, count]) => count));
  const ratingTotal = Math.max(
    1,
    (Object.values(data.rating_distribution) as number[]).reduce((s, v) => s + v, 0)
  );

  return (
    <>
      {/* ── Books read (big stat) ── */}
      <div className="an-stats" style={{ gridTemplateColumns: "1fr", marginBottom: 20 }}>
        <div className="an-stat">
          <div className="an-stat-label">Books Finished in {data.year}</div>
          <div className="an-stat-value" style={{ fontSize: 40 }}>{data.books_read}</div>
        </div>
      </div>

      {/* ── Books per month ── */}
      <section className="acct-card" style={{ marginBottom: 20 }}>
        <div className="an-chart-title">Books Per Month</div>
        {data.books_read === 0 ? (
          <p className="rt-empty" style={{ padding: "0 0 8px" }}>No finished books yet this year.</p>
        ) : (
          <div className="rts-month-grid">
            {data.books_per_month.map((m) => {
              const label = MONTH_LABELS[parseInt(m.month.slice(5, 7), 10) - 1] ?? m.month;
              return (
                <div key={m.month} className="rts-month-col">
                  <div className="rts-month-bar-track">
                    <div
                      className="rts-month-bar-fill"
                      style={{ height: `${m.count === 0 ? 0 : Math.max(6, (m.count / maxMonth) * 100)}%` }}
                    />
                  </div>
                  <div className="rts-month-count">{m.count}</div>
                  <div className="rts-month-label">{label}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Pace breakdown ── */}
      <section className="acct-card" style={{ marginBottom: 20 }}>
        <div className="an-chart-title">Pace</div>
        {paceTotal <= 0 || Object.values(data.pace_breakdown).every((v) => v === 0) ? (
          <p className="rt-empty" style={{ padding: "0 0 8px" }}>No pace votes yet on your finished books.</p>
        ) : (
          <>
            <div className="rts-pace-bar">
              {(Object.keys(data.pace_breakdown) as Pace[]).map((pace) => {
                const count = data.pace_breakdown[pace];
                if (count <= 0) return null;
                return (
                  <div
                    key={pace}
                    className={`rts-pace-seg rts-pace-seg--${pace}`}
                    style={{ width: `${(count / paceTotal) * 100}%` }}
                    title={`${PACE_LABELS[pace]}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="rts-pace-legend">
              {(Object.keys(data.pace_breakdown) as Pace[]).map((pace) => (
                <span key={pace} className="rts-pace-legend-item">
                  <span className={`rts-pace-dot rts-pace-dot--${pace}`} />
                  {PACE_LABELS[pace]} ({data.pace_breakdown[pace]})
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Mood breakdown ── */}
      <section className="acct-card" style={{ marginBottom: 20 }}>
        <div className="an-chart-title">Moods</div>
        {moodEntries.length === 0 ? (
          <p className="rt-empty" style={{ padding: "0 0 8px" }}>No mood votes yet on your finished books.</p>
        ) : (
          <div className="rts-bar-rows">
            {moodEntries.map(([mood, count]) => (
              <div key={mood} className="rts-bar-row">
                <span className="rts-bar-row-label">{MOOD_LABELS[mood as keyof typeof MOOD_LABELS] ?? mood}</span>
                <div className="rts-bar-row-track">
                  <div className="rts-bar-row-fill" style={{ width: `${(count / maxMood) * 100}%` }} />
                </div>
                <span className="rts-bar-row-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Rating distribution ── */}
      <section className="acct-card" style={{ marginBottom: 20 }}>
        <div className="an-chart-title">Ratings — Your Book Reviews</div>
        {ratingTotal <= 0 || Object.values(data.rating_distribution).every((v) => v === 0) ? (
          <p className="rt-empty" style={{ padding: "0 0 8px" }}>
            No Book Review ratings yet — write a review on a book you&apos;ve finished to see it here.
          </p>
        ) : (
          <div className="rts-bar-rows">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = data.rating_distribution[String(stars)] ?? 0;
              return (
                <div key={stars} className="rts-bar-row">
                  <span className="rts-bar-row-label">{stars} star{stars === 1 ? "" : "s"}</span>
                  <div className="rts-bar-row-track">
                    <div className="rts-bar-row-fill" style={{ width: `${(count / ratingTotal) * 100}%` }} />
                  </div>
                  <span className="rts-bar-row-count">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Top genres ── */}
      <section className="acct-card">
        <div className="an-chart-title">Top Genres</div>
        {data.top_genres.length === 0 ? (
          <p className="rt-empty" style={{ padding: "0 0 8px" }}>
            No genres yet — genres come from your Book Review posts on finished books.
          </p>
        ) : (
          <ol className="rts-genre-list">
            {data.top_genres.map((g, i) => (
              <li key={g.genre} className="rts-genre-row">
                <span className="rts-genre-rank">{i + 1}</span>
                <span className="rts-genre-name">{g.genre}</span>
                <span className="rts-genre-count">{g.count}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
