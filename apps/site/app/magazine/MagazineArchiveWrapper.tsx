import { getWPData, GET_STORIES, GET_FILTERS, GET_SERIES_STORIES, GET_INDUSTRY_STORIES, GET_COUNTRY_STORIES, GET_TAG_INFO, GET_CATEGORY_INFO } from "@/lib/wp";
import { decodeHtml } from "@/lib/decode-html";
import Link from "next/link";
import Image from "next/image";
import CategoryNav from "@/components/CategoryNav";
import EditorialSection from "@/components/EditorialSection";
import MagazineFilterPills from "@/components/MagazineFilterPills";
import "../magazine.css";
import { sanitizeHtml } from "@/lib/sanitize";

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
  tag,
}: MagazineArchiveProps) {
  let stories: any[] = [];
  let filters: any = null;
  let termName = "";
  let termDescription = "";

  try {
    filters = await getWPData(GET_FILTERS);

    if (series) {
      const data = await getWPData(GET_SERIES_STORIES, { series });
      stories = data?.seriesItem?.posts?.nodes || [];
      termName = data?.seriesItem?.name || series;
      termDescription = data?.seriesItem?.description || "";
    } else if (industry) {
      const data = await getWPData(GET_INDUSTRY_STORIES, { industry });
      stories = data?.industry?.posts?.nodes || [];
      termName = data?.industry?.name || industry;
      termDescription = data?.industry?.description || "";
    } else if (country) {
      const data = await getWPData(GET_COUNTRY_STORIES, { country });
      stories = data?.country?.posts?.nodes || [];
      termName = data?.country?.name || country;
      termDescription = data?.country?.description || "";
    } else if (tag) {
      const [storyData, tagData] = await Promise.all([
        getWPData(GET_STORIES, { first: 48, tag }),
        getWPData(GET_TAG_INFO, { tag }),
      ]);
      stories = storyData?.posts?.nodes || [];
      termName = tagData?.tag?.name || tag;
      termDescription = tagData?.tag?.description || "";
    } else if (category) {
      const [storyData, catData] = await Promise.all([
        getWPData(GET_STORIES, { first: 27, categoryName: category }),
        getWPData(GET_CATEGORY_INFO, { slug: category }),
      ]);
      stories = storyData?.posts?.nodes || [];
      termName =
        catData?.category?.name ||
        filters?.categories?.nodes?.find((c: any) => c.slug === category)?.name ||
        category;
      termDescription = catData?.category?.description || "";
    } else {
      const data = await getWPData(GET_STORIES, { first: 27 });
      stories = data?.posts?.nodes || [];
    }
  } catch {
    // CMS unreachable
  }

  const allFetchedCats =
    filters?.categories?.nodes?.map((c: any) => ({ name: c.name, slug: c.slug })) || [];
  const topCategories = [{ name: "All Stories", slug: "" }, ...allFetchedCats];

  const seriesOptions = filters?.series?.nodes || [];
  const industryOptions = filters?.industries?.nodes || [];
  const countryOptions = filters?.countries?.nodes || [];

  const heroStory = stories[0] || null;
  const sidebarStories = stories.slice(1, 4);
  const sectionBandStories = stories.slice(4, 7);
  const portraitStories = stories.slice(7, 12);
  const editorialStories = stories.slice(12, 16);
  const digestStories = stories.slice(16, 20);
  const opinionStories = stories.slice(20, 22);
  const isFiltered = !!(category || industry || country || series || tag);

  return (
    <>
      {/* ── MAGAZINE HEAD ── */}
      <section className="mg-head">
        <div className="mg-head-inner">
          <h1 className="mg-head-title">Moveee <em>Editorials</em></h1>
          <p className="mg-head-desc">
            Long-form essays, interviews, and cultural commentary. The editorial heart of The Moveee.
          </p>
        </div>

        <nav className="mg-nav">
          <CategoryNav
            categories={topCategories}
            currentCategory={category || null}
            activeFilter={!!(industry || country || series || tag)}
          />

          {/* Filter pills — client component (event handlers not allowed in RSC) */}
          <MagazineFilterPills
            seriesOptions={seriesOptions}
            industryOptions={industryOptions}
            countryOptions={countryOptions}
            activeSeries={series}
            activeIndustry={industry}
            activeCountry={country}
          />
          {isFiltered && (
            <Link href="/magazine" className="mg-filter-clear">Clear ✕</Link>
          )}
        </nav>
      </section>

      {isFiltered ? (
        /* ── FILTERED VIEW ── */
        <section className="mg-filtered">
          <div className="mg-sec-label">Filtered Results</div>
          <div className="mg-sec-header">
            <h3>Stories from <em>{termName}</em></h3>
            <Link href="/magazine" className="mg-sec-all">Clear Filters ✕</Link>
          </div>
          {termDescription && (
            <div
              className="mg-term-desc"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(termDescription) }}
            />
          )}
          {stories.length > 0 ? (
            <div className="mg-filtered-grid">
                {stories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-card">
                    <div className="mg-card-img">
                      {story.featuredImage?.node?.sourceUrl ? (
                        <Image
                          src={story.featuredImage.node.sourceUrl}
                          alt={story.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                      )}
                    </div>
                    <div className="mg-card-kicker">
                      {decodeHtml(story.categories?.nodes[0]?.name || "Article")}
                    </div>
                    <h4
                      className="mg-card-title"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                    />
                    <div
                      className="mg-card-desc"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(story.excerpt?.replace(/<[^>]*>/g, "") || ""),
                      }}
                    />
                    <div className="mg-card-date">
                      {new Date(story.date).toLocaleDateString("en-GB")}
                    </div>
                  </Link>
                ))}
              </div>
          ) : (
            <p className="mg-empty">No stories found with this filter constraint.</p>
          )}
        </section>
      ) : (
        <>
          {/* ── TICKER ── */}
          <div className="ticker-wrap">
            <div className="ticker-track">
              {[...Array(2)].map((_, i) => (
                <span key={i}>
                  Visual Art <span className="a">✦</span> Film <span className="a">✦</span>{" "}
                  Literature <span className="a">✦</span> Music <span className="a">✦</span>{" "}
                  Fashion <span className="a">✦</span> Food <span className="a">✦</span>{" "}
                </span>
              ))}
            </div>
          </div>

          {/* ── HERO ── */}
          {heroStory && (
            <section className="mg-hero">
              <div className="mg-hero-main">
                <div className="mg-hero-eyebrow">
                  {decodeHtml(heroStory.categories?.nodes?.[0]?.name || "Featured")}
                </div>
                <Link href={`/magazine/${heroStory.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="mg-hero-img">
                    {heroStory.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={heroStory.featuredImage.node.sourceUrl}
                        alt={heroStory.featuredImage.node.altText || ""}
                        fill
                        style={{ objectFit: "cover" }}
                        priority
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                  </div>
                  <h2
                    className="mg-hero-title"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(heroStory.title) }}
                  />
                </Link>
                <div
                  className="mg-hero-desc"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(heroStory.excerpt?.replace(/<[^>]*>/g, "") || ""),
                  }}
                />
                <div className="mg-hero-meta">
                  <span>
                    {new Date(heroStory.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <Link href={`/magazine/${heroStory.slug}`} className="mg-hero-read">
                    Read Extended Edit ↗
                  </Link>
                </div>
              </div>

              <div className="mg-hero-divider" />

              {sidebarStories.length > 0 && (
                <div className="mg-hero-sidebar">
                  {sidebarStories.map((story) => (
                    <Link
                      key={story.id}
                      href={`/magazine/${story.slug}`}
                      className="mg-sf-card"
                    >
                      <div className="mg-sf-kicker">
                        {decodeHtml(story.categories?.nodes?.[0]?.name || "Culture")}
                      </div>
                      <div className="mg-sf-thumb">
                        {story.featuredImage?.node?.sourceUrl && (
                          <Image
                            src={story.featuredImage.node.sourceUrl}
                            alt={story.title}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <h3
                        className="mg-sf-title"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                      />
                      <div className="mg-sf-date">
                        {new Date(story.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── FEATURED BAND ── */}
          {sectionBandStories.length > 0 && (
            <section className="mg-band">
              <div className="mg-sec-label">Selected</div>
              <div className="mg-sec-header">
                <h3>Featured <em>Stories</em></h3>
                <Link href="/magazine" className="mg-sec-all">View all →</Link>
              </div>
              <div className="mg-band-grid">
                {sectionBandStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-card">
                    <div className="mg-card-img">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image
                          src={story.featuredImage.node.sourceUrl}
                          alt={story.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div className="mg-card-kicker">
                      {story.categories?.nodes?.[0]?.name || "Article"}
                    </div>
                    <h4
                      className="mg-card-title"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                    />
                    <div
                      className="mg-card-desc"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(story.excerpt?.replace(/<[^>]*>/g, "") || ""),
                      }}
                    />
                    <div className="mg-card-date">
                      {new Date(story.date).toLocaleDateString("en-GB")}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── PORTRAIT SCROLL ── */}
          {portraitStories.length > 0 && (
            <section className="mg-portrait">
              <div className="mg-sec-label">Visual</div>
              <div className="mg-sec-header">
                <h3>In <em>Focus</em></h3>
              </div>
              <div className="mg-portrait-scroll">
                {portraitStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-portrait-card">
                    <div className="mg-portrait-img">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image
                          src={story.featuredImage.node.sourceUrl}
                          alt={story.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div className="mg-portrait-kicker">
                      {decodeHtml(story.categories?.nodes?.[0]?.name || "Portrait")}
                    </div>
                    <h4
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                    />
                    <div className="mg-portrait-date">
                      {new Date(story.date).toLocaleDateString("en-GB")}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── EDITORIAL SECTION ── */}
          {editorialStories.length > 0 && <EditorialSection stories={editorialStories} />}

          {/* ── DIGEST ── */}
          {digestStories.length > 0 && (
            <section className="mg-digest">
              <div className="mg-sec-label">Digest</div>
              <div className="mg-sec-header">
                <h3>Quick <em>Reads</em></h3>
              </div>
              <div className="mg-digest-grid">
                {digestStories.map((story) => (
                  <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-ditem">
                    <div className="mg-ditem-img">
                      {story.featuredImage?.node?.sourceUrl && (
                        <Image
                          src={story.featuredImage.node.sourceUrl}
                          alt={story.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div className="mg-ditem-kicker">
                      {decodeHtml(story.categories?.nodes?.[0]?.name || "News")}
                    </div>
                    <div
                      className="mg-ditem-title"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                    />
                    <div className="mg-ditem-date">
                      {new Date(story.date).toLocaleDateString("en-GB")}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── OPINIONS ── */}
          {opinionStories.length > 0 && (
            <section className="mg-opinions">
              <div className="mg-opinions-inner">
                <div className="mg-sec-label">Voices</div>
                <div className="mg-sec-header">
                  <h3><em>Opinions</em> &amp; Essays</h3>
                </div>
                <div className="mg-op-grid">
                  {opinionStories.map((story) => (
                    <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-op-card">
                      <div
                        className="mg-op-quote"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                      />
                      <div className="mg-op-author">
                        {story.author?.node?.name || "The Moveee"}
                      </div>
                      <div
                        className="mg-op-desc"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(
                            (story.excerpt?.replace(/<[^>]*>/g, "").slice(0, 100) || "") + "..."
                          ),
                        }}
                      />
                      <div className="mg-op-kicker">
                        {decodeHtml(story.categories?.nodes?.[0]?.name || "Essay")}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── CTA BAND ── */}
          <section className="mg-cta">
            <div className="mg-cta-inner">
              <div className="mg-cta-left">
                <div className="mg-cta-label">Weekly Dispatch</div>
                <h3>The Moveee <em>Newsletter</em></h3>
              </div>
              <div className="mg-cta-mid">
                <p>
                  Culture, art, heritage, and the stories worth reading — curated from Lagos, London,
                  Accra, and beyond. In your inbox every Friday.
                </p>
                <div className="mg-cta-tags">
                  <span>Film</span>
                  <span>Art</span>
                  <span>Fashion</span>
                  <span>Heritage</span>
                  <span>Music</span>
                </div>
              </div>
              <div className="mg-cta-right">
                <Link href="/newsletter" className="mg-cta-btn">Browse Issues →</Link>
                <div className="mg-cta-note">Free · Published every Tuesday</div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
