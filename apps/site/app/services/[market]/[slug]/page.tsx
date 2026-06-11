import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getMarket, type Section, type RateCard, type TierPackage } from "../../market-data";
import { getServicePage } from "../../service-pages";
import MarketNav from "../../components/MarketNav";
import { sanitizeHtml } from "@/lib/sanitize";

const SECTION_ICONS: Record<string, string> = {
  editorial: "◈",
  amplify: "◉",
  lifestyle: "◉",
  presskit: "◎",
  partnership: "◆",
  events: "◇",
  travel: "◎",
  connect: "⬡",
};

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
  if (!content || !marketData) return { title: { absolute: "Media Services | The Moveee" } };
  return {
    title: { absolute: `${content.headline} — ${marketData.name} | The Moveee` },
    description: content.tagline,
  };
}

function CardGrid({ cards, columns }: { cards: RateCard[]; columns?: 2 }) {
  return (
    <div className={`market-cards-grid${columns === 2 ? " market-cards-grid--two-col" : ""}`}>
      {cards.map((card) => (
        <div key={card.name} className="market-card">
          <div className="market-card-top">
            <div className="market-card-tags">
              <span className="market-card-tag">{card.tagLabel}</span>
            </div>
            <h3 className="market-card-name">{card.name}</h3>
            <p className="market-card-desc">{card.description}</p>
          </div>
          <div className="market-card-body">
            <div className="market-card-price">
              <span className="market-card-price-amount">{card.price}</span>
              {card.priceNote && (
                <span className="market-card-price-note">{card.priceNote}</span>
              )}
            </div>
            <ul className="market-card-includes">
              {card.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Enquiry — ${card.name}`)}`}
              className="btn-market-card"
            >
              Enquire →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function TierGrid({ packages }: { packages: TierPackage[] }) {
  return (
    <div className="rate-card-grid rate-card-grid--auto">
      {packages.map((pkg) => (
        <div key={pkg.name} className={`rate-card${pkg.highlight ? " rate-card--highlight" : ""}`}>
          <div className="rate-card-header">
            <h3>{pkg.name}</h3>
            <span className="rate-billing">{pkg.billingNote}</span>
          </div>
          <div className="rate-card-price">
            <span className="price-currency">{pkg.currency}</span>
            <span className="price-amount">{pkg.price}</span>
            {pkg.unit && <span className="price-unit">{pkg.unit}</span>}
          </div>
          <ul className="rate-card-features">
            {pkg.features.map((f) => {
              const isIncluded = typeof f.included === "string"
                ? !f.included.startsWith("0")
                : f.included;
              return (
                <li
                  key={f.label}
                  className={`feature-item ${isIncluded ? "feature-item--yes" : "feature-item--no"}`}
                >
                  <span className="feature-icon">{isIncluded ? "✓" : "–"}</span>
                  <span className="feature-label">
                      {typeof f.included === "string" ? `${f.label}: ${f.included}` : f.label}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="rate-card-ctas">
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Enquiry — ${pkg.name}`)}`}
              className="btn-rate-primary"
            >
              {pkg.cta}
            </a>
            {pkg.ctaSecondary && (
              <a
                href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Monthly Plan — ${pkg.name}`)}`}
                className="btn-rate-secondary"
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
      <div className="mixed-section-divider">
        <span className="mixed-section-label">
          {section.serviceLabel ?? section.service.eyebrow}
        </span>
      </div>
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
    `${content.ctaLabel ? content.ctaLabel.replace(" →", "") : "Enquiry"} — ${section.label} (${marketData.name})`
  );

  return (
    <div className="market-shell">
      <MarketNav sections={marketData.sections} mode="page" market={market} />

      <main className="market-main service-slug-page">

        {/* Breadcrumb */}
        <nav className="slug-breadcrumb" aria-label="Breadcrumb">
          <Link href="/services">Services</Link>
          <span className="slug-breadcrumb-sep">›</span>
          <Link href={`/services/${market}`}>{marketData.name}</Link>
          <span className="slug-breadcrumb-sep">›</span>
          <span>{section.label}</span>
        </nav>

        {/* Hero */}
        <section className="slug-hero">
          <p className="market-eyebrow">
            <span className="market-flag">{marketData.flag}</span> {marketData.name} · {section.label}
          </p>
          <h1
            className="slug-headline"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.headline.replace(/\*(.*?)\*/g, "<em>$1</em>")) }}
          />
          <p className="slug-tagline">{content.tagline}</p>
          <div className="slug-intro">
            {content.intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="btn-primary-service">
            {content.ctaLabel ?? "Get in touch →"}
          </a>
          {content.ctaSubtext && (
            <p className="slug-cta-subtext">{content.ctaSubtext}</p>
          )}
        </section>

        {/* How it works */}
        {content.howItWorks.length > 0 && (
          <section className="slug-how-it-works" id="how-it-works">
            <p className="section-eyebrow">How it works</p>
            <h2 className="slug-section-title">Simple process, serious results.</h2>
            <div className="how-it-works-steps">
              {content.howItWorks.map((step) => (
                <div key={step.step} className="how-step">
                  <p className="how-step-num">{step.step}</p>
                  <h3 className="how-step-title">{step.title}</h3>
                  <p className="how-step-body">{step.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {content.benefits.length > 0 && (
          <section className="slug-benefits" id="benefits">
            <p className="section-eyebrow">Why it works</p>
            <h2 className="slug-section-title">What you actually get.</h2>
            <div className="slug-benefits-grid">
              {content.benefits.map((benefit) => (
                <div key={benefit.title} className="slug-benefit">
                  <h3 className="slug-benefit-title">{benefit.title}</h3>
                  <p className="slug-benefit-body">{benefit.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing */}
        <section className="slug-pricing" id="pricing">
          <p className="section-eyebrow">Pricing</p>
          <h2 className="slug-section-title">Clear prices. No surprises.</h2>

          {/* Addon-only notice on the Content Amplification page */}
          {slug === "amplify" && (
            <div className="amplify-addon-notice">
              <span className="amplify-addon-notice-icon">◉</span>
              <p>
                <strong>Content Amplification is an add-on service.</strong> It requires an active{" "}
                <Link href={`/services/${market}/editorial`}>Sponsored Content</Link> feature or{" "}
                <Link href={`/services/${market}/partnership`}>Media Partnership</Link> package on The Moveee.
                Tiers below are priced on top of your chosen content package.
              </p>
            </div>
          )}

          <PricingSection section={section} />

          {/* Cross-sell to Content Amplification from editorial/partnership pages */}
          {"crossSellTo" in section && section.crossSellTo && (
            <div className="amplify-crosssell">
              <div className="amplify-crosssell-inner">
                <span className="amplify-crosssell-icon">◉</span>
                <div>
                  <p className="amplify-crosssell-label">Want to push this further?</p>
                  <p className="amplify-crosssell-body">
                    Add Content Amplification to your package — paid social, influencer reach, and ad placements
                    across our channels, exclusively for Moveee-published content.
                  </p>
                </div>
                <Link href={`/services/${market}/amplify`} className="amplify-crosssell-link">
                  See Content Amplification →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* FAQ */}
        {content.faqs.length > 0 && (
          <section className="slug-faq" id="faq">
            <p className="section-eyebrow">FAQ</p>
            <h2 className="slug-section-title">Common questions.</h2>
            <div className="faq-list">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="faq-item">
                  <summary className="faq-question">{faq.question}</summary>
                  <p className="faq-answer">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="slug-bottom-cta">
          <p className="section-eyebrow">Ready to start?</p>
          <h2>Let's make it happen.</h2>
          <p>
            Tell us about your brand, your goals, and your timeline. We'll come back with a clear recommendation
            within 48 hours.
          </p>
          <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="btn-primary-service">
            {content.ctaLabel ?? "Get in touch →"}
          </a>
        </section>

        {/* Other services */}
        {otherSections.length > 0 && (
          <section className="slug-other-services">
            <p className="section-eyebrow">Also available</p>
            <h2 className="slug-section-title">Explore more services.</h2>
            <div className="slug-other-grid">
              {otherSections.map((s) => (
                <Link
                  key={s.id}
                  href={`/services/${market}/${s.id}`}
                  className="slug-other-card"
                >
                  <span className="slug-other-name">{s.label}</span>
                  <span className="slug-other-arrow">→</span>
                </Link>
          ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
