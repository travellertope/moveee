import Link from "next/link";
import Image from "next/image";
import Marquee from "@/components/Marquee";
import PatronPrice from "@/components/PatronPrice";
import AdBanner from "@/components/AdBanner";
import { decodeHtml } from "@/lib/decode-html";
import ShopCarousel from "@/components/ShopCarousel";
import HomepageNewsletterForm from "@/components/HomepageNewsletterForm";
import type { EditionSlug } from "@/lib/editions";
import { EDITIONS } from "@/lib/editions";

interface Props {
  coverStory: any;
  stories: any[];
  events: any[];
  origins: any[];
  products: any[];
  quotes: any[];
  pulseStories: any[];
  directoryEntries: any[];
  isLoggedIn: boolean;
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
  coverStory, stories, events, origins, products, quotes,
  pulseStories, directoryEntries, isLoggedIn, edition,
  latestIssue, latestIssueStories = [], interviewStories = [],
  seriesTheRadar = [], seriesPortraits = [], seriesTheLane = [], seriesThinkCreative = [],
}: Props) {
  const heroStories   = stories.slice(0, 5);
  const interviewStrip = interviewStories.slice(0, 4);
  const editionLabel  = EDITIONS[edition].label;
  const editionPrefix = edition === "global" ? "" : `/${edition}`;

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
                  <div className="hp-cover-excerpt" dangerouslySetInnerHTML={{ __html: coverStory.excerpt }} />
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

          {pulseStories.length > 0 && (
            <div className="hp-pulse-widget">
              <div className="hp-widget-head">
                <div className="hp-widget-label"><span className="hp-pulse-dot" />Latest from Pulse</div>
                <Link href="/connect" className="hp-widget-see-all">See all →</Link>
              </div>
              <div className="hp-pulse-list">
                {pulseStories.slice(0, 6).map((story: any) => (
                  <Link key={story.id} href={`/pulse/${story.slug}`} className="hp-pulse-item">
                    <span className="hp-pulse-title" dangerouslySetInnerHTML={{ __html: story.title?.rendered || story.title }} />
                    <span className="hp-pulse-date">
                      {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

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

            {/* Right: 2×2 post grid */}
            {latestIssueStories.length > 0 && (
              <div className="hp-issue-grid">
                {latestIssueStories.slice(0, 6).map((story: any) => {
                  const img = story._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                  const cat = decodeHtml(story._embedded?.["wp:term"]?.[0]?.[0]?.name || "Culture");
                  return (
                    <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
                      <div className="hp-mag-card-image">
                        {img && <Image src={img} alt={story.title?.rendered || ""} fill className="object-cover" />}
                      </div>
                      <span className="hp-mag-cat">{cat}</span>
                      <h4 className="hp-mag-card-title">{decodeHtml(story.title?.rendered || "")}</h4>
                      <span className="hp-mag-card-meta">
                        {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== TRINITY: HAPPENINGS · ORIGINS · DIRECTORY ===== */}
      <section className="hp-trinity">

        {/* HAPPENINGS */}
        <div className="hp-trinity-col">
          <div className="hp-trinity-head">
            <h3 className="hp-trinity-heading">Happenings</h3>
            <Link href="/events" className="hp-trinity-all">All Events →</Link>
          </div>
          {events.length > 0 ? events.slice(0, 5).map((event: any) => {
            const d = new Date(event.eventDate || event.date);
            const dateMeta = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
            const loc = event.location || event.eventLocation;
            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="hp-trinity-event">
                <div className="hp-trinity-meta">
                  <span>{dateMeta}</span>
                  {loc && <><span className="hp-trinity-sep">·</span><span>{loc.toUpperCase()}</span></>}
                </div>
                <h4 className="hp-trinity-title">{event.title}</h4>
                <div className="hp-trinity-excerpt" dangerouslySetInnerHTML={{ __html: event.excerpt }} />
              </Link>
            );
          }) : <p className="hp-trinity-empty">New happenings soon.</p>}
        </div>

        {/* ORIGINS + FEATURED QUOTE */}
        <div className="hp-trinity-col hp-trinity-col--origins">
          <div className="hp-trinity-head">
            <h3 className="hp-trinity-heading">Origins</h3>
            <Link href="/journeys" className="hp-trinity-all">All Tours →</Link>
          </div>
          {origins.slice(0, 2).map((origin: any) => (
            <Link key={origin.id} href={`/journeys/${origin.slug}`} className="hp-trinity-thumb-row">
              {origin.featuredImage && (
                <div className="hp-trinity-thumb">
                  <Image src={origin.featuredImage.node.sourceUrl} alt={origin.featuredImage.node.altText || origin.title} fill className="object-cover" />
                </div>
              )}
              <div className="hp-trinity-thumb-body">
                {(origin.journeyLocation || origin.journeyDates) && (
                  <div className="hp-trinity-meta">
                    {origin.journeyLocation && <span>{origin.journeyLocation.toUpperCase()}</span>}
                    {origin.journeyLocation && origin.journeyDates && <span className="hp-trinity-sep">·</span>}
                    {origin.journeyDates && <span>{origin.journeyDates}</span>}
                  </div>
                )}
                <h4 className="hp-trinity-title">{origin.title}</h4>
                {origin.excerpt && (
                  <div className="hp-trinity-excerpt" dangerouslySetInnerHTML={{ __html: origin.excerpt }} />
                )}
              </div>
            </Link>
          ))}

          {quotes.length > 0 && (
            <div className="hp-trinity-fquote">
              <div className="hp-trinity-fquote-label">Featured Quote</div>
              <div className="hp-trinity-fquote-mark">&ldquo;</div>
              <blockquote
                className="hp-trinity-fquote-text"
                dangerouslySetInnerHTML={{ __html: quotes[0].content || quotes[0].title }}
              />
              <div className="hp-trinity-fquote-author">
                — {quotes[0].quoteAuthors?.nodes[0]?.name || quotes[0].quoteSource || "Anonymous"}
              </div>
              <Link href="/quotes" className="hp-trinity-fquote-link">All Quotes →</Link>
            </div>
          )}
        </div>

        {/* DIRECTORY */}
        <div className="hp-trinity-col">
          <div className="hp-trinity-head">
            <h3 className="hp-trinity-heading">Directory</h3>
            <Link href="/directory" className="hp-trinity-all">Browse All →</Link>
          </div>
          {directoryEntries.slice(0, 5).map((entry: any) => (
            <Link key={entry.id} href={`/directory/${entry.slug}`} className="hp-trinity-thumb-row">
              {entry.featuredImage ? (
                <div className="hp-trinity-thumb">
                  <Image src={entry.featuredImage.node.sourceUrl} alt={entry.featuredImage.node.altText || entry.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="hp-trinity-thumb hp-trinity-thumb--placeholder" />
              )}
              <div className="hp-trinity-thumb-body">
                {entry.cultureDirectoryTypes?.nodes?.[0] && (
                  <div className="hp-trinity-type">{entry.cultureDirectoryTypes.nodes[0].name.toUpperCase()}</div>
                )}
                <h4 className="hp-trinity-title">{entry.title}</h4>
                {entry.excerpt && (
                  <div className="hp-trinity-excerpt" dangerouslySetInnerHTML={{ __html: entry.excerpt }} />
                )}
              </div>
            </Link>
          ))}
        </div>

      </section>

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
            <div className="hp-nl-cta-deco" aria-hidden="true"><span>G</span></div>
          </div>
          <div className="hp-nl-cta-right">
            <div className="hp-nl-cta-tag">GetMeLit · Our Flagship Newsletter</div>
            <h3 className="hp-nl-cta-heading">Stay lit.<br />Every Thursday.</h3>
            <p className="hp-nl-cta-body">
              GetMeLit is the weekly culture briefing from The Moveee — the stories, art, music,
              and ideas moving the African diaspora forward, curated by our editors and delivered
              straight to your inbox. No noise. Just the good stuff.
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
            <div className="connect-cta">
              {isLoggedIn ? (
                <Link href="/member" className="btn-gold">Go to Dashboard <span className="arrow">→</span></Link>
              ) : (
                <>
                  <Link href="/connect/membership" className="btn-gold">View Membership <span className="arrow">→</span></Link>
                  <div className="connect-price"><PatronPrice variant="yearly" /> (Cancel anytime)</div>
                </>
              )}
            </div>
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
