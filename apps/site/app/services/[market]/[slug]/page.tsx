import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getMarket, type Section, type RateCard, type TierPackage } from "../../market-data";
import { getServicePage } from "../../service-pages";
import { sanitizeHtml } from "@/lib/sanitize";

const VALID_MARKETS = ["africa", "uk", "us"];

export function generateStaticParams() {
  const params: { market: string; slug: string }[] = [];
  for (const market of VALID_MARKETS) {
    const data = getMarket(market);
    if (!data) continue;
    for (const section of data.sections) {
      params.push({ market, slug: section.id });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; slug: string }>;
}): Promise<Metadata> {
  const { market, slug } = await params;
  const content = getServicePage(market, slug);
  const marketData = getMarket(market);
  if (!content || !marketData) return { title: { absolute: "Media Services | Moveee" } };
  return {
    title: { absolute: `${content.headline} | Moveee` },
    description: content.tagline,
  };
}

function CardGrid({ cards, columns }: { cards: RateCard[]; columns?: 2 }) {
  return (
    <div className={`svc-fgrid ${columns === 2 ? "svc-fgrid--2" : "svc-fgrid--auto"}`}>
      {cards.map((card) => (
        <div key={card.name} className="svc-price-card">
          <div className="svc-price-top">
            <h3>{card.name}</h3>
            <span className={`svc-tag${card.featured ? " svc-tag--ochre" : ""}`}>
              {card.featured ? card.featuredBadge ?? "Featured" : card.tagLabel}
            </span>
          </div>
          <p className="svc-price-desc">{card.description}</p>
          <div className="svc-price-row">
            <span className="svc-price-amount">{card.price}</span>
            {card.priceNote && <span className="svc-price-note">{card.priceNote}</span>}
          </div>
          <ul className="svc-price-includes">
            {card.includes.map((item) => (
              <li key={item}><span className="svc-check">✓</span>{item}</li>
            ))}
          </ul>
          <a
            href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Enquiry — ${card.name}`)}`}
            className="svc-btn-primary svc-price-cta"
          >
            Enquire →
          </a>
        </div>
      ))}
    </div>
  );
}

function TierGrid({ packages }: { packages: TierPackage[] }) {
  return (
    <div className="svc-fgrid svc-fgrid--auto">
      {packages.map((pkg) => (
        <div key={pkg.name} className={`svc-price-card${pkg.highlight ? " svc-price-card--tint" : ""}`}>
          <div className="svc-price-top">
            <h3>{pkg.name}</h3>
            {pkg.highlight && (
              <span className="svc-tag svc-tag--ochre">{pkg.featuredBadge ?? "Most popular"}</span>
            )}
          </div>
          <div className="svc-price-row">
            <span className="svc-price-amount">{pkg.currency}{pkg.price}</span>
            {pkg.unit && <span className="svc-price-unit">{pkg.unit}</span>}
          </div>
          <ul className="svc-price-includes">
            {pkg.features.map((f) => {
              const isIncluded = typeof f.included === "string"
                ? !f.included.startsWith("0")
                : f.included;
              return (
                <li key={f.label}>
                  <span className={`svc-check${isIncluded ? "" : " svc-check--no"}`}>{isIncluded ? "✓" : "–"}</span>
                  {typeof f.included === "string" ? `${f.label}: ${f.included}` : f.label}
                </li>
              );
            })}
          </ul>
          <div className="svc-price-ctas">
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Enquiry — ${pkg.name}`)}`}
              className="svc-btn-primary svc-price-cta"
            >
              {pkg.cta}
            </a>
            {pkg.ctaSecondary && (
              <a
                href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Monthly Plan — ${pkg.name}`)}`}
                className="svc-btn-ghost svc-price-cta-secondary"
              >
                {pkg.ctaSecondary}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingSection({ section }: { section: Section }) {
  if (section.kind === "cards") {
    return <CardGrid cards={section.cards} columns={section.columns} />;
  }
  if (section.kind === "tiers") {
    return <TierGrid packages={section.service.packages} />;
  }
  return (
    <>
      <CardGrid cards={section.cards} />
      <p className="svc-addons-label" style={{ marginTop: 40 }}>
        {section.serviceLabel ?? section.service.eyebrow}
      </p>
      <TierGrid packages={section.service.packages} />
    </>
  );
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ market: string; slug: string }>;
}) {
  const { market, slug } = await params;

  if (!VALID_MARKETS.includes(market)) redirect("/services");

  const marketData = getMarket(market);
  if (!marketData) redirect("/services");

  const section = marketData.sections.find((s) => s.id === slug);
  if (!section) notFound();

  const content = getServicePage(market, slug);
  if (!content) notFound();

  const otherSections = marketData.sections.filter((s) => s.id !== slug);

  const emailSubject = encodeURIComponent(
    `${content.ctaLabel ? content.ctaLabel.replace(" →", "") : "Enquiry"} — ${section.label}`
  );

  return (
    <div className="svc-page">
      <main>

        {/* Breadcrumb */}
        <div className="svc-wrap svc-crumb">
          <Link href="/services">Services</Link>
          <span className="svc-crumb-sep">/</span>
          <span className="svc-crumb-current">{section.label}</span>
        </div>

        {/* Hero */}
        <section className="svc-wrap svc-detail-hero">
          <div className="svc-detail-hero-main">
            <h1
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.headline.replace(/\*(.*?)\*/g, "<em>$1</em>")) }}
            />
            <p className="svc-detail-tagline">{content.tagline}</p>
            <div className="svc-hero-ctas">
              <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="svc-btn-primary">
                {content.ctaLabel ?? "Get in touch →"}
              </a>
              {content.ctaSubtext && <span className="svc-cta-subtext">{content.ctaSubtext}</span>}
            </div>
          </div>
          <div className="svc-detail-hero-side">
            {content.intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* How it works */}
        {content.howItWorks.length > 0 && (
          <section className="svc-wrap svc-section" id="how-it-works">
            <div className="svc-section-head">
              <h2 className="svc-section-title">A simple process, start to finish.</h2>
            </div>
            <div className="svc-steps">
              {content.howItWorks.map((step) => (
                <div key={step.step} className="svc-step">
                  <span className="svc-step-num">{step.step}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {content.benefits.length > 0 && (
          <section className="svc-section svc-section--tint" id="benefits">
            <div className="svc-wrap">
              <div className="svc-section-head">
                <h2 className="svc-section-title">What you actually get.</h2>
              </div>
              <div className="svc-fgrid svc-fgrid--2">
                {content.benefits.map((benefit) => (
                  <div key={benefit.title} className="svc-cell">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing */}
        <section className="svc-wrap svc-section" id="pricing">
          <div className="svc-section-head">
            <h2 className="svc-section-title">Clear pricing. No surprises.</h2>
          </div>

          {slug === "amplify" && (
            <div className="svc-notice">
              <strong>Content Amplification is an add-on service.</strong> It requires an active{" "}
              <Link href={`/services/${market}/editorial`}>Sponsored Content</Link> feature or{" "}
              <Link href={`/services/${market}/partnership`}>Media Partnership</Link> package on The Moveee.
              Tiers below are priced on top of your chosen content package.
            </div>
          )}

          <PricingSection section={section} />

          {"crossSellTo" in section && section.crossSellTo && (
            <div className="svc-crosssell">
              <div>
                <p className="svc-crosssell-label">Want to push this further?</p>
                <p className="svc-crosssell-body">
                  Add Content Amplification to your package — paid social, influencer reach, and ad placements
                  across our channels, exclusively for Moveee-published content.
                </p>
              </div>
              <Link href={`/services/${market}/amplify`} className="svc-crosssell-link">
                See Content Amplification →
              </Link>
            </div>
          )}
        </section>

        {/* FAQ */}
        {content.faqs.length > 0 && (
          <section className="svc-wrap svc-section" id="faq">
            <div className="svc-section-head">
              <h2 className="svc-section-title">Common questions.</h2>
            </div>
            <div className="svc-faq-list">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="svc-faq-item">
                  <summary>
                    {faq.question}
                    <span className="svc-faq-toggle" aria-hidden="true">+</span>
                  </summary>
                  <p className="svc-faq-answer">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="svc-wrap svc-section">
          <div className="svc-cta-inner">
            <div className="svc-cta-glow" />
            <div className="svc-cta-text">
              <h2>Let&rsquo;s make it happen.</h2>
              <p>
                Tell us about your brand, your goals, and your timeline. We&rsquo;ll come back with a clear recommendation
                within 48 hours.
              </p>
            </div>
            <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="svc-cta-btn">
              {content.ctaLabel ?? "Get in touch →"}
            </a>
          </div>
        </section>

        {/* Other services */}
        {otherSections.length > 0 && (
          <section className="svc-wrap svc-section" style={{ paddingTop: 0 }}>
            <div className="svc-section-head">
              <h2 className="svc-section-title">Explore more services.</h2>
            </div>
            <div className="svc-fgrid svc-fgrid-row svc-related">
              {otherSections.map((s) => (
                <Link key={s.id} href={`/services/${market}/${s.id}`}>
                  <span>{s.label}</span>
                  <span>→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <div className="svc-wrap svc-foot">
        <span className="svc-foot-brand">The Moveee</span>
        <span className="svc-foot-note">Media services</span>
      </div>
    </div>
  );
}
