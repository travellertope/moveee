import React from "react";
import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import GmlCTAForm from "@/components/GmlCTAForm";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META, NewsletterListId } from "@/lib/newsletter-lists";

function issueNum(totalCount: number, index: number) {
  return totalCount > 0 ? totalCount - index : index + 1;
}

export default function NewsletterPublicationPage({
  listId,
  issues,
}: {
  listId: NewsletterListId;
  issues: any[];
}) {
  const meta = NL_META[listId];
  const totalCount = issues.length;
  const recentIssues = issues.slice(0, 3);
  const isCultureDrop = listId === "culture-drop";

  const SubscribeWidget = isCultureDrop ? (
    <GmlCTAForm
      list="culture-drop"
      buttonLabel="Drop it in my inbox →"
      successLabel="✓ Welcome to Culture Drop"
    />
  ) : (
    <NewsletterSubscribeWidget
      placeholder="your@email.com"
      buttonLabel="Subscribe →"
      list="getmelit"
    />
  );

  return (
    <>
      {/* ══ MASTHEAD ══ */}
      <section className="nl-masthead">
        <div className="nl-masthead-inner">
          <div className="nl-masthead-eyebrow">
            {meta.eyebrow}
            <a
              href={`/newsletter/${listId}/feed`}
              className="nl-masthead-rss"
              aria-label={`RSS feed for ${meta.label}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
                <path d="M4 11a9 9 0 0 1 9 9" strokeLinecap="round" />
                <path d="M4 4a16 16 0 0 1 16 16" strokeLinecap="round" />
              </svg>
              RSS
            </a>
          </div>
          <h1 className="nl-masthead-title">
            {meta.titleInline ? (
              <>
                {meta.titlePrefix}
                <em>{meta.titleEmphasis}</em>
                {meta.titleSuffix}
              </>
            ) : (
              <>
                {meta.titlePrefix}
                <br />
                <em>{meta.titleEmphasis}</em>
                {meta.titleSuffix}
              </>
            )}
          </h1>
          <p className="nl-masthead-sub">{meta.standfirst}</p>
          <div className="nl-card-form" style={{ maxWidth: 480, margin: "32px auto 0" }}>
            {SubscribeWidget}
            <p className="nl-card-note">{meta.signupNote}</p>
          </div>
        </div>
      </section>

      {/* ══ INSIDE THE NEWSLETTER ══ */}
      <section className="gml-whats-inside">
        <div className="gml-section-header">
          <div className="gml-section-title">
            <h3>
              Inside <em>{meta.label}</em>
            </h3>
            <p>
              Every issue is built around four sections — so you always know
              what you&apos;re getting, but never know what you&apos;ll find.
            </p>
          </div>
          <div className="gml-section-meta">4 sections · 8 min read</div>
        </div>

        <div className="gml-pillars-grid">
          {meta.pillars.map((p) => (
            <div className="gml-pillar-card" key={p.num}>
              <div className="gml-pc-num">{p.num}</div>
              <div className="gml-pc-name">{p.name}</div>
              <p className="gml-pc-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PULL QUOTE ══ */}
      <div className="gml-pull-band">
        <div className="gml-pull-bar" />
        <div>
          <blockquote className="gml-pull-quote">{meta.pullQuote}</blockquote>
          <cite className="gml-pull-cite">{meta.pullCite}</cite>
        </div>
      </div>

      {/* ══ RECENT ISSUES ══ */}
      {recentIssues.length > 0 && (
        <section className="gml-recent">
          <div className="gml-recent-header">
            <h3>
              Recent <em>issues</em>
            </h3>
            <Link href="#archive">Full archive →</Link>
          </div>
          <div className="gml-issues-grid">
            {recentIssues.map((issue: any, idx: number) => (
              <Link
                key={issue.id}
                href={`/newsletter/${issue.slug}`}
                className="gml-issue-card"
              >
                <div className="gml-issue-num">
                  <span>Issue N°{issueNum(totalCount, idx)}</span>
                  <span className="date">
                    {new Date(issue.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h4
                  className="gml-issue-headline"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                />
                {issue.excerpt && (
                  <p
                    className="gml-issue-sub"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(issue.excerpt)
                        .replace(/<[^>]*>/g, "")
                        .slice(0, 160),
                    }}
                  />
                )}
                <span className="gml-issue-cta">Read this issue →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══ FULL ARCHIVE ══ */}
      {totalCount > 0 && (
        <section className="digest-archive" id="archive">
          <div className="nl-archive-header">
            <div
              className="digest-section-label"
              style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}
            >
              Full Archive
            </div>
          </div>
          <div className="digest-archive-list">
            {issues.map((issue: any, idx: number) => (
              <Link
                key={issue.id}
                href={`/newsletter/${issue.slug}`}
                className="digest-archive-row"
              >
                <span className="digest-archive-num">
                  {String(issueNum(totalCount, idx)).padStart(2, "0")}
                </span>
                <span className="digest-archive-date">
                  {new Date(issue.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span
                  className="digest-archive-title"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                />
                <div className="digest-archive-tags">
                  {issue.cultureInterests?.nodes
                    ?.slice(0, 1)
                    .map((t: any) => (
                      <span key={t.slug} className="digest-tag">
                        {t.name}
                      </span>
                    ))}
                </div>
                <span className="digest-archive-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
