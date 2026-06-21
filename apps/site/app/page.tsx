import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";
import type { Metadata } from "next";
import "@/app/homepage.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Moveee — Culture. Discover and Engage.",
  description:
    "Moveee is a community that rewards you for being an active part of culture — post, discover, and earn for your taste. Moveee Magazine, our editorial arm, covers the best of culture worldwide.",
  alternates: {
    canonical: "https://themoveee.com/",
    languages: {
      "x-default": "https://themoveee.com/",
      "en-GB": "https://themoveee.com/uk",
      "en-US": "https://themoveee.com/us",
    },
  },
  openGraph: {
    title: "Moveee — Culture. Discover and Engage.",
    description:
      "A community that rewards you for being an active part of culture. Moveee Magazine, our editorial arm, covers the best of culture worldwide.",
    url: "https://themoveee.com/",
    siteName: "Moveee",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-fallback.png",
        width: 1200,
        height: 630,
        alt: "Moveee — Culture. Discover and Engage.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Moveee — Culture. Discover and Engage.",
    description:
      "A community that rewards you for being an active part of culture. Moveee Magazine, our editorial arm, covers the best of culture worldwide.",
  },
};

export default async function Home() {
  const data = await fetchHomepageData(); // global edition — no tag filter

  return <HomepageContent {...data} edition="global" />;
}
