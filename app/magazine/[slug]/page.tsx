import React from "react";
import { getWPData, GET_STORY_BY_SLUG } from "@/lib/wp";
import ComponentMapper from "@/components/ComponentMapper";
import { notFound } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: { params: { slug: string } }) {
  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug: params.slug });
  } catch {
    // CMS unreachable
  }
  const post = data?.post;

  if (!post) {
    notFound();
  }

  const isCoverStory = post.categories.nodes.some((cat: any) => cat.slug === "cover-story");

  return (
    <article className={`min-h-screen pb-24 ${isCoverStory ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}>
      {isCoverStory ? (
        /* Immersive Cover Hero */
        <header className="relative min-h-screen flex flex-col justify-end px-6 pb-12 md:pb-24 overflow-hidden">
          {post.featuredImage && (
            <div className="absolute inset-0 z-0">
              <Image 
                src={post.featuredImage.node.sourceUrl} 
                alt={post.featuredImage.node.altText || ""} 
                fill 
                className="object-cover brightness-75 transition-transform duration-1000 hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-80" />
            </div>
          )}
          
          <div className="relative z-10 max-w-[1440px] mx-auto w-full">
            <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.4em] font-bold text-ochre mb-8">
              {post.series.nodes.length > 0 && (
                <span className="bg-paper text-ink px-2 py-0.5 rounded-sm">Series: {post.series.nodes[0].name}</span>
              )}
              <span className="text-paper/60">{post.categories.nodes[0]?.name || "Cover Story"}</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-serif font-black leading-[0.85] tracking-tight mb-12 max-w-5xl">
              {post.title}
            </h1>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-paper/20 pt-8">
              <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-mono text-paper/50">
                <span>By The Moveee Editorial</span>
                <span className="w-1.5 h-1.5 rounded-full bg-ochre" />
                <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <p className="max-w-md text-sm md:text-base font-serif italic text-paper/80 leading-relaxed">
                {post.excerpt?.replace(/<[^>]*>?/gm, '') || ""}
              </p>
            </div>
          </div>
        </header>
      ) : (
        /* Standard Regular Hero */
        <header className="px-6 pt-24 pb-16 md:pt-32 md:pb-24 border-b border-rule">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] uppercase tracking-[0.3em] font-bold text-ochre mb-8">
              {post.series.nodes.length > 0 && (
                <span className="bg-ink text-paper px-2 py-0.5 rounded-sm flex items-center gap-2">
                  Series: {post.series.nodes[0].name}
                </span>
              )}
              <span>{post.categories.nodes[0]?.name || "Culture"}</span>
              {post.industries.nodes.length > 0 && (
                <span className="text-mute">• {post.industries.nodes[0].name}</span>
              )}
              {post.countries.nodes.length > 0 && (
                <span className="text-mute px-2 py-0.5 border border-rule/20">{post.countries.nodes[0].name}</span>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium leading-[0.95] tracking-tight text-ink mb-12">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-mono text-mute">
              <span>By The Moveee Editorial</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rule" />
              <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>
      )}

      {/* Featured Image (Only for Regular posts, Cover posts use it as hero background) */}
      {!isCoverStory && post.featuredImage && (
        <div className="w-full max-w-[1440px] mx-auto px-6 -mt-8 mb-24">
          <div className="aspect-[21/9] bg-paper-deep overflow-hidden relative group">
            <Image 
              src={post.featuredImage.node.sourceUrl} 
              alt={post.featuredImage.node.altText || ""} 
              fill 
              className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
              priority
            />
          </div>
        </div>
      )}

      {/* Story Body */}
      <div className={`max-w-3xl mx-auto px-6 ${isCoverStory ? 'mt-24' : ''}`}>
        {/* Render standard content if no blocks, otherwise use mapper */}
        {post.flexibleContent?.contentBlocks ? (
          <ComponentMapper blocks={post.flexibleContent.contentBlocks} />
        ) : (
          <div 
            className={`prose prose-lg max-w-none leading-relaxed font-serif ${isCoverStory ? 'prose-invert prose-stone text-paper/90' : 'prose-stone text-ink-soft'}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </div>
    </article>
  );
}
