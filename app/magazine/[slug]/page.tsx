import React from "react";
import { getWPData, GET_STORY_BY_SLUG, GET_STORIES } from "@/lib/wp";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug: resolvedParams.slug });
  } catch {}
  const post = data?.post;
  if (!post) return { title: "Article · The Moveee" };
  return {
    title: `${post.title} · The Moveee`,
    description: post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
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

  // Fetch related stories
  const primaryCategory = post.categories?.nodes?.[0]?.name || "";
  let relatedStories: any[] = [];
  try {
    const relData = await getWPData(GET_STORIES, { first: 4, categoryName: primaryCategory || undefined });
    relatedStories = (relData?.posts?.nodes || []).filter((s: any) => s.slug !== resolvedParams.slug).slice(0, 3);
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

  const categoryName = post.categories?.nodes?.[0]?.name || "Article";
  const categorySlug = post.categories?.nodes?.[0]?.slug || "";
  const hasFeaturedImage = !!post.featuredImage?.node?.sourceUrl;

  // Extract headings from content for TOC
  const headingRegex = /<h[23][^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  const headings: { id: string; text: string }[] = [];
  let match;
  const tempContent = post.content || "";
  while ((match = headingRegex.exec(tempContent)) !== null) {
    headings.push({
      id: match[1],
      text: match[2].replace(/<[^>]*>/g, ""),
    });
  }

  return (
    <>
      <ProgressBar />

      {/* ── HERO ── */}
      {hasFeaturedImage ? (
        <section className="article-hero">
          {/* BREADCRUMB overlaid on hero */}
          <div className="breadcrumb overlay">
            <Link href="/">Home</Link><span className="sep">/</span>
            <Link href="/magazine">Magazine</Link><span className="sep">/</span>
            <Link href={`/magazine?category=${categorySlug}`}>{categoryName}</Link><span className="sep">/</span>
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
                <div className="b-val">The Moveee</div>
              </div>
              <div className="b-item">
                <div className="b-label">Published</div>
                <div className="b-val">{publishedDate}</div>
              </div>
              <div className="b-item">
                <div className="b-label">Reading time</div>
                <div className="b-val">{readingTime} minutes</div>
              </div>
              <div className="b-item">
                <div className="b-label">Category</div>
                <div className="b-val">{categoryName}</div>
              </div>
              <div className="share-row">
                <button className="sh-btn" aria-label="Share">↗</button>
                <button className="sh-btn" aria-label="Bookmark">✦</button>
                <button className="sh-btn" aria-label="Favourite">☆</button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="breadcrumb">
            <Link href="/">Home</Link><span className="sep">/</span>
            <Link href="/magazine">Magazine</Link><span className="sep">/</span>
            <Link href={`/magazine?category=${categorySlug}`}>{categoryName}</Link><span className="sep">/</span>
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
              <div className="b-val">{post.author?.node?.name || "The Moveee"}</div>
            </div>
            <div className="b-item">
              <div className="b-label">Published</div>
              <div className="b-val">{publishedDate}</div>
            </div>
            <div className="b-item">
              <div className="b-label">Reading time</div>
              <div className="b-val">{readingTime} min</div>
            </div>
            <div className="b-item">
              <div className="b-label">Category</div>
              <div className="b-val">{categoryName}</div>
            </div>
            <div className="share-row">
              <button className="sh-btn" aria-label="Share">↗</button>
              <button className="sh-btn" aria-label="Bookmark">✦</button>
              <button className="sh-btn" aria-label="Favourite">☆</button>
            </div>
          </div>
        </header>
        </>
      )}

      {/* ── ARTICLE 3-COLUMN LAYOUT ── */}
      <div className="article-wrap">

        {/* LEFT — TOC */}
        <aside className="toc">
          <div className="label">In this piece</div>
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
              <div className="tm-val">{post.author?.node?.name || "The Moveee"}</div>
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
        </aside>

        {/* CENTER — PROSE */}
        <div className="prose" id="article-body">
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* RIGHT — SIDEBAR */}
        <aside className="sidebar">
          <div className="newsletter-card">
            <div className="s-label">★ The Moveee Weekly</div>
            <h4>Culture in your inbox, every Friday.</h4>
            <p>Film picks, exhibition openings, music worth your time. No noise.</p>
            <input type="email" placeholder="your@email.com" />
            <button>Subscribe free →</button>
          </div>

          {relatedStories.slice(0, 2).map((story: any) => (
            <Link href={`/magazine/${story.slug}`} key={story.id} style={{ textDecoration: 'none' }}>
              <div className="s-card">
                <div className="s-label">{story.categories?.nodes?.[0]?.name || "Culture"}</div>
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
        </div>
        {post.author?.node?.slug ? (
            <Link href={`/author/${post.author.node.slug}`} className="author-cta">More by {post.author.node.name.split(" ")[0]} →</Link>
        ) : (
            <Link href="/magazine" className="author-cta">More stories →</Link>
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
                  <div className="rk">{story.categories?.nodes?.[0]?.name || "Culture"}</div>
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
