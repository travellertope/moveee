import React from "react";
import { getWPData, GET_NEWSLETTERS } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import SubscribeForm from "@/components/SubscribeForm";
import "../newsletter.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Cultural Digest · The Moveee",
  description: "Past issues of The Cultural Digest — culture, art, film, fashion, and music from across the African diaspora.",
};

export default async function DigestArchive() {
  let newsletters: any[] = [];

  try {
    const data = await getWPData(GET_NEWSLETTERS, { first: 24 });
    newsletters = data?.cultureNewsletters?.nodes || [];
  } catch {
    // CMS unreachable
  }

  const heroIssue = newsletters[0] || null;
  const latestIssues = newsletters.slice(1, 4);
  const archiveIssues = newsletters.slice(4);

  return (
    <>
      {/* ── DIGEST MASTHEAD ── */}
      <section className="digest-head">
        <div className="digest-head-inner">
          <div className="digest-eyebrow">The Moveee</div>
          <h1 className="digest-title">The Cultural <em>Digest</em></h1>
          <p className="digest-desc">
            Culture, art, film, fashion, and music from across the African diaspora — curated and delivered every Friday.
          </p>
          <div className="digest-subscribe-band">
            <span className="digest-sub-label">Join the list</span>
            <div className="digest-sub-form">
              <SubscribeForm
                placeholder="Enter your email address..."
                buttonLabel="Subscribe Free →"
                buttonClassName="digest-sub-btn"
              />
            </div>
            <span className="digest-sub-note">Free. No spam. Unsubscribe anytime.</span>
          </div>
        </div>
        <div className="digest-head-rule" />
        <div className="digest-issue-count">
          {newsletters.length > 0
            ? `${newsletters.length} issue${newsletters.length !== 1 ? "s" : ""} in the archive`
            : "Archive coming soon"}
        </div>
      </section>

      {newsletters.length === 0 ? (
        <section className="digest-empty">
          <p>No issues published yet. The first issue arrives soon.</p>
        </section>
      ) : (
        <>
          {/* ── HERO ISSUE ── */}
          {heroIssue && (
            <section className="digest-hero">
              <Link href={`/newsletter/${heroIssue.slug}`} className="digest-hero-link">
                <div className="digest-hero-img">
                  {heroIssue.featuredImage?.node?.sourceUrl ? (
                    <Image
                      src={heroIssue.featuredImage.node.sourceUrl}
                      alt={heroIssue.featuredImage.node.altText || heroIssue.title}
                      fill
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  ) : (
                    <div className="digest-hero-placeholder" />
                  )}
                  <div className="digest-hero-overlay" />
                </div>
                <div className="digest-hero-body">
                  <div className="digest-issue-tag">Latest Issue</div>
                  <h2 className="digest-hero-title" dangerouslySetInnerHTML={{ __html: heroIssue.title }} />
                  {heroIssue.excerpt && (
                    <p className="digest-hero-excerpt" dangerouslySetInnerHTML={{ __html: heroIssue.excerpt.replace(/<[^>]*>/g, "").slice(0, 200) + "…" }} />
                  )}
                  <div className="digest-hero-meta">
                    <span>{new Date(heroIssue.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                    {heroIssue.cultureInterests?.nodes?.map((t: any) => (
                      <span key={t.slug} className="digest-tag">{t.name}</span>
                    ))}
                  </div>
                  <span className="digest-read-cta">Read Issue ↗</span>
                </div>
              </Link>
            </section>
          )}

          {/* ── LATEST 3 ── */}
          {latestIssues.length > 0 && (
            <section className="digest-latest">
              <div className="digest-section-label">Recent Issues</div>
              <div className="digest-grid-3">
                {latestIssues.map((issue: any) => (
                  <Link key={issue.id} href={`/newsletter/${issue.slug}`} className="digest-card">
                    <div className="digest-card-img">
                      {issue.featuredImage?.node?.sourceUrl ? (
                        <Image
                          src={issue.featuredImage.node.sourceUrl}
                          alt={issue.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div className="digest-card-placeholder" />
                      )}
                    </div>
                    <div className="digest-card-body">
                      <div className="digest-card-date">
                        {new Date(issue.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <h3 className="digest-card-title" dangerouslySetInnerHTML={{ __html: issue.title }} />
                      {issue.excerpt && (
                        <p className="digest-card-excerpt" dangerouslySetInnerHTML={{ __html: issue.excerpt.replace(/<[^>]*>/g, "").slice(0, 120) + "…" }} />
                      )}
                      {issue.cultureInterests?.nodes?.length > 0 && (
                        <div className="digest-card-tags">
                          {issue.cultureInterests.nodes.slice(0, 3).map((t: any) => (
                            <span key={t.slug} className="digest-tag">{t.name}</span>
                          ))}
                        </div>
                      )}
                      <span className="digest-card-cta">Read Issue →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── ARCHIVE ── */}
          {archiveIssues.length > 0 && (
            <section className="digest-archive">
              <div className="digest-section-label">Archive</div>
              <div className="digest-archive-list">
                {archiveIssues.map((issue: any, idx: number) => (
                  <Link key={issue.id} href={`/newsletter/${issue.slug}`} className="digest-archive-row">
                    <span className="digest-archive-num">{String(archiveIssues.length - idx).padStart(2, "0")}</span>
                    <span className="digest-archive-date">
                      {new Date(issue.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="digest-archive-title" dangerouslySetInnerHTML={{ __html: issue.title }} />
                    <div className="digest-archive-tags">
                      {issue.cultureInterests?.nodes?.slice(0, 2).map((t: any) => (
                        <span key={t.slug} className="digest-tag">{t.name}</span>
                      ))}
                    </div>
                    <span className="digest-archive-arrow">→</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
