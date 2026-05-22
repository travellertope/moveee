import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getMarket, type TierPackage } from "../../../market-data";
import { PARTNERSHIP_CATEGORIES, getPartnershipCategory } from "../../../partnership-pages";
import MarketNav from "../../../components/MarketNav";

export function generateStaticParams() {
  return PARTNERSHIP_CATEGORIES.map((cat) => ({
    market: "africa",
    sub: cat.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; sub: string }>;
}): Promise<Metadata> {
  const { sub } = await params;
  const cat = getPartnershipCategory(sub);
  if (!cat) return { title: { absolute: "Media Partnership | The Moveee" } };
  return {
    title: { absolute: `${cat.label} — Media Partnership | The Moveee` },
    description: cat.page.tagline,
  };
}

function TierGrid({ packages }: { packages: TierPackage[] }) {
  return (
    <div className="rate-card-grid rate-card-grid--auto">
      {packages.map((pkg) => {
        const isHighlight = pkg.highlight ?? false;
        return (
          <div key={pkg.name} className={`rate-card${isHighlight ? " rate-card--highlight" : ""}`}>
            <div className="rate-card-header">
              <h3>{pkg.name}</h3>
              <span className="rate-billing">{pkg.billingNote}</span>
            </div>
            <div className="rate-card-price">
              <span className="price-currency">{pkg.currency}</span>
              <span className="price-amount">{pkg.price}</span>
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
                      {typeof f.included === "string"
                        ? `${f.label}: ${f.included}`
                        : f.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="rate-card-ctas">
              <a
                href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Partnership Enquiry — ${pkg.name}`)}`}
                className="btn-rate-primary"
              >
                {pkg.cta}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function PartnershipSubPage({
  params,
}: {
  params: Promise<{ market: string; sub: string }>;
}) {
  const { market, sub } = await params;

  if (market !== "africa") redirect("/services");

  const marketData = getMarket(market);
  if (!marketData) redirect("/services");

  const cat = getPartnershipCategory(sub);
  if (!cat) notFound();

  const content = cat.page;
  const otherCategories = PARTNERSHIP_CATEGORIES.filter((c) => c.id !== sub);

  const emailSubject = encodeURIComponent(
    `Partnership Enquiry — ${cat.label}`
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
          <Link href={`/services/${market}/partnership`}>Media Partnership</Link>
          <span className="slug-breadcrumb-sep">›</span>
          <span>{cat.label}</span>
        </nav>

        {/* Hero */}
        <section className="slug-hero">
          <p className="market-eyebrow">
            <span className="market-flag">{marketData.flag}</span> {marketData.name} · {cat.label}
          </p>
          <h1 className="slug-headline">{content.headline}</h1>
          <p className="slug-tagline">{content.tagline}</p>
          <div className="slug-intro">
            {content.intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="btn-primary-service">
            {content.ctaLabel ?? "Start a partnership →"}
          </a>
          {content.ctaSubtext && (
            <p className="slug-cta-subtext">{content.ctaSubtext}</p>
          )}
        </section>

        {/* How it works */}
        <section className="slug-how-it-works" id="how-it-works">
          <p className="section-eyebrow">How it works</p>
          <h2 className="slug-section-title">From brief to published coverage.</h2>
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

        {/* Benefits */}
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

        {/* Pricing */}
        <section className="slug-pricing" id="pricing">
          <p className="section-eyebrow">Pricing</p>
          <h2 className="slug-section-title">Three-month packages.</h2>
          <TierGrid packages={cat.service.packages} />

          {cat.service.addOns && cat.service.addOns.length > 0 && (
            <div className="tier-addons">
              <p className="tier-addons-label">Add-ons</p>
              <div className="addons-grid">
                {cat.service.addOns.map((addon) => (
                  <div key={addon.description} className="addon-card">
                    <span className="addon-icon">{addon.icon}</span>
                    <span className="addon-price">{addon.price}</span>
                    <p className="addon-desc">{addon.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* FAQ */}
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

        {/* Bottom CTA */}
        <section className="slug-bottom-cta">
          <p className="section-eyebrow">Ready to start?</p>
          <h2>Let's build your media presence.</h2>
          <p>
            Tell us about your organisation, your upcoming programme, and what three months of coverage could look like.
          </p>
          <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="btn-primary-service">
            {content.ctaLabel ?? "Start a partnership →"}
          </a>
        </section>

        {/* Other categories */}
        <section className="slug-other-services">
          <p className="section-eyebrow">Other Partnership categories</p>
          <h2 className="slug-section-title">Also in this programme.</h2>
          <div className="slug-other-grid">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                href={`/services/${market}/partnership/${c.id}`}
                className="slug-other-card"
              >
                <span className="slug-other-name">{c.label}</span>
                <span className="slug-other-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
