import React from "react";
import { getWPData, GET_STORY_BY_SLUG, GET_STORIES, getIssuesForPost } from "@/lib/wp";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import ParagraphCommentSystem from "@/components/ParagraphCommentSystem";
import FinishReading from "@/components/FinishReading";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import ArticleActions from "@/components/ArticleActions";
import ContentGate from "@/components/ContentGate";
import ImageLightbox from "@/components/ImageLightbox";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessLevel, canViewContent } from "@/lib/access";
import { decodeHtml } from "@/lib/decode-html";

export const revalidate = 600;

function resolveAioseoTitle(raw: string, postTitle: string): string {
  // AIOSEO stores template tags — resolve the common ones then strip any leftovers
  return raw
    .replace(/#post_title/g, postTitle)
    .replace(/#separator_sa/g, "|")
    .replace(/#site_title/g, "The Moveee")
    .replace(/#[a-z_]+/g, "")
    .trim();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug: resolvedParams.slug });
  } catch {}
  const post = data?.post;
  if (!post) return { title: { absolute: "Article · The Moveee" } };

  const imageUrl = post.featuredImage?.node?.sourceUrl || "/og-fallback.png";
  const plainExcerpt = post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || "";

  // Prefer AIOSEO values; fall back to post title / excerpt
  const metaTitle = post.seoTitle
    ? resolveAioseoTitle(post.seoTitle, post.title)
    : `${post.title} · The Moveee`;
  const metaDescription = post.seoDescription?.trim() || plainExcerpt;

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
    },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug: resolvedParams.slug });
  } catch (err: any) {
    console.error("StoryPage getWPData error:", err);
  }
  const post = data?.post;

  if (!post) {
    notFound();
  }

  // Access control
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const accessLevel = getAccessLevel(post);
  const canView = canViewContent(accessLevel, user);
  const isLoggedIn = !!user;

  // Fetch related stories and issue in parallel
  const primaryCategory = post.categories?.nodes?.[0]?.name || "";
  let relatedStories: any[] = [];
  let postIssue: any = null;
  try {
    const [relData, issueTerms] = await Promise.all([
      getWPData(GET_STORIES, { first: 4, categoryName: primaryCategory || undefined }),
      getIssuesForPost(parseInt(post.databaseId)),
    ]);
    relatedStories = (relData?.posts?.nodes || []).filter((s: any) => s.slug !== resolvedParams.slug).slice(0, 3);
    postIssue = issueTerms?.[0] ?? null;
  } catch {}

  const publishedDate = new Date(post.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Estimate reading time from content
  const wordCount = post.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 250));

  const categoryName = decodeHtml(post.categories?.nodes?.[0]?.name || "Article");
  const categorySlug = post.categories?.nodes?.[0]?.slug || "";
  const hasFeaturedImage = !!post.featuredImage?.node?.sourceUrl;

  // Extract headings from content for TOC, generating IDs where none exist.
  const toHeadingSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  const rawContent = post.content || "";
  const headings: { id: string; text: string }[] = [];
  const usedIds = new Set<string>();

  // First pass: collect all h2/h3 headings and assign IDs
  const allHeadingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = allHeadingRegex.exec(rawContent)) !== null) {
    const rawText = decodeHtml(match[2]);
    if (!rawText) continue;

    // Prefer an existing id attribute; otherwise generate one from text
    const existingId = /\bid="([^"]+)"/.exec(match[0])?.[1];
    let id = existingId || toHeadingSlug(rawText);
    if (!id) continue;

    // Deduplicate
    if (usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    usedIds.add(id);
    headings.push({ id, text: rawText });
  }

  // Second pass: inject generated IDs into headings that lack them so anchor
  // links in the TOC actually scroll to the right place.
  let headingIdx = 0;
  const contentWithIds = rawContent.replace(
    /<h([23])([^>]*)>(.*?)<\/h\1>/gi,
    (full: string, level: string, attrs: string, inner: string) => {
      if (headingIdx >= headings.length) return full;
      const { id } = headings[headingIdx++];
      if (/\bid=/.test(attrs)) return full; // already has an id
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  // Intercept and rewrite internal WP links to use proper Next.js routing
  const cleanContent = (html: string) => {
    if (!html) return html;
    // Known top-level app routes that should NOT be prefixed with /magazine
    const appRoutes = ['quote', 'directory', 'events', 'origins', 'connect', 'register', 'login', 'member', 'shop', 'newsletter', 'contact', 'privacy', 'terms'];
    return html.replace(
      /href="https?:\/\/(?:18\.175\.121\.188|cms\.themoveee\.com)\/([^"]*)"/gi,
      (match, path) => {
        // Exclude direct media assets
        if (path.startsWith('wp-content/')) return match;
        // Map native categorisation
        if (path.startsWith('category/')) return `href="/magazine/category/${path.replace('category/', '').replace(/\/$/, '')}"`;
        if (path.startsWith('author/')) return `href="/author/${path.replace('author/', '')}"`;
        // Preserve known Next.js app routes
        const topSegment = path.split('/')[0];
        if (appRoutes.includes(topSegment)) return `href="/${path}"`;
        // Assume all other native links are relative to magazine
        return `href="/magazine/${path}"`;
      }
    );
  };
  const processedContent = cleanContent(contentWithIds);

  return (
    <>
      <ProgressBar />

      {/* ── HERO ── */}
      {hasFeaturedImage ? (
        <section className="article-hero">
          {/* BREADCRUMB overlaid on hero */}
          <div className="breadcrumb overlay">
            <Link href="/">Home</Link><span className="sep">/</span>
            <Link href="/magazine">Editorials</Link><span className="sep">/</span>
            <Link href={`/magazine/category/${categorySlug}`}>{categoryName}</Link><span className="sep">/</span>
            <span className="breadcrumb-current">{post.title}</span>
          </div>
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="hero-vignette" />
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span>★ {categoryName}</span>
              {post.countries?.nodes?.[0]?.name && (
                <>
                  <span className="sep">·</span>
                  <span>{post.countries.nodes[0].name}</span>
                </>
              )}
            </div>
            <h1 className="article-title" dangerouslySetInnerHTML={{ __html: post.title }} />
            {post.excerpt && (
              <p className="article-standfirst" dangerouslySetInnerHTML={{ __html: post.excerpt.replace(/<[^>]*>/g, "") }} />
            )}
            <div className="byline-bar">
              <div className="b-item">
                <div className="b-label">Words by</div>
                <div className="b-val">
                  {post.asToldTo
                    ? <>{post.asToldTo}, as told to {post.author?.node?.name || "The Moveee"}</>
                    : post.author?.node?.name || "The Moveee"}
                </div>
              </div>
              <div className="b-item">
                <div className="b-label">Published</div>
                <div className="b-val">{publishedDate}</div>
              </div>
              <div className="b-item">
                <div className="b-label">Reading time</div>
                <div className="b-val">{readingTime} minutes</div>
              </div>
              <ArticleActions postId={parseInt(post.databaseId)} />
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="breadcrumb">
            <Link href="/">Home</Link><span className="sep">/</span>
            <Link href="/magazine">Editorials</Link><span className="sep">/</span>
            <Link href={`/magazine/category/${categorySlug}`}>{categoryName}</Link><span className="sep">/</span>
            <span className="breadcrumb-current">{post.title}</span>
          </div>
          <header className="standard-hero">
          <div className="hero-eyebrow" style={{ color: 'var(--ochre)', marginBottom: '20px' }}>
            <span>★ {categoryName}</span>
          </div>
          <h1 className="article-title">{post.title}</h1>
          {post.excerpt && (
            <p className="article-standfirst" dangerouslySetInnerHTML={{ __html: post.excerpt.replace(/<[^>]*>/g, "") }} />
          )}
          <div className="byline-bar">
            <div className="b-item">
              <div className="b-label">Words by</div>
              <div className="b-val">
                {post.asToldTo
                  ? <>{post.asToldTo}, as told to {post.author?.node?.name || "The Moveee"}</>
                  : post.author?.node?.name || "The Moveee"}
              </div>
            </div>
            <div className="b-item">
              <div className="b-label">Published</div>
              <div className="b-val">{publishedDate}</div>
            </div>
            <div className="b-item">
              <div className="b-label">Reading time</div>
              <div className="b-val">{readingTime} min</div>
            </div>
            <ArticleActions postId={parseInt(post.databaseId)} />
          </div>
        </header>
        </>
      )}

      {/* ── ARTICLE 3-COLUMN LAYOUT ── */}
      <ImageLightbox>
      <div className="article-wrap">

        {/* LEFT — TOC */}
        <aside className="toc">
          <div className="toc-heading">In this piece</div>
          <details className="toc-details" open>
          <summary className="toc-summary">
            <span className="toc-toggle-label">In this piece</span>
            <span className="toc-chevron" aria-hidden>▾</span>
          </summary>
          {headings.length > 0 ? (
            <ul>
              {headings.map((h, i) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <ul>
              <li><a href="#article-body"><span className="n">01</span>Full article</a></li>
            </ul>
          )}
          <div className="toc-meta">
            <div className="tm-item">
              <div className="tm-label">Writer</div>
              <div className="tm-val">
                {post.asToldTo
                  ? <>{post.asToldTo}<br /><span style={{ fontSize: "0.75em", opacity: 0.7 }}>as told to {post.author?.node?.name || "The Moveee"}</span></>
                  : post.author?.node?.name || "The Moveee"}
              </div>
            </div>
            {post.countries?.nodes?.[0]?.name && (
              <div className="tm-item">
                <div className="tm-label">Location</div>
                <div className="tm-val">{post.countries.nodes[0].name}</div>
              </div>
            )}
            <div className="tm-item">
              <div className="tm-label">Section</div>
              <div className="tm-val">{categoryName}</div>
            </div>
            {post.series?.nodes?.[0]?.name && (
              <div className="tm-item">
                <div className="tm-label">Series</div>
                <div className="tm-val">{post.series.nodes[0].name}</div>
              </div>
            )}
            {post.industries?.nodes?.[0]?.name && (
              <div className="tm-item">
                <div className="tm-label">Industry</div>
                <div className="tm-val">{post.industries.nodes[0].name}</div>
              </div>
            )}
          </div>
          </details>
        </aside>

        {/* CENTER — PROSE (Interactive Paragraph Comments) */}
        <div className="prose" id="article-body">
          {canView ? (
            <ParagraphCommentSystem
              postId={parseInt(post.databaseId)}
              content={processedContent || ""}
            />
          ) : (
            <>
              {/* First ~5% of article content with gradient fade */}
              {(() => {
                const firstParas = (processedContent.match(/<p[\s\S]*?<\/p>/gi) || []).slice(0, 3).join("");
                const preview = firstParas || post.excerpt || "";
                if (!preview) return null;
                return (
                  <div style={{ position: "relative", marginBottom: 0 }}>
                    <div
                      className="prose-content"
                      dangerouslySetInnerHTML={{ __html: preview }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 160,
                        background: "linear-gradient(to bottom, transparent, var(--paper, #ffffff))",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                );
              })()}
              <ContentGate
                accessLevel={accessLevel as "member-only" | "patron-only"}
                isLoggedIn={isLoggedIn}
              />
            </>
          )}
          {canView && <FinishReading postId={parseInt(post.databaseId)} />}
        </div>

        {/* RIGHT — SIDEBAR */}
        <aside className="sidebar">

          {/* Issue card — shown first when post belongs to an issue */}
          {postIssue && (
            <Link href={`/magazine/issues/${postIssue.slug}`} style={{ textDecoration: 'none' }}>
              <div className="s-card" style={{ borderLeft: '3px solid var(--ochre)', marginBottom: 16 }}>
                <div className="s-label">This piece is from</div>
                <h4 style={{ marginBottom: postIssue.meta?.issue_subtitle ? 4 : 12 }}>
                  {postIssue.meta?.issue_number ? `Issue ${postIssue.meta.issue_number}` : postIssue.name}
                </h4>
                {postIssue.meta?.issue_subtitle && (
                  <p style={{ fontStyle: 'italic', fontSize: 13, marginBottom: 12, color: 'var(--ink-soft)' }}>
                    {postIssue.meta.issue_subtitle}
                  </p>
                )}
                {postIssue.meta?.issue_cover_image_url && (
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', marginBottom: 12, overflow: 'hidden', background: 'var(--paper-deep)' }}>
                    <Image
                      src={postIssue.meta.issue_cover_image_url}
                      alt={postIssue.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase' as const,
                  borderBottom: '1px solid var(--ink)',
                  paddingBottom: '1px',
                  color: 'var(--ink)',
                }}>
                  Read the full issue →
                </span>
              </div>
            </Link>
          )}

          <div className="newsletter-card">
            <div className="s-label">★ The Moveee Weekly</div>
            <h4>Culture in your inbox, every Friday.</h4>
            <p>Film picks, exhibition openings, music worth your time. No noise.</p>
            <NewsletterSubscribeWidget placeholder="your@email.com" buttonLabel="Subscribe free →" />
          </div>

          {relatedStories.slice(0, 2).map((story: any) => (
            <Link href={`/magazine/${story.slug}`} key={story.id} style={{ textDecoration: 'none' }}>
              <div className="s-card">
                <div className="s-label">{decodeHtml(story.categories?.nodes?.[0]?.name || "Culture")}</div>
                <h4>{story.title}</h4>
                {story.excerpt && (
                  <p dangerouslySetInnerHTML={{ __html: story.excerpt.replace(/<[^>]*>/g, "").slice(0, 100) + "…" }} />
                )}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase' as const,
                  borderBottom: '1px solid var(--ink)',
                  paddingBottom: '1px',
                  color: 'var(--ink)',
                }}>
                  Read →
                </span>
              </div>
            </Link>
          ))}

          <div className="s-card-dark">
            <div className="s-label">From the archive</div>
            <h4>Explore the full magazine</h4>
            <p>Browse all essays, interviews, and dispatches from The Moveee editorial team.</p>
            <Link href="/magazine">
              All stories →
            </Link>
          </div>
        </aside>
      </div>
      </ImageLightbox>

      {/* ── SERIES CONTEXT (data-nosnippet keeps it out of Google snippets/excerpts) ── */}
      {post.series?.nodes?.[0]?.description && (
        <div className="series-context" data-nosnippet>
          <div className="series-context-inner">
            <div className="series-context-label">Part of the series</div>
            <Link href={`/magazine/series/${post.series.nodes[0].slug}`} className="series-context-name">
              {post.series.nodes[0].name}
            </Link>
            <p className="series-context-desc"
              dangerouslySetInnerHTML={{ __html: post.series.nodes[0].description }}
            />
          </div>
        </div>
      )}

      {/* ── AUTHOR BAND ── */}
      <div className="author-band">
        <div className="author-avatar">
          {post.author?.node?.avatar?.url ? (
            <Image 
              src={post.author.node.avatar.url} 
              alt={post.author.node.name || "Author"} 
              width={120} 
              height={120} 
              style={{ objectFit: 'cover', width: '100%', height: '100%' }} 
            />
          ) : (
            <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <rect width="120" height="120" fill="#3d4a2a" />
              <ellipse cx="60" cy="52" rx="32" ry="40" fill="#6b3020" />
              <path d="M 30 44 Q 35 14 60 10 Q 85 14 90 44 Q 84 26 60 24 Q 36 26 30 44 Z" fill="#14110d" />
              <path d="M 10 120 Q 28 80 44 72 L 76 72 Q 92 80 110 120 Z" fill="#c5491f" />
              <circle cx="49" cy="52" r="4" fill="#14110d" />
              <circle cx="71" cy="52" r="4" fill="#14110d" />
              <path d="M 48 72 Q 60 80 72 72" stroke="#14110d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div className="author-info">
          <div className="a-label">Words by</div>
          {post.asToldTo ? (
            <>
              <h4>{post.asToldTo}</h4>
              <p className="a-told-to">as told to <strong>{post.author?.node?.name || "The Moveee"}</strong></p>
              <p>{post.author?.node?.description || "Culture, lifestyle, and heritage — curated from Lagos, London, Accra, and the diaspora."}</p>
            </>
          ) : (
            <>
              <h4>
                {post.author?.node?.name ? (
                  post.author.node.name.includes(" ") ? (
                    <>
                      {post.author.node.name.split(" ").slice(0, -1).join(" ")} <em>{post.author.node.name.split(" ").slice(-1)}</em>
                    </>
                  ) : (
                    post.author.node.name
                  )
                ) : (
                  <>The <em>Moveee</em></>
                )}
              </h4>
              <p>{post.author?.node?.description || "Culture, lifestyle, and heritage — curated from Lagos, London, Accra, and the diaspora. Long-form essays and visual stories that document the things that matter."}</p>
            </>
          )}
        </div>
        {post.author?.node?.slug && (
          <Link
            href={`/author/${post.author.node.slug}`}
            className="author-cta"
          >
            More by {post.author.node.name?.split(" ")[0]} →
          </Link>
        )}
      </div>

      {/* ── RELATED ── */}
      {relatedStories.length > 0 && (
        <section className="related">
          <div className="related-inner">
            <div className="related-hdr">
              <h3>Keep <em>reading</em></h3>
              <Link href="/magazine">All stories →</Link>
            </div>
            <div className="related-grid">
              {relatedStories.map((story: any) => (
                <Link href={`/magazine/${story.slug}`} key={story.id} className="rc">
                  <div className="rf">
                    {story.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={story.featuredImage.node.sourceUrl}
                        alt={story.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        <defs>
                          <linearGradient id={`rg-${story.id}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3d4a2a" /><stop offset="100%" stopColor="#14110d" />
                          </linearGradient>
                        </defs>
                        <rect width="400" height="250" fill={`url(#rg-${story.id})`} />
                        <circle cx="200" cy="125" r="80" fill="#c5491f" opacity="0.35" />
                        <circle cx="200" cy="125" r="50" fill="#b38238" opacity="0.45" />
                      </svg>
                    )}
                  </div>
                  <div className="rk">{decodeHtml(story.categories?.nodes?.[0]?.name || "Culture")}</div>
                  <h4>{story.title}</h4>
                  <div className="rm">
                    {new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
