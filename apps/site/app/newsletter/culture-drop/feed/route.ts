import { getNewslettersWithFallback } from "@/lib/wp";
import { buildNewsletterRssFeed } from "@/lib/rss";

export const revalidate = 300;

export async function GET() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {
    // CMS unreachable
  }

  const issues = newsletters.filter(
    (n: any) => (n.nlList || "") === "culture-drop"
  );

  const xml = buildNewsletterRssFeed("culture-drop", issues);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
