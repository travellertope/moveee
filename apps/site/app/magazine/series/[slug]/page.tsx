import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_SERIES_STORIES } from "@/lib/wp";
import { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_SERIES_STORIES, { series: slug });
  const name: string = data?.seriesItem?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description: string = data?.seriesItem?.description || `Read all stories from the ${name} series — long-form essays, interviews, and cultural commentary from Moveee Magazine.`;
  return {
    title: `${name} | Series | Moveee Magazine`,
    description,
    openGraph: {
      title: `${name} | Moveee Magazine`,
      description,
    },
  };
}

export default async function MagazineSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper series={slug} />;
}
