import {
  getWPData,
  GET_STORIES,
  GET_FILTERS,
  GET_SERIES_STORIES,
  GET_INDUSTRY_STORIES,
  GET_COUNTRY_STORIES,
  GET_TAG_INFO,
  GET_CATEGORY_INFO,
  getAllIssues,
  getNewslettersWithFallback,
  type IssueTerm,
} from "@/lib/wp";
import Link from "next/link";
import SeriesLandingPage from "@/components/SeriesLandingPage";
import MagazineHub from "@/components/MagazineHub";
import ArchiveCardGrid from "@/components/ArchiveCardGrid";
import "../magazine.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { type EditionSlug } from "@/lib/editions";

interface MagazineArchiveProps {
  category?: string;
  industry?: string;
  country?: string;
  series?: string;
  tag?: string;
  // Visitor's detected edition (UK/US/Africa/global) — threaded straight
  // through to MagazineHub's newsletter CTA (same edition prop JoinSection
  // already takes on the homepage). Issues/sections/series themselves
  // aren't edition-scoped data, so this doesn't otherwise change what the
  // unfiltered view shows.
  edition?: EditionSlug;
}

export default async function MagazineArchiveWrapper({
  category,
  industry,
  country,
  series,
  tag,
  edition,
}: MagazineArchiveProps) {
  let stories: any[] = [];
  let issues: IssueTerm[] = [];
  let featureStory: any = null;
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
      // ── MAGAZINE HUB (default, unfiltered view) ──
      // A structured directory of the magazine's own shape (issues,
      // sections, series) rather than a live story feed — that job now
      // belongs to the homepage, which already surfaces The Front Page/
      // The Lane/The Edit/The Free Critics/Opinions via the same
      // getMagazineSections() this branch used to call. featureStory is
      // the latest Culture Drop issue, for the same JoinSection CTA the
      // homepage uses — see JoinSection.tsx for why newsletter data (not
      // getMagazineSections' topPool) is the right source for that card.
      const [issuesData, newsletters] = await Promise.all([
        getAllIssues(),
        getNewslettersWithFallback(10).catch(() => []),
      ]);
      issues = issuesData;
      featureStory = newsletters.find((n: any) => n.nlList === "culture-drop") || newsletters[0] || null;
    }
  } catch (err: any) {
    // CMS unreachable — was previously a silent no-op, which made a blank
    // page here undiagnosable in Vercel logs. Now logged (still degrades
    // to an empty archive rather than erroring the page).
    console.error("[magazine-archive] story fetch failed:", err?.message || err);
  }

  const allFetchedCats =
    filters?.categories?.nodes?.map((c: any) => ({ name: c.name, slug: c.slug })) || [];

  const seriesOptions = filters?.series?.nodes || [];

  const isFiltered = !!(category || industry || country || series || tag);

  return (
    <>
      {/* ── HEADER CLEARANCE ──
          The category-tab/filter-pill nav that used to live here is gone
          (removed per explicit request — the Magazine Hub's own Sections/
          Series grids are the browsing UI now). This section is kept as a
          spacer only, sized to the exact height the nav used to occupy
          (measured: 96px header-clear + ~44px nav row) so the distance
          between the floating header and the first real section's title
          is unchanged. Only rendered for the series/filtered branches —
          the Hub's own .mgh-intro now carries its own header-clear
          directly (same dark-hero pattern as GetMeLit's .gml-hero), so
          this spacer would just add unwanted extra space above it and,
          worse, delay the header's dark-zone detection until scrolled
          past this spacer's own height. */}
      {(series || isFiltered) && <section className="mg-head" />}

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
            // Same flush, colourless card grid as the homepage sections
            // (MasonryRandomSection/ArchiveCardGrid) — retired the
            // tileMasonryShapes()/colorForCard() pastel-masonry system.
            <ArchiveCardGrid stories={stories} />
          ) : (
            <p className="mg-empty">No stories found with this filter constraint.</p>
          )}
        </section>
      ) : (
        <MagazineHub
          issues={issues}
          categories={allFetchedCats}
          series={seriesOptions}
          edition={edition || "global"}
          featureStory={featureStory}
        />
      )}
    </>
  );
}
