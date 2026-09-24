import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getWPData,
  GET_STORY_BY_SLUG,
  GET_STORY_GUEST_BYLINE,
  getCommonsSection,
  getCommonsCategoryPieces,
  getCommonsPieces,
  isCommonsPost,
  commonsSectionOfPost,
  commonsPieceHref,
  COMMONS_SECTIONS,
} from "@/lib/wp";
import { sanitizeHtml } from "@/lib/sanitize";
import { decodeHtml } from "@/lib/decode-html";
import CommonsPieceCard from "@/components/CommonsPieceCard";
import SubscribeForm from "@/components/SubscribeForm";
import ArticleShareFab from "@/components/ArticleShareFab";

// One dynamic segment serves two things — a section archive
// (/commons/politics) or a single piece (/commons/some-report-slug) —
// same Next.js constraint and resolution order as /literary/[slug] (see
// that file's own comment): COMMONS_SECTIONS.slug values are checked
// first, anything else falls through to a real post lookup.
export async function generateStaticParams() {
  return COMMONS_SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = getCommonsSection(slug);
  if (section) {
    return {
      title: `${section.label} | The Moveee Commons`,
      description: section.tagline,
    };
  }

  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug });
  } catch {}
  const post = data?.post;
  if (!post || !isCommonsPost(post)) {
    return { title: { absolute: "The Moveee Commons" } };
  }

  const plainExcerpt = typeof post.excerpt === "string" ? decodeHtml(post.excerpt).slice(0, 160) : "";
  const metaTitle = `${decodeHtml(post.title || "")} | The Moveee Commons`;
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
  };
}

function formattedDate(date: string | undefined | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function SectionArchive({ section }: { section: NonNullable<ReturnType<typeof getCommonsSection>> }) {
  const pieces = await getCommonsCategoryPieces(section.tagSlug, 24);

  return (
    <div className="comm-wrap">
      <section className="comm-section-head-plain" style={{ padding: "40px 0 32px" }}>
        <h1>{section.label}</h1>
        <p className="comm-sub">{section.tagline}</p>
        <nav className="comm-section-pills" aria-label="Sections">
          {COMMONS_SECTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/commons/${s.slug}`}
              className={`comm-section-pill${s.slug === section.slug ? " comm-section-pill--active" : ""}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="comm-section" style={{ paddingTop: 0 }}>
        {pieces.length > 0 ? (
          <div className="comm-grid">
            {pieces.map((piece: any) => (
              <CommonsPieceCard key={piece.slug} piece={piece} />
            ))}
          </div>
        ) : (
          <div className="comm-empty">
            <p>New {section.label.toLowerCase()} coverage is coming soon. Check back shortly.</p>
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

  if (!post || !isCommonsPost(post)) {
    notFound();
  }

  // Isolated, best-effort fetch — see GET_STORY_GUEST_BYLINE's own comment
  // in wp.ts for why this can't live inside the main GET_STORY_BY_SLUG
  // query. A Basit Jamiu piece attributed on the page to a guest byline
  // still qualifies for the Commons feed via the real author id (see
  // isCommonsByAuthor in wp.ts) — this only changes what name is shown.
  try {
    const bylineData = await getWPData(GET_STORY_GUEST_BYLINE, { slug });
    if (bylineData?.post?.guestByline) {
      post.guestByline = bylineData.post.guestByline;
    }
  } catch {}

  const guestByline: { name: string; bio?: string | null; avatarUrl?: string | null } | null =
    post.guestByline?.name ? post.guestByline : null;
  const bylineDisplay: React.ReactNode = guestByline
    ? guestByline.name
    : post.asToldTo
    ? <>{post.asToldTo}, as told to {post.author?.node?.name || "The Moveee Commons"}</>
    : post.author?.node?.name || "The Moveee Commons";
  const bylineAvatarUrl = guestByline?.avatarUrl || post.author?.node?.avatar?.url;

  const section = commonsSectionOfPost(post);
  const bodyHtml = sanitizeHtml(post.content || "");

  let morePool: any[] = [];
  if (section) {
    morePool = (await getCommonsCategoryPieces(section.tagSlug, 8)).filter((p: any) => p.slug !== slug);
  }
  const moreFromSection = morePool.slice(0, 3);

  const usedSlugs = new Set([slug, ...moreFromSection.map((p: any) => p.slug)].filter(Boolean));
  const widerPool = await getCommonsPieces(12);
  const alsoRead = widerPool.filter((p: any) => !usedSlugs.has(p.slug)).slice(0, 3);

  return (
    <>
      <div className="comm-wrap comm-piece-header">
        <Link className="comm-piece-kicker" href={section ? `/commons/${section.slug}` : "/commons"}>
          {section?.label || "The Moveee Commons"}
        </Link>
        <h1 className="comm-piece-title" dangerouslySetInnerHTML={{ __html: post.title || "" }} />
        {post.seoDescription && <p className="comm-piece-standfirst">{decodeHtml(post.seoDescription)}</p>}

        <div className="comm-piece-byline-row">
          <div className="comm-piece-byline-left">
            <div className="comm-hero-avatar">
              {bylineAvatarUrl ? (
                <img src={bylineAvatarUrl} alt={typeof bylineDisplay === "string" ? bylineDisplay : ""} />
              ) : (
                (typeof bylineDisplay === "string" ? bylineDisplay : post.author?.node?.name || "M").charAt(0)
              )}
            </div>
            <div className="comm-hero-byline-text">
              <span className="comm-piece-byline-name">{bylineDisplay}</span>
              <span className="comm-piece-byline-meta">{formattedDate(post.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed floating pill (position: fixed, editorial.css's .ar-share-fab
          base rule — loaded globally, see app/layout.tsx) — rendered once,
          same placement convention as /literary/[slug]. */}
      <ArticleShareFab />

      {post.featuredImage?.node?.sourceUrl && (
        <div className="comm-wrap comm-piece-body-col">
          <img
            className="comm-piece-featured-img"
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || ""}
          />
        </div>
      )}

      <div className="comm-wrap">
        <article className="comm-piece-body-col">
          <div className="comm-piece-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

          {post.author?.node?.name && (
            <div className="comm-piece-author">
              <div className="comm-piece-author-avatar">
                {bylineAvatarUrl ? (
                  <img src={bylineAvatarUrl} alt={typeof bylineDisplay === "string" ? bylineDisplay : ""} />
                ) : (
                  (typeof bylineDisplay === "string" ? bylineDisplay : post.author.node.name).charAt(0)
                )}
              </div>
              <div>
                <div className="comm-piece-author-name">{bylineDisplay}</div>
                <p className="comm-piece-author-bio">
                  {guestByline?.bio || "Contributing writer, The Moveee Commons."}
                </p>
              </div>
            </div>
          )}

          <div className="comm-piece-subscribe" style={{ marginTop: 48 }}>
            <div className="comm-piece-subscribe-rule" />
            <h3>Read what we publish, as we publish it.</h3>
            <p>Opinion, reports and research — straight to your inbox, no charge.</p>
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
        </article>
      </div>

      {(moreFromSection.length > 0 || alsoRead.length > 0) && (
        <section className="comm-section">
          <div className="comm-wrap">
            <div className="comm-section-head">
              <h2>{section ? `More in ${section.label}` : "More From The Moveee Commons"}</h2>
            </div>
            <div className="comm-grid">
              {(moreFromSection.length > 0 ? moreFromSection : alsoRead).map((piece: any) => (
                <CommonsPieceCard key={piece.slug} piece={piece} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default async function CommonsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = getCommonsSection(slug);
  if (section) {
    return <SectionArchive section={section} />;
  }
  return <PiecePage slug={slug} />;
}
