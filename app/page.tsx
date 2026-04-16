import Link from "next/link";
import Image from "next/image";
import { getWPData, GET_STORIES, GET_JOURNEYS, GET_EVENTS } from "@/lib/wp";
import Marquee from "@/components/Marquee";
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

  try {
    // 1. Fetch specifically for the Cover Story tag
    const coverData = await getWPData(GET_STORIES, { first: 1, tag: "cover-story" });
    coverStory = coverData?.posts?.nodes?.[0] || null;

    // 2. Fetch latest stories (we fetch 7 to be safe in case we filter out the cover story)
    const data = await getWPData(GET_STORIES, { first: 7 });
    const allStories = data?.posts?.nodes || [];
    
    // If no specific cover story was found by tag, use the latest one as fallback
    if (!coverStory) {
      coverStory = allStories[0];
      stories = allStories.slice(1, 7);
    } else {
      // Filter out the cover story from the general list to avoid duplication
      stories = allStories.filter((s: any) => s.id !== coverStory.id).slice(0, 6);
    }
  } catch (err) {
    console.error(err);
  }

  try {
    const data = await getWPData(GET_EVENTS, { first: 3 });
    events = data?.cultureEvents?.nodes || [];
  } catch (err) {
    console.error(err);
  }

  try {
    const originsData = await getWPData(GET_JOURNEYS, { first: 4 });
    origins = originsData?.posts?.nodes || [];
  } catch (err) {
    console.error(err);
  }

  try {
    // Attempting to fetch WooCommerce Products via WPGraphQL WooCommerce (wooCommerce Extension)
    // If it fails (e.g. extension not active), it will gracefully catch and default to empty.
    const productsData = await getWPData(`
      query GetProducts {
        products(first: 4) {
          nodes {
            id
            name
            slug
            image {
              sourceUrl
            }
            ... on SimpleProduct {
              price
            }
            ... on VariableProduct {
              price
            }
          }
        }
      }
    `, {});
    products = productsData?.products?.nodes || [];
  } catch (err) {
    console.error("WooCommerce missing or products fetch failed:", err);
  }

  const magLeadStory = stories[0] || coverStory; // Lead for Mag Pillar
  const remainingStories = stories.slice(1, 5); // Right side 4 stories

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-lede">
            <h2>
              A field guide to <em>daring</em><br/>
              <span className="underline">moves</span> in culture,<br/>
              from Africa to the world.
            </h2>
            <p className="hero-standfirst">
              We documents and celebrate the most considered work in film, music, visual art, literature, design, food and fashion from Africa and its diaspora — then we take you inside it.
            </p>
            <div className="hero-cta-row">
              <Link href="#magazine" className="btn-primary">Enter the Issue <span className="arrow">→</span></Link>
              {isLoggedIn ? (
                <Link href="/member" className="btn-ghost">My Dashboard</Link>
              ) : (
                <Link href="/connect" className="btn-ghost">Become a Member</Link>
              )}
            </div>
          </div>

          <div className="hero-visual">
              <Link href={coverStory ? `/magazine/${coverStory.slug}` : '#'} className="hero-frame">
                <div className="hero-ticker">
                  <span>Frame · 01 / 05</span>
                  <span>Shot on 35mm</span>
                </div>
                
                {coverStory?.featuredImage && (
                  <Image 
                    src={coverStory.featuredImage.node.sourceUrl} 
                    alt={coverStory.featuredImage.node.altText || coverStory.title} 
                    fill 
                    className="object-cover transition-transform duration-1000 hover:scale-105"
                    priority
                  />
                )}
              </Link>
            
            {coverStory && (
              <Link href={`/magazine/${coverStory.slug}`} className="hero-caption" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                <span>Cover Story<br />{coverStory.title}</span>
                <span>↗ Read feature</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <Marquee />

      {/* ========== N°02 · MAGAZINE ========== */}
      <section className="pillar" id="magazine">
        <div className="pillar-header">
          <div className="pillar-num">N°02</div>
          <div className="pillar-title">
            <h3>Moveee <em>Magazine</em></h3>
            <p>Long-form essays, interviews and cultural commentary. The editorial heart of the platform.</p>
          </div>
          <Link href="/magazine" className="pillar-link">All Stories →</Link>
        </div>

        <div className="pillar-body">
          <div className="mag-grid">
            {magLeadStory && (
              <Link href={`/magazine/${magLeadStory.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article className="mag-lead">
                  <div className="cover">
                    {magLeadStory.featuredImage && (
                      <Image 
                        src={magLeadStory.featuredImage.node.sourceUrl} 
                        alt={magLeadStory.featuredImage.node.altText || ""} 
                        fill 
                        className="object-cover grayscale-0 hover:grayscale transition-all duration-700"
                      />
                    )}
                  </div>
                  <div className="mag-kicker">★ Featured · {magLeadStory.categories?.nodes[0]?.name || "Culture"}</div>
                  <h4>{magLeadStory.title}</h4>
                  <div 
                    className="text-sm text-ink-soft mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: magLeadStory.excerpt }}
                  />
                  <div className="mag-byline">
                    {new Date(magLeadStory.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </article>
              </Link>
            )}

            <div className="mag-list grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {remainingStories.map((story: any, idx: number) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article className="mag-item h-full">
                    <div className="mag-item-thumb">
                      {story.featuredImage && (
                        <Image 
                          src={story.featuredImage.node.sourceUrl} 
                          alt={story.featuredImage.node.altText || ""} 
                          fill 
                          className="object-cover grayscale-0 hover:grayscale transition-all duration-700"
                        />
                      )}
                    </div>
                    <div className="num">0{idx + 1}</div>
                    <h5>{story.title}</h5>
                    <div 
                      className="text-xs text-ink-soft mb-3 line-clamp-2 opacity-80"
                      dangerouslySetInnerHTML={{ __html: story.excerpt }}
                    />
                    <div className="meta">
                      {story.categories?.nodes[0]?.name || "Culture"}
                      {story.countries?.nodes[0]?.name ? ` · ${story.countries.nodes[0].name}` : ''}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== N°03 · EVENTS ========== */}
      <section className="pillar" id="events">
        <div className="pillar-header">
          <div className="pillar-num">N°03</div>
          <div className="pillar-title">
            <h3>Moveee <em>Events</em></h3>
            <p>Curated culture happenings — openings, listening sessions, film screenings and community dinners.</p>
          </div>
          <Link href="/events" className="pillar-link">Full Calendar →</Link>
        </div>

        <div className="pillar-body">
          {events.length > 0 ? (
            <div className="events-grid">
              {events.map((event: any) => {
                const targetDate = event.eventDate || event.date;
                const eventDate = new Date(targetDate);
                return (
                  <article key={event.id} className="event-card">
                    <div className="event-date">
                      <span className="day">{eventDate.getDate().toString().padStart(2, '0')}</span>
                      <span className="month">{eventDate.toLocaleDateString('en-GB', { month: 'short' })}</span>
                    </div>
                    <h4>{event.title}</h4>
                    <div className="event-meta">
                      <div dangerouslySetInnerHTML={{ __html: event.excerpt }} className="line-clamp-2" />
                    </div>
                    {/* Link to events page */}
                    <Link href={`/events`} className="event-tag">RSVP</Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-12 border border-rule/20 text-center text-ink-soft italic">
              New happenings will be announced soon.
            </div>
          )}
        </div>
      </section>

      {/* ========== N°04 · ORIGINS ========== */}
      <section className="pillar" id="origins">
        <div className="pillar-header">
          <div className="pillar-num">N°04</div>
          <div className="pillar-title">
            <h3>Moveee <em>Origins</em></h3>
            <p>Slow, writer-led cultural journeys. Not tours — invitations into the places where the work is made.</p>
          </div>
          <Link href="/origins" className="pillar-link">All Journeys →</Link>
        </div>

        <div className="pillar-body">
          <div className="origins-wrap">
            <div className="origins-intro">
              <p>Every Origins journey is designed with a resident editor — an artist, chef, writer or curator — who takes a small group (max. 12) into the rooms, studios, markets and kitchens that shape a place. No buses. No scripts. Just time.</p>
              <div className="origins-stats">
                <div className="stat">
                  <div className="num">12</div>
                  <div className="label">Cities · 2026</div>
                </div>
                <div className="stat">
                  <div className="num">38</div>
                  <div className="label">Resident hosts</div>
                </div>
                <div className="stat">
                  <div className="num">09</div>
                  <div className="label">Countries</div>
                </div>
                <div className="stat">
                  <div className="num">4.9</div>
                  <div className="label">Guest rating</div>
                </div>
              </div>
            </div>

            <div className="origins-list">
              {origins.length > 0 ? origins.map((origin: any, idx: number) => (
                <Link key={origin.id} href={`/origins/${origin.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="origin-row">
                    <div className="origin-idx">0{idx + 1}</div>
                    <div className="origin-name">{origin.title}</div>
                    <div className="origin-country">{origin.categories?.nodes[0]?.name || "Destination"}</div>
                    <div className="origin-price">
                      ↗
                      <small>View Itinerary</small>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="py-12 text-center text-ink-soft italic border-t border-rule/20">
                  New origins itineraries are being curated.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========== LIFESTYLE (shop) ========== */}
      <section className="pillar" id="lifestyle" style={{ paddingBottom: '160px' }}>
        <div className="pillar-header">
          <div className="pillar-num">N°05</div>
          <div className="pillar-title">
            <h3>Moveee <em>Shop</em></h3>
            <p>Hand-vetted objects, prints, literary editions and artifacts from creators shaping the diaspora.</p>
          </div>
          <Link href="/shop" className="pillar-link">Visit Shop →</Link>
        </div>

        <div className="pillar-body">
          {products.length > 0 ? (
            <div className="lifestyle-grid">
              {products.map((product: any) => (
                <Link key={product.id} href={`/shop/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="product">
                    <div className="product-img">
                      {product.image && (
                        <Image src={product.image.sourceUrl} alt={product.name} fill className="object-cover" />
                      )}
                      <div className="product-vetted">MOVEEE VETTED</div>
                    </div>
                    <div className="product-vendor">The Moveee Editions</div>
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">{product.price || "Price on Request"}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 border border-rule/20 text-center text-ink-soft italic">
              Our curated shop collection is launching soon.
            </div>
          )}
        </div>
      </section>

      {/* ========== CONNECT (membership) ========== */}
      <section className="connect" id="connect">
        <div className="connect-inner">
          <div className="connect-left">
            <div className="connect-num">N°06 · CONNECT</div>
            <h3>An archive <em>alive</em>.</h3>
            <p>
              The Moveee is entirely independent. Moveee Connect is our membership tier — supporting our editorial independence while granting you access to the physical manifestations of the magazine.
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
                  <div className="connect-price">$80 / year (Cancel anytime)</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
