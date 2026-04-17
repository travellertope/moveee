import { getWPData, GET_JOURNEY_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "@/app/origins.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let journey: any = null;
  try {
    const data = await getWPData(GET_JOURNEY_BY_SLUG, { slug });
    journey = data?.cultureJourney ?? null;
  } catch { /* CMS unreachable */ }

  if (!journey) {
    return {
      title: "Journey Not Found | The Moveee",
      description: "This journey could not be found.",
    };
  }

  const excerpt = journey.excerpt?.replace(/<[^>]*>/g, "") || "Explore a curated cultural journey with Origins.";
  const title = `${journey.title} · Origins · The Moveee`;
  const images = journey.featuredImage?.node?.sourceUrl
    ? [{ url: journey.featuredImage.node.sourceUrl, width: 1200, height: 630 }]
    : [];

  return {
    title,
    description: excerpt,
    openGraph: {
      title,
      description: excerpt,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: excerpt,
      images,
    },
  };
}

export default async function JourneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let journey: any = null;
  try {
    const data = await getWPData(GET_JOURNEY_BY_SLUG, { slug });
    journey = data?.cultureJourney ?? null;
  } catch { /* CMS unreachable */ }

  if (!journey) notFound();

  const dates = journey.journeyDates || "TBA";
  const location = journey.journeyLocation || "TBA";
  const price = journey.journeyPrice || "TBA";
  const spots = journey.journeySpots || "7";
  const itinerary = journey.journeyItinerary || [];
  const hosts = journey.journeyHosts || [];
  const inclusions = journey.journeyInclusions || "";
  const exclusions = journey.journeyExclusions || "";

  return (
    <div className="journey-page bg-paper">
      {/* ── HERO ── */}
      <section className="journey-hero">
        <svg viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="jHeroBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c0a07"/>
              <stop offset="50%" stopColor="#1a0f08"/>
              <stop offset="100%" stopColor="#2a1a0a"/>
            </linearGradient>
            <radialGradient id="jHeroGlow1" cx="20%" cy="70%" r="45%">
              <stop offset="0%" stopColor="#c5491f" stopOpacity=".22"/>
              <stop offset="100%" stopColor="#0c0a07" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="jHeroGlow2" cx="75%" cy="25%" r="35%">
              <stop offset="0%" stopColor="#b38238" stopOpacity=".24"/>
              <stop offset="100%" stopColor="#0c0a07" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#jHeroBg)"/>
          <rect width="1440" height="900" fill="url(#jHeroGlow1)"/>
          <rect width="1440" height="900" fill="url(#jHeroGlow2)"/>
        </svg>
        <div className="journey-hero-grad"></div>
        <div className="journey-hero-content">
          <div className="journey-hero-eyebrow">
            <span>★ Origins</span>
            <span className="sep">·</span>
            <span>Curated Cultural Journey</span>
          </div>
          <h1 className="journey-hero-title" dangerouslySetInnerHTML={{ __html: journey.title }} />
          <p className="journey-hero-sub">{journey.excerpt?.replace(/<[^>]*>/g, "") || "A culturally anchored journey through Africa and the diaspora."}</p>
          <div className="journey-hero-row">
            <div className="journey-hero-ctas">
              <button className="btn-ghost">Back to Origins</button>
              <button className="btn-gold">Book this journey →</button>
            </div>
          </div>
          <div className="journey-scroll-hint">Scroll</div>
        </div>
      </section>

      {/* ── INTRO STRIP ── */}
      <section className="journey-intro">
        <div className="journey-intro-left">
          <h3>Experience <em>deep culture</em></h3>
          <p>{journey.content || "This journey is built around cultural anchors — not typical tourist sites. Expect to be part of the story, not outside it."}</p>
        </div>
        <div className="journey-intro-right">
          <div className="journey-intro-stat-grid">
            <div className="journey-intro-stat"><div className="num">{dates}</div><div className="desc">Dates</div></div>
            <div className="journey-intro-stat"><div className="num">12</div><div className="desc">Travellers max</div></div>
            <div className="journey-intro-stat"><div className="num">{location}</div><div className="desc">Location</div></div>
            <div className="journey-intro-stat"><div className="num">{price}</div><div className="desc">Price</div></div>
          </div>
        </div>
      </section>

      {/* ── ITINERARY ── */}
      {itinerary.length > 0 && (
        <section className="journey-itinerary">
          <div className="journey-itin-header">
            <h3>Your <em>itinerary</em></h3>
            <p>A day-by-day guide to your immersion in culture.</p>
          </div>
          <div className="journey-itinerary-content">
            {itinerary.map((day: any, idx: number) => (
              <div key={idx} className="journey-day-block">
                <div className="journey-day-num-col">
                  <div className="journey-day-tag">Day {day.dayNumber || idx + 1}</div>
                  <div className="journey-day-num">{day.dayNumber || idx + 1}</div>
                  {day.dayLocation && <div className="journey-day-name">{day.dayLocation}</div>}
                </div>
                <div className="journey-day-content">
                  <h4 className="journey-day-title" dangerouslySetInnerHTML={{ __html: day.dayTitle || `Day ${day.dayNumber || idx + 1}` }} />
                  {day.dayLocation && <div className="journey-day-location">{day.dayLocation}</div>}
                  {day.dayDescription && <p className="journey-day-desc">{day.dayDescription}</p>}
                  {day.activities && day.activities.length > 0 && (
                    <div className="journey-activity-list">
                      {day.activities.map((activity: any, aIdx: number) => (
                        <div key={aIdx} className="journey-activity">
                          <div className="journey-act-time">{activity.activityTime || '09:00'}</div>
                          <div className="journey-act-body">
                            <div className="journey-act-title">{activity.activityTitle}</div>
                            {activity.activityDescription && <p className="journey-act-desc">{activity.activityDescription}</p>}
                            {activity.activityType && (
                              <span className={`journey-act-tag journey-act-tag-${activity.activityType}`}>
                                {activity.activityType}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HOSTS ── */}
      {hosts.length > 0 && (
        <section className="journey-hosts">
          <div className="journey-hosts-inner">
            <h3 style={{ marginBottom: '50px' }}>Meet your <em>hosts</em></h3>
            <div className="journey-hosts-grid">
              {hosts.map((host: any, idx: number) => (
                <div key={idx} className="journey-host-card">
                  <div className="journey-host-avatar">
                    {host.hostImage?.sourceUrl ? (
                      <Image src={host.hostImage.sourceUrl} alt={host.hostName} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        <rect width="90" height="90" fill="var(--ink)"/>
                      </svg>
                    )}
                  </div>
                  <div className="journey-host-role">{host.hostRole || 'Host'}</div>
                  <h4 className="journey-host-name">{host.hostName}</h4>
                  <p className="journey-host-desc">{host.hostBio || 'Cultural guide and local expert.'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT'S INCLUDED ── */}
      <section className="journey-included">
        <h3 style={{ marginBottom: '50px' }}>What's <em>included</em></h3>
        <div className="journey-included-grid">
          <div className="journey-inc-item">
            <div className="journey-inc-icon">🏨</div>
            <div className="journey-inc-title">Accommodation &<br/><em>Meals</em></div>
            <p className="journey-inc-desc">Boutique lodging and locally-sourced meals. No chains.</p>
          </div>
          <div className="journey-inc-item">
            <div className="journey-inc-icon">👥</div>
            <div className="journey-inc-title">Curated<br/><em>Experiences</em></div>
            <p className="journey-inc-desc">Access to artists, makers, and culture-keepers.</p>
          </div>
          <div className="journey-inc-item">
            <div className="journey-inc-icon">🎓</div>
            <div className="journey-inc-title">Learning &<br/><em>Context</em></div>
            <p className="journey-inc-desc">Pre-trip prep, daily briefings, and expert guides.</p>
          </div>
        </div>
        {exclusions && (
          <div className="journey-not-included">
            <p><strong>Not included:</strong> {exclusions}</p>
          </div>
        )}
      </section>

      {/* ── BOOKING PANEL ── */}
      <section className="journey-booking">
        <div className="journey-booking-inner">
          <div className="journey-booking-left">
            <h3>Ready to <em>book?</em></h3>
            <p>Secure your spot on this journey. Our team will confirm your details and send you pre-trip prep materials.</p>
            <div className="journey-booking-detail-row">
              <div className="journey-bd-item">
                <div className="journey-bd-label">Dates</div>
                <div className="journey-bd-val">{dates}</div>
              </div>
              <div className="journey-bd-item">
                <div className="journey-bd-label">Location</div>
                <div className="journey-bd-val">{location}</div>
              </div>
            </div>
            <div className="journey-booking-detail-row">
              <div className="journey-bd-item">
                <div className="journey-bd-label">Price per person</div>
                <div className="journey-bd-val">{price}</div>
              </div>
              <div className="journey-bd-item">
                <div className="journey-bd-label">Group size</div>
                <div className="journey-bd-val">Max 12 travellers</div>
              </div>
            </div>
            <div className="journey-capacity-row">
              <span>Availability</span>
              <span className="journey-spots">{spots} spots remaining</span>
            </div>
            <div className="journey-bar-track">
              <div className="journey-bar-fill"></div>
            </div>
          </div>
          <div className="journey-booking-card">
            <div className="journey-bc-label">Reserve your spot</div>
            <div className="journey-bc-price">
              <div className="journey-amount">{price}</div>
              <div className="journey-per">per traveller</div>
              <div className="journey-member-note">Connect members: 15% off</div>
            </div>
            <div className="journey-bc-divider"></div>
            <form className="journey-bc-form">
              <input type="text" placeholder="Full name" required />
              <input type="email" placeholder="Email address" required />
              <input type="tel" placeholder="Phone number" required />
              <select required>
                <option>How did you hear about us?</option>
                <option>Instagram</option>
                <option>Friend / Referral</option>
                <option>Email newsletter</option>
                <option>The Moveee website</option>
              </select>
              <textarea placeholder="Tell us why you want to join this journey..." rows={4}></textarea>
              <button type="submit" className="journey-bc-submit">Submit Application</button>
            </form>
            <p className="journey-bc-small">We'll review your application and be in touch within 48 hours.</p>
          </div>
        </div>
      </section>

      {/* ── BACK LINK ── */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '60px 80px', textAlign: 'center' }}>
        <Link href="/origins" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
          ← Back to all Origins journeys
        </Link>
      </div>
    </div>
  );
}
