import React from "react";
import { getNewsletterBySlugWithFallback, getNewslettersWithFallback } from "@/lib/wp";
import { notFound } from "next/navigation";
import ArticleComments from "@/components/ArticleComments";
import { getAccessLevel } from "@/lib/access";
import "../../newsletter.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META, isNewsletterListId, NewsletterListId } from "@/lib/newsletter-lists";
import IssueReaderClient, { ArchiveIssue } from "./IssueReaderClient";

export const revalidate = 300;
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

  const totalCount = allIssues.length;
  const currentIdx = allIssues.findIndex(
    (n: any) => n.slug === resolvedParams.slug
  );
  const currentIssueNum =
    currentIdx >= 0 ? totalCount - currentIdx : totalCount;

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

  const issues: ArchiveIssue[] = allIssues.map((n: any, idx: number) => ({
    slug: n.slug,
    title: decodeEntities((n.title || "").replace(/<[^>]*>/g, "")),
    issueNum: totalCount - idx,
  }));

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
