import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CategoryPage from "@/components/pulse/CategoryPage";

export const revalidate = 120;

const CATEGORY_SLUGS = new Set(["music","fashion","art","film","food","sport","travel","literature","design","tech"]);

const CATEGORY_META: Record<string, { label: string; desc: string }> = {
  music:      { label: "Music",       desc: "Artists, releases, and the sounds shaping the diaspora." },
  fashion:    { label: "Fashion",     desc: "Designers, style movements, and cultural identity." },
  art:        { label: "Art",         desc: "Visual art, exhibitions, and creative voices." },
  film:       { label: "Film",        desc: "Cinema, directors, and storytelling on screen." },
  food:       { label: "Food",        desc: "Cuisine, chefs, and the culture on the plate." },
  sport:      { label: "Sport",       desc: "Athletes, competitions, and sport as culture." },
  travel:     { label: "Travel",      desc: "Destinations, journeys, and where the diaspora roams." },
  literature: { label: "Literature",  desc: "Books, writers, and the written word." },
  design:     { label: "Design",      desc: "Architecture, product, and creative direction." },
  tech:       { label: "Tech",        desc: "Innovation, startups, and technology from Africa and the diaspora." },
};

export async function generateStaticParams() {
  return Array.from(CATEGORY_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (CATEGORY_SLUGS.has(slug)) {
    const meta = CATEGORY_META[slug];
    return { title: `${meta.label} — Moveee Pulse`, description: meta.desc };
  }
  return { title: "Moveee Pulse" };
}


export default async function PulseStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (CATEGORY_SLUGS.has(slug)) {
    const meta = CATEGORY_META[slug];
    return <CategoryPage slug={slug} label={meta.label} desc={meta.desc} />;
  }

  // Story pages are retired — content lives in the Connect feed.
  redirect("/connect");
}
