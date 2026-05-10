import Link from "next/link";
import Image from "next/image";
import { getWPData, GET_STORIES, GET_JOURNEYS, GET_DIRECTORY_ENTRIES, getEventsWithFallback, getWPQuotes } from "@/lib/wp";
import Marquee from "@/components/Marquee";
import PatronPrice from "@/components/PatronPrice";
import AdBanner from "@/components/AdBanner";
import ShopCarousel from "@/components/ShopCarousel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  let stories: any[] = [];
  let coverStory: any = null;
  let events: any[] = [];
  let origins: any[] = [];
  let products: any[] = [];
  let quotes: any[] = [];
  let pulseStories: any[] = [];
  let directoryEntries: any[] = [];

  try {
    const coverData = await getWPData(GET_STORIES, { first: 1, tag: "cover-story" }, { revalidate: 0 });
    coverStory = coverData?.posts?.nodes?.[0] || null;
  } catch (err) { console.error(err); }

  try {
    const data = await getWPData(GET_STORIES, { first: 14 }, { revalidate: 0 });
    const allStories = data?.posts?.nodes || [];
    if (!coverStory) {
      coverStory = allStories[0];
      stories = allStories.slice(1, 14);
    } else {
      stories = allStories.filter((s: any) => s.id !== coverStory.id).slice(0, 13);
    }
  } catch (err) { console.error(err); }

  try {
    events = await getEventsWithFallback(6, { revalidate: 0 });
  } catch (err) { console.error(err); }

  try {
    const originsData = await getWPData(GET_JOURNEYS, { first: 4 }, { revalidate: 0 });
    origins = originsData?.cultureJourneys?.nodes || [];
  } catch (err) { console.error("Origins fetch error:", err); }

  try {
    const productsData = await getWPData(`
      query GetProducts {
        products(first: 10) {
          nodes {
            id name slug
            image { sourceUrl }
            ... on SimpleProduct { price }
            ... on VariableProduct { price }
          }
        }
      }
    `, {});
    products = productsData?.products?.nodes || [];
  } catch (err) { console.error("Products fetch error:", err); }

  try {
    const dirData = await getWPData(GET_DIRECTORY_ENTRIES, { first: 24 }, { revalidate: 0 });
    const allDir = dirData?.cultureDirectories?.nodes || [];
    directoryEntries = allDir.sort(() => Math.random() - 0.5).slice(0, 8);
  } catch (err) { console.error("Directory fetch error:", err); }

  try {
    const quotesData = await getWPQuotes({ first: 15 });
    const allQuotes = quotesData?.cultureQuotes?.nodes || [];
    quotes = allQuotes.sort(() => Math.random() - 0.5).slice(0, 3);
  } catch (err) { console.error("Quotes fetch error:", err); }

  try {
    const WP_URL = process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com";
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/pulse-stories?per_page=4&orderby=date&order=desc&_embed=1`,
      { next: { revalidate: 0 } }
    );
    if (res.ok) pulseStories = await res.json();
  } catch (err) { console.error("Pulse fetch error:", err); }

  // Slice stories for each section
  const heroStories = stories.slice(0, 6);      // right col of hero
  const magazineStrip = stories.slice(0, 5);    // 5-col mag strip below hero

  return (
    <>
      {/* ===== HERO: STICKY COVER STORY + SCROLLING RIGHT ===== */}
      <section className="hp-hero">

        {/* LEFT: Sticky Cover Story */}
        <div className="hp-cover-col">
          <div className="hp-cover-sticky">
            {coverStory ? (
              <Link href={`/magazine/${coverStory.slug}`} className="hp-cover-link">
                <div className="hp-cover-image">
                  {coverStory.featuredImage && (
                    <Image
                      src={coverStory.featuredImage.node.sourceUrl}
                      alt={coverStory.featuredImage.node.altText || coverStory.title}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                      priority
                    />
                  )}
                  <div className="hp-cover-overlay" />
                </div>
                <div className="hp-cover-text">
                  <div className="hp-cover-kicker">
                    <span className="hp-cover-dot" />
                    Cover Story · {coverStory.categories?.nodes[0]?.name || "Culture"}
                  </div>
                  <h2 className="hp-cover-title">{coverStory.title}</h2>
                  <div
                    className="hp-cover-excerpt"
                    dangerouslySetInnerHTML={{ __html: coverStory.excerpt }}
                  />
                  <span className="hp-cover-cta">Read Feature ↗</span>
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

          {/* Latest stories grid — 2 columns */}
          <div className="hp-right-stories">
            {heroStories.map((story: any) => (
              <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-story-card">
                <div className="hp-story-thumb">
                  {story.featuredImage && (
                    <Image
                      src={story.featuredImage.node.sourceUrl}
                      alt={story.featuredImage.node.altText || ""}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="hp-story-cat">{story.categories?.nodes[0]?.name || "Culture"}</span>
                <h4 className="hp-story-title">{story.title}</h4>
                <span className="hp-story-meta">
                  {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {story.countries?.nodes[0]?.name ? ` · ${story.countries.nodes[0].name}` : ""}
                </span>
              </Link>
            ))}
          </div>

          {/* Ad slot — inside hero right column */}
          <AdBanner slot="hero-sidebar" className="hp-ad-sidebar" />

          {/* Pulse widget */}
          {pulseStories.length > 0 && (
            <div className="hp-pulse-widget">
              <div className="hp-widget-head">
                <div className="hp-widget-label">
                  <span className="hp-pulse-dot" />
                  Latest from Pulse
                </div>
                <Link href="/pulse" className="hp-widget-see-all">See all →</Link>
              </div>
              <div className="hp-pulse-list">
                {pulseStories.slice(0, 3).map((story: any) => (
                  <Link key={story.id} href={`/pulse/${story.slug}`} className="hp-pulse-item">
                    <span className="hp-pulse-title">{story.title?.rendered || story.title}</span>
                    <span className="hp-pulse-date">
                      {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Games widget */}
          <div className="hp-games-widget">
            <div className="hp-widget-head">
              <div className="hp-widget-label">Culture Games</div>
              <Link href="/games" className="hp-widget-see-all">Play now →</Link>
            </div>
            <div className="hp-games-list">
              <Link href="/games/trivia" className="hp-game-item">
                <div className="hp-game-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div>
                  <div className="hp-game-name">Culture Trivia</div>
                  <div className="hp-game-desc">Test your knowledge of African culture</div>
                </div>
              </Link>
              <Link href="/games/who-said-it" className="hp-game-item">
                <div className="hp-game-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </div>
                <div>
                  <div className="hp-game-name">Who Said It?</div>
                  <div className="hp-game-desc">Match the quote to the voice</div>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Marquee />

      {/* ===== AD: POST-HERO LEADERBOARD ===== */}
      <AdBanner slot="leaderboard-top" className="hp-ad-leaderboard" />

      {/* ===== LATEST FROM MOVEEE MAGAZINE ===== */}
      <section className="hp-section" id="magazine">
        <div className="hp-section-header">
          <div className="hp-section-title">
            <span className="hp-section-label">Editorial</span>
            <h3>Magazine</h3>
          </div>
          <Link href="/magazine" className="hp-section-link">All Stories →</Link>
        </div>
        <div className="hp-mag-strip">
          {magazineStrip.map((story: any) => (
            <Link key={story.id} href={`/magazine/${story.slug}`} className="hp-mag-card">
              <div className="hp-mag-card-image">
                {story.featuredImage && (
                  <Image
                    src={story.featuredImage.node.sourceUrl}
                    alt={story.featuredImage.node.altText || ""}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <span className="hp-mag-cat">{story.categories?.nodes[0]?.name || "Culture"}</span>
              <h4 className="hp-mag-card-title">{story.title}</h4>
              <span className="hp-mag-card-meta">
                {new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== AD: MID-PAGE LEADERBOARD ===== */}
      <AdBanner slot="leaderboard-mid" className="hp-ad-leaderboard" />

      {/* ===== HAPPENINGS ===== */}
      <section className="hp-section" id="happenings">
        <div className="hp-section-header">
          <div className="hp-section-title">
            <span className="hp-section-label">Community</span>
            <h3>Happenings</h3>
          </div>
          <Link href="/events" className="hp-section-link">Full Calendar →</Link>
        </div>

        {events.length > 0 ? (
          <div className="hp-events-monocle">
            {events.map((event: any) => {
              const d = new Date(event.eventDate || event.date);
              const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
              return (
                <Link key={event.id} href={`/events/${event.slug}`} className="hp-event-row">
                  <span className="hp-event-row-date">{dateStr}</span>
                  <h4 className="hp-event-row-title">{event.title}</h4>
                  <div
                    className="hp-event-row-excerpt"
                    dangerouslySetInnerHTML={{ __html: event.excerpt }}
                  />
                  <span className="hp-event-row-cta">RSVP ↗</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="hp-empty-state">New happenings will be announced soon.</div>
        )}
      </section>

      {/* ===== NEWSLETTER CTA ===== */}
      <section className="hp-nl-cta">
        <div className="hp-nl-cta-inner">
          <div className="hp-nl-cta-left">
            <div className="hp-nl-cta-deco" aria-hidden="true">
              <span>M</span>
            </div>
          </div>
          <div className="hp-nl-cta-right">
            <h3 className="hp-nl-cta-heading">
              Want more stories like<br />these in your inbox?
            </h3>
            <p className="hp-nl-cta-body">
              Sign up to The Moveee newsletter to stay on top of the latest in African culture,
              style, travel, and community — straight to you, every week.
            </p>
            <form className="hp-nl-cta-form" action="/newsletter" method="POST">
              <input
                type="email"
                placeholder="Enter your email address"
                aria-label="Newsletter email address"
                className="hp-nl-cta-input"
              />
              <button type="submit" className="hp-nl-cta-btn">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== MOVEEE ORIGINS ===== */}
      <section className="hp-section hp-section--origins" id="origins">
        <div className="hp-section-header">
          <div className="hp-section-title">
            <span className="hp-section-label">Writer-led Cultural Journeys</span>
            <h3>Origins</h3>
          </div>
          <Link href="/journeys" className="hp-section-link">See All →</Link>
        </div>

        {origins.length > 0 ? (
          <div className="hp-origins-carousel-wrap">
            <div className="hp-origins-track">
              {origins.map((origin: any) => (
                <Link key={origin.id} href={`/journeys/${origin.slug}`} className="hp-origin-card">
                  <div className="hp-origin-card-image">
                    {origin.featuredImage ? (
                      <Image
                        src={origin.featuredImage.node.sourceUrl}
                        alt={origin.featuredImage.node.altText || origin.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="hp-origin-card-placeholder" />
                    )}
                  </div>
                  <div className="hp-origin-card-bottom">
                    <span className="hp-origin-card-label">Moveee Origins</span>
                    <h4 className="hp-origin-card-title">{origin.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="hp-empty-state">New itineraries are being curated.</div>
        )}
      </section>

      {/* ===== LIFESTYLE (SHOP) ===== */}
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

      {/* ===== AD: PRE-QUOTES LEADERBOARD ===== */}
      <AdBanner slot="leaderboard-pre-quotes" className="hp-ad-leaderboard" />

      {/* ===== QUOTES ===== */}
      {quotes.length > 0 && (
        <section className="hp-section hp-section--dark" id="quotes">
          <div className="hp-section-header">
            <div className="hp-section-title">
              <span className="hp-section-label">Words that move</span>
              <h3>Quotes</h3>
            </div>
            <Link href="/quotes" className="hp-section-link">All Quotes →</Link>
          </div>
          <div className="hp-quotes-grid">
            {quotes.map((quote: any) => (
              <Link key={quote.id} href={`/quotes/${quote.slug}`} className="hp-quote-card">
                <div className="hp-quote-mark">&ldquo;</div>
                <blockquote
                  className="hp-quote-text"
                  dangerouslySetInnerHTML={{ __html: quote.content || quote.title }}
                />
                <div className="hp-quote-author">
                  — {quote.quoteAuthors?.nodes[0]?.name || quote.quoteSource || "Anonymous"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== DIRECTORY ===== */}
      <section className="hp-section" id="directory">
        <div className="hp-section-header">
          <div className="hp-section-title">
            <span className="hp-section-label">The Africa-wide cultural atlas</span>
            <h3>Directory</h3>
          </div>
          <div className="hp-section-links">
            <Link href="/directory/submit" className="hp-section-link">Submit an Entry →</Link>
            <Link href="/directory" className="hp-section-link">Browse All →</Link>
          </div>
        </div>

        {directoryEntries.length > 0 ? (
          <div className="hp-dir-grid">
            {directoryEntries.map((entry: any) => (
              <Link key={entry.id} href={`/directory/${entry.slug}`} className="hp-dir-card">
                <div className="hp-dir-image">
                  {entry.featuredImage ? (
                    <Image
                      src={entry.featuredImage.node.sourceUrl}
                      alt={entry.featuredImage.node.altText || entry.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="hp-dir-image-placeholder" />
                  )}
                </div>
                <div className="hp-dir-body">
                  {entry.cultureDirectoryTypes?.nodes?.[0] && (
                    <span className="hp-dir-type">
                      {entry.cultureDirectoryTypes.nodes[0].name}
                    </span>
                  )}
                  <h5 className="hp-dir-name">{entry.title}</h5>
                  <span className="hp-dir-cta">View entry ↗</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

      </section>

      {/* ===== CONNECT (MEMBERSHIP) ===== */}
      <section className="connect" id="connect">
        <div className="connect-inner">
          <div className="connect-left">
            <h3>An archive <em>alive</em>.</h3>
            <p>
              The Moveee is entirely independent. Moveee Connect is our membership tier — supporting
              our editorial independence while granting you access to the physical manifestations of
              the magazine.
            </p>
          </div>
          <div className="connect-right">
            <div className="perks">
              <div className="perk">
                <span className="n">1.</span>
                <p>The biannual physical print issue delivered worldwide.</p>
              </div>
              <div className="perk">
                <span className="n">2.</span>
                <p>Priority access and discounted tickets to <em>Moveee Events</em> and <em>Origins</em> journeys.</p>
              </div>
              <div className="perk">
                <span className="n">3.</span>
                <p>Full digital access to the entire editorial archive.</p>
              </div>
            </div>
            <div className="connect-cta">
              {isLoggedIn ? (
                <Link href="/member" className="btn-gold">Go to Dashboard <span className="arrow">→</span></Link>
              ) : (
                <>
                  <Link href="/connect" className="btn-gold">Join Now <span className="arrow">→</span></Link>
                  <div className="connect-price"><PatronPrice variant="yearly" /> (Cancel anytime)</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
