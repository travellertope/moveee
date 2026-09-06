import Link from "next/link";
import { getLiteraryPieces, LITERARY_GENRES } from "@/lib/wp";
import LiteraryPieceCard from "@/components/LiteraryPieceCard";
import LiteraryLogo from "@/components/LiteraryLogo";

// Per the brand guide's homepage design principle (§14): masthead + tagline
// + one inline section line + a single CTA — deliberately not "ten
// competing menus". The genre grid below is the one intentional exception
// (it's the section index, not a nav duplication) and links use the
// section's own tagline copy from LITERARY_GENRES, never invented text.
export default async function LiteraryLandingPage() {
  const pieces = await getLiteraryPieces(undefined, 9);

  return (
    <div className="lit-wrap">
      <section className="lit-hero" id="top">
        <div className="lit-hero-lockup">
          <LiteraryLogo />
        </div>
        <h1>Writing that shapes the world.</h1>
        <p className="lit-sub">
          An international home for fiction, poetry, essays, conversations and translated
          literature, published continuously by The Moveee.
        </p>
        <nav className="lit-hero-nav" aria-label="Browse by section">
          {LITERARY_GENRES.filter((g) => g.slug !== "notes").map((g, i) => (
            <span key={g.slug}>
              {i > 0 && <span className="lit-hero-nav-dot">·</span>}
              <Link href={`/literary/${g.slug}`}>{g.label}</Link>
            </span>
          ))}
        </nav>
        <div className="lit-hero-ctas">
          <a className="lit-btn-primary" href="#latest">
            Read the Latest →
          </a>
          <Link className="lit-btn-ghost" href="/literary/submit">
            Submit Your Work
          </Link>
        </div>
      </section>

      <section className="lit-promise">
        <p className="lit-promise-quote">
          &ldquo;We publish writing that stays with you — stories, poems and essays built to
          outlast the moment they were written in.&rdquo;
        </p>
      </section>

      <section className="lit-section" aria-label="Browse by section">
        <div className="lit-section-head">
          <h2>The Sections</h2>
        </div>
        <div className="lit-genre-grid">
          {LITERARY_GENRES.map((genre) => (
            <Link key={genre.slug} href={`/literary/${genre.slug}`} className="lit-genre-tile">
              <h3>{genre.label}</h3>
              <p>{genre.tagline}</p>
              <span className="lit-genre-arrow">Read {genre.label} →</span>
            </Link>
          ))}
        </div>
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
              Submit Your Work
            </Link>
          </div>
        )}
      </section>

      <section className="lit-cta-section">
        <div className="lit-cta-band">
          <h3>We&rsquo;re reading. Submit poetry, fiction, nonfiction, conversations or translation.</h3>
          <p>We read on a rolling basis and publish new work continuously.</p>
          <Link className="lit-btn-primary" href="/literary/submit">
            Submission Guidelines →
          </Link>
        </div>
      </section>
    </div>
  );
}
