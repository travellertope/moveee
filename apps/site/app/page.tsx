import React from "react";
import MagazineArchiveWrapper from "./magazine/MagazineArchiveWrapper";
import { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { editionFromCountry, isValidRegionalSlug } from "@/lib/editions";

// Reads geo/cookie headers to scope the front page to the visitor's edition
// (see the `edition` prop below) — can't be statically rendered/ISR'd like
// a plain page. The underlying WP data fetches still cache in Vercel KV
// (see getWPData's own TTL handling), so this stays cheap despite being
// dynamic — same pattern /newsletter already uses for the same reason.
export const dynamic = "force-dynamic";

// TEMPORARY: the Magazine archive is standing in as the site's front page
// until the Moveee app is accepted in the Play Store — see `app/app/page.tsx`
// for where the real homepage (HomepageContent) moved to in the meantime.
// To swap back: restore this file to what `app/app/page.tsx` currently has,
// and restore `app/app/page.tsx` (or delete it) — plus flip the `robots`/
// `alternates.canonical` values back and remove the `mg-page-white` wrapper
// below (that class exists to paint the sitewide body-grain texture white,
// same as `app/magazine/layout.tsx` does for every other /magazine route —
// this page isn't nested under that layout since it lives at the root).
//
// Edition detection: UK/US/Africa visitors get a `country`-taxonomy-scoped
// story pool (see MagazineArchiveWrapper's `edition` prop) instead of the
// plain global pool — the geo-redirect that used to send them to /uk /us
// /africa is disabled (see proxy.ts) for this same period, so this is now
// the only place that scoping happens for the front page. Cookie name here
// ('moveee-edition') must stay in sync with EDITION_COOKIE in proxy.ts.
export const metadata: Metadata = {
  title: "Moveee Magazine — Best in Culture",
  description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
  alternates: { canonical: "https://themoveee.com/" },
  openGraph: {
    title: "Moveee Magazine — Best in Culture",
    description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
    url: "https://themoveee.com/",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Moveee Magazine — Best in Culture",
    description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string, industry?: string, country?: string, series?: string, tag?: string }>
}) {
  const resolvedParams = await searchParams;

  const h = await headers();
  const c = await cookies();
  const savedEdition = c.get("moveee-edition")?.value ?? "";
  const edition = isValidRegionalSlug(savedEdition)
    ? savedEdition
    : editionFromCountry(h.get("x-vercel-ip-country") ?? "");

  return (
    <div className="mg-page-white">
      <MagazineArchiveWrapper
        category={resolvedParams?.category}
        industry={resolvedParams?.industry}
        country={resolvedParams?.country}
        series={resolvedParams?.series}
        tag={resolvedParams?.tag}
        edition={edition}
      />
    </div>
  );
}
