import Link from "next/link";
import "@/app/visuals.css";
import VisualsGrid from "@/components/VisualsGrid";
import type { Visual } from "@/components/VisualsGrid";

export const revalidate = 3600;

export const metadata = {
  title: { absolute: "Visuals — Moveee Magazine" },
  description: "A living archive of illustrations documenting culture — people, places, movements, and moments. Curated by Moveee Magazine. Free for creative use.",
  alternates: { canonical: "https://themoveee.com/visuals" },
  openGraph: {
    title: "Visuals — Moveee Magazine",
    description: "A living archive of illustrations documenting culture — people, places, movements, and moments. Free for creative use.",
    url: "https://themoveee.com/visuals",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Visuals" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Visuals — Moveee Magazine",
    description: "A living archive of illustrations documenting culture — people, places, movements, and moments. Free for creative use.",
  },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export default async function VisualsPage() {
  let visuals: Visual[] = [];

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/visuals`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      visuals = Array.isArray(json.visuals) ? json.visuals : [];
    }
  } catch {
    visuals = [];
  }

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
        <VisualsGrid visuals={visuals} />
      </div>
    </div>
  );
}
