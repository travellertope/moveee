import Link from "next/link";
import {
  getLiteraryPieces,
  literaryGenreOfPost,
  LITERARY_GENRES,
} from "@/lib/wp";
import LiteraryPieceCard from "@/components/LiteraryPieceCard";
import LiteraryHeroCarousel, { LiteraryHeroSlide } from "@/components/LiteraryHeroCarousel";
import LiteraryShelf, { LiteraryShelfItem } from "@/components/LiteraryShelf";
import { decodeHtml } from "@/lib/decode-html";

function plainExcerpt(html: string | undefined | null, max = 220): string {
  if (typeof html !== "string") return "";
  const text = decodeHtml(html);
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

// A one-time "start the homepage fresh" reset, per explicit request — the
// homepage's own story pools (hero/Latest/In Translation/More From) only
// ever show pieces published on or after this date; nothing published
// before it deletes/unpublishes anything, and every earlier piece is still
// fully reachable via its own genre archive (/literary/{genre}), a direct
// link, and search/sitemap — this filter touches nothing but which pieces
// this one page's own pools pick from. GET_STORIES has no explicit
// `orderby` and WordPress's own default post ordering is date DESC, so a
// plain first-N fetch is already newest-first — filtering after the fetch
// (rather than passing a date arg into the query) never risks an older
// post displacing a newer one, it just trims the already-sorted list at
// the cutoff. Not a rolling window (e.g. "last 7 days") — deliberately a
// fixed date, so the homepage doesn't go back to empty during a slow week.
const LITERARY_HOMEPAGE_CUTOFF = new Date("2026-09-14T00:00:00Z");

// Rebuilt from the approved Granta-inspired mockup — every section below is
// wired to real getLiteraryPieces() data; sections the mockup showed that
// have no real backing data (print-issue volumes, back-catalogue pricing)
// were adapted to what the CMS actually models: a "Browse by Section" shelf
// of the six real genre archives instead of fabricated past issues, and a
// submissions spotlight in place of the print-issue plug.
export default async function LiteraryLandingPage() {
  const [piecesRaw, translationsRaw] = await Promise.all([
    getLiteraryPieces(undefined, 12),
    getLiteraryPieces("translation", 6),
  ]);

  const pieces = piecesRaw.filter((p: any) => new Date(p.date) >= LITERARY_HOMEPAGE_CUTOFF);
  const translations = translationsRaw.filter(
    (p: any) => new Date(p.date) >= LITERARY_HOMEPAGE_CUTOFF
  );

  const heroPieces = pieces.slice(0, 3);
  const usedSlugs = new Set(heroPieces.map((p: any) => p.slug));

  const latest = pieces.filter((p: any) => !usedSlugs.has(p.slug)).slice(0, 6);
  latest.forEach((p: any) => usedSlugs.add(p.slug));

  const translationPieces = translations.filter((p: any) => !usedSlugs.has(p.slug)).slice(0, 6);
  translationPieces.forEach((p: any) => usedSlugs.add(p.slug));

  const more = pieces.filter((p: any) => !usedSlugs.has(p.slug)).slice(0, 3);

  const heroSlides: LiteraryHeroSlide[] = heroPieces.map((p: any) => ({
    slug: p.slug,
    title: p.title || "",
    author: p.author?.node?.name || "The Moveee Literary",
    excerpt: plainExcerpt(p.excerpt),
    genreLabel: literaryGenreOfPost(p)?.label || "The Moveee Literary",
    imageUrl: p.featuredImage?.node?.sourceUrl || null,
  }));

  const shelfItems: LiteraryShelfItem[] = LITERARY_GENRES.map((g) => ({
    href: `/literary/${g.slug}`,
    label: g.label,
    sub: g.label.slice(0, 3).toUpperCase(),
    slug: g.slug,
  }));

  return (
    <div>
      {heroSlides.length > 0 ? (
        <LiteraryHeroCarousel slides={heroSlides} />
      ) : (
        <div className="lit-wrap">
          <div className="lit-empty">
            <p>
              New work is coming soon. Check back shortly — or be part of it yourself.
            </p>
            <Link className="lit-btn-primary" href="/literary/submit">
              Submit Your Work
            </Link>
          </div>
        </div>
      )}

      {latest.length > 0 && (
        <section className="lit-section">
          <div className="lit-wrap">
            <div className="lit-section-head">
              <h2>Latest From The Moveee Literary</h2>
            </div>
            <div className="lit-grid">
              {latest.slice(0, 3).map((piece: any) => (
                <LiteraryPieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
            {latest.length > 3 && (
              <div className="lit-grid lit-grid--divided" style={{ marginTop: 34 }}>
                {latest.slice(3, 6).map((piece: any) => (
                  <LiteraryPieceCard key={piece.slug} piece={piece} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {translationPieces.length > 0 && (
        <section className="lit-section lit-band">
          <div className="lit-wrap">
            <div className="lit-section-head">
              <h2>In Translation: A Rotating Table</h2>
              <Link href="/literary/translation" className="lit-view-all">
                All translations →
              </Link>
            </div>
            <div className="lit-grid">
              {translationPieces.slice(0, 3).map((piece: any) => (
                <LiteraryPieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
            {translationPieces.length > 3 && (
              <div className="lit-grid lit-grid--divided" style={{ marginTop: 34 }}>
                {translationPieces.slice(3, 6).map((piece: any) => (
                  <LiteraryPieceCard key={piece.slug} piece={piece} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="lit-section">
          <div className="lit-wrap">
            <div className="lit-section-head">
              <h2>More From The Moveee Literary</h2>
            </div>
            <div className="lit-grid">
              {more.map((piece: any) => (
                <LiteraryPieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="lit-section">
        <div className="lit-wrap">
          <div className="lit-plug">
            <div className="lit-plug-cover">
              <span className="lit-plug-cover-label">Submissions</span>
              <span className="lit-plug-cover-title">Open</span>
            </div>
            <div>
              <div className="lit-tag">Now Reading</div>
              <h3>We&rsquo;re reading fiction, poetry, essays, conversations and translation.</h3>
              <p>
                We read on a rolling basis and publish new work continuously. Voice-driven,
                specific, and finished — that&rsquo;s what we&rsquo;re looking for.
              </p>
              <div className="lit-plug-cta">
                <Link href="/literary/submit" className="lit-btn-primary">
                  Read the Guidelines
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lit-section" style={{ paddingTop: 8 }}>
        <div className="lit-wrap">
          <div className="lit-section-head">
            <h2>Browse by Section</h2>
          </div>
          <LiteraryShelf items={shelfItems} />
        </div>
      </section>
    </div>
  );
}
