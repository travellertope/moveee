import Link from "next/link";
import Image from "next/image";
import Marquee from "@/components/Marquee";
import AdBanner from "@/components/AdBanner";
import { decodeHtml } from "@/lib/decode-html";
import ShopCarousel from "@/components/ShopCarousel";
import IssueCarousel from "@/components/IssueCarousel";
import HomepageNewsletterForm from "@/components/HomepageNewsletterForm";
import ConnectCTA from "@/components/ConnectCTA";
import type { EditionSlug } from "@/lib/editions";
import { EDITIONS } from "@/lib/editions";

interface Props {
  coverStory: any;
  stories: any[];
  products: any[];
  edition: EditionSlug;
  latestIssue?: any;
  latestIssueStories?: any[];
  interviewStories?: any[];
  seriesTheRadar?: any[];
  seriesPortraits?: any[];
  seriesTheLane?: any[];
  seriesThinkCreative?: any[];
}

export default function HomepageContent({
  coverStory, stories, products, edition,
  latestIssue, latestIssueStories = [], interviewStories = [],
  seriesTheRadar = [], seriesPortraits = [], seriesTheLane = [], seriesThinkCreative = [],
}: Props) {
  const heroStories   = stories.slice(0, 5);
  const interviewStrip = interviewStories.slice(0, 4);
  const editionLabel  = EDITIONS[edition].label;
  const editionPrefix = edition === "global" ? "" : `/${edition}`;

  const coverExcerpt = (() => {
    const src = coverStory?.content || coverStory?.excerpt || "";
    const plain = src.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 220 ? plain.slice(0, 220).replace(/\s\S+$/, "") + "…" : plain;
  })();

  return (
    <>
      {/* ===== HERO: STICKY COVER STORY + SCROLLING RIGHT ===== */}
      <section className="hp-hero">

        {/* LEFT: Sticky Cover Story — Monocle-style stacked layout */}
        <div className="hp-cover-col">
          <div className="hp-cover-sticky">
            {coverStory ? (
              <Link href={`/magazine/${coverStory.slug}`} className="hp-cover-link">
                    {/* Image above text */}
                {coverStory.featuredImage && (
                  <div className="hp-cover-image-box">
                    <div className="hp-cover-image">
                      <Image
                        src={coverStory.featuredImage.node.sourceUrl}
                        alt={coverStory.featuredImage.node.altText || coverStory.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        priority
                      />
                    </div>
                  </div>
                )}

                {/* Text block: category → title → excerpt → meta */}
                <div className="hp-cover-text">
                  <div className="hp-cover-kicker">
                    {decodeHtml(coverStory.categories?.nodes[0]?.name || "Culture").toUpperCase()}
                  </div>
                  <h2 className="hp-cover-title">{coverStory.title}</h2>
                  <p className="hp-cover-excerpt">{coverExcerpt}</p>
                </div>
              </Link>
            ) : (
              <div className="hp-cover-placeholder">
                <div className="hp-cover-placeholder-inner">
                  <span>The Moveee</span>
                  <p>Best in Culture</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Scrollable — article grid + widgets */}
        <div className="hp-right-col">
          <div className="hp-right-stories">
            {heroStories.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-story-card">
                <div className="hp-story-thumb">
                  {story.featuredImage && (
                    <Image
                      src={story.featuredImage.node.sourceUrl}
                      alt={story.featuredImage.node.altText || ""}
                      fill className="object-cover"
                    />
                  )}
                </div>
                <span className="hp-story-cat">{decodeHtml(story.categories?.nodes[0]?.name || "Culture")}</span>
                <h4 className="hp-story-title">{story.title}</h4>
                <span className="hp-story-meta">
                  {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {story.countries?.nodes[0]?.name ? ` · ${story.countries.nodes[0].name}` : ""}
                </span>
              </Link>
            ))}
          </div>

          <AdBanner slot="hero-sidebar" className="hp-ad-sidebar" />

          <div className="hp-games-widget">
            <div className="hp-widget-head">
              <div className="hp-widget-label">Culture Games</div>
              <Link href="/games" className="hp-widget-see-all">Play now →</Link>
            </div>
            <div className="hp-games-list">
              <Link href="/games/trivia" className="hp-game-item">
                <div className="hp-game-icon">🧠</div>
                <div>
                  <div className="hp-game-name">Culture Trivia</div>
                  <div className="hp-game-desc">10 daily questions on African culture</div>
                </div>
              </Link>
              <Link href="/games/who-said-it" className="hp-game-item">
                <div className="hp-game-icon">💬</div>
                <div>
                  <div className="hp-game-name">Who Said It?</div>
                  <div className="hp-game-desc">Match the quote to the voice</div>
                </div>
              </Link>
              <Link href="/games/sudoku" className="hp-game-item">
                <div className="hp-game-icon">🔢</div>
                <div>
                  <div className="hp-game-name">Daily Sudoku</div>
                  <div className="hp-game-desc">One grid a day, same for everyone</div>
                </div>
              </Link>
              <Link href="/games/crossword" className="hp-game-item">
                <div className="hp-game-icon">✏️</div>
                <div>
                  <div className="hp-game-name">Daily Crossword</div>
                  <div className="hp-game-desc">African culture mini-crossword</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      <AdBanner slot="leaderboard-top" className="hp-ad-leaderboard" />

      {/* ===== LATEST ISSUE ===== */}
      {latestIssue && (
        <section className="hp-section hp-latest-issue" id="latest-issue">
          <div className="hp-section-header">
            <div className="hp-section-title">
              <span className="hp-section-label">Magazine</span>
              <h3>Latest Issue</h3>
            </div>
            <Link href={`/magazine/issues/${latestIssue.slug}`} className="hp-section-link">See Full Issue →</Link>
          </div>
          <div className="hp-issue-layout">
            {/* Left: cover + meta */}
            <div className="hp-issue-left">
              {latestIssue.meta?.issue_cover_image_url && (
                <Link href={`/magazine/issues/${latestIssue.slug}`} className="hp-issue-cover">
                  <Image
                    src={latestIssue.meta.issue_cover_image_url}
                    alt={latestIssue.name}
                    fill
                    className="object-cover"
                  />
                </Link>
              )}
              <div className="hp-issue-meta">
                <span className="hp-issue-number">
                  {latestIssue.meta?.issue_number ? `Issue ${latestIssue.meta.issue_number}` : latestIssue.name}
                </span>
                {latestIssue.meta?.issue_subtitle && (
                  <p className="hp-issue-subtitle">{latestIssue.meta.issue_subtitle}</p>
                )}
              </div>
            </div>

            {/* Right: single-row scrolling carousel */}
            {latestIssueStories.length > 0 && (
              <IssueCarousel stories={latestIssueStories.slice(0, 8)} />
            )}
          </div>
        </section>
      )}


      {/* ===== INTERVIEWS (post grid) ===== */}
      {interviewStrip.length > 0 && (
      <section className="hp-section" id="magazine">
        <div className="hp-section-header">
          <div className="hp-section-title">
            <span className="hp-section-label">Editorial</span>
            <h3>Interviews</h3>
          </div>
          <Link href="/magazine/category/interviews" className="hp-section-link">All Interviews →</Link>
        </div>
        <div className="hp-mag-strip">
          {interviewStrip.map((story: any) => (
            <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
              <div className="hp-mag-card-image">
                {story.featuredImage && (
                  <Image src={story.featuredImage.node.sourceUrl} alt={story.featuredImage.node.altText || ""} fill className="object-cover" />
                )}
              </div>
              <span className="hp-mag-cat">{decodeHtml(story.categories?.nodes[0]?.name || "Culture")}</span>
              <h4 className="hp-mag-card-title">{story.title}</h4>
              <span className="hp-mag-card-meta">
                {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* ===== NEWSLETTER CTA (non-grid) ===== */}
      <section className="hp-nl-cta">
        <div className="hp-nl-cta-box">
          <div className="hp-nl-cta-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1631613638095-74b03814ac08?q=80&w=770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Culture Drop — The Moveee"
              className="hp-nl-cta-photo"
            />
            <div className="hp-nl-cta-photo-overlay" aria-hidden="true" />
          </div>
          <div className="hp-nl-cta-right">
            <div className="hp-nl-cta-tag">Culture Drop · Our Flagship Newsletter</div>
            <h3 className="hp-nl-cta-heading">The drop.<br />Every Tuesday.</h3>
            <p className="hp-nl-cta-body">
              Culture Drop is the weekly dispatch from The Moveee — one deep essay, curated picks,
              a music dispatch, and what&apos;s happening across Lagos, London, New York, and Accra.
              Written to make you think. Delivered to your inbox.
            </p>
            <HomepageNewsletterForm />
          </div>
        </div>
      </section>

      {/* ===== THE RADAR (post grid) ===== */}
      {seriesTheRadar.length > 0 && (
        <section className="hp-section" id="the-radar">
          <div className="hp-section-header">
            <div className="hp-section-title">
              <span className="hp-section-label">Series</span>
              <h3>The Radar</h3>
            </div>
            <Link href="/magazine/series/the-radar" className="hp-section-link">See All →</Link>
          </div>
          <div className="hp-mag-strip">
            {seriesTheRadar.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
                <div className="hp-mag-card-image">
                  {story.featuredImage && (
                    <Image src={story.featuredImage.node.sourceUrl} alt={story.featuredImage.node.altText || ""} fill className="object-cover" />
                  )}
                </div>
                <span className="hp-mag-cat">{decodeHtml(story.categories?.nodes[0]?.name || "Culture")}</span>
                <h4 className="hp-mag-card-title">{story.title}</h4>
                <span className="hp-mag-card-meta">
                  {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== LIFESTYLE / SHOP (non-grid) ===== */}
      <section className="hp-section" id="lifestyle">
        <div className="hp-section-header">
          <div className="hp-section-title">
            <span className="hp-section-label">Vetted Objects &amp; Editions</span>
            <h3>Lifestyle</h3>
          </div>
          <Link href="/shop" className="hp-section-link">Visit Shop →</Link>
        </div>
        <ShopCarousel products={products} />
      </section>

      {/* ===== PORTRAITS OF THE CITY (post grid) ===== */}
      {seriesPortraits.length > 0 && (
        <section className="hp-section" id="portraits-of-the-city">
          <div className="hp-section-header">
            <div className="hp-section-title">
              <span className="hp-section-label">Series</span>
              <h3>Portraits of the City</h3>
            </div>
            <Link href="/magazine/series/portraits-of-the-city" className="hp-section-link">See All →</Link>
          </div>
          <div className="hp-mag-strip">
            {seriesPortraits.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
                <div className="hp-mag-card-image">
                  {story.featuredImage && (
                    <Image src={story.featuredImage.node.sourceUrl} alt={story.featuredImage.node.altText || ""} fill className="object-cover" />
                  )}
                </div>
                <span className="hp-mag-cat">{decodeHtml(story.categories?.nodes[0]?.name || "Culture")}</span>
                <h4 className="hp-mag-card-title">{story.title}</h4>
                <span className="hp-mag-card-meta">
                  {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== CONNECT CTA (non-grid) ===== */}
      <section className="connect" id="connect">
        <div className="connect-inner">
          <div className="connect-left">
            <h3>An archive <em>alive</em>.</h3>
            <p>
              Join free as a Connect Citizen — read, post to the Pulse feed,
              get listed in the directory, and receive <em>Culture Drop</em> weekly.
              Upgrade to <em>Connect Pro</em> for the full experience.
            </p>
          </div>
          <div className="connect-right">
            <div className="perks">
              <div className="perk"><span className="n">1.</span><p><em>Connect Pro</em> badge on your Pulse posts and exclusive gated content.</p></div>
              <div className="perk"><span className="n">2.</span><p>10% off the Moveee Shop and early access to new features.</p></div>
            </div>
            <ConnectCTA />
          </div>
        </div>
      </section>

      <AdBanner slot="leaderboard-mid" className="hp-ad-leaderboard" />

      {/* ===== THE LANE (post grid) ===== */}
      {seriesTheLane.length > 0 && (
        <section className="hp-section" id="the-lane">
          <div className="hp-section-header">
            <div className="hp-section-title">
              <span className="hp-section-label">Series</span>
              <h3>The Lane</h3>
            </div>
            <Link href="/magazine/series/the-lane" className="hp-section-link">See All →</Link>
          </div>
          <div className="hp-mag-strip">
            {seriesTheLane.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
                <div className="hp-mag-card-image">
                  {story.featuredImage && (
                    <Image src={story.featuredImage.node.sourceUrl} alt={story.featuredImage.node.altText || ""} fill className="object-cover" />
                  )}
                </div>
                <span className="hp-mag-cat">{decodeHtml(story.categories?.nodes[0]?.name || "Culture")}</span>
                <h4 className="hp-mag-card-title">{story.title}</h4>
                <span className="hp-mag-card-meta">
                  {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== THINK LIKE A CREATIVE (post grid) ===== */}
      {seriesThinkCreative.length > 0 && (
        <section className="hp-section" id="think-like-a-creative">
          <div className="hp-section-header">
            <div className="hp-section-title">
              <span className="hp-section-label">Series</span>
              <h3>Think Like a Creative</h3>
            </div>
            <Link href="/magazine/series/think-like-a-creative" className="hp-section-link">See All →</Link>
          </div>
          <div className="hp-mag-strip">
            {seriesThinkCreative.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
                <div className="hp-mag-card-image">
                  {story.featuredImage && (
                    <Image src={story.featuredImage.node.sourceUrl} alt={story.featuredImage.node.altText || ""} fill className="object-cover" />
                  )}
                </div>
                <span className="hp-mag-cat">{decodeHtml(story.categories?.nodes[0]?.name || "Culture")}</span>
                <h4 className="hp-mag-card-title">{story.title}</h4>
                <span className="hp-mag-card-meta">
                  {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
