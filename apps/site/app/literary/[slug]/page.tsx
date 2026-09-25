import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getWPData,
  GET_STORY_BY_SLUG,
  getLiteraryGenre,
  getLiteraryPieces,
  isLiteraryPost,
  literaryGenreOfPost,
  LITERARY_GENRES,
  filterLiteraryCutoff,
} from "@/lib/wp";
import { getAccessLevel } from "@/lib/access";
import {
  LITERARY_TOKEN_COOKIE,
  LITERARY_READS_COOKIE,
  LITERARY_FREE_READ_LIMIT,
  isCrawlerUserAgent,
  parseReadsCookie,
  verifyLiteraryToken,
  truncateHtmlByPercent,
} from "@/lib/literary-access";
import { sanitizeHtml } from "@/lib/sanitize";
import { decodeHtml } from "@/lib/decode-html";
import LiteraryPieceCard from "@/components/LiteraryPieceCard";
import LiteraryPieceGate from "@/components/LiteraryPieceGate";
import LiteraryReadTracker from "@/components/LiteraryReadTracker";
import LiteraryComments from "@/components/LiteraryComments";
import SubscribeForm from "@/components/SubscribeForm";
import ArticleShareFab from "@/components/ArticleShareFab";

const LITERARY_READ_PERCENT = 0.3;

// One dynamic segment serves two different things — a genre archive
// (/literary/poetry) or a single piece (/literary/some-poem-slug) — since
// Next.js doesn't allow two sibling routes with different dynamic-segment
// names at the same level (app/literary/[genre] next to app/literary/[slug]
// is a build error: "different slug names for the same dynamic path").
// LITERARY_GENRES.slug values are checked first; anything else falls
// through to a real post lookup.
//
// PiecePage calls cookies()/headers()/getServerSession() for anonymous
// access-gating (see "Access:" below) — combined with generateStaticParams
// existing on this route (for the six genre paths), Next.js's on-demand
// render for an unlisted param (a real piece slug) throws DYNAMIC_SERVER_USAGE
// as a real, uncaught 500 instead of silently falling back to per-request
// dynamic rendering (a known App Router gotcha when generateStaticParams and
// Dynamic APIs coexist on one route — confirmed live via Vercel logs: every
// /literary/{slug} request from an anonymous, non-token reader 500'd with
// this exact digest, since only that gating branch touches cookies()).
// Forcing the whole route dynamic sidesteps it — same fix already used
// elsewhere in this codebase for the same reason, see app/[edition]/page.tsx.
// Genre archive pages already fetch fresh data every request anyway, so
// there's no loss from skipping static generation for them too.
export const dynamic = "force-dynamic";

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
  const pieces = filterLiteraryCutoff(await getLiteraryPieces(genre.tagSlug, 24));

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

  // ── Access: fold Literary Pro-gating into the existing Moveee Pro
  // mechanism (culture_access taxonomy), and meter free reads for
  // anonymous visitors — see the Literary gating notes in CLAUDE.md and
  // lib/literary-access.ts. Crawlers always get the full piece: this is a
  // soft paywall for list-building, not a wall against being indexed.
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const hdrs = await headers();
  const isBot = isCrawlerUserAgent(hdrs.get("user-agent"));
  const isLoggedIn = !!session?.user;
  const isPatron = session?.user?.tier === "patron";
  // Moveee Lit grants full access to everything in this section — see
  // CLAUDE.md's "Three-tier membership" section. It never unlocks anything
  // outside /literary (Magazine's own patron-only gate stays strictly
  // "patron"-only, untouched by this tier).
  const isLit = session?.user?.tier === "lit";
  const accessLevel = getAccessLevel(post);
  const litToken = verifyLiteraryToken(cookieStore.get(LITERARY_TOKEN_COOKIE)?.value);
  const hasLiteraryFullAccess =
    isPatron || isLit || litToken?.access === "pro" || litToken?.access === "lit";

  const bodyHtml = sanitizeHtml(post.content || "");
  let visibleBodyHtml = bodyHtml;
  let trailingBodyHtml = "";
  let gateBlock: React.ReactNode = null;
  let shouldTrackRead = false;

  if (!isBot) {
    if (accessLevel === "patron-only") {
      if (!hasLiteraryFullAccess) {
        const { visibleHtml, hasMore } = truncateHtmlByPercent(bodyHtml, LITERARY_READ_PERCENT);
        if (hasMore) {
          visibleBodyHtml = visibleHtml;
          gateBlock = isLoggedIn ? (
            <div className="lit-email-gate">
              <div className="lit-gate-eyebrow">★ Subscribe to Continue</div>
              <h3>There&rsquo;s more to read.</h3>
              <p>
                This piece continues in the archive — extended fiction, poetry, and essays for
                members going further with The Moveee Literary.
              </p>
              <Link className="lit-btn-pill lit-btn-pill--fill" href="/register?upgrade=lit">
                Upgrade to Moveee Lit →
              </Link>
            </div>
          ) : (
            <LiteraryPieceGate slug={slug} mode="pro" blocking />
          );
        }
      }
    } else if (!isLoggedIn && !litToken) {
      const reads = parseReadsCookie(cookieStore.get(LITERARY_READS_COOKIE)?.value);
      const hasFreeReadsLeft =
        reads.length < LITERARY_FREE_READ_LIMIT || reads.some((r) => r.slug === slug);

      if (hasFreeReadsLeft) {
        shouldTrackRead = true;
        const { visibleHtml, remainderHtml, hasMore } = truncateHtmlByPercent(
          bodyHtml,
          LITERARY_READ_PERCENT
        );
        if (hasMore) {
          visibleBodyHtml = visibleHtml;
          trailingBodyHtml = remainderHtml;
          gateBlock = <LiteraryPieceGate slug={slug} mode="meter" blocking={false} />;
        }
      } else {
        const { visibleHtml, hasMore } = truncateHtmlByPercent(bodyHtml, LITERARY_READ_PERCENT);
        if (hasMore) {
          visibleBodyHtml = visibleHtml;
          gateBlock = <LiteraryPieceGate slug={slug} mode="meter" blocking />;
        }
      }
    }
  }

  // Feeds the closing "More In {genre}" grid — the sidebar's own "Browse by
  // Section" nav + genre teaser was removed (the top nav already covers the
  // same six genres), so the whole genre-scoped pool goes to that grid now
  // instead of reserving its first pick for a sidebar teaser.
  let genrePool: any[] = [];
  if (genre) {
    genrePool = filterLiteraryCutoff(await getLiteraryPieces(genre.tagSlug, 8)).filter(
      (p: any) => p.slug !== slug
    );
  }
  const moreFromGenre = genrePool.slice(0, 3);

  const usedSlugs = new Set([slug, ...moreFromGenre.map((p: any) => p.slug)].filter(Boolean));
  const widerPool = filterLiteraryCutoff(await getLiteraryPieces(undefined, 12));
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
      </div>

      <div className="lit-piece-layout">
        <article className="lit-piece-body-col">
          {post.featuredImage?.node?.sourceUrl && (
            <img
              className="lit-piece-featured-img"
              src={post.featuredImage.node.sourceUrl}
              alt={post.featuredImage.node.altText || ""}
            />
          )}
          {shouldTrackRead && <LiteraryReadTracker slug={slug} />}
          <div className="lit-piece-body" dangerouslySetInnerHTML={{ __html: visibleBodyHtml }} />
          {gateBlock}
          {trailingBodyHtml && (
            <div className="lit-piece-body" dangerouslySetInnerHTML={{ __html: trailingBodyHtml }} />
          )}
          {post.author?.node?.name && (
            <div className="lit-piece-author">
              <div className="lit-piece-author-avatar">
                {post.author.node.avatar?.url ? (
                  <img src={post.author.node.avatar.url} alt={post.author.node.name} />
                ) : (
                  <span className="lit-piece-author-initial">
                    {post.author.node.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="lit-piece-author-info">
                <div className="lit-piece-author-label">Written by</div>
                <div className="lit-piece-author-name">{post.author.node.name}</div>
                <p className="lit-piece-author-bio">
                  {post.author.node.description || "Contributing writer, The Moveee Literary."}
                </p>
              </div>
            </div>
          )}

          <LiteraryComments postId={post.databaseId} canComment={hasLiteraryFullAccess} />
        </article>

        <ArticleShareFab />

        <aside>
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
