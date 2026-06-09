import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getIssueBySlug, getAllIssues, getPostsByIssue } from "@/lib/wp";
import { decodeHtml } from "@/lib/decode-html";
import "@/app/magazine.css";
import type { Metadata } from "next";

// Render plain text with paragraph and line-break preservation
function PlainTextBody({ text }: { text: string }) {
  const paras = text.split(/\n{2,}/);
  return (
    <>
      {paras.map((para, i) => (
        <p key={i} className="mag-issue-page-note">
          {para.split("\n").map((line, j, arr) => (
            <React.Fragment key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  );
}

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) return { title: "Issue · Moveee Magazine" };
  const title = issue.meta?.issue_subtitle
    ? `${issue.meta.issue_subtitle} · Moveee Magazine`
    : `${issue.name} · Moveee Magazine`;
  return {
    title,
    description: issue.meta?.issue_editorial_note?.slice(0, 160) || issue.description || undefined,
    openGraph: issue.meta?.issue_cover_image_url
      ? { images: [{ url: issue.meta.issue_cover_image_url }] }
      : undefined,
  };
}

// Flatten all embedded wp:term entries and filter by taxonomy slug
function getTermsByTaxonomy(post: any, taxonomy: string): { id: number; name: string; slug: string }[] {
  const groups: any[][] = post._embedded?.["wp:term"] || [];
  return groups.flat().filter((t: any) => t.taxonomy === taxonomy && t.slug !== "uncategorized");
}

function getPostImage(post: any): string | null {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
}

interface Section {
  key: string;
  label: string;
  type: "series" | "category";
  posts: any[];
}

function groupPosts(posts: any[]): Section[] {
  const seriesMap: Record<string, Section> = {};
  const seriesOrder: string[] = [];
  const catMap: Record<string, Section> = {};
  const catOrder: string[] = [];

  for (const post of posts) {
    const series = getTermsByTaxonomy(post, "series");
    const cats = getTermsByTaxonomy(post, "category");

    if (series.length > 0) {
      // Post belongs to a series — put it there (first series wins)
      const s = series[0];
      if (!seriesMap[s.slug]) {
        seriesMap[s.slug] = { key: s.slug, label: s.name, type: "series", posts: [] };
        seriesOrder.push(s.slug);
      }
      seriesMap[s.slug].posts.push(post);
    } else {
      // No series — group by primary category
      const cat = cats[0];
      const key = cat ? cat.slug : "other";
      const label = cat ? cat.name : "Other Stories";
      if (!catMap[key]) {
        catMap[key] = { key, label, type: "category", posts: [] };
        catOrder.push(key);
      }
      catMap[key].posts.push(post);
    }
  }

  return [
    ...seriesOrder.map((k) => seriesMap[k]),
    ...catOrder.map((k) => catMap[k]),
  ];
}

function PostCard({ post }: { post: any }) {
  const image = getPostImage(post);
  const title = decodeHtml(post.title?.rendered || "");
  const excerpt = decodeHtml(post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "");

  return (
    <Link href={`/magazine/${post.slug}`} className="mag-issue-post">
      <div className="mag-issue-post-image">
        {image ? (
          <Image src={image} alt={title} fill className="object-cover" />
        ) : (
          <div className="mag-issue-post-image-placeholder" />
        )}
      </div>
      <div className="mag-issue-post-text">
        <h3 className="mag-issue-post-title">{title}</h3>
        {excerpt && (
          <p className="mag-issue-post-excerpt">
            {excerpt.slice(0, 130)}{excerpt.length > 130 ? "…" : ""}
          </p>
        )}
        <span className="mag-issue-post-cta">Read →</span>
      </div>
    </Link>
  );
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) notFound();

  const [posts, allIssues] = await Promise.all([
    getPostsByIssue(issue.id),
    getAllIssues(),
  ]);

  const sections = groupPosts(posts);
  const currentIndex = allIssues.findIndex((i) => i.slug === slug);
  const prevIssue = currentIndex < allIssues.length - 1 ? allIssues[currentIndex + 1] : null;
  const nextIssue = currentIndex > 0 ? allIssues[currentIndex - 1] : null;

  return (
    <main className="mag-issue-page">

      {/* ── Header ── */}
      <div className="mag-issue-page-header">
        <div className="mag-issue-page-cover">
          {issue.meta?.issue_cover_image_url ? (
            <Image
              src={issue.meta.issue_cover_image_url}
              alt={issue.name}
              width={220}
              height={330}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              priority
            />
          ) : (
            <div className="mag-issue-page-cover-placeholder" />
          )}
        </div>

        <div className="mag-issue-page-meta">
          <span className="mag-issue-page-eyebrow">
            {issue.meta?.issue_number ? `Issue ${issue.meta.issue_number}` : issue.name}
          </span>
          {issue.meta?.issue_subtitle && (
            <h1 className="mag-issue-page-title">{issue.meta.issue_subtitle}</h1>
          )}
          {issue.meta?.issue_editorial_note && (
            <PlainTextBody text={issue.meta.issue_editorial_note} />
          )}
          <div className="mag-issue-page-stats">
            <span>{posts.length} {posts.length === 1 ? "story" : "stories"}</span>
            {sections.filter(s => s.type === "series").length > 0 && (
              <span>· {sections.filter(s => s.type === "series").length} {sections.filter(s => s.type === "series").length === 1 ? "series" : "series"}</span>
            )}
          </div>
          <div className="mag-issue-page-nav">
            {prevIssue && (
              <Link href={`/magazine/issues/${prevIssue.slug}`} className="mag-issue-nav-link">
                ← {prevIssue.name}
              </Link>
            )}
            {nextIssue && (
              <Link href={`/magazine/issues/${nextIssue.slug}`} className="mag-issue-nav-link">
                {nextIssue.name} →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      {posts.length === 0 ? (
        <p className="mag-issue-empty">No stories published in this issue yet.</p>
      ) : (
        <div className="mag-issue-sections">
          {sections.map((section) => (
            <section key={section.key} className={`mag-issue-section mag-issue-section--${section.type}`}>
              <div className="mag-issue-section-hdr">
                <span className="mag-issue-section-type">
                  {section.type === "series" ? "Series" : "Category"}
                </span>
                <h2 className="mag-issue-section-title">{section.label}</h2>
                <span className="mag-issue-section-count">{section.posts.length} {section.posts.length === 1 ? "story" : "stories"}</span>
              </div>
              <div className="mag-issue-posts">
                {section.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mag-issue-back">
        <Link href="/magazine/issues">← All issues</Link>
      </div>
    </main>
  );
}
