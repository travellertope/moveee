import Link from "next/link";
import Image from "next/image";
import { colorForCard } from "@/lib/cardColors";
import JoinSection from "./JoinSection";
import type { IssueTerm } from "@/lib/wp";
import type { EditionSlug } from "@/lib/editions";

interface TermLink {
  name: string;
  slug: string;
  description?: string;
}

interface MagazineHubProps {
  issues: IssueTerm[];
  categories: TermLink[];
  series: TermLink[];
  edition: EditionSlug;
  featureStory: any | null;
}

// /magazine's default (unfiltered) view — a structured directory of the
// magazine's own shape (issues, sections, series) rather than a duplicate
// of the homepage's live story feed, which now owns that job. Approved via
// an Artifact mockup before being built — see the mockup's own comments
// for the full rationale (kept in this component's structure: intro →
// issues → sections → series → the same newsletter CTA the homepage uses).
export default function MagazineHub({ issues, categories, series, edition, featureStory }: MagazineHubProps) {
  const [latestIssue, ...pastIssues] = issues;

  return (
    <>
      <section className="mgh-intro" data-header-zone="dark">
        <div className="mgh-wrap">
          <h1 className="mgh-intro-title">
            Every story lives <em>somewhere</em>.
          </h1>
          <p className="mgh-intro-sub">
            Browse the magazine by issue, by section, or by the recurring series that run through it.
          </p>
          <div className="mgh-intro-links">
            {issues.length > 0 && <a href="#issues">Issues ↓</a>}
            {categories.length > 0 && <a href="#sections">Sections ↓</a>}
            {series.length > 0 && <a href="#series">Series ↓</a>}
          </div>
        </div>
      </section>

      {issues.length > 0 && (
        <section className="mgh-sec" id="issues">
          <div className="mgh-wrap">
            <div className="mgh-sec-head">
              <h2>
                Browse by <em>Issue</em>
              </h2>
              <p className="mgh-sec-head-note">
                Each issue digs into one cultural theme through essays, interviews, and photography.
              </p>
            </div>

            <div className="mgh-issues-layout">
              <Link href={`/magazine/issues/${latestIssue.slug}`} className="mgh-issue-feature">
                <div className="mgh-issue-feature-photo">
                  {latestIssue.meta?.issue_cover_image_url && (
                    <Image
                      src={latestIssue.meta.issue_cover_image_url}
                      alt={latestIssue.name}
                      fill
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  )}
                </div>
                <div className="mgh-issue-feature-body">
                  <span className="mgh-issue-feature-tag">Latest</span>
                  <p className="mgh-issue-feature-num">
                    {latestIssue.meta?.issue_number ? `Issue ${latestIssue.meta.issue_number}` : latestIssue.name}
                  </p>
                  <h3>{latestIssue.name}</h3>
                  {latestIssue.meta?.issue_subtitle && <p>{latestIssue.meta.issue_subtitle}</p>}
                  <span className="mgh-issue-feature-cta">Read this issue →</span>
                </div>
              </Link>

              {pastIssues.length > 0 && (
                <div className="mgh-issue-strip">
                  {pastIssues.slice(0, 4).map((issue) => (
                    <Link key={issue.id} href={`/magazine/issues/${issue.slug}`} className="mgh-issue-card">
                      <div className="mgh-issue-card-photo">
                        {issue.meta?.issue_cover_image_url && (
                          <Image
                            src={issue.meta.issue_cover_image_url}
                            alt={issue.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        )}
                      </div>
                      <div className="mgh-issue-card-body">
                        <p className="mgh-issue-card-num">
                          {issue.meta?.issue_number ? `Issue ${issue.meta.issue_number}` : issue.name}
                        </p>
                        <p className="mgh-issue-card-title">{issue.name}</p>
                      </div>
                    </Link>
                  ))}
                  <Link href="/magazine/issues" className="mgh-issues-view-all">
                    View all issues →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mgh-sec mgh-sec--tint" id="sections">
          <div className="mgh-wrap">
            <div className="mgh-sec-head">
              <h2>
                Explore by <em>Section</em>
              </h2>
              <p className="mgh-sec-head-note">The standing categories every issue draws from.</p>
            </div>

            <div className="mgh-cat-grid">
              {categories.map((cat, i) => (
                <Link
                  key={cat.slug}
                  href={`/magazine/category/${cat.slug}`}
                  className="mgh-cat-box"
                  style={{ background: colorForCard(cat.slug.length + i) }}
                >
                  <h3>{cat.name}</h3>
                  <span className="mgh-cat-box-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="mgh-sec" id="series">
          <div className="mgh-wrap">
            <div className="mgh-sec-head">
              <h2>
                Recurring <em>Series</em>
              </h2>
              <p className="mgh-sec-head-note">Ongoing threads that run across issues, not tied to one theme.</p>
            </div>

            <div className="mgh-series-grid">
              {series.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`/magazine/series/${s.slug}`}
                  className="mgh-series-box"
                  style={{ background: colorForCard(s.slug.length + i + 3) }}
                >
                  <h3>{s.name}</h3>
                  {s.description && <p>{s.description}</p>}
                  <span className="mgh-series-box-cta">Read the series →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Same CTA as the homepage — same component, same copy, same card
          treatment, per explicit direction to match it exactly. */}
      <JoinSection edition={edition} featureStory={featureStory} />
    </>
  );
}
