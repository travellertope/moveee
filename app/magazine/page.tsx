import React from "react";
import { getWPData, GET_STORIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import Ticker from "@/components/Ticker";
import "../magazine.css";

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
      first: 24, 
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

  const heroStory = stories[0] || null;
  const sidebarStories = stories.slice(1, 4);
  const sectionBandStories = stories.slice(4, 7);
  const portraitStories = stories.slice(7, 12);
  const editorialStories = stories.slice(12, 14);
  const digestStories = stories.slice(14, 18);
  const opinionStories = stories.slice(18, 21);

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
        <div className="mag-head-tabs">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.slug || (!currentCategory && !cat.slug);
            return (
              <Link key={cat.name} href={cat.slug ? `/magazine?category=${cat.slug}` : "/magazine"} style={{ textDecoration: 'none' }}>
                <button className={`tab ${isActive ? 'active' : ''}`}>
                  {cat.name}
                </button>
              </Link>
            );
          })}
        </div>
      </section>

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
  );
}
