import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { isValidRegionalSlug, type EditionSlug } from "@/lib/editions";
import HomepageView from "@/components/HomepageView";

// Homepage rebuild (WePresent concept, see
// mockups/web/moveee_homepage_wepresent_concept.html) — live at `/`,
// replacing the temporary Magazine-archive swap that used to render here
// (that swap and the old real homepage that lived at `/app` are both
// retired by this file; `/app` no longer exists as a route).
//
// Edition scoping is opt-in only: the homepage defaults to "global" (every
// post, unscoped by location) unless the visitor has explicitly picked an
// edition via the footer's edition <select>, which sets the
// `moveee-edition` cookie (kept in sync with EDITION_COOKIE in proxy.ts).
// This deliberately does NOT fall back to geo-IP (`x-vercel-ip-country`)
// the way it used to — Moveee now publishes one global collection of
// features by default, and geo-detection only used to auto-scope that away
// from visitors who never asked for a regional edition. The geo-redirect
// that used to send UK/US/Africa visitors to /uk /us /africa is separately
// still disabled in proxy.ts. This does not affect newsletter region
// scoping (`_culture_nl_segment`, EditionNewsletterHub) — that's a
// completely separate mechanism, untouched by this.
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

export default async function Home() {
  const c = await cookies();
  const savedEdition = c.get("moveee-edition")?.value ?? "";
  const edition: EditionSlug = isValidRegionalSlug(savedEdition) ? savedEdition : "global";

  return <HomepageView edition={edition} />;
}
