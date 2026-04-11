import Link from "next/link";
import Image from "next/image";
import { getWPData, GET_STORIES } from "@/lib/wp";
import Hero from "@/components/Hero";

export const dynamic = "force-dynamic";

export default async function Home() {
  let stories: any[] = [];
  try {
    const data = await getWPData(GET_STORIES, { first: 6 });
    stories = data?.posts?.nodes || [];
  } catch {
    // CMS unreachable — render with empty stories
  }
  const featuredStory = stories[0];
  const remainingStories = stories.slice(1);

  return (
    <div className="min-h-screen bg-paper">
      <Hero />
      
      {/* Featured Story / Series Spotlight */}
      {featuredStory && (
        <section className="px-6 py-24 border-b border-rule">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-bold text-ochre mb-8">
              <span className="w-8 h-[1px] bg-ochre" />
              Spotlight
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <h2 className="text-6xl md:text-[100px] font-serif font-black uppercase leading-[0.85] tracking-tight text-ink mb-10">
                  {featuredStory.title.split(' ').slice(0, -1).join(' ')}<br/>
                  <span className="italic font-light">{featuredStory.title.split(' ').slice(-1)}</span>
                </h2>
                <div 
                  className="text-xl md:text-2xl font-serif text-ink-soft leading-relaxed mb-12 max-w-xl italic line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: featuredStory.excerpt }}
                />
                <Link href={`/magazine/${featuredStory.slug}`} className="inline-block border border-ink px-10 py-4 text-[11px] uppercase font-bold tracking-[0.3em] hover:bg-ink hover:text-paper transition-all">
                  Read the Feature
                </Link>
              </div>
              <div className="order-1 lg:order-2 aspect-[4/5] bg-paper-deep relative overflow-hidden">
                {featuredStory.featuredImage && (
                  <Image 
                    src={featuredStory.featuredImage.node.sourceUrl} 
                    alt={featuredStory.featuredImage.node.altText || featuredStory.title} 
                    fill 
                    className="object-cover transition-transform duration-1000 hover:scale-105"
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Dispatches Grid */}
      <section className="px-6 py-24 bg-paper-deep/30">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-end justify-between border-b border-rule pb-8 mb-16 gap-8">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.4em] font-bold text-ochre mb-4">Latest Dispatches</h3>
              <p className="text-3xl md:text-5xl font-serif font-medium leading-none">News from the Frontlines</p>
            </div>
            <Link href="/magazine" className="text-[10px] uppercase font-bold tracking-[0.2em] border-b border-ink pb-2 hover:text-ochre hover:border-ochre transition-all whitespace-nowrap">
              Visit The Archive
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
            {stories.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="flex flex-col group cursor-pointer">
                <div className="aspect-[4/5] bg-paper overflow-hidden relative mb-8">
                  {story.featuredImage ? (
                    <Image 
                      src={story.featuredImage.node.sourceUrl} 
                      alt={story.featuredImage.node.altText || ""} 
                      fill 
                      className="object-cover grayscale hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-ink/5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.2em] text-ochre mb-3">
                    <span>{story.categories.nodes[0]?.name || "Cultural"}</span>
                    {story.series.nodes.length > 0 && (
                       <span className="text-mute px-2 py-0.5 border border-rule/20 text-[8px] tracking-[0.1em]">
                        {story.series.nodes[0].name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-3xl font-serif font-medium leading-[1.1] mb-4 group-hover:text-ochre transition-colors">
                    {story.title}
                  </h4>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-mute font-mono flex items-center gap-4">
                    <span>{new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
                    <span className="w-1 h-1 bg-rule rounded-full" />
                    <span>Editorial</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="px-6 py-40 border-t border-rule text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-serif italic font-light leading-tight mb-12">
            The archive is ever-evolving, a living document of where we have been and where we are <span className="font-medium not-italic underline decoration-ochre underline-offset-8">becoming.</span>
          </h2>
          <div className="text-[11px] uppercase tracking-[0.4em] font-bold text-ink-soft">
            Explore the Diaspora
          </div>
        </div>
      </section>
    </div>
  );
}
