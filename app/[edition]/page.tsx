import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidRegionalSlug, EDITIONS, type RegionalSlug } from "@/lib/editions";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: { edition: string };
}

const EDITION_META: Record<RegionalSlug, { title: string; description: string; locale: string }> = {
  uk: {
    title: "The Moveee UK — African Culture in Britain",
    description:
      "The Moveee UK edition: the best of African culture, community, events, and style for the diaspora in Britain.",
    locale: "en_GB",
  },
  us: {
    title: "The Moveee US — African Culture in America",
    description:
      "The Moveee US edition: the best of African culture, community, events, and lifestyle for the diaspora in North America.",
    locale: "en_US",
  },
  africa: {
    title: "The Moveee Africa — Best in African Culture",
    description:
      "The Moveee Africa edition: editorials, happenings, travel, lifestyle, and community from across the continent.",
    locale: "en_GB",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition } = params;
  if (!isValidRegionalSlug(edition)) return {};

  const slug = edition as RegionalSlug;
  const { title, description, locale } = EDITION_META[slug];
  const url = `https://www.themoveee.com/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "The Moveee",
      locale,
      type: "website",
      images: [
        {
          url: "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png",
          width: 920,
          height: 144,
          alt: "The Moveee",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function EditionPage({ params }: Props) {
  const { edition } = params;

  if (!isValidRegionalSlug(edition)) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  const data = await fetchHomepageData(edition);

  return <HomepageContent {...data} isLoggedIn={isLoggedIn} edition={edition as RegionalSlug} />;
}

export function generateStaticParams() {
  return [{ edition: "uk" }, { edition: "us" }, { edition: "africa" }];
}
