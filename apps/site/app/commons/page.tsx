import Link from "next/link";
import {
  getCommonsPieces,
  getCommonsCategoryPieces,
  commonsPieceHref,
  commonsSectionOfPost,
  COMMONS_SECTIONS,
} from "@/lib/wp";
import CommonsPieceCard from "@/components/CommonsPieceCard";
import SubscribeForm from "@/components/SubscribeForm";
import { decodeHtml } from "@/lib/decode-html";

function plainExcerpt(html: string | undefined | null, max = 220): string {
  if (typeof html !== "string") return "";
  const text = decodeHtml(html);
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

function formattedDate(date: string | undefined | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Homepage for The Moveee Commons, built from the approved Artifact mockup
// — see CLAUDE.md's "The Moveee Commons" entry. Hero and grid are
// deliberately text-first: a photo renders only when a piece actually has
// one, never a placeholder standing in for a missing image. Pulls from
// getCommonsPieces() (the "commons" category unioned with every Basit
// Jamiu byline, including guest-bylined pieces — see that function's doc
// comment in wp.ts).
export default async function CommonsLandingPage() {
  const [pieces, reportsRaw] = await Promise.all([
    getCommonsPieces(24),
    getCommonsCategoryPieces("reports", 3),
  ]);

  const hero = pieces[0];
  const latest = pieces.slice(1, 7);
  const reports = reportsRaw.filter((p: any) => p.slug !== hero?.slug);

  if (!hero) {
    return (
      <div className="comm-wrap">
        <div className="comm-empty">
          <p>New reporting is coming soon. Check back shortly.</p>
        </div>
      </div>
    );
  }

  const heroSection = commonsSectionOfPost(hero);
  const heroImageUrl = hero.featuredImage?.node?.sourceUrl as string | undefined;
  const heroAuthorName = hero.author?.node?.name || "The Moveee Commons";
  const heroAvatarUrl = hero.author?.node?.avatar?.url as string | undefined;

  return (
    <div>
      <section className="comm-hero">
        <div className="comm-wrap">
          <Link className="comm-hero-kicker" href={heroSection ? `/commons/${heroSection.slug}` : "/commons"}>
            {heroSection?.label || "The Moveee Commons"}
          </Link>
          <h1 className="comm-hero-title">
            <Link href={commonsPieceHref(hero)}>
              <span dangerouslySetInnerHTML={{ __html: hero.title || "" }} />
            </Link>
          </h1>
          <p className="comm-hero-standfirst">{plainExcerpt(hero.excerpt, 240)}</p>
          {heroImageUrl && (
            <img className="comm-hero-image" src={heroImageUrl} alt={hero.featuredImage?.node?.altText || ""} />
          )}
          <div className="comm-hero-byline">
            <div className="comm-hero-avatar">
              {heroAvatarUrl ? (
                <img src={heroAvatarUrl} alt={heroAuthorName} />
              ) : (
                heroAuthorName.charAt(0)
              )}
            </div>
            <div className="comm-hero-byline-text">
              <span className="comm-hero-byline-name">{heroAuthorName}</span>
              <span className="comm-hero-byline-meta">{formattedDate(hero.date)}</span>
            </div>
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="comm-section">
          <div className="comm-wrap">
            <div className="comm-section-head">
              <h2>Latest</h2>
            </div>
            <div className="comm-grid">
              {latest.slice(0, 3).map((piece: any) => (
                <CommonsPieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
            {latest.length > 3 && (
              <div className="comm-grid comm-grid--divided" style={{ marginTop: 34 }}>
                {latest.slice(3, 6).map((piece: any) => (
                  <CommonsPieceCard key={piece.slug} piece={piece} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {reports.length > 0 && (
        <section className="comm-section comm-data-band">
          <div className="comm-wrap comm-data-grid">
            <div className="comm-data-copy">
              <h2>Data &amp; Reports</h2>
              <p>
                Original, document-backed investigations — {reports[0].title
                  ? <>starting with &ldquo;{decodeHtml(reports[0].title)}.&rdquo;</>
                  : "the latest from our reporting desk."}
              </p>
              <Link href="/commons/reports" className="comm-btn-primary">
                Read the Reports →
              </Link>
            </div>
            <div>
              {reports.slice(0, 3).map((piece: any) => (
                <div key={piece.slug} style={{ marginBottom: 18 }}>
                  <Link href={commonsPieceHref(piece)} className="comm-card-title" style={{ display: "block" }}>
                    {decodeHtml(piece.title || "")}
                  </Link>
                  <div className="comm-card-byline" style={{ paddingTop: 4 }}>
                    {piece.author?.node?.name || "The Moveee Commons"} · {formattedDate(piece.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="comm-section" style={{ paddingTop: 8 }}>
        <div className="comm-wrap">
          <div className="comm-section-head">
            <h2>Sections</h2>
          </div>
          <div className="comm-shelf">
            {COMMONS_SECTIONS.map((s) => (
              <Link key={s.slug} href={`/commons/${s.slug}`} className="comm-shelf-item">
                <span className="comm-shelf-label">{s.label}</span>
                <span className="comm-shelf-tagline">{s.tagline}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="comm-nl-band">
        <div className="comm-wrap comm-nl-inner">
          <div className="comm-nl-copy">
            <h2>The Commons Briefing</h2>
            <p>Opinion, reports and research — straight to your inbox, no charge.</p>
          </div>
          <div className="comm-nl-form">
            <SubscribeForm
              placeholder="Email address"
              buttonLabel="Subscribe"
              inputClassName="comm-nl-input"
              buttonClassName="comm-nl-btn"
              list="culture-drop"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
