import React from "react";
import MagazineArchiveWrapper from "../../MagazineArchiveWrapper";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const title = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1);
  return {
    title: `${title} | Magazine | The Moveee`,
  };
}

export default async function MagazineCategoryPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  return (
    <MagazineArchiveWrapper category={slug} />
  );
}
