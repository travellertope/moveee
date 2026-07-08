import React from "react";
import { getNewslettersWithFallback } from "@/lib/wp";
import { headers } from "next/headers";
import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import GmlCTAForm from "@/components/GmlCTAForm";
import GmlWaitlistForm from "@/components/GmlWaitlistForm";
import NlArchiveList, { NlArchiveRow } from "@/components/NlArchiveList";
import { CultureDropPreview, GetMeLitPreview } from "@/components/NlCardPreviews";
import HideIfSubscribed from "@/components/HideIfSubscribed";
import "../newsletter.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META } from "@/lib/newsletter-lists";

const COUNTRY_TO_SEGMENT: Record<string, string> = {
  GB: "uk", US: "us", NG: "ng", GH: "gh", CA: "ca", AU: "au",
};

async function geoSegment(): Promise<string> {
  try {
    const h = await headers();
    const country = h.get("x-vercel-ip-country") ?? "";
    return COUNTRY_TO_SEGMENT[country.toUpperCase()] ?? "";
  } catch {
    return "";
  }
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function cleanTitle(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&([a-z]+);/gi, (m, n) => HTML_ENTITIES[n.toLowerCase()] ?? m)
    .trim();
}

// Deduplicate regional editions: group by cleaned title, pick the geo-appropriate slug.
function deduplicateEditions(issues: any[], segment: string): any[] {
  const seen: string[] = [];
  const groups: Record<string, any[]> = {};
  for (const n of issues) {
    const t = cleanTitle(n.title || "");
    if (!groups[t]) { seen.push(t); groups[t] = []; }
    groups[t].push(n);
  }
  return seen.map((t) => {
    const group = groups[t];
    return (
      group.find((n) => (n.nlSegment || "") === segment) ||
      group.find((n) => (n.nlSegment || "") === "") ||
      group[0]
    );
  });
}

// dynamic = "force-dynamic" because we read geo headers to serve the viewer's regional edition.
export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Newsletters — Moveee Magazine" },
  description:
    "Two newsletters from The Moveee. Culture Drop — the weekly deep dive into global culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
  alternates: { canonical: "https://themoveee.com/newsletter" },
  openGraph: {
    title: "Newsletters — Moveee Magazine",
    description:
      "Two newsletters from The Moveee. Culture Drop — the weekly deep dive into global culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
    url: "https://themoveee.com/newsletter",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Newsletters — Moveee Magazine",
    description:
      "Two newsletters from The Moveee. Culture Drop — the weekly deep dive into global culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
  },
};

const NL_LABELS: Record<string, string> = {
  "culture-drop": "Culture Drop",
  "getmelit": "GetMeLit",
};

// Only GetMeLit's four sections run on a fixed daily/Saturday cadence —
// Culture Drop's four are all part of the single weekly Tuesday issue.
const GETMELIT_ITEM_TAGS = ["Daily", "Sat", "Sat", "Sat"];

export default async function NewsletterArchive({
  searchParams,
}: {
  searchParams?: { list?: string };
}) {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {
    // CMS unreachable
  }

  // "announcements" is an internal/operational list and must never appear on the archive.
  newsletters = newsletters.filter((n: any) => (n.nlList || "") !== "announcements");

  // Deduplicate regional editions per-list before counting or displaying.
  const segment = await geoSegment();
  newsletters = deduplicateEditions(newsletters, segment);

  const activeFilter = searchParams?.list ?? "all";
  const allCount    = newsletters.length;
  const cdCount     = newsletters.filter((n: any) => (n.nlList || "") === "culture-drop").length;
  const gmlCount    = newsletters.filter((n: any) => (n.nlList || "") === "getmelit").length;

  const filtered = activeFilter === "all"
    ? newsletters
    : newsletters.filter((n: any) => (n.nlList || "") === activeFilter);

  const recentIssues = newsletters.slice(0, 3);

  const issueNum = (index: number) =>
    allCount > 0 ? allCount - index : index + 1;

  return (
    <>
      {/* ══ MASTHEAD ══ */}
      <section className="nl-masthead">
        <div className="nl-masthead-inner">
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

          {/* Card 1 — Culture Drop */}
          <div className="nl-card nl-card--culturedrop">
            <div className="nl-card-bar" />
            <span className="nl-card-eyebrow">★ Culture Drop · Every Tuesday</span>
            <h2 className="nl-card-title">The weekly dispatch on contemporary global culture.</h2>
            <p className="nl-card-desc">
              One deep essay, curated picks, a music dispatch, and
              what&apos;s happening across Lagos, London, New York, and Accra.
              Written to make you think, not just scroll.
            </p>
            <div className="nl-card-form">
              <GmlCTAForm
                list="culture-drop"
                buttonLabel="Drop it in my inbox →"
                successLabel="✓ Welcome to Culture Drop"
              />
            </div>
            <p className="nl-card-note">Free · Weekly · Unsubscribe any time</p>
            <CultureDropPreview />
          </div>

          {/* Card 2 — GetMeLit */}
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
                {NL_META["culture-drop"].pillars.map((p) => (
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
                href="/newsletter/culture-drop"
                className="nl-archive-tab"
              >
                Culture Drop <span className="nl-archive-tab-count">{cdCount}</span>
              </Link>
              <Link
                href="/newsletter/getmelit"
                className="nl-archive-tab"
              >
                GetMeLit <span className="nl-archive-tab-count">{gmlCount}</span>
              </Link>
            </nav>
          </div>
          <NlArchiveList
            rows={filtered.map((issue: any, idx: number): NlArchiveRow => {
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
                tagName: issue.cultureInterests?.nodes?.[0]?.name ?? null,
              };
            })}
          />
        </section>
      )}
    </>
  );
}
