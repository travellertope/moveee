import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import VisualsSingleClient from "@/components/VisualsSingleClient";
import "@/app/visuals.css";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
  const entry = data?.cultureDirectory;
  if (!entry) return { title: { absolute: "Visuals · The Moveee" } };

  return {
    title: { absolute: `${entry.title} · Moveee Visuals` },
    description: entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      images: [entry.featuredImage?.node?.sourceUrl],
    },
  };
}

export default async function VisualSinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
  const entry = data?.cultureDirectory;

  if (!entry || !entry.featuredImage?.node?.sourceUrl) {
    notFound();
  }

  // user is resolved client-side inside VisualsSingleClient via useSession()
  return <VisualsSingleClient entry={entry} user={null} />;
}
