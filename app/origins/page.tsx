import Link from "next/link";
import Image from "next/image";
import { getWPData, GET_JOURNEYS } from "@/lib/wp";
import OriginHero from "./components/OriginHero";
import "@/app/origins.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Origins · Curated Journeys · The Moveee",
  description: "Curated cultural journeys across Africa and the diaspora. Not tours. Slow, deep, culturally anchored experiences.",
};

export default async function OriginsPage() {
  let journeys: any[] = [];
  try {
    const data = await getWPData(GET_JOURNEYS, { first: 24 });
    journeys = data?.cultureJourneys?.nodes ?? [];
  } catch { /* CMS unreachable */ }

  const currentJourney = journeys.find(j => j.journeyMeta?.journeyStatus === 'active') || journeys[0];
  const otherJourneys = currentJourney ? journeys.filter(j => j.id !== currentJourney.id) : journeys;

  return (
    <div className="origins-page bg-paper">
      {/* ── HERO ── */}
      <OriginHero
        title="Origins · <em>Curated Journeys</em>"
        standfirst="Not tours. Slow, deep, culturally anchored journeys to the places African and Black diasporan culture is actually being made."
      />

      {/* ── MANIFESTO ── */}
      <section className="origins-manifesto">
        <div className="origins-mf-left">
          <div className="sec-tag">What Origins is</div>
          <h3>This is not a tour.<br/>It's a <em>conversation.</em></h3>
          <p>Origins journeys are built around a single cultural anchor — an exhibition opening, a musician's rehearsal session, a textile market before the city wakes up.</p>
        </div>
        <div className="origins-mf-right">
          <div className="sec-tag">By the numbers</div>
          <div className="origins-mf-stat-grid">
            <div className="origins-mf-stat"><div className="n">{journeys.filter(j => j.journeyMeta?.journeyStatus === 'completed').length}</div><div className="d">Journeys completed</div></div>
            <div className="origins-mf-stat"><div className="n">48</div><div className="d">Travellers so far</div></div>
          </div>
        </div>
      </section>

      {/* ── CURRENT JOURNEY FEATURE ── */}
      {currentJourney && (
        <section className="origins-current-journey">
          <div className="origins-cj-inner">
            <div className="origins-cj-img">
              {currentJourney.featuredImage?.node?.sourceUrl ? (
                <Image
                  src={currentJourney.featuredImage.node.sourceUrl}
                  alt={currentJourney.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              ) : (
                <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                  <rect width="800" height="600" fill="var(--ink)"/>
                </svg>
              )}
              <div className="origins-cj-img-grad"></div>
            </div>
            <div className="origins-cj-content">
              <div className="origins-cj-label">
                <span className="live">● Live</span>
                <span>{currentJourney.journeyMeta?.journeyEdition || 'Current'}</span>
              </div>
              <h2 className="origins-cj-title" dangerouslySetInnerHTML={{ __html: currentJourney.title }} />
              <p className="origins-cj-sub">{currentJourney.excerpt}</p>
              <div className="origins-cj-details">
                <div className="origins-cj-det">
                  <div className="dl">Dates</div>
                  <div className="dv">{currentJourney.journeyMeta?.journeyDates || 'TBA'}</div>
                </div>
                <div className="origins-cj-det">
                  <div className="dl">Location</div>
                  <div className="dv">{currentJourney.journeyMeta?.journeyLocation || 'TBA'}</div>
                </div>
                <div className="origins-cj-det">
                  <div className="dl">Price</div>
                  <div className="dv">{currentJourney.journeyMeta?.journeyPrice || 'TBA'}</div>
                </div>
                <div className="origins-cj-det">
                  <div className="dl">Group Size</div>
                  <div className="dv">Max 12 travellers</div>
                </div>
              </div>
              <div className="origins-cj-bar-label">
                <span>Availability</span>
                <span className="spots">{currentJourney.journeyMeta?.journeySpots || '7'} spots remaining</span>
              </div>
              <div className="origins-cj-bar">
                <div className="origins-cj-bar-fill"></div>
              </div>
              <div className="origins-cj-ctas">
                <button className="btn-ghost">See all journeys</button>
                <button className="btn-gold">Book now →</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── JOURNEY GRID ── */}
      <section className="origins-journeys-section">
        <div className="origins-js-header">
          <h3>Every place we've <em>been.</em></h3>
        </div>
        {otherJourneys.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--mute)', marginTop: '60px' }}>
            More journeys coming soon.
          </p>
        ) : (
          <div className="origins-journey-grid">
            {otherJourneys.slice(0, 6).map((j: any) => (
              <Link key={j.id} href={`/origins/${j.slug}`} className="origins-jcard">
                <div className="origins-jcard-container">
                  <div className="ji">
                    <div className={`ji-status ${j.journeyMeta?.journeyStatus === 'completed' ? 'sold' : j.journeyMeta?.journeyStatus === 'upcoming' ? 'upcoming' : 'open'}`}>
                      ● {j.journeyMeta?.journeyStatus === 'completed' ? 'Completed' : j.journeyMeta?.journeyStatus === 'upcoming' ? 'Upcoming' : j.journeyMeta?.journeySpots || '7'} spots
                    </div>
                    <div className="ji-num">{j.journeyMeta?.journeyEdition || 'N°01'}</div>
                    {j.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={j.featuredImage.node.sourceUrl}
                        alt={j.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        <rect width="400" height="500" fill="var(--ink)"/>
                      </svg>
                    )}
                  </div>
                  <div className="j-num-tag">{j.journeyMeta?.journeyEdition || 'Origins'}</div>
                  <h4 dangerouslySetInnerHTML={{ __html: j.title }} />
                  {j.excerpt && <p className="j-desc">{j.excerpt.replace(/<[^>]*>/g, '').slice(0, 100)}</p>}
                  <div className="j-meta-row">
                    <div className="jm">Location<strong>{j.journeyMeta?.journeyLocation || 'TBA'}</strong></div>
                    <div className="jm">Price<strong>{j.journeyMeta?.journeyPrice || 'TBA'}</strong></div>
                  </div>
                  <span className="j-cta">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="origins-how">
        <div className="origins-how-inner">
          <div className="origins-how-header">
            <div className="sec-tag">The Process</div>
            <h3>How <em>Origins</em> works</h3>
            <p>From discovery to departure, we handle every detail so you can focus on the experience.</p>
          </div>
          <div className="origins-how-grid">
            <div className="origins-how-step">
              <div className="sn">01</div>
              <h4>Discover &<br/><em>Apply</em></h4>
              <p>Browse upcoming journeys and apply to join. We accept 12 travellers per journey to ensure depth and intimacy.</p>
            </div>
            <div className="origins-how-step">
              <div className="sn">02</div>
              <h4>Meet Your<br/><em>Hosts</em></h4>
              <p>Connect with your resident hosts — local creatives, curators, and culture-makers who anchor each journey.</p>
            </div>
            <div className="origins-how-step">
              <div className="sn">03</div>
              <h4>Prepare &<br/><em>Read</em></h4>
              <p>Receive a custom reading list and pre-trip orientation to deepen context before you arrive.</p>
            </div>
            <div className="origins-how-step">
              <div className="sn">04</div>
              <h4>Experience &<br/><em>Connect</em></h4>
              <p>Spend 4–5 days immersed in culture with your hosts and fellow travellers. No tourism. Just genuine connection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALWAYS INCLUDED ── */}
      <section className="origins-always-inc">
        <div className="origins-ai-header">
          <h3>What's always <em>included</em></h3>
          <p>Every Origins journey includes expert hosting, cultural context, and community. Here's what you get.</p>
        </div>
        <div className="origins-ai-grid">
          <div className="origins-ai-item">
            <div className="origins-ai-icon">🏨</div>
            <div className="origins-ai-title">Accommodation &<br/><em>Meals</em></div>
            <p className="origins-ai-desc">Boutique lodging and locally-sourced meals prepared by or with locals. No chain hotels.</p>
          </div>
          <div className="origins-ai-item">
            <div className="origins-ai-icon">👥</div>
            <div className="origins-ai-title">Resident<br/><em>Hosts</em></div>
            <p className="origins-ai-desc">Access to curators, artists, musicians, and culture-makers at the heart of the scene.</p>
          </div>
          <div className="origins-ai-item">
            <div className="origins-ai-icon">🎓</div>
            <div className="origins-ai-title">Context &<br/><em>Learning</em></div>
            <p className="origins-ai-desc">Pre-trip reading, daily briefings, and conversations that deepen understanding.</p>
          </div>
        </div>
      </section>

      {/* ── CONNECT CTA ── */}
      <section className="origins-connect-band">
        <div className="origins-cb-left">
          <div className="sec-tag">Moveee Connect</div>
          <h3>Members go <em>first.</em></h3>
          <p>Connect members get priority booking, early access to journeys, and 15% off all prices.</p>
          <div className="origins-cb-perks">
            <div className="origins-cb-perk">
              <div className="cp-icon">★</div>
              <div>
                <div className="cp-title">Early access</div>
                <p className="cp-desc">Book journeys 48 hours before they open to the public</p>
              </div>
            </div>
            <div className="origins-cb-perk">
              <div className="cp-icon">★</div>
              <div>
                <div className="cp-title">15% discount</div>
                <p className="cp-desc">On all journey prices, always</p>
              </div>
            </div>
            <div className="origins-cb-perk">
              <div className="cp-icon">★</div>
              <div>
                <div className="cp-title">Priority support</div>
                <p className="cp-desc">Direct access to our team for custom travel planning</p>
              </div>
            </div>
          </div>
        </div>
        <div className="origins-cb-right">
          <svg viewBox="0 0 400 533" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="533" fill="var(--ink)"/>
          </svg>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="origins-newsletter">
        <div className="origins-nl-inner">
          <div className="origins-nl-left">
            <h3>Don't miss<br/>our next <em>journey.</em></h3>
            <p>Sign up for news about upcoming Origins experiences, cultural essays, and early access to bookings.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
