import React from "react";
import { getNewslettersWithFallback } from "@/lib/wp";
import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import GmlCTAForm from "@/components/GmlCTAForm";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META } from "@/lib/newsletter-lists";
import type { RegionalSlug } from "@/lib/editions";
import "@/app/newsletter.css";

// Edition-specific overrides — only what changes per region
const EDITION_CONFIG: Record<RegionalSlug, {
  label: string;
  calendarCities: string;
  calendarDesc: string;
  cdDesc: string;
}> = {
  africa: {
    label: "Africa Edition",
    calendarCities: "Lagos, Accra, Nairobi, Johannesburg, and Cape Town",
    calendarDesc:
      "What's happening this week and next across Lagos, Accra, Nairobi, Johannesburg, and Cape Town — openings, screenings, readings, dinners. The events worth leaving the house for.",
    cdDesc:
      "The weekly dispatch on contemporary global culture — viewed through an African and diasporic lens. One deep essay, curated picks, a music dispatch, and what's happening across Lagos, Accra, Nairobi, Johannesburg, and Cape Town.",
  },
  uk: {
    label: "UK Edition",
    calendarCities: "London, Manchester, and Edinburgh",
    calendarDesc:
      "What's happening this week and next across London, Manchester, and Edinburgh — openings, screenings, readings, dinners. The events worth leaving the house for.",
    cdDesc:
      "The weekly dispatch on contemporary global culture — rooted in Britain. One deep essay, curated picks, a music dispatch, and what's happening across London, Manchester, and Edinburgh.",
  },
  us: {
    label: "US Edition",
    calendarCities: "New York, Atlanta, and Los Angeles",
    calendarDesc:
      "What's happening this week and next across New York, Atlanta, and Los Angeles — openings, screenings, readings, dinners. The events worth leaving the house for.",
    cdDesc:
      "The weekly dispatch on contemporary global culture — through an American lens. One deep essay, curated picks, a music dispatch, and what's happening across New York, Atlanta, and Los Angeles.",
  },
};

const OTHER_EDITIONS: Record<RegionalSlug, { label: string; href: string }[]> = {
  africa: [
    { label: "UK Edition", href: "/newsletter/uk" },
    { label: "US Edition", href: "/newsletter/us" },
    { label: "Global", href: "/newsletter" },
  ],
  uk: [
    { label: "Africa Edition", href: "/newsletter/africa" },
    { label: "US Edition", href: "/newsletter/us" },
    { label: "Global", href: "/newsletter" },
  ],
  us: [
    { label: "Africa Edition", href: "/newsletter/africa" },
    { label: "UK Edition", href: "/newsletter/uk" },
    { label: "Global", href: "/newsletter" },
  ],
};

export default async function EditionNewsletterHub({ edition }: { edition: RegionalSlug }) {
  const cfg = EDITION_CONFIG[edition];

  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {}

  newsletters = newsletters.filter((n: any) => (n.nlList || "") !== "announcements");

  const allCount = newsletters.length;
  const cdCount = newsletters.filter((n: any) => (n.nlList || "") === "culture-drop").length;
  const gmlCount = newsletters.filter((n: any) => (n.nlList || "") === "getmelit").length;
  const issueNum = (index: number) => (allCount > 0 ? allCount - index : index + 1);
  const recentIssues = newsletters
    .filter((n: any) => (n.nlList || "") === "culture-drop")
    .slice(0, 3);

  // Build edition-aware Culture Drop pillars (override only The Calendar)
  const cdMeta = NL_META["culture-drop"];
  const cdPillars = cdMeta.pillars.map((p) =>
    p.num === "04" ? { ...p, desc: cfg.calendarDesc } : p
  );

  return (
    <>
      {/* ══ EDITION BANNER ══ */}
      <div className="nl-edition-banner">
        <div className="nl-edition-banner-inner">
          <span className="nl-edition-badge">★ {cfg.label}</span>
          <span className="nl-edition-switch">
            Switch:{" "}
            {OTHER_EDITIONS[edition].map((e, i) => (
              <React.Fragment key={e.href}>
                {i > 0 && " · "}
                <Link href={e.href}>{e.label}</Link>
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>

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
          {/* Culture Drop card */}
          <div className="nl-card nl-card--culturedrop">
            <span className="nl-card-eyebrow">Weekly · Every Tuesday</span>
            <h2 className="nl-card-title">
              Culture <em>Drop</em>
            </h2>
            <p className="nl-card-desc">{cfg.cdDesc}</p>
            <ul className="nl-card-features">
              <li>The Deep Dive — long-form cultural commentary</li>
              <li>The List — five picks worth your time</li>
              <li>What&apos;s Playing — music dispatch</li>
              <li>The Calendar — {cfg.calendarCities}</li>
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
            <Link href="/newsletter/culture-drop" className="nl-card-detail-link">
              Full Culture Drop page →
            </Link>
          </div>

          {/* GetMeLit card */}
          <div className="nl-card nl-card--getmelit">
            <span className="nl-card-eyebrow">Weekly · For readers &amp; writers</span>
            <h2 className="nl-card-title">
              Get<em>Me</em>Lit
            </h2>
            <p className="nl-card-desc">
              A weekly letter for the literary mind. Stories, poems, essay
              excerpts, and opportunities for writers and authors from around
              the world — curated to keep you reading, writing, and
              discovering.
            </p>
            <ul className="nl-card-features">
              <li>A story or poem — fiction and poetry you&apos;ll want to share</li>
              <li>The reading list — new books &amp; essays worth your time</li>
              <li>Opportunities — calls for submissions, residencies, grants</li>
              <li>Author spotlight — voices shaping world literature</li>
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
            <Link href="/newsletter/getmelit" className="nl-card-detail-link">
              Full GetMeLit page →
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CULTURE DROP IN DEPTH ══ */}
      <section className="gml-whats-inside">
        <div className="gml-section-header">
          <div className="gml-section-title">
            <h3>
              Inside <em>Culture Drop</em>
            </h3>
            <p>
              Every issue is built around four sections — so you always know
              what you&apos;re getting, but never know what you&apos;ll find.
            </p>
          </div>
          <div className="gml-section-meta">4 sections · 8 min read</div>
        </div>
        <div className="gml-pillars-grid">
          {cdPillars.map((p) => (
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
          <blockquote className="gml-pull-quote">
            We don&apos;t just tell you what&apos;s happening — we explore{" "}
            <strong>why it matters</strong>. Sharp cultural commentary on the
            modern global cultural experience, delivered every week.
          </blockquote>
          <cite className="gml-pull-cite">— The editorial mission of Culture Drop</cite>
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
      {allCount > 0 && (
        <section className="digest-archive" id="archive">
          <div className="nl-archive-header">
            <div
              className="digest-section-label"
              style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}
            >
              Full Archive
            </div>
            <nav className="nl-archive-tabs">
              <Link
                href={`/newsletter/${edition}#archive`}
                className="nl-archive-tab nl-archive-tab--active"
                scroll={false}
              >
                All <span className="nl-archive-tab-count">{allCount}</span>
              </Link>
              <Link
                href="/newsletter/culture-drop#archive"
                className="nl-archive-tab"
                scroll={false}
              >
                Culture Drop <span className="nl-archive-tab-count">{cdCount}</span>
              </Link>
              <Link
                href="/newsletter/getmelit#archive"
                className="nl-archive-tab"
                scroll={false}
              >
                GetMeLit <span className="nl-archive-tab-count">{gmlCount}</span>
              </Link>
            </nav>
          </div>
          <div className="digest-archive-list">
            {newsletters.map((issue: any, idx: number) => {
              const list = issue.nlList || null;
              const labelMap: Record<string, string> = {
                "culture-drop": "Culture Drop",
                getmelit: "GetMeLit",
              };
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
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                  />
                  <div className="digest-archive-tags">
                    {list && (
                      <span className={`nl-list-badge nl-list-badge--${list}`}>
                        {labelMap[list] ?? list}
                      </span>
                    )}
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
