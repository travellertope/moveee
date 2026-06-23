"use client";
import { useEffect, useState } from "react";
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

export default function ProductReviews({ productId, averageRating, reviewCount }: Props) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="sp-reviews-header">
        <h2>Reviews</h2>
        {reviewCount > 0 ? (
          <div className="sp-reviews-summary">
            <span className="stars">★ {averageRating.toFixed(1)}</span>
            <span className="count">({reviewCount} review{reviewCount === 1 ? "" : "s"})</span>
          </div>
        ) : (
          <div className="sp-reviews-summary">
            <span className="count">No reviews yet — be the first.</span>
          </div>
        )}
      </div>

      {loading ? null : reviews.length > 0 ? (
        <div className="sp-reviews-list">
          {reviews.map((r) => (
            <div key={r.id} className="sp-review">
              <div className="sp-review-head">
                {r.avatarUrl && (
                  <Image src={r.avatarUrl} alt={r.author} width={32} height={32} className="sp-review-avatar" />
                )}
                <span className="sp-review-author">{r.author}</span>
                <span className="sp-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              <p className="sp-review-content">{r.content}</p>
            </div>
          ))}
        </div>
      ) : null}

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
    </section>
  );
}
