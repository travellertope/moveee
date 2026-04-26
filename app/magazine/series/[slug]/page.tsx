import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_SERIES_STORIES } from "@/lib/wp";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_SERIES_STORIES, { series: slug });
  const name: string = data?.seriesItem?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  return {
    title: `${name} | Series | The Moveee Magazine`,
    description: `Read all stories from the ${name} series — long-form essays, interviews, and cultural commentary from The Moveee.`,
    openGraph: {
      title: `${name} | The Moveee Magazine`,
      description: `Read all stories from the ${name} series on The Moveee Magazine.`,
    },
  };
}

export default async function MagazineSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper series={slug} />;
}
