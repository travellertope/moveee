import Link from "next/link";
import { getLiteraryPieces, LITERARY_GENRES } from "@/lib/wp";
import LiteraryPieceCard from "@/components/LiteraryPieceCard";

// Same defensive shape as apps/site/app/page.tsx's loadHomeSections() —
// a CMS hiccup should degrade to an empty grid + genre nav, never take the
// whole page down. getLiteraryPieces() already swallows its own errors.
export default async function LiteraryLandingPage() {
  const pieces = await getLiteraryPieces(undefined, 9);

  return (
    <div className="lit-wrap">
      <section className="lit-hero" id="top">
        <div className="lit-eyebrow">A Quarterly Literary Supplement</div>
        <h1>The Moveee Literary</h1>
        <p className="lit-sub">
          New poetry, fiction, nonfiction, and translation — published alongside every print
          quarterly, read here first.
        </p>
        <div className="lit-hero-ctas">
          <a className="lit-btn-primary" href="#latest">
            Read the latest
          </a>
          <Link className="lit-btn-ghost" href="/literary/submit">
            Submit your work
          </Link>
        </div>
      </section>

      <section className="lit-genre-grid" aria-label="Browse by genre">
        {LITERARY_GENRES.map((genre) => (
          <Link key={genre.slug} href={`/literary/${genre.slug}`} className={`lit-genre-tile lit-${genre.slug}`}>
            <h3>{genre.label}</h3>
            <p>{genre.tagline}</p>
            <span className="lit-genre-arrow">Read {genre.label} →</span>
          </Link>
        ))}
      </section>

      <section className="lit-section" id="latest">
        <div className="lit-section-head">
          <h2>Latest From The Moveee Literary</h2>
        </div>
        {pieces.length > 0 ? (
          <div className="lit-grid">
            {pieces.map((piece: any) => (
              <LiteraryPieceCard key={piece.slug} piece={piece} />
            ))}
          </div>
        ) : (
          <div className="lit-empty">
            <p>
              New work is coming with our next quarterly edition. Check back soon — or be part of
              it yourself.
            </p>
            <Link className="lit-btn-primary" href="/literary/submit">
              Submit your work
            </Link>
          </div>
        )}
      </section>

      <section className="mg-cta-section">
        <div className="mg-cta-band">
          <div className="mg-cta-left">
            <div className="mg-cta-label">We're Reading</div>
            <h3>Submit poetry, fiction, nonfiction, or translation.</h3>
            <p className="mg-cta-note">We read on a rolling quarterly basis, in step with every print edition.</p>
          </div>
          <div className="mg-cta-right">
            <Link className="mg-cta-btn" href="/literary/submit">
              Submission Guidelines →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
