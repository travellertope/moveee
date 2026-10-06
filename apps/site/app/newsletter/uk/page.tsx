import { getNewslettersWithFallback } from "@/lib/wp";
import { redirect } from "next/navigation";
import { deduplicateEditions, pickEditionIssue } from "@/lib/newsletter-editions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "UK Edition | Moveee Magazine" },
  description:
    "Culture Drop and GetMeLit — the Moveee newsletter programme, UK edition. Weekly cultural commentary across London, Manchester, and Edinburgh.",
  alternates: { canonical: "https://themoveee.com/newsletter/uk" },
  openGraph: {
    title: "UK Edition | Moveee Magazine",
    description:
      "Culture Drop and GetMeLit — the Moveee newsletter programme, UK edition.",
    url: "https://themoveee.com/newsletter/uk",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
};

export default async function NewsletterUkPage() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {}

  const issues = deduplicateEditions(
    newsletters.filter((n: any) => (n.nlList || "") === "culture-drop"),
    "uk"
  );
  const latest = pickEditionIssue(issues, "uk");
  if (latest?.slug) redirect(`/newsletter/${latest.slug}`);
  redirect("/newsletter");
}
