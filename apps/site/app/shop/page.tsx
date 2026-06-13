import React from "react";
import ShopArchiveWrapper from "./ShopArchiveWrapper";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Shop — Moveee Magazine" },
  description: "Curated lifestyle goods from vetted independent makers — clothing, objects, and editions personally reviewed for craft, integrity, and lasting quality.",
  alternates: { canonical: "https://themoveee.com/shop" },
  openGraph: {
    title: "Shop — Moveee Magazine",
    description: "Curated lifestyle goods from vetted independent makers — clothing, objects, and editions personally reviewed for craft, integrity, and lasting quality.",
    url: "https://themoveee.com/shop",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Shop" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Shop — Moveee Magazine",
    description: "Curated lifestyle goods from vetted independent makers — clothing, objects, and editions personally reviewed for craft, integrity, and lasting quality.",
  },
};

export default async function ShopPage() {
  return <ShopArchiveWrapper />;
}
