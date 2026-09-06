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
import LiteraryPieceCard from "@/components/LiteraryPieceCard";

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

  const plainExcerpt = typeof post.excerpt === "string" ? post.excerpt.replace(/<[^>]*>/g, "").slice(0, 160) : "";
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
  const pieces = await getLiteraryPieces(genre.categorySlug, 24);

  return (
    <div className={`lit-wrap lit-${genre.slug}`}>
      <section className="lit-genre-head">
        <div className="lit-eyebrow">The Moveee Literary</div>
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
              New {genre.label.toLowerCase()} is coming with our next quarterly edition. Check
              back soon — or submit your own.
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

  let moreFromGenre: any[] = [];
  if (genre) {
    const genrePieces = await getLiteraryPieces(genre.categorySlug, 8);
    moreFromGenre = genrePieces.filter((p: any) => p.slug !== slug).slice(0, 3);
  }

  return (
    <div className={`lit-piece-wrap${genre ? ` lit-${genre.slug}` : ""}`}>
      <article>
        {genre && (
          <Link className="lit-piece-kicker" href={`/literary/${genre.slug}`}>
            {genre.label}
          </Link>
        )}
        <h1 className="lit-piece-title" dangerouslySetInnerHTML={{ __html: post.title || "" }} />
        <div className="lit-piece-byline">
          {post.author?.node?.name ? `By ${post.author.node.name}` : "The Moveee Literary"} · {publishedDate}
        </div>
        <div
          className="lit-piece-body"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
        />
      </article>

      {moreFromGenre.length > 0 && genre && (
        <section className="lit-piece-more">
          <h2>More {genre.label}</h2>
          <div className="lit-grid">
            {moreFromGenre.map((piece: any) => (
              <LiteraryPieceCard key={piece.slug} piece={piece} />
            ))}
          </div>
        </section>
      )}
    </div>
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
