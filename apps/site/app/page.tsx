import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";
import type { Metadata } from "next";
import "@/app/homepage.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Moveee Magazine — Best in Culture",
  description:
    "An independent magazine for people who live for culture — music, film, art, food, travel, and ideas.",
  alternates: {
    canonical: "https://themoveee.com/",
    languages: {
      "x-default": "https://themoveee.com/",
      "en-GB": "https://themoveee.com/uk",
      "en-US": "https://themoveee.com/us",
    },
  },
  openGraph: {
    title: "Moveee Magazine — Best in Culture",
    description:
      "An independent magazine for people who live for culture — music, film, art, food, travel, and ideas.",
    url: "https://themoveee.com/",
    siteName: "Moveee Magazine",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-fallback.png",
        width: 1200,
        height: 630,
        alt: "Moveee Magazine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@themoveee",
    creator: "@themoveee",
    title: "Moveee Magazine — Best in Culture",
    description:
      "An independent magazine for people who live for culture — music, film, art, food, travel, and ideas.",
  },
};

export default async function Home() {
  const data = await fetchHomepageData(); // global edition — no tag filter

  return <HomepageContent {...data} edition="global" />;
}
