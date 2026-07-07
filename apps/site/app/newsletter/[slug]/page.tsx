import React from "react";
import { getNewsletterBySlugWithFallback, getNewslettersWithFallback } from "@/lib/wp";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import ArticleComments from "@/components/ArticleComments";
import { getAccessLevel } from "@/lib/access";
import "../../newsletter.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META, isNewsletterListId, NewsletterListId } from "@/lib/newsletter-lists";
import IssueReaderClient, { ArchiveIssue } from "./IssueReaderClient";

// Map Vercel geo country codes to newsletter segment codes.
const COUNTRY_TO_SEGMENT: Record<string, string> = {
  GB: "uk",
  US: "us",
  NG: "ng",
  GH: "gh",
  CA: "ca",
  AU: "au",
};

async function geoSegment(): Promise<string> {
  try {
    const h = await headers();
    const country = h.get("x-vercel-ip-country") ?? "";
    return COUNTRY_TO_SEGMENT[country.toUpperCase()] ?? "";
  } catch {
    return "";
  }
}

// dynamic = "force-dynamic" because we read geo headers to redirect to the viewer's
// regional edition. Each visitor gets the correct edition without a shared cached response.
export const dynamic = "force-dynamic";
export const dynamicParams = true;

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (m, name) => {
      const map: Record<string, string> = {
        amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
        nbsp: " ", hellip: "…", mdash: "—", ndash: "–",
        lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
      };
      return map[name.toLowerCase()] ?? m;
    });
}

export async function generateStaticParams() {
  try {
    const issues = await getNewslettersWithFallback(100, { revalidate: 300 });
    return issues
      .filter((n: any) => !isNewsletterListId(n.slug))
      .map((n: any) => ({ slug: n.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  let issue;
  try {
    issue = await getNewsletterBySlugWithFallback(resolvedParams.slug, { revalidate: 300 });
  } catch {}
  if (!issue) return { title: { absolute: "Moveee Magazine" } };

  const listId: NewsletterListId = isNewsletterListId(issue.nlList) ? issue.nlList : "culture-drop";
  const listLabel = NL_META[listId].label;

  const imageUrl = issue.featuredImage?.node?.sourceUrl || "/og-fallback.png";

  return {
    title: `${issue.title} · ${listLabel}`,
    description: issue.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      title: issue.title,
      description: issue.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
      images: [imageUrl],
    },
  };
}

const WP_URL =
  process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://themoveee.com";

function sanitiseContent(html: string): string {
  const escapedWpUrl = WP_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html
    .replace(/<!--more[^>]*-->/gi, "")
    .replace(/<!--\s*\/?wp:more[^>]*-->/gi, "")
    .replace(/<a[^>]+#more-\d+[^>]*>.*?<\/a>/gi, "")
    // ⚠️  Only rewrite CMS links inside href attributes.
    // A blanket replace would corrupt Optimole CDN URLs which store the original
    // WordPress domain inside their CDN path, e.g.:
    //   https://cdn.optimole.com/.../https://cms.themoveee.com/wp-content/uploads/img.jpg
    // Replacing that embedded domain breaks the CDN URL → 403 Forbidden.
    .replace(
      new RegExp(`(href=["'])${escapedWpUrl}`, "g"),
      `$1${FRONTEND_URL}`
    )
    .replace(
      /https?:\/\/[^"']+\/culture-newsletter\//g,
      `${FRONTEND_URL}/newsletter/`
    );
}

export default async function GmlIssuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  let issue: any = null;
  try {
    issue = await getNewsletterBySlugWithFallback(resolvedParams.slug, { revalidate: 300 });
  } catch (err: any) {
    console.error("GmlIssuePage error:", err);
  }

  if (!issue) notFound();

  const listId: NewsletterListId = isNewsletterListId(issue.nlList) ? issue.nlList : "culture-drop";

  // Access level — session check deferred to ArticleContentGate client component
  const accessLevel = getAccessLevel(issue);

  // Fetch sibling issues for archive sidebar + issue numbering — scoped to this issue's own publication
  let allIssues: any[] = [];
  try {
    const fetchedIssues = await getNewslettersWithFallback(50, { revalidate: 300 });
    allIssues = fetchedIssues.filter((n: any) => (n.nlList || "culture-drop") === listId);
  } catch {}

  const publishedDate = new Date(issue.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const wordCount =
    issue.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 250));
  const hasFeaturedImage = !!issue.featuredImage?.node?.sourceUrl;

  // Group regional editions (same title = same canonical issue).
  // Build an ordered list of unique titles first, then attach all editions per title.
  const SEGMENT_LABELS: Record<string, string> = {
    uk: "UK", us: "US", ng: "Nigeria", gh: "Ghana", ca: "Canada", au: "Australia",
  };
  const seenTitles: string[] = [];
  const editionsByTitle: Record<string, { slug: string; segment: string; label: string }[]> = {};
  for (const n of allIssues) {
    const t = decodeEntities((n.title || "").replace(/<[^>]*>/g, "")).trim();
    if (!editionsByTitle[t]) {
      seenTitles.push(t);
      editionsByTitle[t] = [];
    }
    const seg: string = n.nlSegment || "";
    editionsByTitle[t].push({
      slug: n.slug,
      segment: seg,
      label: SEGMENT_LABELS[seg] || (seg ? seg.toUpperCase() : "Global"),
    });
  }
  const uniqueCount = seenTitles.length;

  // For the current issue, figure out its canonical title so we know which group to look in.
  const currentTitle = decodeEntities((issue.title || "").replace(/<[^>]*>/g, "")).trim();

  // Geo-based auto-redirect: if this issue has regional editions and the current slug isn't
  // the right one for the viewer's location, send them to the matching edition silently.
  const viewerSegment = await geoSegment();
  const currentEditions = editionsByTitle[currentTitle] ?? [];
  if (currentEditions.length > 1 && viewerSegment) {
    const geoEdition =
      currentEditions.find((e) => e.segment === viewerSegment) ||
      currentEditions.find((e) => e.segment === "");
    if (geoEdition && geoEdition.slug !== resolvedParams.slug) {
      redirect(`/newsletter/${geoEdition.slug}`);
    }
  }

  // Build the deduplicated ArchiveIssue list, picking the right slug per group:
  // prefer the slug that matches the viewer's segment, then global, then first available.
  const issues: ArchiveIssue[] = seenTitles.map((title, idx) => {
    const editions = editionsByTitle[title];
    const match =
      editions.find((e) => e.segment === viewerSegment) ||
      editions.find((e) => e.segment === "") ||
      editions[0];
    return {
      slug: match.slug,
      title,
      issueNum: uniqueCount - idx,
      editions: editions.length > 1 ? editions : undefined,
    };
  });

  // Recalculate currentIssueNum based on unique title position.
  const currentTitleIdx = seenTitles.indexOf(currentTitle);
  const currentIssueNum = currentTitleIdx >= 0 ? uniqueCount - currentTitleIdx : uniqueCount;

  const heroPullQuote = issue.excerpt
    ? decodeEntities(issue.excerpt.replace(/<[^>]*>/g, "")).trim().slice(0, 200)
    : undefined;

  const previewHtml = issue.excerpt
    ? sanitizeHtml(issue.excerpt.replace(/<[^>]*>/g, ""))
    : undefined;

  const contentSlot = (
    <ArticleComments
      postId={parseInt(issue.databaseId)}
      content={sanitiseContent(issue.content || "")}
    />
  );

  return (
    <IssueReaderClient
      listId={listId}
      issues={issues}
      currentSlug={resolvedParams.slug}
      currentIssueNum={currentIssueNum}
      issueTitle={issue.title || ""}
      publishedDate={publishedDate}
      readingTime={readingTime}
      imageUrl={hasFeaturedImage ? issue.featuredImage.node.sourceUrl : undefined}
      heroPullQuote={heroPullQuote}
      previewHtml={previewHtml}
      accessLevel={accessLevel}
      callbackUrl={`/newsletter/${resolvedParams.slug}`}
      contentSlot={contentSlot}
    />
  );
}
