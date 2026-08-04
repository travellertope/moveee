"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Review {
  id: number;
  rating: number;
  content: string;
  author: string;
  avatarUrl: string;
  date: string;
}

interface Props {
  productId: number;
  averageRating: number;
  reviewCount: number;
}

const AVATAR_TONES = ["#c9a06a", "#a9764e", "#d8c6a8", "#8f6a4a", "#c2b199", "#b98f66"];

function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % AVATAR_TONES.length;
  return AVATAR_TONES[Math.abs(hash)];
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function ProductReviews({ productId, averageRating, reviewCount }: Props) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/shop/reviews?product_id=${productId}`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star … index 4 = 5 stars
    for (const r of reviews) {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx] += 1;
    }
    const total = reviews.length || 1;
    return counts
      .map((count, i) => ({ stars: i + 1, count, pct: Math.round((count / total) * 100) }))
      .reverse(); // 5 stars first
  }, [reviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !content.trim()) {
      setError("Please choose a rating and write a review.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/shop/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
      setSuccess(true);
      setContent("");
      setRating(0);
      const refreshed = await fetch(`/api/shop/reviews?product_id=${productId}`).then((r) => r.json());
      setReviews(Array.isArray(refreshed) ? refreshed : []);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="sp-reviews">
      <div className="sp-reviews-inner">
        <div className="sp-reviews-head">
          <h2>Reviews</h2>
          <button type="button" className="sp-write-review" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? "Close" : "Write a review"}
          </button>
        </div>

        {reviewCount > 0 && (
          <div className="sp-reviews-summary">
            <div className="sp-rs-num">
              <div className="sp-rs-avg">{averageRating.toFixed(1)}</div>
              <div className="sp-rs-stars">{"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}</div>
              <div className="sp-rs-count">Based on {reviewCount} review{reviewCount === 1 ? "" : "s"}</div>
            </div>
            <div className="sp-rs-bars">
              {distribution.map((d) => (
                <div key={d.stars} className="sp-rs-bar-row">
                  <span>{d.stars} star{d.stars === 1 ? "" : "s"}</span>
                  <div className="sp-rs-bar-track">
                    <div className="sp-rs-bar-fill" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {formOpen && (
          <div className="sp-review-form-wrap">
            {isLoggedIn ? (
              success ? (
                <p className="sp-review-success">Thanks — your review has been posted.</p>
              ) : (
                <form className="sp-review-form" onSubmit={handleSubmit}>
                  <h3>Write a review</h3>
                  <div className="sp-review-star-input" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        className={`star-btn${n <= rating ? " active" : ""}`}
                        onClick={() => setRating(n)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your experience with this product…"
                    rows={4}
                  />
                  {error && <p className="sp-review-error">{error}</p>}
                  <button type="submit" className="btn-filled" disabled={submitting}>
                    {submitting ? "Posting…" : "Post Review"}
                  </button>
                </form>
              )
            ) : (
              <p className="sp-review-login-prompt">
                <a href="/login">Sign in</a> to write a review.
              </p>
            )}
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div className="sp-review-grid">
            {reviews.map((r) => (
              <div key={r.id} className="sp-review-card">
                <div className="sp-review-top">
                  {r.avatarUrl ? (
                    <Image src={r.avatarUrl} alt={r.author} width={38} height={38} className="sp-review-avatar" />
                  ) : (
                    <div className="sp-review-avatar-fallback" style={{ background: avatarTone(r.author) }}>
                      {r.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="sp-review-name">{r.author}</div>
                    <div className="sp-review-date">{timeAgo(r.date)}</div>
                  </div>
                </div>
                <div className="sp-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                <p className="sp-review-text">{r.content}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && reviewCount === 0 && !formOpen && (
          <p className="sp-reviews-empty">No reviews yet — be the first.</p>
        )}
      </div>
    </section>
  );
}
