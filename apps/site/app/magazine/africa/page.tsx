import React from "react";
import { Metadata } from "next";
import MagazineArchiveWrapper from "../MagazineArchiveWrapper";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Magazine — Africa Edition · Moveee Magazine" },
  description:
    "Long-form essays, interviews, and cultural commentary — through an African and diasporic lens. Writing about music, film, art, food, travel, and ideas from Lagos, Accra, Nairobi, and beyond.",
  alternates: { canonical: "https://themoveee.com/magazine/africa" },
  openGraph: {
    title: "Magazine — Africa Edition · Moveee Magazine",
    description:
      "Long-form essays, interviews, and cultural commentary — through an African and diasporic lens.",
    url: "https://themoveee.com/magazine/africa",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine — Africa Edition" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Magazine — Africa Edition · Moveee Magazine",
    description:
      "Long-form essays, interviews, and cultural commentary — through an African and diasporic lens.",
  },
};

export default function MagazineAfricaPage() {
  return <MagazineArchiveWrapper />;
}
