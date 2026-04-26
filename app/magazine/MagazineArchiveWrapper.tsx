import React from "react";
import { getWPData, GET_STORIES, GET_FILTERS, GET_SERIES_STORIES, GET_INDUSTRY_STORIES, GET_COUNTRY_STORIES, GET_TAG_INFO } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import Ticker from "@/components/Ticker";
import CategoryNav from "@/components/CategoryNav";
import MagazineFilters from "@/components/MagazineFilters";
import EditorialSection from "@/components/EditorialSection";
import "../magazine.css";

interface MagazineArchiveProps {
  category?: string;
  industry?: string;
  country?: string;
  series?: string;
  tag?: string;
}

export default async function MagazineArchiveWrapper({ 
  category, 
  industry, 
  country, 
  series,
  tag 
}: MagazineArchiveProps) {
  let stories: any[] = [];
  let filters: any = null;
  let termName = "";

  try {
    filters = await getWPData(GET_FILTERS);

    if (series) {
      const data = await getWPData(GET_SERIES_STORIES, { series });
      stories = data?.seriesItem?.posts?.nodes || [];
      termName = data?.seriesItem?.name || series;
    } else if (industry) {
      const data = await getWPData(GET_INDUSTRY_STORIES, { industry });
      stories = data?.industry?.posts?.nodes || [];
      termName = data?.industry?.name || industry;
    } else if (country) {
      const data = await getWPData(GET_COUNTRY_STORIES, { country });
      stories = data?.country?.posts?.nodes || [];
      termName = data?.country?.name || country;
    } else if (tag) {
      const [storyData, tagData] = await Promise.all([
        getWPData(GET_STORIES, { first: 48, tag }),
        getWPData(GET_TAG_INFO, { tag }),
      ]);
      stories = storyData?.posts?.nodes || [];
      termName = tagData?.tag?.name || tag;
    } else if (category) {
      const data = await getWPData(GET_STORIES, { first: 27, categoryName: category });
      stories = data?.posts?.nodes || [];
      termName = filters?.categories?.nodes?.find((c: any) => c.slug === category)?.name || category;
    } else {
      const data = await getWPData(GET_STORIES, { first: 27 });
      stories = data?.posts?.nodes || [];
    }
  } catch {
    // CMS unreachable
  }

  const allFetchedCats = filters?.categories?.nodes?.map((c: any) => ({
    name: c.name,
    slug: c.slug
  })) || [];

  const topCategories = [{ name: "All Stories", slug: "" }, ...allFetchedCats];

  const heroStory = stories[0] || null;
  const sidebarStories = stories.slice(1, 4);
  const sectionBandStories = stories.slice(4, 7);
  const portraitStories = stories.slice(7, 12);
  const editorialStories = stories.slice(12, 16);
  const digestStories = stories.slice(16, 20);
  const opinionStories = stories.slice(20, 26);
  const isFiltered = !!(category || industry || country || series || tag);

  return (
    <>
      <section className="mag-head">
        <div className="mag-head-inner">
          <div className="mag-head-left">
            <h1 className="mag-title-main">Moveee <em>Magazine</em></h1>
            <p className="mag-desc">
              Long-form essays, interviews, and cultural commentary. The editorial heart of The Moveee.
            </p>
          </div>
        </div>
        <div className="mag-tabs-container">
          <CategoryNav 
            categories={topCategories} 
            currentCategory={category || null}
            activeFilter={!!(industry || country || series || tag)}
          />
          <div className="secondary-filters-wrap">
            <MagazineFilters 
              filters={filters} 
              currentIndustry={industry}
              currentCountry={country}
              currentSeries={series}
            />
          </div>
        </div>
      </section>

      {isFiltered ? (
        <section className="section-band pt-[80px] pb-[160px] bg-paper relative z-[2]">
          <div className="sec-label">Filtered Results</div>
          <div className="sec-header mb-16">
            <h3>Stories from <em>{termName}</em></h3>
            <Link href="/magazine" className="font-mono text-[9px] uppercase tracking-[0.1em] text-ochre border-b border-ochre pb-1 transition-colors hover:text-ochre-deep hover:border-ochre-deep">Clear Filters ✕</Link>
          </div>
          {stories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} className="card group" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="img r-port relative aspect-[3/4] bg-ink overflow-hidden mb-3.5 transition-transform duration-400 group-hover:-translate-y-1">
                    {story.featuredImage?.node?.sourceUrl && (
                      <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="kicker font-mono text-[9px] tracking-[0.14em] uppercase text-ochre mb-2">
                    {story.categories?.nodes[0]?.name || "Article"}
                  </div>
                  <h4 className="font-serif text-[22px] font-normal leading-[1.05] mb-2 group-hover:text-ochre transition-colors" dangerouslySetInnerHTML={{ __html: story.title }} />
                  <div className="dek text-ink-soft text-[13px] line-clamp-2" dangerouslySetInnerHTML={{ __html: story.excerpt?.replace(/<[^>]*>/g, "") || "" }} />
                  <div className="meta font-mono text-[8px] tracking-[0.12em] uppercase text-mute mt-2">
                    {new Date(story.date).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-mute font-serif italic text-2xl py-20">
              No stories found with this filter constraint.
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="ticker-wrap">
            <div className="ticker-track">
              {[...Array(2)].map((_, i) => (
                <span key={i}>Visual Art <span className="a">✦</span> Film <span className="a">✦</span> Literature <span className="a">✦</span> Music <span className="a">✦</span> Fashion <span className="a">✦</span> Food <span className="a">✦</span> </span>
              ))}
            </div>
          </div>
          {heroStory && (
            <section className="hero-feature">
              <div className="hf-main">
                <div className="hf-eyebrow">
                  {heroStory.categories?.nodes?.[0]?.name || "Featured"}
                </div>
                <Link href={`/magazine/${heroStory.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div className="hf-img tall">
                    {heroStory.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={heroStory.featuredImage.node.sourceUrl}
                        alt={heroStory.featuredImage.node.altText || ""}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                      />
                    ) : (
                      <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        <rect width="100%" height="100%" fill="#14110d" />
                      </svg>
                    )}
                  </div>
                  <h2 className="hf-title" dangerouslySetInnerHTML={{ __html: heroStory.title }} />
                </Link>
                <div className="hf-standfirst" dangerouslySetInnerHTML={{ __html: heroStory.excerpt?.replace(/<[^>]*>/g, '') || '' }} />
                <div className="hf-meta">
                  <span>{new Date(heroStory.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <Link href={`/magazine/${heroStory.slug}`} className="read">Read Extended Edit ↗</Link>
                </div>
              </div>
              <div className="hf-divider" />
              {sidebarStories.length > 0 && (
                <div className="hf-sidebar">
                  {sidebarStories.map((story) => (
                    <Link key={story.id} href={`/magazine/${story.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="sf-story">
                        <div className="sf-kicker">{story.categories?.nodes?.[0]?.name || "Culture"}</div>
                        <div className="sf-img">
                          {story.featuredImage?.node?.sourceUrl && (
                            <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill style={{ objectFit: 'cover' }} />
                          )}
                        </div>
                        <h3 className="sf-title" dangerouslySetInnerHTML={{ __html: story.title }} />
                        <div className="sf-meta">{new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
          {sectionBandStories.length > 0 && (
            <section className="section-band featured-band">
              <div className="sec-label">Selected</div>
              <div className="sec-header">
                <h3>Featured <em>Stories</em></h3>
                <Link href="/magazine">View all →</Link>
              </div>
              <div className="grid-3">
                {sectionBandStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="card">
                    <div className="img r-port">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                    <div className="kicker">{story.categories?.nodes?.[0]?.name || "Article"}</div>
                    <h4 dangerouslySetInnerHTML={{ __html: story.title }} />
                    <div className="dek" dangerouslySetInnerHTML={{ __html: story.excerpt?.replace(/<[^>]*>/g, "") || "" }} />
                    <div className="meta">{new Date(story.date).toLocaleDateString('en-GB')}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {portraitStories.length > 0 && (
            <section className="portrait-scroll-wrap">
              <div className="sec-label">Visual</div>
              <div className="sec-header"><h3>In <em>Focus</em></h3></div>
              <div className="portrait-scroll">
                {portraitStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="portrait-card">
                    <div className="pf">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                    <div className="pk">{story.categories?.nodes?.[0]?.name || "Portrait"}</div>
                    <h4 dangerouslySetInnerHTML={{ __html: story.title }} />
                    <div className="pm">{new Date(story.date).toLocaleDateString('en-GB')}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {editorialStories.length > 0 && <EditorialSection stories={editorialStories} />}
          {digestStories.length > 0 && (
            <section className="digest">
              <div className="sec-label">Digest</div>
              <div className="sec-header"><h3>Quick <em>Reads</em></h3></div>
              <div className="digest-grid">
                {digestStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="digest-item">
                    <div className="di-img">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                    <div className="di-kicker">{story.categories?.nodes?.[0]?.name || "News"}</div>
                    <div className="di-title" dangerouslySetInnerHTML={{ __html: story.title }} />
                    <div className="di-meta">{new Date(story.date).toLocaleDateString('en-GB')}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {opinionStories.length > 0 && (
            <section className="opinions">
              <div className="opinions-inner">
                <div className="sec-label">Voices</div>
                <div className="sec-header"><h3><em>Opinions</em> & Essays</h3></div>
                <div className="op-grid">
                  {opinionStories.map((story) => (
                    <Link key={story.id} href={`/magazine/${story.slug}`} className="op-item">
                      <div className="op-quote font-serif italic text-[22px] font-light leading-[1.3] text-ink hover:text-ochre mb-4 transition-colors" dangerouslySetInnerHTML={{ __html: story.title }} />
                      <div className="op-author">{story.author?.node?.name || "The Moveee"}</div>
                      <div className="op-dek" dangerouslySetInnerHTML={{ __html: story.excerpt?.replace(/<[^>]*>/g, "").slice(0, 100) + "..." || "" }} />
                      <div className="op-kicker">{story.categories?.nodes?.[0]?.name || "Essay"}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
          <section className="cta-band">
            <div className="cta-band-inner">
              <div className="cta-band-left">
                <div className="cta-band-label">Weekly Dispatch</div>
                <h3>The Moveee <em>Newsletter</em></h3>
              </div>
              <div className="cta-band-mid">
                <p>Culture, art, heritage, and the stories worth reading — curated from Lagos, London, Accra, and the diaspora. In your inbox every Friday.</p>
                <div className="cta-band-tags"><span>Film</span><span>Art</span><span>Fashion</span><span>Heritage</span><span>Music</span></div>
              </div>
              <div className="cta-band-right">
                <Link href="/newsletter" className="cta-band-btn">Browse Issues →</Link>
                <div className="cta-band-note">Free · Published every Friday</div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
