import React from "react";
import { getWPData, GET_STORIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import Ticker from "@/components/Ticker";

export const dynamic = "force-dynamic";

export default async function MagazineArchive({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string }> 
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams?.category;
  let stories: any[] = [];
  try {
    const data = await getWPData(GET_STORIES, { 
      first: 20, 
      categoryName: currentCategory 
    });
    stories = data?.posts?.nodes || [];
  } catch {
    // CMS unreachable
  }

  const categories = [
    { name: "All Stories", slug: "" },
    { name: "Culture", slug: "culture" },
    { name: "Lifestyle", slug: "lifestyle" },
    { name: "Interviews", slug: "interviews" },
    { name: "Portraits", slug: "portraits" },
    { name: "Dispatches", slug: "dispatches" }
  ];

  // The hero uses the first story, the sidebar uses the next 3, and the grid uses the rest.
  const heroStory = stories[0] || null;
  const sidebarStories = stories.slice(1, 4);
  const gridStories = stories.slice(4);

  return (
    <>
      {/* ── MAGAZINE MASTHEAD ── */}
      <section className="mag-head border-b-2 border-rule relative z-[2] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-10 md:px-[60px] pt-[60px] flex flex-col md:flex-row md:items-end gap-[60px]">
          <div className="mag-head-left relative z-10 w-full relative pb-10">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ochre mb-[18px]">
              Vol. II — The Document
            </div>
            <h1 className="text-[clamp(64px,7vw,120px)] font-light leading-[0.88] tracking-[-0.04em] mb-0">
              Moveee<br /><em className="italic text-ochre font-light">Magazine</em>
            </h1>
            <p className="font-serif text-[18px] font-light italic text-mute max-w-[560px] leading-[1.55] mt-5 mb-0">
              Long-form essays, interviews, and cultural commentary. The editorial heart of the platform.
            </p>
          </div>
          <div className="hidden md:block absolute right-[60px] top-[30px] font-serif text-[160px] font-light italic text-ochre leading-[0.8] opacity-20 pointer-events-none">
            N°02
          </div>
        </div>

        <div className="flex gap-0 border-t border-rule overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.slug || (!currentCategory && !cat.slug);
            return (
              <Link key={cat.name} href={cat.slug ? `/magazine?category=${cat.slug}` : "/magazine"} style={{ textDecoration: 'none' }}>
                <button className={`font-mono text-[10px] tracking-[0.15em] uppercase px-6 py-3.5 border-r border-rule cursor-pointer whitespace-nowrap transition-colors duration-250 ${isActive ? 'bg-ink text-paper' : 'bg-transparent text-mute hover:bg-paper-deep hover:text-ink'}`}>
                  {cat.name}
                </button>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap flex">
        <div className="ticker-track">
          <span>Visual Art <span className="a">✦</span> Film <span className="a">✦</span> Literature <span className="a">✦</span> Music <span className="a">✦</span> Fashion <span className="a">✦</span> Food <span className="a">✦</span></span>
          <span>Visual Art <span className="a">✦</span> Film <span className="a">✦</span> Literature <span className="a">✦</span> Music <span className="a">✦</span> Fashion <span className="a">✦</span> Food <span className="a">✦</span></span>
        </div>
      </div>

      {/* ── HERO FEATURE ── */}
      {heroStory && (
        <section className="hero-feature max-w-[1440px] mx-auto px-6 md:px-[60px] border-b-2 border-rule relative z-[2] grid grid-cols-1 lg:grid-cols-[1fr_1px_340px]">
          
          <div className="hf-main py-10 lg:py-[50px] lg:pr-[60px]">
            <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ochre mb-3.5">
              {heroStory.categories?.nodes[0]?.name || "Featured"}
            </div>
            
            <Link href={`/magazine/${heroStory.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="hf-img tall relative aspect-video bg-ink overflow-hidden mb-6 group">
                {heroStory.featuredImage && (
                  <Image 
                    src={heroStory.featuredImage.node.sourceUrl} 
                    alt={heroStory.featuredImage.node.altText || ""} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                )}
              </div>
              <h2 className="text-[clamp(36px,3.8vw,60px)] font-normal mb-3 leading-[0.92] hover:text-ochre transition-colors">
                {heroStory.title}
              </h2>
            </Link>

            <div className="font-serif text-[17px] font-light italic text-ink-soft leading-[1.5] mb-5 line-clamp-3" dangerouslySetInnerHTML={{ __html: heroStory.excerpt }} />
            
            <div className="hf-meta flex flex-wrap gap-[18px] font-mono text-[9px] tracking-[0.13em] uppercase text-mute">
              <span>{new Date(heroStory.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <Link href={`/magazine/${heroStory.slug}`} className="text-ochre border-b border-ochre pb-[1px] cursor-pointer" style={{ textDecoration: 'none' }}>
                Read Extended Edit ↗
              </Link>
            </div>
          </div>

          <div className="hf-divider hidden lg:block bg-rule w-full h-full" />

          {sidebarStories.length > 0 && (
            <div className="hf-sidebar py-10 lg:py-[50px] lg:pl-[50px] flex flex-col border-t border-rule lg:border-t-0">
              {sidebarStories.map((story) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="sf-story py-5 border-b border-rule/20 cursor-pointer group first:pt-0 last:border-b-0">
                    <div className="font-mono text-[8px] tracking-[0.15em] uppercase text-ochre mb-1.5">
                      {story.categories?.nodes[0]?.name || "Culture"}
                    </div>
                    <div className="sf-img relative block aspect-video bg-ink overflow-hidden mb-2.5">
                      {story.featuredImage && (
                        <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      )}
                    </div>
                    <h3 className="font-serif text-[20px] font-normal leading-[1.05] mb-1.5 group-hover:text-ochre transition-colors">
                      {story.title}
                    </h3>
                    <div className="font-mono text-[8px] tracking-[0.12em] uppercase text-mute">
                      {new Date(story.date).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── FROM THE ARCHIVE GRID ── */}
      {gridStories.length > 0 && (
        <section className="section-band max-w-[1440px] mx-auto py-[60px] px-6 md:px-[60px] relative z-[2]">
          <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ochre mb-0 pb-2.5 border-b border-rule w-full block">
            From the Archive
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {gridStories.map((story) => (
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
                <div className="meta font-mono text-[8px] tracking-[0.12em] uppercase text-mute mt-2">
                  {new Date(story.date).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
