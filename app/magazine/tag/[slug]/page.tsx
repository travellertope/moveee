import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_TAG_INFO } from "@/lib/wp";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_TAG_INFO, { tag: slug });
  const name: string = data?.tag?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description: string = data?.tag?.description || `Browse all Moveee Magazine stories tagged ${name} — culture, art, and heritage from The Moveee.`;
  return {
    title: `${name} | The Moveee Magazine`,
    description,
    openGraph: {
      title: `${name} | The Moveee Magazine`,
      description,
    },
  };
}

export default async function MagazineTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper tag={slug} />;
}
