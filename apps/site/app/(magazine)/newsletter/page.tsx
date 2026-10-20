import { getNewslettersWithFallback } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import NlhCardGrid from "@/components/NlhCardGrid";
import type { NlhCard } from "@/components/NlhCardGrid";
import "../newsletter.css";
import "../newsletter-hub.css";
import { geoSegment, deduplicateEditions, issueNumbersByList } from "@/lib/newsletter-editions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Newsletters — Moveee Magazine" },
  description:
    "Two newsletters from Moveee Magazine. Culture Drop — the weekly deep dive into culture across Lagos, London, New York, Accra, and Paris. GetMeLit — a new story or poem every day, plus books and opportunities for writers.",
  alternates: { canonical: "https://themoveee.com/newsletter" },
  openGraph: {
    title: "Newsletters — Moveee Magazine",
    description:
      "Two newsletters from Moveee Magazine. Culture Drop — the weekly deep dive into culture. GetMeLit — a new story or poem every day.",
    url: "https://themoveee.com/newsletter",
    siteName: "Moveee Magazine",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine Newsletters" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Newsletters — Moveee Magazine",
    description:
      "Two newsletters from Moveee Magazine. Culture Drop — the weekly deep dive into culture. GetMeLit — a new story or poem every day.",
  },
};

function decodeEntities(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .trim();
}

function estimateReadingTime(excerpt: string, content?: string): number {
  const text = content || excerpt;
  const wordCount = text.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default async function NewsletterHubPage() {
  let newsletters: any[] = [];
  try {
    newsletters = await getNewslettersWithFallback(50, { revalidate: 300 });
  } catch {
    // CMS unreachable — render empty state
  }

  // Internal/operational lists never appear on the public archive
  newsletters = newsletters.filter((n: any) => (n.nlList || "") !== "announcements");

  const segment = await geoSegment();
  newsletters = deduplicateEditions(newsletters, segment);

  const cdCount  = newsletters.filter((n: any) => (n.nlList || "") === "culture-drop").length;
  const gmlCount = newsletters.filter((n: any) => (n.nlList || "") === "getmelit").length;

  const issueNums = issueNumbersByList(newsletters);

  const cards: NlhCard[] = newsletters.map((n: any): NlhCard => ({
    id: n.id,
    slug: n.slug,
    title: n.title.replace(/<[^>]*>/g, ""),
    list: n.nlList ?? null,
    badgeLabel: n.nlList === "culture-drop" ? "Culture Drop" : n.nlList === "getmelit" ? "GetMeLit" : null,
    date: n.date
      ? new Date(n.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "",
    readingTime: estimateReadingTime(n.excerpt ?? "", n.content),
    imageUrl: n.featuredImage?.node?.sourceUrl ?? undefined,
    imageAlt: n.featuredImage?.node?.altText ?? undefined,
    excerpt: decodeEntities(n.excerpt ?? "").slice(0, 140),
  }));

  return (
    <>
      {/* ── FULL-WIDTH SITE HEADER (pill hidden via Header.tsx) ── */}
      <header className="nlh-header">
        <div className="nlh-header-inner">
          <Link href="/" className="irc-brand-logo" aria-label="Moveee Magazine">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-black.png" alt="Moveee" className="irc-brand-logo-img" />
          </Link>
          <span className="irc-header-divider" aria-hidden="true" />
          <nav className="nlh-header-nav" aria-label="Site navigation">
            <Link href="/">Magazine</Link>
            <Link href="/newsletter" aria-current="page">Newsletters</Link>
            <Link href="/happenings">Happenings</Link>
          </nav>
          <div className="nlh-header-right">
            <Link href="/newsletter/culture-drop" className="nlh-header-pill nlh-header-pill--cd">
              Culture Drop
            </Link>
            <Link href="/newsletter/getmelit" className="nlh-header-pill nlh-header-pill--gml">
              GetMeLit
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="nlh2-hero" data-header-zone="dark">
        <div className="nlh2-hero-inner">
          <span className="nlh2-hero-eyebrow">Moveee Magazine</span>
          <h1 className="nlh2-hero-title">
            The Moveee <em>Newsletters</em>
          </h1>
          <p className="nlh2-hero-sub">
            Fiction stories daily. Culture dispatch weekly.<br />
            There&rsquo;s something for everyone.
          </p>
          <div className="nlh2-hero-pills">
            <Link href="/newsletter/culture-drop" className="nlh2-hero-pill nlh2-hero-pill--cd">
              Culture Drop · Every Tuesday <span aria-hidden="true">→</span>
            </Link>
            <Link href="/newsletter/getmelit" className="nlh2-hero-pill nlh2-hero-pill--gml">
              GetMeLit · Mon–Sat <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ARCHIVE COLLECTION ── */}
      <section className="nlh2-archive">
        <div className="nlh2-wrap">
          <div className="nlh2-archive-head">
            <div>
              <span className="nlh2-archive-eyebrow">Curated Library</span>
              <h2 className="nlh2-archive-title">Archive Collection</h2>
            </div>
          </div>

          {cards.length > 0 ? (
            <NlhCardGrid cards={cards} cdCount={cdCount} gmlCount={gmlCount} />
          ) : (
            <p className="nlh-cg-empty">No issues published yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* ── CLOSEBAR ── */}
      <footer className="nlh-closebar">
        <span>Moveee Magazine — Two dispatches, one inbox.</span>
      </footer>
    </>
  );
}
