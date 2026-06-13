"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./not-found.css";

export default function Error({
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
      <div className="nf-bg-text">500</div>
      <div className="nf-content">
        <div className="nf-label">Something went wrong</div>
        <h1 className="nf-title">
          A brief <em>interruption</em>
        </h1>
        <p className="nf-desc">
          We hit an unexpected snag loading this page. Our team has been
          notified. Please try again or head back to the magazine.
        </p>
        <div className="nf-actions">
          <button className="nf-btn primary" onClick={reset}>
            Try again
          </button>
          <Link href="/magazine" className="nf-btn">
            Explore Magazine
          </Link>
        </div>
      </div>
    </section>
  );
}
