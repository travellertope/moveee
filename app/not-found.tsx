import Link from "next/link";
import "./not-found.css";

export default function NotFound() {
  return (
    <section className="nf-container">
      {/* Large decorative background text */}
      <div className="nf-bg-text">404</div>
      
      <div className="nf-content">
        <div className="nf-label">Lost in Culture</div>
        <h1 className="nf-title">
          Page <em>Not Found</em>
        </h1>
        <p className="nf-desc">
          Whatever you were looking for seems to have drifted beyond our current borders. 
          The story might have been moved, or perhaps it hasn't been written yet.
        </p>
        
        <div className="nf-actions">
          <Link href="/" className="nf-btn primary">
            Back to Home
          </Link>
          <Link href="/magazine" className="nf-btn">
            Explore Magazine
          </Link>
        </div>
      </div>
    </section>
  );
}
