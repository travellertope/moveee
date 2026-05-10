import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidRegionalSlug, type RegionalSlug } from "@/lib/editions";
import { fetchHomepageData } from "@/lib/fetchHomepageData";
import HomepageContent from "@/components/HomepageContent";

export const dynamic = "force-dynamic";

interface Props {
  params: { edition: string };
}

export default async function EditionPage({ params }: Props) {
  const { edition } = params;

  if (!isValidRegionalSlug(edition)) notFound();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  // Fetch content filtered by the edition tag (e.g. "uk", "us", "africa")
  const data = await fetchHomepageData(edition);

  return <HomepageContent {...data} isLoggedIn={isLoggedIn} edition={edition as RegionalSlug} />;
}

// Tell Next.js which edition slugs are valid static segments
export function generateStaticParams() {
  return [{ edition: "uk" }, { edition: "us" }, { edition: "africa" }];
}
