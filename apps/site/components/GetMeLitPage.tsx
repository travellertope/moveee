import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import HideIfSubscribed from "@/components/HideIfSubscribed";
import { sanitizeHtml } from "@/lib/sanitize";

function issueNum(issue: any, totalCount: number, index: number): number {
  if (issue?.nlIssueNum && issue.nlIssueNum > 0) return issue.nlIssueNum;
  return totalCount > 0 ? totalCount - index : index + 1;
}

// Rebuilt from scratch off an approved Artifact mockup — GetMeLit's daily
// story format needed a genuinely different, more literary layout than
// NewsletterPublicationPage's shared np-* shell (still used by Culture
// Drop). Hero -> Today's Story (real latest issue) -> footer; no separate
// archive/CTA sections — "This week's stories" and "Full Archive" both
// fold into the story page's own sidebar instead.
export default function GetMeLitPage({ issues }: { issues: any[] }) {
  const totalCount = issues.length;
  const today = issues[0] || null;
  const rest = issues.slice(1, 4);

  const todayDate = today?.date
    ? new Date(today.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const kicker = today?.cultureInterests?.nodes?.[0]?.name || null;

  return (
    <>
      {/* ── HERO ── */}
      <section className="gml-hero" data-header-zone="dark">
        <div className="gml-hero-inner">
          <h1 className="gml-hero-title">
            Read a Story,<br /><em>Free</em> Everyday.
          </h1>
          <p className="gml-hero-sub">
            The daily newsletter for readers and lovers of stories. We send a new story recommendation to your
            inbox every morning.
          </p>
          <HideIfSubscribed>
            <div className="gml-hero-form">
              <div className="gml-hero-form-row">
                <NewsletterSubscribeWidget
                  placeholder="your@email.com"
                  buttonLabel="Start reading →"
                  list="getmelit"
                  inputClassName="gml-hero-input"
                  buttonClassName="gml-hero-submit"
                />
              </div>
            </div>
          </HideIfSubscribed>
        </div>
      </section>

      {/* ── TODAY'S STORY ── */}
      <section className="gml-today">
        <div className="gml-wrap">
          <div className="gml-today-head">
            <span className="gml-today-eyebrow">Today&rsquo;s Story</span>
            <span className="gml-today-day">{todayDate}</span>
          </div>

          {today ? (
            <div className="gml-page">
              <span className="gml-page-num">No. {String(issueNum(today, totalCount, 0)).padStart(3, "0")}</span>
              <div>
                {kicker && <div className="gml-page-kicker">{kicker}</div>}
                <h2
                  className="gml-page-title"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(today.title) }}
                />
                <div
                  className="gml-page-body"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(today.content || today.excerpt) }}
                />
              </div>

              <div className="gml-page-side">
                {rest.length > 0 && (
                  <div>
                    <div className="gml-page-side-label">This week&rsquo;s stories</div>
                    <div className="gml-mini-list">
                      {rest.map((issue: any, idx: number) => (
                        <Link key={issue.id} href={`/newsletter/${issue.slug}`} className="gml-mini-row">
                          <span className="gml-mini-num">
                            {String(issueNum(issue, totalCount, idx + 1)).padStart(3, "0")}
                          </span>
                          <span
                            className="gml-mini-title"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                          />
                          <span className="gml-mini-date">
                            {new Date(issue.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link href="/newsletter?list=getmelit#archive" className="gml-mini-all">
                      Full Archive →
                    </Link>
                  </div>
                )}
                {totalCount > 0 && (
                  <div className="gml-stat">
                    <b>{totalCount}</b>
                    <span>Stories delivered</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="gml-page-empty">No stories published yet — check back soon.</p>
          )}
        </div>
      </section>

      <footer className="gml-foot">
        <span>GetMeLit — a Moveee Magazine literary dispatch</span>
      </footer>
    </>
  );
}
