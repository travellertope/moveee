import React from "react";
import ShopArchiveWrapper from "./ShopArchiveWrapper";
import { Metadata } from "next";

export const revalidate = 300;

const LIFESTYLE_TITLE = "The Moveee Lifestyle";
const LIFESTYLE_DESC =
  "The Moveee Lifestyle — curated goods from vetted makers. Clothing, objects, and editions reviewed for craft, integrity, and lasting quality.";

export const metadata: Metadata = {
  title: { absolute: LIFESTYLE_TITLE },
  description: LIFESTYLE_DESC,
  alternates: { canonical: "https://themoveee.com/lifestyle" },
  openGraph: {
    title: LIFESTYLE_TITLE,
    description: LIFESTYLE_DESC,
    url: "https://themoveee.com/lifestyle",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: LIFESTYLE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: LIFESTYLE_TITLE,
    description: LIFESTYLE_DESC,
  },
};

export default async function ShopPage() {
  return <ShopArchiveWrapper />;
}
