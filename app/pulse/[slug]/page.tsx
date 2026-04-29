import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPulseStoryBySlug, getAllPulseSlugs, getPulseComments } from "@/lib/pulse-wordpress";
import { decodeHtml } from "@/lib/decode-html";
import PulseStory from "@/components/pulse/PulseStory";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://themoveee.com";

export async function generateStaticParams() {
  try {
    const slugs = await getAllPulseSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
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
  const story = await getPulseStoryBySlug(slug);
  if (!story) notFound();

  const comments = await getPulseComments(story.id).catch(() => []);

  return (
    <>
      <StoryStructuredData story={story} />
      <PulseStory story={story} initialComments={comments} />
    </>
  );
}
