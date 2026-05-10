import Link from "next/link";
import Image from "next/image";
import Marquee from "@/components/Marquee";
import PatronPrice from "@/components/PatronPrice";
import AdBanner from "@/components/AdBanner";
import ShopCarousel from "@/components/ShopCarousel";
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
}

export default function HomepageContent({
  coverStory, stories, events, origins, products, quotes,
  pulseStories, directoryEntries, isLoggedIn, edition,
}: Props) {
  const heroStories   = stories.slice(0, 6);
  const magazineStrip = stories.slice(0, 5);
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
                {/* Text block: category → title → excerpt → meta */}
                <div className="hp-cover-text">
                  <div className="hp-cover-kicker">
                    {coverStory.categories?.nodes[0]?.name?.toUpperCase() || "CULTURE"}
                  </div>
                  <h2 className="hp-cover-title">{coverStory.title}</h2>
                  <div className="hp-cover-excerpt" dangerouslySetInnerHTML={{ __html: coverStory.excerpt }} />
                </div>

                {/* Image below text — 632 × 474 aspect ratio */}
                {coverStory.featuredImage && (
                  <div className="hp-cover-image">
                    <Image
                      src={coverStory.featuredImage.node.sourceUrl}
                      alt={coverStory.featuredImage.node.altText || coverStory.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      priority
                    />
                  </div>
                )}
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
                <span className="hp-story-cat">{story.categories?.nodes[0]?.name || "Culture"}</span>
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

      <AdBanner slot="leaderboard-top" className="hp-ad-leaderboard" />

      {/* ===== MAGAZINE ===== */}
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
                  <Image src={story.featuredImage.node.sourceUrl} alt={story.featuredImage.node.altText || ""} fill className="object-cover" />
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

      <AdBanner slot="leaderboard-mid" className="hp-ad-leaderboard" />

      {/* ===== TRINITY: HAPPENINGS · ORIGINS · DIRECTORY ===== */}
      <section className="hp-trinity">

        {/* HAPPENINGS */}
        <div className="hp-trinity-col">
          <div className="hp-trinity-head">
            <h3 className="hp-trinity-heading">Happenings</h3>
            <Link href="/events" className="hp-trinity-all">All Events →</Link>
          </div>
          {events.length > 0 ? events.slice(0, 7).map((event: any) => {
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

        {/* ORIGINS */}
        <div className="hp-trinity-col">
          <div className="hp-trinity-head">
            <h3 className="hp-trinity-heading">Origins</h3>
            <Link href="/journeys" className="hp-trinity-all">All Tours →</Link>
          </div>
          {origins.length > 0 ? origins.map((origin: any) => (
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
          )) : <p className="hp-trinity-empty">New itineraries coming soon.</p>}
        </div>

        {/* DIRECTORY */}
        <div className="hp-trinity-col">
          <div className="hp-trinity-head">
            <h3 className="hp-trinity-heading">Directory</h3>
            <Link href="/directory" className="hp-trinity-all">Browse All →</Link>
          </div>
          {directoryEntries.slice(0, 8).map((entry: any) => (
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

      {/* ===== NEWSLETTER CTA ===== */}
      <section className="hp-nl-cta">
        <div className="hp-nl-cta-inner">
          <div className="hp-nl-cta-left">
            <div className="hp-nl-cta-deco" aria-hidden="true"><span>M</span></div>
          </div>
          <div className="hp-nl-cta-right">
            <h3 className="hp-nl-cta-heading">Want more stories like<br />these in your inbox?</h3>
            <p className="hp-nl-cta-body">
              Sign up to The Moveee {editionLabel !== "Global" ? editionLabel : ""} newsletter to stay on top of the
              latest in African culture, style, travel, and community — straight to you, every week.
            </p>
            <form className="hp-nl-cta-form" action="/newsletter" method="POST">
              <input type="email" placeholder="Enter your email address" aria-label="Newsletter email address" className="hp-nl-cta-input" />
              <button type="submit" className="hp-nl-cta-btn">Subscribe</button>
            </form>
          </div>
        </div>
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
                <blockquote className="hp-quote-text" dangerouslySetInnerHTML={{ __html: quote.content || quote.title }} />
                <div className="hp-quote-author">
                  — {quote.quoteAuthors?.nodes[0]?.name || quote.quoteSource || "Anonymous"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== CONNECT (MEMBERSHIP) ===== */}
      <section className="connect" id="connect">
        <div className="connect-inner">
          <div className="connect-left">
            <h3>An archive <em>alive</em>.</h3>
            <p>
              The Moveee is entirely independent. Moveee Connect is our membership tier — supporting
              our editorial independence while granting you access to the physical manifestations of the magazine.
            </p>
          </div>
          <div className="connect-right">
            <div className="perks">
              <div className="perk"><span className="n">1.</span><p>The biannual physical print issue delivered worldwide.</p></div>
              <div className="perk"><span className="n">2.</span><p>Priority access and discounted tickets to <em>Moveee Events</em> and <em>Origins</em> journeys.</p></div>
              <div className="perk"><span className="n">3.</span><p>Full digital access to the entire editorial archive.</p></div>
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
