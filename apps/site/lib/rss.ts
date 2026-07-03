import { NewsletterListId, NL_META } from "@/lib/newsletter-lists";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://themoveee.com";

export function buildNewsletterRssFeed(
  listId: NewsletterListId,
  issues: any[]
): string {
  const meta = NL_META[listId];
  const feedUrl = `${FRONTEND_URL}/newsletter/${listId}/feed`;
  const siteUrl = `${FRONTEND_URL}/newsletter/${listId}`;
  const lastBuildDate = new Date().toUTCString();

  const items = issues
    .map((issue) => {
      const link = `${FRONTEND_URL}/newsletter/${issue.slug}`;
      const title = (issue.title || "").replace(/<[^>]*>/g, "");
      const description = (issue.excerpt || "")
        .replace(/<!--more[^>]*-->/gi, "")
        .replace(/<!--\s*\/?wp:more[^>]*-->/gi, "");
      const content = issue.content || "";
      const pubDate = issue.date ? new Date(issue.date).toUTCString() : lastBuildDate;
      const guid = issue.slug ? link : (issue.id || link);

      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(meta.label)} — Moveee Magazine</title>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(meta.standfirst)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;
}
