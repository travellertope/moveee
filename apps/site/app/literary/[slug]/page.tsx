import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getWPData,
  GET_STORY_BY_SLUG,
  getLiteraryGenre,
  getLiteraryPieces,
  isLiteraryPost,
  literaryGenreOfPost,
  LITERARY_GENRES,
} from "@/lib/wp";
import { sanitizeHtml } from "@/lib/sanitize";
import { decodeHtml } from "@/lib/decode-html";
import LiteraryPieceCard from "@/components/LiteraryPieceCard";
import SubscribeForm from "@/components/SubscribeForm";

// One dynamic segment serves two different things — a genre archive
// (/literary/poetry) or a single piece (/literary/some-poem-slug) — since
// Next.js doesn't allow two sibling routes with different dynamic-segment
// names at the same level (app/literary/[genre] next to app/literary/[slug]
// is a build error: "different slug names for the same dynamic path").
// LITERARY_GENRES.slug values are checked first; anything else falls
// through to a real post lookup.

export async function generateStaticParams() {
  return LITERARY_GENRES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genre = getLiteraryGenre(slug);
  if (genre) {
    return {
      title: `${genre.label} | The Moveee Literary`,
      description: genre.tagline,
    };
  }

  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug });
  } catch {}
  const post = data?.post;
  if (!post || !isLiteraryPost(post)) {
    return { title: { absolute: "The Moveee Literary" } };
  }

  const plainExcerpt = typeof post.excerpt === "string" ? decodeHtml(post.excerpt).slice(0, 160) : "";
  const genreOfPost = literaryGenreOfPost(post);
  const metaTitle = `${post.title} | The Moveee Literary`;
  const metaDescription = post.seoDescription?.trim() || plainExcerpt;
  const imageUrl = post.featuredImage?.node?.sourceUrl || "/og-fallback.png";

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      siteName: "Moveee Magazine",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
    },
    other: genreOfPost ? { "article:section": genreOfPost.label } : undefined,
  };
}

async function GenreArchive({ genre }: { genre: NonNullable<ReturnType<typeof getLiteraryGenre>> }) {
  const pieces = await getLiteraryPieces(genre.tagSlug, 24);

  return (
    <div className="lit-wrap">
      <section className="lit-genre-head">
        <h1>{genre.label}</h1>
        <p className="lit-sub">{genre.tagline}</p>
        <nav className="lit-genre-pills" aria-label="Genres">
          {LITERARY_GENRES.map((g) => (
            <Link
              key={g.slug}
              href={`/literary/${g.slug}`}
              className={`lit-genre-pill${g.slug === genre.slug ? " lit-genre-pill--active" : ""}`}
            >
              {g.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="lit-section">
        {pieces.length > 0 ? (
          <div className="lit-grid">
            {pieces.map((piece: any) => (
              <LiteraryPieceCard key={piece.slug} piece={piece} />
            ))}
          </div>
        ) : (
          <div className="lit-empty">
            <p>
              New {genre.label.toLowerCase()} is coming soon. Check back shortly — or submit your
              own.
            </p>
            <Link className="lit-btn-primary" href="/literary/submit">
              Submit your work
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

async function PiecePage({ slug }: { slug: string }) {
  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug });
  } catch {}
  const post = data?.post;

  if (!post || !isLiteraryPost(post)) {
    notFound();
  }

  const genre = literaryGenreOfPost(post);
  const publishedDate = new Date(post.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const authorName = post.author?.node?.name || "The Moveee Literary";
  const pieceUrl = `https://themoveee.com/literary/${slug}`;
  const plainTitle = decodeHtml(post.title || "");

  // Sidebar's "also in {genre}" teaser and the closing grid share one
  // genre-scoped pool, deduped by slug so the same piece never appears in
  // both places — the sidebar pick is excluded from the grid below it.
  let genrePool: any[] = [];
  if (genre) {
    genrePool = (await getLiteraryPieces(genre.tagSlug, 8)).filter((p: any) => p.slug !== slug);
  }
  const sidebarPick = genrePool[0];
  const moreFromGenre = genrePool.slice(1, 4);

  const usedSlugs = new Set(
    [slug, sidebarPick?.slug, ...moreFromGenre.map((p: any) => p.slug)].filter(Boolean)
  );
  const widerPool = await getLiteraryPieces(undefined, 12);
  const alsoLike = widerPool.filter((p: any) => !usedSlugs.has(p.slug)).slice(0, 3);

  return (
    <>
      <div className="lit-wrap lit-piece-header">
        {genre && (
          <Link className="lit-piece-kicker" href={`/literary/${genre.slug}`}>
            {genre.label}
          </Link>
        )}
        <h1 className="lit-piece-title" dangerouslySetInnerHTML={{ __html: post.title || "" }} />
        <div className="lit-piece-byline">
          By <b>{authorName}</b> · {publishedDate}
        </div>
        {/* A first sketch of the brand guide's own signature motif (§11 — a
            curved oxblood/gold line), used here as the divider under the
            title block instead of a plain rule. */}
        <div className="lit-piece-motif" aria-hidden="true">
          <svg width="150" height="20" viewBox="0 0 150 20" fill="none">
            <path
              d="M2 16C28 16 34 2 60 2C86 2 92 16 118 16C130 16 136 10 148 10"
              stroke="url(#lit-motif-gradient)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="lit-motif-gradient" x1="0" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7A241C" />
                <stop offset="1" stopColor="#B88942" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="lit-piece-layout">
        <article className="lit-piece-body-col">
          <div
            className="lit-piece-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
          />
          <div className="lit-piece-share">
            <span className="lit-piece-share-label">Share</span>
            <div className="lit-piece-share-icons">
              <a
                href={`mailto:?subject=${encodeURIComponent(plainTitle)}&body=${encodeURIComponent(pieceUrl)}`}
                aria-label="Share by email"
              >
                ✉
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(plainTitle)}&url=${encodeURIComponent(pieceUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
              >
                𝕏
              </a>
            </div>
          </div>
        </article>

        <aside>
          <div className="lit-piece-sb-block">
            <div className="lit-piece-sb-h">Browse by Section</div>
            {LITERARY_GENRES.map((g) => {
              const isCurrent = genre?.slug === g.slug;
              return (
                <div key={g.slug}>
                  <Link
                    href={`/literary/${g.slug}`}
                    className={`lit-piece-genre-row${isCurrent ? " is-current" : ""}`}
                  >
                    <span>{g.label}</span>
                    <span className="chev">›</span>
                  </Link>
                  {isCurrent && sidebarPick && (
                    <Link href={`/literary/${sidebarPick.slug}`} className="lit-piece-genre-pick">
                      <div className="piece-title" dangerouslySetInnerHTML={{ __html: sidebarPick.title || "" }} />
                      <div className="piece-byline">{sidebarPick.author?.node?.name || "The Moveee Literary"}</div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lit-piece-sb-block lit-piece-sb-block--flush">
            <div className="lit-piece-subscribe">
              <div className="lit-piece-subscribe-rule" />
              <h3>Read what we publish, as we publish it.</h3>
              <p>New fiction, poetry, essays and translation — straight to your inbox, no charge.</p>
              <div className="lit-nl-form">
                <SubscribeForm
                  placeholder="Email address"
                  buttonLabel="Join"
                  inputClassName="lit-nl-input"
                  buttonClassName="lit-nl-btn"
                  list="culture-drop"
                />
              </div>
            </div>
          </div>

          {alsoLike.length > 0 && (
            <div className="lit-piece-sb-block lit-piece-sb-block--last">
              <div className="lit-piece-sb-h">You Might Also Like</div>
              {alsoLike.map((p: any) => {
                const pGenre = literaryGenreOfPost(p);
                const img = p.featuredImage?.node?.sourceUrl as string | undefined;
                return (
                  <Link key={p.slug} href={`/literary/${p.slug}`} className="lit-piece-also-row">
                    {img ? (
                      <img className="lit-piece-also-img" src={img} alt="" />
                    ) : (
                      <div className="lit-piece-also-img lit-piece-also-img--placeholder" aria-hidden="true" />
                    )}
                    <div>
                      <div className="lit-piece-also-tag">{pGenre?.label || "The Moveee Literary"}</div>
                      <div className="lit-piece-also-title" dangerouslySetInnerHTML={{ __html: p.title || "" }} />
                      <div className="lit-piece-also-byline">{p.author?.node?.name || "The Moveee Literary"}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Replaces a paywall/sign-in gate this section doesn't have with a
          real, honest subscribe CTA — see the "SINGLE PIECE — NEWSLETTER
          BREAK" comment in literary.css. */}
      <div className="lit-band lit-piece-nlbreak">
        <div className="lit-wrap lit-piece-nlbreak-inner">
          <div>
            <h3>Enjoyed this piece?</h3>
            <p>Get new fiction, poetry, essays and translation the moment we publish it — no charge, no clutter.</p>
          </div>
          <div className="lit-piece-nlbreak-form">
            <SubscribeForm
              placeholder="Email address"
              buttonLabel="Subscribe"
              list="culture-drop"
            />
          </div>
        </div>
      </div>

      {moreFromGenre.length > 0 && genre && (
        <section className="lit-section">
          <div className="lit-wrap">
            <div className="lit-section-head">
              <h2>More In {genre.label}</h2>
              <Link href={`/literary/${genre.slug}`} className="lit-view-all">
                All {genre.label} →
              </Link>
            </div>
            <div className="lit-grid">
              {moreFromGenre.map((piece: any) => (
                <LiteraryPieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default async function LiterarySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genre = getLiteraryGenre(slug);

  if (genre) {
    return <GenreArchive genre={genre} />;
  }

  return <PiecePage slug={slug} />;
}
