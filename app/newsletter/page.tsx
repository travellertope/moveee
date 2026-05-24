import React from "react";
import { getNewslettersWithFallback } from "@/lib/wp";
import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import GmlCTAForm from "@/components/GmlCTAForm";
import GmlWaitlistForm from "@/components/GmlWaitlistForm";
import "../newsletter.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Newsletters — The Moveee" },
  description:
    "Two newsletters from The Moveee. Culture Drop — the weekly deep dive into African and diasporan culture. GetMeLit — weekly literature recommendations, stories, poems, and opportunities for writers.",
};

const NL_LABELS: Record<string, string> = {
  "culture-drop": "Culture Drop",
  "getmelit": "GetMeLit",
};

export default async function NewsletterArchive({
  searchParams,
}: {
  searchParams?: { list?: string };
}) {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 0 });
  } catch {
    // CMS unreachable
  }

  const activeFilter = searchParams?.list ?? "all";
  const allCount    = newsletters.length;
  const cdCount     = newsletters.filter((n: any) => (n.nlList || "") === "culture-drop").length;
  const gmlCount    = newsletters.filter((n: any) => (n.nlList || "") === "getmelit").length;

  const filtered = activeFilter === "all"
    ? newsletters
    : newsletters.filter((n: any) => (n.nlList || "") === activeFilter);

  const totalCount  = filtered.length;
  const recentIssues = newsletters
    .filter((n: any) => (n.nlList || "") === "culture-drop")
    .slice(0, 3);

  const issueNum = (index: number) =>
    allCount > 0 ? allCount - index : index + 1;

  return (
    <>
      {/* ══ MASTHEAD ══ */}
      <section className="nl-masthead">
        <div className="nl-masthead-inner">
          <div className="nl-masthead-eyebrow">★ The Moveee Newsletter Programme</div>
          <h1 className="nl-masthead-title">
            Two letters.
            <br />
            <em>One obsession.</em>
          </h1>
          <p className="nl-masthead-sub">
            Culture Drop for the weekly cultural deep dive. GetMeLit for the
            stories, poems, and reads that feed the literary mind. Both free.
            Both essential.
          </p>
        </div>
      </section>

      {/* ══ TWO NEWSLETTER CARDS ══ */}
      <section className="nl-cards-section">
        <div className="nl-cards-inner">

          {/* Card 1 — Culture Drop */}
          <div className="nl-card nl-card--culturedrop">
            <span className="nl-card-eyebrow">Weekly · Every Thursday</span>
            <h2 className="nl-card-title">
              Culture <em>Drop</em>
            </h2>
            <p className="nl-card-desc">
              The weekly dispatch on contemporary African and diasporan
              culture. One deep essay, curated picks, a music dispatch, and
              what&apos;s happening across Lagos, London, New York, and Accra.
              Written to make you think, not just scroll.
            </p>
            <ul className="nl-card-features">
              <li>The Deep Dive — long-form cultural commentary</li>
              <li>The List — five picks worth your time</li>
              <li>What&apos;s Playing — music dispatch</li>
              <li>The Calendar — Lagos, London, New York, Accra</li>
            </ul>
            <div className="nl-card-form">
              <small className="nl-card-form-label">Subscribe free</small>
              <GmlCTAForm
                list="culture-drop"
                buttonLabel="Drop it in my inbox →"
                successLabel="✓ Welcome to Culture Drop"
              />
              <p className="nl-card-note">Free · Weekly · Unsubscribe anytime</p>
            </div>
          </div>

          {/* Card 2 — GetMeLit */}
          <div className="nl-card nl-card--getmelit">
            <span className="nl-card-eyebrow">Weekly · For readers &amp; writers</span>
            <h2 className="nl-card-title">
              Get<em>Me</em>Lit
            </h2>
            <p className="nl-card-desc">
              A weekly letter for the literary mind. Stories, poems, essay
              excerpts, and opportunities for writers and authors across
              Africa and the diaspora — curated to keep you reading, writing,
              and discovering.
            </p>
            <ul className="nl-card-features">
              <li>A story or poem — fiction and poetry you&apos;ll want to share</li>
              <li>The reading list — new books &amp; essays worth your time</li>
              <li>Opportunities — calls for submissions, residencies, grants</li>
              <li>Author spotlight — voices shaping African literature</li>
            </ul>
            <div className="nl-card-form">
              <small className="nl-card-form-label">Subscribe free</small>
              <NewsletterSubscribeWidget
                placeholder="your@email.com"
                buttonLabel="Subscribe →"
                list="getmelit"
              />
              <p className="nl-card-note">Free · Weekly · Unsubscribe anytime</p>
            </div>
          </div>

        </div>
      </section>

      {/* ══ CULTURE DROP IN DEPTH ══ */}
      <section className="gml-whats-inside">
        <div className="gml-section-header">
          <div className="gml-section-title">
            <h3>Inside <em>Culture Drop</em></h3>
            <p>
              Every issue is built around four sections — so you always know
              what you&apos;re getting, but never know what you&apos;ll find.
            </p>
          </div>
          <div className="gml-section-meta">4 sections · 8 min read</div>
        </div>

        <div className="gml-pillars-grid">
          <div className="gml-pillar-card">
            <div className="gml-pc-num">01</div>
            <div className="gml-pc-name">The <em>Deep Dive</em></div>
            <p className="gml-pc-desc">
              One long-form cultural essay or commentary — the thing
              you&apos;ll forward to a friend. Art, identity, ambition, the
              modern African experience. Written to make you think.
            </p>
          </div>
          <div className="gml-pillar-card">
            <div className="gml-pc-num">02</div>
            <div className="gml-pc-name">The <em>List</em></div>
            <p className="gml-pc-desc">
              A curated five-pick of what to read, watch, listen to, or
              visit before the next issue. Books, films, albums,
              exhibitions — things worth your time.
            </p>
          </div>
          <div className="gml-pillar-card">
            <div className="gml-pc-num">03</div>
            <div className="gml-pc-name">What&apos;s <em>Playing</em></div>
            <p className="gml-pc-desc">
              A sound dispatch. New releases, overlooked gems, playlists,
              and the occasional hot take on what&apos;s moving in African
              and diasporan music right now.
            </p>
          </div>
          <div className="gml-pillar-card">
            <div className="gml-pc-num">04</div>
            <div className="gml-pc-name">The <em>Calendar</em></div>
            <p className="gml-pc-desc">
              What&apos;s happening this week and next across Lagos, Accra,
              London, and New York — openings, screenings, readings,
              dinners. The events worth leaving the house for.
            </p>
          </div>
        </div>
      </section>

      {/* ══ PULL QUOTE ══ */}
      <div className="gml-pull-band">
        <div className="gml-pull-bar" />
        <div>
          <blockquote className="gml-pull-quote">
            We don&apos;t just tell you what&apos;s happening — we explore{" "}
            <strong>why it matters</strong>. Sharp cultural commentary on the
            modern African experience, delivered every week.
          </blockquote>
          <cite className="gml-pull-cite">
            — The editorial mission of Culture Drop
          </cite>
        </div>
      </div>

      {/* ══ RECENT ISSUES ══ */}
      {recentIssues.length > 0 && (
        <section className="gml-recent">
          <div className="gml-recent-header">
            <h3>Recent <em>issues</em></h3>
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
                  <span>Issue N°{issueNum(idx)}</span>
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
                  dangerouslySetInnerHTML={{ __html: issue.title }}
                />
                {issue.excerpt && (
                  <p
                    className="gml-issue-sub"
                    dangerouslySetInnerHTML={{
                      __html: issue.excerpt
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

      {/* ══ GETMELIT FEATURE ══ */}
      <section className="nl-culturedrop-feature">
        <div className="nl-cdf-inner">
          <div className="nl-cdf-left">
            <div className="nl-cdf-eyebrow">★ GetMeLit · For readers &amp; writers</div>
            <h3>
              Literature, <em>curated weekly.</em>
            </h3>
            <p>
              GetMeLit is the weekly letter for everyone who loves to read
              and write. Stories, poems, essay excerpts, calls for
              submissions, grants, and residencies — everything the literary
              mind needs, in one place, every week.
            </p>
          </div>
          <div className="nl-cdf-right">
            <div className="nl-cdf-rows">
              <div className="nl-cdf-row">
                <span className="nl-cdf-row-num">Stories</span>
                <span className="nl-cdf-row-label">Fiction &amp; poetry from African and diasporan voices</span>
              </div>
              <div className="nl-cdf-row">
                <span className="nl-cdf-row-num">Books</span>
                <span className="nl-cdf-row-label">New releases, essential reads, and editor picks</span>
              </div>
              <div className="nl-cdf-row">
                <span className="nl-cdf-row-num">Opps</span>
                <span className="nl-cdf-row-label">Submissions, grants, residencies, and writing prizes</span>
              </div>
            </div>
            <div className="nl-cdf-form-label">Subscribe to GetMeLit</div>
            <NewsletterSubscribeWidget
              placeholder="your@email.com"
              buttonLabel="Subscribe →"
              list="getmelit"
            />
            <p className="nl-cdf-note">Free · Weekly · Unsubscribe anytime</p>
          </div>
        </div>
      </section>

      {/* ══ COMING SOON ══ */}
      <section className="gml-coming-soon">
        <div className="gml-cs-header">
          <div className="gml-cs-label">
            The Moveee Newsletter Programme
          </div>
          <h3>More <em>dispatches</em>, coming soon</h3>
          <p>
            Culture Drop and GetMeLit are just the start. We&apos;re building
            a family of newsletters for different appetites — each one as
            considered as the last.
          </p>
        </div>
        <div className="gml-cs-grid">
          <div className="gml-cs-card">
            <h4>
              Culture <em>Narratives</em> Digest
            </h4>
            <div className="gml-cs-cadence">Monthly · Starting Q3 2026</div>
            <p>
              A companion to our quarterly essay publication — featuring
              one excerpt, one behind-the-scenes note from the editor,
              and a reading list that extends each issue&apos;s themes.
            </p>
            <GmlWaitlistForm label="Culture Narratives Digest" id="culture-narratives-digest" />
          </div>
          <div className="gml-cs-card">
            <h4>
              The <em>Vendor</em> Letter
            </h4>
            <div className="gml-cs-cadence">Monthly · Starting Q4 2026</div>
            <p>
              A newsletter for makers, artisans and small-batch creators
              in the Moveee Lifestyle ecosystem — covering sourcing,
              craft, pricing, and the business of culture-led commerce.
            </p>
            <GmlWaitlistForm label="The Vendor Letter" id="vendor-letter" />
          </div>
          <div className="gml-cs-card">
            <h4>
              <em>Origins</em> Field Notes
            </h4>
            <div className="gml-cs-cadence">Seasonal · Starting 2027</div>
            <p>
              Dispatches from our resident editors on the ground — the
              cities, the food, the things you can&apos;t Google. Sent
              before and during each Origins journey season.
            </p>
            <GmlWaitlistForm label="Origins Field Notes" id="origins-field-notes" />
          </div>
        </div>
      </section>

      {/* ══ FULL ARCHIVE ══ */}
      {allCount > 0 && (
        <section className="digest-archive" id="archive">
          <div className="nl-archive-header">
            <div className="digest-section-label" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
              Full Archive
            </div>
            <nav className="nl-archive-tabs">
              <Link
                href="/newsletter#archive"
                className={`nl-archive-tab${activeFilter === "all" ? " nl-archive-tab--active" : ""}`}
                scroll={false}
              >
                All <span className="nl-archive-tab-count">{allCount}</span>
              </Link>
              <Link
                href="?list=culture-drop#archive"
                className={`nl-archive-tab${activeFilter === "culture-drop" ? " nl-archive-tab--active" : ""}`}
                scroll={false}
              >
                Culture Drop <span className="nl-archive-tab-count">{cdCount}</span>
              </Link>
              <Link
                href="?list=getmelit#archive"
                className={`nl-archive-tab${activeFilter === "getmelit" ? " nl-archive-tab--active" : ""}`}
                scroll={false}
              >
                GetMeLit <span className="nl-archive-tab-count">{gmlCount}</span>
              </Link>
            </nav>
          </div>
          <div className="digest-archive-list">
            {filtered.map((issue: any, idx: number) => {
              const list = issue.nlList || null;
              return (
                <Link
                  key={issue.id}
                  href={`/newsletter/${issue.slug}`}
                  className="digest-archive-row"
                >
                  <span className="digest-archive-num">
                    {String(issueNum(idx)).padStart(2, "0")}
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
                    dangerouslySetInnerHTML={{ __html: issue.title }}
                  />
                  <div className="digest-archive-tags">
                    {list && (
                      <span className={`nl-list-badge nl-list-badge--${list}`}>
                        {NL_LABELS[list] ?? list}
                      </span>
                    )}
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
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
