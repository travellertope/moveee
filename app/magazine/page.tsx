import React from "react";
import { getWPData, GET_STORIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";

export default async function MagazineArchive({ 
  searchParams 
}: { 
  searchParams: { category?: string } 
}) {
  const currentCategory = searchParams.category;
  const data = await getWPData(GET_STORIES, { 
    first: 12, 
    categoryName: currentCategory 
  });
  const stories = data?.posts?.nodes || [];

  const categories = [
    { name: "All Stories", slug: "" },
    { name: "Culture", slug: "culture" },
    { name: "Lifestyle", slug: "lifestyle" },
    { name: "Interviews", slug: "interviews" },
    { name: "Portraits", slug: "portraits" },
  ];

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Archive Header */}
      <header className="px-6 pt-24 pb-16 border-b border-rule">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center">
          <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tight text-ink mb-6">
            MAGAZINE
          </h1>
          <p className="text-[11px] uppercase tracking-[0.4em] font-bold text-mute text-center max-w-xl">
            A repository of visual culture, high-fidelity dispatches, and deep dives into the global diaspora.
          </p>
        </div>
      </header>

      {/* Grid Filter Bar */}
      <nav className="border-b border-rule bg-paper-deep">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-center gap-10 text-[10px] uppercase tracking-[0.2em] font-bold text-ink-soft overflow-x-auto no-scrollbar whitespace-nowrap">
          {categories.map((cat) => (
            <Link 
              key={cat.slug} 
              href={cat.slug ? `/magazine?category=${cat.slug}` : "/magazine"}
              className={`${(currentCategory === cat.slug || (!currentCategory && !cat.slug)) ? "text-ochre" : "hover:text-ink"} transition-colors`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Stories Grid */}
      <div className="max-w-[1440px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
          {stories.map((story: any) => (
            <Link key={story.id} href={`/magazine/${story.slug}`} className="group flex flex-col gap-6">
              <div className="aspect-[4/5] bg-paper-deep overflow-hidden relative">
                {story.featuredImage ? (
                  <Image 
                    src={story.featuredImage.node.sourceUrl} 
                    alt={story.featuredImage.node.altText || ""} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-ink/10 font-serif italic text-2xl">
                    Cover Story
                  </div>
                )}
                <div className="absolute inset-0 bg-ink/5 group-hover:bg-transparent transition-all" />
              </div>
              
              <div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] font-bold text-ochre mb-3">
                  {story.series.nodes.length > 0 && (
                    <span className="bg-rule text-paper px-1.5 py-0.5">
                      {story.series.nodes[0].name}
                    </span>
                  )}
                  <span>{story.categories.nodes[0]?.name || "Feature"}</span>
                </div>
                <h2 className="text-3xl font-serif font-medium leading-[1.1] mb-4 group-hover:text-ochre transition-colors">
                  {story.title}
                </h2>
                <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-mute flex items-center gap-3">
                  <span>{new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
