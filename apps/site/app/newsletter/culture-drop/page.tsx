import { getNewslettersWithFallback } from "@/lib/wp";
import CultureDropPage from "@/components/CultureDropPage";
import { NL_META } from "@/lib/newsletter-lists";
import { geoSegment, deduplicateEditions } from "@/lib/newsletter-editions";
import "../../culturedrop.css";

// dynamic = "force-dynamic" because we read geo headers to serve the
// viewer's regional edition (same reasoning as /newsletter's own hub).
export const dynamic = "force-dynamic";

const meta = NL_META["culture-drop"];
const url = "https://themoveee.com/newsletter/culture-drop";

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

function deduplicateByIssueNum(issues: any[]): any[] {
  const seen = new Set<number>();
  const result: any[] = [];
  for (const issue of issues) {
    const num = issue.nlIssueNum;
    if (num && num > 0) {
      if (seen.has(num)) continue;
      seen.add(num);
    }
    result.push(issue);
  }
  return result;
}

export default async function CultureDropRoute() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {
    // CMS unreachable
  }

  const segment = await geoSegment();
  const listIssues = newsletters.filter((n: any) => (n.nlList || "") === "culture-drop");
  // Each regional edition of the same issue is a separate WP post — dedupe
  // by title+segment first (so only the viewer's own edition shows), then
  // by issue number for any other kind of duplicate.
  const issues = deduplicateByIssueNum(deduplicateEditions(listIssues, segment));

  return <CultureDropPage issues={issues} />;
}
