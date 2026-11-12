import React from "react";
import { type EditionSlug } from "@/lib/editions";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import { getMagazineSections, getNewslettersWithFallback } from "@/lib/wp";
import FullBleedHero from "@/components/FullBleedHero";
import HeroCarousel from "@/components/HeroCarousel";
import MasonryRandomSection from "@/components/MasonryRandomSection";
import CultureNewsSection from "@/components/CultureNewsSection";
import KafartSection from "@/components/KafartSection";
import JoinSection from "@/components/JoinSection";

export default async function MagazineView({ edition }: { edition: EditionSlug }) {
  let coverStory: any = null;
  let carouselStories: any[] = [];
  let featuredPool: any[] = [];
  let portraitStories: any[] = [];
  let editorialStories: any[] = [];
  let digestStories: any[] = [];
  let opinionStories: any[] = [];
  let kafartStories: any[] = [];
  let featureStory: any = null;

  try {
    const [homepageData, sections, newsletters] = await Promise.all([
      fetchHomepageData(),
      getMagazineSections("global"),
      getNewslettersWithFallback(10).catch(() => []),
    ]);

    const { coverStory: cs, featuredPool: heroPlusFeatured, kafartStories: rawKafart } = homepageData;
    const { topPool, editorialStories: editorial, opinionStories: opinions, portraitStories: portraits, digestStories: digests } = sections;

    coverStory = cs;
    kafartStories = rawKafart || [];

    const usedSlugs = new Set<string>(
      [...(rawKafart || []).map((s: any) => s.slug), cs?.slug].filter(Boolean)
    );
    const carouselPool = (heroPlusFeatured || []).filter((s: any) => !usedSlugs.has(s.slug)).slice(0, 7);
    carouselPool.forEach((s: any) => usedSlugs.add(s.slug));

    const dedup = (arr: any[]) => (arr || []).filter((s: any) => s?.slug && !usedSlugs.has(s.slug));

    carouselStories = carouselPool.map((s: any) => ({
      slug: s.slug,
      title: s.title || "",
      categoryName: s.categories?.nodes?.[0]?.name || "Moveee Magazine",
      image: s.featuredImage?.node?.sourceUrl || null,
      alt: s.featuredImage?.node?.altText || s.title || "",
    }));

    featuredPool = dedup(topPool || []);
    portraitStories = dedup(portraits);
    editorialStories = dedup(editorial);
    digestStories = dedup(digests);
    opinionStories = dedup(opinions);
    featureStory = newsletters.find((n: any) => n.nlList === "culture-drop") || newsletters[0] || null;
  } catch (err: any) {
    console.error("[MagazineView] load failed:", err?.message || err);
  }

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
