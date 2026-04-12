import React from "react";
import { getWPData, GET_STORIES, GET_FILTERS, GET_TAX_STORIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import Ticker from "@/components/Ticker";
import MagazineFilters from "@/components/MagazineFilters";
import "../magazine.css";

export const dynamic = "force-dynamic";

export default async function MagazineArchive({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string, industry?: string, country?: string, series?: string }> 
}) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams?.category;
  const currentIndustry = resolvedParams?.industry;
  const currentCountry = resolvedParams?.country;
  const currentSeries = resolvedParams?.series;

  let stories: any[] = [];
  let filters: any = null;

  try {
    filters = await getWPData(GET_FILTERS);

    if (currentIndustry || currentCountry || currentSeries) {
      const taxData = await getWPData(GET_TAX_STORIES, {
        industry: currentIndustry || null,
        country: currentCountry || null,
        series: currentSeries || null,
      });

      if (currentIndustry) stories = taxData?.industry?.posts?.nodes || [];
      else if (currentCountry) stories = taxData?.country?.posts?.nodes || [];
      else if (currentSeries) stories = taxData?.seriesItem?.posts?.nodes || [];
    } else {
      const data = await getWPData(GET_STORIES, { 
        first: 24, 
        categoryName: currentCategory || null
      });
      stories = data?.posts?.nodes || [];
    }
  } catch {
    // CMS unreachable
  }

  // Construct dynamic categories wrapper from WP taxonomy fetch
  const allFetchedCats = filters?.categories?.nodes?.map((c: any) => ({
    name: c.name,
    slug: c.slug
  })) || [];

  const topCategories = [{ name: "All Stories", slug: "" }, ...allFetchedCats.slice(0, 5)];
  const moreCategories = allFetchedCats.slice(5);

  const heroStory = stories[0] || null;
  const sidebarStories = stories.slice(1, 4);
  const sectionBandStories = stories.slice(4, 7);
  const portraitStories = stories.slice(7, 12);
  const editorialStories = stories.slice(12, 14);
  const digestStories = stories.slice(14, 18);
  const isFiltered = !!(currentCategory || currentIndustry || currentCountry || currentSeries);
  const activeFilterName = currentCategory || currentIndustry || currentCountry || currentSeries || "";

  return (
    <>
      {/* ── MAGAZINE MASTHEAD ── */}
      <section className="mag-head">
        <div className="mag-head-inner">
          <div className="mag-head-left">
            <div className="issue-tag">Vol. II — The Document</div>
            <h1>
              Moveee<br /><em>Magazine</em>
            </h1>
            <p className="mag-desc">
              Long-form essays, interviews, and cultural commentary. The editorial heart of the platform.
            </p>
          </div>
          <div className="mag-head-right">
            <div className="issue-num">N°02</div>
          </div>
        </div>
        <div className="mag-tabs-container">
          <div className="mag-nav-primary overflow-visible">
            {topCategories.map((cat) => {
              const isActive = (currentCategory === cat.slug) || (!currentCategory && !currentIndustry && !currentCountry && !currentSeries && !cat.slug);
              return (
                <Link key={cat.name} href={cat.slug ? `/magazine?category=${cat.slug}` : "/magazine"} style={{ textDecoration: 'none' }}>
                  <button className={`tab ${isActive ? 'active' : ''}`}>
                    {cat.name}
                  </button>
                </Link>
              );
            })}
            
            {moreCategories.length > 0 && (
              <div className="more-group">
                <button className="tab border-r-0 flex items-center gap-1 cursor-pointer">
                  More ▾
                </button>
                <div className="more-dropdown">
                  {moreCategories.map((cat: any) => (
                    <Link key={cat.name} href={`/magazine?category=${cat.slug}`} className="more-dropdown-link">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="secondary-filters-wrap">
            <MagazineFilters filters={filters} />
          </div>
        </div>
      </section>

      {/* ── CONDITIONAL LAYOUT MAP ── */}
      {isFiltered ? (
        <section className="section-band pt-[80px] pb-[160px] bg-paper relative z-[2]">
          <div className="sec-label">Filtered Results</div>
          <div className="sec-header mb-16">
            <h3>Stories from <em>{activeFilterName}</em></h3>
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
                  <div className="dek text-ink-soft text-[13px] line-clamp-2" dangerouslySetInnerHTML={{ __html: story.excerpt.replace(/<[^>]*>/g, "") }} />
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
          {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <span key={i}>Visual Art <span className="a">✦</span> Film <span className="a">✦</span> Literature <span className="a">✦</span> Music <span className="a">✦</span> Fashion <span className="a">✦</span> Food <span className="a">✦</span> </span>
          ))}
        </div>
      </div>

      {/* ── HERO FEATURE ── */}
      {heroStory && (
        <section className="hero-feature">
          <div className="hf-main">
            <div className="hf-eyebrow">
              {heroStory.categories?.nodes?.[0]?.name || "Featured"}
            </div>
            
            <Link href={`/magazine/${heroStory.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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

            <div className="hf-standfirst" dangerouslySetInnerHTML={{ __html: heroStory.excerpt }} />
            
            <div className="hf-meta">
              <span>{new Date(heroStory.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <Link href={`/magazine/${heroStory.slug}`} className="read">
                Read Extended Edit ↗
              </Link>
            </div>
          </div>

          <div className="hf-divider" />

          {sidebarStories.length > 0 && (
            <div className="hf-sidebar">
              {sidebarStories.map((story) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="sf-story">
                    <div className="sf-kicker">
                      {story.categories?.nodes?.[0]?.name || "Culture"}
                    </div>
                    <div className="sf-img">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image src={story.featuredImage.node.sourceUrl} alt={story.title} fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                    <h3 className="sf-title" dangerouslySetInnerHTML={{ __html: story.title }} />
                    <div className="sf-meta">
                      {new Date(story.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── FEATURED SECTION — 3 col ── */}
      {sectionBandStories.length > 0 && (
        <section className="section-band">
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
                <div className="kicker">
                  {story.categories?.nodes?.[0]?.name || "Article"}
                </div>
                <h4 dangerouslySetInnerHTML={{ __html: story.title }} />
                <div className="dek" dangerouslySetInnerHTML={{ __html: story.excerpt.replace(/<[^>]*>/g, "") }} />
                <div className="meta">
                  {new Date(story.date).toLocaleDateString('en-GB')}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PORTRAIT SERIES HORIZONTAL SCROLL ── */}
      {portraitStories.length > 0 && (
        <section className="portrait-scroll-wrap">
          <div className="sec-label">Visual</div>
          <div className="sec-header">
            <h3>In <em>Focus</em></h3>
          </div>
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

      {/* ── EDITORIAL — full-bleed dark ── */}
      {editorialStories.length > 0 && (
        <section className="editorial">
          <div className="editorial-inner">
            <div className="ed-left">
              <h3>The <em>Edit</em></h3>
              <p>Curated perspectives on the most important cultural moments happening right now.</p>
              <div className="ed-grid">
                {editorialStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="ed-item">
                    <div className="ek">{story.categories?.nodes?.[0]?.name || "Opinion"}</div>
                    <h4 dangerouslySetInnerHTML={{ __html: story.title }} />
                    <div className="em">{new Date(story.date).toLocaleDateString('en-GB')}</div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="ed-visual">
              {editorialStories[0]?.featuredImage?.node?.sourceUrl && (
                <Image src={editorialStories[0].featuredImage.node.sourceUrl} alt="Editorial Visual" fill style={{ objectFit: 'cover' }} />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── DIGEST ROW — small cards ── */}
      {digestStories.length > 0 && (
        <section className="digest pt-16">
          <div className="sec-label">Digest</div>
          <div className="sec-header">
            <h3>Quick <em>Reads</em></h3>
          </div>
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

      {/* ── OPINIONS ── */}
      {opinionStories.length > 0 && (
        <section className="opinions">
          <div className="opinions-inner">
            <div className="sec-label">Voices</div>
            <div className="sec-header">
              <h3><em>Opinions</em> & Essays</h3>
            </div>
            <div className="op-grid">
              {opinionStories.map((story) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} className="op-item">
                  <div className="op-quote font-serif italic text-[22px] font-light leading-[1.3] text-ink hover:text-ochre mb-4 transition-colors" dangerouslySetInnerHTML={{ __html: story.title }} />
                  <div className="op-author">{story.author?.node?.name || "The Moveee"}</div>
                  <div className="op-dek" dangerouslySetInnerHTML={{ __html: story.excerpt.replace(/<[^>]*>/g, "").slice(0, 100) + "..." }} />
                  <div className="op-kicker">{story.categories?.nodes?.[0]?.name || "Essay"}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SUBSCRIBE BAND ── */}
      <section className="sub-band">
        <div className="sub-inner">
          <div className="sub-left">
            <h3>Join <em>The Moveee</em></h3>
            <p>Get our weekly dispatch covering film, art, fashion, and the stories defining culture on the continent and beyond.</p>
          </div>
          <div className="sub-form">
            <div className="sf-label">Newsletter</div>
            <input type="email" placeholder="Enter your email address..." />
            <button className="sub-btn">Subscribe Free →</button>
            <div className="sub-note">First issue arrives this Friday.</div>
          </div>
        </div>
      </section>
        </>
      )}
    </>
  );
}
