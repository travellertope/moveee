import React from "react";
import Link from "next/link";
import GmlCTAForm from "@/components/GmlCTAForm";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import { sanitizeHtml } from "@/lib/sanitize";
import { NL_META, NewsletterListId } from "@/lib/newsletter-lists";

function issueNum(totalCount: number, index: number) {
  return totalCount > 0 ? totalCount - index : index + 1;
}

export default function NewsletterPublicationPage({
  listId,
  issues,
}: {
  listId: NewsletterListId;
  issues: any[];
}) {
  const meta = NL_META[listId];
  const totalCount = issues.length;
  const recentIssues = issues.slice(0, 3);
  const isGml = listId === "getmelit";
  const accentMod = isGml ? " np-hero--getmelit" : "";
  const accentAllMod = isGml ? "--getmelit" : "";

  const TESTIMONIALS = [
    {
      quote: isGml
        ? "The best literary newsletter I've found. Every recommendation has been golden."
        : "The first newsletter I've opened every week for a year. Essential.",
    },
    {
      quote: isGml
        ? "Finally, a newsletter that treats African writing with the seriousness it deserves."
        : "Finally, a cultural dispatch that doesn't feel like a PR feed.",
    },
    {
      quote: isGml
        ? "The reading lists have transformed my bookshelf. Genuinely transformative curation."
        : "The music picks alone are worth it. Deep, thoughtful curation.",
    },
  ];

  const ctaBtnClass = isGml ? "np-cta-btn np-cta-btn--getmelit" : "np-cta-btn";
  const formBtnClass = isGml ? "np-form-btn np-form-btn--getmelit" : "np-form-btn";

  const HeroForm = isGml ? (
    <NewsletterSubscribeWidget
      placeholder="your@email.com"
      buttonLabel="Get it in my inbox →"
      list="getmelit"
    />
  ) : (
    <GmlCTAForm
      list="culture-drop"
      buttonLabel="Drop it in my inbox →"
      successLabel="✓ Welcome to Culture Drop"
    />
  );

  return (
    <>
      {/* ── HERO ── */}
      <section className={`np-hero${accentMod}`}>
        <div className="np-hero-inner">
          {/* Left column */}
          <div className="np-hero-left">
            <div className="np-eyebrow">
              <span>{meta.eyebrow}</span>
              <a
                href={`/newsletter/${listId}/feed`}
                className="np-eyebrow-rss"
                aria-label={`RSS feed for ${meta.label}`}
                title="RSS Feed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6-3v.01M5 19h.01" />
                </svg>
              </a>
            </div>

            <h1 className="np-title">{meta.standfirst}</h1>

            <p className="np-standfirst">
              {listId === "culture-drop"
                ? "One deep essay, curated picks, a music dispatch, and what's happening across Lagos, London, New York, and Accra. Written to make you think, not just scroll."
                : "Stories, books worth reading, creative opportunities, and spotlights on writers and readers shaping culture. For people who live for words."}
            </p>

            <div className="np-form">
              {HeroForm}
            </div>
            <span className="np-form-note">Free · {isGml ? "Fortnightly" : "Weekly"} · Unsubscribe any time</span>
          </div>

          {/* Right column: preview card */}
          <div className="np-hero-right">
            <div className="np-hero-wash" />
            <div className="np-preview-card">
              <div className="np-preview-header">
                <span className="np-preview-badge">{meta.label}</span>
                <span className="np-preview-date">
                  {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="np-preview-body">
                <h3 className="np-preview-title">{meta.pillars[0]?.name}: {meta.pillars[0]?.desc?.slice(0, 60)}…</h3>
                <p className="np-preview-excerpt">{meta.standfirst}</p>
                <div className="np-preview-divider">──── {meta.pillars[1]?.name?.toUpperCase()} ────</div>
                <div className="np-preview-list">
                  {meta.pillars.slice(1).map((p) => (
                    <span key={p.num} className="np-preview-list-item">
                      ▸ <strong>{p.name}</strong> — {p.desc?.slice(0, 40)}…
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="np-testimonials">
        <div className="np-testimonials-inner">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="np-testimonial">
              <span className="np-stars">★★★★★</span>
              <p className="np-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className={`np-wyg np-wyg${accentAllMod}`}>
        <div className="np-wyg-inner">
          <div className="np-wyg-left">
            <span className="np-wyg-label">What you get</span>
            <h2 className="np-wyg-title">
              {meta.pillars.length} things. Every {isGml ? "fortnight" : "week"}.
            </h2>
            <p className="np-wyg-body">
              Every issue of {meta.label} is built around {meta.pillars.length} sections — so you always know what you're getting, but never know what you'll find.
            </p>
            <div className="np-wyg-actions">
              <Link href="#archive" className="np-wyg-cta-secondary">
                Browse the archive →
              </Link>
            </div>
          </div>
          <div className="np-wyg-right">
            {meta.pillars.map((p) => (
              <div key={p.num} className={`np-pillar${isGml ? " np-pillar--getmelit" : ""}`}>
                <span className="np-pillar-name">{p.name}</span>
                <p className="np-pillar-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ── */}
      <section className={`np-pull${isGml ? " np-pull--getmelit" : ""}`}>
        <div className="np-pull-rule" />
        <blockquote className="np-pull-text">&ldquo;{meta.pullQuote}&rdquo;</blockquote>
        <cite className="np-pull-cite">{meta.pullCite}</cite>
      </section>

      {/* ── RECENT ISSUES ── */}
      {recentIssues.length > 0 && (
        <section className="np-recent">
          <div className="np-recent-inner">
            <div className="np-recent-header">
              <span className="np-section-label">Recent issues</span>
              <a href="#archive" className={`np-all-link${isGml ? " np-all-link--getmelit" : ""}`}>
                Full archive →
              </a>
            </div>
            <div className="np-recent-grid">
              {recentIssues.map((issue: any, idx: number) => (
                <Link
                  key={issue.id}
                  href={`/newsletter/${issue.slug}`}
                  className={`np-issue-card${isGml ? " np-issue-card--getmelit" : ""}`}
                >
                  <div className="np-issue-card-meta">
                    <span className="np-issue-num">Issue N°{String(issueNum(totalCount, idx)).padStart(3, "0")}</span>
                    <span className="np-issue-date">
                      {new Date(issue.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3
                    className="np-issue-title"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(issue.title) }}
                  />
                  {issue.excerpt && (
                    <p
                      className="np-issue-excerpt"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(issue.excerpt)
                          .replace(/<[^>]*>/g, "")
                          .slice(0, 160),
                      }}
                    />
                  )}
                  <span className="np-issue-read-link">Read this issue →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FULL ARCHIVE ── */}
      {totalCount > 0 && (
        <section className="np-archive" id="archive">
          <div className="np-archive-inner">
            <div className="np-archive-header">
              <span className="np-section-label">Full Archive</span>
              <span className="np-archive-count">{totalCount} issues</span>
            </div>
            <div className="np-archive-divider" />
            <div className="np-archive-list digest-archive-list">
              {issues.map((issue: any, idx: number) => (
                <Link
                  key={issue.id}
                  href={`/newsletter/${issue.slug}`}
                  className={`digest-archive-row${isGml ? " digest-archive-row--getmelit" : ""}`}
                >
                  <span className="digest-archive-num">
                    {String(issueNum(totalCount, idx)).padStart(3, "0")}
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
                  <span className="digest-archive-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BOTTOM CTA ── */}
      <section className="np-cta-band">
        <div className="np-cta-inner">
          <h2 className="np-cta-title">
            {isGml ? "One literary dispatch. Every fortnight." : "One cultural dispatch. Every week."}
          </h2>
          <div className="np-cta-form">
            {isGml ? (
              <NewsletterSubscribeWidget
                placeholder="your@email.com"
                buttonLabel="Get it in my inbox →"
                list="getmelit"
              />
            ) : (
              <GmlCTAForm
                list="culture-drop"
                buttonLabel="Drop it in my inbox →"
                successLabel="✓ You're in"
              />
            )}
          </div>
          <span className="np-cta-note">No spam. No nonsense. Unsubscribe any time.</span>
        </div>
      </section>
    </>
  );
}
