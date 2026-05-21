import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getIssueBySlug, getAllIssues, getPostsByIssue } from "@/lib/wp";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const issues = await getAllIssues();
  return issues.map((issue) => ({ slug: issue.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
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

function getPostCategories(post: any): { id: number; name: string; slug: string }[] {
  const terms: any[][] = post._embedded?.["wp:term"] || [];
  // wp:term[0] is categories, wp:term[1] is tags
  return (terms[0] || []).filter((t: any) => t.taxonomy === "category" && t.slug !== "uncategorized");
}

function getPostImage(post: any): string | null {
  return post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null;
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) notFound();

  const posts = await getPostsByIssue(issue.id);

  // Group posts by their first non-uncategorized category
  const categoryOrder: string[] = [];
  const categoryMap: Record<string, { name: string; posts: any[] }> = {};

  for (const post of posts) {
    const cats = getPostCategories(post);
    const primary = cats[0];
    const key = primary ? primary.slug : "uncategorized";
    const label = primary ? primary.name : "Other";
    if (!categoryMap[key]) {
      categoryMap[key] = { name: label, posts: [] };
      categoryOrder.push(key);
    }
    categoryMap[key].posts.push(post);
  }

  const allIssues = await getAllIssues();
  const currentIndex = allIssues.findIndex((i) => i.slug === slug);
  const prevIssue = currentIndex < allIssues.length - 1 ? allIssues[currentIndex + 1] : null;
  const nextIssue = currentIndex > 0 ? allIssues[currentIndex - 1] : null;

  return (
    <main className="mag-issue-page">
      <div className="mag-issue-page-header">
        <div className="mag-issue-page-cover">
          {issue.meta?.issue_cover_image_url ? (
            <Image
              src={issue.meta.issue_cover_image_url}
              alt={issue.name}
              width={220}
              height={330}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
            <p className="mag-issue-page-note">{issue.meta.issue_editorial_note}</p>
          )}
          <div className="mag-issue-page-nav">
            {prevIssue && (
              <Link href={`/magazine/issues/${prevIssue.slug}`} className="mag-issue-nav-link">
                ← Previous issue
              </Link>
            )}
            {nextIssue && (
              <Link href={`/magazine/issues/${nextIssue.slug}`} className="mag-issue-nav-link">
                Next issue →
              </Link>
            )}
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="mag-issue-empty">No stories published in this issue yet.</p>
      ) : (
        <div className="mag-issue-sections">
          {categoryOrder.map((catSlug) => {
            const { name, posts: catPosts } = categoryMap[catSlug];
            return (
              <section key={catSlug} className="mag-issue-section">
                <h2 className="mag-issue-section-title">{name}</h2>
                <div className="mag-issue-posts">
                  {catPosts.map((post) => {
                    const image = getPostImage(post);
                    const title = post.title?.rendered || "";
                    const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").trim() || "";
                    return (
                      <Link
                        key={post.id}
                        href={`/magazine/${post.slug}`}
                        className="mag-issue-post"
                      >
                        {image && (
                          <div className="mag-issue-post-image">
                            <Image
                              src={image}
                              alt={title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="mag-issue-post-text">
                          <h3
                            className="mag-issue-post-title"
                            dangerouslySetInnerHTML={{ __html: title }}
                          />
                          {excerpt && (
                            <p className="mag-issue-post-excerpt">{excerpt.slice(0, 140)}{excerpt.length > 140 ? "…" : ""}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mag-issue-back">
        <Link href="/magazine/issues">← All issues</Link>
      </div>
    </main>
  );
}
