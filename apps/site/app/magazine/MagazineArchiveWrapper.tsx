import { getWPData, GET_STORIES, GET_FILTERS, GET_SERIES_STORIES, GET_INDUSTRY_STORIES, GET_COUNTRY_STORIES, GET_TAG_INFO, GET_CATEGORY_INFO } from "@/lib/wp";
import { decodeHtml } from "@/lib/decode-html";
import Link from "next/link";
import Image from "next/image";
import CategoryNav from "@/components/CategoryNav";
import EditorialSection from "@/components/EditorialSection";
import MagazineFilterPills from "@/components/MagazineFilterPills";
import SeriesLandingPage from "@/components/SeriesLandingPage";
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
  let editorialStories: any[] = [];
  let opinionStories: any[] = [];
  let portraitStories: any[] = [];
  let digestStories: any[] = [];
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
      // "The Edit", "Opinions & Essays", "The Lane", and "Quick Reads" are all
      // fetched separately from the main story pool so they stay pinned to
      // their own taxonomy term (News category, Viewpoints category, The Lane
      // series, The Free Critics series) regardless of what else is on the
      // page — a plain positional slice of `stories` would mix in whatever
      // content happened to land in that range. Fetches a larger main pool
      // (40, not 27) to leave headroom for the dedupe below.
      const [data, editData, opinionData, portraitData, digestData] = await Promise.all([
        getWPData(GET_STORIES, { first: 40 }),
        getWPData(GET_STORIES, { first: 7, categoryName: "news" }),
        getWPData(GET_STORIES, { first: 4, categoryName: "viewpoints" }),
        getWPData(GET_SERIES_STORIES, { series: "the-lane" }),
        getWPData(GET_SERIES_STORIES, { series: "the-free-critics" }),
      ]);
      editorialStories = editData?.posts?.nodes || [];
      opinionStories = opinionData?.posts?.nodes || [];
      portraitStories = (portraitData?.seriesItem?.posts?.nodes || []).slice(0, 5);
      digestStories = (digestData?.seriesItem?.posts?.nodes || []).slice(0, 4);
      // News is fully excluded from every other section — the whole category,
      // not just the 7 picked posts (an explicit, standing request). Viewpoints,
      // The Lane, and The Free Critics are NOT excluded wholesale — a post from
      // any of those that wasn't picked for Opinions/The Lane/Quick Reads can
      // still surface naturally in the hero/sidebar/band sections. Only the
      // exact posts already used for those pinned sections are deduped out by
      // id, so nothing repeats.
      const usedElsewhereIds = new Set([
        ...opinionStories.map((p: any) => p.id),
        ...portraitStories.map((p: any) => p.id),
        ...digestStories.map((p: any) => p.id),
      ]);
      stories = (data?.posts?.nodes || []).filter(
        (p: any) =>
          !p.categories?.nodes?.some((c: any) => c.slug === "news") &&
          !usedElsewhereIds.has(p.id)
      );
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
  const isFiltered = !!(category || industry || country || series || tag);

  return (
    <>
      {/* ── MAGAZINE NAV ── */}
      <section className="mg-head">
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

      {series ? (
        /* ── SERIES LANDING PAGE ── */
        <SeriesLandingPage name={termName} description={termDescription} stories={stories} />
      ) : isFiltered ? (
        /* ── FILTERED VIEW ── */
        <section className="mg-filtered">
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
                    <div className="mg-card-body">
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
          {/* ── HERO ── */}
          {heroStory && (
            <section className="mg-hero">
              <div className="mg-hero-grid">
                <Link href={`/magazine/${heroStory.slug}`} className="mg-hero-img-link">
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
                </Link>

                <div className="mg-hero-text">
                  <div className="mg-hero-eyebrow">
                    ★ {decodeHtml(heroStory.categories?.nodes?.[0]?.name || "Featured")}
                  </div>
                  <Link href={`/magazine/${heroStory.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
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
                    <span className="mg-hero-date">
                      {new Date(heroStory.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <Link href={`/magazine/${heroStory.slug}`} className="mg-hero-read">
                      Read Full Story →
                    </Link>
                  </div>
                </div>
              </div>

              {sidebarStories.length > 0 && (
                <div className="mg-week-row">
                  {sidebarStories.map((story) => (
                    <Link key={story.id} href={`/magazine/${story.slug}`} className="mg-week-card">
                      <div className="mg-week-thumb">
                        {story.featuredImage?.node?.sourceUrl && (
                          <Image
                            src={story.featuredImage.node.sourceUrl}
                            alt={story.title}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <div className="mg-week-kicker">
                        {decodeHtml(story.categories?.nodes?.[0]?.name || "Culture")}
                      </div>
                      <h4
                        className="mg-week-title"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                      />
                      <div className="mg-week-date">
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
              <div className="mg-band-inner">
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
                      <div className="mg-card-body">
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
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── PORTRAIT SCROLL ── */}
          {portraitStories.length > 0 && (
            <section className="mg-portrait">
              <div className="mg-portrait-header">
                <div className="mg-sec-header">
                  <h3>The <em>Lane</em></h3>
                </div>
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
              <div className="mg-digest-inner">
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
              </div>
            </section>
          )}

          {/* ── OPINIONS ── */}
          {opinionStories.length > 0 && (
            <section className="mg-opinions">
              <div className="mg-opinions-inner">
                <div className="mg-sec-header">
                  <h3><em>Opinions</em> &amp; Essays</h3>
                </div>
                <div className="mg-op-grid">
                  {opinionStories.map((story) => (
                    <Link
                      key={story.id}
                      href={`/magazine/${story.slug}`}
                      className="mg-op-card"
                    >
                      <div className="mg-op-img">
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
                      <div className="mg-op-body">
                        <div className="mg-op-kicker">
                          {decodeHtml(story.categories?.nodes?.[0]?.name || "Essay")}
                        </div>
                        <h4
                          className="mg-op-title"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                        />
                        <div className="mg-op-author">
                          By {story.author?.node?.name || "The Moveee"}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── CTA BAND ── */}
          <section className="mg-cta-section">
            <div className="mg-cta-band">
              <div className="mg-cta-left">
                <div className="mg-cta-label">Weekly Dispatch</div>
                <h3>The Moveee <em>Newsletter</em></h3>
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
