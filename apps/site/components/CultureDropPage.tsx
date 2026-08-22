import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import HideIfSubscribed from "@/components/HideIfSubscribed";
import { sanitizeHtml } from "@/lib/sanitize";

function issueNum(issue: any, totalCount: number, index: number): number {
  if (issue?.nlIssueNum && issue.nlIssueNum > 0) return issue.nlIssueNum;
  return totalCount > 0 ? totalCount - index : index + 1;
}

// Mirrors GetMeLitPage.tsx exactly — same approved layout (dark gradient
// hero -> latest issue's full body on its own manuscript page -> footer,
// no separate archive/CTA sections), just Culture Drop's own copy and
// the ochre accent (vs GetMeLit's gold) that matches the ochre/gold
// .nl-list-badge split already used elsewhere. See culturedrop.css's own
// header comment for what differs.
export default function CultureDropPage({ issues }: { issues: any[] }) {
  const totalCount = issues.length;
  const latest = issues[0] || null;
  const rest = issues.slice(1, 4);

  const latestDate = latest?.date
    ? new Date(latest.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const kicker = latest?.cultureInterests?.nodes?.[0]?.name || null;

  return (
    <>
      {/* ── HERO ── */}
      <section className="cd-hero" data-header-zone="dark">
        <div className="cd-hero-inner">
          <h1 className="cd-hero-title">
            The Week in <em>Culture</em>, Delivered.
          </h1>
          <p className="cd-hero-sub">
            For readers who want depth over noise — one considered take on culture, delivered once a week.
          </p>
          <HideIfSubscribed>
            <div className="cd-hero-form">
              <div className="cd-hero-form-row">
                <NewsletterSubscribeWidget
                  placeholder="your@email.com"
                  buttonLabel="Get the drop →"
                  list="culture-drop"
                  inputClassName="cd-hero-input"
                  buttonClassName="cd-hero-submit"
                />
              </div>
            </div>
          </HideIfSubscribed>
        </div>
      </section>

      {/* ── LATEST ISSUE ── */}
      <section className="cd-today">
        <div className="cd-wrap">
          <div className="cd-today-head">
            <span className="cd-today-eyebrow">Latest Issue</span>
            <span className="cd-today-day">{latestDate}</span>
          </div>

          {latest ? (
            <div className="cd-page">
              <span className="cd-page-num">No. {String(issueNum(latest, totalCount, 0)).padStart(3, "0")}</span>
              <div>
                {kicker && <div className="cd-page-kicker">{kicker}</div>}
                <h2
                  className="cd-page-title"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(latest.title) }}
                />
                <div
                  className="cd-page-body"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(latest.content || latest.excerpt) }}
                />
              </div>

              <div className="cd-page-side">
                {rest.length > 0 && (
                  <div>
                    <div className="cd-page-side-label">Recent issues</div>
                    <div className="cd-mini-list">
                      {rest.map((issue: any, idx: number) => (
                        <Link key={issue.id} href={`/newsletter/${issue.slug}`} className="cd-mini-row">
                          <span className="cd-mini-num">
                            {String(issueNum(issue, totalCount, idx + 1)).padStart(3, "0")}
                          </span>
                          <span
                            className="cd-mini-title"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                          />
                          <span className="cd-mini-date">
                            {new Date(issue.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </Link>
                      ))}
                    </div>
                    {/* The Newsletter Reader (/newsletter/[slug]) has its own
                        "Browse Archive" sidebar listing every past issue —
                        land there (on the latest issue) rather than a
                        generic hub archive list. */}
                    <Link href={`/newsletter/${latest.slug}`} className="cd-mini-all">
                      Full Archive →
                    </Link>
                  </div>
                )}
                {totalCount > 0 && (
                  <div className="cd-stat">
                    <b>{totalCount}</b>
                    <span>Issues delivered</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="cd-page-empty">No issues published yet — check back soon.</p>
          )}
        </div>
      </section>

      <footer className="cd-foot">
        <span>Culture Drop — a Moveee Magazine weekly dispatch</span>
      </footer>
    </>
  );
}
