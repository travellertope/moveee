import { getNewslettersWithFallback } from "@/lib/wp";
import NewsletterPublicationPage from "@/components/NewsletterPublicationPage";
import { NL_META } from "@/lib/newsletter-lists";
import "../../newsletter.css";

export const revalidate = 3600;

const meta = NL_META["getmelit"];
const url = "https://themoveee.com/newsletter/getmelit";

export const metadata = {
  title: { absolute: `${meta.label} — Moveee Magazine` },
  description: meta.standfirst,
  alternates: {
    canonical: url,
    types: { "application/rss+xml": `${url}/feed` },
  },
  openGraph: {
    title: `${meta.label} — Moveee Magazine`,
    description: meta.standfirst,
    url,
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: meta.label }],
  },
  twitter: {
    card: "summary_large_image" as const,
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: `${meta.label} — Moveee Magazine`,
    description: meta.standfirst,
  },
};

export default async function GetMeLitPage() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {
    // CMS unreachable
  }

  const issues = newsletters.filter((n: any) => (n.nlList || "") === "getmelit");

  return <NewsletterPublicationPage listId="getmelit" issues={issues} />;
}
