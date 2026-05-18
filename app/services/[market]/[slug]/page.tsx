import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getMarket, MARKETS, CONNECT_BAR, type Section, type RateCard, type TierPackage } from "../../market-data";
import { getServicePage } from "../../service-pages";
import MarketNav from "../../components/MarketNav";

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
  if (!content || !marketData) return { title: "Services | The Moveee" };
  return {
    title: `${content.headline} | ${marketData.name} | The Moveee`,
    description: content.tagline,
  };
}

function CardGrid({ cards }: { cards: RateCard[] }) {
  return (
    <div className="rate-card-grid">
      {cards.map((card) => (
        <div key={card.name} className="rate-card">
          <div className="rate-card-top">
            <span className="rate-card-tag">{card.tagLabel}</span>
            <h3 className="rate-card-name">{card.name}</h3>
            <p className="rate-card-desc">{card.description}</p>
          </div>
          <div className="rate-card-bottom">
            <div className="rate-card-price-row">
              <span className="rate-card-price">{card.price}</span>
              {card.priceNote && (
                <span className="rate-card-note">{card.priceNote}</span>
              )}
            </div>
            <ul className="rate-card-includes">
              {card.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Enquiry — ${card.name}`)}`}
              className="btn-primary-service"
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
    <div className="tier-grid">
      {packages.map((pkg) => (
        <div key={pkg.name} className={`tier-card${pkg.highlight ? " tier-card--highlight" : ""}`}>
          <div className="tier-card-top">
            <p className="tier-billing">{pkg.billingNote}</p>
            <h3 className="tier-name">{pkg.name}</h3>
            <p className="tier-price">
              <span className="tier-currency">{pkg.currency}</span>
              {pkg.price}
              {pkg.unit && <span className="tier-unit"> {pkg.unit}</span>}
            </p>
          </div>
          <ul className="tier-features">
            {pkg.features.map((f) => (
              <li key={f.label} className={f.included ? "tier-feat--yes" : "tier-feat--no"}>
                <span className="tier-feat-icon">{f.included ? "✓" : "–"}</span>
                {typeof f.included === "string" ? `${f.label}: ${f.included}` : f.label}
              </li>
            ))}
          </ul>
          <a
            href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Enquiry — ${pkg.name}`)}`}
            className="btn-primary-service"
          >
            {pkg.cta}
          </a>
          {pkg.ctaSecondary && (
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Monthly Plan — ${pkg.name}`)}`}
              className="tier-cta-secondary"
            >
              {pkg.ctaSecondary}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function PricingSection({ section }: { section: Section }) {
  if (section.kind === "cards") {
    return <CardGrid cards={section.cards} />;
  }
  if (section.kind === "tiers") {
    return <TierGrid packages={section.service.packages} />;
  }
  // mixed
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
            dangerouslySetInnerHTML={{ __html: content.headline.replace(/\*(.*?)\*/g, "<em>$1</em>") }}
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
            <h2>Simple process, serious results.</h2>
            <div className="how-it-works-steps">
              {content.howItWorks.map((step) => (
                <div key={step.step} className="how-step">
                  <p className="how-step-number">{step.step}</p>
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
            <h2>What you actually get.</h2>
            <div className="slug-benefits-grid">
              {content.benefits.map((benefit) => (
                <div key={benefit.title} className="slug-benefit">
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pricing */}
        <section className="slug-pricing" id="pricing">
          <p className="section-eyebrow">Pricing</p>
          <h2>Clear prices. No surprises.</h2>
          <PricingSection section={section} />
        </section>

        {/* FAQ */}
        {content.faqs.length > 0 && (
          <section className="slug-faq" id="faq">
            <p className="section-eyebrow">FAQ</p>
            <h2>Common questions.</h2>
            <div className="slug-faq-list">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="slug-faq-item">
                  <summary className="slug-faq-question">{faq.question}</summary>
                  <p className="slug-faq-answer">{faq.answer}</p>
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
            <h2>Explore more services.</h2>
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
