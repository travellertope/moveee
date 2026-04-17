import { getWPData, GET_DIRECTORY_ENTRIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "@/app/visuals.css";
import VisualsGrid from "@/components/VisualsGrid";

export const revalidate = 3600;

export const metadata = {
  title: "Moveee Visuals",
  description: "A curated library of AI-generated illustrations documenting African and diaspora culture. Free for creative use.",
};

export default async function VisualsPage() {
  const data = await getWPData(GET_DIRECTORY_ENTRIES, { first: 100 });
  
  // Filter for entries that have images
  const entries = (data?.cultureDirectories?.nodes ?? []).filter((e: any) => 
    e.featuredImage?.node?.sourceUrl
  );

  return (
    <div className="visuals-portal">
      <section className="visuals-hero">
        <h1 className="visuals-title">Moveee Visuals</h1>
        <p className="visuals-subtitle">
          A living archive of AI-generated illustrations celebrating African and 
          diaspora culture. Curated from our directory. Available for your creative projects.
        </p>
      </section>

      <div className="visuals-wrap">
        <VisualsGrid entries={entries} />
      </div>
    </div>
  );
}
