import React from "react";
import { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { editionFromCountry, isValidRegionalSlug, type EditionSlug } from "@/lib/editions";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import { getMagazineSections } from "@/lib/wp";
import FullBleedHero from "@/components/FullBleedHero";
import HeroCarousel from "@/components/HeroCarousel";
import MasonryRandomSection from "@/components/MasonryRandomSection";
import ShopRail from "@/components/ShopRail";
import JoinSection from "@/components/JoinSection";

// Homepage rebuild (WePresent concept, see
// mockups/web/moveee_homepage_wepresent_concept.html) — live at `/`,
// replacing the temporary Magazine-archive swap that used to render here
// (that swap and the old real homepage that lived at `/app` are both
// retired by this file; `/app` no longer exists as a route).
//
// Edition detection is the same pattern the temporary swap used: the
// `moveee-edition` cookie (kept in sync with EDITION_COOKIE in proxy.ts)
// takes priority, falling back to `x-vercel-ip-country` via
// editionFromCountry(). The geo-redirect that used to send UK/US/Africa
// visitors to /uk /us /africa is still disabled in proxy.ts, so this is
// the only place that scoping happens for the front page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moveee — Culture. Discover and Engage.",
  description: "An independent magazine and community for people who live for culture — music, film, art, food, travel, and ideas.",
  alternates: { canonical: "https://themoveee.com/" },
  openGraph: {
    title: "Moveee — Culture. Discover and Engage.",
    description: "An independent magazine and community for people who live for culture — music, film, art, food, travel, and ideas.",
    url: "https://themoveee.com/",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Moveee — Culture. Discover and Engage.",
    description: "An independent magazine and community for people who live for culture — music, film, art, food, travel, and ideas.",
  },
};

function stripHtml(html: unknown) {
  // `(x || "").replace` only guards against falsy `x` — a truthy
  // non-string value (seen from the CMS in production) still throws on
  // `.replace`. See CLAUDE.md's homepage-crash entry.
  return (typeof html === "string" ? html : "").replace(/<[^>]*>/g, "").trim();
}

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
}

const EMPTY_SECTIONS: HomeSections = {
  coverStory: null,
  carouselStories: [],
  featuredPool: [],
  shopProducts: [],
  portraitStories: [],
  editorialStories: [],
  digestStories: [],
  opinionStories: [],
  featureStory: null,
};

// Every WP-backed fetch this page needs, wrapped so that a bad response
// shape or an unexpected data edge case can never take down the whole
// page render — worst case, a section renders empty (each of
// FullBleedHero/HeroCarousel/MasonryRandomSection/ShopRail/JoinSection
// already no-ops on empty input) rather than the visitor seeing the
// generic error boundary. fetchHomepageData()/getMagazineSections()
// already degrade gracefully on network/CMS failures internally; this
// is the outer safety net for anything else (a genuinely unexpected
// field shape, etc.) that neither of those anticipates.
async function loadHomeSections(edition: EditionSlug): Promise<HomeSections> {
  try {
    const regionalEdition = edition === "global" ? undefined : edition;
    const [homepageData, sections] = await Promise.all([
      fetchHomepageData(regionalEdition),
      getMagazineSections(edition),
    ]);

    const { coverStory, stories, products, latestIssueStories } = homepageData;
    const { topPool, editorialStories, opinionStories, portraitStories, digestStories } = sections;

    const usedSlugs = new Set<string>([coverStory?.slug].filter(Boolean));
    const carouselPool = (topPool || []).filter((s: any) => !usedSlugs.has(s.slug)).slice(0, 7);
    carouselPool.forEach((s: any) => usedSlugs.add(s.slug));
    const featuredPool = (topPool || []).filter((s: any) => !usedSlugs.has(s.slug));

    const carouselStories = carouselPool.map((s: any) => ({
      slug: s.slug,
      title: s.title || "",
      categoryName: s.categories?.nodes?.[0]?.name || "Moveee Magazine",
      excerpt: stripHtml(s.excerpt).slice(0, 90),
      image: s.featuredImage?.node?.sourceUrl || null,
      alt: s.featuredImage?.node?.altText || s.title || "",
    }));

    const shopProducts = (products || []).slice(0, 8).map((p: any) => ({
      slug: p.slug,
      name: p.name,
      price: p.price || p.regularPrice || "",
      image: p.image?.sourceUrl || null,
      vendor: p.vendorProfile?.storeName || null,
    }));

    const featureStory = latestIssueStories?.[0] || stories?.[0] || null;

    return {
      coverStory,
      carouselStories,
      featuredPool,
      shopProducts,
      portraitStories: portraitStories || [],
      editorialStories: editorialStories || [],
      digestStories: digestStories || [],
      opinionStories: opinionStories || [],
      featureStory,
    };
  } catch (err: any) {
    console.error("[homepage] loadHomeSections failed, rendering empty page:", err?.message || err);
    return EMPTY_SECTIONS;
  }
}

export default async function Home() {
  const h = await headers();
  const c = await cookies();
  const savedEdition = c.get("moveee-edition")?.value ?? "";
  const edition: EditionSlug = isValidRegionalSlug(savedEdition)
    ? savedEdition
    : editionFromCountry(h.get("x-vercel-ip-country") ?? "");

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
  } = await loadHomeSections(edition);

  return (
    <div className="hpv2">
      <FullBleedHero story={coverStory} />

      <section className="masthead" id="mainMasthead">
        <div className="wrap">
          <h1>
            Best in <em>culture</em>,<br />every single week.
          </h1>
          <p className="sub">
            An independent magazine for people who live for culture — reported from the
            cities, kitchens, and studios where it&rsquo;s actually made.
          </p>
        </div>
        <HeroCarousel stories={carouselStories} />
      </section>

      <MasonryRandomSection
        eyebrowTitle={<>The <em>Front</em> Page</>}
        subtitle="The strongest reporting and photography from the last two weeks, in one place."
        viewAllHref="/magazine"
        viewAllLabel="View all stories"
        stories={featuredPool}
      />

      <section className="band band--tint">
        <div className="wrap">
          <div className="band-head">
            <h2>From The <em>Shop</em></h2>
            <p className="subtitle">Handmade pieces from Moveee&rsquo;s maker community — new drops, restocks, and one-offs.</p>
            <a className="view-all" href="/shop">Shop all products</a>
          </div>
          <ShopRail products={shopProducts} />
        </div>
      </section>

      <MasonryRandomSection
        eyebrowTitle={<>The <em>Lane</em></>}
        subtitle="Portraits from the people who make the culture, not just cover it."
        stories={portraitStories}
        tint
      />

      <MasonryRandomSection
        eyebrowTitle={<>The <em>Edit</em></>}
        subtitle="The news, arguments, and small print worth knowing about this week."
        viewAllHref="/magazine/category/news"
        viewAllLabel="All news"
        stories={editorialStories}
      />

      <MasonryRandomSection
        eyebrowTitle={<>The Free <em>Critics</em></>}
        subtitle="Unbought, unfiltered verdicts on the films, books, and records everyone's asking about."
        stories={digestStories}
        tint
      />

      <MasonryRandomSection
        eyebrowTitle={<><em>Opinions</em> &amp; Essays</>}
        subtitle="Arguments worth having, from writers who'll actually take a side."
        stories={opinionStories}
      />

      <JoinSection edition={edition} featureStory={featureStory} />
    </div>
  );
}
