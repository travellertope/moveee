import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";
import type { Metadata } from "next";
import "@/app/homepage.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Moveee — Best in Global Culture",
  description:
    "The Moveee is an independent magazine celebrating the best of culture worldwide — editorials, happenings, travel, lifestyle, and community, worldwide.",
  alternates: {
    canonical: "https://www.themoveee.com",
    languages: {
      "x-default": "https://www.themoveee.com",
      "en-GB": "https://www.themoveee.com/uk",
      "en-US": "https://www.themoveee.com/us",
      "en": "https://www.themoveee.com/africa",
    },
  },
  openGraph: {
    title: "The Moveee — Best in Global Culture",
    description:
      "An independent magazine celebrating the best of culture worldwide — editorials, happenings, travel, lifestyle, and community, worldwide.",
    url: "https://www.themoveee.com",
    siteName: "The Moveee",
    locale: "en_GB",
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
    title: "The Moveee — Best in Global Culture",
    description:
      "An independent magazine celebrating the best of culture worldwide — editorials, happenings, travel, lifestyle, and community, worldwide.",
  },
};

export default async function Home() {
  const data = await fetchHomepageData(); // global edition — no tag filter

  return <HomepageContent {...data} edition="global" />;
}
