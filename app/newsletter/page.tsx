import React from "react";
import { getWPData, GET_NEWSLETTERS } from "@/lib/wp";
import Link from "next/link";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";
import GmlCTAForm from "@/components/GmlCTAForm";
import GmlWaitlistForm from "@/components/GmlWaitlistForm";
import "../newsletter.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "GetMeLit · The Moveee's Flagship Newsletter",
  description:
    "Deep cultural essays, curated picks, and weekly dispatches from across the African diaspora. Delivered every other Friday by The Moveee.",
};

export default async function NewsletterArchive() {
  let newsletters: any[] = [];
  try {
    const data = await getWPData(GET_NEWSLETTERS, { first: 50 });
    newsletters = data?.cultureNewsletters?.nodes || [];
  } catch {
    // CMS unreachable
  }

  const totalCount = newsletters.length;
  const latestIssue = newsletters[0] || null;
  const recentIssues = newsletters.slice(0, 3);

  // Issue numbers: latest = totalCount, oldest = 1
  const issueNum = (index: number) =>
    totalCount > 0 ? totalCount - index : index + 1;

  return (
    <>
      {/* Grain texture overlay */}
      <div className="gml-grain" aria-hidden="true" />

      {/* ══ HERO ══ */}
      <section className="gml-hero">
        <div className="gml-hero-inner">
          {/* Left: copy + subscribe form */}
          <div>
            <div className="gml-badge">★ Flagship Newsletter · Biweekly</div>
            <h1 className="gml-hero-title">
              Get<br />Me<span className="lit"><em>Lit</em></span>.
            </h1>
            <p className="gml-hero-sub">
              If you want to understand the true heartbeat of contemporary
              African culture, the headlines won&apos;t give you the full
              story — but <strong>GetMeLit</strong> will. Delivered every
              two weeks by The Moveee.
            </p>
            <div className="gml-hero-form">
              <NewsletterSubscribeWidget
                placeholder="your@email.com"
                buttonLabel="Subscribe →"
                buttonClassName="gml-hero-btn"
                variant="dark"
              />
            </div>
            <div className="gml-hero-note">
              <span>✓ Free · Always</span>
              <span>✓ Every other Friday</span>
              <span>✓ Unsubscribe anytime</span>
            </div>
          </div>

          {/* Right: issue mockup */}
          <div className="gml-issue-mockup">
            <span className="gml-mockup-float gml-float-readers">
              12,400+ readers
            </span>
            <span className="gml-mockup-float gml-float-cadence">
              Every 2 weeks
            </span>
            <div className="gml-mockup-frame">
              <div className="gml-mockup-header">
                <span className="gml-mockup-logo">
                  Get<em>Me</em>Lit
                </span>
                <span className="gml-mockup-issue">
                  {latestIssue
                    ? `Issue N°${totalCount} · ${new Date(latestIssue.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                    : "The Moveee · Biweekly"}
                </span>
              </div>

              {latestIssue ? (
                <>
                  <div
                    className="gml-mockup-title"
                    dangerouslySetInnerHTML={{ __html: latestIssue.title }}
                  />
                  {latestIssue.excerpt && (
                    <div
                      className="gml-mockup-sub"
                      dangerouslySetInnerHTML={{
                        __html: latestIssue.excerpt
                          .replace(/<[^>]*>/g, "")
                          .slice(0, 100),
                      }}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="gml-mockup-title">
                    Culture, art &amp; <em>ambition</em>
                  </div>
                  <div className="gml-mockup-sub">
                    Dispatches from across the African diaspora.
                  </div>
                </>
              )}

              <ul className="gml-mockup-items">
                <li>
                  <span className="gml-mockup-num">01</span>
                  <span className="gml-mockup-text">The Deep Dive — long-form cultural essay</span>
                </li>
                <li>
                  <span className="gml-mockup-num">02</span>
                  <span className="gml-mockup-text">The List — five things worth your time</span>
                </li>
                <li>
                  <span className="gml-mockup-num">03</span>
                  <span className="gml-mockup-text">What&apos;s Playing — music dispatch</span>
                </li>
                <li>
                  <span className="gml-mockup-num">04</span>
                  <span className="gml-mockup-text">The Calendar — Lagos, Accra, London, NYC</span>
                </li>
              </ul>
              <div className="gml-mockup-footer">
                The Moveee · Best in Culture · Unsubscribe
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHAT'S INSIDE ══ */}
      <section className="gml-whats-inside">
        <div className="gml-section-header">
          <div className="gml-section-num">N°01</div>
          <div className="gml-section-title">
            <h3>What&apos;s <em>inside</em></h3>
            <p>
              Every issue of GetMeLit is built around the same four
              sections — so you always know what you&apos;re getting, but
              never know what you&apos;ll find.
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
              you&apos;ll send to a friend. Art, identity, ambition, the
              modern African experience. Written to make you think, not
              just scroll.
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
              and the occasional hot take on what&apos;s happening in
              African and diasporan music right now.
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
            We don&apos;t just tell you what&apos;s happening; we explore{" "}
            <strong>why it matters</strong> — blending deep cultural
            appreciation with sharp, relatable commentary on the modern
            African experience.
          </blockquote>
          <cite className="gml-pull-cite">
            — The editorial mission of GetMeLit
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

      {/* ══ MAIN SIGNUP CTA ══ */}
      <section className="gml-signup-section">
        <div className="gml-signup-inner">
          <div className="gml-signup-left">
            <div className="gml-badge">★ Join the conversation</div>
            <h3>
              A curated haven for the <em>culturally curious</em>.
            </h3>
            <p>
              Built for thinkers, creators, and anyone obsessed with the
              art, literature, and quiet revolutions shaping our world
              today.
            </p>
          </div>

          <div className="gml-signup-right">
            <div className="gml-form-label">Subscribe to GetMeLit</div>
            <GmlCTAForm />
            <div className="gml-signup-note">
              Free · Biweekly · Unsubscribe anytime
              <br />
              Join 12,400+ readers across 58 countries
            </div>
            <div className="gml-signup-perks">
              <div className="gml-perk">
                <span className="gml-perk-n">✓</span>
                <p>The <em>deep dive</em> — one essay that makes you think</p>
              </div>
              <div className="gml-perk">
                <span className="gml-perk-n">✓</span>
                <p>The <em>list</em> — five things worth your time this week</p>
              </div>
              <div className="gml-perk">
                <span className="gml-perk-n">✓</span>
                <p>The <em>calendar</em> — what&apos;s on in Lagos, Accra, London, NYC</p>
              </div>
              <div className="gml-perk">
                <span className="gml-perk-n">✓</span>
                <p>Early access to <em>Moveee Events</em> RSVP</p>
              </div>
            </div>
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
            GetMeLit is our flagship. But we&apos;re building a family of
            newsletters for different appetites — each one as considered
            as the last.
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
            <GmlWaitlistForm label="Culture Narratives Digest" />
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
            <GmlWaitlistForm label="The Vendor Letter" />
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
            <GmlWaitlistForm label="Origins Field Notes" />
          </div>
        </div>
      </section>

      {/* ══ FULL ARCHIVE ══ */}
      {totalCount > 0 && (
        <section className="digest-archive" id="archive">
          <div className="digest-section-label">
            Full Archive · {totalCount} issue{totalCount !== 1 ? "s" : ""}
          </div>
          <div className="digest-archive-list">
            {newsletters.map((issue: any, idx: number) => (
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
                  {issue.cultureInterests?.nodes
                    ?.slice(0, 2)
                    .map((t: any) => (
                      <span key={t.slug} className="digest-tag">
                        {t.name}
                      </span>
                    ))}
                </div>
                <span className="digest-archive-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
