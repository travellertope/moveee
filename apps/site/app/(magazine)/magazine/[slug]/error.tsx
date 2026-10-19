"use client";

import { useEffect } from "react";
import Link from "next/link";
import "../../not-found.css";

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="nf-container">
      <div className="nf-bg-text">oops</div>
      <div className="nf-content">
        <div className="nf-label">Article unavailable</div>
        <h1 className="nf-title">
          Couldn't load <em>this story</em>
        </h1>
        <p className="nf-desc">
          We ran into trouble loading this article. It may be a temporary
          hiccup — try again or browse the magazine for other stories.
        </p>
        <div className="nf-actions">
          <button className="nf-btn primary" onClick={reset}>
            Try again
          </button>
          <Link href="/magazine" className="nf-btn">
            Browse Magazine
          </Link>
        </div>
      </div>
    </section>
  );
}
