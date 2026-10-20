import { getNewslettersWithFallback } from "@/lib/wp";
import { redirect } from "next/navigation";
import { deduplicateEditions, pickEditionIssue } from "@/lib/newsletter-editions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "US Edition | Moveee Magazine" },
  description:
    "Culture Drop and GetMeLit — the Moveee newsletter programme, US edition. Weekly cultural commentary across New York, Atlanta, and Los Angeles.",
  alternates: { canonical: "https://themoveee.com/newsletter/us" },
  openGraph: {
    title: "US Edition | Moveee Magazine",
    description:
      "Culture Drop and GetMeLit — the Moveee newsletter programme, US edition.",
    url: "https://themoveee.com/newsletter/us",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
};

export default async function NewsletterUsPage() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {}

  const issues = deduplicateEditions(
    newsletters.filter((n: any) => (n.nlList || "") === "culture-drop"),
    "us"
  );
  const latest = pickEditionIssue(issues, "us");
  if (latest?.slug) redirect(`/newsletter/${latest.slug}`);
  redirect("/newsletter");
}
