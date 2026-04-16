import React from "react";
import MagazineArchiveWrapper from "../../../MagazineArchiveWrapper";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = decodeURIComponent(slug).charAt(0).toUpperCase() + decodeURIComponent(slug).slice(1);
  return { title: `Tagged: ${title} | The Moveee` };
}

export default async function MagazineTagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MagazineArchiveWrapper tag={slug} />;
}
