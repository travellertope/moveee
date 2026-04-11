import React from "react";
import { getWPData, GET_STORY_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ComponentMapper from "@/components/ComponentMapper"; // Keeping this if they still have ACF flexible content later

export const dynamic = "force-dynamic";

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

  // Cover story logic
  const isCoverStory = post.categories.nodes.some((cat: any) => cat.slug === "cover-story" || cat.name.toLowerCase() === "cover story");
  const publishedDate = new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <article className="min-h-screen">
      
      {/* ── BREADCRUMB ── */}
      <div className="breadcrumb">
        <Link href="/magazine">Magazine</Link>
        <span className="sep">/</span>
        <Link href={`/magazine?category=${post.categories?.nodes[0]?.slug}`}>{post.categories.nodes[0]?.name || "Article"}</Link>
        <span className="sep">/</span>
        <span>{post.title}</span>
      </div>

      {isCoverStory ? (
        /* ========== COVER HERO ========== */
        <header className="cover-hero">
          <div className="cover-frame">
            {post.featuredImage && (
              <Image 
                src={post.featuredImage.node.sourceUrl} 
                alt={post.featuredImage.node.altText || post.title} 
                fill 
                className="object-cover"
                priority
              />
            )}
            
            <div className="cover-top-bar">
              <div className="issue-label">
                <span className="star">✦</span>
                <span>Issue N°014</span>
              </div>
              <div>The Document</div>
            </div>

            <div className="cover-title-block">
              <div className="cover-kicker">
                Cover Story · Vol II
              </div>
              <h1 className="cover-title">
                {post.title.includes(" ") ? (
                  <>
                    {post.title.split(" ").slice(0, -1).join(" ")} <em className="text-gold italic">{post.title.split(" ").slice(-1)}</em>
                  </>
                ) : (
                  post.title
                )}
              </h1>
            </div>

            <div className="cover-lines hidden md:block">
              <div className="line"><span className="num">01.</span> New Editorial Archive</div>
              <div className="line"><span className="num">02.</span> Visual Language</div>
              <div className="line"><span className="num">03.</span> The Next Generation</div>
            </div>
          </div>
        </header>
      ) : (
        /* ========== STANDARD HERO ========== */
        <header className="cover-hero" style={{ maxWidth: '1000px' }}>
          <div className="cover-title-block" style={{ position: 'relative', left: 0, right: 0, bottom: 0, color: 'var(--ink)' }}>
            <div className="cover-kicker" style={{ color: 'var(--mute)' }}>
              {post.categories.nodes[0]?.name || "Article"}
            </div>
            <h1 className="cover-title" style={{ fontSize: 'clamp(44px, 6vw, 80px)' }}>
              {post.title}
            </h1>
          </div>
          {post.featuredImage && (
            <div className="cover-frame" style={{ marginTop: '30px' }}>
              <Image 
                src={post.featuredImage.node.sourceUrl} 
                alt={post.featuredImage.node.altText || post.title} 
                fill 
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                priority
              />
            </div>
          )}
        </header>
      )}

      {/* ── STANDFIRST BAND ── */}
      <section className="standfirst-band">
        <div className="standfirst-grid">
          <div className="standfirst-label">
            <strong>In Summary</strong>
            The Dispatch
          </div>
          <div className="standfirst-text font-serif italic" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
        </div>
      </section>

      {/* ── BYLINE ROW ── */}
      <section className="byline-row">
        <div className="byline-inner flex-col md:flex-row items-center border-t border-b border-rule py-[28px] gap-[40px]">
          <div className="byline-item">
            <div className="label">Words By</div>
            <div className="value">The Moveee Editorial</div>
          </div>
          <div className="byline-item">
            <div className="label">Published Date</div>
            <div className="value">{publishedDate}</div>
          </div>
          <div className="byline-item">
            <div className="label">Category</div>
            <div className="value">{post.categories.nodes[0]?.name || "General"}</div>
          </div>
        </div>
      </section>

      {/* ── ARTICLE BODY ── */}
      <section className="article-body flex flex-col lg:grid lg:grid-cols-[1fr_720px_1fr] gap-[60px] max-w-[1440px] px-10 pb-[100px] mx-auto">
        <aside className="article-sidebar hidden lg:block sticky top-10 self-start">
          <div className="label text-[9px] uppercase tracking-[0.15em] border-b border-rule pb-2.5 mb-4">Jump To</div>
          <ul className="toc-list list-none">
            <li><a href="#" className="flex gap-2.5 font-serif italic text-sm hover:text-ochre transition-colors"><span className="num pt-1 text-[9px] text-ochre not-italic">01</span> Introduction</a></li>
            <li><a href="#" className="flex gap-2.5 font-serif italic text-sm hover:text-ochre transition-colors"><span className="num pt-1 text-[9px] text-ochre not-italic">02</span> Early Frameworks</a></li>
            <li><a href="#" className="flex gap-2.5 font-serif italic text-sm hover:text-ochre transition-colors"><span className="num pt-1 text-[9px] text-ochre not-italic">03</span> Future Contexts</a></li>
          </ul>
        </aside>

        <div className="article-prose">
          {post.flexibleContent?.contentBlocks ? (
            <ComponentMapper blocks={post.flexibleContent.contentBlocks} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: post.content }} className="prose-content" />
          )}
        </div>

        <aside className="article-sidebar hidden lg:block" />
      </section>

    </article>
  );
}
