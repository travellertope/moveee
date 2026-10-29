import React from "react";
import { type EditionSlug } from "@/lib/editions";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import { getMagazineSections, getNewslettersWithFallback } from "@/lib/wp";
import FullBleedHero from "@/components/FullBleedHero";
import HeroCarousel from "@/components/HeroCarousel";
import MasonryRandomSection from "@/components/MasonryRandomSection";
import CultureNewsSection from "@/components/CultureNewsSection";
import ShopRail from "@/components/ShopRail";
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
};

async function loadHomeSections(edition: EditionSlug): Promise<HomeSections> {
  try {
    const [homepageData, sections, newsletters] = await Promise.all([
      fetchHomepageData(),
      getMagazineSections("global"),
      getNewslettersWithFallback(10).catch(() => []),
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
    featuredPool,
    shopProducts,
    portraitStories,
    editorialStories,
    digestStories,
    opinionStories,
    featureStory,
    kafartStories,
  } = await loadHomeSections(edition);

  return (
    <div className="hpv2">
      <FullBleedHero story={coverStory} />

      <section className="masthead" id="mainMasthead">
        <div className="wrap">
          <HeroCarousel stories={carouselStories} />
        </div>
      </section>

      <CultureNewsSection stories={editorialStories} />

      <MasonryRandomSection
        eyebrowTitle={<>The <em>Front</em> Page</>}
        viewAllHref="/magazine"
        stories={featuredPool}
      />

      <section className="arc-section">
        <div className="wrap">
          <div className="arc-hdr">
            <h2>From The <em>Shop</em></h2>
            <a href="/lifestyle" className="arc-viewall">Shop all →</a>
          </div>
          <ShopRail products={shopProducts} />
        </div>
      </section>

      <MasonryRandomSection
        eyebrowTitle={<>The <em>Lane</em></>}
        stories={portraitStories}
      />

      <KafartSection stories={kafartStories} />

      <MasonryRandomSection
        eyebrowTitle={<><em>Reviews</em></>}
        stories={digestStories}
      />

      <MasonryRandomSection
        eyebrowTitle={<><em>Viewpoints</em></>}
        stories={opinionStories}
      />

      <JoinSection edition={edition} featureStory={featureStory} />
    </div>
  );
}
