import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import VisualsSingleClient from "@/components/VisualsSingleClient";
import "@/app/visuals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
  const entry = data?.cultureDirectory;
  if (!entry) return { title: "Visuals · The Moveee" };

  return {
    title: `${entry.title} · Moveee Visuals`,
    description: entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      images: [entry.featuredImage?.node?.sourceUrl],
    },
  };
}

export default async function VisualSinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  
  const data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
  const entry = data?.cultureDirectory;

  if (!entry || !entry.featuredImage?.node?.sourceUrl) {
    notFound();
  }

  return <VisualsSingleClient entry={entry} user={session?.user} />;
}
