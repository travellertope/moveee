import { getNewslettersWithFallback } from "@/lib/wp";
import { redirect } from "next/navigation";
import { deduplicateEditions, pickEditionIssue } from "@/lib/newsletter-editions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Africa Edition | Moveee Magazine" },
  description:
    "Culture Drop and GetMeLit — the Moveee newsletter programme, Africa edition. Weekly cultural commentary across Lagos, Accra, Nairobi, Johannesburg, and Cape Town.",
  alternates: { canonical: "https://themoveee.com/newsletter/africa" },
  openGraph: {
    title: "Africa Edition | Moveee Magazine",
    description:
      "Culture Drop and GetMeLit — the Moveee newsletter programme, Africa edition.",
    url: "https://themoveee.com/newsletter/africa",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
};

export default async function NewsletterAfricaPage() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {}

  // Africa covers NG + GH editions; pickEditionIssue tries ng → gh → untagged.
  const issues = deduplicateEditions(
    newsletters.filter((n: any) => (n.nlList || "") === "culture-drop"),
    "ng"
  );
  const latest = pickEditionIssue(issues, "africa");
  if (latest?.slug) redirect(`/newsletter/${latest.slug}`);
  redirect("/newsletter");
}
