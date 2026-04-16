import React from "react";
import MagazineArchiveWrapper from "./MagazineArchiveWrapper";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Magazine | The Moveee",
  description: "Long-form essays, interviews, and cultural commentary from The Moveee.",
};

export default async function MagazinePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string, industry?: string, country?: string, series?: string, tag?: string }> 
}) {
  const resolvedParams = await searchParams;
  
  return (
    <MagazineArchiveWrapper 
      category={resolvedParams?.category}
      industry={resolvedParams?.industry}
      country={resolvedParams?.country}
      series={resolvedParams?.series}
      tag={resolvedParams?.tag}
    />
  );
}
