import React from "react";
import { type EditionSlug } from "@/lib/editions";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import { getMagazineSections, getNewslettersWithFallback } from "@/lib/wp";
import { fetchTrendingDirectory, type TrendingCategory } from "@/lib/fetchTrendingDirectory";
import { fetchRecentlyAdded } from "@/lib/fetchRecentlyAdded";
import type { RecentlyAddedByType } from "@/lib/fetchRecentlyAdded";
import HomepageHero, { type HeroSlide } from "@/components/HomepageHero";
import RecentlyReviewedRail from "@/components/RecentlyReviewedRail";
import FullBleedHero from "@/components/FullBleedHero";
import HeroCarousel from "@/components/HeroCarousel";
import DirectoryDiscovery from "@/components/DirectoryDiscovery";
import JoinSection from "@/components/JoinSection";
import KafartSection from "@/components/KafartSection";

interface HomeSections {
  coverStory: any;
  carouselStories: any[];
  featuredPool: any[];
  shopProducts: any[];
  portraitStories: any[];
  editorialStories: any[];
  digestStories: any[];
  opinionStories: any[];
  featureStory: any | null;
  kafartStories: any[];
  trendingCategories: TrendingCategory[];
  recentlyAdded: RecentlyAddedByType;
}

const EMPTY: HomeSections = {
  coverStory: null,
  carouselStories: [],
  featuredPool: [],
  shopProducts: [],
  portraitStories: [],
  editorialStories: [],
  digestStories: [],
  opinionStories: [],
  featureStory: null,
  kafartStories: [],
  trendingCategories: [],
  recentlyAdded: { film: [], music: [], book: [] },
};

async function loadHomeSections(edition: EditionSlug): Promise<HomeSections> {
  try {
    const [homepageData, sections, newsletters, trendingCategories, recentlyAdded] = await Promise.all([
      fetchHomepageData(),
      getMagazineSections("global"),
      getNewslettersWithFallback(10).catch(() => []),
      fetchTrendingDirectory().catch(() => []),
      fetchRecentlyAdded().catch(() => ({ film: [], music: [], book: [] })),
    ]);

    const { coverStory, featuredPool: heroPlusFeatured, products, kafartStories: rawKafart } = homepageData;
    const { topPool, editorialStories, opinionStories, portraitStories, digestStories } = sections;

    const usedSlugs = new Set<string>(
      [...(rawKafart || []).map((s: any) => s.slug), coverStory?.slug].filter(Boolean)
    );
    const carouselPool = (heroPlusFeatured || []).filter((s: any) => !usedSlugs.has(s.slug)).slice(0, 7);
    carouselPool.forEach((s: any) => usedSlugs.add(s.slug));
    const featuredPool = (topPool || []).filter((s: any) => !usedSlugs.has(s.slug));

    const dedup = (arr: any[]) => (arr || []).filter((s: any) => s?.slug && !usedSlugs.has(s.slug));

    const carouselStories = carouselPool.map((s: any) => ({
      slug: s.slug,
      title: s.title || "",
      categoryName: s.categories?.nodes?.[0]?.name || "Moveee Magazine",
      image: s.featuredImage?.node?.sourceUrl || null,
      alt: s.featuredImage?.node?.altText || s.title || "",
    }));

    const shopProducts = (products || []).slice(0, 10).map((p: any) => ({
      slug: p.slug,
      name: p.name,
      price: p.price || p.regularPrice || "",
      image: p.image?.sourceUrl || null,
      vendor: p.vendorProfile?.storeName || null,
      databaseId: p.databaseId ?? null,
    }));

    const featureStory =
      newsletters.find((n: any) => n.nlList === "culture-drop") || newsletters[0] || null;

    return {
      coverStory,
      carouselStories,
      featuredPool,
      shopProducts,
      portraitStories: dedup(portraitStories),
      editorialStories: dedup(editorialStories),
      digestStories: dedup(digestStories),
      opinionStories: dedup(opinionStories),
      featureStory,
      kafartStories: rawKafart || [],
      trendingCategories,
      recentlyAdded,
    };
  } catch (err: any) {
    console.error("[HomepageView] loadHomeSections failed:", err?.message || err);
    return EMPTY;
  }
}

export default async function HomepageView({ edition }: { edition: EditionSlug }) {
  const {
    coverStory,
    carouselStories,
    featureStory,
    kafartStories,
    trendingCategories,
    recentlyAdded,
  } = await loadHomeSections(edition);

  // Static hero background slides — the user-provided cinematic photos
  const heroSlides: HeroSlide[] = [
    { image: "/hero/avif-web.jpg",     alt: "Cinema audience" },
    { image: "/hero/frankie-web.jpg",  alt: "Music studio session" },
    { image: "/hero/christin-web.jpg", alt: "Books on a shelf" },
    { image: "/hero/cinema-crowd.jpg", alt: "Cinema crowd" },
  ];

  return (
    <div className="hpv2">
      <HomepageHero slides={heroSlides} />

      <DirectoryDiscovery categories={trendingCategories} />

      <section className="arc-section fbh-section">
        <div className="wrap">
          <FullBleedHero story={coverStory} kicker="From the Magazine" />
        </div>
      </section>

      <section className="masthead" id="mainMasthead">
        <div className="wrap">
          <HeroCarousel stories={carouselStories} />
        </div>
      </section>

      {/* Recently added rails — hidden automatically when empty */}
      <RecentlyReviewedRail type="film"  entries={recentlyAdded.film}  mode="added" />
      <RecentlyReviewedRail type="music" entries={recentlyAdded.music} mode="added" />
      <RecentlyReviewedRail type="book"  entries={recentlyAdded.book}  mode="added" />

<KafartSection stories={kafartStories} />

      <JoinSection edition={edition} featureStory={featureStory} />
    </div>
  );
}
