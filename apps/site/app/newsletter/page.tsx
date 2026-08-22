import { getNewslettersWithFallback } from "@/lib/wp";
import Link from "next/link";
import NlhArchiveList from "@/components/NlhArchiveList";
import type { NlArchiveRow } from "@/components/NlArchiveList";
import "../newsletter.css";
import "../newsletter-hub.css";
import { sanitizeHtml } from "@/lib/sanitize";
import { geoSegment, deduplicateEditions, issueNumbersByList } from "@/lib/newsletter-editions";

// dynamic = "force-dynamic" because we read geo headers to serve the viewer's regional edition.
export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Newsletters — Moveee Magazine" },
  description:
    "Two newsletters from Moveee Magazine. Culture Drop — the weekly deep dive into culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
  alternates: { canonical: "https://themoveee.com/newsletter" },
  openGraph: {
    title: "Newsletters — Moveee Magazine",
    description:
      "Two newsletters from Moveee Magazine. Culture Drop — the weekly deep dive into culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
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
      "Two newsletters from Moveee Magazine. Culture Drop — the weekly deep dive into culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
  },
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

  // Per-list issue numbers, not one shared counter across both newsletters
  // — see issueNumbersByList's own comment for why.
  const issueNums = issueNumbersByList(newsletters);

  return (
    <>
      {/* ══ HERO — mirrors GetMeLit/Culture Drop's own dark-hero style;
          no subscribe forms here, the two buttons take you straight into
          each newsletter's own page where subscribing happens. ══ */}
      <section className="nlh-hero" data-header-zone="dark">
        <div className="nlh-hero-inner">
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

      {/* ══ ARCHIVE ══ */}
      <section className="nlh-archive" id="archive">
        <div className="nlh-wrap">
          <div className="nlh-archive-head">
            <h3>Archive</h3>
            <nav className="nlh-archive-tabs">
              <Link
                href="/newsletter#archive"
                className={`nlh-archive-tab${activeFilter === "all" ? " nlh-archive-tab--active" : ""}`}
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
              rows={filtered.map((issue: any): NlArchiveRow => {
                const list = issue.nlList || null;
                return {
                  id: issue.id,
                  slug: issue.slug,
                  num: String(issueNums.get(issue.id) ?? 0).padStart(2, "0"),
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
