import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_COUNTRY_STORIES } from "@/lib/wp";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_COUNTRY_STORIES, { country: slug });
  const name: string = data?.country?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  return {
    title: `${name} | The Moveee Magazine`,
    description: `Stories from ${name} — culture, art, heritage, and the people shaping it, curated by The Moveee.`,
    openGraph: {
      title: `${name} | The Moveee Magazine`,
      description: `Stories from ${name} on The Moveee Magazine.`,
    },
  };
}

export default async function MagazineCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper country={slug} />;
}
