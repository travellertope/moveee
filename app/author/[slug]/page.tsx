import React from "react";
import { getWPData, GET_AUTHOR_STORIES } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Marquee from "@/components/Marquee";
import "@/app/homepage.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await getWPData(GET_AUTHOR_STORIES, { first: 1, authorName: resolvedParams.slug });
  } catch {}
  
  const author = data?.users?.nodes?.[0];
  if (!author) return { title: "Author Archive · The Moveee" };
  
  return {
    title: `${author.name} · The Moveee`,
    description: author.description || `Articles by ${author.name} on The Moveee.`,
  };
}

export default async function AuthorArchivePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let data;
  try {
    data = await getWPData(GET_AUTHOR_STORIES, { first: 50, authorName: resolvedParams.slug });
  } catch (err: any) {
    console.error("AuthorArchivePage getWPData error:", err);
  }

  const author = data?.users?.nodes?.[0];
  const stories = data?.posts?.nodes || [];

  if (!author && stories.length === 0) {
    notFound();
  }

  const authorName = author?.name || resolvedParams.slug.replace("-", " ");
  const authorBio = author?.description || "Curator of culture, lifestyle, and heritage at The Moveee.";
  const authorAvatar = author?.avatar?.url;

  return (
    <div className="bg-paper min-h-screen text-ink font-sans relative flex flex-col">
      <Marquee />

      <main className="flex-grow pt-8 lg:pt-[60px] pb-20">
        
        {/* Author Profile Header */}
        <header className="max-w-[800px] mx-auto px-6 md:px-0 text-center mb-16">
          <div className="mb-6 flex justify-center">
            {authorAvatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden relative border border-rule/20">
                <Image src={authorAvatar} alt={authorName} fill style={{ objectFit: 'cover' }} />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-ink flex items-center justify-center text-paper font-serif text-3xl italic">
                {authorName.charAt(0)}
              </div>
            )}
          </div>
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ochre mb-3">Writer / Contributor</div>
          <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight mb-4">{authorName}</h1>
          <p className="text-mute text-sm max-w-[500px] mx-auto leading-relaxed">{authorBio}</p>
        </header>

        {/* Stories Grid */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-[60px] relative z-[2]">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ochre mb-0 pb-2.5 border-b border-rule w-full block">
            Latest Stories by {authorName.split(" ")[0]}
          </div>
          
          {stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
              {stories.map((story: any) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} className="card group" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="img r-port relative aspect-[3/4] bg-ink overflow-hidden mb-3.5 transition-transform duration-400 group-hover:-translate-y-1">
                    {story.featuredImage && (
                      <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="kicker font-mono text-[9px] tracking-[0.14em] uppercase text-ochre mb-2">
                    {story.categories?.nodes[0]?.name || "Article"}
                  </div>
                  <h4 className="font-serif text-[22px] font-normal leading-[1.05] mb-2 group-hover:text-ochre transition-colors">
                    {story.title}
                  </h4>
                  <div className="meta font-mono text-[8px] tracking-[0.1em] uppercase text-mute">
                    {new Date(story.date).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-mute">
              No stories published yet.
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
