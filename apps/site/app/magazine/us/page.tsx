import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import MagazineArchiveWrapper from "../MagazineArchiveWrapper";
import "../../newsletter.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Magazine — US Edition · Moveee Magazine" },
  description:
    "Long-form essays, interviews, and cultural commentary — through an American lens. Writing about music, film, art, food, travel, and ideas from New York, Atlanta, Los Angeles, and across the US.",
  alternates: { canonical: "https://themoveee.com/magazine/us" },
  openGraph: {
    title: "Magazine — US Edition · Moveee Magazine",
    description:
      "Long-form essays, interviews, and cultural commentary — through an American lens.",
    url: "https://themoveee.com/magazine/us",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine — US Edition" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Magazine — US Edition · Moveee Magazine",
    description:
      "Long-form essays, interviews, and cultural commentary — through an American lens.",
  },
};

export default function MagazineUSPage() {
  return (
    <>
      <div className="nl-edition-banner">
        <div className="nl-edition-banner-inner">
          <span className="nl-edition-badge">★ US Edition</span>
          <span className="nl-edition-switch">
            Switch:{" "}
            <Link href="/magazine/africa">Africa Edition</Link>
            {" · "}
            <Link href="/magazine/uk">UK Edition</Link>
            {" · "}
            <Link href="/magazine">Global</Link>
          </span>
        </div>
      </div>
      <MagazineArchiveWrapper />
    </>
  );
}
