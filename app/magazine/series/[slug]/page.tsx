import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_SERIES_STORIES } from "@/lib/wp";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_SERIES_STORIES, { series: slug });
  const seriesName = data?.seriesItem?.name;
  const title = seriesName || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  return {
    title: `${title} | Series | The Moveee`,
    description: `Read all stories from the ${title} series on The Moveee Magazine.`,
    openGraph: {
      title: `${title} | The Moveee Magazine`,
      description: `Read all stories from the ${title} series on The Moveee Magazine.`,
    },
  };
}

export default async function MagazineSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper series={slug} />;
}
