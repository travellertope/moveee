import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_INDUSTRY_STORIES } from "@/lib/wp";
import { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_INDUSTRY_STORIES, { industry: slug });
  const name: string = data?.industry?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description: string = data?.industry?.description || `Browse Moveee Magazine stories filed under ${name} — culture, craft, and commentary from The Moveee.`;
  return {
    title: `${name} | Industry | The Moveee Magazine`,
    description,
    openGraph: {
      title: `${name} | The Moveee Magazine`,
      description,
    },
  };
}

export default async function MagazineIndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper industry={slug} />;
}
