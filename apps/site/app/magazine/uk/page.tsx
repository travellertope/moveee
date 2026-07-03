import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import MagazineArchiveWrapper from "../MagazineArchiveWrapper";
import "../../newsletter.css";

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
  return (
    <>
      <div className="nl-edition-banner">
        <div className="nl-edition-banner-inner">
          <span className="nl-edition-badge">★ UK Edition</span>
          <span className="nl-edition-switch">
            Switch:{" "}
            <Link href="/magazine/africa">Africa Edition</Link>
            {" · "}
            <Link href="/magazine/us">US Edition</Link>
            {" · "}
            <Link href="/magazine">Global</Link>
          </span>
        </div>
      </div>
      <MagazineArchiveWrapper />
    </>
  );
}
