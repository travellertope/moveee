import React from "react";
import MagazineArchiveWrapper from "./MagazineArchiveWrapper";
import { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Magazine — Moveee Magazine" },
  description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
  alternates: { canonical: "https://themoveee.com/magazine" },
  openGraph: {
    title: "Magazine — Moveee Magazine",
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
    title: "Magazine — Moveee Magazine",
    description: "Long-form essays, interviews, and cultural commentary. Independent writing about music, film, art, food, travel, and ideas.",
  },
};

export default async function MagazinePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string, industry?: string, country?: string, series?: string, tag?: string }> 
}) {
  const resolvedParams = await searchParams;
  
  return (
    <MagazineArchiveWrapper 
      category={resolvedParams?.category}
      industry={resolvedParams?.industry}
      country={resolvedParams?.country}
      series={resolvedParams?.series}
      tag={resolvedParams?.tag}
    />
  );
}
