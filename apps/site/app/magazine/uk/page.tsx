import React from "react";
import { Metadata } from "next";
import MagazineArchiveWrapper from "../MagazineArchiveWrapper";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Magazine — UK Edition · Moveee Magazine" },
  description:
    "Long-form essays, interviews, and cultural commentary — rooted in Britain. Writing about music, film, art, food, travel, and ideas from London, Manchester, Edinburgh, and the wider UK.",
  alternates: { canonical: "https://themoveee.com/magazine/uk" },
  openGraph: {
    title: "Magazine — UK Edition · Moveee Magazine",
    description:
      "Long-form essays, interviews, and cultural commentary — rooted in Britain.",
    url: "https://themoveee.com/magazine/uk",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine — UK Edition" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Magazine — UK Edition · Moveee Magazine",
    description:
      "Long-form essays, interviews, and cultural commentary — rooted in Britain.",
  },
};

export default function MagazineUKPage() {
  return <MagazineArchiveWrapper />;
}
