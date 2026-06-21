import Link from "next/link";
import Image from "next/image";
import { getWPData, GET_JOURNEYS } from "@/lib/wp";
import { sanitizeHtml } from "@/lib/sanitize";
import OriginHero from "./components/OriginHero";
import "@/app/origins.css";

export const revalidate = 3600;

export const metadata = {
  title: { absolute: "Origins · Curated Journeys · The Moveee" },
  description: "Curated cultural journeys around the world. Not tours. Slow, deep, culturally anchored experiences.",
};

export default async function OriginsPage() {
  let journeys: any[] = [];
  try {
    const data = await getWPData(GET_JOURNEYS, { first: 24 }, { revalidate: 3600 });
    journeys = data?.cultureJourneys?.nodes ?? [];
  } catch (error) {
    console.error("❌ Error fetching journeys:", error);
  }

  // Featured = first active, otherwise first journey. Grid shows ALL journeys.
  const featuredJourney = journeys.find(j => j.journeyStatus === "active") || journeys[0];
  const completedCount = journeys.filter(j => j.journeyStatus === "completed").length;

  const stripHtml = (html: string) => html?.replace(/<[^>]*>/g, "").trim() || "";

  return (
    <div className="origins-page">

      {/* ── HERO ── */}
      <OriginHero
        description="Slow, writer-led cultural journeys. Not tours — invitations into the places where the work is made."
      />

      <div className="ticker-wrap">
        <div className="ticker-track" aria-hidden>
          {[
            "Visual Art", "★", "Film", "★", "Literature", "★", "Music", "★",
            "Fashion", "★", "Food", "★", "Design", "★", "Craft", "★",
            "Visual Art", "★", "Film", "★", "Literature", "★", "Music", "★",
            "Fashion", "★", "Food", "★", "Design", "★", "Craft", "★",
          ].map((item, i) => (
            <span key={i} className={item === "★" ? "a" : undefined}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── MANIFESTO ── */}
      <section className="origins-manifesto">
        <div className="origins-mf-left">
          <div className="origins-sec-tag">What Origins is</div>
          <h3>This is not a tour.<br/>It&rsquo;s a <em>conversation.</em></h3>
          <p>Origins journeys are built around a single cultural anchor — an exhibition opening, a musician&rsquo;s rehearsal session, a textile market before the city wakes up.</p>
        </div>
        <div className="origins-mf-right">
          <div className="origins-sec-tag">By the numbers</div>
          <div className="origins-mf-stat-grid">
            <div className="origins-mf-stat">
              <div className="n">{completedCount || journeys.length}</div>
              <div className="d">Journeys completed</div>
            </div>
            <div className="origins-mf-stat">
              <div className="n">48</div>
              <div className="d">Travellers so far</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CURRENT / FEATURED JOURNEY ── */}
      {featuredJourney && (
        <section className="origins-current-journey">
          <div className="origins-cj-inner">
            <div className="origins-cj-img">
              {featuredJourney.featuredImage?.node?.sourceUrl ? (
                <Image
                  src={featuredJourney.featuredImage.node.sourceUrl}
                  alt={featuredJourney.title}
                  fill
                  sizes="50vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              ) : (
                <div className="origins-cj-img-placeholder" />
              )}
              <div className="origins-cj-img-grad" />
            </div>
            <div className="origins-cj-content">
              <div className="origins-cj-label">
                <span className="live">● {featuredJourney.journeyStatus === "active" ? "Now Booking" : "Upcoming"}</span>
                <span>{featuredJourney.journeyEdition || "N°01"}</span>
              </div>
              <h2 className="origins-cj-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(featuredJourney.title) }} />
              <p className="origins-cj-sub">{stripHtml(featuredJourney.excerpt || "").slice(0, 160)}</p>
              <div className="origins-cj-details">
                <div className="origins-cj-det">
                  <div className="dl">Dates</div>
                  <div className="dv">{featuredJourney.journeyDates || "TBA"}</div>
                </div>
                <div className="origins-cj-det">
                  <div className="dl">Location</div>
                  <div className="dv">{featuredJourney.journeyLocation || "TBA"}</div>
                </div>
                <div className="origins-cj-det">
                  <div className="dl">Price</div>
                  <div className="dv">{featuredJourney.journeyPrice || "TBA"}</div>
                </div>
                <div className="origins-cj-det">
                  <div className="dl">Group Size</div>
                  <div className="dv">Max 12 travellers</div>
                </div>
              </div>
              {featuredJourney.journeySpots && (
                <>
                  <div className="origins-cj-bar-label">
                    <span>Availability</span>
                    <span className="spots">{featuredJourney.journeySpots} spots remaining</span>
                  </div>
                  <div className="origins-cj-bar">
                    <div className="origins-cj-bar-fill" />
                  </div>
                </>
              )}
              <div className="origins-cj-ctas">
                <Link href={`/journeys/${featuredJourney.slug}`} className="btn-ghost-paper">View Journey →</Link>
                <Link href={`/journeys/${featuredJourney.slug}#booking`} className="btn-gold">Book now →</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── JOURNEY GRID — all journeys ── */}
      <section className="origins-journeys-section">
        <div className="origins-js-header">
          <h3>Every place we&rsquo;ve <em>been.</em></h3>
          {journeys.length > 0 && (
            <p>{journeys.length} {journeys.length === 1 ? "journey" : "journeys"} · Around the World</p>
          )}
        </div>

        {journeys.length === 0 ? (
          <p className="origins-empty">Journeys are being curated. Check back soon.</p>
        ) : (
          <div className="origins-journey-grid">
            {journeys.slice(0, 6).map((j: any) => {
              const statusClass = j.journeyStatus === "completed" ? "sold" : j.journeyStatus === "upcoming" ? "upcoming" : "open";
              const statusLabel = j.journeyStatus === "completed" ? "Completed" : j.journeyStatus === "upcoming" ? "Upcoming" : `● ${j.journeySpots || "7"} spots`;
              return (
                <Link key={j.id} href={`/journeys/${j.slug}`} className="origins-jcard">
                  <div className="origins-ji">
                    <div className={`origins-ji-status ${statusClass}`}>{statusLabel}</div>
                    <div className="origins-ji-num">{j.journeyEdition || "N°01"}</div>
                    {j.featuredImage?.node?.sourceUrl ? (
                      <Image
                        src={j.featuredImage.node.sourceUrl}
                        alt={j.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="origins-ji-placeholder" />
                    )}
                  </div>
                  <div className="origins-jcard-body">
                    <div className="origins-j-num-tag">{j.journeyEdition || "Origins"}</div>
                    <h4 dangerouslySetInnerHTML={{ __html: sanitizeHtml(j.title) }} />
                    {j.excerpt && (
                      <p className="origins-j-desc">{stripHtml(j.excerpt).slice(0, 100)}</p>
                    )}
                    <div className="origins-j-meta-row">
                      {j.journeyLocation && (
                        <div className="origins-jm">Location<strong>{j.journeyLocation}</strong></div>
                      )}
                      {j.journeyPrice && (
                        <div className="origins-jm">Price<strong>{j.journeyPrice}</strong></div>
                      )}
                    </div>
                    <span className="origins-j-cta">View journey →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="origins-how">
        <div className="origins-how-inner">
          <div className="origins-how-header">
            <div className="origins-sec-tag">The Process</div>
            <h3>How <em>Origins</em> works</h3>
            <p>From discovery to departure, we handle every detail so you can focus on the experience.</p>
          </div>
          <div className="origins-how-grid">
            {[
              { n: "01", title: "Discover & <em>Apply</em>", body: "Browse upcoming journeys and apply to join. We accept 12 travellers per journey to ensure depth and intimacy." },
              { n: "02", title: "Meet Your <em>Hosts</em>", body: "Connect with your resident hosts — local creatives, curators, and culture-makers who anchor each journey." },
              { n: "03", title: "Prepare & <em>Read</em>", body: "Receive a custom reading list and pre-trip orientation to deepen context before you arrive." },
              { n: "04", title: "Experience & <em>Connect</em>", body: "Spend 4–5 days immersed in culture with your hosts and fellow travellers. No tourism. Just genuine connection." },
            ].map((step) => (
              <div key={step.n} className="origins-how-step">
                <div className="origins-sn">{step.n}</div>
                <h4 dangerouslySetInnerHTML={{ __html: sanitizeHtml(step.title) }} />
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALWAYS INCLUDED ── */}
      <section className="origins-always-inc">
        <div className="origins-ai-header">
          <h3>What&rsquo;s always <em>included</em></h3>
          <p>Every Origins journey includes expert hosting, cultural context, and community — woven in, not bolted on.</p>
        </div>
        <div className="origins-ai-grid">
          {[
            { icon: "🏨", title: "Accommodation & <em>Meals</em>", body: "Boutique lodging and locally-sourced meals prepared by or with locals. No chain hotels." },
            { icon: "👥", title: "Resident <em>Hosts</em>", body: "Access to curators, artists, musicians, and culture-makers at the heart of the scene." },
            { icon: "🎓", title: "Context & <em>Learning</em>", body: "Pre-trip reading, daily briefings, and conversations that deepen understanding." },
            { icon: "🤝", title: "Community & <em>Connection</em>", body: "12 like-minded travellers. Relationships that last well beyond the journey." },
            { icon: "📸", title: "Documentation & <em>Memory</em>", body: "A dedicated visual journal of the journey, shared with all travellers after." },
            { icon: "✈️", title: "Ground <em>Logistics</em>", body: "All in-country transport, entry logistics, and on-the-ground coordination handled." },
          ].map((item, idx) => (
            <div key={idx} className="origins-ai-item">
              <div className="origins-ai-icon">{item.icon}</div>
              <div className="origins-ai-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.title) }} />
              <p className="origins-ai-desc">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONNECT CTA ── */}
      <section className="origins-connect-band">
        <div className="origins-cb-left">
          <div className="origins-sec-tag">Moveee</div>
          <h3>Members go <em>first.</em></h3>
          <p>Connect members get priority booking on all Origins journeys, early access 48 hours before the public, and 15% off all prices — always.</p>
          <div className="origins-cb-perks">
            {[
              { icon: "★", title: "Priority booking", desc: "48 hours early access before journeys open to the public" },
              { icon: "★", title: "15% off every journey", desc: "Applied automatically at checkout — no codes needed" },
              { icon: "★", title: "Members-only experiences", desc: "Private dinners and events not open to the public" },
            ].map((perk, idx) => (
              <div key={idx} className="origins-cb-perk">
                <div className="origins-cp-icon">{perk.icon}</div>
                <div>
                  <div className="origins-cp-title">{perk.title}</div>
                  <p className="origins-cp-desc">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="origins-cb-ctas">
            <Link href="/connect" className="btn-primary-ink">Become a Member →</Link>
            <span className="origins-cb-price">from $9 / month</span>
          </div>
        </div>
        <div className="origins-cb-right">
          <svg viewBox="0 0 400 533" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="cbGlow" cx="40%" cy="60%" r="50%">
                <stop offset="0%" stopColor="#c5491f" stopOpacity=".25"/>
                <stop offset="100%" stopColor="#0c0a07" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect width="400" height="533" fill="var(--ink)"/>
            <rect width="400" height="533" fill="url(#cbGlow)"/>
            <text x="40" y="260" fontFamily="serif" fontSize="48" fontStyle="italic" fontWeight="300" fill="rgba(243,236,224,0.12)">Origins</text>
            <text x="40" y="320" fontFamily="serif" fontSize="48" fontStyle="italic" fontWeight="300" fill="rgba(243,236,224,0.07)">Connect</text>
          </svg>
          <div className="origins-cb-float">
            <div className="origins-cb-float-tag">Moveee</div>
            <p className="origins-cb-float-text">The culture doesn&rsquo;t wait. Neither should you.</p>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="origins-newsletter">
        <div className="origins-nl-inner">
          <div className="origins-nl-left">
            <h3>Don&rsquo;t miss<br/>our next <em>journey.</em></h3>
            <p>Sign up for early access to Origins journeys, cultural dispatches, and insider announcements.</p>
          </div>
          <div className="origins-nl-form">
            <div className="origins-nl-form-label">Stay in the loop</div>
            <form method="POST" action="#">
              <input type="text" name="name" placeholder="Full name" required />
              <input type="email" name="email" placeholder="Email address" required />
              <button type="submit" className="origins-nl-submit">Notify me of new journeys</button>
            </form>
            <p className="origins-nl-note">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
