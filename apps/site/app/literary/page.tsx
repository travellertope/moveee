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

const SHELF_GRADIENT = "linear-gradient(150deg, #17130f, #7a241c 65%, #8b4d2e 140%)";

// Rebuilt from the approved Granta-inspired mockup — every section below is
// wired to real getLiteraryPieces() data; sections the mockup showed that
// have no real backing data (print-issue volumes, back-catalogue pricing)
// were adapted to what the CMS actually models: a "Browse by Section" shelf
// of the six real genre archives instead of fabricated past issues, and a
// submissions spotlight in place of the print-issue plug.
export default async function LiteraryLandingPage() {
  const [pieces, translations] = await Promise.all([
    getLiteraryPieces(undefined, 12),
    getLiteraryPieces("translation", 6),
  ]);

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
    gradient: SHELF_GRADIENT,
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
