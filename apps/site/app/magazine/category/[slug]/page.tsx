import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { getWPData, GET_CATEGORY_INFO } from "@/lib/wp";
import { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getWPData(GET_CATEGORY_INFO, { slug });
  const name: string = data?.category?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description: string = data?.category?.description || `Browse all Moveee Magazine stories in ${name} — essays, interviews, and cultural commentary.`;
  return {
    title: `${name} | The Moveee Magazine`,
    description,
    openGraph: {
      title: `${name} | The Moveee Magazine`,
      description,
    },
  };
}

export default async function MagazineCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper category={slug} />;
}
