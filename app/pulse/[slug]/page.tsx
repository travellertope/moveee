import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPulseStoryBySlug, getAllPulseSlugs, getPulseComments, getPulseStories } from "@/lib/pulse-wordpress";
import { decodeHtml } from "@/lib/decode-html";
import PulseStory from "@/components/pulse/PulseStory";
import CategoryPage from "@/components/pulse/CategoryPage";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

const CATEGORY_SLUGS = new Set(["music","fashion","art","film","food","sport","travel","literature","design","tech"]);

const CATEGORY_META: Record<string, { label: string; desc: string }> = {
  music:      { label: "Music",       desc: "Artists, releases, and the sounds shaping the diaspora." },
  fashion:    { label: "Fashion",     desc: "Designers, style movements, and cultural identity." },
  art:        { label: "Art",         desc: "Visual art, exhibitions, and creative voices." },
  film:       { label: "Film",        desc: "Cinema, directors, and storytelling on screen." },
  food:       { label: "Food",        desc: "Cuisine, chefs, and the culture on the plate." },
  sport:      { label: "Sport",       desc: "Athletes, competitions, and sport as culture." },
  travel:     { label: "Travel",      desc: "Destinations, journeys, and where the diaspora roams." },
  literature: { label: "Literature",  desc: "Books, writers, and the written word." },
  design:     { label: "Design",      desc: "Architecture, product, and creative direction." },
  tech:       { label: "Tech",        desc: "Innovation, startups, and technology from Africa and the diaspora." },
};

export async function generateStaticParams() {
  try {
    const slugs = await getAllPulseSlugs();
    const storySlugs = slugs.map((slug) => ({ slug }));
    const categorySlugs = Array.from(CATEGORY_SLUGS).map((slug) => ({ slug }));
    return [...storySlugs, ...categorySlugs];
  } catch {
    return Array.from(CATEGORY_SLUGS).map((slug) => ({ slug }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;

    // Category page metadata
    if (CATEGORY_SLUGS.has(slug)) {
      const meta = CATEGORY_META[slug];
      return {
        title: `${meta.label} — Moveee Pulse`,
        description: meta.desc,
      };
    }

    const story = await getPulseStoryBySlug(slug);
    if (!story) return { title: "Story not found — Moveee Pulse" };

    const title = `${decodeHtml(story.title?.rendered ?? "")} — Moveee Pulse`;
    const description = decodeHtml(story.excerpt?.rendered ?? "").slice(0, 155);
    const url = `${SITE_URL}/pulse/${story.slug}`;
    const ogImage =
      story._embedded?.["wp:featuredmedia"]?.[0]?.source_url ??
      `${SITE_URL}/og-fallback.png`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "The Moveee",
        images: [{ url: ogImage, width: 1200, height: 630, alt: decodeHtml(story.title?.rendered ?? "") }],
        type: "article",
        publishedTime: story.date,
        modifiedTime: story.modified,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
      alternates: { canonical: url },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-snippet": -1,
          "max-image-preview": "large",
        },
      },
    };
  } catch {
    return { title: "Moveee Pulse" };
  }
}

function StoryStructuredData({ story }: { story: NonNullable<Awaited<ReturnType<typeof getPulseStoryBySlug>>> }) {
  const url = `${SITE_URL}/pulse/${story.slug}`;
  const description = decodeHtml(story.excerpt?.rendered ?? "").slice(0, 200);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: decodeHtml(story.title?.rendered ?? ""),
    description,
    url,
    datePublished: story.date,
    dateModified: story.modified,
    author: { "@type": "Organization", name: "The Moveee", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "The Moveee",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: story.meta?.pulse_arm_label || "Culture",
    keywords: [
      story.meta?.pulse_arm_label,
      story.meta?.pulse_region_label,
      "African culture",
      "Black diaspora",
      "Moveee",
    ]
      .filter(Boolean)
      .join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function PulseStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Render category page if this is a known category slug
  if (CATEGORY_SLUGS.has(slug)) {
    const meta = CATEGORY_META[slug];
    return <CategoryPage slug={slug} label={meta.label} desc={meta.desc} />;
  }

  const story = await getPulseStoryBySlug(slug);
  if (!story) notFound();

  const arm = story.meta?.pulse_arm_label ?? undefined;

  const [comments, allRelated] = await Promise.all([
    getPulseComments(story.id).catch(() => []),
    getPulseStories({ arm, perPage: 5 }).catch(() => []),
  ]);

  const relatedStories = allRelated.filter((s) => s.id !== story.id).slice(0, 3);

  return (
    <>
      <StoryStructuredData story={story} />
      <PulseStory story={story} initialComments={comments} relatedStories={relatedStories} />
    </>
  );
}
