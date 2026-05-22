import Link from "next/link";
import Image from "next/image";
import { getAllIssues } from "@/lib/wp";
import "@/app/magazine.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Magazine Issues | The Moveee" },
  description: "Browse every print and digital issue of The Moveee — Africa's independent culture magazine. Each issue digs into a distinct cultural theme through essays, interviews, and photography.",
};

export const revalidate = 300;

export default async function IssuesArchivePage() {
  const issues = await getAllIssues();

  return (
    <main className="mag-issues-archive">
      <div className="mag-issues-header">
        <span className="mag-issues-eyebrow">Magazine</span>
        <h1>All Issues</h1>
      </div>

      {issues.length === 0 ? (
        <p className="mag-issues-empty">No issues published yet.</p>
      ) : (
        <div className="mag-issues-grid">
          {issues.map((issue) => (
            <Link key={issue.id} href={`/magazine/issues/${issue.slug}`} className="mag-issue-card">
              <div className="mag-issue-card-cover">
                {issue.meta?.issue_cover_image_url ? (
                  <Image
                    src={issue.meta.issue_cover_image_url}
                    alt={issue.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="mag-issue-card-placeholder" />
                )}
              </div>
              <span className="mag-issue-card-number">
                {issue.meta?.issue_number ? `Issue ${issue.meta.issue_number}` : issue.name}
              </span>
              {issue.meta?.issue_subtitle && (
                <p className="mag-issue-card-subtitle">{issue.meta.issue_subtitle}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
