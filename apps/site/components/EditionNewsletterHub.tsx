import React from "react";
import { getNewslettersWithFallback } from "@/lib/wp";
import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import GmlCTAForm from "@/components/GmlCTAForm";
import GmlWaitlistForm from "@/components/GmlWaitlistForm";
import NlArchiveList, { NlArchiveRow } from "@/components/NlArchiveList";
import { CultureDropPreview, GetMeLitPreview } from "@/components/NlCardPreviews";
import HideIfSubscribed from "@/components/HideIfSubscribed";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META } from "@/lib/newsletter-lists";
import type { RegionalSlug } from "@/lib/editions";
import "@/app/newsletter.css";

const NL_LABELS: Record<string, string> = {
  "culture-drop": "Culture Drop",
  getmelit: "GetMeLit",
};

// Only GetMeLit's four sections run on a fixed daily/Saturday cadence —
// Culture Drop's four are all part of the single weekly Tuesday issue.
const GETMELIT_ITEM_TAGS = ["Daily", "Sat", "Sat", "Sat"];

// Which newsletter segment codes (_culture_nl_segment: us/uk/ng/gh/ca/au, see
// CLAUDE.md "Newsletter system architecture") belong to each regional edition.
// An issue with no segment set (targeted at everyone) is always included too.
const EDITION_SEGMENTS: Record<RegionalSlug, string[]> = {
  uk: ["uk"],
  us: ["us", "ca"],
  africa: ["ng", "gh"],
};

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
  const allowedSegments = EDITION_SEGMENTS[edition];

  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {}

  newsletters = newsletters
    .filter((n: any) => (n.nlList || "") !== "announcements")
    // Route this edition to only its own regional content: issues targeted at
    // this edition's segments, plus segment-less issues (sent to everyone).
    .filter((n: any) => {
      const segment = n.nlSegment || "";
      return segment === "" || allowedSegments.includes(segment);
    });

  const allCount = newsletters.length;
  const cdCount = newsletters.filter((n: any) => (n.nlList || "") === "culture-drop").length;
  const gmlCount = newsletters.filter((n: any) => (n.nlList || "") === "getmelit").length;
  const issueNum = (index: number) => (allCount > 0 ? allCount - index : index + 1);
  const recentIssues = newsletters.slice(0, 3);

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
            Two newsletters. One cultural <em>obsession.</em>
          </h1>
          <p className="nl-masthead-sub">
            Culture Drop for the weekly cultural deep dive. GetMeLit for a new
            story or poem every day. Both free. Both essential.
          </p>
          <div className="nl-masthead-pills">
            <Link href="/newsletter/culture-drop" className="nl-masthead-pill nl-masthead-pill--culturedrop">
              ★ Culture Drop · Every Tuesday
            </Link>
            <Link href="/newsletter/getmelit" className="nl-masthead-pill nl-masthead-pill--getmelit">
              ★ GetMeLit · Mon–Sat
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TWO NEWSLETTER CARDS ══ */}
      <HideIfSubscribed>
      <section className="nl-cards-section">
        <div className="nl-cards-inner">
          {/* Culture Drop card */}
          <div className="nl-card nl-card--culturedrop">
            <div className="nl-card-bar" />
            <span className="nl-card-eyebrow">★ Culture Drop · Every Tuesday</span>
            <h2 className="nl-card-title">The weekly dispatch on contemporary global culture.</h2>
            <p className="nl-card-desc">{cfg.cdDesc}</p>
            <div className="nl-card-form">
              <GmlCTAForm
                list="culture-drop"
                buttonLabel="Drop it in my inbox →"
                successLabel="✓ Welcome to Culture Drop"
              />
            </div>
            <p className="nl-card-note">Free · Weekly · Unsubscribe any time</p>
            <CultureDropPreview />
            <Link href="/newsletter/culture-drop" className="nl-card-detail-link">
              Full Culture Drop page →
            </Link>
          </div>

          {/* GetMeLit card */}
          <div className="nl-card nl-card--getmelit">
            <div className="nl-card-bar" />
            <span className="nl-card-eyebrow">★ GetMeLit · Mon–Sat</span>
            <h2 className="nl-card-title">A new story in your inbox, every day.</h2>
            <p className="nl-card-desc">
              A story or poem every weekday — plus a fuller literary dispatch
              every Saturday, with new books, writing opportunities, and an
              author in the spotlight.
            </p>
            <div className="nl-card-form">
              <NewsletterSubscribeWidget
                placeholder="your@email.com"
                buttonLabel="Subscribe →"
                list="getmelit"
              />
            </div>
            <p className="nl-card-note">Free · Daily · Unsubscribe any time</p>
            <GetMeLitPreview />
            <span className="nl-card-footnote">Saturday issues include Books, Opps &amp; Spotlight.</span>
            <Link href="/newsletter/getmelit" className="nl-card-detail-link">
              Full GetMeLit page →
            </Link>
          </div>
        </div>
      </section>
      </HideIfSubscribed>

      {/* ══ TESTIMONIALS ══ */}
      <section className="nl-testimonials">
        <div className="nl-testimonials-inner">
          <div className="nl-testimonial-card">
            <span className="nl-testimonial-stars">★★★★★</span>
            <p className="nl-testimonial-quote">
              &ldquo;The first newsletter I&apos;ve opened every week for a year. Essential.&rdquo;
            </p>
          </div>
          <div className="nl-testimonial-card">
            <span className="nl-testimonial-stars">★★★★★</span>
            <p className="nl-testimonial-quote">
              &ldquo;GetMeLit is the only newsletter I actually look forward to receiving six days a week.&rdquo;
            </p>
          </div>
          <div className="nl-testimonial-card">
            <span className="nl-testimonial-stars">★★★★★</span>
            <p className="nl-testimonial-quote">
              &ldquo;It&apos;s like having a brilliant friend brief you on everything that matters.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ══ INSIDE THE PROGRAMME ══ */}
      <section className="nl-inside">
        <div className="nl-inside-inner">
          <span className="nl-inside-eyebrow">Inside the programme</span>
          <div className="nl-inside-grid">

            <div className="nl-inside-block">
              <h3 className="nl-inside-heading">Inside Culture Drop</h3>
              <p className="nl-inside-intro">
                Four sections, every issue. You always know what you&apos;re
                getting, but never what you&apos;ll find.
              </p>
              <div className="nl-inside-list">
                {cdPillars.map((p) => (
                  <div className="nl-inside-item" key={p.num}>
                    <div className="nl-inside-item-bar" />
                    <div className="nl-inside-item-body">
                      <div className="nl-inside-item-title-row">
                        <span className="nl-inside-item-title">{p.name}</span>
                      </div>
                      <p className="nl-inside-item-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="nl-inside-block">
              <h3 className="nl-inside-heading">Inside GetMeLit</h3>
              <p className="nl-inside-intro">
                Four sections, every issue. You always know what you&apos;re
                getting, but never what you&apos;ll find.
              </p>
              <div className="nl-inside-list">
                {NL_META["getmelit"].pillars.map((p, i) => (
                  <div className="nl-inside-item nl-inside-item--gold" key={p.num}>
                    <div className="nl-inside-item-bar" />
                    <div className="nl-inside-item-body">
                      <div className="nl-inside-item-title-row">
                        <span className="nl-inside-item-title">{p.name}</span>
                        <span className="nl-inside-item-tag">{GETMELIT_ITEM_TAGS[i]}</span>
                      </div>
                      <p className="nl-inside-item-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ RECENT ISSUES ══ */}
      {recentIssues.length > 0 && (
        <section className="nl-recent">
          <div className="nl-recent-inner">
            <div className="nl-recent-header">
              <span>Recent issues</span>
              <a href="#archive">See full archive →</a>
            </div>
            <div className="nl-recent-grid">
              {recentIssues.map((issue: any, idx: number) => {
                const list = issue.nlList || null;
                return (
                  <Link
                    key={issue.id}
                    href={`/newsletter/${issue.slug}`}
                    className={`nl-recent-card${list === "getmelit" ? " nl-recent-card--getmelit" : ""}`}
                  >
                    {list && (
                      <div className="nl-recent-card-badge-row">
                        <span className={`nl-list-badge nl-list-badge--${list}`}>
                          {NL_LABELS[list] ?? list}
                        </span>
                      </div>
                    )}
                    <div className="nl-recent-card-meta">
                      <span className="nl-recent-card-num">Issue N°{String(issueNum(idx)).padStart(3, "0")}</span>
                      <span className="nl-recent-card-date">
                        {new Date(issue.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h4
                      className="nl-recent-card-title"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                    />
                    {issue.excerpt && (
                      <p
                        className="nl-recent-card-excerpt"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(issue.excerpt)
                            .replace(/<[^>]*>/g, "")
                            .slice(0, 160),
                        }}
                      />
                    )}
                    <span className="nl-recent-card-cta">Read this issue →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
          <NlArchiveList
            rows={newsletters.map((issue: any, idx: number): NlArchiveRow => {
              const list = issue.nlList || null;
              return {
                id: issue.id,
                slug: issue.slug,
                num: String(issueNum(idx)).padStart(2, "0"),
                date: new Date(issue.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                titleHtml: sanitizeHtml(issue.title),
                list,
                badgeLabel: list ? (NL_LABELS[list] ?? list) : null,
                tagName: null,
              };
            })}
          />
        </section>
      )}
    </>
  );
}
