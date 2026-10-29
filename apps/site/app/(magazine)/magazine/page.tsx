import React from "react";
import { Metadata } from "next";
import HomepageView from "@/components/HomepageView";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Moveee Magazine — Best in Culture" },
  description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
  alternates: { canonical: "https://themoveee.com/magazine" },
  openGraph: {
    title: "Moveee Magazine — Best in Culture",
    description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
    url: "https://themoveee.com/magazine",
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

export default async function MagazinePage() {
  return <HomepageView edition="global" />;
}
