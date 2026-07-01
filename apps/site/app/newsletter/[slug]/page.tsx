import React from "react";
import { getNewsletterBySlugWithFallback, getNewslettersWithFallback } from "@/lib/wp";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import ArticleComments from "@/components/ArticleComments";
import ArticleContentGate from "@/components/ArticleContentGate";
import { getAccessLevel } from "@/lib/access";
import "../../newsletter.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META, isNewsletterListId } from "@/lib/newsletter-lists";

export const revalidate = 300;
export const dynamicParams = true;

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

  const listId = isNewsletterListId(issue.nlList) ? issue.nlList : "culture-drop";
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

  const listId = isNewsletterListId(issue.nlList) ? issue.nlList : "culture-drop";
  const meta = NL_META[listId];

  // Access level — session check deferred to ArticleContentGate client component
  const accessLevel = getAccessLevel(issue);

  // Fetch sibling issues for prev/next nav + issue numbering — scoped to this issue's own publication
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
  const prevIssue =
    currentIdx < allIssues.length - 1 ? allIssues[currentIdx + 1] : null;
  const nextIssue = currentIdx > 0 ? allIssues[currentIdx - 1] : null;

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

  return (
    <>
      <ProgressBar />

      {/* ── ISSUE HERO ── */}
      <section
        className="gml-issue-hero"
        style={
          hasFeaturedImage
            ? {
                backgroundImage: `url(${issue.featuredImage.node.sourceUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {hasFeaturedImage && <div className="gml-issue-hero-overlay" />}
        <div className="gml-issue-hero-inner">
          <div className="gml-issue-eyebrow">
            {meta.label} · Issue N°{currentIssueNum}
          </div>
          <h1
            className="gml-issue-title"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
          />
          {issue.excerpt && (
            <p
              className="gml-issue-standfirst"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(issue.excerpt.replace(/<[^>]*>/g, "")),
              }}
            />
          )}
          <div className="gml-issue-meta">
            <span>{publishedDate}</span>
            <span className="sep">·</span>
            <span>{readingTime} min read</span>
            {issue.cultureInterests?.nodes?.map((t: any) => (
              <React.Fragment key={t.slug}>
                <span className="sep">·</span>
                <span>{t.name}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── ISSUE BODY + SIDEBAR ── */}
      <div className="gml-issue-wrap">
        {/* Main content */}
        <article id="issue-body">
          <ArticleContentGate
            accessLevel={accessLevel}
            callbackUrl={`/newsletter/${resolvedParams.slug}`}
            previewHtml={issue.excerpt ? sanitizeHtml(issue.excerpt.replace(/<[^>]*>/g, "")) : undefined}
            fullContent={
              <ArticleComments
                postId={parseInt(issue.databaseId)}
                content={sanitiseContent(issue.content || "")}
              />
            }
          />
        </article>

        {/* Sidebar */}
        <aside className="gml-issue-sidebar">
          <div className="gml-sidebar-card">
            <div className="gml-sidebar-label">★ {meta.label} · {meta.cadence}</div>
            <h4>{meta.tagline}</h4>
            <p>{meta.standfirst}</p>
            <NewsletterSubscribeWidget
              placeholder="your@email.com"
              buttonLabel="Subscribe free →"
              list={listId}
            />
          </div>

          {issue.cultureInterests?.nodes?.length > 0 && (
            <div className="gml-sidebar-card">
              <div className="gml-sidebar-label">Topics in this issue</div>
              <div className="gml-sidebar-tags">
                {issue.cultureInterests.nodes.map((t: any) => (
                  <span key={t.slug} className="digest-tag">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="gml-sidebar-card dark">
            <div className="gml-sidebar-label">The Archive</div>
            <h4>Browse all issues</h4>
            <p>
              {totalCount} issue{totalCount !== 1 ? "s" : ""} and counting.
            </p>
            <Link href={`/newsletter/${listId}`} className="gml-sidebar-link">
              Full archive →
            </Link>
          </div>
        </aside>
      </div>

      {/* ── INLINE SIGNUP CTA ── */}
      <section className="gml-signup-section">
        <div className="gml-signup-inner">
          <div className="gml-signup-left">
            <div className="gml-badge">★ Never miss an issue</div>
            <h3>
              Join the <em>culturally curious</em>.
            </h3>
            <p>{meta.standfirst}</p>
          </div>
          <div className="gml-signup-right">
            <div className="gml-form-label">Subscribe to {meta.label}</div>
            <NewsletterSubscribeWidget
              placeholder="your@email.com"
              buttonLabel="Subscribe →"
              buttonClassName="gml-signup-submit"
              variant="dark"
              list={listId}
            />
            <div className="gml-signup-note">{meta.signupNote}</div>
          </div>
        </div>
      </section>

      {/* ── PREV / NEXT NAV ── */}
      <nav className="gml-issue-nav">
        {prevIssue ? (
          <Link
            href={`/newsletter/${prevIssue.slug}`}
            className="gml-nav-item prev"
          >
            <span className="gml-nav-label">← Previous Issue</span>
            <span
              className="gml-nav-title"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(prevIssue.title) }}
            />
            <span className="gml-nav-date">
              {new Date(prevIssue.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {nextIssue ? (
          <Link
            href={`/newsletter/${nextIssue.slug}`}
            className="gml-nav-item next"
          >
            <span className="gml-nav-label">Next Issue →</span>
            <span
              className="gml-nav-title"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(nextIssue.title) }}
            />
            <span className="gml-nav-date">
              {new Date(nextIssue.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </>
  );
}
