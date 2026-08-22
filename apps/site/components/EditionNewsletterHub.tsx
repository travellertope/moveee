import { getNewslettersWithFallback } from "@/lib/wp";
import Link from "next/link";
import NlhArchiveList from "@/components/NlhArchiveList";
import type { NlArchiveRow } from "@/components/NlArchiveList";
import { sanitizeHtml } from "@/lib/sanitize";
import type { RegionalSlug } from "@/lib/editions";
import "@/app/newsletter.css";
import "@/app/newsletter-hub.css";

const NL_LABELS: Record<string, string> = {
  "culture-drop": "Culture Drop",
  getmelit: "GetMeLit",
};

// Which newsletter segment codes (_culture_nl_segment: us/uk/ng/gh/ca/au, see
// CLAUDE.md "Newsletter system architecture") belong to each regional edition.
// An issue with no segment set (targeted at everyone) is always included too.
const EDITION_SEGMENTS: Record<RegionalSlug, string[]> = {
  uk: ["uk"],
  us: ["us", "ca"],
  // "africa" itself is the umbrella segment editors pick for "send to all of
  // Africa" in the Send Newsletter meta box (see ALLOWED_SEGMENTS in
  // class-culture-newsletter-send.php) — must be included alongside the
  // country-specific codes it can also be sent to individually.
  africa: ["africa", "ng", "gh", "ke", "za"],
};

const EDITION_LABEL: Record<RegionalSlug, string> = {
  uk: "UK Edition",
  us: "US Edition",
  africa: "Africa Edition",
};

// Rebuilt onto the same minimal dark-hero style as /newsletter's own hub
// (see newsletter-hub.css) — only the archive is edition-scoped (filtered
// to this region's segments); the hero copy and entry buttons are the
// same across every edition, with a small region eyebrow above the title.
export default async function EditionNewsletterHub({ edition }: { edition: RegionalSlug }) {
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

  return (
    <>
      {/* ══ HERO — mirrors /newsletter's own hub (see newsletter-hub.css);
          a small region eyebrow sits above the shared title/subtitle/
          buttons so the page still reads as edition-specific. ══ */}
      <section className="nlh-hero" data-header-zone="dark">
        <div className="nlh-hero-inner">
          <span className="nlh-hero-eyebrow">{EDITION_LABEL[edition]}</span>
          <h1 className="nlh-hero-title">
            The Moveee <em>Newsletters</em>
          </h1>
          <p className="nlh-hero-sub">
            Fiction Stories daily. Culture Dispatch weekly. There&rsquo;s something for everyone.
          </p>
          <div className="nlh-hero-pills">
            <Link href="/newsletter/culture-drop" className="nlh-hero-pill nlh-hero-pill--cd">
              Culture Drop · Every Tuesday<span className="arrow">→</span>
            </Link>
            <Link href="/newsletter/getmelit" className="nlh-hero-pill nlh-hero-pill--gml">
              GetMeLit · Mon–Sat<span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ ARCHIVE — scoped to this edition's own segments ══ */}
      <section className="nlh-archive" id="archive">
        <div className="nlh-wrap">
          <div className="nlh-archive-head">
            <h3>Archive</h3>
            <nav className="nlh-archive-tabs">
              <Link
                href={`/newsletter/${edition}#archive`}
                className="nlh-archive-tab nlh-archive-tab--active"
                scroll={false}
              >
                All <span className="n">{allCount}</span>
              </Link>
              <Link href="/newsletter/culture-drop" className="nlh-archive-tab">
                Culture Drop <span className="n">{cdCount}</span>
              </Link>
              <Link href="/newsletter/getmelit" className="nlh-archive-tab">
                GetMeLit <span className="n">{gmlCount}</span>
              </Link>
            </nav>
          </div>
          {allCount > 0 ? (
            <NlhArchiveList
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
          ) : (
            <p className="nlh-empty">No issues published yet — check back soon.</p>
          )}
        </div>
      </section>

      <footer className="nlh-closebar">
        <span>Moveee Magazine — Two dispatches, one inbox.</span>
      </footer>
    </>
  );
}
