import React from "react";
import { getWPData, GET_STORY_BY_SLUG, GET_STORIES, getIssuesForPost } from "@/lib/wp";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import ArticleComments from "@/components/ArticleComments";
import FinishReading from "@/components/FinishReading";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import ArticleActions from "@/components/ArticleActions";
import ArticleContentGate from "@/components/ArticleContentGate";
import ImageLightbox from "@/components/ImageLightbox";
import TocScrollSpy from "@/components/TocScrollSpy";
import { getAccessLevel } from "@/lib/access";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    const data = await getWPData(GET_STORIES, { first: 100 }, { revalidate: 600 });
    const nodes: { slug: string }[] = data?.posts?.nodes ?? [];
    return nodes.map((n) => ({ slug: n.slug }));
  } catch {
    return [];
  }
}

function resolveAioseoTitle(raw: string, postTitle: string): string {
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

  const accessLevel = getAccessLevel(post);

  const primaryCategory = post.categories?.nodes?.[0]?.name || "";
  let relatedStories: any[] = [];
  let postIssue: any = null;
  try {
    const [relData, issueTerms] = await Promise.all([
      getWPData(GET_STORIES, { first: 4, categoryName: primaryCategory || undefined }),
      getIssuesForPost(parseInt(post.databaseId)),
    ]);
    relatedStories = (relData?.posts?.nodes || [])
      .filter((s: any) => s.slug !== resolvedParams.slug)
      .slice(0, 3);
    postIssue = issueTerms?.[0] ?? null;
  } catch {}

  const publishedDate = new Date(post.date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const wordCount = post.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 250));

  const categoryName = decodeHtml(post.categories?.nodes?.[0]?.name || "Article");
  const categorySlug = post.categories?.nodes?.[0]?.slug || "";
  const hasFeaturedImage = !!post.featuredImage?.node?.sourceUrl;

  const toHeadingSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

  const rawContent = post.content || "";
  const headings: { id: string; text: string }[] = [];
  const usedIds = new Set<string>();

  // Single pass that both builds the headings[] list and injects ids — avoids
  // the bug of running two separately-written regexes and trying to keep a
  // shared index in lockstep between them (any filtering done in one but not
  // the other silently misaligns the ids). Matches real <h2>/<h3> tags, plus
  // a common WP-editor fallback pattern where a section title is authored as
  // a standalone paragraph wrapped entirely in <strong> (no surrounding
  // text) rather than a real heading block — lots of editorial content uses
  // this, and without detecting it the TOC always falls back to a single
  // "Full article" link.
  const contentWithIds = rawContent.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>|<p([^>]*)>(\s*<strong>([\s\S]*?)<\/strong>\s*)<\/p>/gi,
    (
      full: string,
      level: string,
      attrs: string,
      inner: string,
      pAttrs: string,
      pInner: string,
      pText: string
    ) => {
      const isHeading = !!level;
      const innerHtml = isHeading ? inner : pText;
      const rawText = decodeHtml(innerHtml.replace(/<[^>]*>/g, "")).trim();
      if (!rawText) return full;
      // Skip pseudo-heading paragraphs that are clearly just emphasis on a
      // long sentence rather than a short section title.
      if (!isHeading && (rawText.length > 80 || /[.!?]$/.test(rawText))) return full;

      const attrsToCheck = isHeading ? attrs : pAttrs;
      const existingId = /\bid="([^"]+)"/.exec(attrsToCheck)?.[1];
      let id = existingId || toHeadingSlug(rawText);
      if (!id) return full;
      if (usedIds.has(id) && id !== existingId) {
        let n = 2;
        while (usedIds.has(`${id}-${n}`)) n++;
        id = `${id}-${n}`;
      }
      usedIds.add(id);
      headings.push({ id, text: rawText });

      if (existingId) return full;
      if (isHeading) {
        return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
      }
      return `<p${pAttrs} id="${id}">${pInner}</p>`;
    }
  );

  const cleanContent = (html: string) => {
    if (!html) return html;
    const appRoutes = ["quote", "directory", "events", "origins", "connect", "register", "login", "member", "shop", "newsletter", "contact", "privacy", "terms"];
    return html.replace(
      /href="https?:\/\/(?:18\.175\.121\.188|cms\.themoveee\.com)\/([^"]*)"/gi,
      (match, path) => {
        if (path.startsWith("wp-content/")) return match;
        if (path.startsWith("category/"))
          return `href="/magazine/category/${path.replace("category/", "").replace(/\/$/, "")}"`;
        if (path.startsWith("author/"))
          return `href="/author/${path.replace("author/", "")}"`;
        const topSegment = path.split("/")[0];
        if (appRoutes.includes(topSegment)) return `href="/${path}"`;
        return `href="/magazine/${path}"`;
      }
    );
  };
  const processedContent = cleanContent(contentWithIds);

  const articleUrl = `https://themoveee.com/magazine/${resolvedParams.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 155) || "",
    image: post.featuredImage?.node?.sourceUrl || "https://themoveee.com/og-fallback.png",
    datePublished: post.date,
    dateModified: post.modified || post.date,
    author: {
      "@type": "Person",
      name: post.author?.node?.name || "Moveee Magazine",
    },
    publisher: {
      "@type": "Organization",
      name: "Moveee Magazine",
      logo: { "@type": "ImageObject", url: "https://themoveee.com/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://themoveee.com" },
      { "@type": "ListItem", position: 2, name: "Magazine", item: "https://themoveee.com/magazine" },
      ...(categoryName && categorySlug
        ? [{ "@type": "ListItem", position: 3, name: categoryName, item: `https://themoveee.com/magazine/category/${categorySlug}` }]
        : []),
      { "@type": "ListItem", position: categoryName ? 4 : 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProgressBar />

      {/* ── HERO ── */}
      {hasFeaturedImage ? (
        <section className="ar-hero">
          <nav className="ar-breadcrumb ar-breadcrumb--overlay">
            <Link href="/">Home</Link><span className="sep"> / </span>
            <Link href="/magazine">Editorials</Link><span className="sep"> / </span>
            <Link href={`/magazine/category/${categorySlug}`}>{categoryName}</Link><span className="sep"> / </span>
            <span className="ar-breadcrumb-current">{post.title}</span>
          </nav>
          <Image
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
            fill
            style={{ objectFit: "cover" }}
            priority
            className="ar-hero-img"
          />
          <div className="ar-hero-vignette" />
          <div className="ar-hero-text">
            <div className="ar-hero-eyebrow">
              <span>★ {categoryName}</span>
              {post.countries?.nodes?.[0]?.name && (
                <> · <span>{post.countries.nodes[0].name}</span></>
              )}
            </div>
            <h1 className="ar-hero-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
            {post.excerpt && (
              <p className="ar-standfirst" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.excerpt.replace(/<[^>]*>/g, "")) }} />
            )}
            <div className="ar-byline">
              <div className="ar-byline-items">
                <div className="ar-byline-item">
                  <div className="ar-byline-label">Words by</div>
                  <div className="ar-byline-val">
                    {post.asToldTo
                      ? <>{post.asToldTo}, as told to {post.author?.node?.name || "The Moveee"}</>
                      : post.author?.node?.name || "The Moveee"}
                  </div>
                </div>
                <div className="ar-byline-item">
                  <div className="ar-byline-label">Published</div>
                  <div className="ar-byline-val">{publishedDate}</div>
                </div>
                <div className="ar-byline-item">
                  <div className="ar-byline-label">Reading time</div>
                  <div className="ar-byline-val">{readingTime} minutes</div>
                </div>
              </div>
              <ArticleActions postId={parseInt(post.databaseId)} />
            </div>
          </div>
        </section>
      ) : (
        <>
          <nav className="ar-breadcrumb">
            <Link href="/">Home</Link><span className="sep"> / </span>
            <Link href="/magazine">Editorials</Link><span className="sep"> / </span>
            <Link href={`/magazine/category/${categorySlug}`}>{categoryName}</Link><span className="sep"> / </span>
            <span className="ar-breadcrumb-current">{post.title}</span>
          </nav>
          <header className="ar-standard-hero">
            <div className="ar-hero-eyebrow">★ {categoryName}</div>
            <h1 className="ar-title">{post.title}</h1>
            {post.excerpt && (
              <p className="ar-standfirst" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.excerpt.replace(/<[^>]*>/g, "")) }} />
            )}
            <div className="ar-byline">
              <div className="ar-byline-items">
                <div className="ar-byline-item">
                  <div className="ar-byline-label">Words by</div>
                  <div className="ar-byline-val">
                    {post.asToldTo
                      ? <>{post.asToldTo}, as told to {post.author?.node?.name || "The Moveee"}</>
                      : post.author?.node?.name || "The Moveee"}
                  </div>
                </div>
                <div className="ar-byline-item">
                  <div className="ar-byline-label">Published</div>
                  <div className="ar-byline-val">{publishedDate}</div>
                </div>
                <div className="ar-byline-item">
                  <div className="ar-byline-label">Reading time</div>
                  <div className="ar-byline-val">{readingTime} min</div>
                </div>
              </div>
              <ArticleActions postId={parseInt(post.databaseId)} />
            </div>
          </header>
        </>
      )}

      {/* ── ARTICLE 3-COLUMN LAYOUT ── */}
      <ImageLightbox>
        <div className="ar-wrap">

          {/* LEFT — TOC */}
          <aside className="ar-toc">
            <TocScrollSpy />
            <details className="ar-toc-details" open>
              <summary className="ar-toc-summary">
                <span className="ar-toc-toggle-label">Contents</span>
                <span className="ar-toc-chevron" aria-hidden>▾</span>
              </summary>
              {headings.length > 0 ? (
                <ul>
                  {headings.map((h, i) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, opacity: 0.5, marginRight: 6 }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul>
                  <li><a href="#article-body">Full article</a></li>
                </ul>
              )}
              <div className="ar-toc-meta">
                <div className="ar-toc-meta-item">
                  <div className="ar-toc-meta-label">Writer</div>
                  <div className="ar-toc-meta-val">
                    {post.asToldTo
                      ? <>{post.asToldTo}<br /><span style={{ fontSize: "0.85em", opacity: 0.7 }}>as told to {post.author?.node?.name || "The Moveee"}</span></>
                      : post.author?.node?.name || "The Moveee"}
                  </div>
                </div>
                {post.countries?.nodes?.[0]?.name && (
                  <div className="ar-toc-meta-item">
                    <div className="ar-toc-meta-label">Location</div>
                    <div className="ar-toc-meta-val">{post.countries.nodes[0].name}</div>
                  </div>
                )}
                <div className="ar-toc-meta-item">
                  <div className="ar-toc-meta-label">Section</div>
                  <div className="ar-toc-meta-val">{categoryName}</div>
                </div>
                {post.series?.nodes?.[0]?.name && (
                  <div className="ar-toc-meta-item">
                    <div className="ar-toc-meta-label">Series</div>
                    <div className="ar-toc-meta-val">{post.series.nodes[0].name}</div>
                  </div>
                )}
                {post.industries?.nodes?.[0]?.name && (
                  <div className="ar-toc-meta-item">
                    <div className="ar-toc-meta-label">Industry</div>
                    <div className="ar-toc-meta-val">{post.industries.nodes[0].name}</div>
                  </div>
                )}
              </div>
            </details>
          </aside>

          {/* CENTER — PROSE */}
          <div className="ar-prose" id="article-body">
            <ArticleContentGate
              accessLevel={accessLevel}
              callbackUrl={`/magazine/${resolvedParams.slug}`}
              previewHtml={sanitizeHtml(
                (processedContent.match(/<p[\s\S]*?<\/p>/gi) || []).slice(0, 3).join("") ||
                post.excerpt ||
                ""
              )}
              fullContent={
                <>
                  <ArticleComments
                    postId={parseInt(post.databaseId)}
                    content={processedContent || ""}
                  />
                  <FinishReading postId={parseInt(post.databaseId)} readingTime={readingTime} />
                </>
              }
            />
          </div>

          {/* RIGHT — SIDEBAR */}
          <aside className="ar-sidebar">

            {postIssue && (
              <Link href={`/magazine/issues/${postIssue.slug}`} style={{ textDecoration: "none" }}>
                <div className="ar-sidebar-card ar-sidebar-card--issue">
                  <span className="ar-sidebar-label">This piece is from</span>
                  <h4 style={{ marginBottom: postIssue.meta?.issue_subtitle ? 4 : 12 }}>
                    {postIssue.meta?.issue_number ? `Issue ${postIssue.meta.issue_number}` : postIssue.name}
                  </h4>
                  {postIssue.meta?.issue_subtitle && (
                    <p style={{ fontStyle: "italic", fontSize: 13, marginBottom: 12, color: "var(--ink-soft)" }}>
                      {postIssue.meta.issue_subtitle}
                    </p>
                  )}
                  {postIssue.meta?.issue_cover_image_url && (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", marginBottom: 12, overflow: "hidden", background: "var(--paper-deep)" }}>
                      <Image
                        src={postIssue.meta.issue_cover_image_url}
                        alt={postIssue.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <span className="ar-sc-read">Read the full issue →</span>
                </div>
              </Link>
            )}

            {(post.featuredProducts ?? []).length > 0 && (
              <div className="ste-sidebar-card">
                <div className="ste-sidebar-card-label">Shop the Edit</div>
                {(post.featuredProducts as any[]).map((p: any) => (
                  <Link key={p.id} href={`/shop/${p.slug}`} className="ste-sidebar-item">
                    <div className="ste-sidebar-item-img" style={{ position: "relative" }}>
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.imageAlt || p.name} fill style={{ objectFit: "cover" }} sizes="48px" />
                      ) : null}
                    </div>
                    <div className="ste-sidebar-item-info">
                      <div className="ste-sidebar-item-name">{p.name}</div>
                      <div className="ste-sidebar-item-price" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.price) }} />
                    </div>
                  </Link>
                ))}
                <Link href="/shop" style={{ display: "block", padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ar-ochre)", textDecoration: "none", borderTop: "1px solid var(--ar-ghost-light)" }}>
                  Browse all products →
                </Link>
              </div>
            )}

            <div className="ar-sidebar-card ar-sidebar-card--newsletter">
              <span className="ar-sidebar-label">★ Culture Drop</span>
              <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Culture in your inbox, every Tuesday.</h4>
              <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 14, lineHeight: 1.5 }}>Film picks, exhibition openings, music worth your time. No noise.</p>
              <NewsletterSubscribeWidget placeholder="your@email.com" buttonLabel="Subscribe free →" />
            </div>

            {relatedStories.slice(0, 2).map((story: any) => (
              <Link href={`/magazine/${story.slug}`} key={story.id} style={{ textDecoration: "none" }}>
                <div className="ar-sidebar-card ar-sidebar-card--story">
                  {story.featuredImage?.node?.sourceUrl && (
                    <div className="ar-sc-thumb" style={{ position: "relative", width: "100%", aspectRatio: "16/9", marginBottom: 10, overflow: "hidden", borderRadius: 4, background: "var(--ar-ghost-light)" }}>
                      <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill style={{ objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="ar-sc-kicker">{decodeHtml(story.categories?.nodes?.[0]?.name || "Culture")}</div>
                  <div className="ar-sc-title">{story.title}</div>
                  {story.excerpt && (
                    <p style={{ fontSize: 12, color: "var(--mute)", margin: "6px 0 10px", lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.excerpt.replace(/<[^>]*>/g, "").slice(0, 100) + "…") }}
                    />
                  )}
                  <span className="ar-sc-read">Read →</span>
                </div>
              </Link>
            ))}

            <div className="ar-sidebar-card ar-sidebar-card--dark">
              <span className="ar-sidebar-label">From the archive</span>
              <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>Explore the full magazine</h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 14, lineHeight: 1.5 }}>Browse all essays, interviews, and dispatches from The Moveee editorial team.</p>
              <Link href="/magazine" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
                All stories →
              </Link>
            </div>
          </aside>
        </div>
      </ImageLightbox>

      {/* ── SERIES CONTEXT ── */}
      {post.series?.nodes?.[0]?.description && (
        <div className="ar-series" data-nosnippet>
          <div className="ar-series-inner">
            <div className="ar-series-label">Part of the series</div>
            <Link href={`/magazine/series/${post.series.nodes[0].slug}`} className="ar-series-name">
              {post.series.nodes[0].name}
            </Link>
            <p
              className="ar-series-desc"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.series.nodes[0].description) }}
            />
            <Link href={`/magazine/series/${post.series.nodes[0].slug}`} className="ar-series-link">
              Read the full series →
            </Link>
          </div>
        </div>
      )}

      {/* ── AUTHOR BAND ── */}
      <div className="ar-author">
        <div className="ar-author-avatar" style={{ position: "relative", overflow: "hidden" }}>
          {post.author?.node?.avatar?.url ? (
            <Image
              src={post.author.node.avatar.url}
              alt={post.author.node.name || "Author"}
              width={120}
              height={120}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
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
        <div className="ar-author-info">
          <div className="ar-author-label">Words by</div>
          {post.asToldTo ? (
            <>
              <div className="ar-author-name">{post.asToldTo}</div>
              <p className="ar-author-bio" style={{ fontStyle: "italic" }}>
                as told to <strong>{post.author?.node?.name || "The Moveee"}</strong>
              </p>
              <p className="ar-author-bio">
                {post.author?.node?.description || "Culture, lifestyle, and heritage — curated from Lagos, London, Accra, and beyond."}
              </p>
            </>
          ) : (
            <>
              <div className="ar-author-name">
                {post.author?.node?.name ? (
                  post.author.node.name.includes(" ") ? (
                    <>
                      {post.author.node.name.split(" ").slice(0, -1).join(" ")}{" "}
                      <em>{post.author.node.name.split(" ").slice(-1)}</em>
                    </>
                  ) : (
                    post.author.node.name
                  )
                ) : (
                  <>The <em>Moveee</em></>
                )}
              </div>
              <p className="ar-author-bio">
                {post.author?.node?.description ||
                  "Culture, lifestyle, and heritage — curated from Lagos, London, Accra, and beyond. Long-form essays and visual stories that document the things that matter."}
              </p>
            </>
          )}
        </div>
        {post.author?.node?.slug && (
          <Link href={`/author/${post.author.node.slug}`} className="ar-author-cta">
            More by {post.author.node.name?.split(" ")[0]} →
          </Link>
        )}
      </div>

      {/* ── SHOP THE EDIT — mobile strip ── */}
      {(post.featuredProducts ?? []).length > 0 && (
        <section className="ste-section--mobile">
          <div className="ste-mobile-label">Shop the Edit</div>
          <div className="ste-mobile-scroll">
            {(post.featuredProducts as any[]).map((p: any) => (
              <Link key={p.id} href={`/shop/${p.slug}`} className="ste-mobile-item">
                <div className="ste-mobile-img" style={{ position: "relative", overflow: "hidden" }}>
                  {p.imageUrl && (
                    <Image src={p.imageUrl} alt={p.imageAlt || p.name} fill style={{ objectFit: "cover" }} sizes="72px" />
                  )}
                </div>
                <div className="ste-mobile-name">{p.name}</div>
                <div className="ste-mobile-price" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.price) }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── RELATED ── */}
      {relatedStories.length > 0 && (
        <section className="ar-related">
          <div className="ar-related-inner">
            <div className="ar-related-header">
              <h3>Keep <em>reading</em></h3>
              <Link href="/magazine">All stories →</Link>
            </div>
            <div className="ar-related-grid">
              {relatedStories.map((story: any) => (
                <Link href={`/magazine/${story.slug}`} key={story.id} className="ar-rc">
                  <div className="ar-rf" style={{ position: "relative", overflow: "hidden" }}>
                    {story.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={story.featuredImage.node.sourceUrl}
                        alt={story.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
                        <defs>
                          <linearGradient id={`rg-${story.id}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3d4a2a" /><stop offset="100%" stopColor="#14110d" />
                          </linearGradient>
                        </defs>
                        <rect width="400" height="300" fill={`url(#rg-${story.id})`} />
                        <circle cx="200" cy="150" r="80" fill="#c5491f" opacity="0.35" />
                        <circle cx="200" cy="150" r="50" fill="#b38238" opacity="0.45" />
                      </svg>
                    )}
                  </div>
                  <div className="ar-rk">{decodeHtml(story.categories?.nodes?.[0]?.name || "Culture")}</div>
                  <h4 className="ar-rt">{story.title}</h4>
                  <div className="ar-rm">
                    {new Date(story.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
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
