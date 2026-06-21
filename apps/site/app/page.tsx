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
    canonical: "https://www.themoveee.com",
    languages: {
      "x-default": "https://www.themoveee.com",
      "en-GB": "https://www.themoveee.com/uk",
      "en-US": "https://www.themoveee.com/us",
      "en": "https://www.themoveee.com/africa",
    },
  },
  openGraph: {
    title: "Moveee — Culture. Discover and Engage.",
    description:
      "A community that rewards you for being an active part of culture. Moveee Magazine, our editorial arm, covers the best of culture worldwide.",
    url: "https://www.themoveee.com",
    siteName: "Moveee",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png",
        width: 920,
        height: 144,
        alt: "Moveee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moveee — Culture. Discover and Engage.",
    description:
      "A community that rewards you for being an active part of culture. Moveee Magazine, our editorial arm, covers the best of culture worldwide.",
  },
};

export default async function Home() {
  const data = await fetchHomepageData(); // global edition — no tag filter

  return <HomepageContent {...data} edition="global" />;
}
