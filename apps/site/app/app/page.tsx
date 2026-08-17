import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";
import type { Metadata } from "next";
import "@/app/homepage.css";
import "@/app/moveee-zone.css";

export const revalidate = 300;

// This was the site root (`/`) until the Moveee app's Play Store listing
// went live — moved here so `/magazine` could take over the root as the
// front page in the meantime (see `app/page.tsx`). Move it back to `/`
// (and restore `app/page.tsx` to this file's prior contents) once the app
// is accepted and this promo/download-focused homepage should be primary
// again.
export const metadata: Metadata = {
  title: "Moveee — Culture. Discover and Engage.",
  description:
    "Moveee is a community that rewards you for being an active part of culture — post, discover, and earn for your taste. Moveee Magazine, our editorial arm, covers the best of culture.",
  alternates: {
    canonical: "https://themoveee.com/app",
  },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Moveee — Culture. Discover and Engage.",
    description:
      "A community that rewards you for being an active part of culture. Moveee Magazine, our editorial arm, covers the best of culture.",
    url: "https://themoveee.com/app",
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
      "A community that rewards you for being an active part of culture. Moveee Magazine, our editorial arm, covers the best of culture.",
  },
};

export default async function AppHome() {
  const data = await fetchHomepageData(); // global edition — no tag filter

  return <HomepageContent {...data} edition="global" />;
}
